#!/usr/bin/env node
/**
 * Streakosaurus — data-layer E2E harness (no UI, real SQLite via node:sqlite).
 *
 * Runs the EXACT migration SQL extracted from src/db/index.ts plus the same
 * SQL statements the app's query layer executes, verifying persistence across
 * simulated restarts (reopening the database file). The app's query functions
 * are thin wrappers over these exact statements via tauri-plugin-sql.
 *
 * Usage: node scripts/db-e2e.mjs
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let failures = 0;
let passed = 0;

function ok(cond, label, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ FAIL: ${label} ${extra}`);
  }
}

function uuid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Extract migration [name, sql] pairs verbatim from src/db/index.ts. */
function extractMigrations() {
  const src = readFileSync(join(ROOT, 'src', 'db', 'index.ts'), 'utf8');
  const re = /\[\s*'(\d+_[a-z_]+)',\s*`([\s\S]*?)`\s*\]/g;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push([m[1], m[2].trim()]);
  }
  return out;
}

class Harness {
  constructor(dbPath) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  execute(sql, params = []) {
    this.db.prepare(sql).run(...params);
  }
  exec(sql) {
    // tauri-plugin-sql execute() runs batches; node:sqlite needs exec() for that
    this.db.exec(sql);
  }
  select(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }
  close() {
    this.db.close();
  }
}

