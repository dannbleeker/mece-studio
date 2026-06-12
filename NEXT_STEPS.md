# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Features not yet built
- **Integrated AI (optional).** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app would need a backend or a stored API key (a cost/security decision); the prompt bridge is the keyless alternative. Everything else — the full deterministic tool plus PNG/PDF/PPTX/Markdown/JSON export — ships.

## Decisions to make (raised during the autonomous build)
- **Sort siblings on the canvas by priority?** The synthesis already ranks; the canvas keeps creation order. Reordering on the canvas would make nodes jump as you change priority — deliberately left as a choice.
- **More-aggressive overlap detection** mode, vs. the current conservative shared-word heuristic.
- **Configurable formula tolerance** (currently fixed at 0.5%) — would need a small settings surface.

## Polish / refinements
- Re-fit runs on every node-count change; refine to only recentre when a new node would land off-screen, to avoid view jumps in large trees. (Deliberately not done yet — a naive version risks leaving a new off-screen node hidden.)
- Coalesce rapid label / value edits if the blur-per-undo granularity proves noisy.

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), units, notes, collapse/expand, search, Open-JSON import, export (PNG/PDF/PPTX), AI-prompt copy, the multi-document picker (create / switch / delete), loading an example, and the keyboard-shortcuts overlay. The real-input paths are now well covered; extend opportunistically as new UI lands.
