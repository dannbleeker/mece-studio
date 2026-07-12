# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items — right now
there are none of substance: the problem-structuring backlog is complete.

## Out of scope by design (not building)

Reviewed and deliberately left out:

- **Work plan** — per-leaf *analysis · source · owner · due · RAG* + CSV. Turns the tree into a project tracker, not a reasoning aid; revisit only if the tool grows an execution surface.
- **Richer prioritisation** — *lead time* + *depends-on* / a dependency graph. A planning tool.
- **Integrated live AI** — a direct LLM call needs a backend or a stored API key (owner-deferred); the keyless AI-assist prompt bridge ships instead.
- **Snapshots / versioning** (review item F12).
- **Bulk multi-node re-parent** (drag re-parents one node at a time).

## Tooling backlog

- **Extend the Playwright e2e suite** as new UI lands — coverage is already broad (see `e2e/`; runs in CI).
