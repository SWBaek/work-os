import React, { useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Archive,
  AlertTriangle,
  Bot,
  CheckSquare,
  ChevronRight,
  Download,
  Inbox as InboxIcon,
  LinkIcon,
  Mail,
  PanelTop,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { InboxStatus, LinkType, Priority, ProjectStatus, SourceType, TaskStatus } from 'shared';
import api from './lib/api';
import t from './lib/i18n/ko.json';
import { statusColors, priorityClasses, taskStatuses, toTags, isoOrUndefined } from './constants';
import { PageHeader, Button, Input, Select, Badge, StatusBadge } from './components/ui-lite';
import { MeetingNoteEditor } from './components/MeetingNoteEditor';
import { Layout } from './layout/AppLayout';

import { Project, ProjectLink, InboxItem, Task, ApiList, ApiOne, KanbanColumnData, TaskForm, ThemeType, UserSetting, MeetingNote, MaintenanceSummary } from './types';

type DashboardSummary = {
  today: number;
  overdue: number;
  waiting: number;
  lists: {
    today: Task[];
    overdue: Task[];
    waiting: Task[];
  };
};

type ActionNotice = { message: string; undoLabel?: string; onUndo?: () => void };

const ConfirmAction = ({
  label,
  title,
  message,
  icon,
  variant = 'secondary',
  disabled,
  onConfirm,
  ariaLabel,
}: {
  label: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  variant?: 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  onConfirm: () => void;
  ariaLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button aria-label={ariaLabel} variant={variant} disabled={disabled} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true); }}>
        {icon}
        {label}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-[440px] rounded-xl border border-border bg-background p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[18px] font-semibold text-heading">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>{t.cancel}</Button>
              <Button variant={variant === 'danger' ? 'danger' : 'secondary'} onClick={() => { setOpen(false); onConfirm(); }}>
                {label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const ActionNoticeBar = ({ notice, onClear }: { notice?: ActionNotice | null; onClear: () => void }) => {
  if (!notice) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm">
      <span className="font-semibold text-heading">{notice.message}</span>
      <div className="flex items-center gap-2">
        {notice.onUndo ? (
          <Button variant="secondary" onClick={() => { notice.onUndo?.(); onClear(); }}>
            <RotateCcw className="h-4 w-4" />
            {notice.undoLabel ?? t.undo}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onClear}>{t.cancel}</Button>
      </div>
    </div>
  );
};

const useProjects = () => useQuery({
  queryKey: ['projects'],
  queryFn: async () => (await api.get<ApiList<Project>>('/projects')).data.data,
});

const useProjectDetail = (projectId?: string) => useQuery({
  queryKey: ['project', projectId],
  enabled: Boolean(projectId),
  queryFn: async () => (await api.get<ApiOne<Project>>(`/projects/${projectId}`)).data.data,
});

const TaskCard = ({
  task,
  draggable = false,
  onArchive,
  onRestore,
}: {
  task: Task;
  draggable?: boolean;
  onArchive?: (task: Task) => void;
  onRestore?: (task: Task) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { status: task.status }, disabled: !draggable });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`rounded-lg border border-border border-l-4 bg-background p-3 transition-shadow hover:shadow-sm ${priorityClasses[task.priority]} ${task.status === TaskStatus.IN_PROGRESS ? 'border-l-primary' : ''} ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
          <Link to={`/tasks/${task.id}`} className="truncate font-semibold text-heading">{task.title}</Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">{task.priority}</span>
          {onArchive ? (
            <ConfirmAction
              label={t.archive}
              title={t.archiveConfirmTitle}
              message={t.archiveTaskImpact}
              icon={<Archive className="h-4 w-4" />}
              onConfirm={() => onArchive(task)}
            />
          ) : null}
          {onRestore ? (
            <Button variant="secondary" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRestore(task); }}>
              <RotateCcw className="h-4 w-4" />
              {t.restore}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {task.tags.slice(0, 3).map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}
        {task.tags.length > 3 ? <Badge>+{task.tags.length - 3}</Badge> : null}
      </div>
      <div className={`mt-2 flex justify-between text-xs ${task.overdue ? 'font-semibold text-danger' : 'text-muted-foreground'}`}>
        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('ko-KR') : '-'}</span>
        <span className="truncate">{task.project?.name ?? t.noProject}</span>
      </div>
    </div>
  );
};

const QuickInbox = () => {
  const projects = useProjects();
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.OTHER);
  const [rawContent, setRawContent] = useState('');
  const [projectId, setProjectId] = useState('');
  const queryClient = useQueryClient();
  const createInbox = useMutation({
    mutationFn: async () => api.post('/inbox', { source_type: sourceType, raw_content: rawContent, project_id: projectId || undefined }),
    onSuccess: async () => {
      setRawContent('');
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['unprocessed-count'] });
    },
  });
  const submitQuickInbox = () => {
    if (!rawContent.trim() || createInbox.isPending) return;
    createInbox.mutate();
  };
  return (
    <section className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-heading">{t.captureCenterTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.captureCenterSubtitle}</p>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary">{t.dashboardPrimaryAction}</span>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submitQuickInbox(); }} className="grid gap-2 lg:grid-cols-[160px_1fr_220px_auto]">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t.sourceKind}</span>
          <Select className="h-12 w-full rounded-lg bg-background" value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)} aria-label={t.source}>
            {Object.values(SourceType).map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t.captureContent}</span>
          <Input
            value={rawContent}
            onChange={(event) => setRawContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitQuickInbox();
              }
            }}
            placeholder={t.quickInboxPlaceholder}
            className="h-12 w-full rounded-lg bg-background"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted-foreground">{t.assignProject}</span>
          <Select className="h-12 w-full rounded-lg bg-background" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">{t.general}</option>
            {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
        </label>
        <div className="flex items-end">
          <Button type="submit" className="h-12 w-full justify-center" disabled={createInbox.isPending || !rawContent.trim()}><Plus className="h-4 w-4" />{t.create}</Button>
        </div>
      </form>
    </section>
  );
};

const OperationsGuide = () => {
  const steps = [
    { title: t.workflowCaptureTitle, body: t.workflowCaptureBody },
    { title: t.workflowTriageTitle, body: t.workflowTriageBody },
    { title: t.workflowExecuteTitle, body: t.workflowExecuteBody },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index + 1}</div>
          <div className="font-semibold text-heading">{step.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        </div>
      ))}
    </div>
  );
};

const DashboardPanel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-border bg-background ${className}`}>{children}</section>
);

