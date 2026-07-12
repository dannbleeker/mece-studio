# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Idea backlog — operationalising the problem-structuring canon

Feature ideas from reviewing the classic problem-structuring literature against
the tool: Barbara Minto's *Pyramid Principle*, Arnaud Chevallier's *Analytical
Problem-Solving*, and the McKinsey-Way issue-tree / work-plan material. Recurring
theme: the practitioner book (`docs/guide/`) already *teaches* these, but several
have no home as a live feature. Ideas are in our own words; no source material
lives in the repo. Most are **L-effort** (schema field + migration + UI +
engine/synthesis wiring + docs) — plan before building.

### Framing & problem definition
- **Problem brief / "Problem Identity Card".** A structured brief on the doc,
  combining Minto's problem-definition sheet and Chevallier's identity card:
  *Situation / key facts · Complication / need for change · Key question (→ root) ·
  Answer (existing banner) · Owner · Decision-makers · Success criteria · In scope ·
  Out of scope · Desired outcome*. Feeds the SCR-shaped synthesis/memo intro and a
  "does the question follow from the complication?" nudge. **Strongest fit — build
  first.** (Merges the earlier SCQ-panel + problem-worksheet ideas.)
- **Key-question quality nudge.** Coach the root toward a good key question — a
  "how"/"why" question, specific & measurable, solution-oriented, single (not
  compound), ≤ ~2 sentences — flagging generic / vague / hypothesis-laden phrasings.

### Node & label discipline
- **Whole-sentence / "it's an idea, not a title" lint.** Nudge bare 1–2-word noun
  labels ("Revenue", "Advertising costs", "Issues") toward a full question, action
  verb, or hypothesis ("How can we cut advertising costs 10% without losing share?").
  Every source hammers this.
- **"So-what" insight line per split.** An optional one-liner stating the takeaway
  the children collectively support (Minto's synthesis / action title); the
  synthesis and PPTX slide titles use it instead of a topic label.
- **Hypothesis-quality nudge.** When a node carries a hypothesis, coach it toward a
  specific, provable *statement* (not a question, not vague like "realign X"),
  ideally with a number.

### MECE-engine lints (deterministic, on-brand)
- **Branch-count coaching.** Flag a split with **> 7** children (a "laundry list",
  over-weighting CE) and coach the 3–5 sweet spot; optionally note a tree that is
  *all* binary (over-weighting ME). Trivial and high-precision.
- **Similar-altitude / no-outlier check.** Coach when siblings sit at different
  conceptual levels / weights (Minto "same level of abstraction"; Chevallier "no
  outlier in a column").
- **Deductive vs inductive split logic.** A per-split `logic` flag (Minto's
  horizontal logic). Inductive → the plural-noun / name-the-group test (= our
  dimension); deductive → suppress the overlap check (an argument chain isn't a
  partition) and check the premise → premise → conclusion reading. Stops the engine
  flagging deliberate arguments as overlaps.

### Tree shape & workflow
- **Why-tree vs How-tree mode.** Tag a tree diagnostic ("why?", causes) or
  prescriptive ("how?", alternative solutions) and keep it consistent — warning when
  a "how" tree is really a sequential *process* (a distinct, existing split type).
  Optionally surface Minto's logic / issue / hypothesis tree distinction.
- **Work plan.** Per leaf / hypothesis: *analysis · data source · end product ·
  owner · due · status (RAG / started–done)* — a table view + CSV export (the CSV
  exporter already exists). Canonical columns triple-attested (the McKinsey work
  plan, Minto's Issue Analysis Work Sheet, the Danish issue-tree template). The tree
  tracks evidence (results) but not the plan to get them.
- **Ordering principle per split.** Minto's three orders (*importance · time ·
  structure*) as an explicit rationale that drives the existing sibling auto-sort.
- **Richer prioritisation (stretch).** Add *lead time* and *depends-on* to the
  impact × ease priority, so the synthesis / work plan can sequence by dependency.

## Out of scope by design (not building)
- **Integrated live AI.** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app needs a backend or a stored API key — a cost/security decision the owner has deferred; the keyless prompt bridge is the shipping alternative.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents a single node at a time).

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), the on-node **＋** add-sub-issue, units, notes, collapse/expand, search, ARIA tree semantics, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs**, **Shift+drag box-select** + a bulk action, **quick capture**, **import** (Markdown outline paste-to-tree), **present** / **print** preview, loading an example, loading a named framework template, the keyboard-shortcuts overlay, and the MECE review dock (flag a split → locate → one-click remedy). The real-input paths are well covered; extend opportunistically as new UI lands.
