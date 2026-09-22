// ============================================================
// Streakosaurus — Database Initialization & Migrations
// ============================================================

import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;
export let isDbAvailable = false;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:streakosaurus.db');
    await runMigrations(db);
    isDbAvailable = true;
  }
  return db;
}

export async function getDbSafe(): Promise<Database | null> {
  try {
    return await getDb();
  } catch {
    return null;
  }
}

async function runMigrations(database: Database): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = await database.select<{ name: string }[]>(
    'SELECT name FROM migrations'
  );
  const appliedNames = new Set(applied.map((r) => r.name));

  const migrations: [string, string][] = [
    ['001_habits', `
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '📋',
        category TEXT DEFAULT 'General',
        frequency TEXT NOT NULL DEFAULT 'daily',
        specific_days TEXT DEFAULT '[]',
        target_value REAL DEFAULT 1,
        target_unit TEXT DEFAULT 'session',
        color TEXT DEFAULT '#B8623A',
        reminder_enabled INTEGER DEFAULT 0,
        reminder_time TEXT DEFAULT '09:00',
        start_date TEXT NOT NULL,
        end_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        archived INTEGER DEFAULT 0,
        archived_at TEXT,
        sort_order INTEGER DEFAULT 0
      );
    `],
    ['002_habit_completions', `
      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL DEFAULT 1,
        completed INTEGER DEFAULT 1,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(habit_id, date)
      );
    `],
    ['003_habit_progress', `
      CREATE TABLE IF NOT EXISTS habit_progress (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        total_completions INTEGER DEFAULT 0,
        total_missed INTEGER DEFAULT 0,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(habit_id, date)
      );
    `],
    ['004_journal_entries', `
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        title TEXT DEFAULT '',
        content TEXT DEFAULT '',
        mood INTEGER DEFAULT 3,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `],
    ['005_achievements', `
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT DEFAULT '🏆',
        requirement_type TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        category TEXT DEFAULT 'general'
      );
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL,
        earned_at TEXT NOT NULL DEFAULT (datetime('now')),
        progress INTEGER DEFAULT 0,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
      );
    `],
    ['006_notifications', `
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        data TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `],
    ['007_settings', `
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        theme TEXT DEFAULT 'dark',
        roast_level TEXT DEFAULT 'sarcastic',
        notifications_enabled INTEGER DEFAULT 1,
        reminder_sound INTEGER DEFAULT 1,
        weekly_report_enabled INTEGER DEFAULT 1,
        monthly_report_enabled INTEGER DEFAULT 1,
        evening_checkin_enabled INTEGER DEFAULT 1,
        evening_checkin_time TEXT DEFAULT '20:00',
        week_start TEXT DEFAULT 'monday',
        date_format TEXT DEFAULT 'YYYY-MM-DD',
        time_format TEXT DEFAULT '12h'
      );
    `],
    ['008_reports', `
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        generated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `],
    ['009_indexes', `
      CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, date);
      CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date);
      CREATE INDEX IF NOT EXISTS idx_progress_habit_date ON habit_progress(habit_id, date);
      CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    `],
    ['010_todos', `
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        completed INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'General',
        due_date TEXT,
        due_time TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        sort_order INTEGER DEFAULT 0
      );
    `],
    ['011_reminders', `
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        date TEXT NOT NULL,
        time TEXT DEFAULT '09:00',
        habit_id TEXT,
        completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date);
    `],
    ['012_pomodoro', `
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        habit_id TEXT,
        todo_id TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE SET NULL,
        FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL
      );
    `],
    ['013_focus_sessions', `
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER DEFAULT 0,
        target_seconds INTEGER,
        status TEXT DEFAULT 'active',
        habit_id TEXT,
        todo_id TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE SET NULL,
        FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE SET NULL
      );
    `],
    ['014_todos_indexes', `
      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
      CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
      CREATE INDEX IF NOT EXISTS idx_focus_status ON focus_sessions(status);
    `],
    ['015_projects', `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'active',
        color TEXT DEFAULT '#B8623A',
        idea_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS project_tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS project_notes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_notes_project ON project_notes(project_id);
    `],
    ['016_ideas', `
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        project_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ideas_project ON ideas(project_id);
    `],
    // Projects connect to habits without duplicating them: the link table holds
    // only the relationship. Additive — no existing table is altered.
    ['017_project_habits', `
      CREATE TABLE IF NOT EXISTS project_habits (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        habit_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        UNIQUE(project_id, habit_id)
      );
      CREATE INDEX IF NOT EXISTS idx_project_habits_project ON project_habits(project_id);
    `],
    // Ideas can be archived without deleting them. Additive column only —
    // existing idea rows keep their data (default 0 = active).
    ['018_ideas_archive', `
      ALTER TABLE ideas ADD COLUMN archived INTEGER DEFAULT 0;
      ALTER TABLE ideas ADD COLUMN archived_at TEXT;
    `],
    // Dino World V2: Associate achievements with dinosaur companion, rarity and display order.
    ['019_dino_achievements', `
      ALTER TABLE achievements ADD COLUMN dinosaur TEXT;
      ALTER TABLE achievements ADD COLUMN rarity TEXT DEFAULT 'COMMON';
      ALTER TABLE achievements ADD COLUMN order_num INTEGER DEFAULT 1;
    `],
  ];

  for (const [name, sql] of migrations) {
    if (!appliedNames.has(name)) {
      await database.execute(sql);
      await database.execute(
        `INSERT INTO migrations (name) VALUES ('${name}')`
      );
    }
  }
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
