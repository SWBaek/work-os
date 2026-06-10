import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { InboxStatus, LinkType, Priority, ProjectStatus, SourceType, TaskStatus } from 'shared';
import {
  ConvertInboxItemSchema,
  ConvertMeetingActionItemSchema,
  CreateInboxItemSchema,
  CreateProjectLinkSchema,
  CreateProjectSchema,
  CreateTaskSchema,
  PatchInboxItemSchema,
  UpdateProjectLinkSchema,
  UpdateProjectSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  ProjectListQuerySchema,
  InboxListQuerySchema,
  TaskListQuerySchema,
  KanbanQuerySchema,
  CreateMeetingNoteSchema,
  UpdateMeetingNoteSchema,
} from 'shared';
import { recordAudit } from '../services/audit';
import { connectOrCreateTags, setTags, tagInclude } from '../services/tags';
import { applyTaskStatus, createTaskTimestamps, kanbanStatuses, terminalStatuses } from '../services/task-status';
import { asyncHandler, HttpError, nullableDate, parseBody, parsePositiveInt, parseQuery } from '../utils/http';
import prisma from '../utils/prisma';

const router = Router();

const taskInclude = {
  project: { select: { id: true, name: true } },
  source_inbox: { select: { id: true, raw_content: true } },
  tags: tagInclude,
};

const projectInclude = {
  tags: tagInclude,
  sub_projects: { select: { id: true, name: true, status: true } },
  _count: { select: { tasks: true, links: true, inbox_items: true } },
};

const inboxInclude = {
  project: { select: { id: true, name: true } },
  tags: tagInclude,
  converted_tasks: { select: { id: true, title: true, status: true, priority: true } },
};

const routeParam = (value: string | string[] | undefined, name: string): string => {
  if (!value || Array.isArray(value)) {
    throw new HttpError(400, 'MISSING_ROUTE_PARAM', `Missing route parameter: ${name}`);
  }
  return value;
};

const createProjectTagData = (tags?: string[]) => ({ connectOrCreate: connectOrCreateTags(tags) });
const updateTagData = async (tags?: string[]) => {
  const connect = await setTags(tags);
  return connect === undefined ? undefined : { set: connect };
};

