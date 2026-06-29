/**
 * Shared types for the forward-only schema migration framework.
 *
 * A migration takes a document at version `from` and returns the same document
 * shaped for version `from + 1`. The runner in `./index.ts` chains them until a
 * document reaches the current schema version. Mirrors TP Studio's
 * `domain/migrations/shared.ts` so the two apps stay structurally consistent.
 */

/** A positive-integer schema version (0 = a legacy/unversioned save). */
export type SchemaVersion = number;

/**
 * A document parsed from JSON whose internal shape we have **not** validated
 * yet. Migrations operate on this loose shape; the caller's structural guard
 * (`isDoc` in storage) is what finally promotes it to a typed `IssueTreeDoc`.
 */
export type RawDocument = Record<string, unknown>;

/** A single forward step from version `from` to version `to` (= `from + 1`). */
export interface Migration {
  readonly from: SchemaVersion;
  readonly to: SchemaVersion;
  /** Transform a `from`-shaped document into a `to`-shaped one. Pure. */
  migrate(raw: RawDocument): RawDocument;
}

/**
 * Read the schema version off a raw document.
 *
 * Saves written before the `schemaVersion` field existed have no version; we
 * treat them as version 0 so the runner can bring them forward. Anything that
 * is not a non-negative integer also degrades to 0.
 */
export function readVersion(raw: RawDocument): SchemaVersion {
  const v = raw.schemaVersion;
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0;
}
