import { z } from 'zod';
import { TaskStatus, Priority, InboxStatus, ProjectStatus, SourceType, LinkType, ThemeType } from './enums';

const enumValues = <T extends Record<string, string>>(obj: T) => {
  return Object.values(obj) as [string, ...string[]];
};

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parent_project_id: z.string().uuid().optional(),
  status: z.enum(enumValues(ProjectStatus)).optional().default(ProjectStatus.ACTIVE),
  tags: z.array(z.string()).optional()
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  sub_project_id: z.string().uuid().optional(),
  source_inbox_id: z.string().uuid().optional(),
  status: z.enum(enumValues(TaskStatus)).optional().default(TaskStatus.OPEN),
  priority: z.enum(enumValues(Priority)).optional().default(Priority.MEDIUM),
  due_date: z.string().optional(), // ISO 8601 or Date string
  tags: z.array(z.string()).optional()
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateInboxItemSchema = z.object({
  source_type: z.enum(enumValues(SourceType)).optional().default(SourceType.OTHER),
  source_detail: z.string().optional(),
  raw_content: z.string().min(1, "Content is required"),
  project_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateInboxItemSchema = CreateInboxItemSchema.partial();
export const PatchInboxItemSchema = UpdateInboxItemSchema.extend({
  status: z.enum(enumValues(InboxStatus)).optional()
});

export const CreateProjectLinkSchema = z.object({
  project_id: z.string().uuid("Invalid Project ID"),
  title: z.string().optional(),
  url_or_path: z.string().min(1, "URL or path is required"),
  type: z.enum(enumValues(LinkType)).optional().default(LinkType.OTHER),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateProjectLinkSchema = CreateProjectLinkSchema.partial();

export const ConvertInboxItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  project_id: z.string().uuid().optional(),
  sub_project_id: z.string().uuid().optional(),
  priority: z.enum(enumValues(Priority)).optional().default(Priority.MEDIUM),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  copy_description: z.boolean().optional().default(true)
});

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(enumValues(TaskStatus))
});

export const CreateMeetingNoteSchema = z.object({
  project_id: z.string().uuid("Invalid Project ID"),
  title: z.string().optional(),
  meeting_date: z.string().optional(),
  attendees: z.string().optional(),
  markdown_content: z.string().min(1, "Content is required"),
  html_content: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateMeetingNoteSchema = CreateMeetingNoteSchema.partial();

export const DeletedQuerySchema = z.object({
  deleted: z.enum(['true', 'false']).optional()
});

export const ResetWorkspaceSchema = z.object({
  confirmation: z.literal('RESET WORKSPACE')
});

export const CreateDecisionSchema = z.object({
  project_id: z.string().uuid("Invalid Project ID"),
  meeting_note_id: z.string().uuid().optional(),
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  reason: z.string().optional(),
  decided_by: z.string().optional(),
  decision_date: z.string().optional(),
  source_type: z.enum(enumValues(SourceType)).optional().default(SourceType.OTHER),
  source_link: z.string().optional(),
  impact: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateDecisionSchema = CreateDecisionSchema.partial();

export const CreateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name too long"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format").optional(),
  description: z.string().optional()
});

export const UpdateTagSchema = CreateTagSchema.partial();

export const UpdateUserSettingSchema = z.object({
  dashboard_visible_statuses: z.array(z.enum(enumValues(TaskStatus))).min(1).optional(),
  default_kanban_view: z.enum(['All', 'Project']).optional(),
  default_project_filter: z.string().uuid().optional().nullable(),
  theme: z.enum(enumValues(ThemeType)).optional(),
  meeting_note_template: z.string().optional().nullable()
});

export const ConvertMeetingActionItemSchema = z.object({
  action_item_text: z.string().min(1, "Action item text is required"),
  action_item_key: z.string().min(1).max(256).optional(),
  project_id: z.string().uuid().optional(),
  priority: z.enum(enumValues(Priority)).optional().default(Priority.MEDIUM),
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const ProjectListQuerySchema = z.object({
  tag: z.string().optional(),
  status: z.enum(enumValues(ProjectStatus)).optional(),
});

export const InboxListQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.enum(enumValues(InboxStatus)).optional(),
  tag: z.string().optional(),
});

export const TaskListQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.enum(enumValues(TaskStatus)).optional(),
  priority: z.enum(enumValues(Priority)).optional(),
  dashboard: z.enum(['today', 'overdue', 'waiting']).optional(),
});

export const KanbanQuerySchema = z.object({
  scope: z.enum(['all', 'project', 'sub_project']).optional().default('all'),
  project_id: z.string().uuid().optional(),
  sub_project_id: z.string().uuid().optional(),
});