const validateProjectParent = async (projectId?: string | null, parentProjectId?: string | null) => {
  if (!parentProjectId) return;
  const parent = await prisma.project.findUnique({ where: { id: parentProjectId } });
  if (!parent) {
    throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Parent project not found');
  }
  if (parent.parent_project_id) {
    throw new HttpError(400, 'INVALID_SUB_PROJECT', 'Only one sub-project level is allowed');
  }
  if (projectId && projectId === parentProjectId) {
    throw new HttpError(400, 'INVALID_SUB_PROJECT', 'A project cannot be its own parent');
  }
  if (projectId) {
    const hasChildren = await prisma.project.findFirst({ where: { parent_project_id: projectId } });
    if (hasChildren) {
      throw new HttpError(400, 'INVALID_SUB_PROJECT', 'A parent project cannot be a sub-project');
    }
  }
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const renderInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

const renderMarkdown = (markdown: string) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = /^[-*]\s+(\[[ xX]\]\s+)?(.+)$/.exec(trimmed);
    if (listItem) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      const checked = listItem[1]?.toLowerCase().includes('x') ?? false;
      const checkbox = listItem[1] ? `<input type="checkbox" disabled${checked ? ' checked' : ''}> ` : '';
      html.push(`<li>${checkbox}${renderInlineMarkdown(listItem[2])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return html.join('\n');
};

const renderMeetingNoteExport = (note: { title: string | null; meeting_date: Date | null; attendees: string | null; markdown_content: string }) => {
  const body = renderMarkdown(note.markdown_content);
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${escapeHtml(note.title ?? 'Meeting Note')}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#262626;background:#fff;line-height:1.6;margin:40px auto;max-width:840px;padding:0 24px}
h1{font-size:28px;line-height:1.3;margin:0 0 8px}h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin-top:24px}
.meta{color:#6B6B6B;font-size:13px;margin-bottom:32px}code{background:#F5F5F5;border-radius:6px;padding:2px 5px}
ul{padding-left:22px}li{margin:6px 0}input{margin-right:8px}
</style>
</head>
<body>
<h1>${escapeHtml(note.title ?? 'Meeting Note')}</h1>
<div class="meta">${note.meeting_date ? escapeHtml(note.meeting_date.toISOString().slice(0, 10)) : '-'}${note.attendees ? ` · ${escapeHtml(note.attendees)}` : ''}</div>
${body}
</body>
</html>`;
};

const parseDashboardStatuses = (value: string): TaskStatus[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE];
    const valid = parsed.filter((status): status is TaskStatus => Object.values(TaskStatus).includes(status as TaskStatus));
    return valid.length > 0 ? valid : [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE];
  } catch {
    return [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE];
  }
};

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/dashboard/summary', asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const activeStatuses = { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED, TaskStatus.CANCELED] };

  const [today, overdue, waiting, todayTasks, overdueTasks, waitingTasks] = await Promise.all([
    prisma.task.count({ where: { status: activeStatuses, due_date: { gte: startOfToday, lt: startOfTomorrow } } }),
    prisma.task.count({ where: { status: activeStatuses, due_date: { lt: startOfToday } } }),
    prisma.task.count({ where: { status: TaskStatus.WAITING } }),
    prisma.task.findMany({
      where: { status: activeStatuses, due_date: { gte: startOfToday, lt: startOfTomorrow } },
      include: taskInclude,
      orderBy: [{ due_date: 'asc' }, { updated_at: 'desc' }],
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: activeStatuses, due_date: { lt: startOfToday } },
      include: taskInclude,
      orderBy: [{ due_date: 'asc' }, { updated_at: 'desc' }],
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: TaskStatus.WAITING },
      include: taskInclude,
      orderBy: [{ due_date: 'asc' }, { updated_at: 'desc' }],
      take: 5,
    }),
  ]);
  res.json({ data: { today, overdue, waiting, lists: { today: todayTasks, overdue: overdueTasks, waiting: waitingTasks } } });
}));

router.get('/projects', asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 50);
  const query = parseQuery(ProjectListQuerySchema, req.query);

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.tag ? { tags: { some: { name: query.tag } } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updated_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  res.json({ data, total, page });
}));

router.post('/projects', asyncHandler(async (req, res) => {
  const body = parseBody(CreateProjectSchema, req.body);
  await validateProjectParent(null, body.parent_project_id);

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      parent_project_id: body.parent_project_id,
      status: body.status as ProjectStatus,
      tags: createProjectTagData(body.tags),
    },
    include: projectInclude,
  });
  await recordAudit('Project', project.id, 'Create', body);
  res.status(201).json({ data: project });
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: routeParam(req.params.id, 'id') },
    include: {
      ...projectInclude,
      links: { include: { tags: tagInclude }, orderBy: { updated_at: 'desc' } },
      tasks: { include: taskInclude, orderBy: { updated_at: 'desc' } },
      meeting_notes: { select: { id: true, title: true, meeting_date: true }, orderBy: { meeting_date: 'desc' }, take: 3 },
      decisions: { select: { id: true, title: true, content: true, decision_date: true }, orderBy: { decision_date: 'desc' }, take: 3 },
    },
  });
  if (!project) {
    throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found');
  }
  res.json({ data: project });
}));

