import { describe, expect, it } from 'vitest';
import { createDoc } from '@/domain/factory';
import { parseDoc } from '@/services/storage';

describe('parseDoc', () => {
  it('round-trips a valid document', () => {
    const doc = createDoc('Why is revenue down?', 1);
    const parsed = parseDoc(JSON.stringify(doc));
    expect(parsed?.rootId).toBe(doc.rootId);
  });

  it('rejects malformed JSON', () => {
    expect(parseDoc('{ not json')).toBeNull();
  });

  it('rejects JSON that is not a document', () => {
    expect(parseDoc(JSON.stringify({ foo: 1 }))).toBeNull();
    expect(parseDoc(JSON.stringify(null))).toBeNull();
  });
});
