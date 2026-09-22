// ============================================================
// Streakosaurus — Report Engine
// ============================================================
//
// Reports interpret the same record the Calendar shows, but across a whole
// week or month. Everything here reads the real database; nothing is seeded
// or estimated.
//
// Three rules keep the numbers honest:
//
//   1. ONLY ELAPSED DAYS COUNT. A day that has not happened yet is never
//      "scheduled but missed". The period is clipped to today.
//   2. A HABIT ONLY EXISTS FROM ITS OWN START DATE. A habit created on the
//      10th is not charged with missing the 1st, and one that was given an
//      end date stops being scheduled after it.
//   3. COMPLETIONS ARE INTERSECTED WITH THE HABITS DUE THAT DAY. Ticking a
//      habit off on a day it was not scheduled is not counted, and archived
//      habits are excluded — exactly as on Home, Habits and Calendar.
//
// The week respects the app's `week_start` setting, and every date is built
// from local Y/M/D parts (never `new Date('YYYY-MM-DD')`, which parses as UTC).

import type { AppSettings, Habit, HabitCompletion } from '../types';
import { getAllHabits, getCompletionsRange, getSettings } from '../db/queries';
import {
  addDays,
  formatDate,
  getDayName,
  getDayOfWeek,
  getDaysInRange,
  getMonthEnd,
  getMonthStart,
  getWeekEnd,
  getWeekStart,
  isAfter,
  isHabitScheduledForDay,
  parseDate,
  subtractDays,
  today,
} from './dates';
import { generateRoast } from './roastEngine';

// ============================================================
// Types
// ============================================================

export type PeriodKind = 'weekly' | 'monthly';

/** Colour band for a single day. Mirrors the Calendar's language. */
export type DayBand = 'complete' | 'partial' | 'missed' | 'none' | 'future';

export interface ReportDay {
  date: string;
  dayOfWeek: number; // 0 = Sunday
  /**
   * Habits due that day. For a day that hasn't happened yet this is what *will*
   * be due — such days never reach the aggregates, which walk elapsed days only.
   */
  scheduled: number;
  completed: number;
  pct: number;
  band: DayBand;
  isToday: boolean;
  isFuture: boolean;
}

export interface ReportHabit {
  id: string;
  name: string;
  icon: string;
  category: string;
  scheduled: number;
  completed: number;
  rate: number;
  /** Longest run of consecutive completed occurrences inside the period. */
  bestRun: number;
  /** Rate change against the previous period; null when it isn't comparable. */
  trend: number | null;
}

export interface PeriodReport {
  kind: PeriodKind;
  /** First day of the period (never clipped). */
  periodStart: string;
  /** Last day of the period (never clipped). */
  periodEnd: string;
  /** First *elapsed* day of the period. */
  start: string;
  /** Last elapsed day — clipped to today. */
  end: string;
  totalDays: number;
  elapsedDays: number;
  isCurrent: boolean;
  /** The whole period is still ahead. */
  isFuture: boolean;
  /** At least one day in the period had something scheduled. */
  hasRecord: boolean;

  title: string;
  eyebrow: string;

  /** Elapsed days only — every figure on the page is computed from these. */
  days: ReportDay[];
  /** The whole period, with days that haven't happened yet banded `future`. */
  periodDays: ReportDay[];

  scheduled: number;
  completed: number;
  missed: number;
  rate: number;

  perfectDays: number;
  partialDays: number;
  missedDays: number;
  noneDays: number;
  loggedDays: number;

  /** Longest run of consecutive perfect days inside the period. */
  bestRun: number;
  bestDay: ReportDay | null;
  worstDay: ReportDay | null;

  habits: ReportHabit[];

  prevStart: string;
  prevEnd: string;
  prevRate: number | null;
  prevCompleted: number;
  prevDays: number;
  change: number | null;

  fieldNote: string;
  generatedAt: string;
}

export interface WindowAgg {
  days: ReportDay[];
  periodDays: ReportDay[];
  /** Keyed by date, for assembling the full-period timeline. */
  dayByDate: Map<string, ReportDay>;
  scheduled: number;
  completed: number;
  rate: number;
  perfectDays: number;
  partialDays: number;
  missedDays: number;
  noneDays: number;
  loggedDays: number;
  bestRun: number;
  habitAgg: Map<string, { scheduled: number; completed: number; bestRun: number }>;
}

