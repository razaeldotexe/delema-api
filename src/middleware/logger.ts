import { Request, Response, NextFunction } from 'express';
import { webhookLogger } from '../utils/logger';

/**
 * Express middleware to log requests via WebhookLogger singleton.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      webhookLogger.error(message);
    } else if (res.statusCode >= 400) {
      webhookLogger.warn(message);
    } else {
      webhookLogger.info(message);
    }
  });

  next();
};

/**
 * Global error handler middleware.
 */
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let detail = undefined;

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    status = 400;
    message = 'Validation Error';
    detail = err.errors;
  }

  webhookLogger.error(`Unhandled Error: ${message}`, err);

  res.status(status).json({
    detail: detail || message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
