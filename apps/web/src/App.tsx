import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/inbox', label: 'Inbox' },
  { path: '/projects', label: 'Projects' },
  { path: '/meeting-notes', label: 'Meeting Notes' },
  { path: '/decisions', label: 'Decisions' },
  { path: '/search', label: 'Search' },
  { path: '/settings', label: 'Settings' },
];

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
    {/* Sidebar */}
    <div className="w-[240px] flex-shrink-0 bg-surface flex flex-col">
      {/* Logo block */}
      <div className="h-[64px] flex items-center px-4 gap-2">
        <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">LG</div>
        <span className="font-bold text-heading text-[18px]">WorksOS</span>
      </div>
      {/* Nav items */}
      <div className="flex flex-col gap-1 px-2 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center h-[40px] px-3 rounded-md text-[14px] transition-colors relative ` +
              (isActive
                ? `bg-primary-soft text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[3px] before:bg-primary before:rounded-r-sm`
                : `hover:bg-surface-2 text-foreground`)
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
    
    {/* Main Content Area */}
    <div className="flex-1 overflow-auto flex justify-center bg-background">
      <div className="w-full max-w-[1280px] px-6 py-4">
        {children}
      </div>
    </div>
  </div>
);

const Page = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-6">
    {/* Top Bar Equivalent Area */}
    <div className="flex items-center h-[56px] border-b border-border mb-4">
      <h1 className="text-[22px] font-bold text-heading">{title}</h1>
    </div>
    <div className="text-muted-foreground text-[14px]">Content for {title}</div>
  </div>
);

const Dashboard = () => <Page title="Dashboard" />;
const Inbox = () => <Page title="Inbox" />;
const Projects = () => <Page title="Projects" />;
const ProjectDetail = () => <Page title="Project Detail" />;
const MeetingNotes = () => <Page title="Meeting Notes" />;
const Decisions = () => <Page title="Decisions" />;
const Search = () => <Page title="Search" />;
const Settings = () => <Page title="Settings" />;

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/meeting-notes" element={<MeetingNotes />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
