import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { calculateStreak } from '../utils/streaks';
import type { Habit, HabitFrequency } from '../types';
import {
  today,
  getDayName,
  getMonthName,
  getMonthYear,
  parseDate,
  formatTime,
  formatDateDisplay,
  isHabitScheduledForDay,
} from '../utils/dates';
import { getCompletionsForDate } from '../db/queries';

const CATEGORIES = ['General', 'Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Social', 'Creative'];
const COLORS = ['#B8623A', '#C49A45', '#7B8050', '#879477', '#6F513A'];
const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'specific_days', label: 'Specific Days' },
  { value: 'custom', label: 'Custom' },
];
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  specific_days: 'Specific days',
  custom: 'Custom',
};

interface HabitFormData {
  name: string;
  description: string;
  category: string;
  frequency: HabitFrequency;
  specific_days: number[];
  target_value: number;
  target_unit: string;
  color: string;
  reminder_enabled: boolean;
  reminder_time: string;
  start_date: string;
  end_date: string;
}

const defaultForm: HabitFormData = {
  name: '',
  description: '',
  category: 'General',
  frequency: 'daily',
  specific_days: [],
  target_value: 1,
  target_unit: 'session',
  color: '#B8623A',
  reminder_enabled: false,
  reminder_time: '09:00',
  start_date: today(),
  end_date: '',
};

