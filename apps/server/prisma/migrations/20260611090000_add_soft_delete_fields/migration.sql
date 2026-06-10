ALTER TABLE "ProjectLink" ADD COLUMN "deleted_at" DATETIME;
ALTER TABLE "MeetingNote" ADD COLUMN "deleted_at" DATETIME;
ALTER TABLE "Decision" ADD COLUMN "deleted_at" DATETIME;

CREATE INDEX "MeetingNote_deleted_at_idx" ON "MeetingNote"("deleted_at");
CREATE INDEX "Decision_deleted_at_idx" ON "Decision"("deleted_at");
CREATE INDEX "ProjectLink_deleted_at_idx" ON "ProjectLink"("deleted_at");
