import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Request validation middleware (Security Checklist #7).
 *
 * Validates request body, query, or params against a Zod schema.
 * Client-side validation is UX only — this is authoritative.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace req.body with the parsed (and potentially transformed) data.
    // This acts as an allowlist — only validated fields pass through (Security Checklist #15).
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.params = result.data;
    next();
  };
}