router.patch('/projects/:id', asyncHandler(async (req, res) => {
  const body = parseBody(UpdateProjectSchema, req.body);
  const id = routeParam(req.params.id, 'id');
  if (body.parent_project_id !== undefined) {
    await validateProjectParent(id, body.parent_project_id);
  }
  const tags = await updateTagData(body.tags);
  const project = await prisma.project.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      parent_project_id: body.parent_project_id,
      status: body.status,
      ...(tags ? { tags } : {}),
    },
    include: projectInclude,
  });
  await recordAudit('Project', project.id, 'Update', body);
  res.json({ data: project });
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const project = await prisma.project.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: { status: ProjectStatus.ARCHIVED },
    include: projectInclude,
  });
  await recordAudit('Project', project.id, 'Delete', { status: ProjectStatus.ARCHIVED });
  res.json({ data: project });
}));

router.get('/projects/:id/links', asyncHandler(async (req, res) => {
  const links = await prisma.projectLink.findMany({
    where: { project_id: routeParam(req.params.id, 'id') },
    include: { tags: tagInclude },
    orderBy: { updated_at: 'desc' },
  });
  res.json({ data: links, total: links.length, page: 1 });
}));

router.post('/projects/:id/links', asyncHandler(async (req, res) => {
  const body = parseBody(CreateProjectLinkSchema.omit({ project_id: true }), req.body);
  const link = await prisma.projectLink.create({
    data: {
      project_id: routeParam(req.params.id, 'id'),
      title: body.title,
      url_or_path: body.url_or_path,
      type: body.type ?? LinkType.OTHER,
      description: body.description,
      tags: createProjectTagData(body.tags),
    },
    include: { tags: tagInclude },
  });
  await recordAudit('ProjectLink', link.id, 'Create', { ...body, project_id: routeParam(req.params.id, 'id') });
  res.status(201).json({ data: link });
}));

router.patch('/project-links/:id', asyncHandler(async (req, res) => {
  const body = parseBody(UpdateProjectLinkSchema.omit({ project_id: true }), req.body);
  const tags = await updateTagData(body.tags);
  const link = await prisma.projectLink.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: {
      title: body.title,
      url_or_path: body.url_or_path,
      type: body.type,
      description: body.description,
      ...(tags ? { tags } : {}),
    },
    include: { tags: tagInclude },
  });
  await recordAudit('ProjectLink', link.id, 'Update', body);
  res.json({ data: link });
}));

router.delete('/project-links/:id', asyncHandler(async (req, res) => {
  const link = await prisma.projectLink.delete({ where: { id: routeParam(req.params.id, 'id') } });
  await recordAudit('ProjectLink', link.id, 'Delete', {});
  res.json({ data: link });
}));

router.get('/inbox', asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 50);
  const query = parseQuery(InboxListQuerySchema, req.query);
  const where = {
    ...(query.project_id ? { project_id: query.project_id } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.tag ? { tags: { some: { name: query.tag } } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.inboxItem.findMany({
      where,
      include: inboxInclude,
      orderBy: { captured_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inboxItem.count({ where }),
  ]);
  res.json({ data, total, page });
}));

router.get('/inbox/unprocessed-count', asyncHandler(async (_req, res) => {
  const total = await prisma.inboxItem.count({ where: { status: InboxStatus.UNPROCESSED } });
  res.json({ data: { total } });
}));

router.post('/inbox', asyncHandler(async (req, res) => {
  const body = parseBody(CreateInboxItemSchema, req.body);
  const item = await prisma.inboxItem.create({
    data: {
      source_type: body.source_type ?? SourceType.OTHER,
      source_detail: body.source_detail,
      raw_content: body.raw_content,
      project_id: body.project_id,
      due_date: nullableDate(body.due_date),
      status: InboxStatus.UNPROCESSED,
      tags: createProjectTagData(body.tags),
    },
    include: inboxInclude,
  });
  await recordAudit('InboxItem', item.id, 'Create', body);
  res.status(201).json({ data: item });
}));

router.patch('/inbox/:id', asyncHandler(async (req, res) => {
  const body = parseBody(PatchInboxItemSchema, req.body);
  const tags = await updateTagData(body.tags);
  const item = await prisma.inboxItem.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: {
      source_type: body.source_type,
      source_detail: body.source_detail,
      raw_content: body.raw_content,
      project_id: body.project_id,
      due_date: nullableDate(body.due_date),
      status: body.status,
      ...(tags ? { tags } : {}),
    },
    include: inboxInclude,
  });
  await recordAudit('InboxItem', item.id, 'Update', body);
  res.json({ data: item });
}));

