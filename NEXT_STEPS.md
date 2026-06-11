# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## Milestones
- **M3 (cont.)** — leaf **evidence** items (model already exists) + **answer-first roll-up** to the root + sort/rank siblings by priority. (Impact × ease prioritisation shipped.)
- **M4** — hypothesis mode (node status workflow) + value-driver mode (numeric roll-up & sensitivity; units on values).
- **M5** — export: PNG / PDF / **PPTX** (code-split + runtime-cached so they stay off the eager bundle).
- **Later** — AI tier-3: suggest a MECE split; critique a tree.

## Polish / refinements (found during M1)
- Re-fit runs on every node-count change; refine to only recentre when a new node would land off-screen, to avoid view jumps in large trees.
- Label/value edits commit on blur (one undo entry each) — consider inline-on-canvas label editing, and coalescing rapid edits if the granularity proves noisy.

## Tooling backlog
- Turn `knip`'s `exports`/`types` rules back on now that M1 wires the domain model, and prune anything genuinely unused.
- Once export libs are code-split (M5), measure the eager entry chunk specifically in `check-bundle-size.mjs` rather than total JS.
- Add a jsdom component smoke test (React Flow needs ResizeObserver mocks) + Playwright e2e once the canvas behaviour stabilises.
- Add `.gitattributes` (`* text=auto eol=lf`) in a dedicated chore commit to silence the CRLF warnings.
