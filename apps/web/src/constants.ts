import { Priority, TaskStatus } from 'shared';

export const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.INBOX]: '#0EA5E9',
  [TaskStatus.OPEN]: '#0EA5E9',
  [TaskStatus.IN_PROGRESS]: '#A50034',
  [TaskStatus.WAITING]: '#F59E0B',
  [TaskStatus.HOLD]: '#8B5CF6',
  [TaskStatus.DONE]: '#16A34A',
  [TaskStatus.ARCHIVED]: '#737373',
  [TaskStatus.CANCELED]: '#A3A3A3',
};

export const priorityClasses: Record<Priority, string> = {
  [Priority.CRITICAL]: 'border-l-danger',
  [Priority.HIGH]: 'border-l-[#F59E0B]',
  [Priority.MEDIUM]: 'border-l-[#0EA5E9]',
  [Priority.LOW]: 'border-l-[#16A34A]',
};

export const taskStatuses: TaskStatus[] = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING,
  TaskStatus.HOLD,
  TaskStatus.DONE,
  TaskStatus.ARCHIVED,
  TaskStatus.CANCELED,
];

export const toTags = (value: string) => value.split(',').map((tag) => tag.trim()).filter(Boolean);
export const isoOrUndefined = (value: string) => (value ? new Date(value).toISOString() : undefined);
