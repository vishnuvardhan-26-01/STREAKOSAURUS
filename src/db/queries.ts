// ============================================================
// Streakosaurus — Database Queries
// ============================================================

import { getDb } from './index';
import { today } from '../utils/dates';
import { DINO_ACHIEVEMENTS } from '../utils/dinosaurRegistry';
import type {
  Habit,
  HabitCompletion,
  HabitProgress,
  JournalEntry,
  Achievement,
  UserAchievement,
  AppNotification,
  AppSettings,
  Reminder,
  Todo,
  TodoPriority,
  PomodoroSession,
  FocusSession,
  Project,
  ProjectStatus,
  ProjectTask,
  ProjectNote,
  ProjectHabitLink,
  Idea,
} from '../types';

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================
// HABITS
// ============================================================

export async function getAllHabits(): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits ORDER BY sort_order, created_at'
  );
  return rows.map(parseHabitRow);
}

export async function getActiveHabits(): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits WHERE archived = 0 ORDER BY sort_order, created_at'
  );
  return rows.map(parseHabitRow);
}

export async function getArchivedHabits(): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits WHERE archived = 1 ORDER BY archived_at DESC'
  );
  return rows.map(parseHabitRow);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const db = await getDb();
  const rows = await db.select<HabitRow[]>(
    'SELECT * FROM habits WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? parseHabitRow(rows[0]) : null;
}

