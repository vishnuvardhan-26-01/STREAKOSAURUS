import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useStore } from '../store';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Todo, TodoPriority } from '../types';
import { today, formatRelative, formatTime } from '../utils/dates';

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-brand-sage' },
  { value: 'medium', label: 'Medium', color: 'text-brand-mustard' },
  { value: 'high', label: 'High', color: 'text-brand-burnt-orange' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
];

const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Learning', 'Errands'];

interface TodoFormData {
  title: string;
  description: string;
  priority: TodoPriority;
  category: string;
  due_date: string;
  due_time: string;
}

const defaultForm: TodoFormData = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'General',
  due_date: '',
  due_time: '',
};

export default function TodosPage() {
  const {
    todos,
    settings,
    loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form, setForm] = useState<TodoFormData>(defaultForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const filtered = todos.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'active' && !t.completed) || (filter === 'completed' && t.completed);
    return matchesSearch && matchesFilter;
  });

  const openCreate = () => {
    setEditingTodo(null);
    setForm(defaultForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setForm({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      due_date: todo.due_date || '',
      due_time: todo.due_time || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    setFormError('');

    try {
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        due_date: form.due_date || null,
        due_time: form.due_time || null,
        completed: false,
      };

      if (editingTodo) {
        await updateTodo(editingTodo.id, data);
      } else {
        await createTodo(data);
      }
      setShowForm(false);
      await loadTodos();
    } catch (e) {
      setFormError('Failed to save. Please try again.');
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    await updateTodo(todo.id, { completed: !todo.completed });
    await loadTodos();
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
    setDeleteConfirm(null);
    await loadTodos();
  };

  const activeCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;
  const todayDate = today();
  const overdueCount = todos.filter(t => !t.completed && t.due_date && t.due_date < todayDate).length;

  return (
    <div className="px-10 py-9 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="font-display text-3xl text-brand-primary">To-do</h1>
          <p className="text-[13px] text-brand-primary/45 mt-1.5">
            {activeCount} active · {completedCount} completed
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={15} />
          Add Task
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 bg-brand-surface border border-brand-warm-brown/20 rounded-lg p-0.5">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs capitalize transition-colors ${
                filter === f ? 'bg-brand-burnt-orange/15 text-brand-burnt-orange' : 'text-brand-primary/50 hover:text-brand-primary/70'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Todo List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="✅"
          title={filter === 'completed' ? 'No completed tasks' : filter === 'active' ? 'All caught up!' : 'No tasks yet'}
          message={
            filter === 'completed'
              ? 'Complete some tasks and they\'ll show up here.'
              : filter === 'active'
              ? 'Every task is done. The dinosaur is impressed.'
              : 'Add your first task. Even dinosaurs need to-do lists.'
          }
          action={
            filter !== 'completed' ? (
              <button onClick={openCreate} className="btn-primary">
                Add a task
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((todo) => {
            const isOverdue = !todo.completed && todo.due_date && todo.due_date < todayDate;
            const priorityInfo = PRIORITIES.find(p => p.value === todo.priority);

            return (
              <div
                key={todo.id}
                className={`flex items-center gap-4 p-4 bg-brand-surface rounded-xl border transition-all group ${
                  todo.completed ? 'border-brand-warm-brown/10 opacity-60' :
                  isOverdue ? 'border-red-500/20' :
                  'border-brand-warm-brown/15 hover:border-brand-warm-brown/30'
                }`}
              >
                <button onClick={() => handleToggleComplete(todo)} className="shrink-0">
                  {todo.completed ? (
                    <CheckCircle2 size={18} className="text-brand-olive" />
                  ) : (
                    <Circle size={18} className="text-brand-primary/30 hover:text-brand-primary/60" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-medium truncate ${todo.completed ? 'text-brand-primary/50 line-through' : 'text-brand-primary'}`}>
                      {todo.title}
                    </h3>
                    {priorityInfo && !todo.completed && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded bg-brand-warm-brown/10 ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {todo.category && (
                      <span className="text-[10px] text-brand-primary/40">{todo.category}</span>
                    )}
                    {todo.due_date && (
                      <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-brand-primary/40'}`}>
                        {isOverdue && <AlertTriangle size={10} />}
                        {isOverdue ? 'Overdue' : formatRelative(todo.due_date)}
                      </span>
                    )}
                    {todo.due_time && (
                      <span className="text-[10px] text-brand-primary/40 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(todo.due_time, settings.time_format)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(todo)}
                    className="p-2 text-brand-primary/40 hover:text-brand-mustard rounded-lg hover:bg-brand-mustard/10 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(todo.id)}
                    className="p-2 text-brand-primary/40 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingTodo ? 'Edit Task' : 'New Task'}
        size="md"
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              className="input"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional details"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TodoPriority })}
                className="select"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Due Time</label>
              <input
                type="time"
                value={form.due_time}
                onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingTodo ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Task"
        size="sm"
      >
        <div className="text-center py-4">
          <p className="text-brand-primary/70 text-sm mb-6">Are you sure you want to delete this task?</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
