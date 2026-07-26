import { describe, expect, it } from 'vitest';
import { LOCALE_CODES } from '@/domain/types';
import { allManifests, manifestFor, manifestHref } from './manifests';

describe('per-locale web-app manifest', () => {
  it('carries the locale in `lang` and `dir`, not just in the copy', () => {
    const m = manifestFor('en');
    expect(m.lang).toBe('en');
    expect(m.dir).toBe('ltr');
  });

  it('keeps the non-language parts identical across locales', () => {
    // Only name / short_name / description / lang / dir may vary. If a locale
    // ever changed the start_url or the icons, installs would diverge in ways
    // that have nothing to do with language.
    const shared = ({
      theme_color,
      background_color,
      display,
      start_url,
      icons,
    }: ReturnType<typeof manifestFor>) =>
      JSON.stringify({ theme_color, background_color, display, start_url, icons });
    const first = shared(manifestFor(LOCALE_CODES[0] as 'en'));
    for (const locale of LOCALE_CODES) expect(shared(manifestFor(locale))).toBe(first);
  });

  it('emits one manifest file per locale, at the href the app points to', () => {
    const emitted = allManifests();
    expect(emitted).toHaveLength(LOCALE_CODES.length);
    for (const locale of LOCALE_CODES) {
      const file = emitted.find((e) => e.fileName === manifestHref(locale).slice(1));
      expect(file, `no manifest emitted for ${locale}`).toBeDefined();
      // Parseable JSON, and the locale it claims to be.
      expect(JSON.parse(file?.source ?? '{}').lang).toBe(locale);
    }
  });

  it('serves every locale from its own file, including the default', () => {
    // No "the default is special" branch — that is the kind of asymmetry that
    // silently leaves the default locale on a stale manifest.
    expect(manifestHref('en')).toBe('/manifest.en.webmanifest');
  });
});