export async function createHabit(
  habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'archived' | 'archived_at' | 'sort_order'>
): Promise<Habit> {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    throw new Error(`Cannot connect to database: ${e instanceof Error ? e.message : String(e)}`);
  }
  const id = generateId();
  const now = new Date().toISOString();

  const params = [
    id,
    habit.name,
    habit.description,
    habit.icon,
    habit.category,
    habit.frequency,
    JSON.stringify(habit.specific_days),
    habit.target_value,
    habit.target_unit,
    habit.color,
    habit.reminder_enabled ? 1 : 0,
    habit.reminder_time,
    habit.start_date,
    habit.end_date,
    now,
    now,
  ];

  try {
    await db.execute(
      `INSERT INTO habits (id, name, description, icon, category, frequency, specific_days, target_value, target_unit, color, reminder_enabled, reminder_time, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
  } catch (e) {
    throw new Error(`Failed to insert habit into database: ${e instanceof Error ? e.message : String(e)}\nSQL: INSERT INTO habits...\nParams: ${JSON.stringify(params)}`);
  }

  const result = await getHabitById(id);
  if (!result) {
    throw new Error('Habit was inserted but could not be read back from database.');
  }
  return result;
}

export async function updateHabit(
  id: string,
  updates: Partial<Habit>
): Promise<Habit | null> {
  const db = await getDb();
  const existing = await getHabitById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const fieldMap: Record<string, unknown> = {
    name: updates.name,
    description: updates.description,
    icon: updates.icon,
    category: updates.category,
    frequency: updates.frequency,
    specific_days: updates.specific_days ? JSON.stringify(updates.specific_days) : undefined,
    target_value: updates.target_value,
    target_unit: updates.target_unit,
    color: updates.color,
    reminder_enabled: updates.reminder_enabled !== undefined ? (updates.reminder_enabled ? 1 : 0) : undefined,
    reminder_time: updates.reminder_time,
    start_date: updates.start_date,
    end_date: updates.end_date,
    archived: updates.archived !== undefined ? (updates.archived ? 1 : 0) : undefined,
    archived_at: updates.archived_at,
    sort_order: updates.sort_order,
  };

  for (const [key, val] of Object.entries(fieldMap)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val as string | number | null);
    }
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.execute(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
  return getHabitById(id);
}

export async function deleteHabit(id: string): Promise<void> {
  let db;
  try {
    db = await getDb();
  } catch (e) {
    throw new Error(`Cannot connect to database: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    await db.execute('DELETE FROM reminders WHERE habit_id = ?', [id]);
    await db.execute('DELETE FROM habit_completions WHERE habit_id = ?', [id]);
    await db.execute('DELETE FROM habit_progress WHERE habit_id = ?', [id]);
    await db.execute('DELETE FROM habits WHERE id = ?', [id]);
  } catch (e) {
    throw new Error(`Failed to delete habit ${id}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function archiveHabit(id: string): Promise<Habit | null> {
  return updateHabit(id, { archived: true, archived_at: new Date().toISOString() });
}

export async function restoreHabit(id: string): Promise<Habit | null> {
  return updateHabit(id, { archived: false, archived_at: null });
}

// ============================================================
// HABIT COMPLETIONS
// ============================================================

export async function getCompletionsForDate(date: string): Promise<HabitCompletion[]> {
  const db = await getDb();
  return db.select<HabitCompletion[]>(
    'SELECT * FROM habit_completions WHERE date = ?',
    [date]
  );
}

export async function getCompletionsForHabit(
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitCompletion[]> {
  const db = await getDb();
  let query = 'SELECT * FROM habit_completions WHERE habit_id = ?';
  const params: string[] = [habitId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date ASC';
  return db.select<HabitCompletion[]>(query, params);
}

export async function getCompletionsRange(
  startDate: string,
  endDate: string
): Promise<HabitCompletion[]> {
  const db = await getDb();
  return db.select<HabitCompletion[]>(
    'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
}

export async function toggleCompletion(
  habitId: string,
  date: string,
  value: number = 1
): Promise<boolean> {
  const db = await getDb();

  const existing = await db.select<HabitCompletion[]>(
    'SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );

  if (existing.length > 0) {
    await db.execute(
      'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?',
      [habitId, date]
    );
    return false;
  } else {
    const id = generateId();
    await db.execute(
      `INSERT INTO habit_completions (id, habit_id, date, value, completed)
       VALUES (?, ?, ?, ?, 1)`,
      [id, habitId, date, value]
    );
    return true;
  }
}

export async function markComplete(
  habitId: string,
  date: string,
  value: number = 1
): Promise<void> {
  const db = await getDb();
  const id = generateId();
  await db.execute(
    `INSERT OR REPLACE INTO habit_completions (id, habit_id, date, value, completed)
     VALUES (?, ?, ?, ?, 1)`,
    [id, habitId, date, value]
  );
}

export async function markIncomplete(habitId: string, date: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );
}

// ============================================================
// HABIT PROGRESS
// ============================================================

export async function getProgressForHabit(habitId: string): Promise<HabitProgress[]> {
  const db = await getDb();
  return db.select<HabitProgress[]>(
    'SELECT * FROM habit_progress WHERE habit_id = ? ORDER BY date DESC LIMIT 365',
    [habitId]
  );
}

export async function upsertProgress(progress: HabitProgress): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO habit_progress (id, habit_id, date, current_streak, best_streak, total_completions, total_missed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [progress.id, progress.habit_id, progress.date, progress.current_streak, progress.best_streak, progress.total_completions, progress.total_missed]
  );
}

// ============================================================
// JOURNAL (kept for DB compatibility, removed from UI)
// ============================================================

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.select<JournalRow[]>(
    'SELECT * FROM journal_entries ORDER BY date DESC'
  );
  return rows.map(parseJournalRow);
}

export async function getJournalEntryByDate(date: string): Promise<JournalEntry | null> {
  const db = await getDb();
  const rows = await db.select<JournalRow[]>(
    'SELECT * FROM journal_entries WHERE date = ?',
    [date]
  );
  return rows.length > 0 ? parseJournalRow(rows[0]) : null;
}

export async function createJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<JournalEntry> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO journal_entries (id, date, title, content, mood, tags, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, entry.date, entry.title, entry.content, entry.mood, JSON.stringify(entry.tags), now, now]
  );

  const rows = await db.select<JournalRow[]>(
    'SELECT * FROM journal_entries WHERE id = ?', [id]
  );
  return parseJournalRow(rows[0]);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM journal_entries WHERE id = ?', [id]);
}

export async function searchJournal(query: string): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.select<JournalRow[]>(
    `SELECT * FROM journal_entries WHERE title LIKE ? OR content LIKE ? ORDER BY date DESC`,
    [`%${query}%`, `%${query}%`]
  );
  return rows.map(parseJournalRow);
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

export async function getAllAchievements(): Promise<Achievement[]> {
  const db = await getDb();
  await seedDefaultAchievements();
  return db.select<Achievement[]>(
    'SELECT * FROM achievements ORDER BY order_num ASC, id ASC'
  );
}

export async function getUserAchievements(): Promise<UserAchievement[]> {
  const db = await getDb();
  return db.select<UserAchievement[]>(
    'SELECT * FROM user_achievements ORDER BY earned_at DESC'
  );
}

export async function earnAchievement(
  achievementId: string,
  progress: number = 100
): Promise<void> {
  const db = await getDb();
  const existing = await db.select<UserAchievement[]>(
    'SELECT * FROM user_achievements WHERE achievement_id = ?',
    [achievementId]
  );

  if (existing.length === 0) {
    const id = generateId();
    await db.execute(
      `INSERT INTO user_achievements (id, achievement_id, progress) VALUES (?, ?, ?)`,
      [id, achievementId, progress]
    );
  } else {
    await db.execute(
      'UPDATE user_achievements SET progress = ? WHERE achievement_id = ?',
      [progress, achievementId]
    );
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getAllNotifications(): Promise<AppNotification[]> {
  const db = await getDb();
  const rows = await db.select<NotificationRow[]>(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100'
  );
  return rows.map(parseNotificationRow);
}

export async function getUnreadNotifications(): Promise<AppNotification[]> {
  const db = await getDb();
  const rows = await db.select<NotificationRow[]>(
    'SELECT * FROM notifications WHERE read = 0 ORDER BY created_at DESC'
  );
  return rows.map(parseNotificationRow);
}

export async function createNotification(
  notification: Omit<AppNotification, 'id' | 'created_at'>
): Promise<void> {
  const db = await getDb();
  const id = generateId();
  await db.execute(
    `INSERT INTO notifications (id, type, title, message, read, data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, notification.type, notification.title, notification.message, notification.read ? 1 : 0, JSON.stringify(notification.data)]
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE notifications SET read = 1 WHERE read = 0');
}

export async function deleteNotification(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
}

// ============================================================
// SETTINGS
// ============================================================

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const rows = await db.select<SettingsRow[]>(
    "SELECT * FROM settings WHERE id = 'default'"
  );

  if (rows.length === 0) {
    await db.execute(`INSERT INTO settings (id) VALUES ('default')`);
    return getDefaultSettings();
  }

  const row = rows[0];
  return {
    id: row.id,
    theme: row.theme as 'dark' | 'light',
    roast_level: row.roast_level as AppSettings['roast_level'],
    notifications_enabled: row.notifications_enabled === 1,
    reminder_sound: row.reminder_sound === 1,
    weekly_report_enabled: row.weekly_report_enabled === 1,
    monthly_report_enabled: row.monthly_report_enabled === 1,
    evening_checkin_enabled: row.evening_checkin_enabled === 1,
    evening_checkin_time: row.evening_checkin_time,
    week_start: row.week_start as 'monday' | 'sunday',
    date_format: row.date_format,
    time_format: row.time_format as '12h' | '24h',
  };
}

export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  const fieldMap: Record<string, unknown> = {
    theme: updates.theme,
    roast_level: updates.roast_level,
    notifications_enabled: updates.notifications_enabled !== undefined ? (updates.notifications_enabled ? 1 : 0) : undefined,
    reminder_sound: updates.reminder_sound !== undefined ? (updates.reminder_sound ? 1 : 0) : undefined,
    weekly_report_enabled: updates.weekly_report_enabled !== undefined ? (updates.weekly_report_enabled ? 1 : 0) : undefined,
    monthly_report_enabled: updates.monthly_report_enabled !== undefined ? (updates.monthly_report_enabled ? 1 : 0) : undefined,
    evening_checkin_enabled: updates.evening_checkin_enabled !== undefined ? (updates.evening_checkin_enabled ? 1 : 0) : undefined,
    evening_checkin_time: updates.evening_checkin_time,
    week_start: updates.week_start,
    date_format: updates.date_format,
    time_format: updates.time_format,
  };

  for (const [key, val] of Object.entries(fieldMap)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val as string | number);
    }
  }

  if (fields.length > 0) {
    values.push('default');
    await db.execute(`UPDATE settings SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  return getSettings();
}

function getDefaultSettings(): AppSettings {
  return {
    id: 'default',
    theme: 'dark',
    roast_level: 'sarcastic',
    notifications_enabled: true,
    reminder_sound: true,
    weekly_report_enabled: true,
    monthly_report_enabled: true,
    evening_checkin_enabled: true,
    evening_checkin_time: '20:00',
    week_start: 'monday',
    date_format: 'YYYY-MM-DD',
    time_format: '12h',
  };
}

// ============================================================
// REMINDERS
// ============================================================

export async function getAllReminders(): Promise<Reminder[]> {
  const db = await getDb();
  const rows = await db.select<ReminderRow[]>(
    'SELECT * FROM reminders ORDER BY date, time'
  );
  return rows.map(parseReminderRow);
}

export async function getRemindersForDate(date: string): Promise<Reminder[]> {
  const db = await getDb();
  const rows = await db.select<ReminderRow[]>(
    'SELECT * FROM reminders WHERE date = ? ORDER BY time',
    [date]
  );
  return rows.map(parseReminderRow);
}

export async function getUpcomingReminders(limit: number = 10): Promise<Reminder[]> {
  const db = await getDb();
  const todayDate = today();
  const rows = await db.select<ReminderRow[]>(
    'SELECT * FROM reminders WHERE date >= ? AND completed = 0 ORDER BY date, time LIMIT ?',
    [todayDate, limit]
  );
  return rows.map(parseReminderRow);
}

export async function createReminder(
  reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
): Promise<Reminder> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO reminders (id, title, description, date, time, habit_id, completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, reminder.title, reminder.description, reminder.date, reminder.time, reminder.habit_id, reminder.completed ? 1 : 0, now, now]
  );

  const rows = await db.select<ReminderRow[]>(
    'SELECT * FROM reminders WHERE id = ?', [id]
  );
  return parseReminderRow(rows[0]);
}

export async function updateReminder(
  id: string,
  updates: Partial<Reminder>
): Promise<Reminder | null> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
  if (updates.time !== undefined) { fields.push('time = ?'); values.push(updates.time); }
  if (updates.habit_id !== undefined) { fields.push('habit_id = ?'); values.push(updates.habit_id); }
  if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed ? 1 : 0); }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.execute(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`, values);

  const rows = await db.select<ReminderRow[]>(
    'SELECT * FROM reminders WHERE id = ?', [id]
  );
  return rows.length > 0 ? parseReminderRow(rows[0]) : null;
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM reminders WHERE id = ?', [id]);
}

