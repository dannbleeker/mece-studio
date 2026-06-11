# MECE Studio

Build **McKinsey-style issue trees** with **MECE checking built in**. A free, local-first PWA: decompose a key question into a tree, and the tool actively flags overlaps (mutually exclusive) and gaps (collectively exhaustive) as you build — then helps you prioritise branches and hang evidence on the leaves.

> **Status: M0 scaffold.** Toolchain, domain model, and deploy pipeline are in place. The canvas, decomposition, and live MECE checks land in **M1**.

Sibling to [TP Studio](https://tp-studio.struktureretsundfornuft.dk) (Theory of Constraints) — same stack, separate product.

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind 4 · Zustand 5 · `vite-plugin-pwa`.
Canvas/layout (M1): React Flow (`@xyflow/react`) + dagre. Tooling: Biome, Vitest, pnpm.

## Develop

```bash
pnpm install
pnpm dev        # start the dev server
pnpm verify     # lint + typecheck + test + build (the full gate)
```

## Deploy

Auto-deploys to GitHub Pages on every push to `main` (`.github/workflows/deploy-pages.yml`).
Custom domain bound via `public/CNAME` → `mece-studio.struktureretsundfornuft.dk`.

## License

Apache-2.0 © Dann Bleeker Pedersen
