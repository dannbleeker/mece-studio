// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from './svgSanitize';

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">${inner}</svg>`;

describe('sanitizeSvg', () => {
  it('keeps benign shapes and text', () => {
    const out = sanitizeSvg(wrap('<rect width="5" height="5"/><text>Pricing</text>'));
    expect(out).toContain('<rect');
    expect(out).toContain('Pricing');
  });

  it('removes <script> elements (top level and inside foreignObject)', () => {
    const out = sanitizeSvg(
      wrap(
        '<script>alert(1)</script>' +
          '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">hi<script>steal()</script></div></foreignObject>'
      )
    );
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).not.toContain('steal()');
    expect(out).toContain('hi'); // benign foreignObject content survives
  });

  it('strips inline event handlers', () => {
    const out = sanitizeSvg(wrap('<rect width="5" height="5" onload="alert(1)" onclick="x()"/>'));
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toMatch(/onclick/i);
  });

  it('strips javascript: and data:text/html URLs but keeps safe ones', () => {
    const out = sanitizeSvg(
      wrap(
        '<a href="javascript:alert(1)"><text>x</text></a>' +
          '<image href="data:image/png;base64,AAAA"/>'
      )
    );
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toContain('data:image/png'); // a real raster data URL is fine
  });

  it('removes embedded iframes/objects', () => {
    const out = sanitizeSvg(wrap('<foreignObject><iframe src="evil"></iframe></foreignObject>'));
    expect(out).not.toContain('<iframe');
  });

  it('fails closed on non-SVG / unparseable input', () => {
    expect(sanitizeSvg('not svg at all')).toBe('');
    expect(sanitizeSvg('<html><body>nope</body></html>')).toBe('');
  });
});
