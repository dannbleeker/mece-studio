# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Idea backlog — operationalising the problem-structuring canon

Feature ideas from reviewing the classic problem-structuring literature (Minto's
*Pyramid Principle*; McKinsey-style analytical problem solving) against the tool.
The theme: the practitioner book (`docs/guide/`) already *teaches* these, but
several have no home as a live feature — these give the taught concept a place in
the app. Each is **L-effort** (schema field + migration + UI + engine/synthesis
wiring + docs), so plan before building.

**Headline**

- **SCQ(A) framing panel.** Give the doc a structured *Situation · Complication ·
  Key Question* (→ root) *· Answer* (the existing banner) block. The guide (ch. 1)
  teaches the SCQ frame but the app captures only the Q and the A. Feeds the
  synthesis/memo intro (already SCR-shaped) and a "does the question follow from
  the complication?" nudge. *Strongest fit — build first.*
- **"So-what" test / action titles.** Optional one-line insight per split (the
  takeaway its children collectively support) + a lint flagging hollow category
  labels ("Issues", "Findings", "Factors", "Analysis"). Guide ch. 9 teaches
  action titles; the synthesis and PPTX slide titles would use the insight.
- **Deductive vs inductive grouping.** A per-split `logic` flag (Minto's
  horizontal logic). Inductive → the plural-noun / dimension test; deductive →
  suppress the overlap check (an argument chain isn't a partition) and check the
  premise → premise → conclusion reading instead. Makes the MECE engine honest
  about deliberate logical arguments rather than flagging them as overlaps.

**Smaller**

- **Workplan fields.** Per leaf / hypothesis: *analysis needed · data source ·
  owner · due*, plus a table view and CSV export (the CSV exporter already
  exists). The tree tracks evidence (results) but not the plan to get it.
- **Problem-definition worksheet.** *Decision-maker · success criteria · scope /
  constraints · stakeholders* — best folded in as a second tab of the SCQ(A)
  panel above.
- **Ordering principle per split.** Minto's three orders (*time · structural ·
  degree*) as an explicit rationale that drives the existing sibling auto-sort
  (process → time, segment → size, …).

## Out of scope by design (not building)
- **Integrated live AI.** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app needs a backend or a stored API key — a cost/security decision the owner has deferred; the keyless prompt bridge is the shipping alternative.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents a single node at a time).

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), the on-node **＋** add-sub-issue, units, notes, collapse/expand, search, ARIA tree semantics, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs**, **Shift+drag box-select** + a bulk action, **quick capture**, **import** (Markdown outline paste-to-tree), **present** / **print** preview, loading an example, loading a named framework template, the keyboard-shortcuts overlay, and the MECE review dock (flag a split → locate → one-click remedy). The real-input paths are well covered; extend opportunistically as new UI lands.
