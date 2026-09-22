// ============================================================
// Streakosaurus — Core Types
// ============================================================

// --- Habit ---

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'specific_days' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  frequency: HabitFrequency;
  specific_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  target_value: number;
  target_unit: string;
  color: string;
  reminder_enabled: boolean;
  reminder_time: string; // HH:MM
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  archived_at: string | null;
  sort_order: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  value: number;
  completed: boolean;
  notes: string;
  created_at: string;
}

export interface HabitProgress {
  id: string;
  habit_id: string;
  date: string;
  current_streak: number;
  best_streak: number;
  total_completions: number;
  total_missed: number;
}

// --- Journal (DB only, UI removed) ---

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: number; // 1-5
  tags: string[];
  created_at: string;
  updated_at: string;
}

// --- Reminders ---

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  habit_id: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// --- Todos ---

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TodoPriority;
  category: string;
  due_date: string | null;
  due_time: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
  sort_order: number;
}

// --- Pomodoro ---

export type PomodoroSessionStatus = 'completed' | 'interrupted';

export interface PomodoroSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  completed: boolean;
  habit_id: string | null;
  todo_id: string | null;
}

export interface PomodoroSettings {
  focus_duration: number; // minutes
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
}

// --- Focus (Lock-In) ---

export type FocusSessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface FocusSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  target_seconds: number | null;
  status: FocusSessionStatus;
  habit_id: string | null;
  todo_id: string | null;
}

// --- Achievements ---

export type DinoRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type EvolutionStage = 'egg' | 'child' | 'adult' | 'fullyGrown';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  category: string;
  dinosaur?: string;
  rarity?: DinoRarity;
  order_num?: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
}

// --- Notifications ---

export type NotificationType =
  | 'habit_reminder'
  | 'evening_checkin'
  | 'streak_warning'
  | 'achievement'
  | 'weekly_report'
  | 'monthly_report'
  | 'insight';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// --- Settings ---

export interface AppSettings {
  id: string;
  theme: 'dark' | 'light';
  roast_level: 'professional' | 'friendly' | 'sarcastic' | 'savage';
  notifications_enabled: boolean;
  reminder_sound: boolean;
  weekly_report_enabled: boolean;
  monthly_report_enabled: boolean;
  evening_checkin_enabled: boolean;
  evening_checkin_time: string;
  week_start: 'monday' | 'sunday';
  date_format: string;
  time_format: '12h' | '24h';
}

// --- Projects ---

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  idea_id: string | null; // set when an idea is converted into this project
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * A connection between a project and an existing habit. It stores the
 * relationship only — the habit itself stays in the habits table.
 */
export interface ProjectHabitLink {
  id: string;
  project_id: string;
  habit_id: string;
  created_at: string;
}

// --- Ideas ---

export interface Idea {
  id: string;
  title: string;
  description: string;
  project_id: string | null; // linked when converted into a project
  archived: boolean;
  archived_at: string | null;
  created_at: string;
}

// --- Reports ---

export interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  overall_score: number;
  completion_rate: number;
  previous_week_change: number;
  best_habit: string;
  worst_habit: string;
  most_improved: string;
  biggest_decline: string;
  longest_streak: string;
  most_missed: string;
  total_completions: number;
  total_missed: number;
  insights: string[];
  generated_at: string;
}

export interface MonthlyReport {
  id: string;
  month: string; // YYYY-MM
  overall_score: number;
  completion_rate: number;
  previous_month_change: number;
  best_habit: string;
  worst_habit: string;
  most_improved: string;
  biggest_decline: string;
  longest_streak: string;
  best_day: string;
  best_week: string;
  total_completions: number;
  total_missed: number;
  consistency: number;
  insights: string[];
  generated_at: string;
}

// --- Analytics ---

export interface AnalyticsOverview {
  overall_completion: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  total_missed: number;
  best_day: string;
  best_week: string;
  best_month: string;
  consistency: number;
}

export interface HabitAnalytics {
  habit_id: string;
  habit_name: string;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  total_completions: number;
  total_missed: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// --- Dashboard ---

export interface DashboardData {
  greeting: string;
  today_progress: number;
  habits_completed_today: number;
  total_habits_today: number;
  current_streak: number;
  longest_streak: number;
  weekly_score: number;
  today_habits: HabitWithStatus[];
  weekly_overview: WeekDay[];
  recent_activity: ActivityItem[];
  upcoming_reminders: ReminderItem[];
  personality_message: string;
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean;
  completion_value: number;
}

export interface WeekDay {
  date: string;
  day_name: string;
  score: number;
  completed: number;
  total: number;
  is_today: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'completion' | 'streak' | 'achievement';
  message: string;
  timestamp: string;
  icon: string;
}

export interface ReminderItem {
  habit_name: string;
  habit_icon: string;
  time: string;
  habit_id: string;
}

// --- Roast Engine ---

export type RoastLevel = 'professional' | 'friendly' | 'sarcastic' | 'savage';

export interface RoastContext {
  habit_name: string;
  metric: string;
  value: number;
  change?: number;
  streak?: number;
  comparison?: string;
  /** Completed occurrences — only some templates need it. */
  count?: number;
  /** Scheduled occurrences — only some templates need it. */
  total?: number;
}

// --- Navigation ---

export type PageId =
  | 'dashboard'
  | 'habits'
  | 'projects'
  | 'ideas'
  | 'calendar'
  | 'reports'
  | 'dinoworld'
  | 'todos'
  | 'focus'
  | 'settings'
  | 'notifications';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
}
