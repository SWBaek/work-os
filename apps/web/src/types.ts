import { InboxStatus, Priority, ProjectStatus, SourceType, TaskStatus } from 'shared';

export type Tag = { id: string; name: string; color?: string | null };
export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  parent_project_id?: string | null;
  tags: Tag[];
  sub_projects?: Pick<Project, 'id' | 'name' | 'status'>[];
  links?: ProjectLink[];
  tasks?: Task[];
  meeting_notes?: MeetingNoteSummary[];
  _count?: { tasks: number; links: number; inbox_items: number };
};
export type ProjectLink = { id: string; title?: string | null; url_or_path: string; type: string; description?: string | null; tags: Tag[] };
export type MeetingNoteSummary = {
  id: string;
  title?: string | null;
  meeting_date?: string | null;
  attendees?: string | null;
  tags?: Tag[];
};
export type MeetingNote = MeetingNoteSummary & {
  project_id: string;
  markdown_content: string;
  html_content?: string | null;
  related_tasks: Task[];
};
export type InboxItem = {
  id: string;
  source_type: SourceType;
  raw_content: string;
  status: InboxStatus;
  due_date?: string | null;
  project?: { id: string; name: string } | null;
  tags: Tag[];
  converted_tasks: Pick<Task, 'id' | 'title' | 'status' | 'priority'>[];
};
export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  project?: { id: string; name: string } | null;
  source_inbox?: { id: string; raw_content: string } | null;
  tags: Tag[];
  overdue?: boolean;
};
export type ApiList<TItem> = { data: TItem[]; total: number; page: number };
export type ApiOne<TItem> = { data: TItem };
export type KanbanColumnData = { status: TaskStatus; tasks: Task[] };
export type TaskForm = { title: string; project_id: string; priority: Priority; due_date: string };

export type ThemeType = 'Light' | 'Dark' | 'System';
export type UserSetting = {
  id: number;
  dashboard_visible_statuses: TaskStatus[];
  default_kanban_view: 'All' | 'Project';
  default_project_filter?: string | null;
  theme: ThemeType;
  meeting_note_template?: string | null;
};
