// ============================================================
// Streakosaurus — Achievement Checker & Evolution Engine
// ============================================================

import type { Achievement, Habit, DinoRarity, EvolutionStage } from '../types';
import {
  getAllAchievements,
  getUserAchievements,
  earnAchievement,
  getAllHabits,
  getCompletionsForHabit,
  getCompletedProjectTasksCount,
  getTotalIdeasCount,
  getDistinctHabitCompletionDaysCount,
  getCompletedFocusAndPomoCount,
  getLateNightFocusCount,
  getEarlyWakeUpCount,
  getHabitCompletionsByKeywords,
} from '../db/queries';
import { calculateStreak } from './streaks';
import {
  today,
  subtractDays,
  getDaysInRange,
  isHabitScheduledForDay,
} from './dates';
import {
  DINO_REGISTRY_MAP,
  getEvolutionStage,
  type DinoAchievementDef,
} from './dinosaurRegistry';

export interface AchievementWithProgress extends Achievement {
  earned: boolean;
  earned_at?: string;
  current_progress: number;
  progress_percentage: number;
  orderNumber: string;
  dinosaur: string;
  speciesGroup: DinoAchievementDef['speciesGroup'];
  speciesVariant: string;
  evolution_stage: EvolutionStage;
  is_discovered: boolean;
  rarity: DinoRarity;
}

/**
 * Check all 25 achievements and award any newly earned ones.
 * Returns the full list of achievements with real progress, dinosaur data, and evolution stage.
 */
