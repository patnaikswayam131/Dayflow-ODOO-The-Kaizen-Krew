import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../lib/errors.js';
import type { ApiResponse } from '@dayflow/shared';

/**
 * Centralized error handler (Security Checklist #17).
 *
 * - In production: returns generic messages + error code to the client;
 *   full stack trace goes only to server-side logs.
 * - In development: returns full detail for debugging.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Always log the full error server-side
  console.error('[Error]', {
    message: err.message,
    code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
    stack: err.stack,
    ...(err instanceof ValidationError ? { details: err.details } : {}),
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // ── Zod validation errors ──
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }

    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
    };

    res.status(422).json(
      isProduction
        ? response
        : { ...response, details },
    );
    return;
  }

  // ── Known operational errors ──
  if (err instanceof AppError && err.isOperational) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: isProduction ? getGenericMessage(err.statusCode) : err.message,
        code: err.code,
      },
    };

    if (err instanceof ValidationError && !isProduction) {
      res.status(err.statusCode).json({ ...response, details: err.details });
      return;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Unexpected errors — never leak internals ──
  const response: ApiResponse = {
    success: false,
    error: {
      message: isProduction
        ? 'An unexpected error occurred'
        : err.message || 'Unknown error',
      code: 'INTERNAL_ERROR',
    },
  };

  res.status(500).json(response);
};

function getGenericMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Insufficient permissions';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Resource conflict';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Too many requests';
    default:
      return 'An error occurred';
  }
}
