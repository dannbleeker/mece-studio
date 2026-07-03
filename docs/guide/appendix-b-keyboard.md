# Appendix B — Keyboard reference

MECE Studio is built for flow — you can construct, navigate, and edit a whole
tree without leaving the keyboard. These shortcuts work on the canvas; they're
ignored while you're typing in an inspector field, so they never hijack your
input.

## Building and editing

| Keys | Action |
| --- | --- |
| <kbd>Tab</kbd> | Add a child to the selected node and start editing it |
| <kbd>Shift + Enter</kbd> | Add a sibling to the selected node and start editing it |
| <kbd>Enter</kbd> or <kbd>F2</kbd> | Edit the selected node's label |
| Double-click | Edit a node's label inline |
| <kbd>Enter</kbd> (while editing) | Commit the label |
| <kbd>Escape</kbd> (while editing) | Cancel the edit, keep the old label |
| <kbd>Delete</kbd> or <kbd>Backspace</kbd> | Remove the selected node(s) and their subtrees |
| <kbd>P</kbd> | Bump the selected node's priority (none → low → medium → high) |

## Navigating

| Keys | Action |
| --- | --- |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Move selection between siblings |
| <kbd>←</kbd> | Select the parent |
| <kbd>→</kbd> | Select the first child |

## Selecting more than one node

| Keys | Action |
| --- | --- |
| <kbd>⌘/Ctrl</kbd> + click or <kbd>Shift</kbd> + click | Add a node to the selection |
| <kbd>Shift</kbd> + drag on empty canvas | Rubber-band (box) select everything inside |

With several nodes selected, a floating action bar sets their status or
priority, or deletes them — one undoable step. A plain drag still pans.

## History

| Keys | Action |
| --- | --- |
| <kbd>Ctrl/⌘ + Z</kbd> | Undo |
| <kbd>Ctrl/⌘ + Y</kbd> or <kbd>Ctrl/⌘ + Shift + Z</kbd> | Redo |

## Finding

| Keys | Action |
| --- | --- |
| Type in the Find box | Ring every node whose label matches |
| <kbd>Enter</kbd> (in the Find box) | Zoom to the matching nodes |

## Elsewhere in the app

| Keys | Where | Action |
| --- | --- | --- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Start page | Jump to All trees and focus the library search |
| <kbd>⌘/Ctrl + Enter</kbd> | Quick add issues | Add the typed issues |
| <kbd>→</kbd> / <kbd>Space</kbd>, <kbd>←</kbd> | Presentation | Next / previous step |
| <kbd>Escape</kbd> | Dialogs, presentation | Close / exit |

## Help

| Keys | Action |
| --- | --- |
| <kbd>?</kbd> | Open the keyboard-shortcuts overlay (this list, inside the app) |

## A keyboard-first workflow

To build a tree quickly, with your hands mostly on the keyboard:

1. Select the root and press <kbd>Enter</kbd> to name your key question.
2. Press <kbd>Tab</kbd> to add a sub-issue and type its label; <kbd>Enter</kbd> commits.
3. <kbd>Shift + Enter</kbd> adds the next sibling — so a whole level is
   <kbd>Tab</kbd> once, then <kbd>Shift + Enter</kbd> for each brother branch.
4. Walk the tree with the arrows — <kbd>↑</kbd>/<kbd>↓</kbd> between siblings,
   <kbd>←</kbd> to the parent, <kbd>→</kbd> into a branch — and <kbd>Tab</kbd>
   wherever the structure needs to go deeper.
5. Use <kbd>Ctrl/⌘ + Z</kbd> freely; every change is undoable.

The same labels and structure you build this way are what feed the MECE checks,
the synthesis, and every export.