const PanelTitle = ({ icon, title, count, action }: { icon?: React.ReactNode; title: string; count?: number; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
    <div className="flex min-w-0 items-center gap-2">
      {icon}
      <h2 className="truncate text-[18px] font-semibold text-heading">{title}</h2>
      {typeof count === 'number' ? <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">{count}</span> : null}
    </div>
    {action}
  </div>
);

const SourceIcon = ({ source }: { source: SourceType }) => {
  const iconClass = "h-4 w-4";
  if (source === SourceType.EMAIL) return <Mail className={`${iconClass} text-muted-foreground`} />;
  if (source === SourceType.JIRA) return <PanelTop className={`${iconClass} text-status-open`} />;
  if (source === SourceType.TEAMS) return <Bot className={`${iconClass} text-status-hold`} />;
  return <InboxIcon className={`${iconClass} text-muted-foreground`} />;
};

const PriorityPill = ({ priority }: { priority: Priority }) => {
  const classes: Record<Priority, string> = {
    [Priority.CRITICAL]: 'bg-danger/10 text-danger',
    [Priority.HIGH]: 'bg-[#F59E0B]/15 text-[#92400E]',
    [Priority.MEDIUM]: 'bg-[#0EA5E9]/15 text-[#075985]',
    [Priority.LOW]: 'bg-success/10 text-success',
  };
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${classes[priority]}`}>{priority}</span>;
};

const DashboardInboxRow = ({
  item,
  projects,
  onSaved,
  onArchived,
}: {
  item: InboxItem;
  projects: Project[];
  onSaved: () => Promise<void>;
  onArchived: (item: InboxItem) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [rawContent, setRawContent] = useState(item.raw_content);
  const [sourceType, setSourceType] = useState<SourceType>(item.source_type);
  const [projectId, setProjectId] = useState(item.project?.id ?? '');
  const updateInbox = useMutation({
    mutationFn: async () => api.patch(`/inbox/${item.id}`, {
      raw_content: rawContent,
      source_type: sourceType,
      project_id: projectId || null,
    }),
    onSuccess: async () => {
      await onSaved();
      setEditing(false);
    },
  });
  const archiveInbox = useMutation({
    mutationFn: async () => api.delete(`/inbox/${item.id}`),
    onSuccess: () => onArchived(item),
  });

  if (editing) {
    return (
      <div className="grid gap-2 border-b border-border py-3 last:border-b-0 lg:grid-cols-[140px_1fr_180px_auto]">
        <Select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
          {Object.values(SourceType).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
        <Input value={rawContent} onChange={(event) => setRawContent(event.target.value)} />
        <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          <option value="">{t.general}</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </Select>
        <div className="flex justify-end gap-2">
          <Button aria-label={`Save inbox ${item.id}`} variant="secondary" onClick={() => updateInbox.mutate()} disabled={updateInbox.isPending || !rawContent.trim()}>{t.save}</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>{t.cancel}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[52px] gap-3 border-b border-border py-3 last:border-b-0 lg:grid-cols-[120px_1fr_160px_190px] lg:items-center">
      <div className="flex items-center gap-2 text-sm font-semibold text-heading">
        <SourceIcon source={item.source_type} />
        {item.source_type}
      </div>
      <Link to="/inbox" className="truncate pr-4 text-sm font-semibold text-heading hover:text-primary">{item.raw_content}</Link>
      <span className="truncate rounded-md border border-border bg-surface px-2 py-1 text-sm text-heading">{item.project?.name ?? t.general}</span>
      <div className="flex flex-wrap justify-end gap-2">
        <PriorityPill priority={item.converted_tasks[0]?.priority ?? Priority.MEDIUM} />
        <Button aria-label={`Edit inbox ${item.id}`} variant="secondary" onClick={() => setEditing(true)}>{t.edit}</Button>
        <ConfirmAction
          label={t.archive}
          title={t.archiveConfirmTitle}
          message={t.archiveInboxImpact}
          icon={<Archive className="h-4 w-4" />}
          onConfirm={() => archiveInbox.mutate()}
          disabled={archiveInbox.isPending}
          ariaLabel={`Archive inbox ${item.id}`}
        />
      </div>
    </div>
  );
};

const DashboardInboxTable = ({ items }: { items: InboxItem[] }) => {
  const projects = useProjects();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['unprocessed-count'] });
  };
  const restoreInbox = useMutation({
    mutationFn: async (item: InboxItem) => api.patch(`/inbox/${item.id}/restore`),
    onSuccess: invalidate,
  });
  return (
    <div className="overflow-hidden px-4 pb-4">
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      <div className="mt-3 hidden grid-cols-[120px_1fr_160px_190px] border-b border-border py-2 text-xs font-semibold text-heading lg:grid">
        <span>{t.source}</span>
        <span>{t.content}</span>
        <span>{t.project}</span>
        <span className="text-right">{t.actions}</span>
      </div>
      {items.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">{t.empty}</div> : null}
      {items.map((item) => (
        <DashboardInboxRow
          key={item.id}
          item={item}
          projects={projects.data ?? []}
          onSaved={invalidate}
          onArchived={async (archivedItem) => {
            await invalidate();
            setNotice({ message: `${archivedItem.raw_content.slice(0, 48)} ${t.archived}`, onUndo: () => restoreInbox.mutate(archivedItem) });
          }}
        />
      ))}
      <div className="pt-4 text-center">
        <Link to="/inbox" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">{t.viewAll}<ChevronRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
};

const WorkOverview = ({ summary }: { summary?: DashboardSummary }) => {
  const items = [
    { label: t.today, sub: t.todayHelp, value: summary?.today ?? 0, color: statusColors[TaskStatus.IN_PROGRESS] },
    { label: t.overdue, sub: t.overdueHelp, value: summary?.overdue ?? 0, color: '#EF4444' }, // danger color
    { label: t.waiting, sub: t.waitingHelp, value: summary?.waiting ?? 0, color: statusColors[TaskStatus.WAITING] },
  ];
  return (
    <div className="w-full max-w-[640px] rounded-xl border border-border bg-background px-3 py-2 xl:shrink-0">
      <div className="mb-2 text-xs font-semibold text-heading">{t.workOverview}</div>
      <div className="flex gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface px-2 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-heading">{item.label}</div>
              <div className="truncate text-[11px] text-muted-foreground">{item.sub}</div>
            </div>
            <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${item.label === t.overdue && item.value > 0 ? 'bg-danger/10 text-danger' : 'bg-background text-heading'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardTaskLists = ({ summary }: { summary?: DashboardSummary }) => {
  const sections = [
    { key: 'today' as const, label: t.today, tasks: summary?.lists.today ?? [], count: summary?.today ?? 0 },
    { key: 'overdue' as const, label: t.overdue, tasks: summary?.lists.overdue ?? [], count: summary?.overdue ?? 0 },
    { key: 'waiting' as const, label: t.waiting, tasks: summary?.lists.waiting ?? [], count: summary?.waiting ?? 0 },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {sections.map((section) => (
        <section key={section.key} className="rounded-lg bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-heading">{section.label}</h3>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-heading">{section.count}</span>
          </div>
          <div className="space-y-2">
            {section.tasks.length === 0 ? <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">{t.empty}</div> : null}
            {section.tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </section>
      ))}
    </div>
  );
};

const DashboardKanbanScope = () => {
  const projects = useProjects();
  const [scope, setScope] = useState<'all' | 'project'>('all');
  const [projectId, setProjectId] = useState('');
  const selectedProjectId = scope === 'project' ? projectId || projects.data?.[0]?.id : undefined;

  return (
    <DashboardPanel>
      <PanelTitle
        title={t.projectsAndTasks}
        action={(
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-border bg-surface p-1">
              {(['all', 'project'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  aria-label={`Kanban scope ${value}`}
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${scope === value ? 'bg-background text-primary' : 'text-muted-foreground hover:text-heading'}`}
                >
                  {value === 'all' ? t.all : t.project}
                </button>
              ))}
            </div>
            {scope === 'project' ? (
              <Select className="w-[180px]" value={selectedProjectId ?? ''} onChange={(event) => setProjectId(event.target.value)}>
                {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </Select>
            ) : null}
          </div>
        )}
      />
      <KanbanBoard compact projectId={selectedProjectId} />
    </DashboardPanel>
  );
};

