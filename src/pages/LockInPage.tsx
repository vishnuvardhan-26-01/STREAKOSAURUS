import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, Square, Lock, Unlock } from 'lucide-react';
import { useStore } from '../store';
import { createFocusSession, updateFocusSession } from '../db/queries';
import type { FocusSession } from '../types';

export function LockInPanel() {
  const { focusSessions, loadFocusSessions } = useStore();

  const [title, setTitle] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadFocusSessions();
  }, [loadFocusSessions]);

  // Timer tick
  useEffect(() => {
    if (isActive && !isPaused && startedAt) {
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, startedAt]);

  const startSession = useCallback(async () => {
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const session = await createFocusSession({
      title: title.trim(),
      started_at: now,
      ended_at: null,
      duration_seconds: 0,
      target_seconds: null,
      status: 'active',
      habit_id: null,
      todo_id: null,
    });

    setActiveSessionId(session.id);
    setStartedAt(Date.now());
    setElapsedMs(0);
    setIsActive(true);
    setIsPaused(false);
  }, [title]);

  const pauseSession = () => {
    setIsPaused(true);
  };

  const resumeSession = () => {
    // Adjust startedAt to account for pause
    setStartedAt(Date.now() - elapsedMs);
    setIsPaused(false);
  };

  const finishSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const durationSec = Math.floor(elapsedMs / 1000);
    const now = new Date().toISOString();

    if (activeSessionId) {
      await updateFocusSession(activeSessionId, {
        ended_at: now,
        duration_seconds: durationSec,
        status: 'completed',
      });
    }

    setIsActive(false);
    setIsPaused(false);
    setStartedAt(null);
    setElapsedMs(0);
    setActiveSessionId(null);
    await loadFocusSessions();
  }, [elapsedMs, activeSessionId, loadFocusSessions]);

  const cancelSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const durationSec = Math.floor(elapsedMs / 1000);
    const now = new Date().toISOString();

    if (activeSessionId) {
      await updateFocusSession(activeSessionId, {
        ended_at: now,
        duration_seconds: durationSec,
        status: 'cancelled',
      });
    }

    setIsActive(false);
    setIsPaused(false);
    setStartedAt(null);
    setElapsedMs(0);
    setActiveSessionId(null);
    await loadFocusSessions();
  }, [elapsedMs, activeSessionId, loadFocusSessions]);

  // Format elapsed time
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const timeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Session history
  const completedSessions = focusSessions.filter(s => s.status === 'completed').slice(0, 15);
  const totalFocusMinutes = completedSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60;

  // Active view — minimal focused interface
  if (isActive) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center">
          <Lock size={32} className="text-brand-burnt-orange mx-auto mb-6" />
          <h1 className="text-sm uppercase tracking-[0.3em] text-brand-primary/40 mb-2">Locked In</h1>
          <h2 className="text-2xl font-display text-brand-primary mb-8">{title}</h2>
          <div className="text-7xl font-mono text-brand-primary mb-2 tracking-wider">
            {timeDisplay}
          </div>
          {isPaused && (
            <p className="text-brand-mustard text-sm mb-6 italic">Paused</p>
          )}
          <div className="flex items-center justify-center gap-4 mt-12">
            {!isPaused ? (
              <button
                onClick={pauseSession}
                className="px-6 py-3 bg-brand-warm-brown/20 text-brand-primary rounded-xl text-sm hover:bg-brand-warm-brown/30 transition-colors flex items-center gap-2"
              >
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button
                onClick={resumeSession}
                className="px-6 py-3 bg-brand-burnt-orange text-white rounded-xl text-sm hover:bg-brand-burnt-orange/90 transition-colors flex items-center gap-2"
              >
                <Play size={16} /> Resume
              </button>
            )}
            <button
              onClick={finishSession}
              className="px-6 py-3 bg-brand-olive/20 text-brand-olive rounded-xl text-sm hover:bg-brand-olive/30 transition-colors flex items-center gap-2"
            >
              <Square size={16} /> Finish Session
            </button>
            <button
              onClick={cancelSession}
              className="px-4 py-3 text-brand-primary/30 text-sm hover:text-red-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup view
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-8">
        {/* Start Panel */}
        <div className="panel p-8">
          <div className="text-center mb-8">
            <Unlock size={40} className="text-brand-primary/30 mx-auto mb-4" />
            <h2 className="text-lg font-display text-brand-primary mb-2">What are you locking in on?</h2>
            <p className="text-xs text-brand-primary/40">Name your focus. Then start.</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startSession()}
              placeholder="e.g. Coding, Reading, Writing..."
              className="w-full px-4 py-3 bg-brand-bg border border-brand-warm-brown/20 rounded-xl text-sm text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-burnt-orange/50 text-center text-lg"
            />
            <button
              onClick={startSession}
              disabled={!title.trim()}
              className="w-full px-6 py-3 bg-brand-burnt-orange text-white rounded-xl text-sm font-medium hover:bg-brand-burnt-orange/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              Lock In
            </button>
          </div>
        </div>

        {/* History */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-brand-primary/70 uppercase tracking-wider">Session History</h2>
            {totalFocusMinutes > 0 && (
              <span className="text-xs text-brand-primary/40">{Math.round(totalFocusMinutes)} min total</span>
            )}
          </div>

          {completedSessions.length === 0 ? (
            <div className="text-center py-12">
              <Lock size={24} className="text-brand-primary/20 mx-auto mb-3" />
              <p className="text-brand-primary/30 text-xs italic">No sessions yet. Lock in to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-warm-brown/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-brand-primary/70 text-sm truncate">{s.title || 'Untitled'}</span>
                  </div>
                  <span className="text-xs text-brand-primary/40 shrink-0 ml-3">
                    {Math.floor(s.duration_seconds / 3600)}h {Math.floor((s.duration_seconds % 3600) / 60)}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
