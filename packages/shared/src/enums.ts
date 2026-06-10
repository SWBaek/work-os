export const TaskStatus = {
  INBOX: 'Inbox',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  HOLD: 'Hold',
  DONE: 'Done',
  ARCHIVED: 'Archived',
  CANCELED: 'Canceled',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const Priority = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export const InboxStatus = {
  UNPROCESSED: 'Unprocessed',
  CONVERTED: 'Converted',
  ARCHIVED: 'Archived',
  CANCELED: 'Canceled',
} as const;

export type InboxStatus = typeof InboxStatus[keyof typeof InboxStatus];

export const ProjectStatus = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  DONE: 'Done',
  ARCHIVED: 'Archived',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const SourceType = {
  TEAMS: 'Teams',
  EMAIL: 'Email',
  JIRA: 'Jira',
  VERBAL: 'Verbal',
  PHONE: 'Phone',
  MEETING: 'Meeting',
  OTHER: 'Other',
} as const;

export type SourceType = typeof SourceType[keyof typeof SourceType];

export const LinkType = {
  GITLAB: 'GitLab',
  JIRA: 'Jira',
  SHAREPOINT: 'SharePoint',
  CONFLUENCE: 'Confluence',
  TEAMS: 'Teams',
  LOCAL_FILE: 'LocalFile',
  OTHER: 'Other',
} as const;

export type LinkType = typeof LinkType[keyof typeof LinkType];

export const ThemeType = {
  LIGHT: 'Light',
  DARK: 'Dark',
  SYSTEM: 'System',
} as const;

export type ThemeType = typeof ThemeType[keyof typeof ThemeType];
