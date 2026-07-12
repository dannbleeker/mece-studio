# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Out of scope by design (not building)

The problem-structuring backlog is complete — groups 1–3 and the Why/How +
ordering group-4 items shipped (see `CHANGELOG.md`). The two items below were
reviewed and left out as project-management, not the tool's thinking-aid soul.

- **Work plan.** Per leaf / hypothesis: *analysis · data source · owner · due ·
  status (RAG)* — a table + CSV export. Triple-attested in the source decks (the
  McKinsey work plan, Minto's Issue Analysis Work Sheet, the Danish template), but
  it turns the tree into a project tracker rather than a reasoning aid. Revisit only
  if the tool grows an execution surface.
- **Richer prioritisation.** *Lead time* + *depends-on* on top of impact × ease, to
  sequence by dependency — a dependency graph is a planning tool.
- **Integrated live AI.** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app needs a backend or a stored API key — a cost/security decision the owner has deferred; the keyless prompt bridge is the shipping alternative.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents a single node at a time).

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), the on-node **＋** add-sub-issue, units, notes, collapse/expand, search, ARIA tree semantics, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs**, **Shift+drag box-select** + a bulk action, **quick capture**, **import** (Markdown outline paste-to-tree), **present** / **print** preview, loading an example, loading a named framework template, the keyboard-shortcuts overlay, the MECE review dock (flag a split → locate → one-click remedy), the **Problem brief** dialog + **why/how** tree-mode toggle, and the **inductive/deductive** logic + **Order** controls. The real-input paths are well covered; extend opportunistically as new UI lands.
