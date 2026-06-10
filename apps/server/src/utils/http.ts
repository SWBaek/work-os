import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

export const parseBody = <T>(schema: ZodSchema<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new HttpError(400, 'VALIDATION_ERROR', message);
  }
  return result.data;
};

export const parseQuery = <T>(schema: ZodSchema<T>, query: unknown): T => {
  const result = schema.safeParse(query);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(', ');
    throw new HttpError(400, 'VALIDATION_ERROR', message);
  }
  return result.data;
};

export const parsePositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const nullableDate = (value?: string): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'INVALID_DATE', 'Invalid date value');
  }
  return date;
};
