# MECE Studio — working agreement & project guide

MECE Studio is a local-first PWA for building McKinsey-style **issue trees** with **MECE checking built in**. Sibling to TP Studio; same stack, separate product. The soul is a *thinking aid* that flags overlaps (mutually exclusive) and gaps (collectively exhaustive) at every split — not just a diagram tool.

## Stack & layout
- React 19 · Vite 8 · TypeScript 6 · Tailwind 4 · Zustand 5 · vite-plugin-pwa. Canvas/layout (from M1): React Flow (`@xyflow/react`) + dagre. Tooling: Biome · Vitest · knip · pnpm. Node 22+ (dev on 24).
- `src/domain/` — **framework-free, pure, unit-tested core**: types, `factory`, and the MECE rule engine. No React/DOM here.
- `src/store/` — Zustand. `src/components/` — React / React Flow UI. `src/services/` — storage / PWA / export (added as needed). `src/i18n/` — the message catalogue (below).
- **Key model decisions:**
  - MECE is a property of the **`Split`** (a node's decomposition), not the node. Strict tree → edges are derived from splits.
  - **The tree invariant is enforced at the door.** A document is a strict tree: every node reachable from the root exactly once. `coerceDoc` (`services/storage.ts`) rejects anything else via `isStrictTree`, so the many walkers that recurse through `childrenOf` — exporters, print preview, sensitivity roll-up — are safe without each carrying its own `seen` set. Add the guard to the seam, not to the sixth walker.
  - **Coaching advisories** (`domain/advisories.ts`) are a separate `info`-only channel — they never enter the MECE engine's ME/CE result, `reviewCount` / `flaggedSplits`, or the health chip. New tree-quality nudges go here, not into the rule engine.
  - **One sibling-order seam:** `orderSiblings(doc, byPriorityDefault)` (`domain/priority.ts`) is the only view-layer sibling reordering; a split's optional `order` (importance / time / structure) overrides the global "sort by priority" setting — don't add a second sort path.

## Language — the app is English-only, the architecture is not
Every user-facing string lives in a typed catalogue. Adding a language is translation work with the compiler checking it; there is no runtime i18n dependency.
- **`domain/` is language-free, not just framework-free.** The rule engine and the coaching lints return `{ code, params }` refs with **raw** numbers and enum members (`domain/messages.ts`); the view and export edge renders them. Domain tests assert what a rule *found*, never what it *said*. A new rule means a new code in `domain/messages.ts` first — the catalogue is a `MessagesOf<Params>` mapped type over it, so i18n depends on domain and never the reverse.
- **Two hooks, and the difference is load-bearing.** `useMessages()` returns `CoreMessages` (Start, toasts, store — safe anywhere); `useEditorMessages()` returns core + editor and only resolves inside the lazy `Workspace` chunk. Reaching for `m.inspector` from a Start-page component doesn't compile, which is the same mechanism that keeps the editor wording out of the eager bundle. **Never import `editorRegistry` from `useMessages.tsx`** — that alone silently un-splits the bundle.
- **Seeded content is frozen, not retranslated.** Starter labels, example trees and framework templates are read from the catalogue when written into a document, then live as ordinary user text. `IssueTreeDoc.locale` records the seeding language.
- **Five gates, each of which has caught a real miss.** Type-level completeness (`Messages = typeof en`); `scripts/check-i18n.mjs` (hardcoded prose, orphan/missing keys, and any literal that duplicates a catalogue string); an `en-XA` pseudo-locale render test; a test running the gate's own key scanner against the real catalogue so it can't fail open; and a bundle assertion that editor-only wording is absent from the eager chunk. When you add a check here, first make it fail on the real defect — two of these were written and found nothing until they were fixed.

## The ship loop — green before done
- **`pnpm verify` is THE gate.** One command, fail-fast, in order: **typecheck → lint/format → dead-code → i18n → feature-catalogue → tests → docs → build → size budget** (the list lives in `scripts/verify.mjs` — read it there rather than trusting this line). Nothing is "done" until `pnpm verify` is green AND CI is green.
- After pushing, watch CI (`gh run watch`). If it goes red, goal-seek from the actual logs (not guesses) and re-push until green. Then say what landed.
- Never report success over failing checks. Lead with evidence (run output / screenshot / passing test), not "should work."

### Environment note (important)
This machine's AppLocker blocks pnpm's `&&` script shell and the `node_modules/.bin` tool shims. Therefore:
- Scripts invoke tools in **node-form** (`node ./node_modules/<tool>/…`), orchestrated by shell-free node runners (`scripts/verify.mjs`, `scripts/build.mjs`). `biome`, `node`, `git`, `gh`, `pnpm` run directly.
- **Do not** put `&&`/`|` chains inside package.json scripts — move multi-step logic into a `scripts/*.mjs` runner.

## Plan before big changes
- **L-effort** (3+ files, a new module, a schema/data migration, or real design ambiguity): pause and give a short plan first — files to touch, the approach, alternatives rejected, how you'll verify. Small, clear changes: just do it.
- Risky / cross-cutting (edge routing, layout, store wiring): land a behavior-preserving **prep commit** first (pin current behavior with a test + extract the seam), then build the change on top. Keep prep and feature as separate commits.

## Verify your own work — don't make me check
- Anything observable (UI, CLI, an endpoint): run it and verify yourself before handing it back. For canvas/visual changes, render it and confirm it looks right, backed by a programmatic/geometry check or test.

## Commit & docs hygiene
- Small, focused commits. **Conventional Commits** (feat / fix / refactor / chore / docs); the message explains WHY. Don't bundle a refactor into a feature.
- Maintainability pass before pushing a feature (naming, dead code, simpler shape), then re-run the gate.
- Update docs in the SAME session as the code: `README.md`, `CHANGELOG.md`, `NEXT_STEPS.md`, and any user guide / feature list. When a fact changes, grep the old reality and fix every stale mention.
- `NEXT_STEPS.md` = OPEN items only; shipped work lives in `CHANGELOG.md`.

## Code quality bars
- Framework-free pure core (`domain/`), heavily unit-tested. Prefer deterministic logic over DOM/runtime measurement — it's testable and stable. Simple beats clever.
- **One source of truth** for cross-cutting values (sizes → `bundle-budget.json`; shared constants / validation in one module) so values can't drift between call sites.
- New capabilities additive and off-by-default where possible; prefer an optional field over a data migration.

## Fix what's broken — honestly
- Spot something stale / wrong / dead → fix it this session (chase the root cause, but stay bounded to the concrete fix + its siblings). Respect an explicit "leave it."
- Don't paper over warnings. Fix real issues; for a genuine false positive, a **documented** suppression is the right tool — the warning list should mean something.
  - **knip is unrelaxed.** `knip.json` carries no rule overrides — knip enforces unused files, exports, types, enum members, duplicates, and unused/unlisted dependencies (the `exports`/`types` rules were re-enabled once M1 wired the model; the `enumMembers`/`duplicates` relaxations were dropped once the tree was green without them). Biome additionally flags unused in-file symbols.

## Work efficiently
- When a question spans 2+ areas of the code, fan out parallel exploration sub-agents instead of serial grepping; use the cheapest model that's enough.

## Hosting
- Auto-deploys to GitHub Pages on push to `main` (`.github/workflows/deploy-pages.yml`). Custom domain via `public/CNAME` → `mece-studio.struktureretsundfornuft.dk` (DNS CNAME → `dannbleeker.github.io`). Vite `base` stays `/`.
