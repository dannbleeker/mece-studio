# Decisions log — autonomous session (2026-06-11, ~17:00–21:00)

Judgment calls I made while building unsupervised. Each is reversible; I picked the option I'd defend and kept moving. **Review these as pop-ups when back** — say which to change and I'll adjust.

| # | Decision | What I chose | Why / reversibility |
|---|----------|--------------|---------------------|
| D1 | Proceed without per-step approval | Build M1→M5 to completion, commit green each milestone | Per your instruction. All in small commits — easy to revert any one. |
| D2 | Testing strategy | Heavy unit tests on the pure core (node env, 23 tests); UI verified **live via preview screenshots**. jsdom component smoke tests **deferred** (React-Flow-in-jsdom needs ResizeObserver mocks — not worth it yet) | Matches "framework-free pure core." No jsdom/testing-library dep added yet, keeping the gate lean. |
| D7 | Canvas UX defaults | Auto-fit recentres on every add/remove; labels & values commit on blur (one undo entry each); nodes are not free-dragged | Reasonable M1 defaults; both flagged in NEXT_STEPS for later refinement (view-jump in big trees, edit coalescing). |
| D3 | First MECE rules' behaviour | singleton → "needs ≥2 sub-issues" (exhaustive warn); **binary = exactly 2** branches (A / not-A) else warn; **formula reconciles within 0.5%** tolerance; segment/process/framework/freeform → "unknown" until M2 heuristics | Sensible defaults; tolerance + the "exactly 2" rule are the kind of thing you may want to tune. |
| D4 | Canvas interaction | **Auto-layout** (dagre, LR); nodes are not free-dragged — positions are computed | The McKinsey look is a clean auto-laid tree; matches TP Studio's auto-layout diagrams. Manual drag could be added later. |
| D5 | Numeric value editing in M1 | Pulled a minimal "value" field forward from M4 so formula reconciliation is actually demonstrable | Small; the field already exists in the model. |
| D6 | Git commit email | **Resolved** → set repo identity to `dann@bleeker-pedersen.dk` and rewrote both existing commits (force-pushed) | Per your message. Repo-local config, so your global / TP Studio identity is untouched. |
