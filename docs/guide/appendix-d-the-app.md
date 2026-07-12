# Appendix D — Working in MECE Studio

The body of this book is about the *method*. This appendix is a reference to the
tool: the canvas, the editing model, the MECE review surfaces, the library, the
settings, and the app itself — so you can work quickly and keep your trees safe.

## Capturing a decomposition fast

When you already know the branches — in your head, or on a whiteboard — you don't
need to add them one node at a time. **Quick add issues…** (from the **⋯** menu)
opens a box where you type one issue per line; on confirm, every line becomes a
child of the selected node (or of the root, if nothing is selected), all in a
single undoable step. It builds levels too: **indent a line** (Tab, spaces, or a
bullet) and it nests as a sub-issue, so a whole multi-level outline drops in at
once. <kbd>Ctrl/⌘ + Enter</kbd> adds them without the mouse.

## Starting from material you already have

You will often have the makings of a tree already — an agenda, a bulleted brief,
a tree someone sent you. **Import outline…** (from the **⋯** menu) turns it into a
tree:

- **A Markdown outline.** Paste headings and/or bullet lists; nesting comes from
  indentation. The first heading or line becomes the root question, and
  everything else nests beneath it. It is a structural import — you get the
  hierarchy and labels, ready to refine.
- **An OPML outline.** The export format of most outliners and mind-mappers
  (MindManager, OmniOutliner, Workflowy, Dynalist, …) — nested `<outline>`s
  become the tree.
- **A tree's JSON.** Paste the JSON a colleague exported and it opens as a fully
  restored tree (the same format **Export ▾ → JSON** produces).

The format is auto-detected — you just paste.

Either way, the import opens as a **new** entry in your library, so it never
disturbs the tree you are already working on.

## The canvas

The tree lays itself out. You never drag nodes into position; MECE Studio runs an
**auto-layout** (a left-to-right tree) and **re-fits the view** whenever the tree
changes, so the structure stays readable as it grows. Each node is also sized to
its own content, so a richer node — one showing a value, evidence badges, and
ME / CE dots — is laid out taller than a bare label and never overruns its
neighbours; simple trees lay out exactly as before. What you control is the
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
- **Minimap.** A minimap keeps you oriented in a big tree: one dot per node,
  coloured by state — amber for a flagged split, blue for a high-priority
  branch.
- **Select several nodes at once.** <kbd>⌘/Ctrl</kbd>- or <kbd>Shift</kbd>-click
  nodes, or <kbd>Shift</kbd>-drag a box on empty canvas, and a floating action
  bar sets their status or priority — or deletes them — in one undoable step.

The canvas also *shows* the analysis at a glance, without opening the inspector:
each decomposed node carries **ME / CE status indicators** (is this split
mutually exclusive? collectively exhaustive?), a **coloured status edge** for its
hypothesis state, and **evidence-count badges** for supporting and contradicting
items. Edges out of a flagged split carry a subtle always-on amber tint; when
the review dock is open, the canvas goes further and dims the clean splits
entirely, so the splits that need attention stand out. (To assistive tech the
canvas is a real *tree* — every node announces its depth, expanded state, and
selection to a screen reader.)

The first time you face a bare root node, a dismissible **coach tip** on the
canvas points at the two moves that start a tree: <kbd>Tab</kbd> to add a
branch, then the **Logic** tab to choose how it splits.

## Editing nodes

Most editing happens on the canvas or in the inspector on the right:

| Action | How |
| --- | --- |
| Rename a node | Double-click it, or select it and press <kbd>Enter</kbd> / <kbd>F2</kbd> |
| Add a child | <kbd>Tab</kbd> on the selected node, or click the **＋** on its child edge (see Appendix B) |
| Add a sibling | <kbd>Shift + Enter</kbd> on the selected node |
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
  or *⚠ N to review* and opens a triage dock: flags grouped into **Overlaps**
  and **Gaps**, ranked by branch priority, each row with its plain-language
  reason, a one-click **Locate** that centres the node on the canvas, a
  **Review logic →** jump to the inspector, and — for gaps — a concrete remedy
  (add an "Other" bucket, or a sub-issue).
- **Needs review.** The Start page's **Needs review** section triages your whole
  library down to the trees that have at least one flagged split.

