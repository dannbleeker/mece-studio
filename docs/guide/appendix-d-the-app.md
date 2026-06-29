# Appendix D — Working in MECE Studio

The body of this book is about the *method*. This appendix is a reference to the
tool: the canvas, the editing model, the MECE review surfaces, the library, the
settings, and the app itself — so you can work quickly and keep your trees safe.

## Capturing a decomposition fast

When you already know the branches — in your head, or on a whiteboard — you don't
need to add them one node at a time. **Quick add issues…** (from the **⋯** menu)
opens a box where you type one issue per line; on confirm, every line becomes a
child of the selected node (or of the root, if nothing is selected), all in a
single undoable step. <kbd>Ctrl/⌘ + Enter</kbd> adds them without the mouse.

## Starting from material you already have

You will often have the makings of a tree already — an agenda, a bulleted brief,
a tree someone sent you. **Import outline…** (from the **⋯** menu) turns it into a
tree:

- **A Markdown outline.** Paste headings and/or bullet lists; nesting comes from
  indentation. The first heading or line becomes the root question, and
  everything else nests beneath it. It is a structural import — you get the
  hierarchy and labels, ready to refine.
- **A tree's JSON.** Paste the JSON a colleague exported and it opens as a fully
  restored tree (the same format **Export ▾ → JSON** produces).

Either way, the import opens as a **new** entry in your library, so it never
disturbs the tree you are already working on.

## The canvas

The tree lays itself out. You never drag nodes into position; MECE Studio runs an
**auto-layout** (a left-to-right tree) and **re-fits the view** whenever the tree
changes, so the structure stays readable as it grows. What you control is the
*structure*, and the canvas gives you a few ways to manage a large one:

- **Re-parent by dragging.** Drag any node onto another to move it — and its whole
  subtree — under that node. While you drag, the valid drop target is ringed, so
  the result is predictable; an invalid drop (onto the node's own subtree, or the
  root) simply snaps back.
- **Collapse and expand.** Any node with children gets a toggle: collapse it to
  hide its subtree and focus on one branch (the node shows a count of what's
  hidden). **Collapse all** / **Expand all** fold or unfold the whole tree at
  once.
- **Find.** The search box rings every node whose label matches as you type and
  shows a match count; press <kbd>Enter</kbd> to zoom to the matches — invaluable
  in a big tree.

The canvas also *shows* the analysis at a glance, without opening the inspector:
each decomposed node carries **ME / CE status dots** (is this split mutually
exclusive? collectively exhaustive?), a **coloured status edge** for its
hypothesis state, and **evidence-count badges** for supporting and contradicting
items. When the review dock is open, the canvas dims the clean splits and
amber-dashes the flagged edges, so the splits that need attention stand out.

## Editing nodes

Most editing happens on the canvas or in the inspector on the right:

| Action | How |
| --- | --- |
| Rename a node | Double-click it, or select it and press <kbd>Enter</kbd> / <kbd>F2</kbd> |
| Add a child | <kbd>Tab</kbd> on the selected node (see Appendix B) |
| Delete a node and its subtree | Select it and press <kbd>Delete</kbd> / <kbd>Backspace</kbd> |
| Duplicate a subtree | From the inspector — copies the node and its whole subtree (fresh ids) as a sibling |
| Reorder siblings | Move a node up or down among its siblings, from the inspector |
| Add notes | The inspector's notes field, for rationale, assumptions, or sources; a node with notes shows a marker, and notes flow into the Markdown export |

The **inspector is tabbed** — *Issue · Logic · Evidence · Value* — so you see one
facet of the selected node at a time; the **Logic** tab opens automatically when
the node's split needs a MECE review. Every change is undoable: <kbd>Ctrl/⌘ +
Z</kbd> / <kbd>Ctrl/⌘ + Y</kbd>. Press <kbd>?</kbd> at any time for the
keyboard-shortcuts overlay.

## Reviewing MECE

MECE checking is the point of the tool, and it surfaces in three places:

- **In the inspector.** A flagged split shows a plain-language explanation of
  *why* — siblings that may overlap (ME), or children that may not cover the
  parent (CE).
- **The review dock.** A **MECE health** chip in the header reads *✓ MECE clean*
  or *⚠ N to review* and opens a dock listing every flagged split with its
  reason, a one-click **Locate** that centres the node on the canvas, and a
  concrete remedy (add an "Other" bucket, or a sub-issue).
- **Needs review.** The Start page's **Needs review** section triages your whole
  library down to the trees that have at least one flagged split.

## The library and the Start page

MECE Studio opens on the **Start page** — a workspace shell with a sidebar
(**Start, All trees, Recent, Templates, Needs review, Learn MECE**). From here you
**start a new tree** from a key-question box, or open an existing one. Every saved
tree appears as a **card** showing a mini preview and a live MECE pill that reads
the same status the canvas does; from a card you can **rename, duplicate, or
delete** the tree. The **Templates** page surfaces every decomposition style,
named framework, and example tree as a one-click card.

If you used an earlier, single-tree version of MECE Studio, your tree is folded
into the library automatically the first time you open the new version — nothing
is lost.

## Settings

A **⚙ Settings** panel (saved on your device) carries a few preferences, all
defaulting to today's behaviour:

- **Sort siblings by priority** — lay branches out highest-impact first, instead
  of creation order (opt-in).
- **Stricter overlap detection** — also flag shorter shared words between
  siblings when looking for overlap (opt-in).
- **Formula tolerance** — how closely a value-driver split must reconcile to read
  as MECE (default 0.5%).

## The app itself

- **Everything autosaves** to your browser's local storage, so your trees are
  there when you return; the file open/save above is layered on top for real
  `.json` files.
- **Installable and offline.** MECE Studio is a PWA — install it from your
  browser and it runs offline, like a native app.
- **Self-updating.** When a new version is deployed, a running tab shows a
  non-intrusive *"A new version is available — Refresh now"* prompt rather than
  reloading under you; **About → Check for updates** forces a check on demand.
- The **editor header** is grouped into labelled clusters — brand and title, the
  MECE health chip, undo/redo, Synthesis, the **Export ▾** menu, Settings,
  shortcuts, and an **⋯ overflow** menu — so the actions stay findable as the app
  grows.

## AI assist, without an API key

MECE Studio has no backend and asks for no API key, but it still helps you use an
LLM. Two actions copy a ready-made prompt with your tree embedded, to paste into
Claude or ChatGPT:

- **Critique this tree's MECE** — from the Synthesis panel.
- **Suggest a MECE split for this node** — from the inspector.

You stay in control of what you send and where; the tool just writes the prompt.
