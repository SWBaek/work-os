const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'apps/web/src');
const appTsxPath = path.join(srcDir, 'App.tsx');
const appContent = fs.readFileSync(appTsxPath, 'utf-8');

// The strategy is to leave App.tsx mostly intact but extract `ui-lite` and `layout`.
// Then we export them from their files, and import them in App.tsx.

// 1. Extract ui-lite (PageHeader, Button, Input, Select, Badge, StatusBadge)
const uiLiteContent = `
import React from 'react';
import { InboxStatus, ProjectStatus, TaskStatus } from 'shared';
import { statusColors } from '../constants';

export const PageHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex h-14 items-center justify-between border-b border-border">
    <h1 className="text-[22px] font-bold text-heading">{title}</h1>
    {action}
  </div>
);

export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) => {
  const classes = variant === 'primary'
    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
    : variant === 'secondary'
      ? 'border border-border bg-background text-heading hover:bg-surface-2'
      : 'text-muted-foreground hover:bg-surface-2';
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={\`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors disabled:opacity-50 \${classes}\`}>
      {children}
    </button>
  );
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={\`h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 \${props.className ?? ''}\`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={\`h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 \${props.className ?? ''}\`} />
);

export const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex rounded-sm bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">{children}</span>
);

export const StatusBadge = ({ status }: { status: TaskStatus | ProjectStatus | InboxStatus }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">
    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[status as TaskStatus] ?? '#737373' }} />
    {status}
  </span>
);
`;

const constantsContent = `
import { Priority, TaskStatus } from 'shared';

export const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.INBOX]: '#0EA5E9',
  [TaskStatus.OPEN]: '#0EA5E9',
  [TaskStatus.IN_PROGRESS]: '#A50034',
  [TaskStatus.WAITING]: '#F59E0B',
  [TaskStatus.HOLD]: '#8B5CF6',
  [TaskStatus.DONE]: '#16A34A',
  [TaskStatus.ARCHIVED]: '#737373',
  [TaskStatus.CANCELED]: '#A3A3A3',
};

export const priorityClasses: Record<Priority, string> = {
  [Priority.CRITICAL]: 'border-l-danger',
  [Priority.HIGH]: 'border-l-[#F59E0B]',
  [Priority.MEDIUM]: 'border-l-[#0EA5E9]',
  [Priority.LOW]: 'border-l-[#16A34A]',
};

export const taskStatuses: TaskStatus[] = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING,
  TaskStatus.HOLD,
  TaskStatus.DONE,
  TaskStatus.ARCHIVED,
  TaskStatus.CANCELED,
];

export const toTags = (value: string) => value.split(',').map((tag) => tag.trim()).filter(Boolean);
export const isoOrUndefined = (value: string) => (value ? new Date(value).toISOString() : undefined);
`;

fs.mkdirSync(path.join(srcDir, 'components'), { recursive: true });
fs.writeFileSync(path.join(srcDir, 'components', 'ui-lite.tsx'), uiLiteContent);

fs.writeFileSync(path.join(srcDir, 'constants.ts'), constantsContent);

let newAppContent = appContent;
newAppContent = newAppContent.replace(/const PageHeader.*?<\/span>\n\);\n/s, '');
newAppContent = newAppContent.replace(/const statusColors.*?isoOrUndefined.*?\n/s, '');

newAppContent = \`import { PageHeader, Button, Input, Select, Badge, StatusBadge } from './components/ui-lite';\nimport { statusColors, priorityClasses, taskStatuses, toTags, isoOrUndefined } from './constants';\n\` + newAppContent;

fs.writeFileSync(appTsxPath, newAppContent);
console.log('Split ui-lite and constants out of App.tsx');
