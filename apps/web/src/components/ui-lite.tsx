import React from 'react';
import { InboxStatus, ProjectStatus, TaskStatus } from 'shared';
import { statusColors } from '../constants';

export const PageHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex h-14 items-center justify-between border-b border-border">
    <h1 className="text-[22px] font-bold text-heading">{title}</h1>
    {action}
  </div>
);

export const Button = ({ children, type = 'button', variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) => {
  const classes = variant === 'primary'
    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
    : variant === 'secondary'
      ? 'border border-border bg-background text-heading hover:bg-surface-2'
      : variant === 'danger'
        ? 'bg-danger text-white hover:bg-danger/90'
        : 'text-muted-foreground hover:bg-surface-2';
  return (
    <button type={type} {...props} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${classes} ${className}`}>
      {children}
    </button>
  );
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${props.className ?? ''}`} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${props.className ?? ''}`} />
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
