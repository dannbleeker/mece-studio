# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Features not yet built
- **Integrated AI (optional) — DEFERRED (owner's decision, not now).** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app would need a backend or a stored API key (a cost/security decision the owner has chosen to defer); the keyless prompt bridge is the shipping alternative. Everything else — the full deterministic tool plus PNG/PDF/PPTX/Markdown/JSON export — ships.

## Deferred from the 2026-07 UI/feature review implementation
These are the review recommendations not yet shipped — the heaviest items, left as
clean follow-ups (everything else from the review landed):
- **Multi-select for bulk canvas actions (F13).** A `selectedIds` model + React Flow
  rubber-band/shift-select + a selection action bar (bulk delete / status / priority /
  re-parent in one undo step). The batch-op precedent is `addChildren`/`captureChildren`.
- **Responsive / mobile layout (U8).** The editing header wraps but there's no small-screen
  treatment: collapse secondary header clusters under ⋯ below ~640px and make the inspector
  a bottom sheet / slide-over so the canvas keeps full width.
- **Editable native PPTX (F9).** Render the tree as native pptx text boxes + connector lines
  from the dagre positions (instead of one embedded raster), keeping the raster path as a
  fallback for very large trees.
- **Partials to round out:** inline-edit of evidence *text* (U6 shipped strength/stance);
  an on-node "decompose" affordance (U4 shipped the empty-canvas coach); a lexical mixed-axis
  overlap warning (F2 shipped the dimension field); `role=tree`/`treeitem` AT semantics on the
  canvas (F4 shipped keyboard nav). Snapshots/versioning (F12) stays out of scope by design.

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), units, notes, collapse/expand, search, Open-file (JSON) import, export (PNG/PDF/PPTX/JSON), AI-prompt copy, the multi-document picker (create / switch / delete), the document **tabs** (open a second tree → switch / close), **quick capture** (add several issues at once), **import** (Markdown outline paste-to-tree), **present** / **print** preview (open + exit), loading an example, loading a named framework template, the keyboard-shortcuts overlay, and the MECE review dock (flag a split → locate → one-click remedy). The real-input paths are now well covered; extend opportunistically as new UI lands.
