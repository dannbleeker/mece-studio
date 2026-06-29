import { describe, expect, it } from 'vitest';
import { createDoc } from '../factory';
import {
  CURRENT_SCHEMA_VERSION,
  MIGRATIONS,
  type Migration,
  migrateToCurrent,
  readVersion,
} from './index';

describe('MIGRATIONS registry', () => {
  it('is contiguous: each step bumps the version by exactly one', () => {
    MIGRATIONS.forEach((m: Migration, i) => {
      expect(m.to).toBe(m.from + 1);
      if (i > 0) expect(m.from).toBe(MIGRATIONS[i - 1]?.to);
    });
  });

  it('reaches the current schema version (or is empty at the baseline)', () => {
    const last = MIGRATIONS[MIGRATIONS.length - 1];
    if (last) expect(last.to).toBe(CURRENT_SCHEMA_VERSION);
    else expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });
});

describe('readVersion', () => {
  it('reads an integer schemaVersion', () => {
    expect(readVersion({ schemaVersion: 3 })).toBe(3);
  });

  it('treats a missing version as the legacy baseline (0)', () => {
    expect(readVersion({})).toBe(0);
  });

  it('treats a non-integer / negative / non-number version as 0', () => {
    expect(readVersion({ schemaVersion: 1.5 })).toBe(0);
    expect(readVersion({ schemaVersion: -2 })).toBe(0);
    expect(readVersion({ schemaVersion: 'two' })).toBe(0);
  });
});

describe('migrateToCurrent', () => {
  it('brings a v0 / unversioned doc up to the current version', () => {
    const { schemaVersion: _omit, ...unversioned } = createDoc('Legacy', 1);
    const migrated = migrateToCurrent(unversioned);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    // The rest of the document is preserved unchanged.
    expect(migrated.rootId).toBe(unversioned.rootId);
    expect(migrated.nodes).toBe(unversioned.nodes);
  });

  it('is a no-op (bar the version stamp) for a current-version doc', () => {
    const doc = createDoc('Current', 1);
    const migrated = migrateToCurrent({ ...doc });
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.rootId).toBe(doc.rootId);
  });

  it('passes through a doc from an unknown future version without crashing', () => {
    const future = { ...createDoc('Future', 1), schemaVersion: CURRENT_SCHEMA_VERSION + 99 };
    const migrated = migrateToCurrent(future);
    // We can't downgrade — hand it back untouched for the caller to judge.
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION + 99);
    expect(migrated.rootId).toBe(future.rootId);
  });

  it('does not mutate its input', () => {
    const input = { schemaVersion: 0, rootId: 'r' };
    migrateToCurrent(input);
    expect(input.schemaVersion).toBe(0);
  });
});
