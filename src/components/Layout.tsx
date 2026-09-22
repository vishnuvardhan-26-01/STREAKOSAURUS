import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useStore } from '../store';
import { getDb } from '../db/index';
import { seedDefaultAchievements } from '../db/queries';
import { FootprintMark } from './Brand';

const LOADING_LINES = [
  'Digging through the fossil records…',
  'Resurrecting your productivity…',
  'Consulting the dinosaur council…',
  'Waking the habits from dormancy…',
  'Dusting off the streak ledger…',
];

function LoadingScreen() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setLineIdx((i) => (i + 1) % LOADING_LINES.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-brand-bg">
      <div className="text-center select-none">
        <div className="mb-5 animate-dig inline-block">
          <FootprintMark size={44} />
        </div>
        <p className="text-brand-primary/50 text-sm italic font-display">
          {LOADING_LINES[lineIdx]}
        </p>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading, setLoading } = useStore();
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const database = await getDb();
        console.log('[Streakosaurus] Database connected successfully');
        await seedDefaultAchievements();
        const store = useStore.getState();
        await Promise.all([
          store.loadHabits(),
          store.loadSettings(),
          store.loadDashboard(),
          store.loadNotifications(),
          store.loadInsights(),
          store.loadUpcomingReminders(),
          store.loadTodos(),
          store.loadProjects(),
          store.loadIdeas(),
        ]);
        console.log('[Streakosaurus] All data loaded successfully');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[Streakosaurus] DB initialization failed:', e);
        setDbError(msg);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-screen flex bg-brand-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {dbError && (
          <div className="m-5 p-4 bg-brand-danger/10 border border-brand-danger/30 rounded-md text-sm text-brand-danger max-w-2xl">
            <p className="font-medium mb-1">Database error</p>
            <p className="text-xs opacity-80 break-all">{dbError}</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}