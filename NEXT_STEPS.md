# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Features not yet built
- **Visual export: PDF / PPTX** (code-split, like PNG). PNG, Markdown, and JSON save/open are shipped. Note: jspdf pulls in `core-js`, which pnpm 11 blocks via its build-script guard — approve it in `pnpm-workspace.yaml` (`allowBuilds: { core-js: false }`) before re-adding PDF.
- **Value-driver sensitivity** — one-driver-at-a-time swing on a formula tree (numeric roll-up + units are shipped).
- **AI tier-3** — suggest a MECE split for a node; critique a tree for overlaps/gaps.

## Decisions to make (raised during the autonomous build, 2026-06-11)
- **Manual node drag** vs. auto-layout-only. Today the canvas is dagre-only; manual positions would need to survive a re-layout.
- **Sort siblings on the canvas by priority?** The synthesis already ranks; the canvas keeps creation order. Reordering on the canvas would make nodes jump as you change priority — deliberately left as a choice.
- **More-aggressive overlap detection** mode, vs. the current conservative shared-word heuristic.
- **Configurable formula tolerance** (currently fixed at 0.5%) — would need a small settings surface.

## Polish / refinements
- Re-fit runs on every node-count change; refine to only recentre when a new node would land off-screen, to avoid view jumps in large trees. (Deliberately not done yet — a naive version risks leaving a new off-screen node hidden.)
- Inline-on-canvas label editing; coalesce rapid edits if the blur-per-undo granularity proves noisy.
- Canvas indicator for nodes that carry **notes** (notes show in the inspector + Markdown export, but not on the node box).

## Tooling backlog
- Turn `knip`'s `exports` / `types` rules back on and prune anything genuinely unused.
- Add a jsdom component smoke test (React Flow needs ResizeObserver mocks) + a Playwright e2e — the keyboard, units, notes, and Open-JSON glue is verified live but has no component-level test.