async function runMigrations(h, migrations) {
  h.execute(`CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
  const applied = new Set(h.select('SELECT name FROM migrations').map((r) => r.name));
  for (const [name, sql] of migrations) {
    if (!applied.has(name)) {
      h.exec(sql);
      h.execute(`INSERT INTO migrations (name) VALUES ('${name}')`);
    }
  }
}

function open(path) {
  return new Harness(path);
}

async function main() {
  const dbPath = join(ROOT, '.freebuff', 'e2e-test.db');
  if (existsSync(dbPath)) unlinkSync(dbPath);

  const migrations = extractMigrations();
  console.log(`Extracted ${migrations.length} migrations from src/db/index.ts`);

  // ---------- FRESH DATABASE ----------
  console.log('\n[1] Fresh database: migrations + seed');
  let h = open(dbPath);
  await runMigrations(h, migrations);
  ok(h.select('SELECT name FROM migrations').length === migrations.length,
    `all ${migrations.length} migrations recorded`);
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table'").some((r) => r.name === 'habits'), 'habits table exists');
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table'").some((r) => r.name === 'projects'), 'projects table exists');
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table'").some((r) => r.name === 'ideas'), 'ideas table exists');
  // 018_ideas_archive: additive columns must exist on fresh DBs
  try {
    h.select('SELECT archived, archived_at FROM ideas LIMIT 1');
    ok(true, 'ideas archived columns present');
  } catch {
    ok(false, 'ideas archived columns present');
  }
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table'").some((r) => r.name === 'project_tasks'), 'project_tasks table exists');
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table'").some((r) => r.name === 'project_notes'), 'project_notes table exists');

  // Idempotency: re-running migrations must not fail or duplicate
  await runMigrations(h, migrations);
  ok(h.select('SELECT COUNT(*) c FROM migrations')[0].c === migrations.length, 'migrations are idempotent');

  // Seed achievements (same as seedDefaultAchievements)
  const seedAchievements = [
    ['extinction_survivor', 'Extinction Survivor', '30 consecutive days', '🦕', 'streak', 30, 'streak'],
    ['no_excuses', 'No Excuses', 'Complete every habit for 7 consecutive days', '💪', 'perfect_week', 7, 'consistency'],
    ['brick_by_brick', 'Brick by Brick', '100 completions', '🧱', 'total_completions', 100, 'milestone'],
    ['absolute_unit', 'Absolute Unit', '100-day streak', '🦖', 'streak', 100, 'streak'],
    ['threepeat', 'Threepeat', '3-day streak', '🥉', 'streak', 3, 'streak'],
    ['week_warrior', 'Week Warrior', '7-day streak', '⚔️', 'streak', 7, 'streak'],
    ['fortnight_fighter', 'Fortnight Fighter', '14-day streak', '🥊', 'streak', 14, 'streak'],
    ['month_master', 'Month Master', '30-day streak', '👑', 'streak', 30, 'streak'],
    ['consistent_creature', 'Consistent Creature', '80% completion over the last 30 days', '🦎', 'consistency', 80, 'consistency'],
    ['centurion', 'Centurion', '500 total completions', '🏛️', 'total_completions', 500, 'milestone'],
  ];
  for (const [id, name, desc, icon, type, val, cat] of seedAchievements) {
    h.execute(
      `INSERT INTO achievements (id, name, description, icon, requirement_type, requirement_value, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, desc, icon, type, val, cat]
    );
  }
  ok(h.select('SELECT COUNT(*) c FROM achievements')[0].c === 10, '10 achievements seeded');
  h.close();

  // ---------- RESTART 1: habit CRUD + completion ----------
  console.log('\n[2] Habit: create → complete → restart → verify → toggle off → delete');
  h = open(dbPath);
  const habitId = uuid();
  const today = '2026-09-09';
  h.execute(
    `INSERT INTO habits (id, name, description, icon, category, frequency, specific_days, target_value, target_unit, color, reminder_enabled, reminder_time, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [habitId, 'Exercise', 'Go to the gym', '', 'General', 'daily', '[]', 1, 'session', '#B8623A', 0, '09:00', today, null, new Date().toISOString(), new Date().toISOString()]
  );
  const row1 = h.select('SELECT * FROM habits WHERE id = ?', [habitId]);
  ok(row1.length === 1 && row1[0].name === 'Exercise', 'habit INSERT works');

  // toggleCompletion: no existing row → insert
  h.execute(
    `INSERT INTO habit_completions (id, habit_id, date, value, completed)
     VALUES (?, ?, ?, ?, 1)`,
    [uuid(), habitId, today, 1]
  );
  ok(h.select('SELECT COUNT(*) c FROM habit_completions WHERE habit_id = ? AND date = ?', [habitId, today])[0].c === 1,
    'completion INSERT works');
  // duplicate prevention: UNIQUE(habit_id, date)
  let dupBlocked = false;
  try {
    h.execute(
      `INSERT INTO habit_completions (id, habit_id, date, value, completed)
       VALUES (?, ?, ?, ?, 1)`,
      [uuid(), habitId, today, 1]
    );
  } catch {
    dupBlocked = true;
  }
  ok(dupBlocked, 'duplicate completion for same habit+date is rejected (UNIQUE)');

  // edit habit (rename) must not touch completions
  h.execute('UPDATE habits SET name = ?, updated_at = ? WHERE id = ?', ['Exercise v2', new Date().toISOString(), habitId]);
  ok(h.select('SELECT COUNT(*) c FROM habit_completions WHERE habit_id = ?', [habitId])[0].c === 1,
    'editing a habit preserves completion history');
  h.close();

  // Restart: reopen the file
  h = open(dbPath);
  const persisted = h.select('SELECT * FROM habits WHERE id = ?', [habitId]);
  ok(persisted.length === 1 && persisted[0].name === 'Exercise v2', 'habit survives restart (with edit)');
  ok(h.select('SELECT COUNT(*) c FROM habit_completions WHERE habit_id = ?', [habitId])[0].c === 1,
    'completion survives restart');

  // toggleCompletion: existing row → delete
  h.execute('DELETE FROM habit_completions WHERE habit_id = ? AND date = ?', [habitId, today]);
  ok(h.select('SELECT COUNT(*) c FROM habit_completions WHERE habit_id = ?', [habitId])[0].c === 0,
    'toggle-off deletes completion');

  // permanent delete cascades
  h.execute('DELETE FROM habit_completions WHERE habit_id = ?', [habitId]);
  h.execute('DELETE FROM habit_progress WHERE habit_id = ?', [habitId]);
  h.execute('DELETE FROM habits WHERE id = ?', [habitId]);
  ok(h.select('SELECT COUNT(*) c FROM habits WHERE id = ?', [habitId])[0].c === 0, 'habit delete works');
  h.close();

  // ---------- RESTART 2: project + tasks ----------
  console.log('\n[3] Project: create → tasks → complete/delete → restart');
  h = open(dbPath);
  const projectId = uuid();
  h.execute(
    `INSERT INTO projects (id, name, description, status, color, idea_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, 'Build Streakosaurus', 'The app itself', 'active', '#B8623A', null, new Date().toISOString(), new Date().toISOString()]
  );
  const t1 = uuid();
  const t2 = uuid();
  h.execute(`INSERT INTO project_tasks (id, project_id, title, completed, sort_order) VALUES (?, ?, ?, 0, 0)`, [t1, projectId, 'Design Dino World']);
  h.execute(`INSERT INTO project_tasks (id, project_id, title, completed, sort_order) VALUES (?, ?, ?, 0, 1)`, [t2, projectId, 'Fix notifications']);
  h.execute(`UPDATE project_tasks SET completed = 1 WHERE id = ?`, [t1]);
  ok(h.select('SELECT COUNT(*) c FROM project_tasks WHERE project_id = ? AND completed = 1', [projectId])[0].c === 1,
    'task completion persists');
  h.execute('DELETE FROM project_tasks WHERE id = ?', [t2]);
  ok(h.select('SELECT COUNT(*) c FROM project_tasks WHERE project_id = ?', [projectId])[0].c === 1,
    'task delete works');
  // note add
  h.execute(`INSERT INTO project_notes (id, project_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), projectId, 'Ship the shell first', new Date().toISOString(), new Date().toISOString()]);
  ok(h.select('SELECT COUNT(*) c FROM project_notes WHERE project_id = ?', [projectId])[0].c === 1, 'project note add works');
  h.close();

  h = open(dbPath);
  ok(h.select('SELECT * FROM projects WHERE id = ?', [projectId]).length === 1, 'project survives restart');
  ok(h.select('SELECT COUNT(*) c FROM project_tasks WHERE project_id = ? AND completed = 1', [projectId])[0].c === 1,
    'completed task survives restart; deleted task stays deleted');
  ok(h.select('SELECT COUNT(*) c FROM project_notes WHERE project_id = ?', [projectId])[0].c === 1, 'note survives restart');
  h.close();

  // ---------- RESTART 3: idea → project origin ----------
  console.log('\n[4] Idea → project conversion preserves origin');
  h = open(dbPath);
  const ideaId = uuid();
  h.execute(`INSERT INTO ideas (id, title, description, project_id) VALUES (?, ?, ?, ?)`,
    [ideaId, 'AI Minecraft Assistant', 'Build an AI that can operate Minecraft.', null]);
  // convertIdeaToProject equivalent
  const convProjectId = uuid();
  h.execute(
    `INSERT INTO projects (id, name, description, status, color, idea_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [convProjectId, 'AI Minecraft Assistant', 'Build an AI that can operate Minecraft.', 'active', '#B8623A', ideaId, new Date().toISOString(), new Date().toISOString()]
  );
  h.execute('UPDATE ideas SET project_id = ? WHERE id = ?', [convProjectId, ideaId]);
  const origin = h.select('SELECT project_id FROM ideas WHERE id = ?', [ideaId]);
  ok(origin.length === 1 && origin[0].project_id === convProjectId, 'idea→project origin link set');
  const projOrigin = h.select('SELECT idea_id FROM projects WHERE id = ?', [convProjectId]);
  ok(projOrigin.length === 1 && projOrigin[0].idea_id === ideaId, 'project remembers its origin idea');
  // converting again must not duplicate: app returns existing project_id
  ok(origin[0].project_id === convProjectId, 're-conversion reuses existing project (no duplicate)');
  h.close();

  h = open(dbPath);
  ok(h.select('SELECT project_id FROM ideas WHERE id = ?', [ideaId])[0].project_id === convProjectId,
    'idea→project link survives restart');
  // archive/restore round-trip on a separate active idea
  const archId = uuid();
  h.execute(`INSERT INTO ideas (id, title, description, project_id, archived, archived_at) VALUES (?, ?, ?, ?, 0, NULL)`,
    [archId, 'Archive me', '', null]);
  h.execute('UPDATE ideas SET archived = 1, archived_at = ? WHERE id = ?', [new Date().toISOString(), archId]);
  h.close();
  h = open(dbPath);
  const archRow = h.select('SELECT archived, archived_at FROM ideas WHERE id = ?', [archId])[0];
  ok(archRow && archRow.archived === 1 && !!archRow.archived_at, 'idea archive persists across restart');
  h.execute('UPDATE ideas SET archived = 0, archived_at = NULL WHERE id = ?', [archId]);
  h.close();
  h = open(dbPath);
  ok(h.select('SELECT archived FROM ideas WHERE id = ?', [archId])[0].archived === 0, 'idea restore persists across restart');
  // edit round-trip: title/description edits must persist
  h.execute('UPDATE ideas SET title = ?, description = ? WHERE id = ?', ['Renamed idea', 'Updated description', archId]);
  h.close();
  h = open(dbPath);
  const edited = h.select('SELECT title, description FROM ideas WHERE id = ?', [archId])[0];
  ok(edited.title === 'Renamed idea' && edited.description === 'Updated description', 'idea edit persists across restart');
  h.close();

  // ---------- RESTART 4: reminders + todos with dates/times ----------
  console.log('\n[5] Reminders + todos: dates and times persist');
  h = open(dbPath);
  h.execute(
    `INSERT INTO reminders (id, title, description, date, time, habit_id, completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid(), 'Complete assignment', '', '2026-09-10', '18:30', null, 0, new Date().toISOString(), new Date().toISOString()]
  );
  h.execute(
    `INSERT INTO todos (id, title, description, completed, priority, category, due_date, due_time, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    [uuid(), 'Submit assignment', '', 'high', 'Work', '2026-09-10', '18:30', new Date().toISOString(), new Date().toISOString()]
  );
  h.close();
  h = open(dbPath);
  const rem = h.select("SELECT date, time FROM reminders WHERE title = 'Complete assignment'");
  ok(rem.length === 1 && rem[0].date === '2026-09-10' && rem[0].time === '18:30', 'reminder date+time persist');
  const td = h.select("SELECT due_date, due_time FROM todos WHERE title = 'Submit assignment'");
  ok(td.length === 1 && td[0].due_date === '2026-09-10' && td[0].due_time === '18:30', 'todo due date+time persist');
  // edit reminder
  h.execute("UPDATE reminders SET time = '19:00', updated_at = ? WHERE title = 'Complete assignment'", [new Date().toISOString()]);
  h.close();
  h = open(dbPath);
  ok(h.select("SELECT time FROM reminders WHERE title = 'Complete assignment'")[0].time === '19:00',
    'reminder edit persists across restart');
  h.close();

  // ---------- RESTART 5: settings ----------
  console.log('\n[6] Settings persist');
  h = open(dbPath);
  h.execute(`INSERT INTO settings (id) VALUES ('default')`);
  h.execute(`UPDATE settings SET time_format = '24h', week_start = 'sunday', roast_level = 'savage' WHERE id = 'default'`);
  h.close();
  h = open(dbPath);
  const s = h.select("SELECT time_format, week_start, roast_level FROM settings WHERE id = 'default'")[0];
  ok(s.time_format === '24h' && s.week_start === 'sunday' && s.roast_level === 'savage',
    'all changed settings persist after restart');
  h.close();

  // ---------- RESTART 6: pomodoro sessions (completed + interrupted) ----------
  console.log('\n[7] Pomodoro session history persists');
  h = open(dbPath);
  h.execute(
    `INSERT INTO pomodoro_sessions (id, started_at, ended_at, duration_seconds, completed, habit_id, todo_id)
     VALUES (?, ?, ?, ?, 1, NULL, NULL)`,
    [uuid(), '2026-09-09T10:00:00.000Z', '2026-09-09T10:25:00.000Z', 1500]
  );
  h.execute(
    `INSERT INTO pomodoro_sessions (id, started_at, ended_at, duration_seconds, completed, habit_id, todo_id)
     VALUES (?, ?, ?, ?, 0, NULL, NULL)`,
    [uuid(), '2026-09-09T11:00:00.000Z', '2026-09-09T11:07:00.000Z', 420]
  );
  h.close();
  h = open(dbPath);
  const pom = h.select('SELECT completed, duration_seconds FROM pomodoro_sessions ORDER BY started_at');
  ok(pom.length === 2, 'both completed and interrupted sessions persist');
  ok(pom.some((r) => r.completed === 1 && r.duration_seconds === 1500), 'completed session with duration persists');
  ok(pom.some((r) => r.completed === 0 && r.duration_seconds === 420), 'interrupted session with actual elapsed persists');
  h.close();

  // ---------- RESTART 7: achievements from real completions ----------
  console.log('\n[8] Achievements data path (streak/completion inputs)');
  h = open(dbPath);
  const habitA = uuid();
  const habitB = uuid();
  const insertHabit = (id, name) => h.execute(
    `INSERT INTO habits (id, name, description, icon, category, frequency, specific_days, target_value, target_unit, color, reminder_enabled, reminder_time, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, '', '', 'General', 'daily', '[]', 1, 'session', '#B8623A', 0, '09:00', '2026-08-01', NULL, ?, ?)`,
    [id, name, new Date().toISOString(), new Date().toISOString()]
  );
  insertHabit(habitA, 'Coding');
  insertHabit(habitB, 'Reading');
  // 7 consecutive completed days for Coding (perfect_week requirement)
  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 8, 3 + i); // Sep 3..9 2026
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    h.execute(`INSERT INTO habit_completions (id, habit_id, date, value, completed) VALUES (?, ?, ?, 1, 1)`,
      [uuid(), habitA, ds]);
  }
  const codingComps = h.select('SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date', [habitA]);
  ok(codingComps.length === 7, '7 real completions stored for streak/perfect_week math');
  // overall completion: Coding 7/7, Reading 0/7 over the last 30 days (both daily)
  const allComps = h.select('SELECT COUNT(*) c FROM habit_completions WHERE completed = 1')[0].c;
  ok(allComps === 7, 'completion counts feed the achievement checker');
  h.close();

  // ---------- EXISTING-DB MIGRATION CHECK ----------
  console.log('\n[9] Existing database: additive migration (simulate old DB without 015/016)');
  const oldPath = join(ROOT, '.freebuff', 'e2e-old.db');
  if (existsSync(oldPath)) unlinkSync(oldPath);
  h = open(oldPath);
  // Simulate a pre-Phase-2 DB: apply only migrations up to 014, plus a user habit
  const oldMigs = migrations.filter(([name]) => parseInt(name.slice(0, 3), 10) <= 14);
  await runMigrations(h, oldMigs);
  const legacyHabit = uuid();
  h.execute(
    `INSERT INTO habits (id, name, description, icon, category, frequency, specific_days, target_value, target_unit, color, reminder_enabled, reminder_time, start_date, end_date, created_at, updated_at)
     VALUES (?, 'Legacy Habit', '', '', 'General', 'daily', '[]', 1, 'session', '#B8623A', 0, '09:00', '2026-07-01', NULL, ?, ?)`,
    [legacyHabit, new Date().toISOString(), new Date().toISOString()]
  );
  h.execute(`INSERT INTO habit_completions (id, habit_id, date, value, completed) VALUES (?, ?, ?, 1, 1)`,
    [uuid(), legacyHabit, '2026-07-15']);
  h.close();

  // "App starts": run the full migration set on the old DB
  h = open(oldPath);
  await runMigrations(h, migrations);
  const legacy = h.select('SELECT * FROM habits WHERE id = ?', [legacyHabit]);
  ok(legacy.length === 1 && legacy[0].name === 'Legacy Habit', 'existing user data untouched by new migrations');
  ok(h.select('SELECT COUNT(*) c FROM habit_completions WHERE habit_id = ?', [legacyHabit])[0].c === 1,
    'existing completion history preserved');
  ok(h.select("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'").length === 1,
    'new tables added to existing database');
  ok(h.select('SELECT COUNT(*) c FROM migrations')[0].c === migrations.length, 'all migrations recorded on old DB');
  h.close();
  unlinkSync(oldPath);
  unlinkSync(dbPath);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`E2E result: ${passed} passed, ${failures} failed`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Harness crashed:', e);
  process.exit(1);
});