// ============================================================
// TODOS
// ============================================================

export async function getAllTodos(): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.select<TodoRow[]>(
    'SELECT * FROM todos ORDER BY completed ASC, sort_order, created_at DESC'
  );
  return rows.map(parseTodoRow);
}

export async function getActiveTodos(): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.select<TodoRow[]>(
    'SELECT * FROM todos WHERE completed = 0 ORDER BY sort_order, created_at DESC'
  );
  return rows.map(parseTodoRow);
}

export async function getTodosForDate(date: string): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.select<TodoRow[]>(
    'SELECT * FROM todos WHERE due_date = ? AND completed = 0 ORDER BY sort_order',
    [date]
  );
  return rows.map(parseTodoRow);
}

export async function createTodo(
  todo: Omit<Todo, 'id' | 'created_at' | 'completed_at' | 'updated_at' | 'sort_order'>
): Promise<Todo> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO todos (id, title, description, completed, priority, category, due_date, due_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, todo.title, todo.description, todo.completed ? 1 : 0, todo.priority, todo.category, todo.due_date, todo.due_time, now, now]
  );

  const rows = await db.select<TodoRow[]>(
    'SELECT * FROM todos WHERE id = ?', [id]
  );
  return parseTodoRow(rows[0]);
}

export async function updateTodo(
  id: string,
  updates: Partial<Todo>
): Promise<Todo | null> {
  const db = await getDb();
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.completed !== undefined) {
    fields.push('completed = ?'); values.push(updates.completed ? 1 : 0);
    if (updates.completed) {
      fields.push('completed_at = ?'); values.push(now);
    } else {
      fields.push('completed_at = ?'); values.push(null);
    }
  }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
  if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
  if (updates.due_date !== undefined) { fields.push('due_date = ?'); values.push(updates.due_date); }
  if (updates.due_time !== undefined) { fields.push('due_time = ?'); values.push(updates.due_time); }
  if (updates.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(updates.sort_order); }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.execute(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);

  const rows = await db.select<TodoRow[]>(
    'SELECT * FROM todos WHERE id = ?', [id]
  );
  return rows.length > 0 ? parseTodoRow(rows[0]) : null;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM todos WHERE id = ?', [id]);
}

