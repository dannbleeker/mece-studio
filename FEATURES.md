# Feature parity with TP Studio

MECE Studio and [TP Studio](https://tp-studio.struktureretsundfornuft.dk) are
siblings on the same stack. This file tracks the **MECE-owned** features that
were brought to parity with TP — the ones that serialize or operate on MECE's
own `IssueTreeDoc`, so they can't live in the (future) shared **studio-kit**
library — and records what is deliberately *not* built here.

Shipped detail lives in `CHANGELOG.md`; this is the at-a-glance parity map.

## Closed — MECE-owned features now at parity

| Area | What landed | Where |
|------|-------------|-------|
| **Schema migrations** | Forward-only migration runner; every load / import migrates before the doc is trusted (legacy/unversioned → current; unknown future version passed through, never a crash). | `domain/migrations/` |
| **File System Access** | Open / Save / Save As real `.json` files with a reusable handle (write back to the same file), persisted per-doc in IndexedDB; falls back to a file picker + download where unsupported. Sits on top of the localStorage autosave. | `services/fileSystemAccess.ts`, `services/fileHandles.ts` |
| **Export breadth** | One `exporters/` module, one lazy-loaded function per format: PNG / PDF / PPTX (raster) and JSON (round-trips with open). | `services/exporters/` |
| **Import** | Markdown-outline paste-to-tree + a format-detecting dispatcher (JSON runs through the migration runner). Opens as a new library entry. | `domain/markdownImport.ts`, `services/import.ts` |
| **Print** | Print preview + a print stylesheet that renders the tree as a clean nested outline and hides the app chrome when printing. | `components/print/` |
| **Presentation** | Full-screen step-through that walks the tree one decomposition at a time (depth-first), with the split's MECE status per slide. | `components/present/`, `domain/presentation.ts` |
| **Editing parity** | Quick capture (add many issues at once, one undo step); multi-document **tabs** (open several trees at once — MECE-owned store state + a local strip); in-tree find (already shipped) with its match logic extracted to a pure module. | `components/capture/`, `components/tabs/`, `domain/search.ts` |

## Deliberately not built here

| Item | Why |
|------|-----|
| **SVG diagram export** | MECE rasterises every diagram export on purpose — its sibling MindMap Studio had a stored XSS via live-SVG export, and `components/canvas/export-safety.test.ts` locks the raster-only property in. A live-SVG path would reintroduce that vulnerability class, so it stays out unless added with a sanitiser-at-the-sink and a deliberate guard update. |
| **TOC-shaped features** | Evaporating Cloud, junctors, CLR scrutiny, assumptions, three-cloud, the TOC pattern library, comments, revision history, and the TOC-shaped exporters (FlyingLogic / risk register / PRT / TT) have no MECE meaning. Out of scope by design. |

## Pending — arrives with studio-kit adoption (not built now to avoid drift)

These are shared-UI concerns that will come from studio-kit rather than being
duplicated in MECE. Local seams that will swap to the shared primitives are
marked in code with `// TODO(studio-kit):` (currently in the Import, Print, and
Presentation surfaces, which use MECE's local `Dialog` / inline styles).

- Command palette / ⌘K
- Dark mode
- Shared dialog / Help / Settings / Confirm shells, multi-tab settings
- Context menu, selection toolbar, toaster, and other shared UI primitives
- The shared **`TabBar`** rendering — MECE's multi-document *store state*
  (`openTabs` / `closeTab`) and quick capture / import / print / presentation
  surfaces are built and ship today on MECE's **local** `Dialog` / strip; the
  marked `// TODO(studio-kit):` seams swap only the presentation to the shared
  primitives later, without touching the MECE-owned logic.

## Still open in MECE itself

See `NEXT_STEPS.md` for MECE's own open items (e.g. integrated/keyed AI is a
deferred owner decision; the keyless AI-assist prompt bridge ships today).
