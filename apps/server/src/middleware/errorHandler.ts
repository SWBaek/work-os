import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (err: Error & { statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message || 'Unknown Error', { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message,
    },
  });
};
