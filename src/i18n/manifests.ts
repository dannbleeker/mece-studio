/**
 * The web-app manifest, per locale.
 *
 * `vite-plugin-pwa` emits exactly one manifest, which fixes the installed app's
 * name and description at build time — so a Danish user installing the app to
 * their home screen would get an English caption no matter what the running app
 * says. The fix is one manifest per locale plus a runtime swap of
 * `<link rel="manifest">`, which is what this module and `useDocumentLanguage`
 * do between them.
 *
 * Imported by `vite.config.ts` as well as by the app, so it deliberately uses a
 * relative import and holds no JSX, no React and no `@/` alias — the Vite config
 * is bundled separately and does not resolve app aliases.
 *
 * Caveat worth knowing: browsers read the manifest when the app is installed, so
 * switching language does not rename an already-installed icon. It gets the next
 * install right, which is the most a static host can do.
 */
import { LOCALE_CODES, type LocaleCode } from '../domain/types';

/** The parts of the manifest that carry language. */
interface LocalisedManifest {
  name: string;
  short_name: string;
  description: string;
}

/**
 * Keyed by `LocaleCode`, so a locale without a manifest — or a manifest without
 * a locale — fails typecheck, the same guarantee the message catalogue has.
 */
const LOCALISED: Record<LocaleCode, LocalisedManifest> = {
  en: {
    // The brand name is not translated; the description is.
    name: 'MECE Studio',
    short_name: 'MECE Studio',
    description:
      'Build McKinsey-style issue trees with built-in MECE checking — spot overlaps and gaps as you decompose.',
  },
};

/** Writing direction per locale — mirrors `LocaleDescriptor.dir` in the registry. */
const DIRECTION: Record<LocaleCode, 'ltr' | 'rtl'> = { en: 'ltr' };

/**
 * Everything that does not vary by language. Built fresh per call rather than
 * shared by reference: `vite-plugin-pwa` takes a mutable `ManifestOptions`, and
 * handing every locale the same `icons` array invites one caller's mutation to
 * leak into the others.
 */
function shared() {
  return {
    theme_color: '#3f6fb0',
    background_color: '#ffffff',
    // Narrowed, not widened to `string`: `vite-plugin-pwa` types this as a
    // `Display` union, and a typo here would only show up as a PWA that
    // silently refuses to install standalone.
    display: 'standalone' as const,
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}

/** The complete manifest for one locale. */
export function manifestFor(locale: LocaleCode) {
  return { ...shared(), ...LOCALISED[locale], lang: locale, dir: DIRECTION[locale] };
}

/**
 * Where a locale's manifest is served from. The default locale is included, so
 * every locale is handled the same way and there is no "the default is special"
 * branch to get wrong.
 */
export function manifestHref(locale: LocaleCode): string {
  return `/manifest.${locale}.webmanifest`;
}

/** Every locale's manifest, for the build step that emits them. */
export function allManifests(): { fileName: string; source: string }[] {
  return LOCALE_CODES.map((locale) => ({
    fileName: manifestHref(locale).replace(/^\//, ''),
    source: JSON.stringify(manifestFor(locale), null, 2),
  }));
}
