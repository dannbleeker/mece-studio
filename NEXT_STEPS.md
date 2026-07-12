# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Idea backlog — from the problem-structuring canon

Groups 1–3 of this backlog **shipped** — the Problem brief + key-question nudge,
the whole-sentence / so-what / hypothesis-quality / branch-count / altitude
coaching advisories, and deductive-vs-inductive split logic (see `CHANGELOG.md`).
The remaining ideas, sourced from Minto's *Pyramid Principle*, Chevallier's
*Analytical Problem-Solving*, and the McKinsey-Way work-plan material, are still
open. Ideas are in our own words; no source material lives in the repo. Each is
**L-effort** (schema field + UI + wiring + docs) — plan before building.

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
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), the on-node **＋** add-sub-issue, units, notes, collapse/expand, search, ARIA tree semantics, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs**, **Shift+drag box-select** + a bulk action, **quick capture**, **import** (Markdown outline paste-to-tree), **present** / **print** preview, loading an example, loading a named framework template, the keyboard-shortcuts overlay, the MECE review dock (flag a split → locate → one-click remedy), and the **Problem brief** dialog + **inductive/deductive** split-logic toggle. The real-input paths are well covered; extend opportunistically as new UI lands.
