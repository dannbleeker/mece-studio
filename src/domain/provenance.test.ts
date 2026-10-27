import { describe, expect, it } from 'vitest';
import { createDoc, createEvidence } from './factory';
import { evidenceDate, safeUrl, statusLogOf } from './provenance';
import { addChild } from './tree';
import type { IssueNode } from './types';

describe('safeUrl', () => {
  it('passes http and https links through unchanged', () => {
    expect(safeUrl('https://teams.microsoft.com/l/message/1')).toBe(
      'https://teams.microsoft.com/l/message/1'
    );
    expect(safeUrl('http://zabbix.local/graph')).toBe('http://zabbix.local/graph');
  });

  it('rejects every other scheme, because a tree can arrive from a file', () => {
    for (const bad of [
      'javascript:alert(1)',
      ' JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox',
      'file:///etc/passwd',
      '//evil.example/x',
      'not a url',
      '',
    ]) {
      expect(safeUrl(bad), bad).toBeUndefined();
    }
  });

  it('ignores a non-string value', () => {
    expect(safeUrl(42 as unknown as string)).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
  });
});

describe('evidenceDate', () => {
  it('reads a real ISO calendar day', () => {
    expect(evidenceDate({ date: '2026-10-24' })).toBe('2026-10-24');
  });

  it('rejects anything that is not a real calendar day', () => {
    for (const bad of ['2026-02-30', '2026-13-01', '24-10-2026', '2026-10-24T16:00', 'Monday']) {
      expect(evidenceDate({ date: bad }), bad).toBeUndefined();
    }
    expect(evidenceDate({})).toBeUndefined();
    expect(evidenceDate({ date: 20261024 as unknown as string })).toBeUndefined();
  });
});

describe('statusLogOf', () => {
  // A raw value, as a file would carry it — typed loosely on purpose.
  function nodeWith(statusLog: unknown): Pick<IssueNode, 'statusLog'> {
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'H').doc;
    const id = Object.keys(doc.nodes).find((k) => k !== doc.rootId) as keyof typeof doc.nodes;
    return { ...(doc.nodes[id] as IssueNode), statusLog } as Pick<IssueNode, 'statusLog'>;
  }

  it('is empty for a node saved before status history existed', () => {
    expect(statusLogOf(nodeWith(undefined))).toEqual([]);
  });

  it('keeps well-formed entries and drops malformed ones from a file', () => {
    const good = { at: 1, from: 'open', to: 'refuted', reason: 'Server answers in 55 ms' };
    const log = statusLogOf(
      nodeWith([
        good,
        { at: 'yesterday', from: 'open', to: 'refuted' },
        { at: 2, from: 'open', to: 'maybe' },
        null,
        'x',
        { at: 3, from: 'refuted', to: 'open', reason: 7, evidenceId: 9 },
      ])
    );
    expect(log).toEqual([good, { at: 3, from: 'refuted', to: 'open' }]);
  });

  it('is empty when the field is not an array at all', () => {
    expect(statusLogOf(nodeWith({ at: 1 }))).toEqual([]);
  });
});

describe('createEvidence', () => {
  it('stamps when the evidence was added', () => {
    expect(createEvidence('Synthetic probe', true, 'indicative', 1234).addedAt).toBe(1234);
  });
});