## The Logic tab and coaching

Everything about *how a node splits* lives on the inspector's **Logic** tab, in
one place:

- The **decomposition type** (binary / segments / process / formula / framework /
  freeform) and its scaffold.
- The **dimension** the split cuts on — its single axis, with one-click common
  ones (customer / geography / product / time / stage).
- **Inductive or deductive.** Mark a split a deductive argument chain and the
  MECE overlap-check steps aside — an argument builds on itself rather than
  partitioning (see *MECE: no overlaps, no gaps*). Inductive is the default.
- The **ordering principle** — *importance* / *time* / *structure* — which fixes
  how this split's branches are ordered, overriding the global priority sort (see
  *Prioritise the 80/20*).
- The **so-what (insight)** — the one-line action title the branches add up to,
  which the synthesis leads the branch with (see *Answer-first*).

Below the strict ME / CE explanation, the Logic tab also carries a **Coaching**
callout — lighter, `info`-level nudges from the problem-structuring canon (a bare
one-word branch, a laundry list of more than ~7 branches, an altitude outlier, a
hypothesis still phrased as a question, key-question quality, and why/how
consistency). Coaching is deliberately kept **out** of the MECE health chip, so
the chip keeps meaning mutual-exclusivity and collective-exhaustiveness alone.

## Framing: the Answer banner and Problem brief

Above the canvas sits the **Answer banner** — the one-line governing answer the
whole tree argues for. State your day-one hypothesis there and the synthesis opens
with it and a rolled-up verdict. Its **Problem brief** button opens the **Problem
Identity Card** — *Situation · Complication · Owner · Decision-makers · Success
criteria · In scope · Out of scope · Desired outcome* — the fuller framing behind
the key question (see *Start with the question*). The brief is also where you tag
the tree a **why** (diagnostic) or **how** (prescriptive) tree; a badge in the
header then shows which, and the coaching keeps the tree pointed one way.

## The library and the Start page

MECE Studio opens on the **Start page** — a workspace shell with a sidebar
(**Start, All trees, Recent, Templates, Needs review**, and **Learn MECE**, a
short in-app primer with links to the user guide and this book). From here you
**start a new tree** from a key-question box — picking how the first split
should cut, or starting blank — or open an existing one. Every saved tree
appears as a **card** showing a mini preview and a live MECE pill that reads
the same status the canvas does; from a card you can **rename, duplicate, or
delete** the tree. The library **search** (<kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>)
matches node labels and notes across every tree, not just titles — so it finds
the tree that *contains* the thought you're looking for. The **Templates** page
surfaces every decomposition style, named framework, and example tree as a
one-click card — plus **your own templates**: **⋯ → Save as template…** banks
any tree's structure (labels, splits, dimensions; values, evidence, and status
stripped) as a clean, reusable starting point.

Open several trees at once and each gets a **tab** above the canvas — with a
per-tab **MECE health dot** (green clean / amber to-review / grey undecomposed),
so you can see which open trees still need work. The open set survives a reload.

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
  The **About** dialog also links the user guide, this book (PDF and EPUB),
  third-party notices, and the source code.
- The **editor header** is grouped into labelled clusters — brand and title, the
  MECE health chip, undo/redo, Synthesis, the **Export ▾** menu, Settings,
  shortcuts, and an **⋯ overflow** menu — so the actions stay findable as the app
  grows. Confirmations and renames use the app's own dialogs, never a browser
  popup.
- **On a phone**, the workspace adapts: the header collapses into the **⋯**
  menu and the inspector and review dock become a **bottom sheet** that rises
  when you select a node, so the canvas keeps the full width.

## AI assist, without an API key

MECE Studio has no backend and asks for no API key, but it still helps you use an
LLM. Two actions copy a ready-made prompt with your tree embedded, to paste into
Claude or ChatGPT:

- **Critique this tree's MECE** — from the Synthesis panel.
- **Suggest a MECE split for this node** — from the inspector. The prompt asks
  the LLM for a paste-ready Markdown outline, and a **"paste the AI's split
  back"** box beneath it grafts those sub-issues straight under the node —
  closing the loop with no key and no backend.

You stay in control of what you send and where; the tool just writes the prompt.
