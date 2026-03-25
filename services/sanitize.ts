/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks when injecting user-provided data into HTML strings.
 */

/**
 * Escapes HTML special characters to prevent XSS injection.
 * Use this whenever inserting user-controlled data into HTML via document.write, innerHTML, etc.
 */
export const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
