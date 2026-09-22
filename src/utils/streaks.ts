// ============================================================
// Streakosaurus — Streak Calculator
// ============================================================

import { getCompletionsForHabit } from '../db/queries';
import { today, subtractDays, getDaysInRange, isHabitScheduledForDay, isBefore, addDays } from './dates';
import type { Habit, HabitCompletion } from '../types';

export interface StreakInfo {
  current: number;
  best: number;
  total_completions: number;
  total_missed: number;
  completion_rate: number;
}

/**
 * Calculate streak info for a habit by scanning its completions.
 */
export async function calculateStreak(
  habit: Habit,
  lookbackDays: number = 365
): Promise<StreakInfo> {
  const end = today();
  const start = subtractDays(end, lookbackDays);
  const completions = await getCompletionsForHabit(habit.id, start, end);

  const completedDates = new Set(completions.map((c) => c.date));
  const scheduledDays = getDaysInRange(start, end).filter((d) =>
    isHabitScheduledForDay(habit.frequency, habit.specific_days, d)
  );

  // Current streak: count back from today (or yesterday if today hasn't been completed yet)
  let currentStreak = 0;
  let checkDate = end;
  
  // If today is scheduled but not completed, start checking from yesterday
  if (isHabitScheduledForDay(habit.frequency, habit.specific_days, end) && !completedDates.has(end)) {
    checkDate = subtractDays(end, 1);
  }
  
  // If today is not scheduled, check backwards from the most recent scheduled day
  if (!isHabitScheduledForDay(habit.frequency, habit.specific_days, end)) {
    checkDate = subtractDays(end, 1);
    // Walk back to find the most recent scheduled day
    for (let i = 0; i < 14; i++) {
      if (isHabitScheduledForDay(habit.frequency, habit.specific_days, checkDate)) break;
      checkDate = subtractDays(checkDate, 1);
    }
  }

  // Walk backwards from checkDate
  let date = checkDate;
  while (!isBefore(date, habit.start_date)) {
    if (isHabitScheduledForDay(habit.frequency, habit.specific_days, date)) {
      if (completedDates.has(date)) {
        currentStreak++;
      } else {
        break;
      }
    }
    date = subtractDays(date, 1);
  }

  // Best streak: scan all scheduled days
  let bestStreak = 0;
  let tempStreak = 0;
  for (const d of scheduledDays) {
    if (d < habit.start_date) continue;
    if (habit.end_date && d > habit.end_date) break;

    if (completedDates.has(d)) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Stats
  const relevantScheduled = scheduledDays.filter(
    (d) => d >= habit.start_date && (!habit.end_date || d <= habit.end_date)
  );
  const totalCompletions = completions.filter((c) => c.completed).length;
  const totalMissed = Math.max(0, relevantScheduled.length - totalCompletions);
  const completionRate =
    relevantScheduled.length > 0
      ? Math.round((totalCompletions / relevantScheduled.length) * 100)
      : 0;

  return {
    current: currentStreak,
    best: bestStreak,
    total_completions: totalCompletions,
    total_missed: totalMissed,
    completion_rate: completionRate,
  };
}

/**
 * Quick streak calculation from raw completion data (no DB calls).
 */
export function calculateStreakFromCompletions(
  habit: Habit,
  completions: HabitCompletion[]
): StreakInfo {
  const completedDates = new Set(completions.map((c) => c.date));
  const end = today();
  const start = subtractDays(end, 365);
  const scheduledDays = getDaysInRange(start, end).filter((d) =>
    isHabitScheduledForDay(habit.frequency, habit.specific_days, d)
  );

  let currentStreak = 0;
  let date = end;
  if (isHabitScheduledForDay(habit.frequency, habit.specific_days, end) && !completedDates.has(end)) {
    date = subtractDays(end, 1);
  }
  if (!isHabitScheduledForDay(habit.frequency, habit.specific_days, end)) {
    date = subtractDays(end, 1);
    for (let i = 0; i < 14; i++) {
      if (isHabitScheduledForDay(habit.frequency, habit.specific_days, date)) break;
      date = subtractDays(date, 1);
    }
  }

  while (!isBefore(date, habit.start_date)) {
    if (isHabitScheduledForDay(habit.frequency, habit.specific_days, date)) {
      if (completedDates.has(date)) {
        currentStreak++;
      } else {
        break;
      }
    }
    date = subtractDays(date, 1);
  }

  let bestStreak = 0;
  let tempStreak = 0;
  for (const d of scheduledDays) {
    if (d < habit.start_date) continue;
    if (habit.end_date && d > habit.end_date) break;
    if (completedDates.has(d)) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const relevantScheduled = scheduledDays.filter(
    (d) => d >= habit.start_date && (!habit.end_date || d <= habit.end_date)
  );
  const totalCompletions = completions.filter((c) => c.completed).length;
  const totalMissed = Math.max(0, relevantScheduled.length - totalCompletions);
  const completionRate =
    relevantScheduled.length > 0
      ? Math.round((totalCompletions / relevantScheduled.length) * 100)
      : 0;

  return {
    current: currentStreak,
    best: bestStreak,
    total_completions: totalCompletions,
    total_missed: totalMissed,
    completion_rate: completionRate,
  };
}

/**
 * Get the overall longest streak across all habits.
 */
export async function getOverallStreak(
  habits: Habit[]
): Promise<{ current: number; longest: number }> {
  let maxCurrent = 0;
  let maxLongest = 0;

  for (const habit of habits) {
    if (habit.archived) continue;
    const info = await calculateStreak(habit);
    maxCurrent = Math.max(maxCurrent, info.current);
    maxLongest = Math.max(maxLongest, info.best);
  }

  return { current: maxCurrent, longest: maxLongest };
}
