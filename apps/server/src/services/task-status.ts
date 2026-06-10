import { TaskStatus } from 'shared';
import { HttpError } from '../utils/http';

export const kanbanStatuses = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.WAITING,
  TaskStatus.HOLD,
  TaskStatus.DONE,
  TaskStatus.ARCHIVED,
  TaskStatus.CANCELED,
];

export const terminalStatuses: TaskStatus[] = [TaskStatus.DONE, TaskStatus.ARCHIVED, TaskStatus.CANCELED];

export const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.INBOX]: [TaskStatus.OPEN, TaskStatus.CANCELED, TaskStatus.ARCHIVED],
  [TaskStatus.OPEN]: [TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.HOLD, TaskStatus.DONE, TaskStatus.CANCELED, TaskStatus.ARCHIVED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.OPEN, TaskStatus.WAITING, TaskStatus.HOLD, TaskStatus.DONE, TaskStatus.CANCELED, TaskStatus.ARCHIVED],
  [TaskStatus.WAITING]: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.HOLD, TaskStatus.DONE, TaskStatus.CANCELED, TaskStatus.ARCHIVED],
  [TaskStatus.HOLD]: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.WAITING, TaskStatus.CANCELED, TaskStatus.ARCHIVED],
  [TaskStatus.DONE]: [TaskStatus.OPEN, TaskStatus.ARCHIVED],
  [TaskStatus.ARCHIVED]: [TaskStatus.OPEN],
  [TaskStatus.CANCELED]: [TaskStatus.OPEN, TaskStatus.ARCHIVED],
};

export const createTaskTimestamps = (status: TaskStatus) => ({
  completed_at: status === TaskStatus.DONE ? new Date() : null,
  archived_at: status === TaskStatus.ARCHIVED ? new Date() : null,
  canceled_at: status === TaskStatus.CANCELED ? new Date() : null,
});

export const applyTaskStatus = (currentStatus: string, nextStatus: TaskStatus) => {
  const current = currentStatus as TaskStatus;
  if (!allowedTransitions[current]?.includes(nextStatus)) {
    throw new HttpError(400, 'INVALID_STATUS_TRANSITION', `Cannot move task from ${currentStatus} to ${nextStatus}`);
  }

  return {
    status: nextStatus,
    ...createTaskTimestamps(nextStatus),
  };
};
