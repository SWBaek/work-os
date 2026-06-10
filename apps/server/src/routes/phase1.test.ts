import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { InboxStatus, Priority, ProjectStatus, SourceType, TaskStatus } from 'shared';
import app from '../server';
import prisma from '../utils/prisma';

const created = {
  projects: [] as string[],
  inbox: [] as string[],
  tasks: [] as string[],
  links: [] as string[],
};

describe('Phase 1 core workflow API', () => {
  it('supports project, inbox, task conversion, kanban, status changes, and audit logs', async () => {
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `Phase 1 Test ${Date.now()}`, description: 'integration test', status: ProjectStatus.ACTIVE, tags: ['phase1'] })
      .expect(201);
    const projectId = projectResponse.body.data.id as string;
    created.projects.push(projectId);
    expect(projectResponse.body.data.tags[0].name).toBe('phase1');

    const subProjectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `Phase 1 Sub ${Date.now()}`, parent_project_id: projectId })
      .expect(201);
    created.projects.push(subProjectResponse.body.data.id as string);

    const linkResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/links`)
      .send({ title: 'Spec', url_or_path: 'D:/spec.md', type: 'LocalFile' })
      .expect(201);
    created.links.push(linkResponse.body.data.id as string);

    const inboxResponse = await request(app)
      .post('/api/v1/inbox')
      .send({ source_type: SourceType.TEAMS, raw_content: 'Convert this inbox item', project_id: projectId })
      .expect(201);
    const inboxId = inboxResponse.body.data.id as string;
    created.inbox.push(inboxId);
    expect(inboxResponse.body.data.status).toBe(InboxStatus.UNPROCESSED);

    const firstConvert = await request(app)
      .post(`/api/v1/inbox/${inboxId}/convert`)
      .send({ title: 'Converted task 1', project_id: projectId, priority: Priority.HIGH })
      .expect(201);
    created.tasks.push(firstConvert.body.data.task.id as string);
    expect(firstConvert.body.data.inbox.status).toBe(InboxStatus.CONVERTED);
    expect(firstConvert.body.data.task.source_inbox.id).toBe(inboxId);

    const secondConvert = await request(app)
      .post(`/api/v1/inbox/${inboxId}/convert`)
      .send({ title: 'Converted task 2', project_id: projectId, priority: Priority.MEDIUM })
      .expect(201);
    created.tasks.push(secondConvert.body.data.task.id as string);

    const directTask = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Direct task', project_id: projectId, priority: Priority.CRITICAL })
      .expect(201);
    const directTaskId = directTask.body.data.id as string;
    created.tasks.push(directTaskId);
    expect(directTask.body.data.source_inbox).toBeNull();

    const kanban = await request(app).get(`/api/v1/kanban?scope=project&project_id=${projectId}`).expect(200);
    const openColumn = kanban.body.data.find((column: { status: string }) => column.status === TaskStatus.OPEN);
    expect(openColumn.tasks.length).toBeGreaterThanOrEqual(3);

    const moved = await request(app)
      .patch(`/api/v1/tasks/${directTaskId}/status`)
      .send({ status: TaskStatus.IN_PROGRESS })
      .expect(200);
    expect(moved.body.data.status).toBe(TaskStatus.IN_PROGRESS);

    await request(app)
      .patch(`/api/v1/tasks/${directTaskId}/status`)
      .send({ status: TaskStatus.CANCELED })
      .expect(200);

    await request(app)
      .patch(`/api/v1/tasks/${directTaskId}/status`)
      .send({ status: TaskStatus.IN_PROGRESS })
      .expect(400);

    const detail = await request(app).get(`/api/v1/projects/${projectId}`).expect(200);
    expect(detail.body.data.tasks.length).toBeGreaterThanOrEqual(3);
    expect(detail.body.data.links.length).toBe(1);

    const auditCount = await prisma.auditLog.count({
      where: {
        OR: [
          { entity_id: projectId },
          { entity_id: inboxId },
          { entity_id: directTaskId },
        ],
      },
    });
    expect(auditCount).toBeGreaterThanOrEqual(5);
  });
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entity_id: { in: created.projects } },
        { entity_id: { in: created.inbox } },
        { entity_id: { in: created.tasks } },
        { entity_id: { in: created.links } },
      ],
    },
  });
  await prisma.task.deleteMany({ where: { id: { in: created.tasks } } });
  await prisma.projectLink.deleteMany({ where: { id: { in: created.links } } });
  await prisma.inboxItem.deleteMany({ where: { id: { in: created.inbox } } });
  await prisma.project.deleteMany({ where: { id: { in: created.projects } } });
  await prisma.$disconnect();
});
