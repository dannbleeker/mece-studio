# MECE Studio

Build **McKinsey-style issue trees** with **MECE checking built in**. A free, local-first PWA: decompose a key question into a tree, and the tool actively flags overlaps (not mutually exclusive) and gaps (not collectively exhaustive) as you build — then helps you prioritise branches, track hypotheses, hang evidence on the leaves, and read the answer back out.

**Live:** <https://mece-studio.struktureretsundfornuft.dk>

Sibling to [TP Studio](https://tp-studio.struktureretsundfornuft.dk) (Theory of Constraints) — same stack, separate product.

## What it does

- **Issue trees, MECE by construction.** Decompose any node by **segment, process, binary (A / not-A), formula, framework, or freeform**. MECE is a property of each *split*, not a node: the engine evaluates **mutual exclusivity** and **collective exhaustiveness** on every change and shows the state as ME / CE dots on the node plus explained warnings in the inspector. Binary and formula splits are provably MECE; segments need an explicit "Other" bucket; looser splits get a sibling-overlap heuristic.
- **Decomposition scaffolds.** "Decompose by …" seeds clean, type-appropriate starter sub-issues (binary → A / not-A, segments → two + Other, process → stages, formula → terms) that you rename.
- **Prioritisation.** Mark each issue's **impact × ease**; nodes show a High / Medium / Low band so the 80/20 branches stand out, and the synthesis ranks by it.
- **Hypotheses & evidence.** Set a node's status (open / supported / refuted / parked) and attach supporting or contradicting **evidence** with a strength.
- **Value-driver trees.** Put numbers (with **units**) on a formula split's children and **roll them up** into the parent — combining by **sum, product, or difference** — with a reconciliation check, plus a **sensitivity** readout that ranks which driver moves the value most (±10%).
- **Answer-first synthesis.** A Synthesis panel reads the tree back leading with the highest-priority branch, surfaces each node's evidence, and flags MECE gaps/overlaps — copyable as Markdown.
- **Notes** per node for rationale, assumptions, and data sources.
- **Export & round-trip.** PNG of the canvas, a Markdown outline, and JSON **save / open**.
- **Navigate big trees.** **Collapse** any subtree (a ▶ N badge shows what's hidden) or Collapse all / Expand all at once; **search** rings matching nodes and zooms to them.
- **Built for flow.** Rename inline (double-click or Enter / F2), **Tab** to add a child, **drag** a node onto another to re-parent its subtree (with a drop-target highlight), **duplicate** or **reorder** a branch from the inspector. Undo / redo (with `Ctrl/⌘+Z` · `Y` and `Delete` shortcuts), auto-layout (dagre, left-to-right), and localStorage persistence — no account, no backend.

## Architecture

The domain core (`src/domain`) is framework-free and pure — the tree operations, MECE engine, roll-up, priority, synthesis, and export are all plain functions with unit tests. The Zustand store wraps them with history + persistence, and the React / React Flow layer renders. One source of truth per concern; the view holds no business logic.

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind 4 · Zustand 5 · React Flow (`@xyflow/react`) + dagre · `vite-plugin-pwa`.
Tooling: Biome, Vitest, knip, pnpm.

## Develop

```bash
pnpm install
pnpm dev        # start the dev server
pnpm verify     # typecheck → lint/format → dead-code → test → build → size budget
```

`pnpm verify` is the single source of truth for "is it green", and CI runs the exact same gate. (Scripts invoke each tool in node form — `node ./node_modules/<tool>/…` — so they work under the local AppLocker policy.)

## Deploy

Auto-deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy-pages.yml`).
Custom domain bound via `public/CNAME` → `mece-studio.struktureretsundfornuft.dk`.

## License

Apache-2.0 © Dann Bleeker Pedersen
