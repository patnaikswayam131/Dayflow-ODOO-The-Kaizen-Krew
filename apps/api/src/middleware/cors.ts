import cors from 'cors';

/**
 * CORS configuration (Security Checklist #12).
 *
 * - Explicit origin allowlist from FRONTEND_URL env var — never '*'.
 * - credentials: true paired with explicit origin only.
 */
export function createCorsMiddleware() {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    console.warn(
      '[CORS] FRONTEND_URL is not set. CORS will reject all cross-origin requests.',
    );
  }

  const allowedOrigins = frontendUrl ? frontendUrl.split(',').map((o) => o.trim()) : [];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600, // Preflight cache 10 minutes
  });
}
