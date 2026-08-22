import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';

import { secureHeaders } from './middleware/helmet.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { mutationRateLimiter, authRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Security Middleware Pipeline ───
// Order matters: headers → CORS → rate limit → body parsing → routes → error handler

// 1. Secure HTTP headers (helmet)
app.use(secureHeaders);

// 2. CORS — restricted to FRONTEND_URL only, never '*'
app.use(createCorsMiddleware());

// 3. Rate limiting on mutations (applies to all routes)
app.use(mutationRateLimiter);

// 4. Stricter rate limiting specifically for auth routes
app.use('/api/v1/auth', authRateLimiter);

// 5. Cookie parser (for httpOnly JWT cookies)
app.use(cookieParser());

// 6. JSON body parser with size limit
app.use(express.json({ limit: '1mb' }));

// 7. URL-encoded body parser
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ─── API Routes ───
app.use('/api/v1', routes);

// ─── 404 for unmatched API routes ───
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'API endpoint not found', code: 'NOT_FOUND' },
  });
});

// ─── Centralized Error Handler (must be last) ───
app.use(errorHandler);

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`[Dayflow API] Server running on port ${PORT}`);
  console.log(`[Dayflow API] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Dayflow API] Health check: http://localhost:${PORT}/api/v1/health`);
});

export default app;
