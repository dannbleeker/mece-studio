import { describe, expect, it } from 'vitest';
import { createDoc } from '../domain/factory';
import { treeToJson } from './exporters/json';
import { importText } from './import';

describe('importText', () => {
  it('returns null for empty input', () => {
    expect(importText('', 1)).toBeNull();
    expect(importText('   ', 1)).toBeNull();
  });

  it('reads a JSON document and round-trips with the JSON export', () => {
    const doc = createDoc('Exported question', 1);
    const result = importText(treeToJson(doc), 2);
    expect(result?.format).toBe('json');
    expect(result?.doc.rootId).toBe(doc.rootId);
  });

  it('rejects JSON-looking text that is not a valid tree', () => {
    expect(importText('{"not":"a tree"}', 1)).toBeNull();
  });

  it('parses a Markdown outline into a tree', () => {
    const result = importText('# Root\n- A\n- B', 1);
    expect(result?.format).toBe('markdown');
    expect(result?.doc.nodes[result.doc.rootId]?.label).toBe('Root');
  });
});