export async function checkAndAwardAchievements(): Promise<AchievementWithProgress[]> {
  const achievements = await getAllAchievements();
  const userAchievements = await getUserAchievements();
  const earnedMap = new Map(
    userAchievements.map((ua) => [ua.achievement_id, ua])
  );

  const habits = await getAllHabits();
  const activeHabits = habits.filter((h) => !h.archived);

  // Compute base habit stats
  let maxStreak = 0;
  let totalCompletions = 0;

  for (const habit of activeHabits) {
    const streak = await calculateStreak(habit);
    maxStreak = Math.max(maxStreak, streak.best);
    totalCompletions += streak.total_completions;
  }

  // Pre-fetch metrics concurrently
  const [
    perfectDaysRun,
    overallRate,
    projectTasksDone,
    ideasCount,
    distinctDaysCount,
    focusAndPomoCount,
    lateNightFocusCount,
    earlyWakeUpsCount,
    waterCount,
    exerciseCount,
    meditationCount,
  ] = await Promise.all([
    getPerfectDayRun(activeHabits),
    getOverallRate(activeHabits),
    getCompletedProjectTasksCount(),
    getTotalIdeasCount(),
    getDistinctHabitCompletionDaysCount(),
    getCompletedFocusAndPomoCount(),
    getLateNightFocusCount(),
    getEarlyWakeUpCount(),
    getHabitCompletionsByKeywords(['water', 'hydrat']),
    getHabitCompletionsByKeywords(['exercise', 'workout', 'run', 'gym', 'walk', 'fitness', 'cardio', 'lift']),
    getHabitCompletionsByKeywords(['meditat', 'mindful', 'breath', 'zen', 'calm', 'journal']),
  ]);

  // Initial calculation pass for individual achievements
  const rawList: Array<{
    ach: Achievement;
    def: DinoAchievementDef;
    currentProgress: number;
    shouldEarn: boolean;
    userAch: (typeof userAchievements)[0] | undefined;
  }> = [];

  let initialEarnedCount = 0;

  for (const achievement of achievements) {
    const def = DINO_REGISTRY_MAP.get(achievement.id) || {
      id: achievement.id,
      orderNumber: '99',
      name: achievement.name,
      requirementDescription: achievement.description,
      rarity: (achievement.rarity as DinoRarity) || 'COMMON',
      dinosaur: achievement.dinosaur || 'Companion',
      speciesGroup: 'trex' as const,
      speciesVariant: 'classic',
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      category: achievement.category,
      icon: achievement.icon,
    };

    const userAch = earnedMap.get(achievement.id);
    let currentProgress = 0;
    let shouldEarn = false;

    switch (def.requirement_type) {
      case 'streak':
        currentProgress = maxStreak;
        shouldEarn = maxStreak >= def.requirement_value;
        break;

      case 'total_completions':
        currentProgress = totalCompletions;
        shouldEarn = totalCompletions >= def.requirement_value;
        break;

      case 'perfect_week':
        currentProgress = perfectDaysRun;
        shouldEarn = perfectDaysRun >= def.requirement_value;
        break;

      case 'consistency':
        currentProgress = overallRate;
        shouldEarn = overallRate >= def.requirement_value;
        break;

      case 'early_wake_ups':
        currentProgress = earlyWakeUpsCount;
        shouldEarn = earlyWakeUpsCount >= def.requirement_value;
        break;

      case 'streak_growth': {
        // Grew streak significantly or reached at least 5
        const growthAchieved = maxStreak >= 5 || (userAch?.progress ?? 0) >= 1;
        currentProgress = growthAchieved ? 1 : Math.min(1, maxStreak / 5);
        shouldEarn = growthAchieved;
        break;
      }

      case 'focus_sessions':
        currentProgress = focusAndPomoCount;
        shouldEarn = focusAndPomoCount >= def.requirement_value;
        break;

      case 'project_tasks':
        currentProgress = projectTasksDone;
        shouldEarn = projectTasksDone >= def.requirement_value;
        break;

      case 'ideas':
        currentProgress = ideasCount;
        shouldEarn = ideasCount >= def.requirement_value;
        break;

      case 'distinct_days':
        currentProgress = distinctDaysCount;
        shouldEarn = distinctDaysCount >= def.requirement_value;
        break;

      case 'reports_viewed':
        currentProgress = userAch?.progress || 0;
        shouldEarn = currentProgress >= def.requirement_value;
        break;

      case 'expedition':
        currentProgress = userAch?.progress || 0;
        shouldEarn = currentProgress >= def.requirement_value;
        break;

      case 'balance_rate': {
        const metRate = overallRate >= 70;
        currentProgress = metRate ? 14 : Math.round((overallRate / 70) * 14);
        shouldEarn = currentProgress >= def.requirement_value;
        break;
      }

      case 'night_focus':
        currentProgress = lateNightFocusCount;
        shouldEarn = lateNightFocusCount >= def.requirement_value;
        break;

      case 'habit_water':
        currentProgress = waterCount;
        shouldEarn = waterCount >= def.requirement_value;
        break;

      case 'habit_exercise':
        currentProgress = exerciseCount;
        shouldEarn = exerciseCount >= def.requirement_value;
        break;

      case 'habit_meditation':
        currentProgress = meditationCount;
        shouldEarn = meditationCount >= def.requirement_value;
        break;

      case 'unlock_count_10':
      case 'all_achievements':
        // Evaluated in second pass
        currentProgress = 0;
        shouldEarn = false;
        break;

      default:
        currentProgress = userAch?.progress || 0;
        shouldEarn = currentProgress >= def.requirement_value;
        break;
    }

    if (shouldEarn || userAch) {
      initialEarnedCount++;
    }

    rawList.push({
      ach: achievement,
      def,
      currentProgress,
      shouldEarn,
      userAch,
    });
  }

  // Second pass: evaluate meta-achievements (DNA Researcher & Legendary)
  const result: AchievementWithProgress[] = [];

  for (const item of rawList) {
    const { ach, def, userAch } = item;
    let { currentProgress, shouldEarn } = item;

    if (def.requirement_type === 'unlock_count_10') {
      currentProgress = initialEarnedCount;
      shouldEarn = initialEarnedCount >= def.requirement_value;
    } else if (def.requirement_type === 'all_achievements') {
      currentProgress = Math.min(def.requirement_value, initialEarnedCount);
      shouldEarn = initialEarnedCount >= def.requirement_value;
    }

    const isEarned = shouldEarn || !!userAch;

    // Award if earned and not yet recorded
    if (shouldEarn && !userAch) {
      await earnAchievement(ach.id, 100);
    }

    let progressPct = isEarned
      ? 100
      : Math.min(
          99,
          Math.max(
            0,
            Math.round((currentProgress / def.requirement_value) * 100)
          )
        );

    // If 100%, marked as earned
    if (progressPct >= 100) {
      progressPct = 100;
    }

    const evolution_stage = getEvolutionStage(progressPct);
    const is_discovered = progressPct > 0 || isEarned;

    result.push({
      ...ach,
      name: def.name,
      description: def.requirementDescription,
      icon: def.icon,
      dinosaur: def.dinosaur,
      rarity: def.rarity,
      orderNumber: def.orderNumber,
      speciesGroup: def.speciesGroup,
      speciesVariant: def.speciesVariant,
      earned: isEarned,
      earned_at: userAch?.earned_at,
      current_progress: isEarned ? def.requirement_value : currentProgress,
      progress_percentage: progressPct,
      evolution_stage,
      is_discovered,
    });
  }

  // Ensure returned in strict 01 - 25 order
  result.sort((a, b) => parseInt(a.orderNumber, 10) - parseInt(b.orderNumber, 10));

  return result;
}

