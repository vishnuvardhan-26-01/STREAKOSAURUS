import React, { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../store';
import {
  today,
  getGreeting,
  getDayName,
  getMonthYear,
  subtractDays,
  formatTime,
  isHabitScheduledForDay,
} from '../utils/dates';
import { getPersonalityGreeting } from '../utils/roastEngine';
import { getCompletionsForDate, getCompletionsRange } from '../db/queries';
import { FootprintMark } from '../components/Brand';

interface WeekStat {
  date: string;
  day: string;
  scheduled: number;
  pct: number;
  isToday: boolean;
}

export default function HomePage() {
  const {
    dashboardProgress, habitsCompletedToday, totalHabitsToday,
    currentStreak, longestStreak, weeklyScore,
    habits, toggleCompletion, loadDashboard, settings, insights, loadInsights,
    todos, upcomingReminders, loadTodos, loadUpcomingReminders,
    setPage,
  } = useStore();

  const [todayCompletions, setTodayCompletions] = useState<Map<string, boolean>>(new Map());
  const [weekStats, setWeekStats] = useState<WeekStat[]>([]);

  const todayDate = today();

  // Loaders + today's completions. Depends only on the store's stable action refs and the
  // date. `habits` must never be listed here: loadDashboard() replaces the habits array
  // with a fresh one on every call, so depending on it re-triggered this effect forever.
  useEffect(() => {
    loadDashboard();
    loadInsights();
    loadTodos();
    loadUpcomingReminders();

    let cancelled = false;
    getCompletionsForDate(todayDate)
      .then((comps) => {
        if (cancelled) return;
        const map = new Map<string, boolean>();
        for (const c of comps) map.set(c.habit_id, c.completed);
        setTodayCompletions(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, loadInsights, loadTodos, loadUpcomingReminders, todayDate]);

  // The week strip genuinely depends on the habit list (how many habits were scheduled on
  // each of the last 7 days), so it recomputes when habits change — after a completion, an
  // add/edit, or an archive. It only reads and sets local state, so it cannot loop.
  useEffect(() => {
    if (habits.length === 0) {
      setWeekStats([]);
      return;
    }

    let cancelled = false;
    getCompletionsRange(subtractDays(todayDate, 6), todayDate)
      .then((weekComps) => {
        if (cancelled) return;
        const rows: WeekStat[] = [];
        for (let i = 0; i < 7; i++) {
          const d = subtractDays(todayDate, 6 - i);
          const scheduled = habits.filter((h) => isHabitScheduledForDay(h.frequency, h.specific_days, d));
          const done = weekComps.filter((c) => c.date === d && c.completed).length;
          rows.push({
            date: d,
            day: getDayName(d, true),
            scheduled: scheduled.length,
            pct: scheduled.length > 0 ? Math.round((done / scheduled.length) * 100) : 0,
            isToday: i === 6,
          });
        }
        setWeekStats(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [habits, todayDate]);

  // Compute the greeting ONLY when its inputs change — Math.random() inside
  // the roast engine must not re-roll on every store-driven re-render.
  const greeting = useMemo(
    () => getPersonalityGreeting(settings.roast_level, dashboardProgress, 'there'),
    [settings.roast_level, dashboardProgress]
  );
  const todayHabits = habits.filter((h) =>
    isHabitScheduledForDay(h.frequency, h.specific_days, todayDate)
  );
  const todayTasks = todos.filter((t) => !t.completed && t.due_date === todayDate);
  const hasHabits = habits.some((h) => !h.archived);
  const allDone = totalHabitsToday > 0 && habitsCompletedToday === totalHabitsToday;

  const handleToggle = async (habitId: string) => {
    const result = await toggleCompletion(habitId, todayDate);
    setTodayCompletions((prev) => {
      const next = new Map(prev);
      next.set(habitId, result);
      return next;
    });
  };

  const dateLabel = `${getDayName(todayDate)} · ${getMonthYear(todayDate)}`;

  return (
    <div className="px-12 py-8 max-w-[1080px] animate-fade-in">
      {/* ================================================================
          HERO — the roast speaks first. Hierarchy:
          roast (voice) > greeting (structure) > completion (status),
          with the ghost month as pure atmosphere behind all of it.
      ================================================================ */}
      <header className="relative pt-5 pb-12 mb-1 select-none">
        {/* ghost stratum — atmospheric, never competing with the roast */}
        <span
          aria-hidden="true"
          className="absolute -top-3 left-0 font-display text-[110px] leading-none text-brand-primary/[0.04] select-none pointer-events-none"
        >
          {getMonthYear(todayDate).split(' ')[0].toUpperCase()}
        </span>

        {/* quiet date line */}
        <p className="relative text-[11px] tracking-[0.22em] uppercase text-brand-primary/30 tabular-nums">
          {dateLabel}
        </p>

        {/* THE ROAST — the app speaking directly to you */}
        <blockquote className="relative mt-5 max-w-2xl">
          <span
            aria-hidden="true"
            className="absolute -left-6 top-1 bottom-1 w-[3px] bg-brand-burnt-orange/70 select-none"
          />
          <p className="italic font-display text-[27px] leading-[1.3] text-brand-primary/90">
            “{greeting}”
          </p>
        </blockquote>

        {/* greeting (structure) + completion (status) on one baseline */}
        <div className="relative flex items-baseline justify-between gap-8 mt-5 flex-wrap">
          <h1 className="font-display text-[30px] leading-tight text-brand-primary/75">
            {getGreeting().replace('.', '')}.
          </h1>
          {hasHabits && totalHabitsToday > 0 && (
            <span className="flex items-baseline gap-2.5">
              <span
                className={`font-display text-[30px] leading-none tabular-nums transition-colors duration-500 ${
                  allDone ? 'text-brand-olive' : 'text-brand-burnt-orange'
                }`}
              >
                {dashboardProgress}
              </span>
              <span className="text-[13px] text-brand-primary/40">
                of today · {habitsCompletedToday}/{totalHabitsToday}
              </span>
            </span>
          )}
        </div>
      </header>

      {!hasHabits ? (
        /* Empty state — open, no container */
        <div className="px-4 py-24 flex flex-col items-center text-center">
          <FootprintMark size={44} />
          <h2 className="font-display text-2xl text-brand-primary mt-7 mb-2.5">
            Your first footprint
          </h2>
          <p className="text-sm text-brand-primary/50 max-w-sm leading-relaxed">
            This dashboard is waiting for its first habit. Add one and start leaving
            a mark. Even the dinosaurs started somewhere.
          </p>
          <button onClick={() => setPage('habits')} className="btn-primary mt-9">
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-x-12">
          {/* ================================================================
              TODAY — one precise, aligned productivity grid.
              [22px checkbox] [name + metadata] [reminder → right-aligned]
          ================================================================ */}
          <section className="col-span-12 lg:col-span-8">
            {/* header aligned to the list grid */}
            <div className="flex items-baseline justify-between mb-2 pl-[38px]">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-brand-primary/30">
                Today’s Habits
              </h2>
              <span className="text-[12px] text-brand-primary/40 tabular-nums">
                <span className={allDone ? 'text-brand-olive' : 'text-brand-primary/80'}>
                  {habitsCompletedToday}
                </span>
                {' / '}{totalHabitsToday} done
              </span>
            </div>

            {todayHabits.length === 0 ? (
              <p className="py-10 text-sm italic text-brand-primary/35">
                No habits scheduled for today. Enjoy the fossil fuel.
              </p>
            ) : (
              <ul className="border-t border-brand-line/70">
                {todayHabits.map((habit) => {
                  const done = !!todayCompletions.get(habit.id);
                  return (
                    <li
                      key={habit.id}
                      className="grid grid-cols-[22px_1fr_auto] items-center gap-x-4 py-3 border-b border-brand-line/50"
                    >
                      {/* checkbox — subordinate to the name, clearly clickable */}
                      <button
                        onClick={() => handleToggle(habit.id)}
                        aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
                        aria-pressed={done}
                        className={`w-[20px] h-[20px] rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-brand-olive border-brand-olive text-[#F5EDDA]'
                            : 'border-brand-primary/25 hover:border-brand-primary/60'
                        }`}
                      >
                        {done && <Check size={12} strokeWidth={3} />}
                      </button>

                      {/* name dominates; metadata begins at the same x every row */}
                      <div className="min-w-0">
                        <p
                          className={`font-display text-[16px] leading-snug transition-colors duration-200 ${
                            done ? 'text-brand-primary/65 line-through decoration-brand-olive/50' : 'text-brand-primary'
                          }`}
                        >
                          {habit.name}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${done ? 'text-brand-primary/30' : 'text-brand-primary/40'}`}>
                          {habit.category}
                        </p>
                      </div>

                      {/* existing data only: reminder time, right-aligned */}
                      {habit.reminder_enabled && (
                        <span className="text-[11px] tabular-nums text-brand-mustard/70 justify-self-end">
                          {formatTime(habit.reminder_time, settings.time_format)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ================================================================
              THE RECORD — editorial ledger column
          ================================================================ */}
          <aside className="col-span-12 lg:col-span-4 pt-10 lg:pt-[52px]">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-brand-primary/30 mb-7">
              The Record
            </h2>

            <div className="space-y-4">
              <RecordRow label="Done today" value={`${habitsCompletedToday} / ${totalHabitsToday}`} />
              <RecordRow label="Current streak" value={currentStreak > 0 ? `${currentStreak} days` : '—'} />
              <RecordRow label="Longest streak" value={longestStreak > 0 ? `${longestStreak} days` : '—'} />
              <RecordRow label="Weekly score" value={weeklyScore > 0 ? `${weeklyScore}%` : '—'} />
            </div>

            {/* weekly consistency — small historical record */}
            {weekStats.length === 7 && (
              <div className="mt-10">
                <h3 className="text-[11px] tracking-[0.22em] uppercase text-brand-primary/30 mb-5">
                  The Week
                </h3>
                <div className="flex items-end justify-between gap-2 h-16">
                  {weekStats.map((w) => {
                    const unscheduled = w.scheduled === 0;
                    const barColor = w.isToday
                      ? 'bg-brand-burnt-orange'
                      : unscheduled
                      ? 'bg-brand-line'
                      : w.pct >= 80
                      ? 'bg-brand-olive'
                      : w.pct >= 40
                      ? 'bg-brand-mustard/70'
                      : 'bg-brand-warm-brown/50';
                    return (
                      <div key={w.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className={`w-full rounded-t-[2px] transition-all ${barColor}`}
                          style={{ height: `${unscheduled ? 3 : Math.max(w.pct, 4)}%` }}
                          title={unscheduled ? `${w.date} — no habits scheduled` : `${w.date} — ${w.pct}% of scheduled done`}
                        />
                        <span className={`text-[9px] uppercase tracking-wide ${w.isToday ? 'text-brand-burnt-orange font-semibold' : 'text-brand-primary/30'}`}>
                          {w.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* tasks + reminders */}
            {(todayTasks.length > 0 || upcomingReminders.length > 0) && (
              <div className="mt-10">
                <h3 className="text-[11px] tracking-[0.22em] uppercase text-brand-primary/30 mb-4">
                  On the Horizon
                </h3>
                <div className="space-y-2.5">
                  {todayTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 text-[13px] text-brand-primary/70">
                      <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${task.priority === 'urgent' || task.priority === 'high' ? 'bg-brand-burnt-orange' : 'bg-brand-primary/25'}`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {upcomingReminders.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-baseline gap-3 text-[13px]">
                      <span className="text-brand-mustard font-medium shrink-0 tabular-nums w-11">
                        {formatTime(r.time, settings.time_format)}
                      </span>
                      <span className="text-brand-primary/60 truncate">{r.title}</span>
                    </div>
                  ))}
                  {todayTasks.length > 4 && (
                    <p className="text-[11px] text-brand-primary/30">+{todayTasks.length - 4} more in To-do</p>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ================================================================
          FIELD NOTES — footnote prose
      ================================================================ */}
      {insights.length > 0 && (
        <section className="mt-14 pb-4">
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-brand-primary/30 mb-4">
            Field Notes
          </h2>
          <div className="space-y-2.5 max-w-2xl">
            {insights.slice(0, 3).map((insight) => (
              <p key={insight.id} className="text-[13px] text-brand-primary/60 leading-relaxed">
                <span className="text-brand-mustard mr-2">{insight.icon}</span>
                {insight.message}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[12px] text-brand-primary/45 shrink-0">{label}</span>
      <span className="flex-1 border-b border-dotted border-brand-primary/15 translate-y-[-3px]" />
      <span className="font-display text-[16px] text-brand-primary tabular-nums">{value}</span>
    </div>
  );
}
