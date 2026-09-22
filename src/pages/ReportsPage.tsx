import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  Minus,
} from 'lucide-react';
import { useStore } from '../store';
import EmptyState from '../components/EmptyState';
import {
  basisFor,
  buildPeriodReport,
  currentPeriodLabel,
  orderedWeekdays,
  shiftPeriod,
  type DayBand,
  type PeriodKind,
  type PeriodReport,
  type ReportHabit,
} from '../utils/reports';
import { formatDateDisplay, getDayName, isHabitScheduledForDay, today } from '../utils/dates';
import { getCompletionsForDate } from '../db/queries';

// ============================================================
// Colour = meaning (V2). Completion is data, so it gets colour:
//   olive        → complete / healthy progress
//   mustard      → partial
//   burnt orange → scheduled but missed (attention)
//   warm brown   → neutral: nothing was scheduled / not yet
//   sage         → secondary positive (days logged, selection)
// ============================================================

const BAND: Record<
  DayBand,
  { fill: string; track: string; text: string; rule: string; swatch: string; label: string }
> = {
  // Softer tracks: the slot is context for the fill, not a second data mark.
  complete: { fill: 'bg-brand-olive', track: 'bg-brand-olive/9', text: 'text-brand-olive', rule: 'bg-brand-olive', swatch: 'bg-brand-olive', label: 'Complete' },
  partial: { fill: 'bg-brand-mustard', track: 'bg-brand-mustard/8', text: 'text-brand-mustard', rule: 'bg-brand-mustard', swatch: 'bg-brand-mustard', label: 'Partial' },
  missed: { fill: 'bg-brand-burnt-orange', track: 'bg-brand-burnt-orange/20', text: 'text-brand-burnt-orange', rule: 'bg-brand-burnt-orange', swatch: 'bg-brand-burnt-orange', label: 'Missed' },
  none: { fill: 'bg-brand-warm-brown/30', track: 'bg-transparent', text: 'text-brand-primary/45', rule: 'bg-brand-warm-brown/40', swatch: 'bg-brand-warm-brown/50', label: 'Nothing scheduled' },
  future: { fill: 'bg-brand-warm-brown/20', track: 'bg-transparent', text: 'text-brand-primary/25', rule: 'bg-brand-warm-brown/20', swatch: 'bg-brand-warm-brown/20', label: 'Not yet' },
};

/** Colour band for a completion rate. */
function rateBand(rate: number, scheduled: number): DayBand {
  if (scheduled === 0) return 'none';
  if (rate >= 100) return 'complete';
  if (rate > 0) return 'partial';
  return 'missed';
}

// ------------------------------------------------------------
// Small presentational pieces (flat — this is a record, not a dashboard)
// ------------------------------------------------------------

