# Appendix B — Keyboard reference

MECE Studio is built for flow — you can construct and edit a whole tree without
leaving the keyboard. These shortcuts work on the canvas; they're ignored while
you're typing in an inspector field, so they never hijack your input.

## Building and editing

| Keys | Action |
| --- | --- |
| <kbd>Tab</kbd> | Add a child to the selected node and start editing it |
| <kbd>Enter</kbd> or <kbd>F2</kbd> | Edit the selected node's label |
| Double-click | Edit a node's label inline |
| <kbd>Enter</kbd> (while editing) | Commit the label |
| <kbd>Escape</kbd> (while editing) | Cancel the edit, keep the old label |
| <kbd>Delete</kbd> or <kbd>Backspace</kbd> | Remove the selected node and its subtree |

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

## A keyboard-only workflow

To build a tree from nothing without touching the mouse:

1. Select the root and press <kbd>Enter</kbd> to name your key question.
2. Press <kbd>Tab</kbd> to add the first sub-issue and type its label.
3. Press <kbd>Enter</kbd> to commit, then <kbd>Tab</kbd> again for the next
   sibling — or select a child and <kbd>Tab</kbd> to go a level deeper.
4. Use <kbd>Ctrl/⌘ + Z</kbd> freely; every change is undoable.

The same labels and structure you build this way are what feed the MECE checks,
the synthesis, and every export.
