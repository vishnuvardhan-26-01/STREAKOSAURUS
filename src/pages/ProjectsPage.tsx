import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Archive,
  Check,
  ChevronLeft,
  CornerDownRight,
  Link2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  getAllProjectHabitLinks,
  getAllProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectNotes,
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  linkHabitToProject,
  unlinkHabitFromProject,
} from '../db/queries';
import { formatDate, formatDateDisplay, formatRelative, isHabitScheduledForDay, today } from '../utils/dates';
import type {
  Habit,
  Project,
  ProjectHabitLink,
  ProjectNote,
  ProjectStatus,
  ProjectTask,
} from '../types';

// ============================================================
// Colour = meaning (V2). A project's state takes the palette slot that
// matches it, and nothing else on the page is coloured:
//   mustard      → active work (attention is on it)
//   sage         → paused: held, not abandoned
//   olive        → complete / healthy progress
//   warm brown   → archived: historical, off the bench
// ============================================================

const STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  active: { label: 'Active', tone: 'text-brand-mustard' },
  paused: { label: 'Paused', tone: 'text-brand-sage' },
  completed: { label: 'Complete', tone: 'text-brand-olive' },
  archived: { label: 'Archived', tone: 'text-brand-primary/40' },
};

const STATUS_ORDER: ProjectStatus[] = ['active', 'paused', 'completed', 'archived'];

const AND = 'text-brand-primary/25 select-none';

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  specific_days: 'Specific days',
  custom: 'Custom',
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * created_at / updated_at are stored as UTC ISO strings; every date this page
 * shows has to be the local calendar date, or a late-evening save would read as
 * yesterday.
 */
function localDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : formatDate(d);
}

/** Scheduling label for a habit, matching the Habits page wording. */
function scheduleLabel(habit: Habit): string {
  if (habit.frequency === 'specific_days' && habit.specific_days.length > 0) {
    return habit.specific_days.map((d) => WEEKDAY_NAMES[d]).join(' · ');
  }
  return FREQUENCY_LABELS[habit.frequency] || habit.frequency;
}

// ------------------------------------------------------------
// Small presentational pieces (flat — a ledger, not a dashboard)
// ------------------------------------------------------------

function SectionRule({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-brand-line/70 pb-2">
      <h2 className="text-[10px] font-medium tracking-widest2 uppercase text-brand-primary/45">{label}</h2>
      {note && (
        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/30 truncate">{note}</p>
      )}
    </div>
  );
}

