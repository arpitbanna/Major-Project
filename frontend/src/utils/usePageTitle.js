import { useEffect } from 'react';

/**
 * Custom hook to dynamically manage the document title across views
 * @param {string} title Page-specific title segment
 */
export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    if (title) {
      document.title = `${title} | CoalSafe`;
    } else {
      document.title = 'CoalSafe | Coal Mine Safety Management';
    }
    return () => {
      document.title = prev;
    };
  }, [title]);
}
