import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { createDoc, createEvidence } from './factory';
import { dayToTime } from './provenance';
import { changesMarkdown, eventsSince, timelineEvents } from './timeline';
import { addChild, addEvidence, setStatus, updateStatusChange } from './tree';
import type { EvidenceItem, IssueTreeDoc } from './types';

const m = en;
const ev = (summary: string, supports: boolean, extra: Partial<EvidenceItem>, addedAt = 0) => ({
  ...createEvidence(summary, supports, 'strong', addedAt),
  ...extra,
});

function investigation() {
  let doc: IssueTreeDoc = createDoc('Why are page loads slow on Monday mornings?', 0);
  const db = addChild(doc, doc.rootId, 'Database slow at peak');
  doc = db.doc;
  const line = addChild(doc, doc.rootId, 'Network link full');
  doc = line.doc;
  doc = addEvidence(
    doc,
    db.childId,
    ev('Neutral probe fine at 09:00', false, { date: '2026-10-17' })
  );
  doc = setStatus(doc, db.childId, 'refuted', dayToTime('2026-10-19'));
  doc = addEvidence(
    doc,
    db.childId,
    ev('Probe shows the database slow from 09:00', true, {
      date: '2026-10-24',
      author: 'Alex',
      url: 'https://example.com/probe',
    })
  );
  doc = setStatus(doc, db.childId, 'open', dayToTime('2026-10-26'));
  doc = updateStatusChange(doc, db.childId, 1, { reason: 'the probe saw the backend slow' });
  doc = addEvidence(
    doc,
    line.childId,
    ev('Typed in later, no date', true, {}, dayToTime('2026-10-25'))
  );
  doc = addEvidence(doc, line.childId, {
    ...ev('Legacy item', true, {}),
    addedAt: undefined as unknown as number,
  });
  return { doc, db: db.childId, line: line.childId };
}

describe('timelineEvents', () => {
  it('lines up dated evidence and status changes, oldest first', () => {
    const { doc, db, line } = investigation();
    const events = timelineEvents(doc);
    expect(events.map((e) => [e.kind, e.nodeId, e.at])).toEqual([
      ['evidence', db, dayToTime('2026-10-17')],
      ['status', db, dayToTime('2026-10-19')],
      ['evidence', db, dayToTime('2026-10-24')],
      ['evidence', line, dayToTime('2026-10-25')],
      ['status', db, dayToTime('2026-10-26')],
    ]);
    const undated = events.find((e) => e.kind === 'evidence' && e.nodeId === line);
    expect(undated && undated.kind === 'evidence' && undated.dated).toBe(false);
  });

  it('filters to a since day', () => {
    const { doc } = investigation();
    expect(eventsSince(doc, dayToTime('2026-10-24'))).toHaveLength(3);
  });
});

describe('changesMarkdown', () => {
  it('groups the changes by node with each one’s current status', () => {
    const { doc } = investigation();
    const md = changesMarkdown(doc, dayToTime('2026-10-24'), m);
    expect(md).toContain('## What changed since');
    expect(md).toContain('- **Database slow at peak** (now open)');
    expect(md).toContain('refuted → open, because the probe saw the backend slow');
    expect(md).toContain(
      'new strong evidence for: Probe shows the database slow from 09:00 (Alex) <https://example.com/probe>'
    );
    expect(md).toContain('- **Network link full** (now open)');
    expect(md).not.toContain('Neutral probe');
    expect(md.indexOf('Database slow')).toBeLessThan(md.indexOf('Network link'));
  });

  it('is empty when nothing changed', () => {
    const { doc } = investigation();
    expect(changesMarkdown(doc, dayToTime('2026-11-01'), m)).toBe('');
  });

  it('never prints an unsafe link', () => {
    let { doc, line } = investigation();
    doc = addEvidence(
      doc,
      line,
      ev('Bad', true, { date: '2026-10-27', url: 'javascript:alert(1)' })
    );
    expect(changesMarkdown(doc, dayToTime('2026-10-27'), m)).not.toContain('javascript:');
  });
});
