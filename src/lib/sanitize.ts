import DOMPurify from "dompurify";

/**
 * Sanitizes rich text / HTML content before rendering to eliminate XSS risks.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  if (typeof window === "undefined") {
    // Server-side fallback: basic strip
    return dirty.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
      "blockquote",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });
}
