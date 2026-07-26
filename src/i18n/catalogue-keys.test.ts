/**
 * Keeps `scripts/check-i18n.mjs`'s key scanner honest.
 *
 * That script cannot import TypeScript (it has to run as plain Node under the
 * local AppLocker policy), so it reads the catalogue's key paths out of the
 * source text. A text scanner can drift from the real object — and a drifted
 * scanner fails *open*, quietly reporting "no orphans" because it can no longer
 * see any keys. So this test runs the real script with `--print-keys` and
 * compares what it sees against the catalogue imported for real.
 *
 * Running it as a subprocess rather than importing the function is deliberate:
 * it exercises the script exactly as `pnpm verify` invokes it, and it keeps the
 * gate a dependency-free `.mjs` with no type-declaration shim to maintain.
 */
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { en } from './locales/en';

/** What the gate's scanner believes the catalogue contains. */
function scannedKeys(): Set<string> {
  const out = execFileSync('node', ['./scripts/check-i18n.mjs', '--print-keys'], {
    encoding: 'utf8',
  });
  return new Set(out.split('\n').filter(Boolean));
}

/** Every `namespace.key` pair the real catalogue exposes. */
function realKeys(): Set<string> {
  const keys = new Set<string>();
  for (const [namespace, group] of Object.entries(en)) {
    for (const key of Object.keys(group)) keys.add(`${namespace}.${key}`);
  }
  return keys;
}

describe('i18n catalogue key scanner', () => {
  it('sees every key the real catalogue exposes', () => {
    const scanned = scannedKeys();
    const missed = [...realKeys()].filter((k) => !scanned.has(k));
    expect(missed, `the gate's scanner cannot see: ${missed.join(', ')}`).toEqual([]);
  });

  it('does not invent keys the catalogue does not have', () => {
    const real = realKeys();
    const invented = [...scannedKeys()].filter((k) => k.split('.').length === 2 && !real.has(k));
    expect(invented, `the gate's scanner invented: ${invented.join(', ')}`).toEqual([]);
  });

  it('finds a non-trivial number of keys (a broken scanner reads as "all clean")', () => {
    expect(scannedKeys().size).toBeGreaterThan(200);
  });
});
