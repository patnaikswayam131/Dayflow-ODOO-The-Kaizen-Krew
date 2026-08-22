import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * 404 Page — Branded "Not Found" (Security Checklist Part B #2).
 * Catch-all route with a link back to the dashboard/login.
 */
export function NotFoundPage() {
  useDocumentTitle('Page Not Found');

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xxl">
      <div className="text-center max-w-[400px]">
        <h1 className="text-hero-display text-ink-deep mb-base">404</h1>
        <p className="text-subtitle-md text-steel mb-xxl">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" className="btn-primary inline-flex">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