router.delete('/inbox/:id', asyncHandler(async (req, res) => {
  const item = await prisma.inboxItem.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: { status: InboxStatus.ARCHIVED },
    include: inboxInclude,
  });
  await recordAudit('InboxItem', item.id, 'Delete', { status: InboxStatus.ARCHIVED });
  res.json({ data: item });
}));

router.post('/inbox/:id/convert', asyncHandler(async (req, res) => {
  const body = parseBody(ConvertInboxItemSchema, req.body);
  const inbox = await prisma.inboxItem.findUnique({ where: { id: routeParam(req.params.id, 'id') } });
  if (!inbox) {
    throw new HttpError(404, 'INBOX_NOT_FOUND', 'Inbox item not found');
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.copy_description ? inbox.raw_content : undefined,
      project_id: body.project_id ?? inbox.project_id,
      sub_project_id: body.sub_project_id,
      source_inbox_id: inbox.id,
      status: TaskStatus.OPEN,
      priority: body.priority ?? Priority.MEDIUM,
      due_date: nullableDate(body.due_date),
      ...createTaskTimestamps(TaskStatus.OPEN),
      tags: createProjectTagData(body.tags),
    },
    include: taskInclude,
  });
  const updatedInbox = await prisma.inboxItem.update({
    where: { id: inbox.id },
    data: { status: InboxStatus.CONVERTED },
    include: inboxInclude,
  });
  await recordAudit('Task', task.id, 'Create', { source_inbox_id: inbox.id });
  await recordAudit('InboxItem', inbox.id, 'Update', { status: InboxStatus.CONVERTED });
  res.status(201).json({ data: { task, inbox: updatedInbox } });
}));

router.get('/tasks', asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 50);
  const query = parseQuery(TaskListQuerySchema, req.query);
  const today = new Date();
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const where = {
    ...(query.project_id ? { project_id: query.project_id } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.dashboard === 'today' ? { due_date: { gte: startOfToday, lte: endOfToday }, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED, TaskStatus.CANCELED] } } : {}),
    ...(query.dashboard === 'overdue' ? { due_date: { lt: startOfToday }, status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED, TaskStatus.CANCELED] } } : {}),
    ...(query.dashboard === 'waiting' ? { status: TaskStatus.WAITING } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ due_date: 'asc' }, { updated_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);
  res.json({ data, total, page });
}));

router.post('/tasks', asyncHandler(async (req, res) => {
  const body = parseBody(CreateTaskSchema, req.body);
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      project_id: body.project_id,
      sub_project_id: body.sub_project_id,
      source_inbox_id: body.source_inbox_id,
      status: body.status as TaskStatus,
      priority: body.priority ?? Priority.MEDIUM,
      due_date: nullableDate(body.due_date),
      ...createTaskTimestamps(body.status as TaskStatus),
      tags: createProjectTagData(body.tags),
    },
    include: taskInclude,
  });
  await recordAudit('Task', task.id, 'Create', body);
  res.status(201).json({ data: task });
}));

router.get('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: routeParam(req.params.id, 'id') }, include: taskInclude });
  if (!task) {
    throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  }
  res.json({ data: task });
}));

router.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const body = parseBody(UpdateTaskSchema, req.body);
  const existing = await prisma.task.findUnique({ where: { id: routeParam(req.params.id, 'id') } });
  if (!existing) {
    throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  }
  const tags = await updateTagData(body.tags);
  const statusData = body.status ? applyTaskStatus(existing.status, body.status as TaskStatus) : {};
  const task = await prisma.task.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: {
      title: body.title,
      description: body.description,
      project_id: body.project_id,
      sub_project_id: body.sub_project_id,
      source_inbox_id: body.source_inbox_id,
      priority: body.priority,
      due_date: nullableDate(body.due_date),
      ...statusData,
      ...(tags ? { tags } : {}),
    },
    include: taskInclude,
  });
  await recordAudit('Task', task.id, 'Update', body);
  res.json({ data: task });
}));

