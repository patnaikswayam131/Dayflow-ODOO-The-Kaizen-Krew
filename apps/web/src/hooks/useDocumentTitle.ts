import { useEffect } from 'react';

/**
 * Updates document.title per route (Security Checklist Part B #4).
 * Each page calls this hook with its specific title.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | Dayflow`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
