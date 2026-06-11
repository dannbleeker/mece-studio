# Changelog

Notable changes to MECE Studio. Newest first. (Open items live in `NEXT_STEPS.md`.)

## [Unreleased]

### Added
- **Export.** Copy the tree as a Markdown outline (each split's MECE state annotated inline) or save the full document as JSON, from the header.
- **M3 — branch prioritisation.** Mark each issue's **impact × ease** in the inspector; the node shows a priority-band chip (High / Medium / Low, from the 1–9 score) so the branches worth chasing first stand out. (Leaf evidence and answer-first roll-up still to come.)
- **M2 — deeper MECE rules + decomposition scaffolds.** The engine now evaluates each axis separately: binary (A / not-A) and formula stay provably MECE; **segments** are collectively exhaustive only with an explicit "Other" bucket; other split types get a **sibling-overlap heuristic** that flags siblings sharing a content word (with generic/placeholder nouns ignored, so fresh splits don't flag themselves). `decompose()` **scaffolds** type-appropriate starter children (binary → A / not-A, segments → two + Other, process → stages, formula → terms), surfaced as "Decompose by …" buttons on leaf nodes.
- **M1 — interactive issue-tree canvas.** A React Flow + dagre (left-to-right) canvas that renders the tree from the store: select a node, add sub-issues, choose how it decomposes (freeform / segments / process / binary / formula / framework), edit labels and numeric values, and delete subtrees. The MECE engine runs live on every change — each decomposition shows mutually-exclusive / collectively-exhaustive status as coloured dots on the node and as explained warnings in the inspector. Undo/redo, localStorage persistence, and auto-fit on tree changes. 23 unit tests across the domain core + projection.
- **Project scaffold (M0).** React 19 / Vite 8 / TS 6 / Tailwind 4 / Zustand 5 / vite-plugin-pwa. Domain model (`IssueNode`, `Split` as the MECE unit, `IssueTreeDoc`) + `factory`, a minimal app shell + Zustand store seeded with a root question, and the GitHub Pages deploy pipeline. Live at <https://mece-studio.struktureretsundfornuft.dk>.
- **Local gate + CI + working agreement.** `pnpm verify` runs the full fail-fast gate — typecheck → lint/format (Biome) → dead-code (knip) → tests (Vitest) → build → bundle-size budget — via shell-free node runners (`scripts/verify.mjs`, `scripts/build.mjs`) that work under the local AppLocker policy and on CI. CI runs the same gate. `CLAUDE.md` captures the working agreement; `bundle-budget.json` is the single source of truth for the size budget.