router.patch('/tasks/:id/status', asyncHandler(async (req, res) => {
  const body = parseBody(UpdateTaskStatusSchema, req.body);
  const existing = await prisma.task.findUnique({ where: { id: routeParam(req.params.id, 'id') } });
  if (!existing) {
    throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found');
  }
  const task = await prisma.task.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: applyTaskStatus(existing.status, body.status as TaskStatus),
    include: taskInclude,
  });
  await recordAudit('Task', task.id, 'Update', { status: body.status });
  res.json({ data: task });
}));

router.delete('/tasks/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: applyTaskStatus(TaskStatus.OPEN, TaskStatus.ARCHIVED),
    include: taskInclude,
  });
  await recordAudit('Task', task.id, 'Delete', { status: TaskStatus.ARCHIVED });
  res.json({ data: task });
}));

router.get('/kanban', asyncHandler(async (req, res) => {
  const query = parseQuery(KanbanQuerySchema, req.query);
  const where = {
    ...(query.scope === 'project' && query.project_id ? { project_id: query.project_id } : {}),
    ...(query.scope === 'sub_project' && query.sub_project_id ? { sub_project_id: query.sub_project_id } : {}),
  };
  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { due_date: 'asc' }, { updated_at: 'desc' }],
  });
  const data = kanbanStatuses.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status).map((task) => ({
      ...task,
      overdue: task.due_date ? task.due_date < new Date() && !terminalStatuses.includes(task.status as TaskStatus) : false,
    })),
  }));
  res.json({ data });
}));

router.get('/settings', asyncHandler(async (_req, res) => {
  let settings = await prisma.userSetting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.userSetting.create({
      data: {
        id: 1,
        dashboard_visible_statuses: JSON.stringify([TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE]),
        default_kanban_view: 'All',
        theme: 'System',
      }
    });
  }
  res.json({
    data: {
      ...settings,
      dashboard_visible_statuses: parseDashboardStatuses(settings.dashboard_visible_statuses)
    }
  });
}));

router.patch('/settings', asyncHandler(async (req, res) => {
  const { UpdateUserSettingSchema } = await import('shared');
  const body = parseBody(UpdateUserSettingSchema, req.body);

  let existing = await prisma.userSetting.findUnique({ where: { id: 1 } });
  if (!existing) {
    existing = await prisma.userSetting.create({
      data: {
        id: 1,
        dashboard_visible_statuses: JSON.stringify([TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.DONE]),
        default_kanban_view: 'All',
        theme: 'System',
      },
    });
  }

  const updateData: Prisma.UserSettingUpdateInput = {
    default_kanban_view: body.default_kanban_view,
    default_project_filter: body.default_project_filter,
    theme: body.theme,
    meeting_note_template: body.meeting_note_template,
  };
  if (body.dashboard_visible_statuses) {
    updateData.dashboard_visible_statuses = JSON.stringify(body.dashboard_visible_statuses);
  }

  const settings = await prisma.userSetting.update({
    where: { id: 1 },
    data: updateData
  });

  res.json({
    data: {
      ...settings,
      dashboard_visible_statuses: parseDashboardStatuses(settings.dashboard_visible_statuses)
    }
  });
}));

router.get('/projects/:id/meeting-notes', asyncHandler(async (req, res) => {
  const notes = await prisma.meetingNote.findMany({
    where: { project_id: routeParam(req.params.id, 'id') },
    include: { tags: tagInclude },
    orderBy: { meeting_date: 'desc' },
  });
  res.json({ data: notes, total: notes.length, page: 1 });
}));

