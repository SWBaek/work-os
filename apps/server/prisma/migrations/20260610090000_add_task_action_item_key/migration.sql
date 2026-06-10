ALTER TABLE "Task" ADD COLUMN "source_action_key" TEXT;

CREATE UNIQUE INDEX "Task_source_action_key_key" ON "Task"("source_action_key");
