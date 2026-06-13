# MECE Studio — User Guide

A complete reference for every feature in MECE Studio, organized by what you're
trying to do. MECE Studio is a free, local-first web app for building
**McKinsey-style issue trees** with **MECE checking built in** — it flags
overlaps and gaps as you decompose a problem, then helps you prioritise,
test hypotheses, hang evidence, do the numbers, and read the answer back out.

Everything runs in your browser. Nothing is uploaded; your trees are saved
locally on your machine.

## Contents

1. [Getting started](#getting-started)
2. [The Start page](#the-start-page)
3. [Building the tree](#building-the-tree)
4. [MECE checking](#mece-checking)
5. [Editing nodes](#editing-nodes)
6. [Navigating the canvas](#navigating-the-canvas)
7. [Prioritising branches](#prioritising-branches)
8. [Hypotheses and status](#hypotheses-and-status)
9. [Evidence](#evidence)
10. [Value-driver trees](#value-driver-trees)
11. [Synthesis — reading the answer](#synthesis--reading-the-answer)
12. [AI assist](#ai-assist)
13. [Working with multiple trees](#working-with-multiple-trees)
14. [Saving, exporting, and importing](#saving-exporting-and-importing)
15. [Undo, redo, and autosave](#undo-redo-and-autosave)
16. [Installing as an app (offline)](#installing-as-an-app-offline)
17. [Settings](#settings)
18. [Keyboard reference](#keyboard-reference)
19. [Tips](#tips)

---

## Getting started

When you open MECE Studio you land on the **Start page** — your library of trees and
a place to begin (see [The Start page](#the-start-page)). Create or open a tree and
you move into the **workspace**, where you build it:

- **The canvas** (centre) shows the tree. Nodes are laid out automatically,
  left-to-right.
- **The inspector** (right) shows everything about the currently selected node:
  its decomposition, MECE status, priority, hypothesis status, value, evidence,
  and notes.
- **The header** (top) has **MECE Studio** / **← Start** to return to the library,
  plus the New / Synthesis / Copy Markdown / Open / Save / Undo / Redo / ⚙ Settings /
  About actions.

Click a node to select it. Rename the root question to your real problem to
begin — double-click it, or select it and press <kbd>Enter</kbd>.

**Start from an example.** New to issue trees? On the Start page, open the
**Templates** section (or the example cards on the Start view) to load a ready-made
tree and learn by poking at a real one. There are three: a value-driver tree
(*operating profit*, whose formula branches provably reconcile), an issue tree
(*customer churn*, segmented with an "Other" bucket and carrying hypotheses and
evidence), and a decision frame (*subscription launch*, built on a provably-MECE
binary split). Each opens as a new tree in your library, so your own work is
untouched.

## The Start page

MECE Studio opens on the **Start page** — a workspace shell with a sidebar on the
left. Open or create a tree from here and you move into the editing **workspace**
(canvas + inspector); the **MECE Studio** wordmark or **← Start** in the workspace
header brings you back.

The sidebar switches the main view:

- **Start** — the key-question hero: type a question and **Build an issue tree**, or
  pick one of the example questions. Below it sit the framework and example strips and
  a "pick up where you left off" gallery of your recent trees.
- **All trees** — every tree in your library, as cards.
- **Recent** — the same trees as a compact, most-recently-edited-first list.
- **Templates** — start from a pattern (below).
- **Needs review** — only the trees with a split the MECE engine has flagged, so you
  can see at a glance what still needs attention.
- **Learn MECE** — a short primer, with links to this guide and the book.

**Templates.** The Templates page (and the strips on Start) offers two ways to begin:

- **Decomposition frameworks** — one tile per split type (formula, segments, process,
  binary, framework, freeform) with its hint and the starter branches it scaffolds;
  binary and formula are tagged **provably MECE**. Click one to create a new tree
  decomposed that way.
- **Example trees** — the ready-made trees; click to open a fresh copy.

**Tree cards.** Each card shows a mini preview of the tree, its name and kind, when you
last edited it, and a **MECE pill**: green **MECE clean** when every split passes, amber
**_n_ to check** when splits are flagged for review, or grey when the tree isn't
decomposed yet. The pill reads the *same* MECE result the canvas and inspector show, so
it never disagrees with them.

**Search.** Press <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> (or click the search box) to filter
your trees by name.

## Building the tree

A tree is built by **decomposing** each question into sub-issues.

**Add a sub-issue.** Select a node and click **+ Add sub-issue** in the
inspector, or press <kbd>Tab</kbd> to add a child and start typing its label
immediately.

**Choose how a node decomposes.** Each node splits in exactly one way. In the
inspector, pick a **decomposition type**:

- **Segment** — break into parts of a whole (regions, customer types…). Add an
  explicit **"Other"** bucket to be sure you've covered everything.
- **Process** — break into sequential stages or steps.
- **Binary** — split into **A / not-A** (e.g. *new customers* vs *existing*).
  This is always provably MECE.
- **Formula** — the children combine arithmetically into the parent
  (Revenue = Price × Volume). See [Value-driver trees](#value-driver-trees).
- **Framework** — an established lens (e.g. People / Process / Technology).
- **Freeform** — no specific structure.

**Decomposition scaffolds.** When you choose a type on a leaf node, MECE Studio
seeds **type-appropriate starter children** for you to rename — binary gives you
*A / not-A*, segments give two parts plus *Other*, process gives stages, formula
gives terms. The "Decompose by…" buttons appear on leaf nodes.

**Delete a node.** Select it and click delete in the inspector, or press
<kbd>Delete</kbd> / <kbd>Backspace</kbd>. The node and its whole subtree are
removed (you can undo).

## MECE checking

MECE = **Mutually Exclusive, Collectively Exhaustive**. It's a property of each
*split* (a parent and its children), not of a single node. The engine
re-evaluates every split on every change and shows the result two ways:

- **ME / CE dots on the node** — at a glance, is this split mutually exclusive
  and collectively exhaustive?
- **Explained warnings in the inspector** — *why* a split isn't MECE, in words,
  with what to do about it.

How each split type is judged:

- **Binary (A / not-A)** — provably MECE by construction (exactly two branches).
- **Formula** — checked for **reconciliation**: do the children actually combine
  into the parent's value within tolerance?
- **Segments** — collectively exhaustive only when you include an explicit
  **"Other"** bucket; otherwise you're warned there may be a gap.
- **Other types** — a **sibling-overlap heuristic** flags when two siblings share
  a content word (a sign they may not be mutually exclusive). Generic and
  placeholder words are ignored so fresh scaffolds don't flag themselves.

The goal isn't a perfect score — it's to make gaps and overlaps *visible* so you
decide deliberately.

## Editing nodes

**Inline label editing.** Double-click any node to edit its label right on the
canvas. With a node selected, press <kbd>Enter</kbd> or <kbd>F2</kbd> to edit.
<kbd>Enter</kbd> or clicking away commits; <kbd>Escape</kbd> cancels.

**Keyboard tree-building.** With a node selected, <kbd>Tab</kbd> adds a child and
drops you straight into editing its label — so you can build a whole tree without
touching the mouse.

**Detail and notes.** The inspector has a label, an optional longer **detail**
field, and a **notes** field for rationale, assumptions, or data sources. A node
that carries notes shows a small marker on the canvas, and notes flow into the
Markdown export.

**Duplicate a subtree.** Select a node and **Duplicate** to copy it and its whole
subtree (with fresh ids) as a sibling — handy for parallel branches that share a
structure.

**Reorder siblings.** Move a node **up** or **down** among its siblings from the
inspector, to arrange branches in the order that reads best.

## Navigating the canvas

**Auto-layout.** The tree is laid out automatically with dagre, left-to-right.
You don't place nodes by hand — structure drives position, so the tree always
reads cleanly.

**Auto-fit.** The view re-fits when the tree changes so new nodes stay on screen.

**Drag to re-parent.** Drag any node onto another node to move it (and its whole
subtree) under that node. While you drag, the **valid drop target is
highlighted** so the result is predictable; dropping on an invalid target (the
node's own subtree, the root, or empty space) snaps back with no change. Auto-
layout then re-tidies everything.

**Collapse and expand.** Any node with children has a toggle. **Collapse** hides
its subtree (the node shows a ▶ N badge with the hidden count) so you can focus on
one branch; expand brings it back. **Collapse all / Expand all** (top-left) fold
or unfold the whole tree at once.

**Find on the canvas.** The search box (top-left) rings every node whose label
matches as you type and shows a match count. Press <kbd>Enter</kbd> to zoom to the
matches — useful in a large tree.

## Prioritising branches

Not every branch is worth chasing. In the inspector, mark each issue's **impact**
and **ease** (each on a small scale). MECE Studio combines them into a **priority
band** — **High / Medium / Low** — shown as a chip on the node, so the 80/20
branches stand out. The synthesis reads branches in priority order.

## Hypotheses and status

Issue trees are most powerful when you treat each branch as a **hypothesis** to
test. Set a node's **status** in the inspector:

- **Open** — not yet tested.
- **Supported** — the evidence backs it.
- **Refuted** — the evidence knocks it down.
- **Parked** — set aside for now.

The node gets a **colour-coded left edge** so the state of play is visible across
the whole tree, and the synthesis flags ✓ supported, ✗ refuted, ⊘ parked.

## Evidence

Attach **evidence** to any node from the inspector — each item is **supporting**
or **contradicting**, with a **strength** you can cycle. Nodes show ✓/✗ count
badges so you can see where the case is strong or thin. Evidence feeds the
synthesis and your hypothesis decisions.

## Value-driver trees

When a question is quantitative, make it a **formula** split and put numbers on
the leaves.

- **Numeric value + units.** Give a node a number and an optional **unit**
  (DKK, %, hrs, FTE…). The unit shows on the node and in exports.
- **Formula operators.** Choose how a formula split combines its children —
  **sum**, **product** (Price × Volume), or **difference** (Revenue − Cost).
- **Roll-up.** One click rolls the children's numbers up into the parent's value
  using the chosen operator.
- **Reconciliation.** A check confirms the children actually add up to the parent
  within tolerance — if they don't, you're told.
- **Sensitivity analysis.** On a formula split, a ranked readout shows how much
  the parent value swings when each leaf driver moves **±10%**, one at a time — so
  the driver that matters most is obvious.

## Synthesis — reading the answer

Open the **Synthesis** panel (header) to read the tree back **answer-first**, the
way a good consultant would present it:

- It leads with the **highest-priority branch**.
- It lists branches in **priority order**.
- It surfaces each node's **evidence** and **hypothesis status**.
- It flags any **MECE gaps and overlaps**.

**Copy Markdown** copies the whole synthesis (or use **Copy Markdown** in the
header for the tree outline) so you can paste it into a doc, an email, or a deck.

## AI assist

MECE Studio is a fully deterministic tool — but if you want a second opinion from
an LLM, it gives you **ready-made prompts with your tree embedded**, with no API
key and no backend:

- **AI critique** (from the Synthesis panel) — copies a prompt asking an LLM to
  critique your tree's MECE structure.
- **Suggest a split** (from the inspector, on a selected node) — copies a prompt
  asking an LLM to propose a MECE decomposition for that node.

Paste either into Claude, ChatGPT, or any assistant. Your data never leaves your
machine unless *you* paste it.

## Working with multiple trees

MECE Studio keeps a **library** of trees.

- The **Start page** lists every tree (by its root question) as a card; click one to
  open it, or use **All trees** / **Recent** in the sidebar. Switch at any time.
- **+ New** starts a fresh tree and adds it to the library; your current tree
  stays saved.
- **Delete** removes the current tree (with confirmation). Deleting the last tree
  starts a fresh empty one.
- **Automatic migration** — if you used an earlier single-tree version, your tree
  is folded into the library automatically the first time you open the new
  version. Nothing is lost.

## Saving, exporting, and importing

Everything autosaves locally, but you can also take your work out in several
formats:

- **PNG** — export the canvas as an image.
- **PDF** — export the canvas as a PDF.
- **PowerPoint (PPTX)** — export the canvas as a slide.
- **Markdown** — **Copy Markdown** (header) copies the tree as a structured
  outline: each node's value, hypothesis status, priority, MECE state, notes,
  and evidence, so a pasted outline holds the whole analysis.
- **JSON** — **Save JSON** (header) downloads the full document.
- **Open JSON** — **Open** (header) loads a saved `.json` tree back in. It's
  validated, and it opens as a **new** entry in your library, so it never
  overwrites an existing tree.

The PNG / PDF / PowerPoint exporters are loaded on demand, so they don't slow
down the app's first load.

## Undo, redo, and autosave

- **Undo / redo** every change with <kbd>Ctrl/⌘+Z</kbd> and
  <kbd>Ctrl/⌘+Y</kbd> (or <kbd>Ctrl/⌘+Shift+Z</kbd>), or the header buttons.
- **Autosave** — every change is saved to your browser's local storage
  immediately. Close the tab and come back; your trees are still there.

## Installing as an app (offline)

MECE Studio is a **Progressive Web App**. Your browser may offer to **install**
it (an icon in the address bar, or "Add to Home Screen" on mobile). Once
installed it runs in its own window and **works offline** — the whole app is
cached, so you can build trees on a plane.

## Settings

Open **⚙ Settings** in the header to tune three preferences. They're saved on
this device and apply to every tree; all three default to the original behaviour.

- **Sort siblings by priority.** Lay each split's branches out highest-impact
  first (by the impact × ease score) instead of the order you added them. Off by
  default — turning it on never changes your data, only the layout.
- **Stricter overlap detection.** The mutual-exclusivity check normally flags
  siblings that share a four-letter-or-longer word; strict mode also flags
  three-letter words, catching more possible overlaps at the cost of more false
  positives.
- **Formula tolerance.** How closely a value-driver (formula) split must
  reconcile to read as collectively exhaustive — from 0.1% to 5%, default 0.5%.

## Keyboard reference

These work on the canvas (they're ignored while you're typing in a field, so they
never hijack the inspector inputs). Press <kbd>?</kbd> any time to see this list as
an overlay in the app.

| Keys | Action |
| --- | --- |
| <kbd>Tab</kbd> | Add a child to the selected node and edit it |
| <kbd>Enter</kbd> or <kbd>F2</kbd> | Edit the selected node's label |
| Double-click | Edit a node's label inline |
| <kbd>Enter</kbd> (while editing) | Commit the label |
| <kbd>Escape</kbd> (while editing) | Cancel the edit |
| <kbd>Delete</kbd> or <kbd>Backspace</kbd> | Remove the selected node and its subtree |
| <kbd>Ctrl/⌘+Z</kbd> | Undo |
| <kbd>Ctrl/⌘+Y</kbd> or <kbd>Ctrl/⌘+Shift+Z</kbd> | Redo |
| <kbd>Enter</kbd> (in the Find box) | Zoom to the matching nodes |
| <kbd>?</kbd> | Open the keyboard-shortcuts overlay |

## Tips

- **Start with the question, not the answer.** The root node is a *question*;
  let the structure surface the answer.
- **Make splits explicit.** If a segment split feels incomplete, add an
  **"Other"** bucket — the CE check will go green and you'll have named the gap.
- **Use binary splits when you're unsure.** A / not-A is always MECE and often
  reveals the branch you were about to forget.
- **Prioritise before you dig.** Mark impact × ease early so you spend effort on
  the branches that matter.
- **Treat branches as hypotheses.** Set a status, hang evidence, and let the
  synthesis tell you where the case is strong or thin.
- **Read it back answer-first.** The Synthesis panel turns a sprawling tree into
  a one-paragraph story you can present.
