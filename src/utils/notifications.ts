// ============================================================
// Streakosaurus — Notification Utilities
// ============================================================

import type { Habit, NotificationType } from '../types';
import {
  createNotification,
  getAllNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotifications,
} from '../db/queries';
import { generateRoast, getPersonalityGreeting } from './roastEngine';
import { today, getGreeting, formatTime } from './dates';
import type { RoastLevel } from '../types';

// ============================================================
// NOTIFICATION CREATION
// ============================================================

export async function sendHabitReminder(
  habit: Habit,
  roastLevel: RoastLevel = 'sarcastic'
): Promise<void> {
  const message = generateRoast(roastLevel, {
    habit_name: habit.name,
    metric: 'reminder',
    value: 0,
  });

  await createNotification({
    type: 'habit_reminder',
    title: habit.name,
    message: message,
    read: false,
    data: { habit_id: habit.id },
  });
}

export async function sendStreakWarning(
  habit: Habit,
  currentStreak: number,
  roastLevel: RoastLevel = 'sarcastic'
): Promise<void> {
  const message = generateRoast(roastLevel, {
    habit_name: habit.name,
    metric: 'missed',
    value: 0,
    streak: currentStreak,
  });

  await createNotification({
    type: 'streak_warning',
    title: `⚠️ Streak at Risk: ${habit.name}`,
    message: message,
    read: false,
    data: { habit_id: habit.id, streak: currentStreak },
  });
}

export async function sendAchievementNotification(
  achievementName: string,
  description: string
): Promise<void> {
  await createNotification({
    type: 'achievement',
    title: `🏆 ${achievementName}`,
    message: description,
    read: false,
    data: {},
  });
}

export async function sendEveningCheckin(
  roastLevel: RoastLevel = 'sarcastic'
): Promise<void> {
  const message = generateRoast(roastLevel, {
    habit_name: '',
    metric: 'evening_checkin',
    value: 0,
  });

  await createNotification({
    type: 'evening_checkin',
    title: 'Evening Check-in',
    message,
    read: false,
    data: {},
  });
}

export async function sendInsightNotification(
  title: string,
  message: string
): Promise<void> {
  await createNotification({
    type: 'insight',
    title,
    message,
    read: false,
    data: {},
  });
}

// ============================================================
// NOTIFICATION MANAGEMENT
// ============================================================

export async function getNotifications() {
  return getAllNotifications();
}

export async function getUnreadCount(): Promise<number> {
  const unread = await getUnreadNotifications();
  return unread.length;
}

export async function markAsRead(id: string): Promise<void> {
  await markNotificationRead(id);
}

export async function markAllAsRead(): Promise<void> {
  await markAllNotificationsRead();
}
