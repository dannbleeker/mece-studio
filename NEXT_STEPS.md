# Next steps — open items only

Shipped work lives in `CHANGELOG.md`. Keep this list to OPEN items.

## M1 — vertical slice (the tool becomes real)
- React Flow (`@xyflow/react`) + dagre canvas; project the tree from the store → nodes/edges (edges derived from splits).
- "Add children" to a node → create/extend its `Split` with a chosen `DecompositionType`.
- dagre `LR` auto-layout (the McKinsey look); inline-edit node labels.
- First live MECE check on a split (start with `singletonSplit`, `formulaReconciliation`, `binaryExhaustive`) → status badge on the split + a warning in the inspector.
- Persistence (localStorage) + undo/redo via the store pattern lifted from TP Studio.

## Later milestones
- **M2** — full MECE rule set (`segmentOtherBucket`, `siblingOverlap`) + decomposition scaffolds/templates on split creation.
- **M3** — prioritisation (impact × ease) + branch ranking + leaf evidence + answer-first roll-up to the root.
- **M4** — hypothesis mode (node status workflow) + value-driver mode (numeric roll-up & sensitivity).
- **M5** — export: PNG / PDF / **PPTX**.
- **Later** — AI tier-3: suggest a MECE split; critique a tree.

## Tooling backlog
- Turn `knip`'s `exports`/`types` rules back on once M1 wires the domain model (currently off — see `CLAUDE.md`).
- Revisit the bundle-size budget when React Flow + dagre land (code-split like TP Studio; consider measuring the eager chunk specifically rather than total JS).
- Add Playwright e2e once there's interactive canvas behaviour worth covering.
