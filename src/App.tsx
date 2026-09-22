import React from 'react';
import Layout from './components/Layout';
import { useStore } from './store';
import HomePage from './pages/HomePage';
import HabitsPage from './pages/HabitsPage';
import ProjectsPage from './pages/ProjectsPage';
import IdeasPage from './pages/IdeasPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import DinoWorldPage from './pages/DinoWorldPage';
import TodosPage from './pages/TodosPage';
import FocusPage from './pages/FocusPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

const pages: Record<string, React.ComponentType> = {
  dashboard: HomePage,
  habits: HabitsPage,
  projects: ProjectsPage,
  ideas: IdeasPage,
  calendar: CalendarPage,
  reports: ReportsPage,
  dinoworld: DinoWorldPage,
  todos: TodosPage,
  focus: FocusPage,
  settings: SettingsPage,
  notifications: NotificationsPage,
};

export default function App() {
  const currentPage = useStore((s) => s.currentPage);
  const PageComponent = pages[currentPage] || HomePage;

  return (
    <Layout>
      <PageComponent />
    </Layout>
  );
}