function RowAction({
  onClick,
  label,
  icon,
  hover,
}: {
  onClick: () => void;
  label: string;
  icon: ReactNode;
  hover: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-[4px] text-brand-primary/40 transition-colors ${hover}`}
    >
      {icon}
    </button>
  );
}

/** Progress rule — the only thing carrying completion colour inside a row. */
function ProgressRule({ done, total, width = 150 }: { done: number; total: number; width?: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <span
      className="h-[3px] rounded-full bg-brand-line/70 overflow-hidden shrink-0"
      style={{ width }}
      aria-hidden="true"
    >
      <span
        className="block h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#7B8050' : '#C49A45' }}
      />
    </span>
  );
}

export default function ProjectsPage() {
  const {
    projects,
    habits,
    settings,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setPage,
  } = useStore();

  const todayStr = today();

  // --- view state ---
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The project you last opened stays marked in the list, so returning to it
  // shows where you were rather than an anonymous set of rows.
  const [markedId, setMarkedId] = useState<string | null>(null);

  // --- data ---
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [links, setLinks] = useState<ProjectHabitLink[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);

  // --- drafts / inline edits ---
  const [taskDraft, setTaskDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEditDraft, setTaskEditDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState('');

  // --- modals ---
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', firstTask: '' });
  const [formHabits, setFormHabits] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  /**
   * Tasks and habit links are read once for the whole page: every row shows
   * progress and habit names, so reading per project would be N+1 queries.
   */
  const reloadBoards = useCallback(async () => {
    const [t, l] = await Promise.all([getAllProjectTasks(), getAllProjectHabitLinks()]);
    setTasks(t);
    setLinks(l);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([loadProjects(), reloadBoards()])
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadProjects, reloadBoards]);

  // Notes belong to a single project, so they load when the selection changes.
  // (That effect does not depend on state it writes, so it cannot re-trigger.)
  useEffect(() => {
    if (!selectedId) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    getProjectNotes(selectedId)
      .then((n) => {
        if (!cancelled) setNotes(n);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // ----------------------------------------------------------
  // Derived
  // ----------------------------------------------------------

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const p of projects) map.set(p.id, { total: 0, done: 0 });
    for (const t of tasks) {
      const s = map.get(t.project_id);
      if (!s) continue;
      s.total += 1;
      if (t.completed) s.done += 1;
    }
    return map;
  }, [projects, tasks]);

  const habitsById = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

  const linksByProject = useMemo(() => {
    const map = new Map<string, ProjectHabitLink[]>();
    for (const l of links) {
      const list = map.get(l.project_id) ?? [];
      list.push(l);
      map.set(l.project_id, list);
    }
    return map;
  }, [links]);

  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => p.status === 'active' || p.status === 'paused')
        .sort((a, b) =>
          a.status === b.status
            ? b.updated_at.localeCompare(a.updated_at)
            : a.status === 'active'
              ? -1
              : 1
        ),
    [projects]
  );

  const archivedProjects = useMemo(
    () =>
      projects
        .filter((p) => p.status === 'completed' || p.status === 'archived')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [projects]
  );

  const shown = tab === 'active' ? activeProjects : archivedProjects;

  const selected = selectedId ? projects.find((p) => p.id === selectedId) ?? null : null;
  const selectedStats = (selected && stats.get(selected.id)) || { total: 0, done: 0 };
  const selectedTasks = useMemo(
    () => (selected ? tasks.filter((t) => t.project_id === selected.id) : []),
    [tasks, selected]
  );
  const openTasks = selectedTasks.filter((t) => !t.completed);
  const doneTasks = selectedTasks.filter((t) => t.completed);
  const selectedLinks = selected ? linksByProject.get(selected.id) ?? [] : [];
  const linkedHabits = selectedLinks
    .map((l) => habitsById.get(l.habit_id))
    .filter((h): h is Habit => !!h);
  const linkableHabits = habits.filter((h) => !selectedLinks.some((l) => l.habit_id === h.id));

  const totalDone = tasks.filter((t) => t.completed).length;

  // ----------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', firstTask: '' });
    setFormHabits([]);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({ name: project.name, description: project.description, firstTask: '' });
    setFormHabits([]);
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!form.name.trim()) {
      setFormError('A project needs a name.');
      return;
    }
    setFormError('');
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
      } else {
        const created = await createProject({
          name: form.name.trim(),
          description: form.description.trim(),
          status: 'active',
          color: '#B8623A',
          idea_id: null,
        });
        if (created) {
          if (form.firstTask.trim()) await createProjectTask(created.id, form.firstTask.trim());
          for (const habitId of formHabits) await linkHabitToProject(created.id, habitId);
          await reloadBoards();
          setMarkedId(created.id);
          setSelectedId(created.id);
        }
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleStatus = async (project: Project, status: ProjectStatus) => {
    await updateProject(project.id, { status });
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirm) return;
    await deleteProject(deleteConfirm.id);
    setSelectedId(null);
    if (markedId === deleteConfirm.id) setMarkedId(null);
    setDeleteConfirm(null);
    await reloadBoards();
  };

  const handleAddTask = async () => {
    if (!selected || !taskDraft.trim()) return;
    const created = await createProjectTask(selected.id, taskDraft.trim());
    setTasks((prev) => [...prev, created]);
    setTaskDraft('');
  };

  const handleToggleTask = async (task: ProjectTask) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    await updateProjectTask(task.id, { completed: !task.completed });
  };

  const handleRenameTask = async (task: ProjectTask) => {
    const title = taskEditDraft.trim();
    setEditingTaskId(null);
    if (!title || title === task.title) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title } : t)));
    await updateProjectTask(task.id, { title });
  };

  const handleDeleteTask = async (task: ProjectTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await deleteProjectTask(task.id);
  };

  const handleAddNote = async () => {
    if (!selected || !noteDraft.trim()) return;
    const created = await createProjectNote(selected.id, noteDraft.trim());
    setNotes((prev) => [created, ...prev]);
    setNoteDraft('');
  };

  const handleSaveNote = async (note: ProjectNote) => {
    const content = noteEditDraft.trim();
    setEditingNoteId(null);
    if (!content || content === note.content) return;
    const updatedAt = new Date().toISOString();
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, content, updated_at: updatedAt } : n)));
    await updateProjectNote(note.id, content);
  };

  const handleDeleteNote = async (note: ProjectNote) => {
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await deleteProjectNote(note.id);
  };

  const handleLinkHabit = async (habitId: string) => {
    if (!selected || !habitId) return;
    const link = await linkHabitToProject(selected.id, habitId);
    if (link) setLinks((prev) => [...prev, link]);
  };

  const handleUnlinkHabit = async (link: ProjectHabitLink) => {
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    await unlinkHabitFromProject(link.id);
  };

  // ----------------------------------------------------------
  // Modals (shared by both views)
  // ----------------------------------------------------------

  const formModal = (
    <Modal
      isOpen={formOpen}
      onClose={() => setFormOpen(false)}
      title={editingProject ? 'Edit project' : 'New project'}
      size="sm"
    >
      <div className="space-y-4">
        {formError && (
          <div className="px-3 py-2 bg-brand-danger/10 border border-brand-danger/30 rounded-md text-sm text-brand-danger">
            {formError}
          </div>
        )}
        <div>
          <label className="label" htmlFor="project-name">
            Name *
          </label>
          <input
            id="project-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitForm()}
            placeholder="e.g. Build CHUNGS"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="project-description">
            Description
          </label>
          <input
            id="project-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitForm()}
            placeholder="What is this project?"
            className="input"
          />
        </div>
        {!editingProject && (
          <>
            <div>
              <label className="label" htmlFor="project-first-task">
                First task (optional)
              </label>
              <input
                id="project-first-task"
                value={form.firstTask}
                onChange={(e) => setForm({ ...form, firstTask: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitForm()}
                placeholder="The next concrete step"
                className="input"
              />
            </div>
            {habits.length > 0 && (
              <div>
                <label className="label">Connect habits (optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {habits.map((h) => {
                    const on = formHabits.includes(h.id);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setFormHabits((prev) => (on ? prev.filter((id) => id !== h.id) : [...prev, h.id]))
                        }
                        className={`px-2.5 py-1 rounded-[4px] text-[11.5px] border transition-colors ${
                          on
                            ? 'border-brand-olive/60 bg-brand-olive/15 text-brand-primary'
                            : 'border-brand-line text-brand-primary/60 hover:border-brand-warm-brown/60'
                        }`}
                      >
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => setFormOpen(false)} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleSubmitForm} className="btn-primary">
            {editingProject ? 'Save project' : 'Create project'}
          </button>
        </div>
      </div>
    </Modal>
  );

  const deleteModal = (
    <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete project" size="sm">
      <div className="text-center py-2">
        <p className="text-sm text-brand-primary/70 mb-6">
          Delete “{deleteConfirm?.name}”, its tasks, its notes and its habit connections? This cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleDeleteProject} className="btn-danger">
            Delete project
          </button>
        </div>
      </div>
    </Modal>
  );

  // ----------------------------------------------------------
  // Dossier view
  // ----------------------------------------------------------

  if (selected) {
    const pct = selectedStats.total > 0 ? Math.round((selectedStats.done / selectedStats.total) * 100) : 0;
    const remaining = selectedStats.total - selectedStats.done;
    const retired = selected.status === 'archived' || selected.status === 'completed';

    return (
      <div className="px-6 lg:px-8 pt-5 pb-12 max-w-5xl mx-auto animate-fade-in">
        <button
          onClick={() => setSelectedId(null)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-brand-primary/45 hover:text-brand-primary transition-colors"
        >
          <ChevronLeft size={13} />
          All projects
        </button>

        <header className="mt-2.5 pb-3.5 hairline">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
            <div className="min-w-0">
              <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
                Project dossier
              </p>
              <h1 className="font-display text-[30px] leading-tight text-brand-primary tracking-tight">
                {selected.name}
              </h1>
              {selected.description && (
                <p className="text-[12.5px] text-brand-primary/65 mt-1.5 max-w-2xl leading-relaxed">
                  {selected.description}
                </p>
              )}
              {/* the status lives in the select at the right — repeating it here
                  only said the same thing twice */}
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-primary/35 mt-2 tabular-nums">
                created {formatDateDisplay(localDate(selected.created_at), settings.date_format)}
                {selected.idea_id && (
                  <>
                    <span className={AND}> · </span>
                    <button
                      onClick={() => setPage('ideas')}
                      className="inline-flex items-center gap-1 text-brand-mustard/80 hover:text-brand-mustard normal-case tracking-normal"
                    >
                      <CornerDownRight size={10} />
                      from an idea
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="sr-only" htmlFor="project-status">
                Project status
              </label>
              <select
                id="project-status"
                value={selected.status}
                onChange={(e) => handleStatus(selected, e.target.value as ProjectStatus)}
                className="select !w-auto !py-1.5 !text-[11.5px] !pr-7"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <RowAction
                onClick={() => openEdit(selected)}
                label="Edit project"
                icon={<Pencil size={15} />}
                hover="hover:text-brand-mustard hover:bg-brand-mustard/15"
              />
              <RowAction
                onClick={() => setDeleteConfirm(selected)}
                label="Delete project"
                icon={<Trash2 size={15} />}
                hover="hover:text-brand-danger hover:bg-brand-danger/15"
              />
            </div>
          </div>

          {/* Progress — derived from real tasks, never invented. With no tasks
              the section below says so, so this line stays out of the way. */}
          {selectedStats.total > 0 && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <ProgressRule done={selectedStats.done} total={selectedStats.total} width={180} />
              <span className="font-mono text-[11px] tabular-nums text-brand-primary/65">
                {selectedStats.done} / {selectedStats.total} tasks
              </span>
              <span className={`text-[11.5px] ${remaining === 0 ? 'text-brand-olive' : 'text-brand-primary/45'}`}>
                {remaining === 0 ? 'all done' : `${remaining} remaining`}
              </span>
              <span className="font-mono text-[10px] text-brand-primary/30 tabular-nums">{pct}%</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-8 mt-5">
          {/* ===== Tasks ===== */}
          <section className="lg:col-span-7 min-w-0">
            <SectionRule
              label="Tasks"
              note={selectedStats.total > 0 ? `${selectedStats.done} of ${selectedStats.total} done` : 'empty'}
            />

            <div className="flex items-center gap-2 mt-4">
              <input
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder={selectedStats.total === 0 ? 'Add the first step…' : 'Add a task…'}
                aria-label="New task"
                className="input h-9 py-1.5 text-[13px]"
              />
              <button
                onClick={handleAddTask}
                disabled={!taskDraft.trim()}
                aria-label="Add task"
                className="btn-primary shrink-0 !h-9 !py-0"
              >
                <Plus size={14} />
              </button>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="mt-4 text-[12.5px] italic text-brand-primary/45">
                No tasks yet. A project is only a promise until it has a next step.
              </p>
            ) : (
              <div className="mt-2">
                {[...openTasks, ...doneTasks].map((t) => (
                  <div
                    key={t.id}
                    className="group grid grid-cols-[20px_minmax(0,1fr)_30px] items-center gap-x-3 py-2 border-b border-brand-line/40"
                  >
                    <button
                      onClick={() => handleToggleTask(t)}
                      aria-pressed={t.completed}
                      aria-label={`Mark ${t.title} ${t.completed ? 'incomplete' : 'complete'}`}
                      title={t.completed ? 'Completed — click to undo' : 'Mark complete'}
                      className={`w-[20px] h-[20px] rounded-[4px] border flex items-center justify-center transition-all duration-150 ${
                        t.completed
                          ? 'bg-brand-olive border-brand-olive text-[#F5EDDA]'
                          : 'bg-brand-surface border-brand-primary/35 hover:border-brand-burnt-orange/70 hover:bg-brand-raised text-transparent'
                      }`}
                    >
                      {t.completed && <Check size={12} strokeWidth={3} />}
                    </button>

                    {editingTaskId === t.id ? (
                      <input
                        autoFocus
                        value={taskEditDraft}
                        onChange={(e) => setTaskEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameTask(t);
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        onBlur={() => handleRenameTask(t)}
                        aria-label="Task title"
                        className="input h-8 py-1 text-[13px]"
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTaskId(t.id);
                          setTaskEditDraft(t.title);
                        }}
                        title="Click to rename"
                        className="min-w-0 text-left cursor-text"
                      >
                        <span
                          className={`text-[13.5px] leading-snug ${
                            t.completed
                              ? 'text-brand-primary/40 line-through decoration-brand-olive/50'
                              : 'text-brand-primary/90'
                          }`}
                        >
                          {t.title}
                        </span>
                      </button>
                    )}

                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <RowAction
                        onClick={() => handleDeleteTask(t)}
                        label={`Delete ${t.title}`}
                        icon={<Trash2 size={13} />}
                        hover="hover:text-brand-danger hover:bg-brand-danger/15"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===== Field notes + connected habits ===== */}
          <div className="lg:col-span-5 min-w-0 space-y-8">
            <section>
              <SectionRule
                label="Field notes"
                note={notes.length > 0 ? `${notes.length} recorded` : undefined}
              />
              <div className="flex items-center gap-2 mt-4">
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Keep useful context here…"
                  aria-label="New note"
                  className="input h-9 py-1.5 text-[13px]"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteDraft.trim()}
                  aria-label="Add note"
                  className="btn-outline shrink-0 !h-9 !py-0"
                >
                  <Plus size={14} />
                </button>
              </div>

              {notes.length === 0 ? (
                <p className="mt-4 text-[12.5px] italic text-brand-primary/45">Nothing recorded yet.</p>
              ) : (
                <ul className="mt-2">
                  {notes.map((n) => (
                    <li key={n.id} className="group py-2.5 border-b border-brand-line/40">
                      {editingNoteId === n.id ? (
                        <input
                          autoFocus
                          value={noteEditDraft}
                          onChange={(e) => setNoteEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNote(n);
                            if (e.key === 'Escape') setEditingNoteId(null);
                          }}
                          onBlur={() => handleSaveNote(n)}
                          aria-label="Note content"
                          className="input h-8 py-1 text-[13px]"
                        />
                      ) : (
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-[12.5px] leading-relaxed text-brand-primary/75">{n.content}</p>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                            <RowAction
                              onClick={() => {
                                setEditingNoteId(n.id);
                                setNoteEditDraft(n.content);
                              }}
                              label="Edit note"
                              icon={<Pencil size={13} />}
                              hover="hover:text-brand-mustard hover:bg-brand-mustard/15"
                            />
                            <RowAction
                              onClick={() => handleDeleteNote(n)}
                              label="Delete note"
                              icon={<Trash2 size={13} />}
                              hover="hover:text-brand-danger hover:bg-brand-danger/15"
                            />
                          </div>
                        </div>
                      )}
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-primary/30 mt-1.5 tabular-nums">
                        {formatRelative(localDate(n.created_at))}
                        {n.updated_at !== n.created_at && <span className="text-brand-primary/25"> · edited</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionRule
                label="Connected habits"
                note={linkedHabits.length > 0 ? `${linkedHabits.length} linked` : undefined}
              />
              {linkedHabits.length === 0 ? (
                <p className="mt-3.5 text-[12.5px] italic text-brand-primary/45">
                  {habits.length === 0
                    ? 'No habits exist yet — this project can stand alone.'
                    : 'No habits connected. Tie the project to the daily work that feeds it.'}
                </p>
              ) : (
                <ul className="mt-2">
                  {linkedHabits.map((h) => {
                    const link = selectedLinks.find((l) => l.habit_id === h.id);
                    const dueToday = isHabitScheduledForDay(h.frequency, h.specific_days, todayStr);
                    return (
                      <li
                        key={h.id}
                        className="group grid grid-cols-[minmax(0,1fr)_30px] items-center gap-x-3 py-2.5 border-b border-brand-line/40"
                      >
                        <div className="min-w-0">
                          <p className="font-display text-[15px] text-brand-primary truncate" title={h.name}>
                            {h.name}
                          </p>
                          <p className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-brand-primary/65 font-medium">{scheduleLabel(h)}</span>
                            {dueToday && (
                              <>
                                <span className={AND}>·</span>
                                <span className="text-brand-mustard">due today</span>
                              </>
                            )}
                            <span className={AND}>·</span>
                            <span className="text-[9.5px] uppercase tracking-wider font-semibold text-brand-primary/55 bg-brand-warm-brown/20 px-1.5 py-0.5 rounded">
                              {h.category}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          {link && (
                            <RowAction
                              onClick={() => handleUnlinkHabit(link)}
                              label={`Disconnect ${h.name}`}
                              icon={<X size={13} />}
                              hover="hover:text-brand-burnt-orange hover:bg-brand-burnt-orange/15"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {habits.length > 0 && linkableHabits.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <Link2 size={14} className="text-brand-primary/35 shrink-0" />
                  <select
                    value=""
                    onChange={(e) => handleLinkHabit(e.target.value)}
                    aria-label="Connect a habit"
                    className="select h-9 !py-1.5 !text-[12.5px]"
                  >
                    <option value="">Connect a habit…</option>
                    {linkableHabits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

          </div>
        </div>

        {/* Closing band: the dossier ends with its own state controls on a
            full-width rule, instead of the page trailing off in one column. */}
        <section className="mt-8 border-t border-brand-line/60 pt-4 flex flex-wrap items-center gap-2">
          {selected.status !== 'completed' && (
            <button onClick={() => handleStatus(selected, 'completed')} className="btn-outline !py-1.5 !text-[12.5px]">
              <Check size={13} />
              Mark complete
            </button>
          )}
          {retired ? (
            <button onClick={() => handleStatus(selected, 'active')} className="btn-outline !py-1.5 !text-[12.5px]">
              <RotateCcw size={13} />
              Reopen
            </button>
          ) : (
            <button onClick={() => handleStatus(selected, 'archived')} className="btn-outline !py-1.5 !text-[12.5px]">
              <Archive size={13} />
              Retire
            </button>
          )}
        </section>

        {formModal}
        {deleteModal}
      </div>
    );
  }

  // ----------------------------------------------------------
  // List view
  // ----------------------------------------------------------

  return (
    <div className="px-6 lg:px-8 pt-5 pb-12 max-w-5xl mx-auto animate-fade-in">
      <header className="pb-3.5 hairline">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="min-w-0">
            <p className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-brand-primary/55 mb-1.5 select-none">
              {tab === 'active' ? 'Current excavations' : 'Archived specimens'}
            </p>
            <h1 className="font-display text-[30px] leading-tight text-brand-primary tracking-tight">Projects</h1>
            <p className="text-[12px] text-brand-primary/65 mt-1 font-medium tracking-wide">
              {projects.length === 0
                ? 'Nothing is being worked on yet.'
                : `${activeProjects.length} active${
                    archivedProjects.length > 0 ? ` · ${archivedProjects.length} retired` : ''
                  } · ${totalDone} of ${tasks.length} tasks done`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {projects.length > 0 && (
              <div
                className="inline-flex items-center rounded-[6px] border border-brand-line bg-brand-surface/90 p-1 gap-1"
                role="group"
                aria-label="Which projects to show"
              >
                {(
                  [
                    { id: 'active', label: 'Active', count: activeProjects.length },
                    { id: 'archive', label: 'Archive', count: archivedProjects.length },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    aria-pressed={tab === t.id}
                    className={`h-8 px-3 rounded-[4px] text-[11px] uppercase tracking-widest font-medium transition-colors ${
                      tab === t.id
                        ? 'bg-brand-raised text-brand-primary border border-brand-line'
                        : 'text-brand-primary/50 hover:text-brand-primary hover:bg-brand-warm-brown/15 border border-transparent'
                    }`}
                  >
                    {t.label}
                    <span className="ml-1.5 font-mono text-[10px] tabular-nums text-brand-primary/40">{t.count}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={openCreate} className="btn-primary">
              <Plus size={15} />
              New project
            </button>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        loading ? (
          <p className="py-14 text-sm italic text-brand-primary/45 text-center">Reading the record…</p>
        ) : (
          <EmptyState
            title="No active excavations"
            message="Nothing is being worked on yet. Start a project, give it a next step, and it stays on the bench until it is done."
            action={
              <button onClick={openCreate} className="btn-primary">
                <Plus size={15} />
                Start a project
              </button>
            }
          />
        )
      ) : shown.length === 0 ? (
        <p className="py-14 text-sm italic text-brand-primary/55 text-center">
          {tab === 'active'
            ? 'Nothing is on the bench. Everything here has been retired — check the archive.'
            : 'Nothing has been retired yet.'}
        </p>
      ) : (
        <>
          {tab === 'archive' && (
            <p className="text-[12px] text-brand-primary/55 mt-3.5 bg-brand-surface/40 border border-brand-line/40 px-3 py-2 rounded-md">
              Retired work keeps its tasks, notes and habit connections. Reopen one to bring it back onto the bench.
            </p>
          )}

          <div className="mt-3">
            {shown.map((p) => {
              const s = stats.get(p.id) ?? { total: 0, done: 0 };
              const remaining = s.total - s.done;
              const meta = STATUS_META[p.status];
              const retired = p.status === 'archived' || p.status === 'completed';
              // In the active view every healthy row is simply "active" — the tab
              // already says that, so only the exceptions get a label.
              const showStatus = tab === 'archive' || p.status !== 'active';
              const isCurrent = p.id === markedId;
              const names = (linksByProject.get(p.id) ?? [])
                .map((l) => habitsById.get(l.habit_id)?.name)
                .filter((n): n is string => !!n);

              return (
                <div
                  key={p.id}
                  className={`group relative grid grid-cols-[minmax(0,1fr)_7rem_124px] items-start gap-x-4 px-2 py-4 border-t border-brand-line/50 transition-colors ${
                    isCurrent ? 'bg-brand-surface/70' : 'hover:bg-brand-surface/50'
                  }`}
                >
                  {/* where you left off */}
                  {isCurrent && (
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-mustard" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => {
                      setMarkedId(p.id);
                      setSelectedId(p.id);
                    }}
                    title={p.name}
                    className="min-w-0 text-left cursor-pointer"
                  >
                    <p className="font-display text-[16.5px] leading-snug text-brand-primary truncate">{p.name}</p>
                    {p.description && (
                      <p
                        className={`text-[11.5px] truncate mt-0.5 ${
                          isCurrent ? 'text-brand-primary/60' : 'text-brand-primary/50'
                        }`}
                      >
                        {p.description}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2.5 flex-wrap">
                      {s.total > 0 ? (
                        <>
                          <ProgressRule done={s.done} total={s.total} />
                          <span className="font-mono text-[10.5px] tabular-nums text-brand-primary/60">
                            {s.done}/{s.total} tasks
                          </span>
                          <span
                            className={`text-[11px] ${remaining === 0 ? 'text-brand-olive' : 'text-brand-primary/45'}`}
                          >
                            {remaining === 0 ? 'all done' : `${remaining} remaining`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] italic text-brand-primary/40">no tasks yet</span>
                      )}
                      {names.length > 0 && (
                        <>
                          <span className={AND}>·</span>
                          <span className="font-mono text-[10.5px] text-brand-primary/45 truncate">
                            {names.join(' · ')}
                          </span>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="text-right pt-0.5">
                    {showStatus && (
                      <p className={`text-[10px] uppercase tracking-[0.14em] font-medium ${meta.tone}`}>
                        {meta.label}
                      </p>
                    )}
                    <p
                      className={`font-mono text-[9.5px] text-brand-primary/30 tabular-nums ${
                        showStatus ? 'mt-1' : 'mt-0'
                      }`}
                      title="Last activity"
                    >
                      {formatRelative(localDate(p.updated_at))}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <RowAction
                      onClick={() => openEdit(p)}
                      label={`Edit ${p.name}`}
                      icon={<Pencil size={14} />}
                      hover="hover:text-brand-mustard hover:bg-brand-mustard/15"
                    />
                    {retired ? (
                      <RowAction
                        onClick={() => handleStatus(p, 'active')}
                        label={`Reopen ${p.name}`}
                        icon={<RotateCcw size={14} />}
                        hover="hover:text-brand-olive hover:bg-brand-olive/15"
                      />
                    ) : (
                      <RowAction
                        onClick={() => handleStatus(p, 'completed')}
                        label={`Mark ${p.name} complete`}
                        icon={<Check size={14} />}
                        hover="hover:text-brand-olive hover:bg-brand-olive/15"
                      />
                    )}
                    {!retired && (
                      <RowAction
                        onClick={() => handleStatus(p, 'archived')}
                        label={`Retire ${p.name}`}
                        icon={<Archive size={14} />}
                        hover="hover:text-brand-sage hover:bg-brand-sage/15"
                      />
                    )}
                    <RowAction
                      onClick={() => setDeleteConfirm(p)}
                      label={`Delete ${p.name}`}
                      icon={<Trash2 size={14} />}
                      hover="hover:text-brand-danger hover:bg-brand-danger/15"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {formModal}
      {deleteModal}
    </div>
  );
}
