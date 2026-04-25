import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimiter = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const currentTime = Date.now();

    if (!store[ip] || currentTime > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: currentTime + windowMs,
      };
      return next();
    }

    store[ip].count++;

    if (store[ip].count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `You have exceeded the rate limit of ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((store[ip].resetTime - currentTime) / 1000),
      });
    }

    next();
  };
};
