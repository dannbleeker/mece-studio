/**
 * Forward-only schema migration runner.
 *
 * Documents persisted by older versions of MECE Studio are brought up to the
 * current schema before their shape is trusted. Migrations are pure, ordered,
 * and applied one version at a time. Mirrors TP Studio's
 * `domain/migrations/index.ts` barrel.
 *
 * ### Adding a migration
 * When you make a breaking change to `IssueTreeDoc`:
 *   1. Bump `SCHEMA_VERSION` in `../types/document.ts`.
 *   2. Add `vNToVN1.ts` exporting a `Migration` from N to N+1.
 *   3. Register it in `MIGRATIONS` below (keep the list contiguous, low → high).
 * `CURRENT_SCHEMA_VERSION` tracks `SCHEMA_VERSION`, so the two can't drift.
 */

import { SCHEMA_VERSION } from '../types/document';
import { type Migration, type RawDocument, readVersion, type SchemaVersion } from './shared';

export type { Migration, RawDocument, SchemaVersion } from './shared';
export { readVersion } from './shared';

/** The version the migration chain produces — the version this app writes. */
export const CURRENT_SCHEMA_VERSION: SchemaVersion = SCHEMA_VERSION;

/**
 * Ordered registry of forward migrations (each `from` → `from + 1`).
 *
 * Empty today: MECE has only ever had one schema, so unversioned (v0) saves are
 * structurally identical to v1 and only need their version stamped. Add the next
 * `vNToVN1` migration here when `SCHEMA_VERSION` is bumped for a real change.
 */
export const MIGRATIONS: readonly Migration[] = [];

/**
 * Bring a raw, unvalidated document up to {@link CURRENT_SCHEMA_VERSION}.
 *
 * - **Legacy / older** (version < current): apply each registered migration in
 *   turn, then stamp the current version. A version with no registered
 *   migration is assumed shape-compatible (the v0 baseline case).
 * - **Current**: only the version stamp is (re)applied — effectively a no-op.
 * - **Newer than we understand** (version > current): returned untouched. We
 *   can't safely downgrade, so we hand it back and let the caller's structural
 *   guard decide whether it is loadable — never a crash.
 */
export function migrateToCurrent(
  raw: RawDocument,
  // Injectable for tests, so the forward-migration mechanics can be exercised
  // before the registry has its first real entry. Production always uses the
  // module defaults.
  migrations: readonly Migration[] = MIGRATIONS,
  target: SchemaVersion = CURRENT_SCHEMA_VERSION
): RawDocument {
  const startVersion = readVersion(raw);

  // A save from a newer app version: don't touch it, just pass it through.
  if (startVersion > target) return raw;

  let version = startVersion;
  let doc = raw;
  while (version < target) {
    const migration = migrations.find((m) => m.from === version);
    if (!migration) break; // no transform registered for this step → compatible
    doc = migration.migrate(doc);
    version = migration.to;
  }

  // Stamp the target version so legacy/unversioned saves are written back
  // consistent with what this app produces.
  return { ...doc, schemaVersion: target };
}
