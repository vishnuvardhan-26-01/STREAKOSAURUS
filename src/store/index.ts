// ============================================================
// Streakosaurus — Global State (Zustand)
// ============================================================

import { create } from 'zustand';
import type {
  PageId,
  Habit,
  AppNotification,
  AppSettings,
  WeeklyReport,
  MonthlyReport,
  Reminder,
  Todo,
  PomodoroSession,
  PomodoroSettings,
  FocusSession,
  Project,
  Idea,
} from '../types';
import * as db from '../db/queries';
import { today, subtractDays, isHabitScheduledForDay } from '../utils/dates';
import { getOverallStreak } from '../utils/streaks';
import { generateInsights, type Insight as InsightType } from '../utils/insights';
import { generateWeeklyReport, generateMonthlyReport } from '../utils/reports';
import { checkAndAwardAchievements, type AchievementWithProgress } from '../utils/achievements';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../utils/notifications';

interface AppStore {
  // Navigation
  currentPage: PageId;
  setPage: (page: PageId) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Habits
  habits: Habit[];
  loadHabits: () => Promise<void>;
  archivedHabits: Habit[];
  loadArchivedHabits: () => Promise<void>;
  createHabit: (habit: Parameters<typeof db.createHabit>[0]) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<boolean>;

  // Dashboard
  dashboardProgress: number;
  habitsCompletedToday: number;
  totalHabitsToday: number;
  currentStreak: number;
  longestStreak: number;
  weeklyScore: number;
  loadDashboard: () => Promise<void>;

  // Achievements
  achievements: AchievementWithProgress[];
  loadAchievements: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Settings
  settings: AppSettings;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Insights
  insights: InsightType[];
  loadInsights: () => Promise<void>;

  // Reports
  weeklyReport: WeeklyReport | null;
  monthlyReport: MonthlyReport | null;
  loadWeeklyReport: () => Promise<void>;
  loadMonthlyReport: (month?: string) => Promise<void>;

  // Reminders
  reminders: Reminder[];
  upcomingReminders: Reminder[];
  loadReminders: () => Promise<void>;
  loadUpcomingReminders: () => Promise<void>;
  createReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Todos
  todos: Todo[];
  loadTodos: () => Promise<void>;
  createTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'completed_at' | 'updated_at' | 'sort_order'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  searchTodos: (query: string) => Promise<void>;

  // Projects
  projects: Project[];
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  convertIdeaToProject: (ideaId: string) => Promise<string | null>;

  // Ideas
  ideas: Idea[];
  loadIdeas: () => Promise<void>;
  createIdea: (idea: Omit<Idea, 'id' | 'created_at' | 'archived' | 'archived_at'>) => Promise<void>;
  updateIdea: (id: string, updates: { title?: string; description?: string; archived?: boolean }) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;

  // Pomodoro
  pomodoroSessions: PomodoroSession[];
  loadPomodoroSessions: () => Promise<void>;
  pomodoroSettings: PomodoroSettings;

  // Focus (Lock-In)
  focusSessions: FocusSession[];
  loadFocusSessions: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  // Navigation
  currentPage: 'dashboard',
  setPage: (page) => set({ currentPage: page }),

  // Loading
  isLoading: true,
  setLoading: (loading) => set({ isLoading: loading }),

  // Habits
  habits: [],
  archivedHabits: [],
  loadHabits: async () => {
    const habits = await db.getActiveHabits();
    set({ habits });
  },
  loadArchivedHabits: async () => {
    const archivedHabits = await db.getArchivedHabits();
    set({ archivedHabits });
  },
  createHabit: async (habit) => {
    await db.createHabit(habit);
    await get().loadHabits();
  },
  updateHabit: async (id, updates) => {
    await db.updateHabit(id, updates);
    await get().loadHabits();
  },
  deleteHabit: async (id) => {
    await db.deleteHabit(id);
    await get().loadHabits();
  },
  archiveHabit: async (id) => {
    await db.archiveHabit(id);
    await get().loadHabits();
  },
  restoreHabit: async (id) => {
    await db.restoreHabit(id);
    await get().loadHabits();
  },
  toggleCompletion: async (habitId, date) => {
    const result = await db.toggleCompletion(habitId, date);
    await get().loadDashboard();
    return result;
  },

  // Dashboard
  dashboardProgress: 0,
  habitsCompletedToday: 0,
  totalHabitsToday: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyScore: 0,
  loadDashboard: async () => {
    const habits = await db.getActiveHabits();
    const todayDate = today();
    const todayCompletions = await db.getCompletionsForDate(todayDate);
    const completedIds = new Set(todayCompletions.filter(c => c.completed).map(c => c.habit_id));

    const scheduledToday = habits.filter(h => isHabitScheduledForDay(h.frequency, h.specific_days, todayDate));
    const completedToday = scheduledToday.filter(h => completedIds.has(h.id)).length;
    const totalToday = scheduledToday.length;
    const progress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

    const streaks = await getOverallStreak(habits);
    const cs = streaks.current;
    const ls = streaks.longest;

    const weekStart = subtractDays(todayDate, 6);
    const weekCompletions = await db.getCompletionsRange(weekStart, todayDate);
    const weekCompleted = weekCompletions.filter(c => c.completed).length;
    let weekTotal = 0;
    for (const h of habits) {
      for (let i = 0; i < 7; i++) {
        const d = subtractDays(todayDate, 6 - i);
        if (isHabitScheduledForDay(h.frequency, h.specific_days, d)) weekTotal++;
      }
    }
    const ws = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    set({
      habits,
      dashboardProgress: progress,
      habitsCompletedToday: completedToday,
      totalHabitsToday: totalToday,
      currentStreak: cs,
      longestStreak: ls,
      weeklyScore: ws,
    });
  },

