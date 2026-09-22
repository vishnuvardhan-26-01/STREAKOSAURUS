import React, { useEffect, useRef, useState } from 'react';
import { Plus, Lightbulb, Trash2, CornerDownRight, Pencil, Archive, ArchiveRestore, Check, X, FolderInput } from 'lucide-react';
import { useStore } from '../store';
import EmptyState from '../components/EmptyState';
import { formatRelative } from '../utils/dates';
import type { Idea } from '../types';

type View = 'active' | 'archived' | 'converted';

/**
 * Ideas — quick capture. THINK → TYPE → ENTER → CAPTURE.
 * Active ideas are the primary view; archived/converted are historical
 * context and are never deleted implicitly. Converting preserves the
 * idea→project origin link in SQLite.
 */
export default function IdeasPage() {
  const {
    ideas, loadIdeas, createIdea, updateIdea, deleteIdea, convertIdeaToProject,
    projects, loadProjects, setPage,
  } = useStore();

  const [view, setView] = useState<View>('active');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadIdeas();
    loadProjects();
  }, [loadIdeas, loadProjects]);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const active = ideas.filter((i) => !i.archived && !i.project_id);
  const archived = ideas.filter((i) => i.archived && !i.project_id);
  const converted = ideas.filter((i) => !!i.project_id);
  const shown = view === 'active' ? active : view === 'archived' ? archived : converted;

  const handleCapture = async () => {
    if (!title.trim()) {
      setError('Give the idea a name.');
      return;
    }
    setError('');
    try {
      await createIdea({ title: title.trim(), description: description.trim(), project_id: null });
      setTitle('');
      setDescription('');
      titleRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleConvert = async (ideaId: string) => {
    setBusyId(ideaId);
    try {
      const projectId = await convertIdeaToProject(ideaId);
      if (projectId) {
        await loadProjects();
        await loadIdeas();
        setView('converted');
      }
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditTitle(idea.title);
    setEditDesc(idea.description);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editTitle.trim()) {
      setError('Give the idea a name.');
      return;
    }
    setError('');
    await updateIdea(editingId, { title: editTitle.trim(), description: editDesc.trim() });
    setEditingId(null);
  };

  const handleArchive = async (idea: Idea) => {
    setBusyId(idea.id);
    try {
      await updateIdea(idea.id, { archived: !idea.archived });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (idea: Idea) => {
    if (idea.project_id) {
      // A converted idea is historical context; deleting it severs the
      // project's origin record. Require an explicit double intent.
      if (!window.confirm(`Delete the converted record for “${idea.title}”? The project itself is not affected.`)) return;
    }
    await deleteIdea(idea.id);
  };

  return (
    <div className="px-10 py-9 max-w-4xl mx-auto animate-fade-in">
      {/* Masthead */}
      <div className="pb-5">
        <h1 className="font-display text-3xl text-brand-primary">Ideas</h1>
        <p className="text-[13px] text-brand-primary/45 mt-1.5">
          Quick captures. No ceremony. Promote them to projects when they earn it.
        </p>
      </div>

      {/* Capture strip — deliberately lighter than a form: one line, one action */}
      <div className="flex items-center gap-3 pb-4 border-b border-brand-line">
        <Lightbulb size={16} className="text-brand-mustard shrink-0" />
        <div className="flex-1 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
            placeholder="An idea worth remembering…"
            className="input !py-2 !text-[16px] font-display !bg-transparent !border-0 !px-0 focus:!border-0 placeholder:text-brand-primary/50 border-b-0"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
            placeholder="A sentence or two (optional)"
            className="input !py-2 !text-[12.5px] !bg-transparent !border-0 !px-0 focus:!border-0 placeholder:text-brand-primary/25 self-center"
          />
          <button onClick={handleCapture} disabled={!title.trim()} className="btn-primary !py-2 shrink-0 disabled:opacity-40">
            <Plus size={14} />
            Capture
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-brand-danger mt-2">{error}</p>}

      {/* View switch — quiet inline tabs, only when there is something to switch to */}
      {(archived.length > 0 || converted.length > 0) && (
        <div className="flex items-center gap-5 mt-6">
          {([
            ['active', `Active${active.length ? ` · ${active.length}` : ''}`],
            ['archived', `Archived${archived.length ? ` · ${archived.length}` : ''}`],
            ['converted', `Converted${converted.length ? ` · ${converted.length}` : ''}`],
          ] as [View, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[11px] tracking-widest2 uppercase pb-1 border-b transition-colors ${
                view === v
                  ? 'text-brand-primary border-brand-burnt-orange'
                  : 'text-brand-primary/35 border-transparent hover:text-brand-primary/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {shown.length === 0 ? (
        view === 'active' ? (
          <EmptyState
            icon="💡"
            title="No ideas yet"
            message="Capture the first spark above. Ideas are where projects begin."
          />
        ) : (
          <div className="py-14 text-center text-sm text-brand-primary/40">
            {view === 'archived' ? 'Nothing archived.' : 'Nothing converted yet. Promote an idea when it earns execution.'}
          </div>
        )
      ) : (
        <div className="mt-2">
          {shown.map((idea) => {
            const convertedName = idea.project_id ? projectMap.get(idea.project_id) : null;
            const isEditing = editingId === idea.id;
            return (
              <div
                key={idea.id}
                className="group py-3.5 border-b border-brand-line/60 first:border-t-0 hover:bg-brand-warm-brown/[0.04] transition-colors"
              >
                {isEditing ? (
                  /* Inline edit — no modal, keep it lightweight */
                  <div className="px-1 space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      autoFocus
                      className="input !py-2 !text-[15px] font-display"
                    />
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                      placeholder="Description (optional)"
                      className="input !py-1.5 !text-[13px]"
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={saveEdit} className="btn-primary !py-1.5 !px-3 !text-xs">
                        <Check size={13} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost !py-1.5 !px-3 !text-xs">
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 px-1">
                    <span className={`shrink-0 mt-0.5 ${idea.project_id ? 'text-brand-olive' : idea.archived ? 'text-brand-warm-brown' : 'text-brand-mustard'}`}>
                      {idea.project_id ? <FolderInput size={14} /> : <Lightbulb size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <h3 className={`font-display text-[15px] truncate ${
                          idea.archived ? 'text-brand-primary/55' : 'text-brand-primary'
                        }`}>
                          {idea.title}
                        </h3>
                        <span className={`text-[10px] tracking-wide shrink-0 uppercase ${
                          idea.project_id
                            ? 'text-brand-olive/85'
                            : idea.archived
                              ? 'text-brand-warm-brown/90'
                              : 'text-brand-primary/30'
                        }`}>
                          {idea.project_id
                            ? `Converted · ${formatRelative(idea.created_at)}`
                            : idea.archived
                              ? `Archived · ${formatRelative(idea.created_at)}`
                              : `Captured · ${formatRelative(idea.created_at)}`}
                        </span>
                      </div>
                      {idea.description && (
                        <p className="text-xs text-brand-primary/45 mt-0.5 truncate">{idea.description}</p>
                      )}
                      {convertedName && (
                        <button
                          onClick={() => setPage('projects')}
                          className="text-[11px] text-brand-olive/80 hover:text-brand-olive mt-1 flex items-center gap-1.5 transition-colors"
                          title="Open Projects"
                        >
                          <CornerDownRight size={10} />
                          Now the project “{convertedName}” — open it
                        </button>
                      )}
                    </div>
                    {/* Quiet actions — faintly visible at rest so they're
                        discoverable, full strength on hover/focus */}
                    <div className="flex items-center gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {!idea.project_id && !idea.archived && (
                        <>
                          <button
                            onClick={() => startEdit(idea)}
                            className="p-2 text-brand-primary/30 hover:text-brand-primary rounded-md hover:bg-brand-warm-brown/10 transition-colors"
                            aria-label="Edit idea"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleConvert(idea.id)}
                            disabled={busyId === idea.id}
                            className="px-2.5 py-1.5 text-[11px] text-brand-mustard/80 hover:text-brand-mustard rounded-md hover:bg-brand-mustard/10 transition-colors disabled:opacity-50"
                            aria-label="Convert idea to project"
                            title="Convert to project"
                          >
                            {busyId === idea.id ? 'Creating…' : 'Convert'}
                          </button>
                          <button
                            onClick={() => handleArchive(idea)}
                            disabled={busyId === idea.id}
                            className="p-2 text-brand-primary/30 hover:text-brand-primary rounded-md hover:bg-brand-warm-brown/10 transition-colors disabled:opacity-50"
                            aria-label="Archive idea"
                            title="Archive"
                          >
                            <Archive size={13} />
                          </button>
                        </>
                      )}
                      {idea.archived && (
                        <button
                          onClick={() => handleArchive(idea)}
                          disabled={busyId === idea.id}
                          className="px-2.5 py-1.5 text-[11px] text-brand-sage/80 hover:text-brand-sage rounded-md hover:bg-brand-sage/10 transition-colors disabled:opacity-50"
                          aria-label="Restore idea to active"
                          title="Restore"
                        >
                          <ArchiveRestore size={13} className="inline mr-1" /> Restore
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(idea)}
                        className="p-2 text-brand-primary/25 hover:text-brand-danger rounded-md hover:bg-brand-danger/10 transition-colors"
                        aria-label="Delete idea"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Cross-view pointers — keep them tiny; the tabs carry the counts */}
          <div className="pt-3 flex items-center gap-4 text-[11px] text-brand-primary/30">
            {view !== 'active' && active.length > 0 && (
              <button onClick={() => setView('active')} className="hover:text-brand-primary/60 transition-colors underline underline-offset-2">
                Back to active ideas
              </button>
            )}
            <span>{shown.length} {shown.length === 1 ? 'idea' : 'ideas'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
