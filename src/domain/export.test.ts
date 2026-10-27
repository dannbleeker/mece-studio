import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { addFact, setExplains, setKillTest, setPrediction } from './diagnosis';
import { toMarkdown } from './export';
import { createDoc, createEvidence } from './factory';
import { recomputeMece } from './mece';
import {
  addChild,
  addEvidence,
  setDecomposition,
  setDetail,
  setNodeValue,
  setPriority,
  setStatus,
  updateEvidence,
  updateStatusChange,
} from './tree';
import type { NodeId } from './types';

describe('toMarkdown', () => {
  it('renders the root as an H1 and children as nested bullets', () => {
    let doc = createDoc('Why are profits falling?', 0);
    doc = addChild(doc, doc.rootId, 'Revenue down').doc;
    doc = addChild(doc, doc.rootId, 'Costs up').doc;
    const md = toMarkdown(doc, en);
    expect(md).toContain('# Why are profits falling?');
    expect(md).toContain('- Revenue down');
    expect(md).toContain('- Costs up');
  });

  it('annotates value, status, priority, notes, and evidence', () => {
    let doc = createDoc('Root', 0);
    const { doc: d, childId } = addChild(doc, doc.rootId, 'Driver');
    doc = d;
    doc = setNodeValue(doc, childId, { amount: 100, unit: 'M DKK' });
    doc = setStatus(doc, childId, 'supported');
    doc = setPriority(doc, childId, { impact: 'high', ease: 'high' });
    doc = setDetail(doc, childId, 'A note');
    doc = addEvidence(doc, childId, createEvidence('Backed by data', true, 'strong'));

    const md = toMarkdown(doc, en);
    const value = en.exports.valueSuffix({ amount: 100, unit: 'M DKK' });
    const priority = en.exports.priorityTag({ level: en.enums.level.high });
    expect(md).toContain(`- Driver${value} — ✓ ${en.enums.status.supported}, ${priority}`);
    expect(md).toMatch(/_A note_/);
    expect(md).toContain(`  - ✓ (${en.enums.evidenceStrength.strong}) Backed by data`);
  });

  it('annotates a split with its decomposition and MECE state', () => {
    let doc = createDoc('Root', 0);
    doc = addChild(doc, doc.rootId, 'Yes').doc;
    doc = addChild(doc, doc.rootId, 'No').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    expect(toMarkdown(doc, en)).toContain(
      en.exports.meceNote({ type: 'binary', exclusive: 'pass', exhaustive: 'pass' }).trim()
    );
  });

  it('omits the meta tag for a plain, open, unprioritised node', () => {
    let doc = createDoc('Root', 0);
    doc = addChild(doc, doc.rootId, 'Plain').doc;
    const line = toMarkdown(doc, en)
      .split('\n')
      .find((l) => l.includes('- Plain'));
    expect(line).toBe('- Plain');
  });

  it('falls back to the document title when the root node is missing', () => {
    const doc = createDoc('Orphaned tree', 0);
    const broken = { ...doc, nodes: {} }; // a corrupt import: rootId dangles
    const md = toMarkdown(broken, en);
    expect(md.startsWith('# ')).toBe(true);
    expect(md).toContain(`# ${doc.title}`);
    expect(md).not.toContain('undefined');
  });

  it('renders a unit-less value and evidence hung on the root', () => {
    let doc = createDoc('Root', 0);
    const { doc: d, childId } = addChild(doc, doc.rootId, 'Count');
    doc = d;
    doc = setNodeValue(doc, childId, { amount: 42 }); // no unit
    doc = addEvidence(doc, doc.rootId, createEvidence('Root-level proof', false, 'indicative'));
    const md = toMarkdown(doc, en);
    expect(md).toContain(`- Count${en.exports.valueSuffix({ amount: 42 })}`); // unit-less suffix
    // contradicting evidence on the root
    expect(md).toContain(`- ✗ (${en.enums.evidenceStrength.indicative}) Root-level proof`);
  });

  it('nests descendants with indentation', () => {
    let doc = createDoc('Root', 0);
    const { doc: d1, childId } = addChild(doc, doc.rootId, 'Parent');
    doc = addChild(d1, childId, 'Child').doc;
    const md = toMarkdown(doc, en);
    expect(md).toContain('- Parent');
    expect(md).toContain('  - Child'); // a grandchild indents one level deeper
  });
});

