# Changelog

Notable changes to MECE Studio. Newest first. (Open items live in `NEXT_STEPS.md`.)

## [Unreleased]

### Added
- **Open JSON.** Load a previously saved tree back in from the header (validated; the current tree stays in undo) — completing the save/open round-trip.
- **Units on values.** Set a unit (DKK, %, hrs, FTE…) beside a node's number — it shows on the node and in the Markdown export, and survives a value roll-up.
- **Keyboard shortcuts.** Undo / redo with Ctrl/⌘+Z and Ctrl/⌘+Y (or Shift+Z), and Delete / Backspace to remove the selected node — all ignored while typing in a field, so they never hijack the inspector inputs.
- **New tree.** Start over from a fresh question via the header — the previous tree is kept in undo, so nothing is lost.
- **M5 — PNG export.** Export the whole tree as a PNG image from the canvas; `html-to-image` is loaded on demand so it stays a separate lazy chunk off the first-load bundle. The size budget now measures only the eager entry chunk(s).
- **M4 — value-driver roll-up.** On a formula split, one click rolls the children's numbers up into the parent's value (sum / product / difference); the reconciliation check then confirms the totals add up.
- **M4 — hypothesis status.** Mark any node open / supported / refuted / parked; the node gets a colour-coded left edge and the synthesis flags ✓ supported, ✗ refuted, ⊘ parked.
- **Export.** Copy the tree as a Markdown outline (each split's MECE state annotated inline) or save the full document as JSON, from the header.
- **M3 — evidence + answer-first synthesis.** Attach supporting/contradicting **evidence** (with a cyclable strength) to any node — nodes show ✓/✗ counts. A new **Synthesis** panel reads the tree answer-first: it leads with the highest-priority branch, lists branches in priority order, surfaces each node's evidence, and flags MECE gaps/overlaps — copyable as Markdown.
- **M3 — branch prioritisation.** Mark each issue's **impact × ease** in the inspector; the node shows a priority-band chip (High / Medium / Low, from the 1–9 score) so the branches worth chasing first stand out. (Leaf evidence and answer-first roll-up still to come.)
- **M2 — deeper MECE rules + decomposition scaffolds.** The engine now evaluates each axis separately: binary (A / not-A) and formula stay provably MECE; **segments** are collectively exhaustive only with an explicit "Other" bucket; other split types get a **sibling-overlap heuristic** that flags siblings sharing a content word (with generic/placeholder nouns ignored, so fresh splits don't flag themselves). `decompose()` **scaffolds** type-appropriate starter children (binary → A / not-A, segments → two + Other, process → stages, formula → terms), surfaced as "Decompose by …" buttons on leaf nodes.
- **M1 — interactive issue-tree canvas.** A React Flow + dagre (left-to-right) canvas that renders the tree from the store: select a node, add sub-issues, choose how it decomposes (freeform / segments / process / binary / formula / framework), edit labels and numeric values, and delete subtrees. The MECE engine runs live on every change — each decomposition shows mutually-exclusive / collectively-exhaustive status as coloured dots on the node and as explained warnings in the inspector. Undo/redo, localStorage persistence, and auto-fit on tree changes. 23 unit tests across the domain core + projection.
- **Project scaffold (M0).** React 19 / Vite 8 / TS 6 / Tailwind 4 / Zustand 5 / vite-plugin-pwa. Domain model (`IssueNode`, `Split` as the MECE unit, `IssueTreeDoc`) + `factory`, a minimal app shell + Zustand store seeded with a root question, and the GitHub Pages deploy pipeline. Live at <https://mece-studio.struktureretsundfornuft.dk>.
- **Local gate + CI + working agreement.** `pnpm verify` runs the full fail-fast gate — typecheck → lint/format (Biome) → dead-code (knip) → tests (Vitest) → build → bundle-size budget — via shell-free node runners (`scripts/verify.mjs`, `scripts/build.mjs`) that work under the local AppLocker policy and on CI. CI runs the same gate. `CLAUDE.md` captures the working agreement; `bundle-budget.json` is the single source of truth for the size budget.

### Fixed
- **Node styling warning.** The issue node mixed the `border` shorthand with a `borderLeft` status override, so React warned on every rerender. It now uses longhand border props — identical look, clean console.