export async function searchTodos(query: string): Promise<Todo[]> {
  const db = await getDb();
  const rows = await db.select<TodoRow[]>(
    `SELECT * FROM todos WHERE title LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY completed ASC, sort_order`,
    [`%${query}%`, `%${query}%`, `%${query}%`]
  );
  return rows.map(parseTodoRow);
}

// ============================================================
// POMODORO SESSIONS
// ============================================================

export async function getAllPomodoroSessions(): Promise<PomodoroSession[]> {
  const db = await getDb();
  return db.select<PomodoroSession[]>(
    'SELECT * FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 100'
  );
}

export async function createPomodoroSession(
  session: Omit<PomodoroSession, 'id'>
): Promise<PomodoroSession> {
  const db = await getDb();
  const id = generateId();
  await db.execute(
    `INSERT INTO pomodoro_sessions (id, started_at, ended_at, duration_seconds, completed, habit_id, todo_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, session.started_at, session.ended_at, session.duration_seconds, session.completed ? 1 : 0, session.habit_id, session.todo_id]
  );
  const rows = await db.select<PomodoroSession[]>(
    'SELECT * FROM pomodoro_sessions WHERE id = ?', [id]
  );
  return rows[0];
}

// ============================================================
// FOCUS (LOCK-IN) SESSIONS
// ============================================================

export async function getAllFocusSessions(): Promise<FocusSession[]> {
  const db = await getDb();
  return db.select<FocusSession[]>(
    'SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT 100'
  );
}

export async function createFocusSession(
  session: Omit<FocusSession, 'id'>
): Promise<FocusSession> {
  const db = await getDb();
  const id = generateId();
  await db.execute(
    `INSERT INTO focus_sessions (id, title, started_at, ended_at, duration_seconds, target_seconds, status, habit_id, todo_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, session.title, session.started_at, session.ended_at, session.duration_seconds, session.target_seconds, session.status, session.habit_id, session.todo_id]
  );
  const rows = await db.select<FocusSession[]>(
    'SELECT * FROM focus_sessions WHERE id = ?', [id]
  );
  return rows[0];
}