describe('toMarkdown — provenance and status history', () => {
  function sample() {
    let doc = createDoc('Why is the app slow?', 0);
    const h = addChild(doc, doc.rootId, 'Database slow at peak');
    doc = addEvidence(h.doc, h.childId, {
      id: 'ev1',
      summary: 'Probe: query time 120 ms to 450 ms at peak',
      supports: true,
      strength: 'indicative',
      author: 'Alex',
      date: '2026-10-24',
      source: 'Synthetic monitor',
      url: 'https://teams.microsoft.com/l/message/1',
    });
    doc = setStatus(doc, h.childId, 'refuted', Date.UTC(2026, 9, 19, 12));
    doc = setStatus(doc, h.childId, 'open', Date.UTC(2026, 9, 26, 12));
    doc = updateStatusChange(doc, h.childId, 1, { reason: 'Neutral probe saw it slow' });
    return doc;
  }

  it('carries who, when, where and the link on each evidence line', () => {
    const md = toMarkdown(sample(), en);
    expect(md).toContain(
      `Probe: query time 120 ms to 450 ms at peak${en.exports.evidenceProvenance({
        author: 'Alex',
        day: '2026-10-24',
        source: 'Synthetic monitor',
        url: 'https://teams.microsoft.com/l/message/1',
      })}`
    );
  });

  it('drops a link that is not http(s) rather than exporting it', () => {
    let doc = sample();
    const id = Object.keys(doc.nodes).find((k) => k !== doc.rootId) as NodeId;
    doc = updateEvidence(doc, id, 'ev1', { url: 'javascript:alert(1)' });
    expect(toMarkdown(doc, en)).not.toContain('javascript:');
  });

  it('lists the status history under the node, with the reason', () => {
    const md = toMarkdown(sample(), en);
    expect(md).toContain(
      en.exports.statusHistory({
        entries: [
          { at: Date.UTC(2026, 9, 19, 12), from: 'open', to: 'refuted' },
          {
            at: Date.UTC(2026, 9, 26, 12),
            from: 'refuted',
            to: 'open',
            reason: 'Neutral probe saw it slow',
          },
        ],
      })
    );
  });
});

describe('toMarkdown — diagnosis', () => {
  function sample() {
    let doc = createDoc('Why are page loads slow on Monday mornings?', 0);
    const h = addChild(doc, doc.rootId, 'Network link too thin');
    doc = addFact(h.doc, { id: 'f1', dimension: 'where', is: 'Region A', isNot: 'Other regions' });
    doc = addFact(doc, { id: 'f2', dimension: 'extent', is: 'Some fast lines hit too' });
    doc = setExplains(doc, h.childId, 'f1', 'yes');
    doc = setExplains(doc, h.childId, 'f2', 'no');
    doc = setKillTest(doc, h.childId, 'Fast-line store slows at the same minute');
    doc = setPrediction(doc, h.childId, 'Telemetry-off stores stay fast on 31 Oct');
    return doc;
  }

  it('lists the is / is not facts under the question', () => {
    const md = toMarkdown(sample(), en);
    expect(md).toContain(en.exports.factsHeading);
    expect(md).toContain(
      en.exports.factLine({ dimension: 'where', is: 'Region A', isNot: 'Other regions' })
    );
    expect(md).toContain(
      en.exports.factLine({ dimension: 'extent', is: 'Some fast lines hit too' })
    );
  });

  it('carries the kill test, the prediction and the verdicts on the node', () => {
    const md = toMarkdown(sample(), en);
    expect(md).toContain(
      en.exports.killTestLine({ text: 'Fast-line store slows at the same minute' })
    );
    expect(md).toContain(
      en.exports.predictionLine({ text: 'Telemetry-off stores stay fast on 31 Oct' })
    );
    expect(md).toContain(
      en.exports.explainsLine({ yes: 1, total: 2, failed: ['Some fast lines hit too'] })
    );
  });
});
