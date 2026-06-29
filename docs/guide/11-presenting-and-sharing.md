# Presenting and sharing

The previous chapter was about *what* to say — leading answer-first, with the
fewest MECE arguments that prove your point. This one is about getting the tree
out of the tool and in front of the people who need it. A good issue tree is
already most of a communication; MECE Studio gives you a few ways to deliver it,
and the right one depends on your audience and the moment.

## Walking the tree live: presentation mode

When you are in the room — defending your structure in a working session, or
taking a team through the logic before the numbers land — you rarely want a
finished slide. You want to *walk* the tree, one decomposition at a time, so the
audience sees the structure build the way you reasoned it.

**Present** (from the **⋯** menu) does exactly this. It opens a full-screen,
distraction-free view and steps through the tree depth-first: each step shows one
question, the branches you split it into, and that split's MECE status. You move
with the arrow keys — <kbd>→</kbd> forward, <kbd>←</kbd> back — and leave with
<kbd>Escape</kbd>.

Because it walks the tree top-down, presentation mode naturally enforces the same
discipline as answer-first communication: the key question first, then its
handful of mutually exclusive branches, then *their* branches. If a slide feels
crowded or a branch feels like it overlaps its sibling, the audience will feel it
too — which makes presentation mode a useful final check on the structure, not
just a delivery tool.

## A clean handout: print

Sometimes the deliverable is paper, or a PDF appendix to a deck — something a
reader can hold and annotate. **Print…** (from the **⋯** menu) opens a print
preview that lays the whole tree out as a clean nested outline: the root
question, its type, the MECE summary, and every branch indented beneath its
parent. The app's own chrome is hidden, so what prints is just the tree. From the
browser's print dialog you can send it to a printer or **Save as PDF**.

A printed outline is dense and skimmable in a way a sprawling diagram is not — it
is often the better artifact to leave behind after a meeting.

## The diagram and the data: export

For everything else, the **Export ▾** menu turns the canvas — or the underlying
document — into a file. Pick the format by where it is going:

| Format | Best for |
| --- | --- |
| **PNG** | Dropping the diagram straight into a slide or document — a raster image that pastes anywhere. |
| **SVG** | Vector graphics that stay crisp at any size — large-format print, or a slide you will zoom into. The exported file is *sanitised* as it is written, so it can never carry executable content. |
| **PDF** | A single-page, shareable snapshot of the canvas. |
| **PPTX** | A starter PowerPoint slide with the diagram placed on it, ready to build around. |
| **Markdown** | The whole analysis as an indented outline — each node with its value, hypothesis status, priority, MECE state, notes, and evidence. Paste it into a doc, a wiki, or an email and the structure travels with it. |
| **JSON** | The raw document, round-tripping with **Open file…** — the format to hand a colleague when you want them to keep *working* on the tree, not just read it. |

The image and document exporters all render the same canvas, so a PNG, an SVG,
and a PDF of the same tree show the same thing in different media. Markdown and
JSON go the other way — they carry the *content*, not a picture of it, which is
what you want when the tree needs to keep living after the meeting.

## One tree, many audiences

The point of all of this is that you build the tree once. The structure you
reasoned out — MECE at every split, hypotheses where you have them, evidence and
numbers attached — is the single source. Presentation mode, the printed outline,
the diagram exports, and the data exports are just different windows onto it.
Choose the window for the audience: walk it live with a working group, hand a
printed outline to a busy executive, drop a PNG into the board deck, and pass the
JSON to the analyst who will take it further.
