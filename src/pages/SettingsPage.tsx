import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { RoastLevel } from '../types';

type Tab = 'general' | 'notifications' | 'reports' | 'personality' | 'data' | 'about';

const ROAST_LEVELS: { value: RoastLevel; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Clean, data-driven observations' },
  { value: 'friendly', label: 'Friendly', desc: 'Supportive and encouraging' },
  { value: 'sarcastic', label: 'Sarcastic', desc: 'The default dinosaur experience' },
  { value: 'savage', label: 'Savage', desc: 'No mercy. You asked for this.' },
];

export default function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useStore();
  const [tab, setTab] = useState<Tab>('general');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = async (updates: Partial<typeof settings>) => {
    await updateSettings(updates);
    setSaveMessage('Saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-burnt-orange' : 'bg-brand-warm-brown/30'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-transform mx-0.5 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'reports', label: 'Reports' },
    { id: 'personality', label: 'Personality' },
    { id: 'data', label: 'Data' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="px-10 py-9 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-7">
        <h1 className="font-display text-3xl text-brand-primary">Settings</h1>
        {saveMessage && (
          <span className="text-xs text-brand-olive animate-fade-in">{saveMessage}</span>
        )}
      </div>

      <div className="flex gap-1 mb-7 border-b border-brand-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors ${
              tab === t.id
                ? 'border-brand-burnt-orange text-brand-burnt-orange'
                : 'border-transparent text-brand-primary/45 hover:text-brand-primary/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-xl">
        {tab === 'general' && (
          <div className="panel divide-y divide-brand-line">
            <SettingRow label="Week starts on">
              <select
                value={settings.week_start}
                onChange={(e) => handleChange({ week_start: e.target.value as 'monday' | 'sunday' })}
                className="select !w-auto"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </SettingRow>
            <SettingRow label="Time format">
              <select
                value={settings.time_format}
                onChange={(e) => handleChange({ time_format: e.target.value as '12h' | '24h' })}
                className="select !w-auto"
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </SettingRow>
            <SettingRow label="Date format">
              <select
                value={settings.date_format}
                onChange={(e) => handleChange({ date_format: e.target.value })}
                className="select !w-auto"
              >
                <option value="YYYY-MM-DD">2026-09-09</option>
                <option value="MM/DD/YYYY">09/09/2026</option>
                <option value="DD/MM/YYYY">09/09/2026 (day first)</option>
              </select>
            </SettingRow>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="panel divide-y divide-brand-line">
            <SettingRow label="Enable notifications">
              <Toggle enabled={settings.notifications_enabled} onToggle={() => handleChange({ notifications_enabled: !settings.notifications_enabled })} />
            </SettingRow>
            <SettingRow label="Reminder sound">
              <Toggle enabled={settings.reminder_sound} onToggle={() => handleChange({ reminder_sound: !settings.reminder_sound })} />
            </SettingRow>
            <SettingRow label="Evening check-in">
              <Toggle enabled={settings.evening_checkin_enabled} onToggle={() => handleChange({ evening_checkin_enabled: !settings.evening_checkin_enabled })} />
            </SettingRow>
            {settings.evening_checkin_enabled && (
              <SettingRow label="Check-in time">
                <input
                  type="time"
                  value={settings.evening_checkin_time}
                  onChange={(e) => handleChange({ evening_checkin_time: e.target.value })}
                  className="input !w-auto"
                />
              </SettingRow>
            )}
            <div className="px-5 py-3">
              <p className="text-[11px] text-brand-primary/35 italic leading-relaxed">
                Native Windows notifications arrive in a later phase. These settings will gate
                them when the notification system ships.
              </p>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="panel divide-y divide-brand-line">
            <SettingRow label="Weekly report">
              <Toggle enabled={settings.weekly_report_enabled} onToggle={() => handleChange({ weekly_report_enabled: !settings.weekly_report_enabled })} />
            </SettingRow>
            <SettingRow label="Monthly report">
              <Toggle enabled={settings.monthly_report_enabled} onToggle={() => handleChange({ monthly_report_enabled: !settings.monthly_report_enabled })} />
            </SettingRow>
          </div>
        )}

        {tab === 'personality' && (
          <div>
            <p className="text-[11px] text-brand-primary/35 italic mb-4 leading-relaxed">
              How loud should the dinosaur be? Roasts always attack the behavior, never you.
            </p>
            <div className="space-y-2">
              {ROAST_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleChange({ roast_level: level.value })}
                  className={`w-full text-left p-3.5 rounded-md border transition-all ${
                    settings.roast_level === level.value
                      ? 'bg-brand-burnt-orange/10 border-brand-burnt-orange/40'
                      : 'bg-brand-warm-brown/5 border-brand-line hover:bg-brand-warm-brown/10'
                  }`}
                >
                  <span className="text-sm font-medium text-brand-primary">{level.label}</span>
                  <span className="text-xs text-brand-primary/40 block mt-0.5">{level.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="panel divide-y divide-brand-line">
            <div className="px-5 py-4">
              <p className="text-sm text-brand-primary/70 mb-1">Export / Import / Backup</p>
              <p className="text-[11px] text-brand-primary/40">
                Data management is scheduled for a later phase. Your data stays safely in the
                local database until then.
              </p>
              <div className="flex gap-2 mt-3">
                <button disabled className="btn-outline opacity-40 cursor-not-allowed">Export</button>
                <button disabled className="btn-outline opacity-40 cursor-not-allowed">Import</button>
                <button disabled className="btn-outline opacity-40 cursor-not-allowed">Backup</button>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-brand-primary/70 mb-1">Danger zone</p>
              <p className="text-[11px] text-brand-primary/40 mb-3">
                Permanently erase every record. Not available in this phase.
              </p>
              <button disabled className="btn-danger opacity-40 cursor-not-allowed">
                Delete all data
              </button>
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="panel p-6">
            <p className="font-display text-lg text-brand-primary">Streakosaurus</p>
            <p className="text-xs text-brand-primary/45 italic mt-1">
              “Extinct excuses. Daily habits.”
            </p>
            <div className="hairline mt-4 pt-4 space-y-1">
              <p className="text-sm text-brand-primary/60">Version 0.1.0</p>
              <p className="text-xs text-brand-primary/30 mt-2">
                Built with Tauri · React · TypeScript · SQLite
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-brand-primary/75">{label}</span>
      {children}
    </div>
  );
}