-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_project_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Project_parent_project_id_fkey" FOREIGN KEY ("parent_project_id") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "title" TEXT,
    "url_or_path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ProjectLink_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source_type" TEXT NOT NULL,
    "source_detail" TEXT,
    "raw_content" TEXT NOT NULL,
    "project_id" TEXT,
    "due_date" DATETIME,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "InboxItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "project_id" TEXT,
    "sub_project_id" TEXT,
    "source_inbox_id" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "due_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    "archived_at" DATETIME,
    "canceled_at" DATETIME,
    CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_source_inbox_id_fkey" FOREIGN KEY ("source_inbox_id") REFERENCES "InboxItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "title" TEXT,
    "meeting_date" DATETIME,
    "attendees" TEXT,
    "markdown_content" TEXT NOT NULL,
    "html_content" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MeetingNote_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "meeting_note_id" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "reason" TEXT,
    "decided_by" TEXT,
    "decision_date" DATETIME,
    "source_type" TEXT NOT NULL,
    "source_link" TEXT,
    "impact" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Decision_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "dashboard_visible_statuses" TEXT NOT NULL,
    "default_kanban_view" TEXT NOT NULL,
    "default_project_filter" TEXT,
    "theme" TEXT NOT NULL,
    "meeting_note_template" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changed_fields" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_ProjectTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProjectLinkTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectLinkTags_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectLinkTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TaskLinks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TaskLinks_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TaskLinks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_InboxTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_InboxTags_A_fkey" FOREIGN KEY ("A") REFERENCES "InboxItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_InboxTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MeetingNoteTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MeetingNoteTags_A_fkey" FOREIGN KEY ("A") REFERENCES "MeetingNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MeetingNoteTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MeetingNoteTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MeetingNoteTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "MeetingNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MeetingNoteTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DecisionFollowUpTasks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DecisionFollowUpTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DecisionFollowUpTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MeetingNoteDecisions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MeetingNoteDecisions_A_fkey" FOREIGN KEY ("A") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MeetingNoteDecisions_B_fkey" FOREIGN KEY ("B") REFERENCES "MeetingNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DecisionTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DecisionTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DecisionTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TaskTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TaskTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TaskTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InboxItem_status_captured_at_idx" ON "InboxItem"("status", "captured_at");

-- CreateIndex
CREATE INDEX "Task_project_id_status_idx" ON "Task"("project_id", "status");

-- CreateIndex
CREATE INDEX "Task_due_date_idx" ON "Task"("due_date");

-- CreateIndex
CREATE INDEX "MeetingNote_project_id_meeting_date_idx" ON "MeetingNote"("project_id", "meeting_date");

-- CreateIndex
CREATE INDEX "Decision_project_id_decision_date_idx" ON "Decision"("project_id", "decision_date");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectTags_AB_unique" ON "_ProjectTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectTags_B_index" ON "_ProjectTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectLinkTags_AB_unique" ON "_ProjectLinkTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectLinkTags_B_index" ON "_ProjectLinkTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TaskLinks_AB_unique" ON "_TaskLinks"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskLinks_B_index" ON "_TaskLinks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InboxTags_AB_unique" ON "_InboxTags"("A", "B");

-- CreateIndex
CREATE INDEX "_InboxTags_B_index" ON "_InboxTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingNoteTags_AB_unique" ON "_MeetingNoteTags"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingNoteTags_B_index" ON "_MeetingNoteTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingNoteTasks_AB_unique" ON "_MeetingNoteTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingNoteTasks_B_index" ON "_MeetingNoteTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DecisionFollowUpTasks_AB_unique" ON "_DecisionFollowUpTasks"("A", "B");

-- CreateIndex
CREATE INDEX "_DecisionFollowUpTasks_B_index" ON "_DecisionFollowUpTasks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingNoteDecisions_AB_unique" ON "_MeetingNoteDecisions"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingNoteDecisions_B_index" ON "_MeetingNoteDecisions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DecisionTags_AB_unique" ON "_DecisionTags"("A", "B");

-- CreateIndex
CREATE INDEX "_DecisionTags_B_index" ON "_DecisionTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TaskTags_AB_unique" ON "_TaskTags"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskTags_B_index" ON "_TaskTags"("B");
