import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: Error & { statusCode?: number; status?: number; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message || 'Unknown Error', { stack: err.stack });

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  res.status(statusCode).json({
    error: {
      code: err.code || String(statusCode),
      message,
    },
  });
};
