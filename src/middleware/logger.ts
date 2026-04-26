import { Request, Response, NextFunction } from 'express';
import { webhookLogger } from '../utils/logger';
import { AppError } from '../utils/errors';

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
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let detail = err.detail || undefined;

  // Handle known error types
  if (err instanceof AppError) {
    status = err.statusCode;
  } else if (err.name === 'ZodError') {
    status = 422;
    message = 'Validation Error';
    detail = err.errors;
  }

  // Log the error
  if (status >= 500) {
    webhookLogger.error(`Unhandled Error: ${message}`, err);
  } else {
    webhookLogger.warn(`Request Error: ${req.method} ${req.originalUrl} - ${status} ${message}`);
  }

  res.status(status).json({
    success: false,
    status: 'error',
    message,
    error: message,
    detail: detail || (status === 500 ? 'An unexpected error occurred.' : message),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
