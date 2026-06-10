import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Boxes,
  Bot,
  ChevronDown,
  Inbox as InboxIcon,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import t from '../lib/i18n/ko.json';

const navItems = [
  { path: '/', label: t.dashboard, icon: LayoutDashboard },
  { path: '/inbox', label: t.inbox, icon: InboxIcon },
  { path: '/projects', label: t.projects, icon: Boxes },
  { path: '/tasks', label: t.tasks, icon: ListChecks },
  { path: '/kanban', label: t.kanban, icon: KanbanSquare },
  { path: '/decisions', label: t.decisions, icon: BarChart3 },
  { path: '/search', label: t.search, icon: Bot },
  { path: '/settings', label: t.settings, icon: Settings },
];

export const TopBar = () => (
  <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
    <div className="flex h-10 w-full max-w-[520px] items-center gap-3 rounded-lg bg-surface px-4 text-muted-foreground">
      <Search className="h-4 w-4" />
      <span className="min-w-0 flex-1 text-sm">{t.globalSearchPlaceholder}</span>
      <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">⌘ K</span>
    </div>
    <div className="flex items-center gap-3">
      <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2" aria-label={t.notifications}>
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-heading">{t.userName}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  </header>
);

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
    <aside className="flex w-[240px] shrink-0 flex-col bg-surface text-foreground">
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">W</div>
        <span className="text-[20px] font-bold text-heading">{t.appName}</span>
      </div>
      <nav className="mt-2 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${isActive ? 'bg-primary-soft font-semibold text-primary before:absolute before:left-0 before:top-2 before:h-7 before:w-[3px] before:rounded-full before:bg-primary' : 'text-foreground hover:bg-surface-2'}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto p-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-heading">{t.userName}</div>
            <div className="truncate text-xs text-muted-foreground">{t.userRole}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
    <main className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <div className="flex-1 overflow-auto bg-background">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-6">{children}</div>
      </div>
    </main>
  </div>
);
