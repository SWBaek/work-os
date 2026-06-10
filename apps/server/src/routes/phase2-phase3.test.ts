import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Priority, ProjectStatus, TaskStatus } from 'shared';
import app from '../server';
import prisma from '../utils/prisma';

const created = {
  projects: [] as string[],
  tasks: [] as string[],
  notes: [] as string[],
};

let originalSettings:
  | {
      dashboard_visible_statuses: string;
      default_kanban_view: string;
      default_project_filter: string | null;
      theme: string;
      meeting_note_template: string | null;
    }
  | null = null;

const isoDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
};

describe('Phase 2 dashboard and settings API', () => {
  beforeAll(async () => {
    originalSettings = await prisma.userSetting.findUnique({
      where: { id: 1 },
      select: {
        dashboard_visible_statuses: true,
        default_kanban_view: true,
        default_project_filter: true,
        theme: true,
        meeting_note_template: true,
      },
    });
  });

  it('returns today, overdue, and waiting task lists with counts', async () => {
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `Phase 2 Dashboard ${Date.now()}`, status: ProjectStatus.ACTIVE })
      .expect(201);
    const projectId = projectResponse.body.data.id as string;
    created.projects.push(projectId);

    const today = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Dashboard today task', project_id: projectId, due_date: isoDate(0), status: TaskStatus.OPEN })
      .expect(201);
    const overdue = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Dashboard overdue task', project_id: projectId, due_date: isoDate(-1), status: TaskStatus.OPEN })
      .expect(201);
    const waiting = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Dashboard waiting task', project_id: projectId, status: TaskStatus.WAITING })
      .expect(201);
    created.tasks.push(today.body.data.id as string, overdue.body.data.id as string, waiting.body.data.id as string);

    const summary = await request(app).get('/api/v1/dashboard/summary').expect(200);
    expect(summary.body.data.today).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.overdue).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.waiting).toBeGreaterThanOrEqual(1);
    expect(summary.body.data.lists.today.some((task: { id: string }) => task.id === today.body.data.id)).toBe(true);
    expect(summary.body.data.lists.overdue.some((task: { id: string }) => task.id === overdue.body.data.id)).toBe(true);
    expect(summary.body.data.lists.waiting.some((task: { id: string }) => task.id === waiting.body.data.id)).toBe(true);

    const overdueList = await request(app).get('/api/v1/tasks?dashboard=overdue').expect(200);
    expect(overdueList.body.data.some((task: { id: string }) => task.id === overdue.body.data.id)).toBe(true);
  });

  it('validates dashboard visible statuses and supports first PATCH', async () => {
    await prisma.userSetting.delete({ where: { id: 1 } }).catch(() => undefined);

    const createdSettings = await request(app)
      .patch('/api/v1/settings')
      .send({ dashboard_visible_statuses: [TaskStatus.OPEN, TaskStatus.DONE] })
      .expect(200);
    expect(createdSettings.body.data.dashboard_visible_statuses).toEqual([TaskStatus.OPEN, TaskStatus.DONE]);

    await request(app)
      .patch('/api/v1/settings')
      .send({ dashboard_visible_statuses: [] })
      .expect(400);

    await request(app)
      .patch('/api/v1/settings')
      .send({ dashboard_visible_statuses: ['Bad Status'] })
      .expect(400);
  });
});

describe('Phase 3 meeting note API', () => {
  it('exports sanitized HTML and converts action items into related tasks', async () => {
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `Phase 3 Meeting ${Date.now()}`, status: ProjectStatus.ACTIVE })
      .expect(201);
    const projectId = projectResponse.body.data.id as string;
    created.projects.push(projectId);

    const noteResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/meeting-notes`)
      .send({
        title: 'Weekly sync',
        markdown_content: [
          '# Agenda',
          '<script>alert(1)</script>',
          '> Quote this decision',
          '',
          '- Parent item',
          '  - Nested item',
          '',
          '| Topic | Owner |',
          '| --- | --- |',
          '| Export | Min |',
          '',
          '[Spec](https://example.com/spec)',
          '',
          '```ts',
          'const ready = true;',
          '```',
          '',
          '- [ ] Send summary',
        ].join('\n'),
      })
      .expect(201);
    const noteId = noteResponse.body.data.id as string;
    created.notes.push(noteId);

    const exported = await request(app).get(`/api/v1/meeting-notes/${noteId}/export.html`).expect(200);
    expect(exported.text).toContain('<h1>Agenda</h1>');
    expect(exported.text).not.toContain('<script>');
    expect(exported.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(exported.text).toContain('<blockquote>');
    expect(exported.text).toContain('<table>');
    expect(exported.text).toContain('<a href="https://example.com/spec">Spec</a>');
    expect(exported.text).toContain('<pre><code class="language-ts">const ready = true;');
    expect(exported.text).toContain('<ul>');

    const actionItemKey = `${noteId}:0:send-summary`;
    const taskResponse = await request(app)
      .post(`/api/v1/meeting-notes/${noteId}/action-items/tasks`)
      .send({ action_item_text: 'Send summary', action_item_key: actionItemKey, priority: Priority.HIGH })
      .expect(201);
    const taskId = taskResponse.body.data.id as string;
    created.tasks.push(taskId);
    expect(taskResponse.body.data.title).toBe('Send summary');
    expect(taskResponse.body.data.source_action_key).toBe(actionItemKey);

    const duplicateResponse = await request(app)
      .post(`/api/v1/meeting-notes/${noteId}/action-items/tasks`)
      .send({ action_item_text: 'Send summary changed title should not matter', action_item_key: actionItemKey, priority: Priority.HIGH })
      .expect(200);
    expect(duplicateResponse.body.data.id).toBe(taskId);

    const noteDetail = await request(app).get(`/api/v1/meeting-notes/${noteId}`).expect(200);
    expect(noteDetail.body.data.related_tasks.some((task: { id: string }) => task.id === taskId)).toBe(true);
  });
});

afterAll(async () => {
  if (originalSettings) {
    await prisma.userSetting.upsert({
      where: { id: 1 },
      update: originalSettings,
      create: { id: 1, ...originalSettings },
    });
  } else {
    await prisma.userSetting.delete({ where: { id: 1 } }).catch(() => undefined);
  }

  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entity_id: { in: created.projects } },
        { entity_id: { in: created.tasks } },
        { entity_id: { in: created.notes } },
      ],
    },
  });
  await prisma.task.deleteMany({ where: { id: { in: created.tasks } } });
  await prisma.meetingNote.deleteMany({ where: { id: { in: created.notes } } });
  await prisma.project.deleteMany({ where: { id: { in: created.projects } } });
});
