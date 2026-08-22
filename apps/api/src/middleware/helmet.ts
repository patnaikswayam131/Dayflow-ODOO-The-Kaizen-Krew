import helmet from 'helmet';

/**
 * Secure HTTP headers via helmet (Security Checklist — baseline).
 * Covers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
 */
export const secureHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow loading cross-origin fonts
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
});