  // Achievements
  achievements: [],
  loadAchievements: async () => {
    const achievements = await checkAndAwardAchievements();
    set({ achievements });
  },

  // Notifications
  notifications: [],
  unreadCount: 0,
  loadNotifications: async () => {
    const notifications = await getNotifications();
    const unreadCount = await getUnreadCount();
    set({ notifications, unreadCount });
  },
  markNotificationRead: async (id) => {
    await markAsRead(id);
    await get().loadNotifications();
  },
  markAllNotificationsRead: async () => {
    await markAllAsRead();
    await get().loadNotifications();
  },

  // Settings
  settings: {
    id: 'default', theme: 'dark', roast_level: 'sarcastic',
    notifications_enabled: true, reminder_sound: true,
    weekly_report_enabled: true, monthly_report_enabled: true,
    evening_checkin_enabled: true, evening_checkin_time: '20:00',
    week_start: 'monday', date_format: 'YYYY-MM-DD', time_format: '12h',
  },
  loadSettings: async () => {
    const settings = await db.getSettings();
    set({ settings });
  },
  updateSettings: async (updates) => {
    const settings = await db.updateSettings(updates);
    set({ settings });
  },

  // Insights
  insights: [],
  loadInsights: async () => {
    const habits = await db.getActiveHabits();
    const insights = await generateInsights(habits);
    set({ insights });
  },

  // Reports
  weeklyReport: null,
  monthlyReport: null,
  loadWeeklyReport: async () => {
    const settings = get().settings;
    const report = await generateWeeklyReport(settings.roast_level);
    set({ weeklyReport: report });
  },
  loadMonthlyReport: async (month?: string) => {
    const settings = get().settings;
    const report = await generateMonthlyReport(month, settings.roast_level);
    set({ monthlyReport: report });
  },

  // Reminders
  reminders: [],
  upcomingReminders: [],
  loadReminders: async () => {
    const reminders = await db.getAllReminders();
    set({ reminders });
  },
  loadUpcomingReminders: async () => {
    const upcomingReminders = await db.getUpcomingReminders(10);
    set({ upcomingReminders });
  },
  createReminder: async (reminder) => {
    await db.createReminder(reminder);
    await get().loadReminders();
    await get().loadUpcomingReminders();
  },
  updateReminder: async (id, updates) => {
    await db.updateReminder(id, updates);
    await get().loadReminders();
    await get().loadUpcomingReminders();
  },
  deleteReminder: async (id) => {
    await db.deleteReminder(id);
    await get().loadReminders();
    await get().loadUpcomingReminders();
  },

  // Todos
  todos: [],
  loadTodos: async () => {
    const todos = await db.getAllTodos();
    set({ todos });
  },
  createTodo: async (todo) => {
    await db.createTodo(todo);
    await get().loadTodos();
  },
  updateTodo: async (id, updates) => {
    await db.updateTodo(id, updates);
    await get().loadTodos();
  },
  deleteTodo: async (id) => {
    await db.deleteTodo(id);
    await get().loadTodos();
  },
  searchTodos: async (query) => {
    if (!query.trim()) {
      await get().loadTodos();
    } else {
      const todos = await db.searchTodos(query);
      set({ todos });
    }
  },

  // Projects
  projects: [],
  loadProjects: async () => {
    const projects = await db.getAllProjects();
    set({ projects });
  },
  createProject: async (project) => {
    const created = await db.createProject(project);
    await get().loadProjects();
    return created;
  },
  updateProject: async (id, updates) => {
    await db.updateProject(id, updates);
    await get().loadProjects();
  },
  deleteProject: async (id) => {
    await db.deleteProject(id);
    await get().loadProjects();
  },
  convertIdeaToProject: async (ideaId) => {
    const projectId = await db.convertIdeaToProject(ideaId);
    await get().loadProjects();
    await get().loadIdeas();
    return projectId;
  },

  // Ideas
  ideas: [],
  loadIdeas: async () => {
    const ideas = await db.getAllIdeas();
    set({ ideas });
  },
  createIdea: async (idea) => {
    await db.createIdea(idea);
    await get().loadIdeas();
  },
  updateIdea: async (id, updates) => {
    await db.updateIdea(id, updates);
    await get().loadIdeas();
  },
  deleteIdea: async (id) => {
    await db.deleteIdea(id);
    await get().loadIdeas();
  },

  // Pomodoro
  pomodoroSessions: [],
  loadPomodoroSessions: async () => {
    const pomodoroSessions = await db.getAllPomodoroSessions();
    set({ pomodoroSessions });
  },
  pomodoroSettings: {
    focus_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sessions_before_long_break: 4,
  },

  // Focus (Lock-In)
  focusSessions: [],
  loadFocusSessions: async () => {
    const focusSessions = await db.getAllFocusSessions();
    set({ focusSessions });
  },
}));