/**
 * Longest run of consecutive days (within the last year) where every
 * scheduled active habit was completed. Days with no scheduled habits
 * don't break the run.
 */
async function getPerfectDayRun(habits: Habit[]): Promise<number> {
  if (habits.length === 0) return 0;
  const end = today();
  const start = subtractDays(end, 365);

  const perHabit = new Map<string, Set<string>>();
  for (const h of habits) {
    const comps = await getCompletionsForHabit(h.id, start, end);
    perHabit.set(h.id, new Set(comps.filter((c) => c.completed).map((c) => c.date)));
  }

  let best = 0;
  let current = 0;
  for (const d of getDaysInRange(start, end)) {
    const scheduled = habits.filter(
      (h) =>
        d >= h.start_date &&
        (!h.end_date || d <= h.end_date) &&
        isHabitScheduledForDay(h.frequency, h.specific_days, d)
    );
    if (scheduled.length === 0) continue;
    const allDone = scheduled.every((h) => perHabit.get(h.id)?.has(d));
    current = allDone ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/**
 * Overall completion rate (%) over the last 30 days.
 */
async function getOverallRate(habits: Habit[]): Promise<number> {
  if (habits.length === 0) return 0;
  const end = today();
  const start = subtractDays(end, 30);
  const days = getDaysInRange(start, end);

  let scheduled = 0;
  let done = 0;
  for (const h of habits) {
    const habitStart = h.start_date > start ? h.start_date : start;
    const habitEnd = h.end_date && h.end_date < end ? h.end_date : end;
    if (habitStart > habitEnd) continue;
    scheduled += days.filter(
      (d) => d >= habitStart && d <= habitEnd && isHabitScheduledForDay(h.frequency, h.specific_days, d)
    ).length;
    const comps = await getCompletionsForHabit(h.id, start, end);
    done += comps.filter((c) => c.completed).length;
  }

  if (scheduled === 0) return 0;
  return Math.round((done / scheduled) * 100);
}

/**
 * Get achievement summary counts.
 */
export async function getAchievementSummary(): Promise<{
  total: number;
  earned: number;
  percentage: number;
}> {
  const all = await checkAndAwardAchievements();
  const earned = all.filter((a) => a.earned).length;
  return {
    total: all.length,
    earned,
    percentage: all.length > 0 ? Math.round((earned / all.length) * 100) : 0,
  };
}
