import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bell, X, Edit3, Check, Circle, Minus } from 'lucide-react';
import { useStore } from '../store';
import {
  today,
  formatDate,
  getCalendarDays,
  getMonthYear,
  getDayName,
  getWeekdayNames,
  formatTime,
  formatDateDisplay,
  isHabitScheduledForDay,
  isAfter,
  parseDate,
} from '../utils/dates';
import { getCompletionsRange, getCompletionsForDate } from '../db/queries';
import Modal from '../components/Modal';
import type { Habit, Reminder } from '../types';

// ------------------------------------------------------------
// The record is one sheet, not a grid of cards: rows carry the
// structure (week bands, hairlines) and typography carries the
// hierarchy. Small pieces below, kept flat on purpose.
// ------------------------------------------------------------

/** One habit line in the day record: ✓ completed · ○ incomplete · — not scheduled */
function RecordRow({
  state,
  name,
  meta,
}: {
  state: 'done' | 'missed' | 'off';
  name: string;
  meta?: string;
}) {
  // Colour = meaning: olive done · burnt orange missed · warm brown not scheduled.
  const icon =
    state === 'done' ? (
      <Check size={12} className="text-brand-olive" />
    ) : state === 'missed' ? (
      <Circle size={9} className="text-brand-burnt-orange/80" />
    ) : (
      <Minus size={9} className="text-brand-warm-brown" />
    );

  const nameTone =
    state === 'done'
      ? 'text-brand-primary/90'
      : state === 'missed'
        ? 'text-brand-primary/70'
        : 'text-brand-primary/38';

  return (
    <div className="flex items-center gap-3 py-[6px] min-w-0">
      <span className="shrink-0 w-[13px] flex justify-center">{icon}</span>
      <span className={`text-[11.5px] truncate ${nameTone}`} title={name}>
        {name}
      </span>
      {meta && (
        <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-brand-primary/30">
          {meta}
        </span>
      )}
    </div>
  );
}

function ListHeading({ label, count, dot }: { label: string; count: number; dot: string }) {
  return (
    <p className="section-label mt-4 flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{label}</span>
      <span className="text-brand-primary/25 tabular-nums">· {count}</span>
    </p>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/40 truncate">
        {label}
      </p>
      <p className={`font-display text-[18px] mt-1.5 leading-none tabular-nums ${tone ?? 'text-brand-primary'}`}>
        {value}
      </p>
    </div>
  );
}

// ------------------------------------------------------------
// Colour language (V2). Completion is data, so it gets colour:
//   olive        → completed / healthy progress
//   mustard      → partial progress
//   burnt orange → scheduled but missed (attention)
//   warm brown   → neutral / nothing was scheduled
//   sage         → the day currently open in the record
// ------------------------------------------------------------
type Band = 'complete' | 'partial' | 'missed' | 'none' | 'future';

const BAND: Record<
  Band,
  { text: string; track: string; rule: string; swatch: string; strip: string; label: string }
> = {
  complete: { text: 'text-brand-olive', track: 'bg-brand-olive/20', rule: 'bg-brand-olive', swatch: 'bg-brand-olive', strip: 'bg-brand-olive/20', label: 'Complete' },
  partial: { text: 'text-brand-mustard', track: 'bg-brand-mustard/20', rule: 'bg-brand-mustard', swatch: 'bg-brand-mustard', strip: 'bg-brand-mustard/20', label: 'Partial' },
  missed: { text: 'text-brand-burnt-orange', track: 'bg-brand-burnt-orange/35', rule: 'bg-brand-burnt-orange', swatch: 'bg-brand-burnt-orange', strip: 'bg-brand-burnt-orange/40', label: 'Missed' },
  none: { text: 'text-brand-primary/40', track: 'bg-brand-warm-brown/25', rule: 'bg-brand-warm-brown/60', swatch: 'bg-brand-warm-brown/50', strip: 'bg-brand-warm-brown/25', label: 'Not scheduled' },
  future: { text: 'text-brand-primary/25', track: 'bg-transparent', rule: 'bg-transparent', swatch: 'bg-brand-warm-brown/20', strip: 'bg-brand-warm-brown/15', label: 'Not yet' },
};

/** The status band a row carries in its left gutter. */
const ROW_BAND: Record<Band, string> = {
  complete: 'bg-brand-olive',
  partial: 'bg-brand-mustard',
  missed: 'bg-brand-burnt-orange',
  none: 'bg-brand-line/50',
  future: 'bg-brand-line/25',
};