const Dashboard = () => {
  const inbox = useQuery({ queryKey: ['inbox', 'dashboard'], queryFn: async () => (await api.get<ApiList<InboxItem>>('/inbox?status=Unprocessed&limit=6')).data.data });
  const summaryQuery = useQuery({ queryKey: ['dashboard-summary'], queryFn: async () => (await api.get<{ data: DashboardSummary }>('/dashboard/summary')).data.data });
  const inboxItems = inbox.data ?? [];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_640px] xl:items-start">
        <div className="min-w-0 rounded-xl border border-border bg-background p-4">
          <h1 className="text-[24px] font-bold text-heading">{t.greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.dashboardSubtitle}</p>
        </div>
        <WorkOverview summary={summaryQuery.data} />
      </div>
      <OperationsGuide />
      <QuickInbox />
      <DashboardPanel>
        <PanelTitle
          icon={<InboxIcon className="h-5 w-5 text-heading" />}
          title={t.inbox}
          count={inboxItems.length}
        />
        <DashboardInboxTable items={inboxItems} />
      </DashboardPanel>
      <DashboardPanel>
        <PanelTitle title={`${t.today} / ${t.overdue} / ${t.waiting}`} />
        <DashboardTaskLists summary={summaryQuery.data} />
      </DashboardPanel>
      <DashboardKanbanScope />
    </div>
  );
};

const ProjectForm = ({ parentId }: { parentId?: string }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [tags, setTags] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => api.post('/projects', { name, description, status, parent_project_id: parentId, tags: toTags(tags) }),
    onSuccess: async () => {
      setName('');
      setDescription('');
      setTags('');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) mutation.mutate(); }} className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-heading">{parentId ? t.subProjects : t.createProject}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.projectCreateHelp}</p>
      </div>
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_140px]">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.title} />
        <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.description} />
        <Select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
          {Object.values(ProjectStatus).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
        <Button type="submit" disabled={mutation.isPending}><Plus className="h-4 w-4" />{t.create}</Button>
      </div>
    </form>
  );
};

