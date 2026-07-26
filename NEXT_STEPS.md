# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Localization

The architecture is in place and English is the only locale. What's open:

- **Add Danish (`da`).** Add the code to `LocaleCode`, copy
  `src/i18n/locales/en/` to `locales/da/`, translate, register in
  `src/i18n/registry.ts`. The compiler enumerates every missing key, so this is
  translation work rather than engineering work. Note the seeded content
  (`content-examples.ts`, `content-frameworks.ts`) is the bulk of it.
- **Split the catalogue along the Workspace lazy boundary.** Measured: the
  catalogue took the eager entry chunk from **105.0 KB to 115.2 KB gz (+10.2 KB)**,
  and the budget was bumped 115 → 118 to let it land. The cause is that
  `locales/en.ts` composes every namespace into one object, so the eager store
  pulls the `inspector` / `canvas` / `exports` wording in even though the
  Workspace that renders them is lazy-loaded. Splitting those namespaces onto the
  lazy chunk should give most of the 10 KB back. Worth doing before a second
  locale doubles the number.
- **Lazy-load whole locales** once there is more than one. Every read already
  goes through `catalogueFor` in `src/i18n/registry.ts`, so it is a one-file
  change to `await import(…)` plus a loading state.
- **Per-locale PWA manifest.** `vite-plugin-pwa` emits one manifest, so the
  install-time app name and description are fixed at build. Serving one manifest
  per locale and switching `<link rel="manifest">` at runtime is the known fix;
  not worth doing until there is a second locale.
- **Read `IssueTreeDoc.locale`.** It is recorded on every new document but no
  behaviour reads it yet. The intended use is collating and formatting a tree in
  its own language rather than the reader's.

## Out of scope by design (not building)

Reviewed and deliberately left out:

- **Work plan** — per-leaf *analysis · source · owner · due · RAG* + CSV. Turns the tree into a project tracker, not a reasoning aid; revisit only if the tool grows an execution surface.
- **Richer prioritisation** — *lead time* + *depends-on* / a dependency graph. A planning tool.
- **Integrated live AI** — a direct LLM call needs a backend or a stored API key (owner-deferred); the keyless AI-assist prompt bridge ships instead.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents one node at a time).

## Tooling backlog

- **Extend the Playwright e2e suite** as new UI lands — coverage is already broad (see `e2e/`; runs in CI).