function SectionRule({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-brand-line/70 pb-2">
      <h2 className="text-[10px] font-medium tracking-widest2 uppercase text-brand-primary/45">
        {label}
      </h2>
      {note && (
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/30 truncate">
          {note}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/45 truncate">
        {label}
      </p>
      <p className={`font-display text-[19px] mt-1 leading-none tabular-nums ${tone ?? 'text-brand-primary'}`}>
        {value}
      </p>
    </div>
  );
}

function BandMark({ mark, label }: { mark: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-[3px] w-3.5 rounded-full ${mark}`} />
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
        {label}
      </span>
    </span>
  );
}

/** Rate delta against the previous period. Never invents a comparison. */
function Delta({ change, kind }: { change: number | null; kind: PeriodKind }) {
  const unit = kind === 'weekly' ? 'last week' : 'last month';
  if (change === null) {
    return (
      <p className="text-[11.5px] text-brand-primary/40 mt-2.5">
        No comparable period before this one.
      </p>
    );
  }
  if (change === 0) {
    return <p className="text-[11.5px] text-brand-primary/45 mt-2.5">Level with {unit}.</p>;
  }
  const up = change > 0;
  return (
    <p
      className={`inline-flex items-center gap-1 text-[11.5px] mt-2.5 font-medium tabular-nums ${
        up ? 'text-brand-olive' : 'text-brand-burnt-orange'
      }`}
    >
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {up ? '+' : ''}
      {change} pts against {unit}
    </p>
  );
}

/** One habit line: name · trend · kept/scheduled · rate + a thin rate rule. */
function HabitLine({ habit, dim }: { habit: ReportHabit; dim?: boolean }) {
  const band = BAND[rateBand(habit.rate, habit.scheduled)];
  const tone = habit.scheduled === 0 ? 'text-brand-primary/35' : band.text;

  return (
    <li className="py-2.5">
      <div className="flex items-baseline gap-3 min-w-0">
        <span
          className={`text-[13px] truncate flex-1 ${dim ? 'text-brand-primary/45' : 'text-brand-primary'}`}
          title={habit.name}
        >
          {habit.name}
        </span>

        {habit.trend !== null && habit.trend !== 0 && (
          <span
            className={`font-mono text-[10px] tabular-nums shrink-0 ${
              habit.trend > 0 ? 'text-brand-olive' : 'text-brand-burnt-orange'
            }`}
            title={`${habit.trend > 0 ? '+' : ''}${habit.trend} percentage points vs the previous period`}
          >
            {habit.trend > 0 ? '+' : ''}
            {habit.trend}
          </span>
        )}

        <span className="font-mono text-[10.5px] tabular-nums text-brand-primary/40 shrink-0">
          {habit.completed}/{habit.scheduled}
        </span>

        <span className={`font-display text-[15px] w-11 text-right tabular-nums shrink-0 ${tone}`}>
          {habit.scheduled === 0 ? '—' : `${habit.rate}%`}
        </span>
      </div>

      <span className="mt-1.5 block h-[2px] w-full bg-brand-line/40 overflow-hidden">
        <span
          className={`block h-full ${band.rule}`}
          style={{ width: `${habit.scheduled === 0 ? 0 : habit.rate}%` }}
        />
      </span>
    </li>
  );
}

function RecordRow({
  state,
  name,
}: {
  state: 'done' | 'missed' | 'off';
  name: string;
}) {
  const icon =
    state === 'done' ? (
      <Check size={13} className="text-brand-olive" />
    ) : state === 'missed' ? (
      <Circle size={11} className="text-brand-burnt-orange/80" />
    ) : (
      <Minus size={11} className="text-brand-warm-brown" />
    );

  const tone =
    state === 'done'
      ? 'text-brand-primary'
      : state === 'missed'
        ? 'text-brand-primary/75'
        : 'text-brand-primary/40';

  return (
    <div className="flex items-center gap-2.5 py-1.5 min-w-0">
      <span className="shrink-0 w-[13px] flex justify-center">{icon}</span>
      <span className={`text-[12.5px] truncate ${tone}`} title={name}>
        {name}
      </span>
    </div>
  );
}

// ------------------------------------------------------------
// The trend: one column per elapsed day.
// Track = what was due that day · fill = the share that was kept.
// ------------------------------------------------------------

function TrendChart({
  report,
  weekStart,
  dateFormat,
  selectedDay,
  onSelectDay,
}: {
  report: PeriodReport;
  weekStart: 'monday' | 'sunday';
  dateFormat: string;
  selectedDay: string | null;
  onSelectDay: (date: string) => void;
}) {
  // The whole period, so a week keeps its seven slots and the rest of the week
  // reads as "not yet" rather than as a shorter chart.
  const days = report.periodDays;
  const weekly = report.kind === 'weekly';
  const weekdays = useMemo(() => orderedWeekdays(weekStart), [weekStart]);

  return (
    <div>
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
        {/* axis */}
        <div className="relative h-[132px]" aria-hidden="true">
          {[100, 75, 50, 25, 0].map((v) => (
            <span
              key={v}
              className="absolute right-0 font-mono text-[9px] tabular-nums text-brand-primary/25 leading-none"
              style={{ bottom: `calc(${v}% - 4px)` }}
            >
              {v}
            </span>
          ))}
        </div>

        {/* columns */}
        <div className="relative h-[132px]">
          {[25, 50, 75, 100].map((v) => (
            <span
              key={v}
              className="absolute inset-x-0 border-t border-brand-line/25"
              style={{ bottom: `${v}%` }}
              aria-hidden="true"
            />
          ))}
          <span className="absolute inset-x-0 bottom-0 border-t border-brand-line/60" aria-hidden="true" />

          <div className="absolute inset-0 flex items-end gap-[3px]">
            {days.map((d) => {
              const tone = BAND[d.band];
              const isSelected = d.date === selectedDay;
              const label = `${formatDateDisplay(d.date, dateFormat)} — ${
                d.isFuture
                  ? d.scheduled > 0
                    ? `not yet, ${d.scheduled} due`
                    : 'not yet'
                  : d.scheduled === 0
                    ? 'nothing scheduled'
                    : `${d.completed} of ${d.scheduled} completed (${d.pct}%)`
              }`;

              // Days that haven't happened aren't clickable — there is no record
              // to open, only a date that is still ahead.
              if (d.isFuture) {
                // A day that hasn't happened yet. The slot is drawn hollow so it
                // can't be read as a day that finished with nothing scheduled
                // (that one draws the thin baseline stub, below).
                return (
                  <div
                    key={d.date}
                    className="relative flex-1 h-full min-w-0"
                    title={label}
                    aria-hidden="true"
                  >
                    <span className="absolute inset-0 rounded-[2px] border border-dashed border-brand-warm-brown/30" />
                  </div>
                );
              }

              return (
                <button
                  key={d.date}
                  onClick={() => onSelectDay(d.date)}
                  aria-pressed={isSelected}
                  aria-label={label}
                  title={label}
                  className="relative flex-1 h-full min-w-0 group"
                >
                  <span className="absolute inset-0 -mx-[1.5px] rounded-[2px] bg-brand-primary/0 group-hover:bg-brand-primary/[0.07] transition-colors" />

                  {/* what was due */}
                  {d.scheduled > 0 ? (
                    <span className={`absolute inset-0 rounded-[2px] ${tone.track}`} />
                  ) : (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-warm-brown/25" />
                  )}

                  {/* what was kept — flush with the axis, sitting inside its slot */}
                  {d.scheduled > 0 && (
                    <span
                      className={`absolute bottom-0 inset-x-[2px] rounded-t-[2px] transition-[height] duration-300 ${tone.fill}`}
                      style={{ height: `${d.pct}%` }}
                    />
                  )}

                  {isSelected && (
                    <span className="absolute -inset-x-[2px] inset-y-0 rounded-[2px] ring-1 ring-brand-sage/70 pointer-events-none" />
                  )}
                  {d.isToday && !isSelected && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-brand-primary/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* day labels — weekly shows every day, monthly every fifth */}
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 mt-1.5">
        <div />
        <div className="flex items-end gap-[3px]">
          {days.map((d) => {
            const dayNum = Number(d.date.slice(8, 10));
            const show = weekly || dayNum === 1 || dayNum % 5 === 0;
            const isSelected = d.date === selectedDay;
            return (
              <span
                key={d.date}
                className={`flex-1 min-w-0 text-center font-mono text-[9.5px] uppercase tracking-[0.08em] truncate ${
                  isSelected
                    ? 'text-brand-sage'
                    : d.isToday
                      ? 'text-brand-primary/70'
                      : d.isFuture
                        ? 'text-brand-primary/20'
                        : 'text-brand-primary/30'
                }`}
              >
                {weekly ? weekdays[d.dayOfWeek === 0 ? 6 : d.dayOfWeek - 1].short : show ? dayNum : ''}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3.5">
        <BandMark mark={BAND.complete.swatch} label="Complete" />
        <BandMark mark={BAND.partial.swatch} label="Partial" />
        <BandMark mark={BAND.missed.swatch} label="Missed" />
        <BandMark mark="bg-brand-warm-brown/35" label="Nothing scheduled" />
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[2px] border border-dashed border-brand-warm-brown/35" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
            Not yet
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[2px] ring-1 ring-brand-sage/70" />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/45">
            Selected
          </span>
        </span>
      </div>
    </div>
  );
}

// ============================================================

export default function ReportsPage() {
  const { habits, settings, setPage } = useStore();
  const [mode, setMode] = useState<PeriodKind>('weekly');
  // An anchor date inside the target period; the period boundary is derived from
  // it, so switching weekly↔monthly keeps you in the month you were looking at.
  const [anchor, setAnchor] = useState(today());
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDone, setDayDone] = useState<string[]>([]);

  const weekStart = settings.week_start;
  const todayStr = today();
  const kind: PeriodKind = mode;
  const basis = basisFor(kind, anchor, weekStart);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Navigation bounds: never past the current period, never before the record starts.
  const currentBasis = basisFor(kind, todayStr, weekStart);
  const earliestDate = useMemo(() => {
    const starts = activeHabits.map((h) => h.start_date).filter(Boolean).sort();
    return starts[0] ?? todayStr;
  }, [activeHabits, todayStr]);
  const earliestBasis = basisFor(kind, earliestDate, weekStart);
  const canPrev = basis > earliestBasis;
  const canNext = basis < currentBasis;

  // ----------------------------------------------------------
  // Build the report. Reads only — it never writes back into the
  // store, so it cannot re-trigger itself.
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    buildPeriodReport(kind, basis, settings, habits)
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setReport(null);
        setError(e instanceof Error ? e.message : 'The record could not be read.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, basis, settings, habits]);

  // A selection from another period would be confusing.
  useEffect(() => {
    setSelectedDay(null);
  }, [basis, kind]);

  // The selected day's record — one read, same rules as the engine.
  useEffect(() => {
    if (!selectedDay) {
      setDayDone([]);
      return;
    }
    let cancelled = false;
    getCompletionsForDate(selectedDay)
      .then((rows) => {
        if (cancelled) return;
        setDayDone(rows.filter((r) => r.completed).map((r) => r.habit_id));
      })
      .catch(() => {
        if (!cancelled) setDayDone([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  // ----------------------------------------------------------

  const go = (delta: number) => setAnchor(shiftPeriod(kind, basis, delta, weekStart));
  const goCurrent = () => setAnchor(todayStr);
  const switchMode = (next: PeriodKind) => setMode(next);

  if (activeHabits.length === 0) {
    return (
      <div className="px-6 lg:px-8 pt-5 pb-12 max-w-5xl mx-auto animate-fade-in">
        <header className="pb-3.5 hairline">
          <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
            Field report
          </p>
          <h1 className="font-display text-[30px] leading-tight text-brand-primary tracking-tight">
            Reports
          </h1>
        </header>
        <EmptyState
          title="Nothing has been recorded yet"
          message="Reports are read from the habits you actually complete. Create a habit, keep it for a few days, and this page will fill in."
          action={
            <button onClick={() => setPage('habits')} className="btn-primary">
              Create a habit
              <ArrowRight size={15} />
            </button>
          }
        />
      </div>
    );
  }

  const completed = report?.completed ?? 0;
  const scheduled = report?.scheduled ?? 0;
  const overallTone = BAND[rateBand(report?.rate ?? 0, scheduled)];

  const daySummary = report
    ? report.kind === 'weekly'
      ? `${report.loggedDays} ${report.loggedDays === 1 ? 'day' : 'days'} logged · ${report.completed} of ${report.scheduled} scheduled habits kept`
      : `${report.elapsedDays} of ${report.totalDays} days elapsed · ${report.completed} of ${report.scheduled} kept`
    : 'Reading the record…';

  // --- selected day ------------------------------------------------------
  const selectedScheduled = selectedDay
    ? activeHabits.filter(
        (h) =>
          isHabitScheduledForDay(h.frequency, h.specific_days, selectedDay) &&
          (!h.start_date || h.start_date <= selectedDay) &&
          (!h.end_date || selectedDay <= h.end_date)
      )
    : [];
  const selectedDone = selectedDay
    ? selectedScheduled.filter((h) => dayDone.includes(h.id))
    : [];
  const selectedMissed = selectedDay
    ? selectedScheduled.filter((h) => !dayDone.includes(h.id))
    : [];
  const selectedOff = selectedDay
    ? activeHabits.filter((h) => !selectedScheduled.some((s) => s.id === h.id))
    : [];
  const selectedStat = selectedDay
    ? (report?.periodDays.find((d) => d.date === selectedDay) ?? null)
    : null;

  const ranked = report?.habits.filter((h) => h.scheduled > 0) ?? [];
  const untracked = report?.habits.filter((h) => h.scheduled === 0) ?? [];

  const elapsedDays = report?.days.length ?? 0;
  const distribution: { band: DayBand; label: string; count: number }[] = report
    ? [
        { band: 'complete', label: 'Perfect', count: report.perfectDays },
        { band: 'partial', label: 'Partial', count: report.partialDays },
        { band: 'missed', label: 'Missed', count: report.missedDays },
        { band: 'none', label: 'Nothing scheduled', count: report.noneDays },
      ]
    : [];

  return (
    <div className="px-6 lg:px-8 pt-5 pb-12 max-w-5xl mx-auto animate-fade-in">
      {/* ===== Masthead ===== */}
      <header className="pb-3.5 hairline">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
              Field report
            </p>
            <h1 className="font-display text-[30px] leading-tight text-brand-primary tracking-tight">
              {report ? report.title : '…'}
            </h1>
            <p className="text-[12px] text-brand-primary/65 mt-1 font-medium tracking-wide">
              {daySummary}
            </p>
          </div>

          <div
            className="inline-flex items-center rounded-[6px] border border-brand-line bg-brand-surface/90 p-1 gap-1 shrink-0"
            role="group"
            aria-label="Period navigation"
          >
            <button
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label="Previous period"
              className="h-8 w-8 inline-flex items-center justify-center rounded-[4px] text-brand-primary/50 hover:text-brand-primary hover:bg-brand-warm-brown/15 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-brand-primary/50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goCurrent}
              className={`h-8 px-3 rounded-[4px] text-[11px] uppercase tracking-widest font-medium transition-colors ${
                basis === currentBasis
                  ? 'bg-brand-raised text-brand-primary border border-brand-line'
                  : 'text-brand-primary/60 hover:text-brand-primary hover:bg-brand-warm-brown/15 border border-transparent'
              }`}
            >
              {currentPeriodLabel(kind)}
            </button>
            <button
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label="Next period"
              className="h-8 w-8 inline-flex items-center justify-center rounded-[4px] text-brand-primary/50 hover:text-brand-primary hover:bg-brand-warm-brown/15 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-brand-primary/50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Scope: what kind of report is open ===== */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4">
        <div
          className="inline-flex items-center rounded-[6px] border border-brand-line bg-brand-surface/90 p-1 gap-1"
          role="group"
          aria-label="Report type"
        >
          {(
            [
              { id: 'weekly', label: 'Weekly report' },
              { id: 'monthly', label: 'Monthly report' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => switchMode(t.id)}
              aria-pressed={mode === t.id}
              className={`h-8 px-3.5 rounded-[4px] text-[11px] uppercase tracking-widest font-medium transition-colors ${
                mode === t.id
                  ? 'bg-brand-raised text-brand-primary border border-brand-line'
                  : 'text-brand-primary/50 hover:text-brand-primary hover:bg-brand-warm-brown/15 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {report && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary/35 tabular-nums">
            {formatDateDisplay(report.periodStart, settings.date_format)} →{' '}
            {formatDateDisplay(report.periodEnd, settings.date_format)}
          </p>
        )}
      </div>

      {error ? (
        <div className="panel px-6 py-8 mt-7">
          <h2 className="font-display text-lg text-brand-primary mb-2">
            The record could not be read.
          </h2>
          <p className="text-[12.5px] text-brand-primary/60 break-all">{error}</p>
        </div>
      ) : !report || loading ? (
        <p className="text-[12.5px] text-brand-primary/45 italic mt-7">Reading the record…</p>
      ) : report.isFuture ? (
        <div className="panel px-6 py-8 mt-7">
          <h2 className="font-display text-lg text-brand-primary mb-2">
            This period hasn’t started yet.
          </h2>
          <p className="text-[12.5px] text-brand-primary/60">
            Nothing is recorded ahead of today.
          </p>
        </div>
      ) : !report.hasRecord ? (
        <div className="panel px-6 py-8 mt-7">
          <h2 className="font-display text-lg text-brand-primary mb-2">
            Nothing was scheduled in this period.
          </h2>
          <p className="text-[12.5px] text-brand-primary/60">
            Your record begins on{' '}
            <span className="font-mono tabular-nums">
              {formatDateDisplay(earliestDate, settings.date_format)}
            </span>
            . Use the arrows above to come back to the present.
          </p>
        </div>
      ) : (
        <>
          {/* ===== The record ===== */}
          <section className="mt-7">
            <SectionRule
              label="The record"
              note={`${scheduled} scheduled · ${report.missed} missed`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] gap-x-10 gap-y-7 pt-5 items-start">
              <div>
                <p className="flex items-baseline gap-1.5">
                  <span className={`font-display text-[58px] leading-none tabular-nums ${overallTone.text}`}>
                    {report.rate}
                  </span>
                  <span className="text-[22px] text-brand-primary/30 leading-none">%</span>
                </p>
                <p className="section-label mt-2.5">Scheduled habits kept</p>
                <Delta change={report.change} kind={report.kind} />
                <span className="mt-3 block h-[3px] w-full bg-brand-line/70 overflow-hidden">
                  <span
                    className={`block h-full transition-[width] duration-500 ${overallTone.rule}`}
                    style={{ width: `${report.rate}%` }}
                  />
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
                <Stat label="Perfect days" value={report.perfectDays} tone="text-brand-olive" />
                <Stat label="Partial days" value={report.partialDays} tone="text-brand-mustard" />
                <Stat label="Missed days" value={report.missedDays} tone="text-brand-burnt-orange" />
                <Stat label="Days logged" value={report.loggedDays} tone="text-brand-sage" />
                <Stat label="Completions" value={report.completed} tone="text-brand-primary" />
                <Stat
                  label="Best run"
                  value={report.bestRun > 0 ? `${report.bestRun}d` : '—'}
                  tone="text-brand-olive"
                />
              </div>
            </div>
          </section>

          {/* ===== Completion trend ===== */}
          <section className="mt-9">
            <SectionRule
              label="Completion trend"
              note={
                report.kind === 'weekly'
                  ? `${report.periodDays.length} days · ${weekStart === 'monday' ? 'Mon–Sun' : 'Sun–Sat'}`
                  : `${report.days.length} of ${report.totalDays} days elapsed`
              }
            />
            <div className="pt-5">
              <TrendChart
                report={report}
                weekStart={weekStart}
                dateFormat={settings.date_format}
                selectedDay={selectedDay}
                onSelectDay={(date) => setSelectedDay(date === selectedDay ? null : date)}
              />
            </div>

            {/* The day you clicked, opened in place rather than in a modal */}
            {selectedDay && selectedStat ? (
              <div className="mt-5 border border-brand-line/70 rounded-sm bg-brand-surface/50 px-4 py-3.5 animate-fade-in">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary/45 tabular-nums">
                    {getDayName(selectedDay, true)} ·{' '}
                    {formatDateDisplay(selectedDay, settings.date_format)}
                    {selectedStat.isToday && (
                      <span className="text-brand-burnt-orange"> · today</span>
                    )}
                  </p>
                  <p className="flex items-baseline gap-1.5">
                    <span className={`font-display text-[17px] leading-none tabular-nums ${BAND[selectedStat.band].text}`}>
                      {selectedStat.completed}
                    </span>
                    <span className="text-[12px] text-brand-primary/45 tabular-nums">
                      / {selectedStat.scheduled} completed
                    </span>
                    {selectedStat.scheduled > 0 && (
                      <span className={`ml-2 text-[11.5px] tabular-nums ${BAND[selectedStat.band].text}`}>
                        {selectedStat.pct}%
                      </span>
                    )}
                  </p>
                </div>

                {selectedStat.scheduled === 0 ? (
                  <p className="text-[12px] text-brand-primary/55 mt-2.5">
                    Nothing was scheduled for this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1 mt-3 pt-3 border-t border-brand-line/50">
                    <div>
                      <p className="section-label flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-olive shrink-0" />
                        Completed · {selectedDone.length}
                      </p>
                      {selectedDone.map((h) => (
                        <RecordRow key={h.id} state="done" name={h.name} />
                      ))}
                      {selectedDone.length === 0 && (
                        <p className="text-[11.5px] text-brand-primary/35 italic py-1.5">None</p>
                      )}
                    </div>
                    <div>
                      <p className="section-label flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-burnt-orange shrink-0" />
                        Missed · {selectedMissed.length}
                      </p>
                      {selectedMissed.map((h) => (
                        <RecordRow key={h.id} state="missed" name={h.name} />
                      ))}
                      {selectedMissed.length === 0 && (
                        <p className="text-[11.5px] text-brand-primary/35 italic py-1.5">None</p>
                      )}
                    </div>
                    <div>
                      <p className="section-label flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-warm-brown shrink-0" />
                        Not scheduled · {selectedOff.length}
                      </p>
                      {selectedOff.map((h) => (
                        <RecordRow key={h.id} state="off" name={h.name} />
                      ))}
                      {selectedOff.length === 0 && (
                        <p className="text-[11.5px] text-brand-primary/35 italic py-1.5">None</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-[11.5px] text-brand-primary/35 italic">
                Select a day in the trend to open its record.
              </p>
            )}
          </section>

          {/* ===== Habit consistency + distribution ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-9 mt-9">
            <section className="lg:col-span-2 min-w-0">
              <SectionRule
                label="Habit consistency"
                note={ranked.length > 0 ? `${ranked.length} tracked` : undefined}
              />

              {ranked.length === 0 ? (
                <p className="text-[12.5px] text-brand-primary/55 mt-4">
                  No habit was scheduled in this period.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-brand-line/40">
                  {ranked.map((h) => (
                    <HabitLine key={h.id} habit={h} />
                  ))}
                </ul>
              )}

              {untracked.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-brand-line/50">
                  <p className="section-label">Never due in this period · {untracked.length}</p>
                  <ul className="mt-1 divide-y divide-brand-line/30">
                    {untracked.map((h) => (
                      <HabitLine key={h.id} habit={h} dim />
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3.5 text-[10.5px] text-brand-primary/35">
                Rate is completed ÷ scheduled occurrences. A habit only counts from the day
                it was created.
              </p>
            </section>

            <section className="min-w-0">
              <SectionRule label="The distribution" />

              {elapsedDays === 0 ? (
                <p className="text-[12.5px] text-brand-primary/55 mt-4">
                  No elapsed days in this period.
                </p>
              ) : (
                <>
                  {/* One bar, four meanings: how the elapsed days were spent */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-[2px] mt-4">
                    {distribution.map((d) =>
                      d.count > 0 ? (
                        <span
                          key={d.band}
                          className={BAND[d.band].swatch}
                          style={{ width: `${(d.count / elapsedDays) * 100}%` }}
                          title={`${d.label}: ${d.count} ${d.count === 1 ? 'day' : 'days'}`}
                        />
                      ) : null
                    )}
                  </div>

                  <ul className="mt-3.5 space-y-1.5">
                    {distribution.map((d) => (
                      <li key={d.band} className="flex items-baseline gap-2.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${BAND[d.band].swatch}`}
                          aria-hidden="true"
                        />
                        <span className="text-[12.5px] text-brand-primary/70 flex-1 truncate">
                          {d.label}
                        </span>
                        <span className="font-mono text-[10.5px] tabular-nums text-brand-primary/35">
                          {elapsedDays > 0 ? Math.round((d.count / elapsedDays) * 100) : 0}%
                        </span>
                        <span
                          className={`font-display text-[15px] w-6 text-right tabular-nums ${BAND[d.band].text}`}
                        >
                          {d.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Facts, not fake insight */}
              <div className="mt-5 pt-4 border-t border-brand-line/50 space-y-2.5">
                {report.bestDay && (
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="section-label">Strongest day</span>
                    <span className="text-[12px] text-brand-olive tabular-nums">
                      {getDayName(report.bestDay.date, true)} {Number(report.bestDay.date.slice(8, 10))}{' '}
                      {report.bestDay.pct}%
                    </span>
                  </p>
                )}
                {report.worstDay && report.missedDays + report.partialDays > 0 && (
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="section-label">Weakest day</span>
                    <span className="text-[12px] text-brand-burnt-orange tabular-nums">
                      {getDayName(report.worstDay.date, true)} {Number(report.worstDay.date.slice(8, 10))}{' '}
                      {report.worstDay.pct}%
                    </span>
                  </p>
                )}
                {report.prevRate !== null && (
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="section-label">Previous period</span>
                    <span className="text-[12px] text-brand-primary/60 tabular-nums">
                      {report.prevRate}% · {report.prevCompleted} kept · {report.prevDays} days
                    </span>
                  </p>
                )}
                <p className="flex items-baseline justify-between gap-3">
                  <span className="section-label">Window</span>
                  <span className="text-[12px] text-brand-primary/60 tabular-nums">
                    {report.elapsedDays} of {report.totalDays} days
                  </span>
                </p>
              </div>
            </section>
          </div>

          {/* ===== Field note ===== */}
          <section className="mt-9 border-t border-brand-line pt-6">
            <div className="flex items-center gap-2">
              <Flame size={13} className="text-brand-burnt-orange" />
              <p className="text-[10px] font-medium tracking-widest2 uppercase text-brand-burnt-orange/80">
                Field note
              </p>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/25">
                {settings.roast_level} tone
              </span>
            </div>

            <p className="font-display italic text-[17px] leading-relaxed text-brand-primary/90 mt-3 max-w-3xl">
              “{report.fieldNote}”
            </p>

            <p className="mt-4 text-[10px] leading-relaxed text-brand-primary/30 max-w-3xl">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand-primary/40 mr-2">
                Method
              </span>
              Only habits scheduled on days that have already happened are counted, completions
              on days a habit wasn’t scheduled are ignored, and archived habits are excluded — so
              these figures match Home, Habits and the Calendar.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
