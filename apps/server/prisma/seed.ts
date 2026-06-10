import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing data...');
  
  // Clean up non-setting data in reverse dependency order
  await prisma.projectLink.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.meetingNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.inboxItem.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('Seeding user setting...');

  // UserSetting (required id=1, idempotent)
  await prisma.userSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      dashboard_visible_statuses: JSON.stringify(['Open', 'In Progress', 'Waiting']),
      default_kanban_view: 'All',
      theme: 'System',
    },
  });

  console.log('Seeding tags...');

  // Tags (10) - Fixed colors for determinism
  const tagNames = ['Urgent', 'Bug', 'Feature', 'Documentation', 'Meeting', 'Planning', 'Design', 'Development', 'Testing', 'Deployment'];
  const tagColors = [
    '#EF4444', // Urgent (Red)
    '#F97316', // Bug (Orange)
    '#F59E0B', // Feature (Yellow)
    '#10B981', // Documentation (Green)
    '#06B6D4', // Meeting (Cyan)
    '#3B82F6', // Planning (Blue)
    '#6366F1', // Design (Indigo)
    '#8B5CF6', // Development (Purple)
    '#EC4899', // Testing (Pink)
    '#6B7280'  // Deployment (Gray)
  ];

  const tags = [];
  for (let i = 0; i < tagNames.length; i++) {
    const name = tagNames[i];
    const tag = await prisma.tag.create({
      data: {
        name,
        color: tagColors[i],
        description: `Tag for ${name}`,
      },
    });
    tags.push(tag);
  }

  console.log('Seeding projects...');

  // Projects (5)
  const projects = [];
  for (let i = 1; i <= 5; i++) {
    const project = await prisma.project.create({
      data: {
        name: `Project ${i}`,
        description: `Description for Project ${i}`,
        status: i % 2 === 0 ? 'Active' : 'On Hold',
        tags: { connect: [{ id: tags[i % tags.length].id }] },
      },
    });
    projects.push(project);
  }

  console.log('Seeding inbox items...');

  // InboxItems (20)
  for (let i = 1; i <= 20; i++) {
    await prisma.inboxItem.create({
      data: {
        source_type: 'Email',
        raw_content: `Inbox item raw content ${i}`,
        status: 'Unprocessed',
      },
    });
  }

  console.log('Seeding tasks...');

  // Tasks (50)
  for (let i = 1; i <= 50; i++) {
    await prisma.task.create({
      data: {
        title: `Task ${i}`,
        description: `Task description ${i}`,
        project_id: projects[i % projects.length].id,
        status: i % 3 === 0 ? 'Done' : (i % 2 === 0 ? 'In Progress' : 'Open'),
        priority: 'Medium',
      },
    });
  }

  console.log('Seeding meeting notes...');

  // MeetingNotes (10)
  for (let i = 1; i <= 10; i++) {
    await prisma.meetingNote.create({
      data: {
        project_id: projects[i % projects.length].id,
        title: `Meeting Note ${i}`,
        markdown_content: `# Meeting ${i}\n\nNotes for meeting ${i}`,
      },
    });
  }

  console.log('Seeding decisions...');

  // Decisions (5)
  for (let i = 1; i <= 5; i++) {
    await prisma.decision.create({
      data: {
        project_id: projects[i % projects.length].id,
        title: `Decision ${i}`,
        content: `Decision content ${i}`,
        source_type: 'Meeting',
      },
    });
  }

  console.log('Seeding project links...');

  // ProjectLinks (15)
  for (let i = 1; i <= 15; i++) {
    await prisma.projectLink.create({
      data: {
        project_id: projects[i % projects.length].id,
        title: `Link ${i}`,
        url_or_path: `https://example.com/link${i}`,
        type: 'Other',
      },
    });
  }

  console.log('Setting up FTS5 tables, triggers, and indices...');
  
  // 1. Task FTS
  await prisma.$executeRawUnsafe(`CREATE VIRTUAL TABLE IF NOT EXISTS task_fts USING fts5(id UNINDEXED, title, description, tokenize="unicode61");`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS task_ai AFTER INSERT ON Task BEGIN INSERT INTO task_fts(id, title, description) VALUES (new.id, new.title, new.description); END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS task_ad AFTER DELETE ON Task BEGIN DELETE FROM task_fts WHERE id = old.id; END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS task_au AFTER UPDATE ON Task BEGIN UPDATE task_fts SET title = new.title, description = new.description WHERE id = new.id; END;`);

  // 2. MeetingNote FTS
  await prisma.$executeRawUnsafe(`CREATE VIRTUAL TABLE IF NOT EXISTS meeting_note_fts USING fts5(id UNINDEXED, title, markdown_content, tokenize="unicode61");`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS meeting_note_ai AFTER INSERT ON MeetingNote BEGIN INSERT INTO meeting_note_fts(id, title, markdown_content) VALUES (new.id, new.title, new.markdown_content); END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS meeting_note_ad AFTER DELETE ON MeetingNote BEGIN DELETE FROM meeting_note_fts WHERE id = old.id; END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS meeting_note_au AFTER UPDATE ON MeetingNote BEGIN UPDATE meeting_note_fts SET title = new.title, markdown_content = new.markdown_content WHERE id = new.id; END;`);

  // 3. InboxItem FTS
  await prisma.$executeRawUnsafe(`CREATE VIRTUAL TABLE IF NOT EXISTS inbox_fts USING fts5(id UNINDEXED, raw_content, tokenize="unicode61");`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS inbox_ai AFTER INSERT ON InboxItem BEGIN INSERT INTO inbox_fts(id, raw_content) VALUES (new.id, new.raw_content); END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS inbox_ad AFTER DELETE ON InboxItem BEGIN DELETE FROM inbox_fts WHERE id = old.id; END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS inbox_au AFTER UPDATE ON InboxItem BEGIN UPDATE inbox_fts SET raw_content = new.raw_content WHERE id = new.id; END;`);

  // 4. Decision FTS
  await prisma.$executeRawUnsafe(`CREATE VIRTUAL TABLE IF NOT EXISTS decision_fts USING fts5(id UNINDEXED, title, content, reason, tokenize="unicode61");`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS decision_ai AFTER INSERT ON Decision BEGIN INSERT INTO decision_fts(id, title, content, reason) VALUES (new.id, new.title, new.content, new.reason); END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS decision_ad AFTER DELETE ON Decision BEGIN DELETE FROM decision_fts WHERE id = old.id; END;`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER IF NOT EXISTS decision_au AFTER UPDATE ON Decision BEGIN UPDATE decision_fts SET title = new.title, content = new.content, reason = new.reason WHERE id = new.id; END;`);

  console.log('Synchronizing seed data to FTS5 tables...');
  await prisma.$executeRawUnsafe(`INSERT OR REPLACE INTO task_fts(id, title, description) SELECT id, title, description FROM Task;`);
  await prisma.$executeRawUnsafe(`INSERT OR REPLACE INTO meeting_note_fts(id, title, markdown_content) SELECT id, title, markdown_content FROM MeetingNote;`);
  await prisma.$executeRawUnsafe(`INSERT OR REPLACE INTO inbox_fts(id, raw_content) SELECT id, raw_content FROM InboxItem;`);
  await prisma.$executeRawUnsafe(`INSERT OR REPLACE INTO decision_fts(id, title, content, reason) SELECT id, title, content, reason FROM Decision;`);

  console.log('Seeding and FTS5 setup complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
