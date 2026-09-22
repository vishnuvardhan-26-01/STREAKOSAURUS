import React from 'react';
import {
  House,
  ListChecks,
  Folder,
  Lightbulb,
  Calendar,
  FileText,
  Footprints,
  CheckSquare,
  Timer,
  Settings,
  Bell,
} from 'lucide-react';
import type { PageId } from '../types';
import { useStore } from '../store';
import Brand from './Brand';

interface NavItemDef {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label?: string;
  items: NavItemDef[];
}

const navSections: NavSection[] = [
  {
    items: [
      { id: 'dashboard', label: 'Home', icon: <House size={17} /> },
      { id: 'habits', label: 'Habits', icon: <ListChecks size={17} /> },
      { id: 'projects', label: 'Projects', icon: <Folder size={17} /> },
      { id: 'ideas', label: 'Ideas', icon: <Lightbulb size={17} /> },
      { id: 'calendar', label: 'Calendar', icon: <Calendar size={17} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={17} /> },
    ],
  },
  {
    label: 'Dino World',
    items: [{ id: 'dinoworld', label: 'Dino World', icon: <Footprints size={17} /> }],
  },
  {
    label: 'Tools',
    items: [
      { id: 'todos', label: 'To-do', icon: <CheckSquare size={17} /> },
      { id: 'focus', label: 'Focus', icon: <Timer size={17} /> },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setPage, unreadCount } = useStore();

  return (
    <aside className="w-60 h-full bg-brand-surface border-r border-brand-line flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-brand-line">
        <Brand />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="px-3 mb-1.5">
                <span className="section-label">{section.label}</span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-brand-burnt-orange/15 text-brand-burnt-orange'
                        : 'text-brand-primary/55 hover:bg-brand-warm-brown/10 hover:text-brand-primary/85'
                    }`}
                  >
                    <span className={isActive ? 'text-brand-burnt-orange' : 'text-brand-primary/40'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left font-medium tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-brand-line space-y-1">
        <button
          onClick={() => setPage('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
            currentPage === 'settings'
              ? 'bg-brand-burnt-orange/15 text-brand-burnt-orange'
              : 'text-brand-primary/55 hover:bg-brand-warm-brown/10 hover:text-brand-primary/85'
          }`}
        >
          <Settings size={17} className="text-brand-primary/40" />
          <span className="flex-1 text-left font-medium tracking-wide">Settings</span>
        </button>
        <button
          onClick={() => setPage('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
            currentPage === 'notifications'
              ? 'bg-brand-burnt-orange/15 text-brand-burnt-orange'
              : 'text-brand-primary/55 hover:bg-brand-warm-brown/10 hover:text-brand-primary/85'
          }`}
          title="Notifications"
        >
          <span className="relative">
            <Bell size={17} className="text-brand-primary/40" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-burnt-orange text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="flex-1 text-left font-medium tracking-wide">Notifications</span>
        </button>
        <div className="px-3 pt-2">
          <p className="text-[9px] text-brand-primary/25 tracking-widest uppercase">
            Streakosaurus · v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}