import { describe, expect, it } from 'vitest';
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
} from './tree';

describe('toMarkdown', () => {
  it('renders the root as an H1 and children as nested bullets', () => {
    let doc = createDoc('Why are profits falling?', 0);
    doc = addChild(doc, doc.rootId, 'Revenue down').doc;
    doc = addChild(doc, doc.rootId, 'Costs up').doc;
    const md = toMarkdown(doc);
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

    const md = toMarkdown(doc);
    expect(md).toContain('- Driver (100 M DKK) — ✓ supported, High priority');
    expect(md).toMatch(/_A note_/);
    expect(md).toContain('  - ✓ (strong) Backed by data');
  });

  it('annotates a split with its decomposition and MECE state', () => {
    let doc = createDoc('Root', 0);
    doc = addChild(doc, doc.rootId, 'Yes').doc;
    doc = addChild(doc, doc.rootId, 'No').doc;
    doc = setDecomposition(doc, doc.rootId, 'binary');
    doc = recomputeMece(doc);
    expect(toMarkdown(doc)).toContain('_[binary · ME:pass · CE:pass]_');
  });

  it('omits the meta tag for a plain, open, unprioritised node', () => {
    let doc = createDoc('Root', 0);
    doc = addChild(doc, doc.rootId, 'Plain').doc;
    const line = toMarkdown(doc)
      .split('\n')
      .find((l) => l.includes('- Plain'));
    expect(line).toBe('- Plain');
  });

  it('falls back to the document title when the root node is missing', () => {
    const doc = createDoc('Orphaned tree', 0);
    const broken = { ...doc, nodes: {} }; // a corrupt import: rootId dangles
    const md = toMarkdown(broken);
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
    const md = toMarkdown(doc);
    expect(md).toContain('- Count (42)'); // unit-less value suffix
    expect(md).toContain('- ✗ (indicative) Root-level proof'); // contradicting evidence on the root
  });
});
