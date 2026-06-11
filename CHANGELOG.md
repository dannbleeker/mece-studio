# Changelog

Notable changes to MECE Studio. Newest first. (Open items live in `NEXT_STEPS.md`.)

## [Unreleased]

### Added
- **Project scaffold (M0).** React 19 / Vite 8 / TS 6 / Tailwind 4 / Zustand 5 / vite-plugin-pwa. Domain model (`IssueNode`, `Split` as the MECE unit, `IssueTreeDoc`) + `factory`, a minimal app shell + Zustand store seeded with a root question, and the GitHub Pages deploy pipeline. Live at <https://mece-studio.struktureretsundfornuft.dk>.
- **Local gate + CI + working agreement.** `pnpm verify` runs the full fail-fast gate — typecheck → lint/format (Biome) → dead-code (knip) → tests (Vitest) → build → bundle-size budget — via shell-free node runners (`scripts/verify.mjs`, `scripts/build.mjs`) that work under the local AppLocker policy and on CI. CI runs the same gate. `CLAUDE.md` captures the working agreement; `bundle-budget.json` is the single source of truth for the size budget.
