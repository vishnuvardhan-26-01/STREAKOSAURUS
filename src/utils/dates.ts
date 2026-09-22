// ============================================================
// Streakosaurus — Date Utilities
// ============================================================

export function today(): string {
  return formatDate(new Date());
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

export function daysBetween(start: string, end: string): number {
  const s = parseDate(start).getTime();
  const e = parseDate(end).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function isToday(dateStr: string): boolean {
  return dateStr === today();
}

export function isBefore(a: string, b: string): boolean {
  return parseDate(a).getTime() < parseDate(b).getTime();
}

export function isAfter(a: string, b: string): boolean {
  return parseDate(a).getTime() > parseDate(b).getTime();
}

export function isBetween(date: string, start: string, end: string): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}

export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function getDayName(dateStr: string, short = false): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: short ? 'short' : 'long',
  });
}

export function getMonthName(dateStr: string, short = false): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: short ? 'short' : 'long',
  });
}

export function getMonthYear(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getWeekStart(dateStr: string, weekStart: 'monday' | 'sunday' = 'monday'): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = weekStart === 'monday'
    ? (day === 0 ? -6 : 1 - day)
    : -day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function getWeekEnd(dateStr: string, weekStart: 'monday' | 'sunday' = 'monday'): string {
  const ws = getWeekStart(dateStr, weekStart);
  return addDays(ws, 6);
}

export function getMonthStart(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function getMonthEnd(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getYearStart(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), 0, 1));
}

export function getYearEnd(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), 11, 31));
}

export function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  let current = start;
  while (!isAfter(current, end)) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function getCalendarDays(
  year: number,
  month: number,
  weekStart: 'monday' | 'sunday' = 'sunday'
): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // 0=Sun .. 6=Sat. For a Monday-start grid, Sunday (0) goes at the end.
  let startPad = firstDay.getDay();
  if (weekStart === 'monday') {
    startPad = startPad === 0 ? 6 : startPad - 1;
  }
  const days: (string | null)[] = [];

  for (let i = 0; i < startPad; i++) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(formatDate(new Date(year, month, d)));
  }

  return days;
}

export function formatTime(
  time: string,
  format: '12h' | '24h' = '12h'
): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateDisplay(
  dateStr: string,
  format: string = 'YYYY-MM-DD'
): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  switch (format) {
    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${y}`;
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${y}`;
    default:
      return `${y}-${mm}-${dd}`;
  }
}

export function formatRelative(dateStr: string): string {
  // Accept both YYYY-MM-DD and full datetime strings (SQLite 'YYYY-MM-DD
  // HH:MM:SS' or ISO with 'T'); parseDate only understands date-only input.
  const d = parseDate(dateStr.replace(' ', 'T').slice(0, 10));
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Still at it';
}

export function getWeekdayNames(
  short = false,
  weekStart: 'monday' | 'sunday' = 'monday'
): string[] {
  // Mon Jan 1 2024 is a Monday; Sun Jan 7 2024 is a Sunday.
  const anchor = weekStart === 'monday' ? new Date(2024, 0, 1) : new Date(2024, 0, 7);
  const names: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    names.push(
      d.toLocaleDateString('en-US', {
        weekday: short ? 'short' : 'long',
      })
    );
  }
  return names;
}

export function isHabitScheduledForDay(
  frequency: string,
  specificDays: number[],
  dateStr: string
): boolean {
  const day = getDayOfWeek(dateStr);

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'weekends':
      return day === 0 || day === 6;
    case 'specific_days':
      return specificDays.includes(day);
    case 'custom':
      return specificDays.length === 0 || specificDays.includes(day);
    default:
      return true;
  }
}
