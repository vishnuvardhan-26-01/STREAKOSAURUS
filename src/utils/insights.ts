// ============================================================
// Streakosaurus — Smart Insights Engine
// ============================================================

import type { Habit, HabitCompletion } from '../types';
import { getCompletionsRange } from '../db/queries';
import { today, subtractDays, addDays, getDayName, getDaysInRange, isHabitScheduledForDay, parseDate } from './dates';

export interface Insight {
  id: string;
  type: 'pattern' | 'trend' | 'achievement' | 'warning' | 'recommendation';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  data?: Record<string, unknown>;
}

/**
 * Generate insights based on real stored data.
 */
export async function generateInsights(
  habits: Habit[]
): Promise<Insight[]> {
  const insights: Insight[] = [];
  const end = today();
  const start30 = subtractDays(end, 30);
  const start7 = subtractDays(end, 7);
  const allCompletions = await getCompletionsRange(start30, end);

  if (allCompletions.length < 5) {
    insights.push({
      id: 'no_data',
      type: 'recommendation',
      title: 'Getting Started',
      message: "Not enough data yet. Give me another week and I'll have something interesting to say.",
      priority: 'low',
      icon: '📊',
    });
    return insights;
  }

  for (const habit of habits) {
    if (habit.archived) continue;

    const habitCompletions = allCompletions.filter(
      (c) => c.habit_id === habit.id && c.completed
    );
    const scheduledDays = getDaysInRange(start30, end).filter((d) =>
      isHabitScheduledForDay(habit.frequency, habit.specific_days, d)
    );

    if (scheduledDays.length < 3) continue;

    const completionRate = Math.round(
      (habitCompletions.length / scheduledDays.length) * 100
    );

    // Pattern: Day of week analysis
    const dayRates: Record<number, { completed: number; total: number }> = {};
    for (let i = 0; i < 7; i++) dayRates[i] = { completed: 0, total: 0 };

    for (const d of scheduledDays) {
      const dow = parseDate(d).getDay();
      dayRates[dow].total++;
      if (habitCompletions.some((c) => c.date === d)) {
        dayRates[dow].completed++;
      }
    }

    let bestDayRate = 0;
    let bestDay = 0;
    let worstDayRate = 100;
    let worstDay = 0;

    for (const [dow, data] of Object.entries(dayRates)) {
      if (data.total < 2) continue;
      const rate = Math.round((data.completed / data.total) * 100);
      if (rate > bestDayRate) {
        bestDayRate = rate;
        bestDay = Number(dow);
      }
      if (rate < worstDayRate) {
        worstDayRate = rate;
        worstDay = Number(dow);
      }
    }

    if (bestDayRate - worstDayRate > 30 && bestDayRate > 70) {
      const bestDayName = getDayName(addDays('2024-01-01', bestDay));
      insights.push({
        id: `pattern_day_${habit.id}`,
        type: 'pattern',
        title: `${habit.name} Day Pattern`,
        message: `You complete ${habit.name} ${bestDayRate}% more often on ${bestDayName}s.`,
        priority: 'medium',
        icon: '📊',
      });
    }

    // Trend: Compare last 7 days vs previous 7 days
    const recent7 = habitCompletions.filter((c) => c.date >= start7).length;
    const prev7Start = subtractDays(start7, 7);
    const prev7End = subtractDays(start7, 1);
    const recentScheduled = getDaysInRange(start7, end).filter((d) =>
      isHabitScheduledForDay(habit.frequency, habit.specific_days, d)
    ).length;
    const prevScheduled = getDaysInRange(prev7Start, prev7End).filter((d) =>
      isHabitScheduledForDay(habit.frequency, habit.specific_days, d)
    ).length;

    if (recentScheduled > 0 && prevScheduled > 0) {
      const recentRate = Math.round((recent7 / recentScheduled) * 100);
      const prevRate = Math.round(
        (habitCompletions.filter((c) => c.date >= prev7Start && c.date <= prev7End).length /
          prevScheduled) *
          100
      );
      const change = recentRate - prevRate;

      if (Math.abs(change) > 15) {
        if (change > 0) {
          insights.push({
            id: `trend_up_${habit.id}`,
            type: 'trend',
            title: `${habit.name} Improving`,
            message: `Your completion rate for ${habit.name} improved from ${prevRate}% to ${recentRate}%.`,
            priority: 'medium',
            icon: '📈',
          });
        } else {
          insights.push({
            id: `trend_down_${habit.id}`,
            type: 'warning',
            title: `${habit.name} Needs Attention`,
            message: `Your ${habit.name} completion dropped from ${prevRate}% to ${recentRate}%.`,
            priority: 'high',
            icon: '📉',
          });
        }
      }
    }
  }

  // Overall consistency insight
  const totalScheduled = habits
    .filter((h) => !h.archived)
    .reduce((sum, h) => {
      return (
        sum +
        getDaysInRange(start30, end).filter((d) =>
          isHabitScheduledForDay(h.frequency, h.specific_days, d)
        ).length
      );
    }, 0);

  if (totalScheduled > 0) {
    const totalDone = allCompletions.filter((c) => c.completed).length;
    const overallRate = Math.round((totalDone / totalScheduled) * 100);

    if (overallRate > 85) {
      insights.push({
        id: 'overall_excellent',
        type: 'achievement',
        title: 'Excellent Consistency',
        message: `Your overall completion rate is ${overallRate}%. That's genuinely impressive.`,
        priority: 'medium',
        icon: '🌟',
      });
    } else if (overallRate < 40) {
      insights.push({
        id: 'overall_low',
        type: 'recommendation',
        title: 'Room for Growth',
        message: `Your overall completion is ${overallRate}%. Consider reducing the number of active habits to focus on the essentials.`,
        priority: 'high',
        icon: '💡',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights.slice(0, 8);
}
