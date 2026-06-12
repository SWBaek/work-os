import { describe, expect, it } from 'vitest';
import { TaskStatus } from 'shared';
import { HttpError } from '../utils/http';
import { applyTaskStatus, createTaskTimestamps } from './task-status';

describe('task status rules', () => {
  it('sets completed timestamp only for Done', () => {
    const timestamps = createTaskTimestamps(TaskStatus.DONE);

    expect(timestamps.completed_at).toBeInstanceOf(Date);
    expect(timestamps.archived_at).toBeNull();
    expect(timestamps.canceled_at).toBeNull();
  });

  it('sets archived timestamp only for Archived', () => {
    const timestamps = createTaskTimestamps(TaskStatus.ARCHIVED);

    expect(timestamps.completed_at).toBeNull();
    expect(timestamps.archived_at).toBeInstanceOf(Date);
    expect(timestamps.canceled_at).toBeNull();
  });

  it('allows configured status transitions and clears unrelated terminal timestamps', () => {
    const update = applyTaskStatus(TaskStatus.OPEN, TaskStatus.IN_PROGRESS);

    expect(update.status).toBe(TaskStatus.IN_PROGRESS);
    expect(update.completed_at).toBeNull();
    expect(update.archived_at).toBeNull();
    expect(update.canceled_at).toBeNull();
  });

  it('allows Hold to Done because paused work can be completed without reopening', () => {
    const update = applyTaskStatus(TaskStatus.HOLD, TaskStatus.DONE);

    expect(update.status).toBe(TaskStatus.DONE);
    expect(update.completed_at).toBeInstanceOf(Date);
    expect(update.archived_at).toBeNull();
    expect(update.canceled_at).toBeNull();
  });

  it('rejects invalid status transitions', () => {
    expect(() => applyTaskStatus(TaskStatus.CANCELED, TaskStatus.IN_PROGRESS)).toThrow(HttpError);
    expect(() => applyTaskStatus(TaskStatus.CANCELED, TaskStatus.IN_PROGRESS)).toThrow('Cannot move task from Canceled to In Progress');
  });
});
