import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { createDoc } from '../domain/factory';
import { treeToJson } from './exporters/json';
import { importText } from './import';
import type { ImportLabels } from './opmlImport';

// Real catalogue values, so the test fails if the labels stop being wired
// through from the active locale.
const LABELS: ImportLabels = {
  root: en.content.importedOutlineLabel,
  untitled: en.content.untitled,
};

describe('importText', () => {
  it('returns null for empty input', () => {
    expect(importText('', 1, LABELS)).toBeNull();
    expect(importText('   ', 1, LABELS)).toBeNull();
  });

  it('reads a JSON document and round-trips with the JSON export', () => {
    const doc = createDoc('Exported question', 1);
    const result = importText(treeToJson(doc), 2, LABELS);
    expect(result?.format).toBe('json');
    expect(result?.doc.rootId).toBe(doc.rootId);
  });

  it('carries a document locale through an export → import round trip', () => {
    const doc = createDoc('Exported question', 1, { locale: 'en' });
    expect(importText(treeToJson(doc), 2, LABELS)?.doc.locale).toBe('en');
  });

  it('accepts a document saved before the locale field existed', () => {
    const doc = createDoc('Legacy question', 1);
    const legacy = JSON.parse(treeToJson(doc)) as Record<string, unknown>;
    delete legacy.locale;
    const result = importText(JSON.stringify(legacy), 2, LABELS);
    expect(result?.doc.rootId).toBe(doc.rootId);
    expect(result?.doc.locale).toBeUndefined();
  });

  it('rejects JSON-looking text that is not a valid tree', () => {
    expect(importText('{"not":"a tree"}', 1, LABELS)).toBeNull();
  });

  it('parses a Markdown outline into a tree', () => {
    const result = importText('# Root\n- A\n- B', 1, LABELS);
    expect(result?.format).toBe('markdown');
    expect(result?.doc.nodes[result.doc.rootId]?.label).toBe('Root');
  });
});