export default function HabitsPage() {
  const {
    habits,
    archivedHabits,
    loadHabits,
    loadArchivedHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    archiveHabit,
    restoreHabit,
    toggleCompletion,
    settings,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitFormData>(defaultForm);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedStats, setExpandedStats] = useState<Record<string, { current: number; best: number; rate: number; completions: number }>>({});
  // Today's completions — the same source the dashboard reads, so the two stay in step.
  const [todayCompletions, setTodayCompletions] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadHabits();
    loadArchivedHabits();
  }, [loadHabits, loadArchivedHabits]);

  const activeHabits = habits.filter((h) => !h.archived);
  const displayedHabits = showArchived ? archivedHabits : activeHabits;
  const listKey = displayedHabits.map((h) => h.id).join('|');
  const todayDate = today();

  // Per-row streak stats — real data from the streak engine, refreshed whenever the list changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, { current: number; best: number; rate: number; completions: number }> = {};
      for (const h of displayedHabits) {
        try {
          const s = await calculateStreak(h);
          next[h.id] = { current: s.current, best: s.best, rate: s.completion_rate, completions: s.total_completions };
        } catch {
          /* stats unavailable for this habit — row falls back to '—' */
        }
      }
      if (!cancelled) setExpandedStats(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  // Which habits are already done today — drives the checkbox column and the header count.
  useEffect(() => {
    let cancelled = false;
    getCompletionsForDate(todayDate)
      .then((completions) => {
        if (cancelled) return;
        const map = new Map<string, boolean>();
        for (const c of completions) map.set(c.habit_id, c.completed);
        setTodayCompletions(map);
      })
      .catch(() => {
        /* no completion data available — rows just render as not-done */
      });
    return () => {
      cancelled = true;
    };
  }, [todayDate, listKey]);

  const filtered = useMemo(() => displayedHabits.filter((h) => {
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.category.toLowerCase().includes(q);
  }), [displayedHabits, search]);

  const dateObj = parseDate(todayDate);
  const dayName = getDayName(todayDate);
  const dayNum = dateObj.getDate();
  const monthName = getMonthName(todayDate);
  const year = dateObj.getFullYear();
  const dateLabel = `${dayName} · ${dayNum} ${monthName} ${year}`;

  // Today's score, computed from the active list only (archived habits are not scheduled).
  const scheduledToday = activeHabits.filter((h) =>
    isHabitScheduledForDay(h.frequency, h.specific_days, todayDate)
  );
  const scheduledTodayCount = scheduledToday.length;
  const doneTodayCount = scheduledToday.filter((h) => todayCompletions.get(h.id)).length;
  const allDoneToday = scheduledTodayCount > 0 && doneTodayCount === scheduledTodayCount;

  const openCreate = () => {
    setEditingHabit(null);
    setForm(defaultForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setForm({
      name: habit.name,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      specific_days: habit.specific_days,
      target_value: habit.target_value,
      target_unit: habit.target_unit,
      color: habit.color,
      reminder_enabled: habit.reminder_enabled,
      reminder_time: habit.reminder_time,
      start_date: habit.start_date,
      end_date: habit.end_date || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const toggleExpand = (habit: Habit) => {
    setExpandedId((cur) => (cur === habit.id ? null : habit.id));
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setFormError('Habit name is required.');
      return false;
    }
    if (form.frequency === 'specific_days' && form.specific_days.length === 0) {
      setFormError('Pick at least one day for a specific-days schedule.');
      return false;
    }
    if (form.target_value < 1) {
      setFormError('Target value must be at least 1.');
      return false;
    }
    if (!form.start_date) {
      setFormError('Start date is required.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: '',
        category: form.category,
        frequency: form.frequency,
        specific_days: form.specific_days,
        target_value: form.target_value,
        target_unit: form.target_unit,
        color: form.color,
        reminder_enabled: form.reminder_enabled,
        reminder_time: form.reminder_time,
        start_date: form.start_date,
        end_date: form.end_date || null,
      };

      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
      } else {
        await createHabit(data);
      }
      setShowForm(false);
      await loadHabits();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Failed to save habit:', e);
      setFormError(`Failed to save habit: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit(id);
      setDeleteConfirm(null);
      await loadHabits();
      await loadArchivedHabits();
    } catch (e) {
      console.error('Failed to delete habit:', e);
    }
  };

  // Completing from here keeps the checkbox, the streak column and the header count honest.
  const handleToggle = async (habit: Habit) => {
    try {
      const completed = await toggleCompletion(habit.id, todayDate);
      setTodayCompletions((prev) => {
        const next = new Map(prev);
        next.set(habit.id, completed);
        return next;
      });
      const streak = await calculateStreak(habit);
      setExpandedStats((prev) => ({
        ...prev,
        [habit.id]: {
          current: streak.current,
          best: streak.best,
          rate: streak.completion_rate,
          completions: streak.total_completions,
        },
      }));
    } catch (e) {
      console.error('Failed to toggle habit completion:', e);
    }
  };

  // Archiving/restoring also refreshes the archive list, so the two views stay consistent.
  const handleArchive = async (habit: Habit) => {
    try {
      await archiveHabit(habit.id);
      await loadArchivedHabits();
    } catch (e) {
      console.error('Failed to archive habit:', e);
    }
  };

  const handleRestore = async (habit: Habit) => {
    try {
      await restoreHabit(habit.id);
      await loadArchivedHabits();
    } catch (e) {
      console.error('Failed to restore habit:', e);
    }
  };

  return (
    <div className="px-6 lg:px-8 pt-5 pb-10 max-w-4xl mx-auto animate-fade-in">
      {/* ===== Page header — editorial masthead ===== */}
      <header className="pb-3.5 hairline">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
              {dateLabel}
            </p>
            <h1 className="font-display text-[30px] leading-tight text-brand-primary tracking-tight">Habits</h1>
            <p className="text-[12px] text-brand-primary/65 mt-1 font-medium tracking-wide">
              {activeHabits.length === 0
                ? 'Nothing catalogued yet.'
                : (
                  <>
                    <span>{activeHabits.length} active</span>
                    {archivedHabits.length > 0 && (
                      <>
                        <span className="text-brand-primary/30 mx-1">·</span>
                        <span className="text-brand-primary/45">{archivedHabits.length} archived</span>
                      </>
                    )}
                  </>
                )}
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {/* today's score — the one number that makes this page actionable */}
            {scheduledTodayCount > 0 && (
              <div className="text-right">
                <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55">Today</p>
                <p className="mt-1 flex items-baseline justify-end gap-1.5">
                  <span
                    className={`font-display text-[22px] leading-none tabular-nums font-semibold ${
                      allDoneToday ? 'text-brand-olive' : 'text-brand-burnt-orange'
                    }`}
                  >
                    {doneTodayCount}
                  </span>
                  <span className="text-[12.5px] text-brand-primary/45 tabular-nums font-medium">/ {scheduledTodayCount}</span>
                </p>
                <span className="mt-2 ml-auto block h-[3px] w-[72px] rounded-full bg-brand-line/80 overflow-hidden">
                  <span
                    className="block h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.round((doneTodayCount / scheduledTodayCount) * 100)}%`,
                      backgroundColor: allDoneToday ? '#7B8050' : '#B8623A',
                    }}
                  />
                </span>
              </div>
            )}
            <button onClick={openCreate} className="btn-primary shrink-0">
              <Plus size={15} />
              New Habit
            </button>
          </div>
        </div>
      </header>

      {/* ===== Search + list switch — one quiet toolbar ===== */}
      <div className="flex items-center gap-3 mt-3.5">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search habits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9 py-1.5 text-[13px] bg-brand-surface/60 border-brand-line hover:border-brand-line/90 focus:border-brand-burnt-orange/80 placeholder:text-brand-primary/35"
          />
        </div>

        {/* active and archived are two views of one ledger, so they read as one control */}
        <div
          className="ml-auto inline-flex items-center rounded-[6px] border border-brand-line bg-brand-surface/90 p-1 shrink-0 gap-1"
          role="group"
          aria-label="Which habits to show"
        >
          <ListSwitch
            label="Active"
            count={activeHabits.length}
            active={!showArchived}
            onClick={() => setShowArchived(false)}
          />
          <ListSwitch
            label="Archived"
            count={archivedHabits.length}
            active={showArchived}
            onClick={() => setShowArchived(true)}
          />
        </div>
      </div>

      {showArchived && (
        <p className="text-[12px] text-brand-primary/55 mt-3.5 bg-brand-surface/40 border border-brand-line/40 px-3 py-2 rounded-md">
          Retired habits keep their history and stay out of today’s list. Restore one to bring it back.
        </p>
      )}

      {/* ===== List — ledger rows, no card-per-habit ===== */}
      {filtered.length === 0 ? (
        search ? (
          <p className="py-14 text-sm italic text-brand-primary/55 text-center">
            Nothing in the record matches “{search}”.
          </p>
        ) : showArchived ? (
          <p className="py-14 text-sm italic text-brand-primary/55 text-center">
            The archive is empty. Extinct things would appear here.
          </p>
        ) : (
          <EmptyState
            title="Your first footprint"
            message="Time to create your first habit. Even the dinosaurs started somewhere."
            action={
              <button onClick={openCreate} className="btn-primary">
                Create your first habit
              </button>
            }
          />
        )
      ) : (
        <div className="border-t border-brand-line/80 mt-3 divide-y divide-brand-line/50">
          {filtered.map((habit) => {
            const isExpanded = expandedId === habit.id;
            const stats = expandedStats[habit.id];
            const isScheduledToday = isHabitScheduledForDay(habit.frequency, habit.specific_days, todayDate);
            const done = !habit.archived && isScheduledToday && !!todayCompletions.get(habit.id);
            const scheduleLabel = habit.frequency === 'specific_days' && habit.specific_days.length > 0
              ? habit.specific_days.map((d) => WEEKDAY_NAMES[d]).join(' · ')
              : FREQUENCY_LABELS[habit.frequency] || habit.frequency;

            return (
              <div key={habit.id} className="transition-colors">
                <div
                  className={`group grid grid-cols-[22px_minmax(0,1fr)_7.5rem_92px_28px] items-center gap-x-3 px-2 py-2.5 transition-all duration-150 ${
                    isExpanded ? 'bg-brand-surface/80' : 'hover:bg-brand-surface/50'
                  }`}
                >
                  {/* Completion — tactile checkbox with subtle surface background */}
                  {habit.archived ? (
                    <span className="w-[20px] h-[20px]" aria-hidden="true" />
                  ) : isScheduledToday ? (
                    <button
                      onClick={() => handleToggle(habit)}
                      aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'} for today`}
                      aria-pressed={done}
                      title={done ? 'Done today — click to undo' : 'Mark as done today'}
                      className={`w-[20px] h-[20px] rounded-[4px] border flex items-center justify-center shrink-0 transition-all duration-150 ${
                        done
                          ? 'bg-brand-olive border-brand-olive text-[#F5EDDA] shadow-sm'
                          : 'bg-brand-surface border-brand-primary/35 hover:border-brand-burnt-orange/70 hover:bg-brand-raised text-transparent'
                      }`}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                    </button>
                  ) : (
                    <span
                      className="w-[20px] h-[20px] flex items-center justify-center text-[15px] font-bold leading-none text-brand-primary/30"
                      title="Not scheduled today"
                      aria-label="Not scheduled today"
                    >
                      ·
                    </span>
                  )}

                  {/* Name first, then only the metadata that belongs to it */}
                  <button
                    onClick={() => toggleExpand(habit)}
                    aria-expanded={isExpanded}
                    title={habit.name}
                    className="min-w-0 text-left cursor-pointer"
                  >
                    <p
                      className={`font-display text-[16px] leading-snug truncate transition-colors duration-200 ${
                        done
                          ? 'text-brand-primary/50 line-through decoration-brand-olive/60'
                          : habit.archived
                          ? 'text-brand-primary/55'
                          : 'text-brand-primary font-normal'
                      }`}
                    >
                      {habit.name}
                    </p>
                    <p className="text-[11.5px] mt-1 truncate flex items-center gap-1.5 flex-wrap">
                      {habit.archived ? (
                        <>
                          <span className="text-brand-primary/55 font-medium">
                            {habit.archived_at
                              ? `Archived ${formatDateDisplay(habit.archived_at.slice(0, 10), settings.date_format)}`
                              : 'Archived'}
                          </span>
                          <span className="text-brand-primary/35">·</span>
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-brand-primary/55 bg-brand-warm-brown/20 px-1.5 py-0.5 rounded">
                            {habit.category}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-brand-primary/70 font-medium">{scheduleLabel}</span>
                          {habit.reminder_enabled && (
                            <>
                              <span className="text-brand-primary/35">·</span>
                              <span className="text-brand-mustard font-medium tabular-nums">
                                {formatTime(habit.reminder_time, settings.time_format)}
                              </span>
                            </>
                          )}
                          <span className="text-brand-primary/35">·</span>
                          <span className="text-[9.5px] uppercase tracking-wider font-semibold text-brand-primary/55 bg-brand-warm-brown/20 px-1.5 py-0.5 rounded">
                            {habit.category}
                          </span>
                        </>
                      )}
                    </p>
                  </button>

                  {/* Streak — prominent ember highlight for active streaks */}
                  <div className="text-right">
                    {!habit.archived && (
                      <span
                        className={`text-[12.5px] tabular-nums ${
                          stats && stats.current > 0
                            ? 'font-medium text-brand-burnt-orange/95'
                            : 'text-brand-primary/30'
                        }`}
                        title={stats ? `${stats.rate}% completion rate · ${stats.completions} completions` : undefined}
                      >
                        {stats && stats.current > 0 ? `${stats.current}-day streak` : '—'}
                      </span>
                    )}
                  </div>

                  {/* Row actions — on hover or keyboard focus only, width reserved so nothing shifts */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {habit.archived ? (
                      <RowAction
                        onClick={() => handleRestore(habit)}
                        label={`Restore ${habit.name}`}
                        icon={<ArchiveRestore size={15} />}
                        hover="hover:text-brand-olive hover:bg-brand-olive/15"
                      />
                    ) : (
                      <>
                        <RowAction onClick={() => openEdit(habit)} label={`Edit ${habit.name}`} icon={<Pencil size={14} />} hover="hover:text-brand-mustard hover:bg-brand-mustard/15" />
                        <RowAction onClick={() => handleArchive(habit)} label={`Archive ${habit.name}`} icon={<Archive size={14} />} hover="hover:text-brand-sage hover:bg-brand-sage/15" />
                        <RowAction onClick={() => setDeleteConfirm(habit.id)} label={`Delete ${habit.name}`} icon={<Trash2 size={14} />} hover="hover:text-brand-danger hover:bg-brand-danger/15" />
                      </>
                    )}
                  </div>

                  {/* Disclosure — always visible, so every row reads as expandable */}
                  <button
                    onClick={() => toggleExpand(habit)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Collapse ${habit.name} details` : `Show ${habit.name} details`}
                    className={`w-7 h-7 flex items-center justify-center rounded-[4px] border transition-colors justify-self-end ${
                      isExpanded
                        ? 'text-brand-primary border-brand-line bg-brand-warm-brown/25'
                        : 'text-brand-primary/40 border-brand-line/40 hover:text-brand-primary hover:border-brand-line hover:bg-brand-warm-brown/15'
                    }`}
                  >
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Expanded detail — real stats from the streak engine in framed cardlets */}
                {isExpanded && (
                  <div className="pl-[38px] pr-4 pb-5 pt-3.5 bg-brand-surface/40 border-t border-brand-line/60 animate-fade-in">
                    {habit.description && (
                      <p className="text-[13px] text-brand-primary/75 leading-relaxed max-w-2xl mb-3.5 italic">
                        “{habit.description}”
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailStat label="Current streak" value={stats ? `${stats.current} days` : '—'} />
                      <DetailStat label="Best streak" value={stats ? `${stats.best} days` : '—'} />
                      <DetailStat label="Completion rate" value={stats ? `${stats.rate}%` : '—'} />
                      <DetailStat label="Completions" value={stats ? String(stats.completions) : '—'} />
                    </div>
                    <p className="text-[11px] text-brand-primary/50 mt-3.5 tracking-wide">
                      {scheduleLabel}
                      {' · '}{habit.category}
                      {' · '}{habit.start_date}
                      {habit.end_date ? ` → ${habit.end_date}` : ' · ongoing'}
                      {' · target '}{habit.target_value} {habit.target_unit}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Create/Edit Modal ===== */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingHabit ? 'Edit habit' : 'New habit'}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {formError && (
            <div className="px-3 py-2.5 bg-brand-danger/10 border border-brand-danger/30 rounded-md text-sm text-brand-danger">
              {formError}
            </div>
          )}

          {/* Identity */}
          <fieldset className="space-y-4">
            <legend className="section-label mb-3">The habit</legend>
            <div>
              <label className="label" htmlFor="habit-name">Name *</label>
              <input
                id="habit-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Morning run"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="habit-desc">Description</label>
              <input
                id="habit-desc"
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional — what does keeping this look like?"
                className="input"
              />
            </div>
          </fieldset>

          {/* Schedule */}
          <fieldset className="space-y-4 pt-1">
            <legend className="section-label mb-3">Schedule</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="habit-freq">Frequency *</label>
                <select
                  id="habit-freq"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as HabitFrequency })}
                  className="select"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="habit-cat">Category</label>
                <select
                  id="habit-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.frequency === 'specific_days' && (
              <div>
                <span className="label">Days</span>
                <div className="flex gap-1.5">
                  {WEEKDAY_NAMES.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={form.specific_days.includes(i)}
                      onClick={() => {
                        const days = form.specific_days.includes(i)
                          ? form.specific_days.filter((d) => d !== i)
                          : [...form.specific_days, i];
                        setForm({ ...form, specific_days: days });
                      }}
                      className={`w-10 h-9 rounded-[4px] text-[11px] font-medium uppercase tracking-wide border transition-colors ${
                        form.specific_days.includes(i)
                          ? 'bg-brand-burnt-orange/15 text-brand-burnt-orange border-brand-burnt-orange/40'
                          : 'bg-transparent text-brand-primary/40 border-brand-line hover:border-brand-warm-brown/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="habit-target">Target *</label>
                <input
                  id="habit-target"
                  type="number"
                  min={1}
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="habit-unit">Unit</label>
                <input
                  id="habit-unit"
                  type="text"
                  value={form.target_unit}
                  onChange={(e) => setForm({ ...form, target_unit: e.target.value })}
                  placeholder="e.g. minutes, pages"
                  className="input"
                />
              </div>
            </div>
          </fieldset>

          {/* Accent colour */}
          <fieldset className="pt-1">
            <legend className="section-label mb-3">Accent</legend>
            <div className="flex gap-2.5">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use ${color} as accent colour`}
                  aria-pressed={form.color === color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-brand-primary/60 ring-offset-2 ring-offset-brand-surface' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </fieldset>

          {/* Reminder */}
          <fieldset className="pt-1">
            <legend className="section-label mb-3">Reminder</legend>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-brand-primary/80">Enable reminder</span>
                <p className="text-[11px] text-brand-primary/35 mt-0.5">A nudge at the scheduled time</p>
              </div>
              <Switch checked={form.reminder_enabled} onChange={(v) => setForm({ ...form, reminder_enabled: v })} label="Enable reminder" />
            </div>
            {form.reminder_enabled && (
              <div className="mt-4">
                <label className="label" htmlFor="habit-remtime">Reminder time</label>
                <input
                  id="habit-remtime"
                  type="time"
                  value={form.reminder_time}
                  onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
                  className="input max-w-[160px]"
                />
              </div>
            )}
          </fieldset>

          {/* Dates */}
          <fieldset className="pt-1">
            <legend className="section-label mb-3">Timeline</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="habit-start">Start date *</label>
                <input
                  id="habit-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="habit-end">End date (optional)</label>
                <input
                  id="habit-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-line/60">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Delete Confirmation ===== */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete habit"
        size="sm"
      >
        <div className="py-3">
          <p className="text-brand-primary/75 text-sm leading-relaxed">
            This will permanently delete this habit and all its data.
          </p>
          <p className="text-brand-primary/45 text-xs mt-2">
            Consider archiving instead — that preserves your history.
          </p>
          <p className="text-brand-burnt-orange/60 text-xs mt-3 italic">
            “This one is going extinct.”
          </p>
          <div className="flex justify-end gap-3 mt-7 pt-4 border-t border-brand-line/60">
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="btn-danger"
            >
              Delete Forever
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ListSwitch({ label, count, active, onClick }: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 px-3 rounded-[4px] text-[11px] uppercase tracking-widest font-medium inline-flex items-center gap-2 transition-all duration-150 ${
        active
          ? 'bg-brand-raised text-brand-primary border border-brand-line shadow-sm'
          : 'text-brand-primary/50 hover:text-brand-primary hover:bg-brand-warm-brown/15 border border-transparent'
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-tight ${
          active
            ? 'bg-brand-burnt-orange/25 text-brand-burnt-orange border border-brand-burnt-orange/30'
            : 'bg-brand-line/50 text-brand-primary/40'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RowAction({ onClick, label, icon, hover }: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  hover: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 text-brand-primary/50 rounded-[4px] border border-transparent transition-colors ${hover}`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`w-10 h-[22px] rounded-full border transition-colors shrink-0 ${
        checked ? 'bg-brand-burnt-orange/90 border-brand-burnt-orange' : 'bg-brand-bg border-brand-line'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full transition-transform ${
          checked ? 'bg-[#F5EDDA] translate-x-[21px]' : 'bg-brand-primary/40 translate-x-[3px]'
        }`}
      />
    </button>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-surface/80 border border-brand-line/70 rounded-[5px] p-2.5">
      <div className="text-[9.5px] uppercase tracking-widest text-brand-primary/50 font-medium">{label}</div>
      <div className="font-display text-[17px] text-brand-primary mt-1 tabular-nums font-medium">{value}</div>
    </div>
  );
}
