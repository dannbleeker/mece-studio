/**
 * Sanitise an SVG string before it is written to a file.
 *
 * An exported `.svg` is a standalone document a browser will *execute* when
 * opened, so a diagram export must never carry script. MECE's canvas content is
 * already inert (React-escaped text, never raw HTML — see
 * `components/canvas/export-safety.test.ts`), but exporting via
 * `html-to-image`'s `toSvg` serialises the live DOM into an SVG with a
 * `<foreignObject>` HTML clone, so we defend at the sink too: parse the SVG and
 * strip anything executable before it leaves the app. Mirrors the spirit of
 * mindmap-studio's `io/svgSanitize.ts`.
 */

/** Elements removed wholesale — they can load or run code. */
const DANGEROUS_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base']);
/** Attributes that carry a URL we must vet for a dangerous scheme. */
const URL_ATTRS = new Set(['href', 'xlink:href', 'src']);
/** Schemes that execute when the document is opened. */
const DANGEROUS_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;

/** Recursively strip dangerous elements and attributes in-place. */
function scrub(el: Element): void {
  for (const child of Array.from(el.children)) {
    if (DANGEROUS_TAGS.has(child.tagName.toLowerCase())) child.remove();
    else scrub(child);
  }
  for (const name of el.getAttributeNames()) {
    const lower = name.toLowerCase();
    // Event handlers (onload, onclick, onbegin, …) never belong in an export.
    if (lower.startsWith('on')) {
      el.removeAttribute(name);
      continue;
    }
    if (URL_ATTRS.has(lower) && DANGEROUS_URL.test(el.getAttribute(name) ?? '')) {
      el.removeAttribute(name);
    }
  }
}

/**
 * Return `svg` with every script element, inline event handler, and
 * script-bearing URL removed. Fails closed: returns `''` if the input can't be
 * parsed as SVG, or if the environment has no DOM parser.
 */
export function sanitizeSvg(svg: string): string {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return '';
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  // A parse error yields a <parsererror> document — refuse to emit it.
  if (doc.getElementsByTagName('parsererror').length > 0) return '';
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== 'svg') return '';
  scrub(root);
  return new XMLSerializer().serializeToString(root);
}
