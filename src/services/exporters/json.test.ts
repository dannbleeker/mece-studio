import { describe, expect, it } from 'vitest';
import { createDoc } from '../../domain/factory';
import { parseDoc } from '../storage';
import { treeToJson } from './json';

describe('treeToJson', () => {
  it('pretty-prints the document', () => {
    const json = treeToJson(createDoc('Q', 1));
    expect(json).toContain('\n'); // indented, not minified
    expect(JSON.parse(json).schemaVersion).toBe(1);
  });

  it('round-trips through the file open path (parseDoc)', () => {
    const doc = createDoc('Round trip?', 1);
    const back = parseDoc(treeToJson(doc));
    expect(back?.rootId).toBe(doc.rootId);
    expect(back?.id).toBe(doc.id);
  });
});