export async function updateFocusSession(
  id: string,
  updates: Partial<FocusSession>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.ended_at !== undefined) { fields.push('ended_at = ?'); values.push(updates.ended_at); }
  if (updates.duration_seconds !== undefined) { fields.push('duration_seconds = ?'); values.push(updates.duration_seconds); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }

  if (fields.length > 0) {
    values.push(id);
    await db.execute(`UPDATE focus_sessions SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}

// ============================================================
// PROJECTS
// ============================================================

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    'SELECT * FROM projects ORDER BY created_at DESC'
  );
  return rows.map(parseProjectRow);
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    'SELECT * FROM projects WHERE id = ?', [id]
  );
  return rows.length > 0 ? parseProjectRow(rows[0]) : null;
}

export async function createProject(
  project: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO projects (id, name, description, status, color, idea_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, project.name, project.description, project.status, project.color, project.idea_id, now, now]
  );
  const rows = await db.select<ProjectRow[]>(
    'SELECT * FROM projects WHERE id = ?', [id]
  );
  return parseProjectRow(rows[0]);
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
  if (updates.idea_id !== undefined) { fields.push('idea_id = ?'); values.push(updates.idea_id); }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await db.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
  return getProjectById(id);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM projects WHERE id = ?', [id]); // cascades tasks, notes, habit links
}

/**
 * Stamp a project's updated_at. Called by task/note writes so "last activity"
 * means the project was actually worked on, not merely renamed.
 */
async function touchProject(projectId: string): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE projects SET updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    projectId,
  ]);
}

// --- Project tasks ---

/**
 * Every task in one read. The Projects page shows progress in the list, so it
 * needs all of them; loading per project would be one query per row.
 */
export async function getAllProjectTasks(): Promise<ProjectTask[]> {
  const db = await getDb();
  const rows = await db.select<ProjectTaskRow[]>(
    'SELECT * FROM project_tasks ORDER BY completed ASC, sort_order, created_at'
  );
  return rows.map(parseProjectTaskRow);
}

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const db = await getDb();
  const rows = await db.select<ProjectTaskRow[]>(
    'SELECT * FROM project_tasks WHERE project_id = ? ORDER BY completed ASC, sort_order, created_at',
    [projectId]
  );
  return rows.map(parseProjectTaskRow);
}

export async function createProjectTask(
  projectId: string,
  title: string
): Promise<ProjectTask> {
  const db = await getDb();
  const id = generateId();
  const count = await db.select<{ c: number }[]>(
    'SELECT COUNT(*) as c FROM project_tasks WHERE project_id = ?', [projectId]
  );
  await db.execute(
    `INSERT INTO project_tasks (id, project_id, title, completed, sort_order)
     VALUES (?, ?, ?, 0, ?)`,
    [id, projectId, title, count[0].c]
  );
  await touchProject(projectId);
  const rows = await db.select<ProjectTaskRow[]>(
    'SELECT * FROM project_tasks WHERE id = ?', [id]
  );
  return parseProjectTaskRow(rows[0]);
}

export async function updateProjectTask(
  id: string,
  updates: { title?: string; completed?: boolean }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.completed !== undefined) { fields.push('completed = ?'); values.push(updates.completed ? 1 : 0); }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE project_tasks SET ${fields.join(', ')} WHERE id = ?`, values);
  await db.execute(
    `UPDATE projects SET updated_at = ?
      WHERE id = (SELECT project_id FROM project_tasks WHERE id = ?)`,
    [new Date().toISOString(), id]
  );
}

