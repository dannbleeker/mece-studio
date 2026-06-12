# Third-party notices &amp; trademarks

MECE Studio is free, local-first software. This file records attribution for
third-party software it depends on and trademark notices for products and
methods it references. It is informational and does not modify either license
(see `LICENSE` for the software and `LICENSE-BOOK` for the book).

## Methods &amp; trademarks

- **MECE** ("Mutually Exclusive, Collectively Exhaustive"), the **issue tree**,
  and **hypothesis-driven problem solving** are problem-structuring concepts
  popularised by **McKinsey &amp; Company** and described in widely published
  business literature. MECE Studio implements these methods descriptively as a
  generic thinking tool. **McKinsey &amp; Company is not affiliated with, does not
  sponsor, and does not endorse MECE Studio.** "McKinsey" is a trademark of its
  owner and is used here only nominatively, to describe the lineage of the
  methods.

- Other product names that may appear in the app, book, or documentation —
  for example **PowerPoint** and **Excel** (Microsoft), **Claude** (Anthropic),
  and **ChatGPT** (OpenAI) — are trademarks of their respective owners and are
  used only nominatively, for interoperability or comparative reference. No
  affiliation or endorsement is implied.

## Open-source dependencies

MECE Studio's production runtime depends on third-party open-source software,
including **React** and **React DOM** (MIT), **React Flow** / `@xyflow/react`
(MIT), **Zustand** (MIT), **dagre** (MIT), **jsPDF** (MIT), **pptxgenjs** (MIT),
**html-to-image** (MIT), and **nanoid** (MIT).

The development toolchain includes **Vite**, **TypeScript**, **Tailwind CSS**,
**Biome**, **Vitest**, **Playwright**, **knip**, **marked**, and
**vite-plugin-pwa**, among others.

Each dependency carries its own license. The full, authoritative list with exact
versions is produced by the package manager's manifest (`package.json` and
`pnpm-lock.yaml`) in this repository; the corresponding license texts ship inside
each package under `node_modules/<pkg>/LICENSE`. MECE Studio is grateful to the
maintainers of all of the above.

## MECE Studio's own license

- **Software** (all source code, scripts, configuration, the in-app user guide,
  and the application) — **Apache License 2.0**. See `LICENSE`.
- **Book** (the long-form practitioner guide under `docs/guide/` and its
  generated PDF and EPUB) — **Creative Commons Attribution-NonCommercial 4.0
  International (CC BY-NC 4.0)**. See `LICENSE-BOOK`.

Copyright © 2026 Dann Bleeker Pedersen.
