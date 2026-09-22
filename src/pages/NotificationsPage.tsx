import React, { useEffect } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import EmptyState from '../components/EmptyState';
import { formatRelative } from '../utils/dates';

const TYPE_ICONS: Record<string, string> = {
  habit_reminder: '⏰',
  evening_checkin: '🌙',
  streak_warning: '🔥',
  achievement: '🏆',
  weekly_report: '📊',
  monthly_report: '📈',
  insight: '💡',
};

export default function NotificationsPage() {
  const { notifications, loadNotifications, markNotificationRead, markAllNotificationsRead } = useStore();

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <div className="px-10 py-9 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="font-display text-3xl text-brand-primary">Notifications</h1>
          <p className="text-[13px] text-brand-primary/45 mt-1.5">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllNotificationsRead} className="btn-outline">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" message="Your notifications will appear here. Quiet for now — even the dinosaur is resting." />
      ) : (
        <div className="space-y-2">
          {unread.map((n) => (
            <button key={n.id} onClick={() => markNotificationRead(n.id)} className="w-full text-left p-4 bg-brand-surface rounded-xl border border-brand-warm-brown/15 hover:border-brand-burnt-orange/30 transition-all animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-brand-primary">{n.title}</h3>
                    <span className="w-2 h-2 rounded-full bg-brand-burnt-orange" />
                  </div>
                  <p className="text-xs text-brand-primary/60 mt-1">{n.message}</p>
                  <p className="text-[10px] text-brand-primary/30 mt-2">{formatRelative(n.created_at)}</p>
                </div>
              </div>
            </button>
          ))}
          {read.map((n) => (
            <div key={n.id} className="p-4 bg-brand-surface/50 rounded-xl border border-brand-warm-brown/10 opacity-60">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5 grayscale">{TYPE_ICONS[n.type] || '📢'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-brand-primary/70">{n.title}</h3>
                  <p className="text-xs text-brand-primary/40 mt-1">{n.message}</p>
                  <p className="text-[10px] text-brand-primary/20 mt-2">{formatRelative(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
