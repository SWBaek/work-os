import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { InboxStatus, ProjectStatus, TaskStatus } from 'shared';
import app from '../server';
import prisma from '../utils/prisma';

const created = {
  projects: [] as string[],
  inbox: [] as string[],
  tasks: [] as string[],
  links: [] as string[],
  notes: [] as string[],
};

describe('Phase 3.6 delete, restore, and reset API', () => {
  it('archives and restores inbox, task, and project records', async () => {
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `P3.6 Project ${Date.now()}` })
      .expect(201);
    const projectId = projectResponse.body.data.id as string;
    created.projects.push(projectId);

    const inboxResponse = await request(app)
      .post('/api/v1/inbox')
      .send({ raw_content: `P3.6 Inbox ${Date.now()}` })
      .expect(201);
    const inboxId = inboxResponse.body.data.id as string;
    created.inbox.push(inboxId);

    await request(app).delete(`/api/v1/inbox/${inboxId}`).expect(200);
    const defaultInbox = await request(app).get('/api/v1/inbox').expect(200);
    expect(defaultInbox.body.data.some((item: { id: string }) => item.id === inboxId)).toBe(false);
    const archivedInbox = await request(app).get('/api/v1/inbox?status=Archived').expect(200);
    expect(archivedInbox.body.data.some((item: { id: string }) => item.id === inboxId)).toBe(true);
    const restoredInbox = await request(app).patch(`/api/v1/inbox/${inboxId}/restore`).expect(200);
    expect(restoredInbox.body.data.status).toBe(InboxStatus.UNPROCESSED);

    const taskResponse = await request(app)
      .post('/api/v1/tasks')
      .send({ title: `P3.6 Task ${Date.now()}`, project_id: projectId })
      .expect(201);
    const taskId = taskResponse.body.data.id as string;
    created.tasks.push(taskId);

    await request(app).delete(`/api/v1/tasks/${taskId}`).expect(200);
    const defaultTasks = await request(app).get('/api/v1/tasks').expect(200);
    expect(defaultTasks.body.data.some((task: { id: string }) => task.id === taskId)).toBe(false);
    const archivedTasks = await request(app).get('/api/v1/tasks?status=Archived').expect(200);
    expect(archivedTasks.body.data.some((task: { id: string }) => task.id === taskId)).toBe(true);
    const kanban = await request(app).get(`/api/v1/kanban?scope=project&project_id=${projectId}`).expect(200);
    expect(kanban.body.data.flatMap((column: { tasks: Array<{ id: string }> }) => column.tasks).some((task: { id: string }) => task.id === taskId)).toBe(false);
    const restoredTask = await request(app).patch(`/api/v1/tasks/${taskId}/restore`).expect(200);
    expect(restoredTask.body.data.status).toBe(TaskStatus.OPEN);

    await request(app).delete(`/api/v1/projects/${projectId}`).expect(200);
    const defaultProjects = await request(app).get('/api/v1/projects').expect(200);
    expect(defaultProjects.body.data.some((project: { id: string }) => project.id === projectId)).toBe(false);
    const archivedProjects = await request(app).get('/api/v1/projects?status=Archived').expect(200);
    expect(archivedProjects.body.data.some((project: { id: string }) => project.id === projectId)).toBe(true);
    const restoredProject = await request(app).patch(`/api/v1/projects/${projectId}/restore`).expect(200);
    expect(restoredProject.body.data.status).toBe(ProjectStatus.ACTIVE);
  });

  it('soft deletes and restores meeting notes and project links', async () => {
    const projectResponse = await request(app)
      .post('/api/v1/projects')
      .send({ name: `P3.6 Notes ${Date.now()}` })
      .expect(201);
    const projectId = projectResponse.body.data.id as string;
    created.projects.push(projectId);

    const noteResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/meeting-notes`)
      .send({ title: 'Delete test note', markdown_content: '# delete test' })
      .expect(201);
    const noteId = noteResponse.body.data.id as string;
    created.notes.push(noteId);

    await request(app).delete(`/api/v1/meeting-notes/${noteId}`).expect(200);
    const activeNotes = await request(app).get(`/api/v1/projects/${projectId}/meeting-notes`).expect(200);
    expect(activeNotes.body.data.some((note: { id: string }) => note.id === noteId)).toBe(false);
    const deletedNotes = await request(app).get(`/api/v1/projects/${projectId}/meeting-notes?deleted=true`).expect(200);
    expect(deletedNotes.body.data.some((note: { id: string }) => note.id === noteId)).toBe(true);
    const restoredNote = await request(app).patch(`/api/v1/meeting-notes/${noteId}/restore`).expect(200);
    expect(restoredNote.body.data.deleted_at).toBeNull();

    const linkResponse = await request(app)
      .post(`/api/v1/projects/${projectId}/links`)
      .send({ title: 'Delete test link', url_or_path: 'https://example.com/delete-test' })
      .expect(201);
    const linkId = linkResponse.body.data.id as string;
    created.links.push(linkId);

    await request(app).delete(`/api/v1/project-links/${linkId}`).expect(200);
    const activeLinks = await request(app).get(`/api/v1/projects/${projectId}/links`).expect(200);
    expect(activeLinks.body.data.some((link: { id: string }) => link.id === linkId)).toBe(false);
    const deletedLinks = await request(app).get(`/api/v1/projects/${projectId}/links?deleted=true`).expect(200);
    expect(deletedLinks.body.data.some((link: { id: string }) => link.id === linkId)).toBe(true);
    const restoredLink = await request(app).patch(`/api/v1/project-links/${linkId}/restore`).expect(200);
    expect(restoredLink.body.data.deleted_at).toBeNull();
  });

  it('cleans sample data only and protects full reset with typed confirmation', async () => {
    const sampleProject = await request(app).post('/api/v1/projects').send({ name: 'Project 1' }).expect(201);
    const customProject = await request(app).post('/api/v1/projects').send({ name: `User Project ${Date.now()}` }).expect(201);
    created.projects.push(sampleProject.body.data.id as string, customProject.body.data.id as string);

    const cleanup = await request(app).post('/api/v1/maintenance/cleanup-sample-data').expect(200);
    expect(cleanup.body.data.projects).toBeGreaterThanOrEqual(1);
    const customStillExists = await prisma.project.findUnique({ where: { id: customProject.body.data.id as string } });
    expect(customStillExists).not.toBeNull();

    await request(app)
      .post('/api/v1/maintenance/reset-workspace')
      .send({ confirmation: 'WRONG' })
      .expect(400);
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
        { entity_id: { in: created.notes } },
      ],
    },
  });
  await prisma.projectLink.deleteMany({ where: { id: { in: created.links } } });
  await prisma.meetingNote.deleteMany({ where: { id: { in: created.notes } } });
  await prisma.task.deleteMany({ where: { id: { in: created.tasks } } });
  await prisma.inboxItem.deleteMany({ where: { id: { in: created.inbox } } });
  await prisma.project.deleteMany({ where: { id: { in: created.projects } } });
  await prisma.$disconnect();
});