export async function deleteProjectTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM project_tasks WHERE id = ?', [id]);
}

// --- Project notes ---

export async function getProjectNotes(projectId: string): Promise<ProjectNote[]> {
  const db = await getDb();
  const rows = await db.select<ProjectNoteRow[]>(
    'SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows.map(parseProjectNoteRow);
}

export async function createProjectNote(
  projectId: string,
  content: string
): Promise<ProjectNote> {
  const db = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO project_notes (id, project_id, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, projectId, content, now, now]
  );
  await touchProject(projectId);
  const rows = await db.select<ProjectNoteRow[]>(
    'SELECT * FROM project_notes WHERE id = ?', [id]
  );
  return parseProjectNoteRow(rows[0]);
}

/** Edit a note in place. */
export async function updateProjectNote(id: string, content: string): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE project_notes SET content = ?, updated_at = ? WHERE id = ?', [
    content,
    new Date().toISOString(),
    id,
  ]);
  await db.execute(
    `UPDATE projects SET updated_at = ?
      WHERE id = (SELECT project_id FROM project_notes WHERE id = ?)`,
    [new Date().toISOString(), id]
  );
}

export async function deleteProjectNote(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM project_notes WHERE id = ?', [id]);
}

// --- Project ↔ habit connections ---
// Only the relationship lives here; the habit keeps its own record, schedule
// and completions, so Projects never becomes a second habit system.

/** Every project↔habit connection, so the list can name a project's habits. */
export async function getAllProjectHabitLinks(): Promise<ProjectHabitLink[]> {
  const db = await getDb();
  const rows = await db.select<ProjectHabitRow[]>(
    'SELECT * FROM project_habits ORDER BY created_at'
  );
  return rows.map(parseProjectHabitRow);
}

export async function getProjectHabitLinks(projectId: string): Promise<ProjectHabitLink[]> {
  const db = await getDb();
  const rows = await db.select<ProjectHabitRow[]>(
    'SELECT * FROM project_habits WHERE project_id = ? ORDER BY created_at',
    [projectId]
  );
  return rows.map(parseProjectHabitRow);
}

export async function linkHabitToProject(
  projectId: string,
  habitId: string
): Promise<ProjectHabitLink | null> {
  const db = await getDb();
  const existing = await db.select<ProjectHabitRow[]>(
    'SELECT * FROM project_habits WHERE project_id = ? AND habit_id = ?',
    [projectId, habitId]
  );
  if (existing.length > 0) return parseProjectHabitRow(existing[0]);

  const id = generateId();
  await db.execute(
    'INSERT INTO project_habits (id, project_id, habit_id, created_at) VALUES (?, ?, ?, ?)',
    [id, projectId, habitId, new Date().toISOString()]
  );
  return { id, project_id: projectId, habit_id: habitId, created_at: new Date().toISOString() };
}

export async function unlinkHabitFromProject(linkId: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM project_habits WHERE id = ?', [linkId]);
}

// ============================================================
// IDEAS
// ============================================================

export async function getAllIdeas(): Promise<Idea[]> {
  const db = await getDb();
  const rows = await db.select<IdeaRow[]>(
    'SELECT * FROM ideas ORDER BY created_at DESC'
  );
  return rows.map(parseIdeaRow);
}

export async function createIdea(
  idea: Omit<Idea, 'id' | 'created_at' | 'archived' | 'archived_at'>
): Promise<Idea> {
  const db = await getDb();
  const id = generateId();
  await db.execute(
    `INSERT INTO ideas (id, title, description, project_id)
     VALUES (?, ?, ?, ?)`,
    [id, idea.title, idea.description, idea.project_id]
  );
  const rows = await db.select<IdeaRow[]>(
    'SELECT * FROM ideas WHERE id = ?', [id]
  );
  return parseIdeaRow(rows[0]);
}

