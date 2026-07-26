# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Picking this up cold

The app was left at **v1.0.0** in a deliberately finished state — not paused
mid-change. There is no half-built feature to find and no branch to resume.

1. `pnpm install --frozen-lockfile && pnpm verify`. That is the whole health
   check; it was last confirmed green from a clean clone at the v1.0.0 tag. If
   it fails, the cause is drift in the toolchain or the environment, not
   unfinished work — read `CLAUDE.md`'s environment note first (AppLocker means
   scripts run tools in node-form and never chain with `&&`).
2. `CLAUDE.md` is the working agreement and the map: the model decisions, the
   language architecture, and the gate.
3. Everything genuinely open is below. Nothing here is blocking; the largest
   single item is translating a second locale, which the compiler will
   enumerate for you.

## Localization

The architecture is in place and English is the only locale. What's open:

- **Add Danish (`da`).** Add the code to `LocaleCode`, copy
  `src/i18n/locales/en/` to `locales/da/`, translate, and register the two halves
  in `src/i18n/registry.ts` and `src/i18n/editorRegistry.ts` (plus its entry in
  `src/i18n/manifests.ts`). The compiler enumerates every missing key, so this is
  translation work rather than engineering work. Note the seeded content
  (`content-examples.ts`, `content-frameworks.ts`) is the bulk of it.
- **Lazy-load whole locales** once there is more than one. Every read already
  goes through `catalogueFor` / `editorCatalogueFor`, so it is a change to those
  two files plus a loading state — no call site moves.
- **Read `IssueTreeDoc.locale`.** It is recorded on every new document but no
  behaviour reads it yet. The intended use is collating and formatting a tree in
  its own language rather than the reader's.
- **Trim the remaining eager catalogue** (~4.7 KB gz over the pre-i18n baseline)
  if it ever matters. It is dominated by `content-examples` /
  `content-frameworks`, which are eager because the Start page renders a preview
  of all nine example trees. Deferring those would mean changing how Start
  previews work, not how the catalogue is split — a product change, not a
  bundling one.

## Out of scope by design (not building)

Reviewed and deliberately left out:

- **Work plan** — per-leaf *analysis · source · owner · due · RAG* + CSV. Turns the tree into a project tracker, not a reasoning aid; revisit only if the tool grows an execution surface.
- **Richer prioritisation** — *lead time* + *depends-on* / a dependency graph. A planning tool.
- **Integrated live AI** — a direct LLM call needs a backend or a stored API key (owner-deferred); the keyless AI-assist prompt bridge ships instead.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents one node at a time).

## Tooling backlog

- **Extend the Playwright e2e suite** as new UI lands — coverage is already broad (see `e2e/`; runs in CI).
- **Four majors held back**, each a deliberate deferral rather than an oversight. `pnpm audit` is clean at 0 advisories, so none of these is a security matter; take them one per PR, with `pnpm verify` as the judge.
  - `typescript` 6 → **7** — the compiler the whole gate rests on. Its own release, its own PR.
  - `nanoid` 5 → **6** — id generation; check the ESM/export shape before assuming a drop-in.
  - `marked` 16 → **18** — used only by the docs/book builders, so a break shows up as mangled HTML rather than a failing test. Eyeball the rendered guide.
  - `@types/node` 24 → **26** — track whatever Node the CI image runs.
