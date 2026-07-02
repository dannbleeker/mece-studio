# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Features not yet built
- **Integrated AI (optional) — DEFERRED (owner's decision, not now).** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app would need a backend or a stored API key (a cost/security decision the owner has chosen to defer); the keyless prompt bridge is the shipping alternative. Everything else — the full deterministic tool plus PNG/PDF/PPTX/Markdown/JSON export — ships.

## 2026-07 UI/feature review — COMPLETE
All 34 review recommendations shipped. The last two — **editable native PPTX (F9)** and
**rubber-band/box select (F13)** — landed this session, alongside the four "partials to round
out" (evidence-text inline edit, on-node add-sub-issue, mixed-axis warning, canvas ARIA tree
semantics). Out of scope by design: snapshots/versioning (F12), and bulk multi-node re-parent
(drag re-parents a single node).

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), units, notes, collapse/expand, search, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs** (open a second tree → switch / close), **Shift+drag box-select** + a bulk action, **quick capture** (add several issues at once), **import** (Markdown outline paste-to-tree), **present** / **print** preview (open + exit), loading an example, loading a named framework template, the keyboard-shortcuts overlay, and the MECE review dock (flag a split → locate → one-click remedy). The real-input paths are now well covered; extend opportunistically as new UI lands.