/** Which colour band a day belongs to. */
function bandFor(completed: number, total: number, isFuture: boolean): Band {
  if (isFuture) return 'future';
  if (total === 0) return 'none';
  if (completed >= total) return 'complete';
  if (completed > 0) return 'partial';
  return 'missed';
}

/** A whole week gets one band, derived from the days that have elapsed. */
function weekBand(completed: number, scheduled: number): Band {
  if (scheduled === 0) return 'none';
  if (completed === 0) return 'missed';
  if (completed >= scheduled) return 'complete';
  return 'partial';
}

function BandMark({ mark, label }: { mark: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-[4px] w-4 rounded-full ${mark}`} />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
        {label}
      </span>
    </span>
  );
}

export default function CalendarPage() {
  const {
    habits,
    reminders,
    settings,
    loadReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  } = useStore();

  // First day of the visible month, as a local YYYY-MM-DD string.
  const [currentDate, setCurrentDate] = useState(today());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [completedByDate, setCompletedByDate] = useState<Record<string, string[]>>({});
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [detailCompleted, setDetailCompleted] = useState<string[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', time: '09:00', habit_id: '' });

  // parseDate keeps this local: `new Date('2026-09-01')` would be parsed as UTC
  // and could land on the previous month for negative-offset timezones.
  const monthDate = parseDate(currentDate);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthStart = `${monthKey}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`;

  const todayStr = today();
  const weekStart = settings.week_start;
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const activeIds = useMemo(() => new Set(activeHabits.map((h) => h.id)), [activeHabits]);
  // getCalendarDays builds a fresh array, so memoise it instead of recomputing
  // the whole record on every render.
  const calendarDays = useMemo(
    () => getCalendarDays(year, month, weekStart),
    [year, month, weekStart]
  );

  // ----------------------------------------------------------
  // Data: the record for the visible month + the selected day
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    getCompletionsRange(monthStart, monthEnd)
      .then((completions) => {
        if (cancelled) return;
        const map: Record<string, string[]> = {};
        for (const c of completions) {
          if (!c.completed) continue;
          if (!map[c.date]) map[c.date] = [];
          map[c.date].push(c.habit_id);
        }
        setCompletedByDate(map);
        setLoadedMonth(monthKey);
      })
      .catch(() => {
        if (cancelled) return;
        setCompletedByDate({});
        setLoadedMonth(monthKey);
      });
    return () => {
      cancelled = true;
    };
  }, [monthStart, monthEnd, monthKey]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const detailDate = selectedDate || todayStr;

  useEffect(() => {
    let cancelled = false;
    getCompletionsForDate(detailDate)
      .then((rows) => {
        if (cancelled) return;
        setDetailCompleted(rows.filter((r) => r.completed).map((r) => r.habit_id));
      })
      .catch(() => {
        if (!cancelled) setDetailCompleted([]);
      });
    return () => {
      cancelled = true;
    };
  }, [detailDate]);

  // ----------------------------------------------------------
  // Record math (active habits only, so this page agrees with Home/Habits)
  // ----------------------------------------------------------

  /** Habits that existed and were scheduled on the given day. */
  const habitsScheduledOn = (dateStr: string): Habit[] =>
    activeHabits.filter(
      (h) =>
        isHabitScheduledForDay(h.frequency, h.specific_days, dateStr) &&
        (!h.start_date || !isAfter(h.start_date, dateStr)) &&
        (!h.end_date || !isAfter(dateStr, h.end_date))
    );

  /** Completions for a day, restricted to habits we know about. */
  const completedIdsOn = (dateStr: string): string[] => {
    const raw = completedByDate[dateStr];
    if (!raw) return [];
    return raw.filter((id) => activeIds.has(id));
  };

  const recordFor = (dateStr: string) => {
    const scheduled = habitsScheduledOn(dateStr);
    const completed = completedIdsOn(dateStr).filter((id) =>
      scheduled.some((h) => h.id === id)
    ).length;
    const total = scheduled.length;
    return {
      total,
      completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      isFuture: dateStr > todayStr,
    };
  };

  const monthRecord = useMemo(() => {
    const daysForMath = calendarDays.filter((d): d is string => !!d).filter((d) => d <= todayStr);
    let scheduled = 0;
    let completed = 0;
    let logged = 0;
    let perfect = 0;

    for (const dateStr of daysForMath) {
      const r = recordFor(dateStr);
      scheduled += r.total;
      completed += r.completed;
      if (r.completed > 0) logged++;
      if (r.total > 0 && r.completed === r.total) perfect++;
    }

    // Month shape: one column per day. The column's colour is the day's band and
    // its filled height is the share of that day's habits actually completed, so
    // a missed day is a full-height dull orange track with no fill.
    const bars = calendarDays
      .filter((d): d is string => !!d)
      .map((dateStr) => {
        const r = recordFor(dateStr);
        const band = bandFor(r.completed, r.total, r.isFuture);
        const height = r.isFuture ? '0%' : `${r.pct}%`;
        return {
          date: dateStr,
          band,
          height,
          total: r.total,
          completed: r.completed,
        };
      });

    return {
      elapsedDays: daysForMath.length,
      logged,
      perfect,
      scheduled,
      missed: Math.max(0, scheduled - completed),
      rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      bars,
    };
  }, [calendarDays, completedByDate, activeHabits, activeIds, todayStr]);

  // ----------------------------------------------------------
  // Day record for the margin
  // ----------------------------------------------------------

  // No scheduled habits means there is no performance to grade, so the month
  // reads neutral rather than as a failure.
  const monthHasRecord = monthRecord.scheduled > 0;
  const monthTone =
    monthRecord.elapsedDays === 0 || !monthHasRecord
      ? BAND.none
      : BAND[bandFor(monthRecord.rate, 100, false)];

  // The open day's numbers come from that day's own fetch, not from the visible
  // month's map — otherwise the aside would disagree with its own lists while
  // browsing a month that doesn't contain the open day.
  const detailRecord = recordFor(detailDate);
  const detailScheduled = habitsScheduledOn(detailDate);
  const detailDone = detailCompleted.filter((id) => detailScheduled.some((h) => h.id === id));
  const detailTotal = detailScheduled.length;
  const detailPct = detailTotal > 0 ? Math.round((detailDone.length / detailTotal) * 100) : 0;
  const detailTone = BAND[bandFor(detailDone.length, detailTotal, detailRecord.isFuture)];
  const detailMissed = detailScheduled.filter((h) => !detailDone.includes(h.id));
  const detailOff = activeHabits.filter(
    (h) => !detailScheduled.some((s) => s.id === h.id)
  );
  const detailReminders = reminders.filter((r) => r.date === detailDate);
  const hasReminders = (dateStr: string) => reminders.some((r) => r.date === dateStr);

  const habitMeta = (habit: Habit) =>
    habit.reminder_enabled && habit.reminder_time
      ? formatTime(habit.reminder_time, settings.time_format)
      : undefined;

  // ----------------------------------------------------------
  // Navigation + reminder handlers (existing behaviour, unchanged)
  // ----------------------------------------------------------

  const shiftMonth = (delta: number) => {
    const next = formatDate(new Date(year, month + delta, 1)); // local time, no UTC round-trip
    setCurrentDate(next);
    // A selection that falls outside the visible month would be confusing.
    if (selectedDate && selectedDate.slice(0, 7) !== next.slice(0, 7)) setSelectedDate(null);
  };

  const goToday = () => {
    setCurrentDate(todayStr);
    setSelectedDate(todayStr);
  };

  const openCreateReminder = () => {
    setEditingReminder(null);
    setReminderForm({ title: '', description: '', time: '09:00', habit_id: '' });
    setShowReminderForm(true);
  };

  const openEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      title: reminder.title,
      description: reminder.description,
      time: reminder.time,
      habit_id: reminder.habit_id || '',
    });
    setShowReminderForm(true);
  };

  const handleSaveReminder = async () => {
    if (!reminderForm.title.trim()) return;

    if (editingReminder) {
      await updateReminder(editingReminder.id, {
        title: reminderForm.title.trim(),
        description: reminderForm.description.trim(),
        time: reminderForm.time,
        habit_id: reminderForm.habit_id || null,
      });
    } else {
      await createReminder({
        title: reminderForm.title.trim(),
        description: reminderForm.description.trim(),
        date: detailDate,
        time: reminderForm.time,
        habit_id: reminderForm.habit_id || null,
        completed: false,
      });
    }
    setShowReminderForm(false);
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
  };

  // Only show counts once the month's record has actually been read.
  const recordKnown = loadedMonth === monthKey;

  // The sheet is ruled by weeks: pad the last row so every row closes evenly.
  const weeks = useMemo(() => {
    const rows: (string | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const row = calendarDays.slice(i, i + 7);
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [calendarDays]);

  /** A week's tally, counting only days that have actually elapsed. */
  const weekRecord = (week: (string | null)[]) => {
    let scheduled = 0;
    let completed = 0;
    for (const d of week) {
      if (!d || d > todayStr) continue;
      const r = recordFor(d);
      scheduled += r.total;
      completed += r.completed;
    }
    return { scheduled, completed, band: weekBand(completed, scheduled) };
  };

  return (
    <div className="px-6 lg:px-8 pt-3 pb-12 max-w-5xl mx-auto animate-fade-in">
      {/* ===== Masthead ===== */}
      <header className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
              Excavation record
            </p>
            <h1 className="font-display text-[28px] leading-tight text-brand-primary tracking-tight">
              {getMonthYear(monthStart)}
            </h1>
            <p className="text-[12px] text-brand-primary/65 mt-1 font-medium tracking-wide">
              {recordKnown ? (
                monthRecord.elapsedDays === 0 ? (
                  'This month is still ahead.'
                ) : !monthHasRecord ? (
                  'No habits were scheduled this month.'
                ) : (
                  <>
                    <span>{monthRecord.logged} of {monthRecord.elapsedDays} days logged</span>
                    <span className="text-brand-primary/30 mx-1.5">·</span>
                    <span className="text-brand-primary/45 tabular-nums">
                      {monthRecord.rate}% of scheduled habits completed
                    </span>
                  </>
                )
              ) : (
                'Reading the record…'
              )}
            </p>
          </div>

          {/* Bare controls: the record sheet carries the structure, not the chrome. */}
          <div
            className="flex items-center gap-1 shrink-0 -mt-1"
            role="group"
            aria-label="Month navigation"
          >
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="h-8 w-8 inline-flex items-center justify-center text-brand-primary/45 hover:text-brand-primary hover:bg-brand-warm-brown/15 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToday}
              className={`h-8 px-3 text-[10.5px] uppercase tracking-[0.16em] transition-colors ${
                monthKey === todayStr.slice(0, 7)
                  ? 'text-brand-primary'
                  : 'text-brand-primary/55 hover:text-brand-primary'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="h-8 w-8 inline-flex items-center justify-center text-brand-primary/45 hover:text-brand-primary hover:bg-brand-warm-brown/15 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Month ledger: rate, facts, and the month's stratigraphy ===== */}
      <section className="border-t border-brand-line pt-3">
        {/* one plate: rate, facts, then the month's own shape */}
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6 pb-3 border-b border-brand-line/40">
          <div className="flex items-end gap-8 min-w-0">
            <div className="shrink-0">
              <p className="font-display text-[28px] leading-none tabular-nums">
                <span className={recordKnown && monthHasRecord ? monthTone.text : 'text-brand-primary/25'}>
                  {recordKnown && monthHasRecord && monthRecord.elapsedDays > 0
                    ? `${monthRecord.rate}%`
                    : '—'}
                </span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/40 mt-1.5">
                Of scheduled habits
              </p>
            </div>

            <span className="hidden sm:block w-px h-9 bg-brand-line/70 shrink-0" />

            <div className="flex items-end gap-7 min-w-0">
              {/* a zero gets no colour: colour only where it carries meaning */}
              <Stat
                label="Days logged"
                value={recordKnown ? monthRecord.logged : 0}
                tone={monthRecord.logged > 0 ? 'text-brand-sage' : 'text-brand-primary/25'}
              />
              <Stat
                label="Perfect"
                value={recordKnown ? monthRecord.perfect : 0}
                tone={monthRecord.perfect > 0 ? 'text-brand-olive' : 'text-brand-primary/25'}
              />
              <Stat
                label="Missed habits"
                value={recordKnown ? monthRecord.missed : 0}
                tone={monthRecord.missed > 0 ? 'text-brand-burnt-orange' : 'text-brand-primary/25'}
              />
            </div>
          </div>

          {/* one column per day, so the month's shape is readable at a glance */}
          <div className="min-w-[220px] flex-1 max-w-[380px] pt-2">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/45">
                Stratigraphy
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/35 whitespace-nowrap">
                Fill = share completed
              </p>
            </div>
            <div className="flex items-stretch gap-[2px] h-6">
              {monthRecord.bars.map((b) => (
                <span
                  key={b.date}
                  className={`flex-1 flex items-end h-full rounded-[1px] ${
                    b.band === 'future' ? '' : BAND[b.band].strip
                  }`}
                  title={`${b.date}: ${b.total > 0 ? `${b.completed} of ${b.total} completed` : 'nothing scheduled'}`}
                >
                  <span
                    className={`w-full rounded-[1px] ${BAND[b.band].rule}`}
                    style={{ height: b.height }}
                  />
                </span>
              ))}
            </div>
            {/* the axis: first and last day of the month, so the columns are countable */}
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[8.5px] tabular-nums text-brand-primary/35">1</span>
              <span className="h-px flex-1 bg-brand-line/60" />
              <span className="font-mono text-[8.5px] tabular-nums text-brand-primary/35">
                {daysInMonth}
              </span>
            </div>
          </div>
        </div>
      </section>

      {activeHabits.length === 0 && (
        <p className="mt-6 text-[12px] text-brand-primary/55 border-l border-brand-burnt-orange/40 pl-3 leading-relaxed">
          No active habits yet, so there is no record to read. Create a habit and this page will fill in.
        </p>
      )}

      {/* ===== The document: ruled sheet + day record margin ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-10 lg:gap-0 mt-4">
        {/* --- Sheet: one row per week, hairline-ruled --- */}
        <section className="min-w-0 lg:pr-8">
          <div className="flex items-end border-b border-brand-line/60">
            <span className="w-[3px] shrink-0" aria-hidden="true" />
            <div className="grid grid-cols-7 flex-1 min-w-0">
              {getWeekdayNames(true, weekStart).map((day, i) => {
                const isWeekend = weekStart === 'monday' ? i >= 5 : i === 0 || i === 6;
                return (
                  <div
                    key={day}
                    className={`font-mono text-[9.5px] uppercase tracking-[0.14em] pb-2.5 pl-2.5 ${
                      isWeekend ? 'text-brand-primary/35' : 'text-brand-primary/50'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <span className="w-[4.25rem] shrink-0 pb-2.5 pl-3 text-right pr-1 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-primary/30">
              Week
            </span>
          </div>

          {weeks.map((week, wi) => {
            const wk = weekRecord(week);
            return (
              <div key={`week-${wi}`} className="flex items-stretch border-b border-brand-line/45">
                {/* the row's status band carries the week's colour */}
                <span className={`w-[3px] shrink-0 ${ROW_BAND[wk.band]}`} aria-hidden="true" />

                <div className="grid grid-cols-7 flex-1 min-w-0">
                  {week.map((dateStr, di) => {
                    if (!dateStr) {
                      return <div key={`empty-${wi}-${di}`} className="h-[80px]" aria-hidden="true" />;
                    }

                    const rec = recordFor(dateStr);
                    const isSelected = dateStr === selectedDate;
                    const isTodayDate = dateStr === todayStr;
                    const dayNum = Number(dateStr.slice(8, 10));
                    const band = bandFor(rec.completed, rec.total, rec.isFuture);
                    const tone = BAND[band];
                    const known = recordKnown && rec.total > 0;
                    const elapsed = known && !rec.isFuture;

                    const label = rec.isFuture
                      ? `${dayNum}: not yet`
                      : known
                        ? `${dayNum}: ${rec.completed} of ${rec.total} completed`
                        : `${dayNum}: nothing scheduled`;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        aria-pressed={isSelected}
                        aria-current={isTodayDate ? 'date' : undefined}
                        aria-label={`${formatDateDisplay(dateStr, settings.date_format)} — ${label}`}
                        className="group relative h-[80px] text-left px-2.5 pt-3"
                      >
                        {/* the open day: a warm wash, no frame */}
                        {isSelected && (
                          <span
                            className="absolute inset-0 pointer-events-none"
                            style={{ backgroundColor: 'rgba(111,81,58,0.22)' }}
                          />
                        )}
                        <span className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/[0.04] transition-colors pointer-events-none" />

                        {/* dates read as cream for contrast; the band below carries the colour */}
                        <span
                          className={`relative block font-mono text-[12px] leading-none tabular-nums ${
                            isSelected || isTodayDate
                              ? 'text-brand-primary font-semibold'
                              : rec.isFuture
                                ? 'text-brand-primary/35'
                                : known
                                  ? 'text-brand-primary/85 font-medium'
                                  : 'text-brand-primary/45'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {/* today → cream tick · open day → sage tick (structural marks, not hues) */}
                        {(isTodayDate || isSelected) && (
                          <span
                            className={`relative mt-[3px] block h-[1.5px] w-[13px] rounded-full ${
                              isSelected ? 'bg-brand-sage' : 'bg-brand-primary/55'
                            }`}
                          />
                        )}

                        {elapsed && (
                          <span className="absolute left-2.5 bottom-[11px] flex items-baseline gap-[3px] font-mono tabular-nums">
                            <span className="text-[11.5px] leading-none text-brand-primary/85 font-medium">
                              {rec.completed}
                            </span>
                            <span className="text-[9.5px] leading-none text-brand-primary/35">
                              /{rec.total}
                            </span>
                          </span>
                        )}

                        {/* base stratum: colour = the day's record, fill = the share kept */}
                        {band !== 'future' && (
                          <span className={`absolute inset-x-0 bottom-0 h-[4px] ${tone.track}`}>
                            <span
                              className={`block h-full transition-[width] duration-300 ${tone.rule}`}
                              style={{ width: `${rec.pct}%` }}
                            />
                          </span>
                        )}

                        {hasReminders(dateStr) && (
                          <span
                            className="absolute right-2 top-2 h-1 w-1 rounded-full bg-brand-mustard"
                            title="Reminder scheduled"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* the week's tally, in the sheet's own margin */}
                <div className="w-[4.25rem] shrink-0 flex flex-col items-end justify-center pl-3 pr-1">
                  {wk.scheduled > 0 ? (
                    <>
                      <span className="font-mono text-[11px] leading-none tabular-nums text-brand-primary/85 font-medium">
                        {wk.completed}/{wk.scheduled}
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-brand-primary/35 mt-1.5">
                        Kept
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-[10px] text-brand-primary/25">—</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* ===== The colour language, stated: bands are data, ticks are structure ===== */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-5 border-t border-brand-line/40">
            <BandMark mark={BAND.complete.swatch} label="Complete" />
            <BandMark mark={BAND.partial.swatch} label="Partial" />
            <BandMark mark={BAND.missed.swatch} label="Missed" />
            <BandMark mark="bg-brand-warm-brown/45" label="Not scheduled" />
            <BandMark mark={BAND.future.swatch} label="Not yet" />
            {/* these two describe the day ticks, so they wrap together */}
            <span className="inline-flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="inline-flex items-center gap-2">
                <span className="h-[1.5px] w-4 rounded-full bg-brand-sage" />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
                  Open day
                </span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-[1.5px] w-4 rounded-full bg-brand-primary/55" />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
                  Today
                </span>
              </span>
            </span>
          </div>
        </section>

        {/* --- Margin: the open day's record, quieter than the sheet --- */}
        <aside className="min-w-0 lg:border-l lg:border-brand-line/45 lg:pl-8">
          <section>
            <p className="section-label">Day record</p>
            <h2 className="font-display text-[17px] leading-tight text-brand-primary mt-2">
              {getDayName(detailDate)}
            </h2>
            <p className="font-mono text-[10.5px] tabular-nums text-brand-primary/45 mt-1.5">
              {formatDateDisplay(detailDate, settings.date_format)}
              {detailDate === todayStr && <span className="text-brand-burnt-orange/90"> · today</span>}
            </p>

            {detailRecord.isFuture ? (
              <p className="text-[12px] text-brand-primary/55 mt-5 leading-relaxed">
                This day hasn’t happened yet.
                {detailScheduled.length > 0 && (
                  <>
                    {' '}
                    <span className="tabular-nums text-brand-primary/75">{detailScheduled.length}</span>{' '}
                    {detailScheduled.length === 1 ? 'habit is' : 'habits are'} due.
                  </>
                )}
              </p>
            ) : detailTotal === 0 ? (
              <p className="text-[12px] text-brand-primary/50 mt-5 leading-relaxed">
                Nothing was scheduled for this day.
              </p>
            ) : (
              <>
                <p className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-[19px] leading-none tabular-nums text-brand-primary/90">
                    {detailDone.length}
                  </span>
                  <span className="text-[11.5px] text-brand-primary/35 tabular-nums">
                    / {detailTotal}
                  </span>
                  <span className="ml-auto font-mono text-[10.5px] tabular-nums text-brand-primary/45">
                    {detailPct}%
                  </span>
                </p>
                <span className="mt-2.5 block h-[2px] w-full bg-brand-line/60 overflow-hidden">
                  <span
                    className={`block h-full transition-all duration-500 ${detailTone.rule}`}
                    style={{ width: `${detailPct}%` }}
                  />
                </span>
              </>
            )}

            {!detailRecord.isFuture && detailDone.length > 0 && (
              <>
                <ListHeading label="Completed" count={detailDone.length} dot="bg-brand-olive" />
                <div className="divide-y divide-brand-line/25">
                  {detailDone.map((id) => {
                    const habit = detailScheduled.find((h) => h.id === id);
                    if (!habit) return null;
                    return (
                      <RecordRow key={id} state="done" name={habit.name} meta={habitMeta(habit)} />
                    );
                  })}
                </div>
              </>
            )}

            {!detailRecord.isFuture && detailMissed.length > 0 && (
              <>
                <ListHeading label="Incomplete" count={detailMissed.length} dot="bg-brand-burnt-orange" />
                <div className="divide-y divide-brand-line/25">
                  {detailMissed.map((habit) => (
                    <RecordRow
                      key={habit.id}
                      state="missed"
                      name={habit.name}
                      meta={habitMeta(habit)}
                    />
                  ))}
                </div>
              </>
            )}

            {detailOff.length > 0 && (
              <>
                <ListHeading label="Not scheduled" count={detailOff.length} dot="bg-brand-warm-brown" />
                <div className="divide-y divide-brand-line/25">
                  {detailOff.map((habit) => (
                    <RecordRow key={habit.id} state="off" name={habit.name} />
                  ))}
                </div>
              </>
            )}

            {/* ===== Reminders (unchanged functionality, quiet restyle) ===== */}
            <div className="mt-6 pt-5 border-t border-brand-line/45">
              <div className="flex items-center justify-between">
                <p className="section-label">Reminders</p>
                <button
                  onClick={openCreateReminder}
                  className="p-1 -m-1 text-brand-primary/35 hover:text-brand-burnt-orange transition-colors"
                  title="Add reminder"
                  aria-label="Add reminder"
                >
                  <Plus size={14} />
                </button>
              </div>

              {detailReminders.length === 0 ? (
                <p className="text-[11.5px] text-brand-primary/35 mt-3 italic">
                  No reminders on this day.
                </p>
              ) : (
                <div className="divide-y divide-brand-line/25 mt-1">
                  {detailReminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2 group min-w-0">
                      <Bell size={12} className="text-brand-mustard/85 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11.5px] text-brand-primary/80 block truncate">
                          {r.title}
                        </span>
                        <span className="font-mono text-[10px] tabular-nums text-brand-primary/35">
                          {formatTime(r.time, settings.time_format)}
                        </span>
                      </div>
                      <button
                        onClick={() => openEditReminder(r)}
                        className="p-1 text-brand-primary/25 hover:text-brand-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                        title="Edit reminder"
                        aria-label={`Edit reminder ${r.title}`}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(r.id)}
                        className="p-1 text-brand-primary/25 hover:text-brand-danger opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                        title="Delete reminder"
                        aria-label={`Delete reminder ${r.title}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* Reminder Form Modal */}
      <Modal
        isOpen={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        title={editingReminder ? 'Edit Reminder' : 'New Reminder'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
              placeholder="e.g. Submit assignment"
              className="input"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={reminderForm.description}
              onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
              placeholder="Optional description"
              className="input"
            />
          </div>
          <div>
            <label className="label">Time</label>
            <input
              type="time"
              value={reminderForm.time}
              onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
              className="input"
            />
          </div>
          {activeHabits.length > 0 && (
            <div>
              <label className="label">Link to Habit (optional)</label>
              <select
                value={reminderForm.habit_id}
                onChange={(e) => setReminderForm({ ...reminderForm, habit_id: e.target.value })}
                className="select"
              >
                <option value="">None</option>
                {activeHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowReminderForm(false)} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSaveReminder}
              disabled={!reminderForm.title.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {editingReminder ? 'Save' : 'Add Reminder'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