// ============================================================
// Period bounds
// ============================================================

export function periodBounds(
  kind: PeriodKind,
  basis: string,
  weekStart: 'monday' | 'sunday'
): { start: string; end: string } {
  if (kind === 'weekly') {
    return {
      start: getWeekStart(basis, weekStart),
      end: getWeekEnd(basis, weekStart),
    };
  }
  return { start: getMonthStart(basis), end: getMonthEnd(basis) };
}

/** The basis (period start) of the period that contains `date`. */
export function basisFor(
  kind: PeriodKind,
  date: string,
  weekStart: 'monday' | 'sunday'
): string {
  return periodBounds(kind, date, weekStart).start;
}

/** Move a period forward/backward, always landing on a period boundary. */
export function shiftPeriod(
  kind: PeriodKind,
  basis: string,
  delta: number,
  _weekStart: 'monday' | 'sunday'
): string {
  if (kind === 'weekly') return addDays(basis, delta * 7);
  const d = parseDate(basis);
  return formatDate(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

function previousBounds(
  kind: PeriodKind,
  periodStart: string
): { start: string; end: string } {
  if (kind === 'weekly') {
    return { start: subtractDays(periodStart, 7), end: subtractDays(periodStart, 1) };
  }
  const d = parseDate(periodStart);
  return {
    start: formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
    end: formatDate(new Date(d.getFullYear(), d.getMonth(), 0)),
  };
}

function weekTitle(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const sm = s.toLocaleDateString('en-US', { month: 'long' });
  const em = e.toLocaleDateString('en-US', { month: 'long' });

  if (sameMonth) return `Week of ${s.getDate()}–${e.getDate()} ${sm}`;
  if (sameYear) return `Week of ${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
  return `Week of ${s.getDate()} ${sm} ${s.getFullYear()} – ${e.getDate()} ${em} ${e.getFullYear()}`;
}

function monthTitle(start: string): string {
  return parseDate(start).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

// ============================================================
// The one place that turns raw rows into period aggregates
// ============================================================

/**
 * Aggregate a date window. Used for the selected period *and* the previous one,
 * so both are computed by identical logic — and with a single DB read each,
 * instead of one query per habit.
 */
async function readWindow(
  habits: Habit[],
  periodStart: string,
  periodEnd: string,
  todayStr: string
): Promise<WindowAgg> {
  const isFuture = isAfter(periodStart, todayStr);
  // Rule 1: never look past today.
  const end = isAfter(periodEnd, todayStr) ? todayStr : periodEnd;
  const dates = isFuture ? [] : getDaysInRange(periodStart, end);

  const completions: HabitCompletion[] = dates.length
    ? await getCompletionsRange(periodStart, end)
    : [];
  const done = new Set(
    completions.filter((c) => c.completed).map((c) => `${c.habit_id}|${c.date}`)
  );

  // Rule 2: only habits that existed on that day, and only on days they run.
  const dueOn = (date: string): Habit[] =>
    habits.filter(
      (h) =>
        isHabitScheduledForDay(h.frequency, h.specific_days, date) &&
        (!h.start_date || h.start_date <= date) &&
        (!h.end_date || date <= h.end_date)
    );

  const habitAgg = new Map<
    string,
    { scheduled: number; completed: number; bestRun: number }
  >();
  for (const h of habits) {
    habitAgg.set(h.id, { scheduled: 0, completed: 0, bestRun: 0 });
  }
  const habitRun = new Map<string, number>();

  const days: ReportDay[] = [];
  const dayByDate = new Map<string, ReportDay>();
  let scheduled = 0;
  let completed = 0;
  let perfectDays = 0;
  let partialDays = 0;
  let missedDays = 0;
  let noneDays = 0;
  let loggedDays = 0;
  let dayRun = 0;
  let bestRun = 0;

  for (const date of dates) {
    const due = dueOn(date);
    let doneCount = 0;

    for (const h of due) {
      const agg = habitAgg.get(h.id);
      if (!agg) continue;
      agg.scheduled++;
      if (done.has(`${h.id}|${date}`)) {
        // Rule 3: only counts if the habit was actually due.
        agg.completed++;
        doneCount++;
        const run = (habitRun.get(h.id) ?? 0) + 1;
        habitRun.set(h.id, run);
        agg.bestRun = Math.max(agg.bestRun, run);
      } else {
        habitRun.set(h.id, 0);
      }
    }

    scheduled += due.length;
    completed += doneCount;

    const pct = due.length > 0 ? Math.round((doneCount / due.length) * 100) : 0;
    const band: DayBand =
      due.length === 0
        ? 'none'
        : doneCount >= due.length
          ? 'complete'
          : doneCount > 0
            ? 'partial'
            : 'missed';

    if (band === 'complete') {
      perfectDays++;
      dayRun++;
      bestRun = Math.max(bestRun, dayRun);
    } else if (band === 'partial') {
      partialDays++;
      dayRun = 0;
    } else if (band === 'missed') {
      missedDays++;
      dayRun = 0;
    } else {
      // A day with nothing scheduled doesn't break a run, and doesn't join one.
      noneDays++;
    }
    if (band !== 'none') loggedDays++;

    const day: ReportDay = {
      date,
      dayOfWeek: getDayOfWeek(date),
      scheduled: due.length,
      completed: doneCount,
      pct,
      band,
      isToday: date === todayStr,
      isFuture: false,
    };
    days.push(day);
    dayByDate.set(date, day);
  }

  // The timeline for the chart: every day of the period, so a week or month
  // keeps its shape instead of ending at today.
  const periodDays: ReportDay[] = getDaysInRange(
    periodStart,
    isAfter(periodEnd, todayStr) ? todayStr : periodEnd
  )
    .map((date) => dayByDate.get(date))
    .filter((d): d is ReportDay => !!d);
  if (!isFuture) {
    for (const date of getDaysInRange(addDays(end, 1), periodEnd)) {
      periodDays.push({
        date,
        dayOfWeek: getDayOfWeek(date),
        scheduled: dueOn(date).length,
        completed: 0,
        pct: 0,
        band: 'future',
        isToday: false,
        isFuture: true,
      });
    }
  }

  return {
    days,
    dayByDate,
    periodDays,
    scheduled,
    completed,
    rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    perfectDays,
    partialDays,
    missedDays,
    noneDays,
    loggedDays,
    bestRun,
    habitAgg,
  };
}

// ============================================================
// Field note (dinosaur personality, driven by the data)
// ============================================================

function buildFieldNote(
  level: AppSettings['roast_level'],
  report: {
    scheduled: number;
    rate: number;
    change: number | null;
    habits: ReportHabit[];
  },
  seed: string
): string {
  const ctx = { habit_name: 'your habits', metric: 'neutral', value: report.rate };
  const worst = report.habits.find((h) => h.scheduled > 0 && h.rate < 50);
  const strong = report.habits.length > 0 ? report.habits[0] : null;

  // Nothing was scheduled: never invent a judgement about an empty period.
  if (report.scheduled === 0) {
    return generateRoast(level, { ...ctx, metric: 'no_data' }, `${seed}:no_data`);
  }
  if (report.rate === 100) {
    return generateRoast(level, { ...ctx, metric: 'perfect_week' }, `${seed}:perfect`);
  }
  if (report.change !== null && report.change > 5) {
    return generateRoast(
      level,
      { ...ctx, metric: 'improvement', change: report.change },
      `${seed}:up`
    );
  }
  if (report.change !== null && report.change < -5) {
    return generateRoast(
      level,
      { ...ctx, metric: 'decline', change: report.change },
      `${seed}:down`
    );
  }
  if (worst) {
    return generateRoast(
      level,
      {
        ...ctx,
        habit_name: worst.name,
        value: worst.rate,
        count: worst.completed,
        total: worst.scheduled,
      },
      `${seed}:worst:${worst.id}`
    );
  }
  if (strong) {
    return generateRoast(
      level,
      { ...ctx, habit_name: strong.name, value: strong.rate },
      `${seed}:strong:${strong.id}`
    );
  }
  return generateRoast(level, ctx, `${seed}:neutral`);
}

// ============================================================
// Public API
// ============================================================

/**
 * Build the full report for one week or month.
 *
 * @param kind      weekly | monthly
 * @param basis     any date inside the target period
 * @param settings  app settings — `week_start` and `roast_level` are respected
 * @param habits    optional pre-loaded habit list (the page already has one)
 */
export async function buildPeriodReport(
  kind: PeriodKind,
  basis: string,
  settings: AppSettings,
  habits?: Habit[]
): Promise<PeriodReport> {
  const todayStr = today();
  const weekStart = settings.week_start;
  const { start: periodStart, end: periodEnd } = periodBounds(kind, basis, weekStart);

  const all = habits ?? (await getAllHabits());
  const active = all.filter((h) => !h.archived);

  const current = await readWindow(active, periodStart, periodEnd, todayStr);
  const prev = previousBounds(kind, periodStart);
  const previous = await readWindow(active, prev.start, prev.end, todayStr);

  const prevRate = previous.scheduled > 0 ? previous.rate : null;
  const change = prevRate === null ? null : current.rate - prevRate;

  const habitStats: ReportHabit[] = active.map((h) => {
    const agg = current.habitAgg.get(h.id) ?? {
      scheduled: 0,
      completed: 0,
      bestRun: 0,
    };
    const prevAgg = previous.habitAgg.get(h.id) ?? {
      scheduled: 0,
      completed: 0,
      bestRun: 0,
    };
    const rate = agg.scheduled > 0 ? Math.round((agg.completed / agg.scheduled) * 100) : 0;
    const prevHabitRate =
      prevAgg.scheduled > 0
        ? Math.round((prevAgg.completed / prevAgg.scheduled) * 100)
        : null;
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      category: h.category,
      scheduled: agg.scheduled,
      completed: agg.completed,
      rate,
      bestRun: agg.bestRun,
      trend: prevHabitRate === null ? null : rate - prevHabitRate,
    };
  });

  // Only habits that were actually scheduled can be ranked.
  const ranked = [...habitStats.filter((h) => h.scheduled > 0)].sort(
    (a, b) => b.rate - a.rate || b.completed - a.completed || a.name.localeCompare(b.name)
  );
  const unscheduled = habitStats.filter((h) => h.scheduled === 0);

  const elapsed = current.days;
  const bestDay =
    elapsed.filter((d) => d.scheduled > 0).sort(
      (a, b) => b.pct - a.pct || b.scheduled - a.scheduled || (a.date < b.date ? -1 : 1)
    )[0] ?? null;
  const worstDay =
    elapsed.filter((d) => d.scheduled > 0).sort(
      (a, b) => a.pct - b.pct || (a.date < b.date ? -1 : 1)
    )[0] ?? null;

  const isCurrent =
    periodStart <= todayStr && todayStr <= periodEnd;
  const isFuture = isAfter(periodStart, todayStr);

  const report: PeriodReport = {
    kind,
    periodStart,
    periodEnd,
    start: periodStart,
    end: isAfter(periodEnd, todayStr) ? todayStr : periodEnd,
    totalDays: getDaysInRange(periodStart, periodEnd).length,
    elapsedDays: elapsed.length,
    isCurrent,
    isFuture,
    hasRecord: current.scheduled > 0,

    title: kind === 'weekly' ? weekTitle(periodStart, periodEnd) : monthTitle(periodStart),
    eyebrow: kind === 'weekly' ? 'Weekly field report' : 'Monthly field report',

    days: elapsed,
    periodDays: current.periodDays,

    scheduled: current.scheduled,
    completed: current.completed,
    missed: current.scheduled - current.completed,
    rate: current.rate,

    perfectDays: current.perfectDays,
    partialDays: current.partialDays,
    missedDays: current.missedDays,
    noneDays: current.noneDays,
    loggedDays: current.loggedDays,

    bestRun: current.bestRun,
    bestDay,
    worstDay,

    habits: [...ranked, ...unscheduled],

    prevStart: prev.start,
    prevEnd: prev.end,
    prevRate,
    prevCompleted: previous.completed,
    prevDays: previous.days.length,
    change,

    fieldNote: '',
    generatedAt: new Date().toISOString(),
  };

  // Seeded on the period so the note is stable across re-renders.
  report.fieldNote = buildFieldNote(
    settings.roast_level,
    { scheduled: report.scheduled, rate: report.rate, change: report.change, habits: ranked },
    `${kind}:${periodStart}`
  );

  return report;
}

/** Human-readable period range, honouring the app's date format. */
export function periodRangeLabel(report: PeriodReport): string {
  return `${report.start} → ${report.end}`;
}

/** Label for the "current period" button. */
export function currentPeriodLabel(kind: PeriodKind): string {
  return kind === 'weekly' ? 'This week' : 'This month';
}

/** Weekday initials in the configured week order. */
export function orderedWeekdays(weekStart: 'monday' | 'sunday'): { short: string; full: string }[] {
  const anchor = weekStart === 'monday' ? '2024-01-01' : '2024-01-07';
  return getDaysInRange(anchor, addDays(anchor, 6)).map((d) => ({
    short: getDayName(d, true),
    full: getDayName(d),
  }));
}

// ============================================================
// Legacy wrappers
// ============================================================
//
// The store still exposes `weeklyReport` / `monthlyReport`. These keep that
// contract alive on top of the real engine, so nothing can drift out of sync
// with what the Reports page shows.

export async function generateWeeklyReport(
  roastLevel?: string
): Promise<import('../types').WeeklyReport> {
  const settings = await getSettings();
  const report = await buildPeriodReport('weekly', today(), {
    ...settings,
    roast_level: (roastLevel as AppSettings['roast_level']) ?? settings.roast_level,
  });

  const best = report.habits.find((h) => h.scheduled > 0);
  const worst = [...report.habits].reverse().find((h) => h.scheduled > 0);
  const improved = [...report.habits]
    .filter((h) => (h.trend ?? 0) > 0)
    .sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0))[0];
  const declined = [...report.habits]
    .filter((h) => (h.trend ?? 0) < 0)
    .sort((a, b) => (a.trend ?? 0) - (b.trend ?? 0))[0];
  const mostMissed = [...report.habits]
    .sort((a, b) => b.scheduled - b.completed - (a.scheduled - a.completed))[0];

  return {
    id: `weekly_${report.periodStart}`,
    week_start: report.periodStart,
    week_end: report.periodEnd,
    overall_score: report.rate,
    completion_rate: report.rate,
    previous_week_change: report.change ?? 0,
    best_habit: best?.name ?? '',
    worst_habit: worst?.name ?? '',
    most_improved: improved?.name ?? '',
    biggest_decline: declined?.name ?? '',
    longest_streak: report.bestRun > 0 ? `${report.bestRun} consecutive perfect days` : '',
    most_missed: mostMissed?.name ?? '',
    total_completions: report.completed,
    total_missed: report.missed,
    insights: [report.fieldNote],
    generated_at: report.generatedAt,
  };
}

export async function generateMonthlyReport(
  monthDate?: string,
  roastLevel?: string
): Promise<import('../types').MonthlyReport> {
  const settings = await getSettings();
  const report = await buildPeriodReport('monthly', monthDate || today(), {
    ...settings,
    roast_level: (roastLevel as AppSettings['roast_level']) ?? settings.roast_level,
  });

  const best = report.habits.find((h) => h.scheduled > 0);
  const worst = [...report.habits].reverse().find((h) => h.scheduled > 0);
  const improved = [...report.habits]
    .filter((h) => (h.trend ?? 0) > 0)
    .sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0))[0];
  const declined = [...report.habits]
    .filter((h) => (h.trend ?? 0) < 0)
    .sort((a, b) => (a.trend ?? 0) - (b.trend ?? 0))[0];

  return {
    id: `monthly_${report.periodStart}`,
    month: report.periodStart.slice(0, 7),
    overall_score: report.rate,
    completion_rate: report.rate,
    previous_month_change: report.change ?? 0,
    best_habit: best?.name ?? '',
    worst_habit: worst?.name ?? '',
    most_improved: improved?.name ?? '',
    biggest_decline: declined?.name ?? '',
    longest_streak: report.bestRun > 0 ? `${report.bestRun} consecutive perfect days` : '',
    best_day: report.bestDay
      ? `${getDayName(report.bestDay.date)} (${report.bestDay.pct}%)`
      : '',
    best_week: '',
    total_completions: report.completed,
    total_missed: report.missed,
    consistency: report.rate,
    insights: [report.fieldNote],
    generated_at: report.generatedAt,
  };
}
