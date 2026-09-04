import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes rich text / HTML content before rendering to eliminate XSS risks
 * safely across both client-side and server-side (SSR / Server Actions / RSC) environments.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

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
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

