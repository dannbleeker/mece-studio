# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Features not yet built
- **Integrated AI (optional) — DEFERRED (owner's decision, not now).** The keyless **AI-assist prompts** ship — copy a _critique_ or _suggest-a-split_ prompt (tree embedded) into your own LLM. Calling an LLM directly from the app would need a backend or a stored API key (a cost/security decision the owner has chosen to defer); the keyless prompt bridge is the shipping alternative. Everything else — the full deterministic tool plus PNG/PDF/PPTX/Markdown/JSON export — ships.

## Tooling backlog
- **Extend the Playwright e2e suite.** Covered (`pnpm e2e`, also a CI job): drag-to-reparent + drop-target highlight, inline editing (double-click / Enter / Tab), units, notes, collapse/expand, search, Open-JSON import, export (PNG/PDF/PPTX), AI-prompt copy, the multi-document picker (create / switch / delete), loading an example, loading a named framework template, the keyboard-shortcuts overlay, and the MECE review dock (flag a split → locate → one-click remedy). The real-input paths are now well covered; extend opportunistically as new UI lands.
