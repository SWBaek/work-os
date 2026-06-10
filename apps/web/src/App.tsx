import React, { useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Bot,
  CheckSquare,
  ChevronRight,
  Clock3,
  Download,
  Inbox as InboxIcon,
  LinkIcon,
  Mail,
  PanelTop,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { Priority, ProjectStatus, SourceType, TaskStatus } from 'shared';
import api from './lib/api';
import t from './lib/i18n/ko.json';
import { statusColors, priorityClasses, taskStatuses, toTags, isoOrUndefined } from './constants';
import { PageHeader, Button, Input, Select, Badge, StatusBadge } from './components/ui-lite';
import { MeetingNoteEditor } from './components/MeetingNoteEditor';
import { Layout } from './layout/AppLayout';

import { Project, ProjectLink, InboxItem, Task, ApiList, ApiOne, KanbanColumnData, TaskForm, ThemeType, UserSetting, MeetingNote } from './types';

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

const useProjects = () => useQuery({
  queryKey: ['projects'],
  queryFn: async () => (await api.get<ApiList<Project>>('/projects')).data.data,
});

const useProjectDetail = (projectId?: string) => useQuery({
  queryKey: ['project', projectId],
  enabled: Boolean(projectId),
  queryFn: async () => (await api.get<ApiOne<Project>>(`/projects/${projectId}`)).data.data,
});

const TaskCard = ({ task, draggable = false }: { task: Task; draggable?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, data: { status: task.status }, disabled: !draggable });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`rounded-lg border border-border border-l-4 bg-background p-3 transition-shadow hover:shadow-sm ${priorityClasses[task.priority]} ${task.status === TaskStatus.IN_PROGRESS ? 'border-l-primary' : ''} ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: statusColors[task.status] }} />
          <Link to={`/tasks/${task.id}`} className="truncate font-semibold text-heading">{task.title}</Link>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{task.priority}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {task.tags.slice(0, 3).map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}
        {task.tags.length > 3 ? <Badge>+{task.tags.length - 3}</Badge> : null}
      </div>
      <div className={`mt-2 flex justify-between text-xs ${task.overdue ? 'font-semibold text-danger' : 'text-muted-foreground'}`}>
        <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('ko-KR') : '-'}</span>
        <span className="truncate">{task.project?.name ?? 'No Project'}</span>
      </div>
      {task.source_inbox ? <div className="mt-2 text-xs text-muted-foreground">Inbox: {task.source_inbox.raw_content.slice(0, 48)}</div> : null}
    </div>
  );
};

const QuickInbox = () => {
  const projects = useProjects();
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.OTHER);
  const [rawContent, setRawContent] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tags, setTags] = useState('');
  const queryClient = useQueryClient();
  const createInbox = useMutation({
    mutationFn: async () => api.post('/inbox', { source_type: sourceType, raw_content: rawContent, project_id: projectId || undefined, tags: toTags(tags) }),
    onSuccess: async () => {
      setRawContent('');
      setTags('');
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
      await queryClient.invalidateQueries({ queryKey: ['unprocessed-count'] });
    },
  });
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (rawContent.trim()) createInbox.mutate(); }} className="grid grid-cols-[140px_1fr_180px_180px_auto] gap-2">
      <Select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
        {Object.values(SourceType).map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input value={rawContent} onChange={(event) => setRawContent(event.target.value)} placeholder={t.content} />
      <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
        <option value="">{t.general}</option>
        {(projects.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </Select>
      <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
      <Button type="submit" disabled={createInbox.isPending}><Plus className="h-4 w-4" />{t.create}</Button>
    </form>
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

const DashboardInboxTable = ({ items }: { items: InboxItem[] }) => (
  <div className="overflow-hidden px-4 pb-4">
    <div className="grid grid-cols-[32px_120px_1fr_120px_160px_90px] border-b border-border py-2 text-xs font-semibold text-heading">
      <span />
      <span>{t.source}</span>
      <span>{t.content}</span>
      <span>{t.received}</span>
      <span>{t.project}</span>
      <span>{t.priority}</span>
    </div>
    {items.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">{t.empty}</div> : null}
    {items.map((item) => (
      <div key={item.id} className="grid min-h-[48px] grid-cols-[32px_120px_1fr_120px_160px_90px] items-center border-b border-border last:border-b-0">
        <input type="checkbox" className="h-4 w-4 rounded border-border" aria-label={item.raw_content} />
        <div className="flex items-center gap-2 text-sm font-semibold text-heading">
          <SourceIcon source={item.source_type} />
          {item.source_type}
        </div>
        <Link to="/inbox" className="truncate pr-4 text-sm font-semibold text-heading hover:text-primary">{item.raw_content}</Link>
        <span className="text-sm text-muted-foreground">{t.newItem}</span>
        <span className="truncate rounded-md border border-border bg-surface px-2 py-1 text-sm text-heading">{item.project?.name ?? t.general}</span>
        <PriorityPill priority={item.converted_tasks[0]?.priority ?? Priority.MEDIUM} />
      </div>
    ))}
    <div className="pt-4 text-center">
      <Link to="/inbox" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">{t.viewAll}<ChevronRight className="h-4 w-4" /></Link>
    </div>
  </div>
);

const WorkOverview = ({ summary }: { summary?: DashboardSummary }) => {
  const items = [
    { label: t.today, sub: t.todayHelp, value: summary?.today ?? 0, color: statusColors[TaskStatus.IN_PROGRESS] },
    { label: t.overdue, sub: t.overdueHelp, value: summary?.overdue ?? 0, color: '#EF4444' }, // danger color
    { label: t.waiting, sub: t.waitingHelp, value: summary?.waiting ?? 0, color: statusColors[TaskStatus.WAITING] },
  ];
  return (
    <div className="w-[640px] shrink-0 rounded-xl border border-border bg-background px-3 py-2">
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
            <Select className="w-[120px]" value={scope} onChange={(event) => setScope(event.target.value as 'all' | 'project')}>
              <option value="all">{t.all}</option>
              <option value="project">{t.project}</option>
            </Select>
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
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold text-heading">{t.greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.dashboardSubtitle}</p>
        </div>
        <WorkOverview summary={summaryQuery.data} />
      </div>
      <QuickInbox />
      <DashboardPanel>
        <PanelTitle
          icon={<InboxIcon className="h-5 w-5 text-heading" />}
          title={t.inbox}
          count={inboxItems.length}
          action={(
            <div className="flex items-center gap-2">
              <Button variant="secondary"><Plus className="h-4 w-4" />{t.add}</Button>
              <Button variant="secondary"><SlidersHorizontal className="h-4 w-4" />{t.classify}</Button>
              <Button variant="secondary"><Clock3 className="h-4 w-4" />{t.snooze}</Button>
            </div>
          )}
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
    <form onSubmit={(event) => { event.preventDefault(); if (name.trim()) mutation.mutate(); }} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.title} />
      <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.description} />
      <Select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
        {Object.values(ProjectStatus).map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
      <Button type="submit" disabled={mutation.isPending}><Plus className="h-4 w-4" />{t.create}</Button>
    </form>
  );
};

const Projects = () => {
  const projects = useProjects();
  return (
    <div className="space-y-4">
      <PageHeader title={t.projects} />
      <ProjectForm />
      <div className="grid grid-cols-3 gap-3">
        {(projects.data ?? []).map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="rounded-lg border border-border p-4 hover:bg-surface">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-heading">{project.name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description ?? '-'}</p>
            <div className="mt-3 flex flex-wrap gap-1">{project.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
            <div className="mt-3 text-xs text-muted-foreground">{project._count?.tasks ?? 0} tasks 쨌 {project._count?.links ?? 0} links</div>
          </Link>
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

const ProjectHeaderCard = ({ project }: { project: Project }) => (
  <section className="rounded-lg border border-border p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground">{project.description ?? '-'}</p>
        <div className="mt-2 flex flex-wrap gap-1">{project.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
      </div>
      <StatusBadge status={project.status} />
    </div>
  </section>
);

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

const ProjectDetail = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const data = useProjectDetail(projectId).data;

  if (!data) return <PageHeader title={t.project} />;
  const tab = (searchParams.get('tab') as ProjectTabKey | null) ?? 'overview';

  return (
    <div className="space-y-4">
      <PageHeader title={data.name} />
      <ProjectHeaderCard project={data} />
      <ProjectTabBar projectId={data.id} activeTab={tab} />
      {tab === 'overview' ? (
        <div className="grid grid-cols-3 gap-3">
          <Metric label={t.tasks} value={data.tasks?.length ?? 0} />
          <Metric label={t.links} value={data.links?.length ?? 0} />
          <Metric label="Sub Projects" value={data.sub_projects?.length ?? 0} />
          <section className="col-span-3 rounded-lg border border-border p-4">
            <h2 className="mb-3 font-semibold text-heading">Sub Projects</h2>
            <ProjectForm parentId={data.id} />
            <div className="mt-3 flex flex-wrap gap-2">{data.sub_projects?.map((sub) => <Badge key={sub.id}>{sub.name}</Badge>)}</div>
          </section>
        </div>
      ) : null}
      {tab === 'tasks' ? <div className="space-y-2">{data.tasks?.map((task) => <TaskCard key={task.id} task={task} />)}</div> : null}
      {tab === 'kanban' ? <KanbanBoard projectId={data.id} /> : null}
      {tab === 'links' ? <ProjectLinks projectId={data.id} links={data.links ?? []} /> : null}
      {tab === 'decisions' ? <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">{t.empty}</div> : null}
    </div>
  );
};

const ProjectMeetingNotesPage = () => {
  const { projectId } = useParams();
  const data = useProjectDetail(projectId).data;
  const notes = useQuery({
    queryKey: ['meeting-notes', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => (await api.get<ApiList<MeetingNote>>(`/projects/${projectId}/meeting-notes`)).data.data,
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
      <ProjectHeaderCard project={data} />
      <ProjectTabBar projectId={data.id} activeTab="meeting-notes" />
      <section className="space-y-2">
        {(notes.data ?? []).length === 0 ? <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">{t.empty}</div> : null}
        {(notes.data ?? []).map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {note.meeting_date ? new Date(note.meeting_date).toLocaleDateString('ko-KR') : '-'}
                </div>
                <h2 className="mt-1 truncate font-semibold text-heading">{note.title ?? t.meetingNotes}</h2>
              </div>
              <Link to={`/projects/${data.id}/meeting-notes/${note.id}`} className="text-sm font-semibold text-primary">
                {t.viewAll}
              </Link>
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

const extractActionItems = (markdown: string) => {
  const matches = markdown.matchAll(/^[-*]\s+\[[ xX]\]\s+(.+)$/gm);
  return Array.from(matches, (match) => match[1].trim()).filter(Boolean);
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
    mutationFn: async (actionItemText: string) => api.post(`/meeting-notes/${noteId}/action-items/tasks`, { action_item_text: actionItemText }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['meeting-note', noteId] });
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
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
                HTML Export
              </a>
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
          placeholder="?뚯쓽濡??쒕ぉ"
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
            placeholder="참석자"
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
            <h2 className="text-[18px] font-semibold text-heading">Action Items</h2>
          </div>
          {extractActionItems(note.markdown_content).length === 0 ? <div className="text-sm text-muted-foreground">{t.empty}</div> : null}
          {extractActionItems(note.markdown_content).map((actionItem) => {
            const relatedTask = note.related_tasks.find((task) => task.title === actionItem);
            return (
              <div key={actionItem} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3">
                <span className="text-sm font-semibold text-heading">{actionItem}</span>
                {relatedTask ? (
                  <Link to={`/tasks/${relatedTask.id}`} className="text-sm font-semibold text-primary">Converted</Link>
                ) : (
                  <Button variant="secondary" onClick={() => convertActionItem.mutate(actionItem)} disabled={convertActionItem.isPending}>
                    <Plus className="h-4 w-4" />
                    Task
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
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => api.post(`/projects/${projectId}/links`, { url_or_path: url, title }),
    onSuccess: async () => {
      setUrl('');
      setTitle('');
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
  return (
    <section className="space-y-3">
      <form onSubmit={(event) => { event.preventDefault(); if (url.trim()) mutation.mutate(); }} className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.title} />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL / Path" />
        <Button type="submit"><LinkIcon className="h-4 w-4" />{t.create}</Button>
      </form>
      {links.map((link) => <div key={link.id} className="rounded-lg border border-border p-3"><a href={link.url_or_path} className="font-semibold text-heading">{link.title ?? link.url_or_path}</a><div className="text-xs text-muted-foreground">{link.type}</div></div>)}
    </section>
  );
};

const InboxList = ({ items, compact = false }: { items: InboxItem[]; compact?: boolean }) => (
  <div className="space-y-2">
    {items.length === 0 ? <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">{t.empty}</div> : null}
    {items.map((item) => (
      <div key={item.id} className="rounded-lg border border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-semibold text-heading">{item.raw_content}</p>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">{item.tags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}</div>
        {!compact ? <ConvertInboxForm item={item} /> : null}
        {item.converted_tasks.length > 0 ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {item.converted_tasks.every((task) => task.title === item.raw_content)
              ? `${t.convertedToTask} (${item.converted_tasks.length})`
              : item.converted_tasks.map((task) => task.title).join(', ')}
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
  const queryClient = useQueryClient();
  const inbox = useQuery({ queryKey: ['inbox'], queryFn: async () => (await api.get<ApiList<InboxItem>>('/inbox')).data.data });
  const createInbox = useMutation({
    mutationFn: async () => api.post('/inbox', { source_type: sourceType, raw_content: rawContent, tags: toTags(tags) }),
    onSuccess: async () => {
      setRawContent('');
      setTags('');
      await queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });
  return (
    <div className="space-y-4">
      <PageHeader title={t.inbox} />
      <form onSubmit={(event) => { event.preventDefault(); if (rawContent.trim()) createInbox.mutate(); }} className="grid grid-cols-[140px_1fr_180px_auto] gap-2">
        <Select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
          {Object.values(SourceType).map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
        <Input value={rawContent} onChange={(event) => setRawContent(event.target.value)} placeholder={t.content} />
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tags} />
        <Button type="submit"><Plus className="h-4 w-4" />{t.create}</Button>
      </form>
      <InboxList items={inbox.data ?? []} />
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
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
    },
  });
  return (
    <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="mt-3 grid grid-cols-[1fr_160px_120px_120px_140px_auto] gap-2">
      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t.taskTitleOptional} />
      <Select value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })}>
        <option value="">No Project</option>
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
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: async () => (await api.get<ApiList<Task>>('/tasks')).data.data });
  return (
    <div className="space-y-4">
      <PageHeader title={t.tasks} />
      <TaskCreateForm />
      <div className="space-y-2">{(tasks.data ?? []).map((task) => <TaskCard key={task.id} task={task} />)}</div>
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
        <option value="">No Project</option>
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

const Placeholder = ({ title }: { title: string }) => (
  <div className="space-y-4">
    <PageHeader title={title} />
    <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">{t.empty}</div>
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
  const mutation = useMutation({
    mutationFn: async (data: Partial<UserSetting>) => api.patch('/settings', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      await queryClient.invalidateQueries({ queryKey: ['kanban'] });
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
        <h2 className="text-[18px] font-semibold text-heading mb-4">Kanban ?쒖떆 ?ㅼ젙</h2>
        <p className="text-sm text-muted-foreground mb-4">Dashboard??Kanban 蹂대뱶???쒖떆??而щ읆???좏깮?⑸땲?? 理쒖냼 1媛??댁긽 ?좏깮?댁빞 ?⑸땲??</p>
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
        <h2 className="text-[18px] font-semibold text-heading mb-4">?뚮쭏 ?ㅼ젙</h2>
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
        <h2 className="text-[18px] font-semibold text-heading mb-4">?뚯쓽濡??쒗뵆由??ㅼ젙</h2>
        <p className="text-sm text-muted-foreground mb-4">???뚯쓽濡??묒꽦 ??湲곕낯?쇰줈 梨꾩썙吏?HTML/Markdown 肄섑뀗痢좊? ?ㅼ젙?⑸땲??</p>
        <MeetingNoteEditor
          initialContent={templateValue}
          onChange={setTemplate}
        />
        <Button onClick={saveTemplate}>{t.save}</Button>
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

    root.classList.remove('light', 'dark');
    if (theme === 'System') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme.toLowerCase());
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
            <Route path="/tasks/:id" element={<Tasks />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/decisions" element={<Placeholder title={t.decisions} />} />
            <Route path="/search" element={<Placeholder title={t.search} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
