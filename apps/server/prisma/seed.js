"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding data...');
    // UserSetting (required id=1)
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
    // Tags (10)
    const tagNames = ['Urgent', 'Bug', 'Feature', 'Documentation', 'Meeting', 'Planning', 'Design', 'Development', 'Testing', 'Deployment'];
    const tags = [];
    for (const name of tagNames) {
        const tag = await prisma.tag.upsert({
            where: { name },
            update: {},
            create: {
                name,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                description: `Tag for ${name}`,
            },
        });
        tags.push(tag);
    }
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
    console.log('Seeding complete.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
