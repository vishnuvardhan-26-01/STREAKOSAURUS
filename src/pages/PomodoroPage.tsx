import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Zap } from 'lucide-react';
import { useStore } from '../store';
import { createPomodoroSession } from '../db/queries';

type TimerMode = 'focus' | 'short_break' | 'long_break';

export function PomodoroPanel() {
  const {
    pomodoroSessions, loadPomodoroSessions, pomodoroSettings,
  } = useStore();

  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalFocusSessions, setTotalFocusSessions] = useState(0);

  // Use timestamps for accurate timing
  const [targetMs, setTargetMs] = useState(pomodoroSettings.focus_duration * 60 * 1000);
  const [remainingMs, setRemainingMs] = useState(targetMs);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest completion handler in a ref so the interval never calls a stale closure.
  const handleTimerCompleteRef = useRef<() => void>(() => {});
  handleTimerCompleteRef.current = () => {
    void handleTimerComplete();
  };

  // Timer tick
  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = targetMs - elapsed;
        if (remaining <= 0) {
          // Timer complete
          setRemainingMs(0);
          setIsRunning(false);
          handleTimerCompleteRef.current();
        } else {
          setRemainingMs(remaining);
        }
      }, 100); // Update frequently for smooth display
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startedAt, targetMs]);

  useEffect(() => {
    loadPomodoroSessions();
  }, [loadPomodoroSessions]);

  // When mode changes, update target
  useEffect(() => {
    let duration: number;
    switch (mode) {
      case 'focus':
        duration = pomodoroSettings.focus_duration * 60 * 1000;
        break;
      case 'short_break':
        duration = pomodoroSettings.short_break_duration * 60 * 1000;
        break;
      case 'long_break':
        duration = pomodoroSettings.long_break_duration * 60 * 1000;
        break;
    }
    setTargetMs(duration);
    setRemainingMs(duration);
    setIsRunning(false);
    setStartedAt(null);
  }, [mode, pomodoroSettings]);

  const handleTimerComplete = useCallback(async () => {
    if (mode === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      setTotalFocusSessions((p) => p + 1);

      // Save completed session (ran to completion → full nominal duration)
      const now = new Date().toISOString();
      const durationSec = pomodoroSettings.focus_duration * 60;
      await createPomodoroSession({
        started_at: startedAt ? new Date(startedAt).toISOString() : now,
        ended_at: now,
        duration_seconds: durationSec,
        completed: true,
        habit_id: null,
        todo_id: null,
      });
      await loadPomodoroSessions();

      // Switch to break
      if (newCount % pomodoroSettings.sessions_before_long_break === 0) {
        setMode('long_break');
      } else {
        setMode('short_break');
      }
    } else {
      // Break complete, switch to focus
      setMode('focus');
    }
  }, [mode, sessionCount, pomodoroSettings, startedAt, loadPomodoroSessions]);

  /**
   * Record an interrupted focus session (skipped/reset before completion)
   * with the actual elapsed duration.
   */
  const recordInterrupted = useCallback(async () => {
    if (mode !== 'focus' || !startedAt) return;
    const elapsedSec = Math.floor((targetMs - remainingMs) / 1000);
    if (elapsedSec < 5) return; // ignore accidental starts
    const now = new Date().toISOString();
    await createPomodoroSession({
      started_at: new Date(startedAt).toISOString(),
      ended_at: now,
      duration_seconds: elapsedSec,
      completed: false,
      habit_id: null,
      todo_id: null,
    });
    await loadPomodoroSessions();
  }, [mode, startedAt, targetMs, remainingMs, loadPomodoroSessions]);

  const start = () => {
    setStartedAt(Date.now() - (targetMs - remainingMs));
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const resume = () => {
    setStartedAt(Date.now() - (targetMs - remainingMs));
    setIsRunning(true);
  };

  const reset = () => {
    setIsRunning(false);
    setStartedAt(null);
    setRemainingMs(targetMs);
    void recordInterrupted();
  };

  const skip = () => {
    setIsRunning(false);
    setStartedAt(null);
    if (mode === 'focus') {
      void recordInterrupted();
      setMode(sessionCount % pomodoroSettings.sessions_before_long_break === (pomodoroSettings.sessions_before_long_break - 1) ? 'long_break' : 'short_break');
    } else {
      setMode('focus');
    }
  };

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const progress = Math.round(((targetMs - remainingMs) / targetMs) * 100);

  const modeLabel = mode === 'focus' ? 'Focus' : mode === 'short_break' ? 'Short Break' : 'Long Break';
  const modeColor = mode === 'focus' ? 'text-brand-burnt-orange' : 'text-brand-olive';
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const recentSessions = pomodoroSessions.slice(0, 10);
  const completedToday = pomodoroSessions.filter(
    s => s.completed && s.started_at.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-8">
        {/* Timer */}
        <div className="panel p-8 text-center">
          <div className={`text-sm uppercase tracking-widest mb-6 ${modeColor}`}>
            {mode === 'focus' && <Zap size={14} className="inline mr-1" />}
            {mode !== 'focus' && <Coffee size={14} className="inline mr-1" />}
            {modeLabel}
          </div>

          {/* Circle Timer */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#2a2520" strokeWidth="6" />
              <circle
                cx="100" cy="100" r="90" fill="none"
                stroke={mode === 'focus' ? '#B8623A' : '#7B8050'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-display text-brand-primary">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="p-3 text-brand-primary/40 hover:text-brand-primary rounded-xl hover:bg-brand-warm-brown/10 transition-colors" title="Reset">
              <RotateCcw size={20} />
            </button>
            {!isRunning ? (
              <button onClick={remainingMs < targetMs ? resume : start} className="p-4 bg-brand-burnt-orange text-white rounded-xl hover:bg-brand-burnt-orange/90 transition-colors" title="Start">
                <Play size={24} />
              </button>
            ) : (
              <button onClick={pause} className="p-4 bg-brand-warm-brown/30 text-brand-primary rounded-xl hover:bg-brand-warm-brown/40 transition-colors" title="Pause">
                <Pause size={24} />
              </button>
            )}
            <button onClick={skip} className="p-3 text-brand-primary/40 hover:text-brand-primary rounded-xl hover:bg-brand-warm-brown/10 transition-colors" title="Skip">
              <SkipForward size={20} />
            </button>
          </div>

          {/* Session Counter */}
          <div className="mt-6 text-xs text-brand-primary/40">
            Session {sessionCount + 1} · {pomodoroSettings.sessions_before_long_break} before long break
          </div>
        </div>

        {/* History & Stats */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="panel p-5">
            <h2 className="section-label mb-4">Today</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-display text-brand-burnt-orange">{completedToday}</div>
                <div className="text-xs text-brand-primary/40">Sessions completed</div>
              </div>
              <div>
                <div className="text-2xl font-display text-brand-mustard">{sessionCount}</div>
                <div className="text-xs text-brand-primary/40">Focus rounds</div>
              </div>
            </div>
          </div>

          {/* Session History */}
          <div className="panel p-5">
            <h2 className="section-label mb-4">Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className="text-brand-primary/30 text-xs italic">No sessions yet. Start your first Pomodoro.</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-brand-warm-brown/5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.completed ? 'bg-brand-olive' : 'bg-brand-burnt-orange'}`} />
                      <span className="text-xs text-brand-primary/70">
                        {Math.floor(s.duration_seconds / 60)} min
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-primary/40">
                      {new Date(s.started_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