router.post('/projects/:id/meeting-notes', asyncHandler(async (req, res) => {
  const body = parseBody(CreateMeetingNoteSchema.omit({ project_id: true }), req.body);
  const projectId = routeParam(req.params.id, 'id');
  const note = await prisma.meetingNote.create({
    data: {
      project_id: projectId,
      title: body.title,
      meeting_date: nullableDate(body.meeting_date),
      attendees: body.attendees,
      markdown_content: body.markdown_content,
      tags: createProjectTagData(body.tags),
    },
    include: { tags: tagInclude },
  });
  await recordAudit('MeetingNote', note.id, 'Create', { project_id: projectId, ...body });
  res.status(201).json({ data: note });
}));

router.get('/meeting-notes/:id', asyncHandler(async (req, res) => {
  const note = await prisma.meetingNote.findUnique({
    where: { id: routeParam(req.params.id, 'id') },
    include: {
      tags: tagInclude,
      related_tasks: { include: taskInclude },
      decisions: true,
    },
  });
  if (!note) {
    throw new HttpError(404, 'MEETING_NOTE_NOT_FOUND', 'Meeting note not found');
  }
  res.json({ data: note });
}));

router.get('/meeting-notes/:id/export.html', asyncHandler(async (req, res) => {
  const note = await prisma.meetingNote.findUnique({
    where: { id: routeParam(req.params.id, 'id') },
  });
  if (!note) {
    throw new HttpError(404, 'MEETING_NOTE_NOT_FOUND', 'Meeting note not found');
  }

  const html = renderMeetingNoteExport(note);
  await prisma.meetingNote.update({
    where: { id: note.id },
    data: { html_content: html },
  });

  const filename = `${(note.title ?? 'meeting-note').replace(/[^a-z0-9\uAC00-\uD7A3-]+/gi, '-').replace(/^-|-$/g, '') || 'meeting-note'}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.send(html);
}));

router.post('/meeting-notes/:id/action-items/tasks', asyncHandler(async (req, res) => {
  const body = parseBody(ConvertMeetingActionItemSchema, req.body);
  const note = await prisma.meetingNote.findUnique({ where: { id: routeParam(req.params.id, 'id') } });
  if (!note) {
    throw new HttpError(404, 'MEETING_NOTE_NOT_FOUND', 'Meeting note not found');
  }

  const task = await prisma.task.create({
    data: {
      title: body.action_item_text,
      description: `Created from meeting note: ${note.title ?? note.id}`,
      project_id: body.project_id ?? note.project_id,
      status: TaskStatus.OPEN,
      priority: body.priority ?? Priority.MEDIUM,
      due_date: nullableDate(body.due_date),
      ...createTaskTimestamps(TaskStatus.OPEN),
      tags: createProjectTagData(body.tags),
      meeting_notes: { connect: { id: note.id } },
    },
    include: taskInclude,
  });

  await recordAudit('Task', task.id, 'Create', { meeting_note_id: note.id, action_item_text: body.action_item_text });
  res.status(201).json({ data: task });
}));

router.patch('/meeting-notes/:id', asyncHandler(async (req, res) => {
  const body = parseBody(UpdateMeetingNoteSchema.omit({ project_id: true }), req.body);
  const tags = await updateTagData(body.tags);
  const note = await prisma.meetingNote.update({
    where: { id: routeParam(req.params.id, 'id') },
    data: {
      title: body.title,
      meeting_date: nullableDate(body.meeting_date),
      attendees: body.attendees,
      markdown_content: body.markdown_content,
      ...(tags ? { tags } : {}),
    },
    include: { tags: tagInclude },
  });
  await recordAudit('MeetingNote', note.id, 'Update', body);
  res.json({ data: note });
}));

router.delete('/meeting-notes/:id', asyncHandler(async (req, res) => {
  const note = await prisma.meetingNote.delete({
    where: { id: routeParam(req.params.id, 'id') },
  });
  await recordAudit('MeetingNote', note.id, 'Delete', {});
  res.json({ data: note });
}));

export default router;
