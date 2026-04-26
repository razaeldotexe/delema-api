import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidationTarget = 'body' | 'query' | 'params';

export const validateRequest = (schema: ZodType<any, any, any>, target: ValidationTarget = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req[target]);
      req[target] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError(error.errors));
      }
      next(error);
    }
  };
};
