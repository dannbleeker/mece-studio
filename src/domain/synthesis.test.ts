import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/locales/en';
import { createDoc, createEvidence } from './factory';
import { recomputeMece } from './mece';
import { synthesise, verdict } from './synthesis';
import {
  addChild,
  addEvidence,
  setAnswer,
  setDecomposition,
  setDimension,
  setNodeValue,
  setOperator,
  setPriority,
  setProblemBrief,
  setSplitSummary,
  setStatus,
} from './tree';

describe('synthesise', () => {
  it('prompts to decompose when there are no branches yet', () => {
    const out = synthesise(createDoc('Why?', 0), en);
    expect(out).toContain('# Why?');
    expect(out).toContain(en.exports.synthNoBranches);
    expect(out).toContain(en.exports.synthLeadTip); // no-priority lead
  });

  it('leads with the highest-priority branch and orders branches by priority', () => {
    let doc = createDoc('Q', 0);
    const lo = addChild(doc, doc.rootId, 'Low branch');
    doc = lo.doc;
    const hi = addChild(doc, doc.rootId, 'High branch');
    doc = hi.doc;
    doc = setPriority(doc, lo.childId, { impact: 'low', ease: 'low' });
    doc = setPriority(doc, hi.childId, { impact: 'high', ease: 'high' });

    const out = synthesise(doc, en);
    expect(out).toContain(en.exports.synthLead({ label: 'High branch' }));
    expect(out.indexOf('High branch')).toBeLessThan(out.indexOf('Low branch'));
  });

  it('marks hypothesis status, shows evidence, and falls back to the tip lead without priorities', () => {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'Supported claim');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'Refuted claim');
    doc = b.doc;
    const c = addChild(doc, doc.rootId, 'Parked claim');
    doc = c.doc;
    doc = setStatus(doc, a.childId, 'supported');
    doc = setStatus(doc, b.childId, 'refuted');
    doc = setStatus(doc, c.childId, 'parked');
    doc = addEvidence(doc, a.childId, createEvidence('It works', true, 'strong'));

    const out = synthesise(doc, en);
    expect(out).toContain('✓ Supported claim');
    expect(out).toContain('✗ Refuted claim');
    expect(out).toContain('⊘ Parked claim');
    expect(out).toContain(en.exports.synthEvidence({ items: ['✓ It works'] }));
    expect(out).toContain(en.exports.synthLeadTip); // no priorities → tip lead
  });

  it('shows contradicting evidence with an ✗ mark', () => {
    let doc = createDoc('Q', 0);
    const a = addChild(doc, doc.rootId, 'Claim');
    doc = a.doc;
    doc = addEvidence(doc, a.childId, createEvidence('Counter-point', false, 'indicative'));
    expect(synthesise(doc, en)).toContain(en.exports.synthEvidence({ items: ['✗ Counter-point'] }));
  });

  it('uses the document title in the heading when the root node is missing', () => {
    const doc = createDoc('Orphaned', 0);
    const broken = { ...doc, nodes: {} }; // corrupt import: rootId dangles
    const out = synthesise(broken, en);
    expect(out).toContain(`# ${doc.title}`);
    expect(out).toContain(en.exports.synthNoBranches);
  });

  it('surfaces values, roll-up, and the top sensitivity driver on a formula split', () => {
    let doc = createDoc('Profit', 0);
    doc = setNodeValue(doc, doc.rootId, { amount: 100, unit: 'M' });
    const a = addChild(doc, doc.rootId, 'Revenue');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'Cost');
    doc = b.doc;
    doc = setNodeValue(doc, a.childId, { amount: 160 });
    doc = setNodeValue(doc, b.childId, { amount: 60 });
    doc = setDecomposition(doc, doc.rootId, 'formula');
    doc = setOperator(doc, doc.rootId, 'difference');
    const out = synthesise(doc, en);
    expect(out).toContain(en.exports.synthValue({ amount: 100, unit: 'M' }));
    expect(out).toContain(en.exports.synthRollUp({ value: 100 }));
    expect(out).toContain(en.exports.synthSensitivity({ label: '' }).trim());
  });

  it('leads with the governing answer and a verdict from branch status', () => {
    let doc = createDoc('Should we enter?', 0);
    doc = setAnswer(doc, 'Yes — enter via partnership');
    const a = addChild(doc, doc.rootId, 'Market attractive');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'We can win');
    doc = b.doc;
    doc = setStatus(doc, a.childId, 'supported');
    doc = setStatus(doc, b.childId, 'refuted');
    const out = synthesise(doc, en);
    expect(out).toContain(`${en.exports.markers.answer} Yes — enter via partnership`);
    expect(out).toContain(
      en.exports.verdictLine({
        parts: [
          en.exports.verdictBranches({ supported: 1, total: 2 }),
          en.exports.verdictRefuted({ count: 1 }),
        ],
        // 1 supported vs 1 refuted is not "partially holds": `supported > refuted`
        // is false, so it falls through to `doubt`. Pinning the boundary here
        // because it is the case the wording is easiest to get wrong.
        stance: en.exports.verdictStance.doubt,
      })
    );
  });

  it('reads as partially holding only when the supported branches outnumber the refuted', () => {
    let doc = createDoc('Should we enter?', 0);
    const a = addChild(doc, doc.rootId, 'Market attractive');
    doc = a.doc;
    const b = addChild(doc, doc.rootId, 'We can win');
    doc = b.doc;
    const c = addChild(doc, doc.rootId, 'We can fund it');
    doc = c.doc;
    doc = setStatus(doc, a.childId, 'supported');
    doc = setStatus(doc, b.childId, 'supported');
    doc = setStatus(doc, c.childId, 'refuted');
    expect(synthesise(doc, en)).toContain(en.exports.verdictStance.partial);
  });

  it('has no verdict until at least one branch is tested', () => {
    let doc = createDoc('Q', 0);
    doc = addChild(doc, doc.rootId, 'A').doc;
    expect(verdict(doc, en)).toBeNull();
  });

  it('notes the split dimension when one is named', () => {
    let doc = createDoc('Q', 0);
    const causes = addChild(doc, doc.rootId, 'Causes');
    doc = causes.doc;
    doc = addChild(doc, causes.childId, 'North').doc;
    doc = addChild(doc, causes.childId, 'South').doc;
    doc = setDecomposition(doc, causes.childId, 'segment');
    doc = setDimension(doc, causes.childId, 'geography');
    expect(synthesise(doc, en)).toContain(en.exports.synthDimension({ dimension: 'geography' }));
  });

  it('opens with the brief situation → complication and shows a split so-what', () => {
    let doc = createDoc('How can we restore profit?', 0);
    doc = setProblemBrief(doc, { situation: 'Stable co', complication: 'Margin fell to 9%' });
    doc = addChild(doc, doc.rootId, 'Revenue').doc;
    doc = addChild(doc, doc.rootId, 'Costs').doc;
    doc = setSplitSummary(doc, doc.rootId, 'Both sides are squeezing profit');

    const out = synthesise(doc, en);
    expect(out).toContain(`${en.exports.markers.situation} Stable co`);
    expect(out).toContain(`${en.exports.markers.complication} Margin fell to 9%`);
    expect(out).toContain('» Both sides are squeezing profit');
    // SCR order: situation before complication before the branches.
    expect(out.indexOf(en.exports.markers.situation)).toBeLessThan(
      out.indexOf(en.exports.markers.complication)
    );
    expect(out.indexOf(en.exports.markers.complication)).toBeLessThan(out.indexOf('- Revenue'));
  });

  it('flags MECE overlaps and gaps on a branch', () => {
    let doc = createDoc('Q', 0);
    const causes = addChild(doc, doc.rootId, 'Causes');
    doc = causes.doc;
    doc = addChild(doc, causes.childId, 'Customer growth').doc; // shares "customer"
    doc = addChild(doc, causes.childId, 'Customer churn').doc;
    doc = setDecomposition(doc, causes.childId, 'segment'); // no "Other" → gap
    doc = recomputeMece(doc);

    expect(synthesise(doc, en)).toContain(en.exports.synthMeceFlags({ overlap: true, gap: true }));
  });
});
