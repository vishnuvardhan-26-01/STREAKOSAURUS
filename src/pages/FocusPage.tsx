import React, { useState } from 'react';
import { PomodoroPanel } from './PomodoroPage';
import { LockInPanel } from './LockInPage';

type FocusTab = 'pomodoro' | 'lockin';

export default function FocusPage() {
  const [tab, setTab] = useState<FocusTab>('pomodoro');

  return (
    <div className="px-10 py-9 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="font-display text-3xl text-brand-primary">Focus</h1>
        <p className="text-[13px] text-brand-primary/45 mt-1.5">
          Structured sprints with the Pomodoro, or an uninterrupted Lock-In on one thing.
        </p>
      </div>

      <div className="flex gap-1 mb-7 border-b border-brand-line">
        {([
          { id: 'pomodoro', label: 'Pomodoro' },
          { id: 'lockin', label: 'Lock-In' },
        ] as { id: FocusTab; label: string }[]).map((t) => (
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

      {tab === 'pomodoro' ? <PomodoroPanel /> : <LockInPanel />}
    </div>
  );
}