const Projects = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const queryClient = useQueryClient();
  const projects = useQuery({
    queryKey: ['projects', statusFilter],
    queryFn: async () => (await api.get<ApiList<Project>>(statusFilter === 'all' ? '/projects' : `/projects?status=${encodeURIComponent(statusFilter)}`)).data.data,
  });
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['layout-projects'] });
    await queryClient.invalidateQueries({ queryKey: ['project'] });
  };
  const restoreProject = useMutation({
    mutationFn: async (project: Project) => api.patch(`/projects/${project.id}/restore`),
    onSuccess: invalidate,
  });
  const archiveProject = useMutation({
    mutationFn: async (project: Project) => api.delete(`/projects/${project.id}`),
    onSuccess: async (_result, project) => {
      await invalidate();
      setNotice({ message: `${project.name} ${t.archived}`, onUndo: () => restoreProject.mutate(project) });
    },
  });
  const filters: Array<{ value: 'all' | ProjectStatus; label: string }> = [
    { value: 'all', label: t.all },
    { value: ProjectStatus.ACTIVE, label: ProjectStatus.ACTIVE },
    { value: ProjectStatus.ON_HOLD, label: ProjectStatus.ON_HOLD },
    { value: ProjectStatus.DONE, label: ProjectStatus.DONE },
    { value: ProjectStatus.ARCHIVED, label: ProjectStatus.ARCHIVED },
  ];
  const visibleProjects = projects.data ?? [];
  const statusSummary = [
    { status: ProjectStatus.ACTIVE, label: t.activeProjectHelp, count: visibleProjects.filter((project) => project.status === ProjectStatus.ACTIVE).length },
    { status: ProjectStatus.ON_HOLD, label: t.onHoldProjectHelp, count: visibleProjects.filter((project) => project.status === ProjectStatus.ON_HOLD).length },
    { status: ProjectStatus.DONE, label: t.doneProjectHelp, count: visibleProjects.filter((project) => project.status === ProjectStatus.DONE).length },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title={t.projects} />
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      <section className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-heading">{t.projectHubTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.projectHubSubtitle}</p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{t.projectDefaultView}</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {statusSummary.map((item) => (
            <button
              key={item.status}
              type="button"
              onClick={() => setStatusFilter(item.status)}
              className="rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={item.status} />
                <span className="text-[18px] font-bold text-heading">{item.count}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </button>
          ))}
        </div>
      </section>
      <ProjectForm />
      <div className="rounded-xl border border-border bg-background p-3">
        <div className="mb-2 text-sm font-semibold text-heading">{t.projectFilterHelp}</div>
        <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            aria-label={`Project filter ${filter.value}`}
            className={`rounded-full px-3 py-1 text-sm ${statusFilter === filter.value ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}
          >
            {filter.label}
          </button>
        ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {visibleProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-lg border border-border p-4 transition-colors hover:bg-surface"
          >
            <div className="flex items-start justify-between gap-2">
              <Link to={`/projects/${project.id}`} className="min-w-0 flex-1 rounded-md outline-none focus:ring-2 focus:ring-primary/20">
                <div className="font-semibold text-heading">{project.name}</div>
                <div className="mt-1 text-xs font-semibold text-primary">{t.openProject}</div>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={project.status} />
                {statusFilter === ProjectStatus.ARCHIVED ? (
                  <Button variant="secondary" onClick={() => restoreProject.mutate(project)}>
                    <RotateCcw className="h-4 w-4" />
                    {t.restore}
                  </Button>
                ) : (
                  <ConfirmAction
                    label={t.archive}
                    title={t.archiveConfirmTitle}
                    message={t.archiveProjectImpact}
                    icon={<Archive className="h-4 w-4" />}
                    onConfirm={() => archiveProject.mutate(project)}
                  />
                )}
              </div>
            </div>
            <Link to={`/projects/${project.id}`} className="mt-2 block rounded-md outline-none focus:ring-2 focus:ring-primary/20">
              <p className="line-clamp-2 text-sm text-muted-foreground">{project.description ?? '-'}</p>
              <div className="mt-3 flex flex-wrap gap-1">{project.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
              <div className="mt-3 text-xs text-muted-foreground">{project._count?.tasks ?? 0} {t.taskCount} · {project._count?.links ?? 0} {t.linkCount}</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

const projectTabs = [
  { key: 'overview', label: t.overview },
  { key: 'tasks', label: t.tasks },
  { key: 'kanban', label: t.kanban },
  { key: 'meeting-notes', label: t.meetingNotes },
  { key: 'decisions', label: t.decisions },
  { key: 'links', label: t.links },
] as const;

type ProjectTabKey = (typeof projectTabs)[number]['key'];

const ProjectHeaderCard = ({ project }: { project: Project }) => {
  const queryClient = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: async (status: ProjectStatus) => api.patch(`/projects/${project.id}`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['layout-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
  });
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground">{project.description ?? '-'}</p>
          <div className="mt-2 flex flex-wrap gap-1">{project.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
        </div>
        <div className="w-[180px] shrink-0 space-y-2">
          <StatusBadge status={project.status} />
          <Select value={project.status} onChange={(event) => updateStatus.mutate(event.target.value as ProjectStatus)} disabled={updateStatus.isPending} aria-label={`Project status ${project.id}`}>
            {Object.values(ProjectStatus).map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </div>
      </div>
    </section>
  );
};

const ProjectTabBar = ({ projectId, activeTab }: { projectId: string; activeTab: ProjectTabKey }) => {
  const navigate = useNavigate();

  const handleClick = (tabKey: ProjectTabKey) => {
    if (tabKey === 'meeting-notes') {
      navigate(`/projects/${projectId}/meeting-notes`);
      return;
    }

    navigate({
      pathname: `/projects/${projectId}`,
      search: tabKey === 'overview' ? '' : `?tab=${tabKey}`,
    });
  };

  return (
    <div className="flex gap-2">
      {projectTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => handleClick(tab.key)}
          className={`rounded-full px-3 py-1 text-sm ${activeTab === tab.key ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const EmptyStateCard = ({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) => (
  <div className="rounded-lg border border-border bg-surface p-4">
    <div className="font-semibold text-heading">{title}</div>
    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);

const ProjectOverview = ({ project }: { project: Project }) => {
  const inactiveStatuses: TaskStatus[] = [TaskStatus.DONE, TaskStatus.ARCHIVED, TaskStatus.CANCELED];
  const activeTasks = (project.tasks ?? []).filter((task) => !inactiveStatuses.includes(task.status));
  const recentNotes = (project.meeting_notes ?? []).slice(0, 3);
  const links = (project.links ?? []).slice(0, 4);
  const subProjects = project.sub_projects ?? [];

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Metric label={t.tasks} value={project.tasks?.length ?? 0} />
      <Metric label={t.links} value={project.links?.length ?? 0} />
      <Metric label={t.subProjects} value={subProjects.length} />
      <section className="lg:col-span-2 rounded-lg border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-heading">{t.projectOverviewTasksTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.projectOverviewTasksBody}</p>
          </div>
          <Link to={`/projects/${project.id}?tab=tasks`} className="text-sm font-semibold text-primary">{t.tasks}</Link>
        </div>
        <div className="space-y-2">
          {activeTasks.length === 0 ? (
            <EmptyStateCard
              title={t.projectNoActiveTasksTitle}
              body={t.projectNoActiveTasksBody}
              action={<Link to="/tasks" className="text-sm font-semibold text-primary">{t.createTask}</Link>}
            />
          ) : null}
          {activeTasks.slice(0, 4).map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3">
          <h2 className="font-semibold text-heading">{t.projectOverviewLinksTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.projectOverviewLinksBody}</p>
        </div>
        <div className="space-y-2">
          {links.length === 0 ? (
            <EmptyStateCard title={t.projectNoLinksTitle} body={t.projectNoLinksBody} />
          ) : null}
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url_or_path}
              className="flex items-center gap-2 rounded-lg bg-surface p-3 text-sm font-semibold text-heading hover:bg-surface-2"
            >
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{link.title ?? link.url_or_path}</span>
            </a>
          ))}
          <Link to={`/projects/${project.id}?tab=links`} className="inline-flex text-sm font-semibold text-primary">{t.projectLinksPurpose}</Link>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3">
          <h2 className="font-semibold text-heading">{t.projectOverviewNotesTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.projectOverviewNotesBody}</p>
        </div>
        <div className="space-y-2">
          {recentNotes.length === 0 ? (
            <EmptyStateCard title={t.projectNoNotesTitle} body={t.projectNoNotesBody} />
          ) : null}
          {recentNotes.map((note) => (
            <Link key={note.id} to={`/projects/${project.id}/meeting-notes/${note.id}`} className="block rounded-lg bg-surface p-3 hover:bg-surface-2">
              <div className="truncate text-sm font-semibold text-heading">{note.title ?? t.meetingNotes}</div>
              <div className="text-xs text-muted-foreground">{note.meeting_date ? new Date(note.meeting_date).toLocaleDateString('ko-KR') : '-'}</div>
            </Link>
          ))}
          <Link to={`/projects/${project.id}/meeting-notes`} className="inline-flex text-sm font-semibold text-primary">{t.meetingNotes}</Link>
        </div>
      </section>
      <section className="lg:col-span-2 rounded-lg border border-border bg-background p-4">
        <div className="mb-3">
          <h2 className="font-semibold text-heading">{t.subProjects}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.projectOverviewSubProjectsBody}</p>
        </div>
        <ProjectForm parentId={project.id} />
        <div className="mt-3 flex flex-wrap gap-2">
          {subProjects.length === 0 ? <span className="text-sm text-muted-foreground">{t.empty}</span> : null}
          {subProjects.map((sub) => <Badge key={sub.id}>{sub.name}</Badge>)}
        </div>
      </section>
    </div>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const data = useProjectDetail(projectId).data;
  const archiveProject = useMutation({
    mutationFn: async () => api.delete(`/projects/${projectId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['layout-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigate('/projects');
    },
  });
  const restoreProject = useMutation({
    mutationFn: async () => api.patch(`/projects/${projectId}/restore`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['layout-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  if (!data) return <PageHeader title={t.project} />;
  const tab = (searchParams.get('tab') as ProjectTabKey | null) ?? 'overview';

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.name}
        action={data.status === ProjectStatus.ARCHIVED ? (
          <Button variant="secondary" onClick={() => restoreProject.mutate()}>
            <RotateCcw className="h-4 w-4" />
            {t.restore}
          </Button>
        ) : (
          <ConfirmAction
            label={t.archive}
            title={t.archiveConfirmTitle}
            message={t.archiveProjectImpact}
            icon={<Archive className="h-4 w-4" />}
            onConfirm={() => archiveProject.mutate()}
          />
        )}
      />
      <ProjectHeaderCard project={data} />
      <ProjectTabBar projectId={data.id} activeTab={tab} />
      {tab === 'overview' ? <ProjectOverview project={data} /> : null}
      {tab === 'tasks' ? <div className="space-y-2">{data.tasks?.map((task) => <TaskCard key={task.id} task={task} />)}</div> : null}
      {tab === 'kanban' ? <KanbanBoard projectId={data.id} /> : null}
      {tab === 'links' ? <ProjectLinks projectId={data.id} links={data.links ?? []} /> : null}
      {tab === 'decisions' ? (
        <EmptyStateCard
          title={t.decisionsPlaceholderTitle}
          body={t.decisionsPlaceholderBody}
        />
      ) : null}
    </div>
  );
};

const ProjectMeetingNotesPage = () => {
  const { projectId } = useParams();
  const data = useProjectDetail(projectId).data;
  const [showTrash, setShowTrash] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const queryClient = useQueryClient();
  const notes = useQuery({
    queryKey: ['meeting-notes', projectId, showTrash],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<ApiList<MeetingNote>>(`/projects/${projectId}/meeting-notes${showTrash ? '?deleted=true' : ''}`)).data.data,
  });
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    await queryClient.invalidateQueries({ queryKey: ['meeting-notes', projectId] });
  };
  const restoreNote = useMutation({
    mutationFn: async (note: MeetingNote) => api.patch(`/meeting-notes/${note.id}/restore`),
    onSuccess: invalidate,
  });
  const deleteNote = useMutation({
    mutationFn: async (note: MeetingNote) => api.delete(`/meeting-notes/${note.id}`),
    onSuccess: async (_result, note) => {
      await invalidate();
      setNotice({ message: `${note.title ?? t.meetingNotes} ${t.delete}`, onUndo: () => restoreNote.mutate(note) });
    },
  });

  if (!data) return <PageHeader title={t.meetingNotes} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.name}
        action={(
          <Link
            to={`/projects/${data.id}/meeting-notes/new`}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            {t.create}
          </Link>
        )}
      />
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      <ProjectHeaderCard project={data} />
      <ProjectTabBar projectId={data.id} activeTab="meeting-notes" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowTrash(false)} className={`rounded-full px-3 py-1 text-sm ${!showTrash ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.active}</button>
        <button type="button" onClick={() => setShowTrash(true)} className={`rounded-full px-3 py-1 text-sm ${showTrash ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.trash}</button>
      </div>
      <section className="space-y-2">
        {(notes.data ?? []).length === 0 ? <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">{t.empty}</div> : null}
        {(notes.data ?? []).map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/projects/${data.id}/meeting-notes/${note.id}`} className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  {note.meeting_date ? new Date(note.meeting_date).toLocaleDateString('ko-KR') : '-'}
                </div>
                <h2 className="mt-1 truncate font-semibold text-heading">{note.title ?? t.meetingNotes}</h2>
              </Link>
              {showTrash ? (
                <Button variant="secondary" onClick={() => restoreNote.mutate(note)}>
                  <RotateCcw className="h-4 w-4" />
                  {t.restore}
                </Button>
              ) : (
                <ConfirmAction
                  label={t.delete}
                  title={t.deleteConfirmTitle}
                  message={t.deleteNoteImpact}
                  icon={<Trash2 className="h-4 w-4" />}
                  variant="danger"
                  onConfirm={() => deleteNote.mutate(note)}
                />
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

const useMeetingNote = (noteId?: string) => useQuery({
  queryKey: ['meeting-note', noteId],
  enabled: Boolean(noteId && noteId !== 'new'),
  queryFn: async () => (await api.get<ApiOne<MeetingNote>>(`/meeting-notes/${noteId}`)).data.data,
});

const hashActionText = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const extractActionItems = (markdown: string, noteId: string) => {
  const matches = markdown.matchAll(/^[-*]\s+\[[ xX]\]\s+(.+)$/gm);
  return Array.from(matches, (match, index) => {
    const text = match[1].trim();
    const normalized = text.replace(/\s+/g, ' ').toLowerCase();
    return { text, key: `${noteId}:${index}:${hashActionText(normalized)}` };
  }).filter((item) => item.text);
};

const ProjectMeetingNoteDetailPage = () => {
  const { projectId, noteId } = useParams();
  const data = useProjectDetail(projectId).data;
  const isCreateMode = noteId === 'new';
  const noteQuery = useMeetingNote(isCreateMode ? undefined : noteId);
  const settingsQuery = useSettings();
  const note = noteQuery.data;

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [meetingDateDraft, setMeetingDateDraft] = useState<string | null>(null);
  const [attendeesDraft, setAttendeesDraft] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string | null>(null);

  const titleValue = titleDraft ?? (isCreateMode ? '' : note?.title ?? '');
  const meetingDateValue = meetingDateDraft ?? (isCreateMode ? '' : note?.meeting_date?.substring(0, 10) ?? '');
  const attendeesValue = attendeesDraft ?? (isCreateMode ? '' : note?.attendees ?? '');
  const initialEditorContent = editorContent ?? (isCreateMode ? settingsQuery.data?.meeting_note_template ?? '' : note?.markdown_content ?? '');

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/projects/${projectId}/meeting-notes`, { title: titleValue, meeting_date: isoOrUndefined(meetingDateValue), attendees: attendeesValue, markdown_content: initialEditorContent }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['meeting-notes', projectId] });
      navigate(`/projects/${projectId}/meeting-notes`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (content: string) => api.patch(`/meeting-notes/${noteId}`, { title: titleValue, meeting_date: isoOrUndefined(meetingDateValue), attendees: attendeesValue, markdown_content: content }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meeting-note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['meeting-notes', projectId] });
    }
  });

  const convertActionItem = useMutation({
    mutationFn: async (actionItem: { text: string; key: string }) => api.post(`/meeting-notes/${noteId}/action-items/tasks`, { action_item_text: actionItem.text, action_item_key: actionItem.key }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meeting-note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
  const deleteNote = useMutation({
    mutationFn: async () => api.delete(`/meeting-notes/${noteId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['meeting-notes', projectId] });
      navigate(`/projects/${projectId}/meeting-notes`);
    },
  });
  const restoreNote = useMutation({
    mutationFn: async () => api.patch(`/meeting-notes/${noteId}/restore`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meeting-note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['meeting-notes', projectId] });
    },
  });

  if (!data) return <PageHeader title={t.meetingNotes} />;

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    if (!isCreateMode) {
      updateMutation.mutate(content);
    }
  };

  const handleSaveField = () => {
    if (!isCreateMode) {
      updateMutation.mutate(initialEditorContent);
    }
  };
  const actionItems = !isCreateMode && note ? extractActionItems(note.markdown_content, note.id) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={isCreateMode ? t.meetingNotes : note?.title ?? t.meetingNotes}
        action={
          <div className="flex items-center gap-4">
            {isCreateMode && <Button onClick={() => createMutation.mutate()}>{t.save}</Button>}
            {!isCreateMode && note ? (
              <a
                href={`/api/v1/meeting-notes/${note.id}/export.html`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-heading transition-colors hover:bg-surface-2"
              >
              <Download className="h-4 w-4" />
                {t.htmlExport}
              </a>
            ) : null}
            {!isCreateMode && note && !note.deleted_at ? (
              <ConfirmAction
                label={t.delete}
                title={t.deleteConfirmTitle}
                message={t.deleteNoteImpact}
                icon={<Trash2 className="h-4 w-4" />}
                variant="danger"
                onConfirm={() => deleteNote.mutate()}
              />
            ) : null}
            {!isCreateMode && note?.deleted_at ? (
              <Button variant="secondary" onClick={() => restoreNote.mutate()}>
                <RotateCcw className="h-4 w-4" />
                {t.restore}
              </Button>
            ) : null}
            <Link to={`/projects/${data.id}/meeting-notes`} className="text-sm font-semibold text-primary">{t.meetingNotes}</Link>
          </div>
        }
      />
      <section className="rounded-lg border border-border bg-background p-6 space-y-4">
        <Input
          value={titleValue}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleSaveField}
          placeholder={t.meetingNoteTitle}
          className="text-lg font-bold"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            value={meetingDateValue}
            onChange={(e) => setMeetingDateDraft(e.target.value)}
            onBlur={handleSaveField}
          />
          <Input
            value={attendeesValue}
            onChange={(e) => setAttendeesDraft(e.target.value)}
            onBlur={handleSaveField}
            placeholder={t.attendees}
          />
        </div>
        {(!isCreateMode && note) ? (
          <MeetingNoteEditor initialContent={initialEditorContent} onChange={handleEditorChange} />
        ) : isCreateMode && settingsQuery.data ? (
          <MeetingNoteEditor initialContent={initialEditorContent} onChange={handleEditorChange} />
        ) : null}
      </section>
      {!isCreateMode && note ? (
        <section className="space-y-3 rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[18px] font-semibold text-heading">{t.actionItems}</h2>
          </div>
          {actionItems.length === 0 ? <div className="text-sm text-muted-foreground">{t.empty}</div> : null}
          {actionItems.map((actionItem) => {
            const relatedTask = note.related_tasks.find((task) => task.source_action_key === actionItem.key);
            return (
              <div key={actionItem.key} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
                <span className="text-sm font-semibold text-heading">{actionItem.text}</span>
                {relatedTask ? (
                  <Link to={`/tasks/${relatedTask.id}`} className="text-sm font-semibold text-primary">{t.converted}</Link>
                ) : (
                  <Button variant="secondary" onClick={() => convertActionItem.mutate(actionItem)} disabled={convertActionItem.isPending}>
                    <Plus className="h-4 w-4" />
                    {t.createTask}
                  </Button>
                )}
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-border p-4">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-2xl font-bold text-heading">{value}</div>
  </div>
);

const ProjectLinks = ({ projectId, links }: { projectId: string; links: ProjectLink[] }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LinkType>(LinkType.OTHER);
  const [showTrash, setShowTrash] = useState(false);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const queryClient = useQueryClient();
  const deletedLinks = useQuery({
    queryKey: ['project-links', projectId, 'trash'],
    enabled: showTrash,
    queryFn: async () => (await api.get<ApiList<ProjectLink>>(`/projects/${projectId}/links?deleted=true`)).data.data,
  });
  const mutation = useMutation({
    mutationFn: async () => api.post(`/projects/${projectId}/links`, { url_or_path: url, title, type }),
    onSuccess: async () => {
      setUrl('');
      setTitle('');
      setType(LinkType.OTHER);
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
  const restoreLink = useMutation({
    mutationFn: async (link: ProjectLink) => api.patch(`/project-links/${link.id}/restore`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-links', projectId, 'trash'] });
    },
  });
  const deleteLink = useMutation({
    mutationFn: async (link: ProjectLink) => api.delete(`/project-links/${link.id}`),
    onSuccess: async (_result, link) => {
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['project-links', projectId, 'trash'] });
      setNotice({ message: `${link.title ?? link.url_or_path} ${t.delete}`, onUndo: () => restoreLink.mutate(link) });
    },
  });
  const visibleLinks = showTrash ? deletedLinks.data ?? [] : links;
  return (
    <section className="space-y-3">
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      {!showTrash ? (
        <form onSubmit={(event) => { event.preventDefault(); if (url.trim()) mutation.mutate(); }} className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-heading">{t.projectLinksPurpose}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.projectLinksHelp}</p>
          </div>
          <div className="grid gap-2 lg:grid-cols-[1fr_1fr_150px_auto]">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.title} />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={t.urlOrPath} />
            <Select value={type} onChange={(event) => setType(event.target.value as LinkType)}>
              {Object.values(LinkType).map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
            <Button type="submit"><LinkIcon className="h-4 w-4" />{t.create}</Button>
          </div>
        </form>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowTrash(false)} className={`rounded-full px-3 py-1 text-sm ${!showTrash ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.active}</button>
        <button type="button" onClick={() => setShowTrash(true)} className={`rounded-full px-3 py-1 text-sm ${showTrash ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.trash}</button>
      </div>
      {visibleLinks.map((link) => (
        <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="min-w-0">
            <a href={link.url_or_path} className="font-semibold text-heading">{link.title ?? link.url_or_path}</a>
            <div className="text-xs text-muted-foreground">{link.type}</div>
          </div>
          {showTrash ? (
            <Button variant="secondary" onClick={() => restoreLink.mutate(link)}>
              <RotateCcw className="h-4 w-4" />
              {t.restore}
            </Button>
          ) : (
            <ConfirmAction
              label={t.delete}
              title={t.deleteConfirmTitle}
              message={t.deleteLinkImpact}
              icon={<Trash2 className="h-4 w-4" />}
              variant="danger"
              onConfirm={() => deleteLink.mutate(link)}
            />
          )}
        </div>
      ))}
    </section>
  );
};

const InboxList = ({
  items,
  allowConvert = true,
  onArchive,
  onRestore,
}: {
  items: InboxItem[];
  allowConvert?: boolean;
  onArchive?: (item: InboxItem) => void;
  onRestore?: (item: InboxItem) => void;
}) => (
  <div className="space-y-2">
    {items.length === 0 ? <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">{t.empty}</div> : null}
    {items.map((item) => (
      <div key={item.id} className="rounded-lg border border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-semibold text-heading">{item.raw_content}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            {onArchive ? (
              <ConfirmAction
                label={t.archive}
                title={t.archiveConfirmTitle}
                message={t.archiveInboxImpact}
                icon={<Archive className="h-4 w-4" />}
                onConfirm={() => onArchive(item)}
              />
            ) : null}
            {onRestore ? (
              <Button variant="secondary" onClick={() => onRestore(item)}>
                <RotateCcw className="h-4 w-4" />
                {t.restore}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">{item.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
        {allowConvert && item.status === InboxStatus.UNPROCESSED ? <ConvertInboxForm item={item} /> : null}
        {item.converted_tasks.length > 0 ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {t.convertedToTask}: {item.converted_tasks.map((task) => task.title).join(', ')}
          </div>
        ) : null}
      </div>
    ))}
  </div>
);

const Inbox = () => {
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.OTHER);
  const [rawContent, setRawContent] = useState('');
  const [tags, setTags] = useState('');
  const [statusFilter, setStatusFilter] = useState<InboxStatus>(InboxStatus.UNPROCESSED);
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ['inbox', statusFilter],
    queryFn: async () => (await api.get<ApiList<InboxItem>>(`/inbox?status=${encodeURIComponent(statusFilter)}`)).data.data,
  });
  const createInbox = useMutation({
    mutationFn: async () => api.post('/inbox', { source_type: sourceType, raw_content: rawContent, tags: toTags(tags) }),
    onSuccess: async () => {
      setRawContent('');
      setTags('');
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
    },
  });
  const restoreInbox = useMutation({
    mutationFn: async (item: InboxItem) => api.patch(`/inbox/${item.id}/restore`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['unprocessed-count'] });
    },
  });
  const archiveInbox = useMutation({
    mutationFn: async (item: InboxItem) => api.delete(`/inbox/${item.id}`),
    onSuccess: async (_result, item) => {
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['unprocessed-count'] });
      setNotice({ message: `${item.raw_content.slice(0, 48)} ${t.archived}`, onUndo: () => restoreInbox.mutate(item) });
    },
  });
  const historyFilters = [
    { status: InboxStatus.UNPROCESSED, label: t.unprocessed },
    { status: InboxStatus.CONVERTED, label: t.converted },
    { status: InboxStatus.ARCHIVED, label: t.archived },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title={t.inboxHistory} />
      <section className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-heading">{t.inboxHistoryTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.inboxHistoryRole}</p>
          </div>
          <Link to="/" className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">{t.goDashboard}</Link>
        </div>
      </section>
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      <form onSubmit={(event) => { event.preventDefault(); if (rawContent.trim()) createInbox.mutate(); }} className="grid grid-cols-[140px_1fr_180px_auto] gap-2">
        <Select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
          {Object.values(SourceType).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
        <Input value={rawContent} onChange={(event) => setRawContent(event.target.value)} placeholder={t.content} />
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
        <Button type="submit"><Plus className="h-4 w-4" />{t.create}</Button>
      </form>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-heading">{t.historyFilter}</span>
        {historyFilters.map((filter) => (
          <button
            key={filter.status}
            type="button"
            onClick={() => setStatusFilter(filter.status)}
            className={`rounded-full px-3 py-1 text-sm ${statusFilter === filter.status ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <InboxList
        items={inbox.data ?? []}
        allowConvert={statusFilter === InboxStatus.UNPROCESSED}
        onArchive={statusFilter !== InboxStatus.ARCHIVED ? (item) => archiveInbox.mutate(item) : undefined}
        onRestore={statusFilter === InboxStatus.ARCHIVED ? (item) => restoreInbox.mutate(item) : undefined}
      />
    </div>
  );
};

const ConvertInboxForm = ({ item }: { item: InboxItem }) => {
  const projects = useProjects();
  const suggestedTitle = item.raw_content.slice(0, 64);
  const [form, setForm] = useState<TaskForm>({ title: '', project_id: item.project?.id ?? '', priority: Priority.MEDIUM, due_date: '' });
  const [tags, setTags] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => api.post(`/inbox/${item.id}/convert`, {
      ...form,
      title: form.title.trim() || suggestedTitle,
      project_id: form.project_id || undefined,
      due_date: isoOrUndefined(form.due_date),
      tags: toTags(tags),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['inbox', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
      await queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
  return (
    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="mt-3 grid grid-cols-[1fr_160px_120px_120px_140px_auto] gap-2">
      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t.taskTitleOptional} />
      <Select value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })}>
        <option value="">{t.noProject}</option>
        {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </Select>
      <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
        {Object.values(Priority).map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
      <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
      <Button type="submit">{t.convert}</Button>
    </form>
  );
};

const Tasks = () => {
  const [statusFilter, setStatusFilter] = useState<'active' | TaskStatus>('active');
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const queryClient = useQueryClient();
  const tasks = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: async () => (await api.get<ApiList<Task>>(statusFilter === TaskStatus.ARCHIVED ? `/tasks?status=${encodeURIComponent(TaskStatus.ARCHIVED)}` : '/tasks')).data.data,
  });
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    await queryClient.invalidateQueries({ queryKey: ['project'] });
  };
  const restoreTask = useMutation({
    mutationFn: async (task: Task) => api.patch(`/tasks/${task.id}/restore`),
    onSuccess: invalidate,
  });
  const archiveTask = useMutation({
    mutationFn: async (task: Task) => api.delete(`/tasks/${task.id}`),
    onSuccess: async (_result, task) => {
      await invalidate();
      setNotice({ message: `${task.title} ${t.archived}`, onUndo: () => restoreTask.mutate(task) });
    },
  });
  return (
    <div className="space-y-4">
      <PageHeader title={t.tasks} />
      <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">{t.tasksRole}</p>
      <ActionNoticeBar notice={notice} onClear={() => setNotice(null)} />
      <TaskCreateForm />
      <div className="flex gap-2">
        <button type="button" onClick={() => setStatusFilter('active')} className={`rounded-full px-3 py-1 text-sm ${statusFilter === 'active' ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.active}</button>
        <button type="button" onClick={() => setStatusFilter(TaskStatus.ARCHIVED)} className={`rounded-full px-3 py-1 text-sm ${statusFilter === TaskStatus.ARCHIVED ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-surface-2'}`}>{t.archived}</button>
      </div>
      <div className="space-y-2">
        {(tasks.data ?? []).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onArchive={statusFilter === 'active' ? (item) => archiveTask.mutate(item) : undefined}
            onRestore={statusFilter === TaskStatus.ARCHIVED ? (item) => restoreTask.mutate(item) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

const TaskDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const task = useQuery({
    queryKey: ['task', id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<ApiOne<Task>>(`/tasks/${id}`)).data.data,
  });
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['task', id] });
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };
  const archiveTask = useMutation({
    mutationFn: async () => api.delete(`/tasks/${id}`),
    onSuccess: invalidate,
  });
  const restoreTask = useMutation({
    mutationFn: async () => api.patch(`/tasks/${id}/restore`),
    onSuccess: invalidate,
  });

  if (!task.data) return <PageHeader title={t.taskDetail} />;

  const data = task.data;
  const detailRows = [
    { label: t.status, value: <StatusBadge status={data.status} /> },
    { label: t.priority, value: data.priority },
    { label: t.dueDate, value: data.due_date ? new Date(data.due_date).toLocaleDateString('ko-KR') : '-' },
    {
      label: t.project,
      value: data.project ? <Link to={`/projects/${data.project.id}`} className="font-semibold text-primary">{data.project.name}</Link> : t.noProject,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.title}
        action={data.status === TaskStatus.ARCHIVED ? (
          <Button variant="secondary" onClick={() => restoreTask.mutate()}>
            <RotateCcw className="h-4 w-4" />
            {t.restore}
          </Button>
        ) : (
          <ConfirmAction
            label={t.archive}
            title={t.archiveConfirmTitle}
            message={t.archiveTaskImpact}
            icon={<Archive className="h-4 w-4" />}
            onConfirm={() => archiveTask.mutate()}
          />
        )}
      />
      <section className="rounded-lg border border-border bg-background p-6">
        <div className="grid grid-cols-2 gap-4">
          {detailRows.map((row) => (
            <div key={row.label} className="rounded-lg bg-surface p-3">
              <div className="text-xs text-muted-foreground">{row.label}</div>
              <div className="mt-1 text-sm font-semibold text-heading">{row.value}</div>
            </div>
          ))}
        </div>
        {data.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{data.description}</p> : null}
      </section>
      {data.source_inbox ? (
        <section className="rounded-lg border border-border bg-background p-4">
          <h2 className="text-[18px] font-semibold text-heading">{t.sourceInbox}</h2>
          <p className="mt-2 text-sm text-foreground">{data.source_inbox.raw_content}</p>
        </section>
      ) : null}
      <section className="rounded-lg border border-border bg-background p-4">
        <h2 className="text-[18px] font-semibold text-heading">{t.relatedMeetingNotes}</h2>
        {(data.meeting_notes ?? []).length === 0 ? <div className="mt-2 text-sm text-muted-foreground">{t.empty}</div> : null}
        <div className="mt-3 space-y-2">
          {(data.meeting_notes ?? []).map((note) => (
            <Link key={note.id} to={`/projects/${note.project_id}/meeting-notes/${note.id}`} className="block rounded-lg bg-surface p-3 hover:bg-surface-2">
              <div className="text-sm font-semibold text-heading">{note.title ?? t.meetingNotes}</div>
              <div className="text-xs text-muted-foreground">{note.meeting_date ? new Date(note.meeting_date).toLocaleDateString('ko-KR') : '-'}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const TaskCreateForm = () => {
  const projects = useProjects();
  const [form, setForm] = useState<TaskForm>({ title: '', project_id: '', priority: Priority.MEDIUM, due_date: '' });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => api.post('/tasks', { ...form, project_id: form.project_id || undefined, due_date: isoOrUndefined(form.due_date) }),
    onSuccess: async () => {
      setForm({ title: '', project_id: '', priority: Priority.MEDIUM, due_date: '' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (form.title.trim()) mutation.mutate(); }} className="grid grid-cols-[1fr_180px_140px_140px_auto] gap-2">
      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t.title} />
      <Select value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })}>
        <option value="">{t.noProject}</option>
        {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </Select>
      <Select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
        {Object.values(Priority).map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
      <Button type="submit"><Plus className="h-4 w-4" />{t.create}</Button>
    </form>
  );
};

const KanbanBoard = ({ projectId, compact = false }: { projectId?: string; compact?: boolean }) => {
  const queryClient = useQueryClient();
  const queryKey = ['kanban', projectId ?? 'all'];
  const kanban = useQuery({
    queryKey,
    queryFn: async () => (await api.get<ApiOne<KanbanColumnData[]>>(`/kanban${projectId ? `?scope=project&project_id=${projectId}` : '?scope=all'}`)).data.data,
  });
  const settingsQuery = useSettings();
  const mutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => api.patch(`/tasks/${taskId}/status`, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<KanbanColumnData[]>(queryKey);
      queryClient.setQueryData<KanbanColumnData[]>(queryKey, (current) => moveTask(current, taskId, status));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  const columns = useMemo(() => kanban.data ?? taskStatuses.map((status) => ({ status, tasks: [] })), [kanban.data]);
  const defaultCompact = [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE];
  const visibleColumns = compact
    ? columns.filter((column) => (settingsQuery.data?.dashboard_visible_statuses ?? defaultCompact).includes(column.status))
    : columns;
  const onDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id);
    const status = event.over?.id as TaskStatus | undefined;
    if (status && taskStatuses.includes(status)) mutation.mutate({ taskId, status });
  };
  return (
    <section className="space-y-3">
      {!compact ? <PageHeader title={t.kanban} /> : null}
      {!compact ? (
        <section className="rounded-xl border border-border bg-background p-4">
          <h2 className="text-[18px] font-semibold text-heading">{t.kanbanRoleTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.kanbanRoleBody}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-surface px-3 py-1">{t.kanbanScopeAllHelp}</span>
            <span className="rounded-full bg-surface px-3 py-1">{t.kanbanProjectHelp}</span>
          </div>
        </section>
      ) : null}
      <DndContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          {visibleColumns.map((column) => <KanbanColumn key={column.status} column={column} compact={compact} />)}
        </div>
      </DndContext>
    </section>
  );
};

const moveTask = (columns: KanbanColumnData[] | undefined, taskId: string, status: TaskStatus) => {
  if (!columns) return columns;
  let movedTask: Task | undefined;
  const next = columns.map((column) => {
    const tasks = column.tasks.filter((task) => {
      if (task.id === taskId) {
        movedTask = { ...task, status };
        return false;
      }
      return true;
    });
    return { ...column, tasks };
  });
  return next.map((column) => column.status === status && movedTask ? { ...column, tasks: [movedTask, ...column.tasks] } : column);
};

const KanbanColumn = ({ column, compact = false }: { column: KanbanColumnData; compact?: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  return (
    <div ref={setNodeRef} className={`${compact ? 'min-h-[300px] w-[220px]' : 'min-h-[420px] w-[280px]'} shrink-0 rounded-lg bg-surface p-3 ${isOver ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-heading">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[column.status] }} />
          {column.status}
        </div>
        <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
      </div>
      <div className="space-y-2">{column.tasks.map((task) => <TaskCard key={task.id} task={task} draggable />)}</div>
    </div>
  );
};

const Placeholder = ({ title, body }: { title: string; body: string }) => (
  <div className="space-y-4">
    <PageHeader title={title} />
    <section className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-[18px] font-semibold text-heading">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{body}</p>
      <div className="mt-4 rounded-lg bg-surface p-4 text-sm text-muted-foreground">
        {t.notImplementedYet}
      </div>
    </section>
  </div>
);

const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: async () => (await api.get<ApiOne<UserSetting>>('/settings')).data.data,
});

const Settings = () => {
  const queryClient = useQueryClient();
  const settingsQuery = useSettings();
  const [template, setTemplate] = useState<string | null>(null);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [maintenanceSummary, setMaintenanceSummary] = useState<MaintenanceSummary | null>(null);
  const mutation = useMutation({
    mutationFn: async (data: Partial<UserSetting>) => api.patch('/settings', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
  const invalidateWorkspace = async () => {
    await queryClient.invalidateQueries();
  };
  const cleanupSamples = useMutation({
    mutationFn: async () => (await api.post<ApiOne<MaintenanceSummary>>('/maintenance/cleanup-sample-data')).data.data,
    onSuccess: async (summary) => {
      setMaintenanceSummary(summary);
      await invalidateWorkspace();
    },
  });
  const resetWorkspace = useMutation({
    mutationFn: async () => (await api.post<ApiOne<MaintenanceSummary>>('/maintenance/reset-workspace', { confirmation: resetConfirmation })).data.data,
    onSuccess: async (summary) => {
      setMaintenanceSummary(summary);
      setResetConfirmation('');
      await invalidateWorkspace();
    },
  });

  if (!settingsQuery.data) return <PageHeader title={t.settings} />;

  const settings = settingsQuery.data;
  const templateValue = template ?? settings.meeting_note_template ?? '';

  const toggleStatus = (status: TaskStatus) => {
    let newStatuses = [...settings.dashboard_visible_statuses];
    if (newStatuses.includes(status)) {
      if (newStatuses.length === 1) return; // Prevent unchecking all
      newStatuses = newStatuses.filter((s) => s !== status);
    } else {
      newStatuses.push(status);
    }
    mutation.mutate({ dashboard_visible_statuses: newStatuses });
  };

  const changeTheme = (theme: ThemeType) => {
    mutation.mutate({ theme });
  };

  const saveTemplate = () => {
    mutation.mutate({ meeting_note_template: templateValue });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={t.settings} />

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-[18px] font-semibold text-heading mb-4">{t.kanbanDisplaySettings}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t.kanbanDisplayDescription}</p>
        <div className="space-y-3">
          {taskStatuses.map((status) => (
            <label key={status} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={settings.dashboard_visible_statuses.includes(status)}
                onChange={() => toggleStatus(status)}
              />
              <span className="text-sm font-semibold text-heading">{status}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-[18px] font-semibold text-heading mb-4">{t.themeSettings}</h2>
        <div className="flex gap-4">
          {(['Light', 'Dark', 'System'] as ThemeType[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => changeTheme(theme)}
              className={`px-4 py-2 rounded-md border text-sm font-semibold ${settings.theme === theme ? 'border-primary text-primary bg-primary-soft' : 'border-border text-heading hover:bg-surface'}`}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-6 space-y-4">
        <h2 className="text-[18px] font-semibold text-heading mb-4">{t.meetingTemplateSettings}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t.meetingTemplateDescription}</p>
        <MeetingNoteEditor
          initialContent={templateValue}
          onChange={setTemplate}
        />
        <Button onClick={saveTemplate}>{t.save}</Button>
      </section>
      <section className="space-y-4 rounded-lg border border-border bg-background p-6">
        <h2 className="text-[18px] font-semibold text-heading">{t.dataManagement}</h2>
        <div className="rounded-lg bg-surface p-4">
          <div className="font-semibold text-heading">{t.sampleDataCleanup}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t.sampleDataCleanupDescription}</p>
          <ConfirmAction
            label={t.sampleDataCleanup}
            title={t.deleteConfirmTitle}
            message={t.sampleDataCleanupDescription}
            icon={<Trash2 className="h-4 w-4" />}
            variant="danger"
            disabled={cleanupSamples.isPending}
            onConfirm={() => cleanupSamples.mutate()}
          />
        </div>
        <div className="rounded-lg border border-danger/20 bg-background p-4">
          <div className="font-semibold text-heading">{t.resetWorkspace}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t.resetWorkspaceDescription}</p>
          <div className="mt-3 flex gap-2">
            <Input value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} placeholder={t.resetConfirmationPlaceholder} />
            <ConfirmAction
              label={t.resetWorkspace}
              title={t.resetConfirmTitle}
              message={t.resetWorkspaceDescription}
              icon={<Trash2 className="h-4 w-4" />}
              variant="danger"
              disabled={resetConfirmation !== 'RESET WORKSPACE' || resetWorkspace.isPending}
              onConfirm={() => resetWorkspace.mutate()}
            />
          </div>
        </div>
        {maintenanceSummary ? (
          <div className="rounded-lg bg-surface p-3 text-sm text-muted-foreground">
            <div className="font-semibold text-heading">{t.lastAction}</div>
            <div className="mt-1">
              Projects {maintenanceSummary.projects}, Tasks {maintenanceSummary.tasks}, Inbox {maintenanceSummary.inbox_items}, Notes {maintenanceSummary.meeting_notes}, Links {maintenanceSummary.links}, Decisions {maintenanceSummary.decisions}, Tags {maintenanceSummary.tags}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const settingsQuery = useSettings();
  const theme = settingsQuery.data?.theme;

  React.useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      root.classList.remove('light', 'dark');
      if (theme === 'System') {
        root.classList.add(media.matches ? 'dark' : 'light');
      } else {
        root.classList.add(theme.toLowerCase());
      }
    };

    applyTheme();
    if (theme === 'System') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/meeting-notes" element={<ProjectMeetingNotesPage />} />
            <Route path="/projects/:projectId/meeting-notes/:noteId" element={<ProjectMeetingNoteDetailPage />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/decisions" element={<Placeholder title={t.decisions} body={t.decisionsPageRole} />} />
            <Route path="/search" element={<Placeholder title={t.search} body={t.searchPageRole} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