export async function updateIdea(
  id: string,
  updates: { title?: string; description?: string; project_id?: string | null; archived?: boolean }
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.project_id !== undefined) { fields.push('project_id = ?'); values.push(updates.project_id); }
  if (updates.archived !== undefined) {
    fields.push('archived = ?');
    values.push(updates.archived ? '1' : '0');
    fields.push('archived_at = ?');
    values.push(updates.archived ? new Date().toISOString() : null);
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE ideas SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteIdea(id: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM ideas WHERE id = ?', [id]);
}

/**
 * Convert an idea into a project, preserving the idea→project origin link.
 * Returns the new project id.
 */
export async function convertIdeaToProject(ideaId: string): Promise<string> {
  const db = await getDb();
  const ideas = await db.select<IdeaRow[]>(
    'SELECT * FROM ideas WHERE id = ?', [ideaId]
  );
  if (ideas.length === 0) throw new Error('Idea not found');
  const idea = ideas[0];
  if (idea.project_id) return idea.project_id;

  const project = await createProject({
    name: idea.title,
    description: idea.description,
    status: 'active',
    color: '#B8623A',
    idea_id: ideaId,
  });
  await db.execute('UPDATE ideas SET project_id = ? WHERE id = ?', [project.id, ideaId]);
  return project.id;
}

// ============================================================
// SEED DATA
// ============================================================

export async function seedDefaultAchievements(): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < DINO_ACHIEVEMENTS.length; i++) {
    const a = DINO_ACHIEVEMENTS[i];
    const orderNum = parseInt(a.orderNumber, 10) || (i + 1);
    await db.execute(
      `INSERT INTO achievements (id, name, description, icon, requirement_type, requirement_value, category, dinosaur, rarity, order_num)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         icon = excluded.icon,
         requirement_type = excluded.requirement_type,
         requirement_value = excluded.requirement_value,
         category = excluded.category,
         dinosaur = excluded.dinosaur,
         rarity = excluded.rarity,
         order_num = excluded.order_num`,
      [
        a.id,
        a.name,
        a.requirementDescription,
        a.icon,
        a.requirement_type,
        a.requirement_value,
        a.category,
        a.dinosaur,
        a.rarity,
        orderNum,
      ]
    );
  }
}

// --- Achievement Metric Queries ---

export async function getCompletedProjectTasksCount(): Promise<number> {
  const db = await getDb();
  const res = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM project_tasks WHERE completed = 1'
  );
  return res[0]?.count || 0;
}

export async function getTotalIdeasCount(): Promise<number> {
  const db = await getDb();
  const res = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM ideas'
  );
  return res[0]?.count || 0;
}

export async function getDistinctHabitCompletionDaysCount(): Promise<number> {
  const db = await getDb();
  const res = await db.select<{ count: number }[]>(
    'SELECT COUNT(DISTINCT date) as count FROM habit_completions WHERE completed = 1'
  );
  return res[0]?.count || 0;
}

export async function getCompletedFocusAndPomoCount(): Promise<number> {
  const db = await getDb();
  const focus = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM focus_sessions WHERE status = 'completed'"
  );
  const pomo = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE completed = 1'
  );
  return (focus[0]?.count || 0) + (pomo[0]?.count || 0);
}

export async function getLateNightFocusCount(): Promise<number> {
  const db = await getDb();
  const focus = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM focus_sessions 
     WHERE status = 'completed' AND (strftime('%H', started_at) >= '21' OR strftime('%H', started_at) < '05')`
  );
  return focus[0]?.count || 0;
}

export async function getEarlyWakeUpCount(): Promise<number> {
  const db = await getDb();
  const res = await db.select<{ count: number }[]>(
    `SELECT COUNT(DISTINCT c.id) as count FROM habit_completions c
     JOIN habits h ON c.habit_id = h.id
     WHERE c.completed = 1 AND (
       lower(h.name) LIKE '%wake%' OR 
       lower(h.name) LIKE '%morning%' OR 
       lower(h.name) LIKE '%early%' OR 
       lower(h.category) LIKE '%morning%' OR
       strftime('%H', c.created_at) < '09'
     )`
  );
  return res[0]?.count || 0;
}

export async function getHabitCompletionsByKeywords(keywords: string[]): Promise<number> {
  const db = await getDb();
  const likes = keywords.map(() => "(lower(h.name) LIKE ? OR lower(h.category) LIKE ?)").join(' OR ');
  const params = keywords.flatMap((k) => [`%${k.toLowerCase()}%`, `%${k.toLowerCase()}%`]);
  const res = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM habit_completions c
     JOIN habits h ON c.habit_id = h.id
     WHERE c.completed = 1 AND (${likes})`,
    params
  );
  return res[0]?.count || 0;
}

// ============================================================
// ROW PARSERS
// ============================================================

interface HabitRow {
  id: string; name: string; description: string; icon: string; category: string;
  frequency: string; specific_days: string; target_value: number; target_unit: string;
  color: string; reminder_enabled: number; reminder_time: string; start_date: string;
  end_date: string | null; created_at: string; updated_at: string;
  archived: number; archived_at: string | null; sort_order: number;
}

