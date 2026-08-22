import rateLimit from 'express-rate-limit';

/**
 * Rate limiting (Security Checklist #5).
 *
 * - Auth endpoints: 5 requests / 15 minutes per IP (strict).
 * - Write endpoints (POST/PUT/PATCH/DELETE): 30 requests / minute per IP.
 */

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many attempts, please try again later',
      code: 'RATE_LIMITED',
    },
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy, otherwise remote address
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
  },
});

export const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMITED',
    },
  },
  // Only apply to mutating methods
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
});
