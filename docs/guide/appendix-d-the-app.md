# Appendix D — Working in MECE Studio

The body of this book is about the *method*. This appendix is a short reference
to the parts of the tool that help you work faster and keep your trees safe —
capturing structure quickly, starting from material you already have, juggling
several trees, and getting your work on and off disk.

## Capturing a decomposition fast

When you already know the branches — you have them in your head, or on a
whiteboard — you don't need to add them one node at a time. **Quick add issues…**
(from the **⋯** menu) opens a box where you type one issue per line; on confirm,
every line becomes a child of the selected node (or of the root, if nothing is
selected), all in a single undoable step. <kbd>Ctrl/⌘ + Enter</kbd> adds them
without reaching for the mouse.

It pairs well with keyboard tree-building (Appendix B): quick-add a level of
branches, then select one and <kbd>Tab</kbd> into it to go deeper.

## Starting from material you already have

You will often have the makings of a tree already — an agenda, a bulleted brief,
a tree someone sent you. **Import outline…** (from the **⋯** menu) turns it into a
tree:

- **A Markdown outline.** Paste headings and/or bullet lists; nesting comes from
  indentation. The first heading or line becomes the root question, and
  everything else nests beneath it. It is a structural import — you get the
  hierarchy and labels, ready to refine.
- **A tree's JSON.** Paste the JSON a colleague exported and it opens as a fully
  restored tree (this is the same format **Export ▾ → JSON** produces).

Either way, the import opens as a **new** entry in your library, so it never
disturbs the tree you are already working on.

## Several trees at once

Real work is rarely one tree. MECE Studio keeps a **library** of them, and you
can hold several **open at once** in tabs. Opening or creating a tree adds a tab
to a strip above the canvas (it appears once more than one tree is open); click a
tab to switch, the **×** to close it, and **+** to start another. Closing a tab
leaves the tree in your library — it just takes it off the strip — and your open
set is remembered the next time you return.

## Saving and opening files

Everything you do autosaves to your browser's local storage, so your trees are
there when you come back. On top of that, you can keep your work as real `.json`
files on disk:

| Action (⋯ menu) | What it does |
| --- | --- |
| **Open file…** | Load a saved `.json` tree from disk as a new library entry. |
| **Save** | Write the current tree to a file. In browsers that support it, the first Save asks where to put the file and every later Save writes straight back to that same file. |
| **Save As…** | Choose a new location for the current tree. |

In browsers without the File System Access API (Firefox, Safari at the time of
writing), **Save** falls back to a normal download and **Open file…** to a file
picker — so the feature works everywhere, just with one fewer convenience.

Keeping a `.json` file is how you hand a tree to someone else, back it up outside
the browser, or move it between machines — it round-trips exactly, structure and
analysis intact.