function parseHabitRow(row: HabitRow): Habit {
  return {
    id: row.id, name: row.name, description: row.description, icon: row.icon,
    category: row.category, frequency: row.frequency as Habit['frequency'],
    specific_days: JSON.parse(row.specific_days || '[]'), target_value: row.target_value,
    target_unit: row.target_unit, color: row.color,
    reminder_enabled: row.reminder_enabled === 1, reminder_time: row.reminder_time,
    start_date: row.start_date, end_date: row.end_date, created_at: row.created_at,
    updated_at: row.updated_at, archived: row.archived === 1,
    archived_at: row.archived_at, sort_order: row.sort_order,
  };
}

interface JournalRow {
  id: string; date: string; title: string; content: string; mood: number;
  tags: string; created_at: string; updated_at: string;
}

function parseJournalRow(row: JournalRow): JournalEntry {
  return {
    id: row.id, date: row.date, title: row.title, content: row.content,
    mood: row.mood, tags: JSON.parse(row.tags || '[]'),
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

interface NotificationRow {
  id: string; type: string; title: string; message: string;
  read: number; data: string; created_at: string;
}

function parseNotificationRow(row: NotificationRow): AppNotification {
  return {
    id: row.id, type: row.type as AppNotification['type'],
    title: row.title, message: row.message, read: row.read === 1,
    data: JSON.parse(row.data || '{}'), created_at: row.created_at,
  };
}

interface SettingsRow {
  id: string; theme: string; roast_level: string; notifications_enabled: number;
  reminder_sound: number; weekly_report_enabled: number; monthly_report_enabled: number;
  evening_checkin_enabled: number; evening_checkin_time: string;
  week_start: string; date_format: string; time_format: string;
}

interface ReminderRow {
  id: string; title: string; description: string; date: string; time: string;
  habit_id: string | null; completed: number; created_at: string; updated_at: string;
}

function parseReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id, title: row.title, description: row.description,
    date: row.date, time: row.time, habit_id: row.habit_id,
    completed: row.completed === 1, created_at: row.created_at, updated_at: row.updated_at,
  };
}

interface TodoRow {
  id: string; title: string; description: string; completed: number;
  priority: string; category: string; due_date: string | null; due_time: string | null;
  created_at: string; completed_at: string | null; updated_at: string; sort_order: number;
}

function parseTodoRow(row: TodoRow): Todo {
  return {
    id: row.id, title: row.title, description: row.description,
    completed: row.completed === 1, priority: row.priority as TodoPriority,
    category: row.category, due_date: row.due_date, due_time: row.due_time,
    created_at: row.created_at, completed_at: row.completed_at,
    updated_at: row.updated_at, sort_order: row.sort_order,
  };
}

interface ProjectRow {
  id: string; name: string; description: string; status: string; color: string;
  idea_id: string | null; created_at: string; updated_at: string;
}

function parseProjectRow(row: ProjectRow): Project {
  return {
    id: row.id, name: row.name, description: row.description,
    status: row.status as ProjectStatus, color: row.color,
    idea_id: row.idea_id, created_at: row.created_at, updated_at: row.updated_at,
  };
}

interface ProjectTaskRow {
  id: string; project_id: string; title: string; completed: number;
  sort_order: number; created_at: string;
}

function parseProjectTaskRow(row: ProjectTaskRow): ProjectTask {
  return {
    id: row.id, project_id: row.project_id, title: row.title,
    completed: row.completed === 1, sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

interface ProjectNoteRow {
  id: string; project_id: string; content: string;
  created_at: string; updated_at: string;
}

function parseProjectNoteRow(row: ProjectNoteRow): ProjectNote {
  return {
    id: row.id, project_id: row.project_id, content: row.content,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

interface ProjectHabitRow {
  id: string; project_id: string; habit_id: string; created_at: string;
}

function parseProjectHabitRow(row: ProjectHabitRow): ProjectHabitLink {
  return {
    id: row.id, project_id: row.project_id, habit_id: row.habit_id,
    created_at: row.created_at,
  };
}

interface IdeaRow {
  id: string; title: string; description: string; project_id: string | null;
  archived?: number; archived_at?: string | null;
  created_at: string;
}

function parseIdeaRow(row: IdeaRow): Idea {
  return {
    id: row.id, title: row.title, description: row.description,
    project_id: row.project_id,
    archived: !!row.archived, archived_at: row.archived_at ?? null,
    created_at: row.created_at,
  };
}
