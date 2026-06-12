# The issue tree

An issue tree is a question broken into smaller questions, and those smaller questions broken further still, until every piece is small enough to investigate directly. That's the whole definition. The power isn't in the metaphor — it's in what the structure forces you to do.

Once you have a well-formed key question at the root (as covered in the chapter on Start with the question), your job is to decompose it. What must you answer in order to answer the root question? Those answers become your second level. What must you answer in order to answer each of those? Those become your third level. You keep going until you reach questions that are concrete enough to take to data, to an expert, or to a calculation.

The result is a tree: one root, branches spreading outward, with leaves at the tips where the investigation actually happens.

## The parent–child logic

The governing logic of an issue tree is simple and strict: **to answer a parent question, you must answer all of its children.** This is what makes an issue tree different from a topic list or a brainstorm.

If your root question is "Why have profits fallen?" and your children are "What happened to revenue?" and "What happened to costs?", then the claim is: if you fully answer both children, you will have fully answered the root. Revenue and costs between them account for all of profit — so yes, if you understand what happened on both sides, you understand what happened to profit. The parent–child logic holds.

Now suppose you add a third child: "What is our competitive position?" That might be an interesting question, but it doesn't have the same logical relationship to the root. Your competitive position might *explain* what happened to revenue or costs, but it isn't a *component* of the profit question in the same structural sense. It belongs deeper in the tree — as a potential driver under the revenue or costs branch — not at the top level.

This distinction is the most important one in building a good tree. There are always many things worth investigating. The question is where they belong in the structure. Sub-issues should be decompositions of their parent — components, drivers, phases, segments — not just associated topics that seem related.

> Every child must be necessary for the parent, and together the children must be sufficient. That test catches most structural errors.

## Reading a tree

Issue trees grow left to right in MECE Studio, which matches how most people read: from the question on the left to the answers on the right. Each node is a question or sub-issue. Lines connect parent to children. The further right you go, the more specific and investigable the questions become.

A small issue tree looks like this:

<!-- ISSUE_TREE -->

In Figure 1, the root question — "Why have profits fallen?" — splits into two branches: revenue and costs. The revenue branch splits further into volume (fewer customers, or fewer purchases per customer) and price (lower prices realised, or a less favourable product mix). The costs branch splits into input costs (raw materials, labour, logistics) and efficiency (output per unit of input). At the leaf level, you have questions that a competent analyst can take to data: "Has average transaction value declined?" "What has happened to raw material costs per unit?"

That is the complete anatomy. Root question → mid-level drivers → leaf-level investigable questions. Most useful trees are three to four levels deep; very few need to go beyond five.

## How to grow a tree

You grow a tree by asking one question repeatedly: "To answer this, what do I need to know?"

Start at the root. Ask the question. Write down what you'd need to know to answer it — not everything that's potentially relevant, but the specific sub-questions whose answers would constitute an answer to the parent. Those are your first-level children.

Then take each child and ask the same question again. What would you need to know to answer this? Keep going until you reach questions that feel directly investigable — something you could assign to an analyst with a clear brief, or answer yourself with an afternoon in the data.

In MECE Studio, you add a child to any node directly on the canvas. The app offers decomposition types — segment, process, binary, formula, framework, freeform — each of which seeds type-appropriate starter children as a scaffold. These are starting points, not prescriptions; you'll rename and adjust them as you develop your thinking. The layout rearranges automatically as the tree grows, so you don't have to manage spacing or positioning. You can focus on the structure itself. The chapter on Ways to decompose goes deeper on how to choose among those types.

A few practical habits when building:

- **Name nodes as questions.** "Revenue" is a topic. "What happened to revenue?" is a question. The question form makes the parent–child logic testable: does answering this question help answer its parent? The topic form makes it easy to paper over structural sloppiness.
- **Add one level at a time.** Resist the urge to deep-dive into one branch while leaving others undeveloped. A tree with three levels on the revenue side and zero on the costs side is a sign that your favourite-solution instinct has taken over. Stay balanced until the structure is roughly symmetrical, then go deep where the evidence warrants.
- **Use provisional names.** Early in the build, your node names will be rough. That's fine. The purpose of the first pass is to get the structure right, not to produce polished phrasing. You'll refine names as understanding develops.

## Depth versus breadth

There's a permanent tension in issue trees between going wider (more branches at the same level) and going deeper (more levels in a single branch). Neither is always right.

**Too broad** means your first level has six or eight branches, each vague enough that you can't tell which ones actually matter. The tree becomes hard to prioritize and harder to investigate, because the branches are too big to assign cleanly. If you find yourself with more than four or five first-level children, ask whether some of them should be grouped under a common parent that you haven't named yet.

**Too deep too fast** means you've dived into granular questions before establishing whether the high-level branch is even worth investigating. If "input costs" turn out to account for 0.1% of the profit decline, you don't need four levels of decomposition underneath them. Depth should be earned by the evidence, not preemptively assumed.

A useful rule of thumb: **go wide before you go deep**. Establish the full first level before developing any second level. Establish the full second level before developing any third. This keeps the tree balanced and ensures you don't overinvest in branches that don't matter.

The right depth for a branch is wherever you reach a question that's directly investigable. For some questions that might be level two; for others it might be level four. The tree's shape doesn't need to be symmetric — it needs to be honest about where the complexity actually lives.

## When to stop

You stop adding children when the question is directly investigable: when you could write a brief for an analyst, run a query in your data tool, or make a quick calculation. That's a leaf node. It doesn't need children — it needs work.

You also stop when you've confirmed that a branch is not a meaningful contributor. If you investigate the price branch and find that average realised price has been flat for two years — no meaningful movement — then the price branch is closed. It's not deleted from the tree (it was a legitimate hypothesis that has now been answered), but it doesn't need to be developed further.

This is one of the underappreciated uses of an issue tree: it lets you close branches explicitly. An unstructured investigation can feel like it never quite reaches a conclusion because it's never clear when you've covered enough. An issue tree creates natural closure conditions. When every branch at the leaf level has been investigated and answered, the root question is answered. You know you're done.

## The tree is a living document

Issue trees change as understanding develops. You'll add branches you didn't anticipate. You'll collapse branches that turned out to be dead ends. You'll occasionally restructure — realise that what you thought was a first-level issue is actually a driver of something else and move it down a level. That's not a sign of failure; it's a sign the analysis is working.

In MECE Studio you can drag nodes to reparent them, rename any node inline, and undo any change. The tree is meant to be edited iteratively, not built once and frozen. Save snapshots when you've reached a clean milestone, but don't treat any version of the tree as permanent until the analysis is actually done.

Collapsing branches you've already investigated can help too — once you know that the costs side is fully explained by input costs and you've documented the finding, collapsing the costs branch lets you focus visual attention on the open revenue questions. The canvas is a working surface, not a final product.

## A note on terminology

You'll sometimes hear issue trees called **logic trees**, **hypothesis trees**, or **value-driver trees**. They're closely related but not identical. A pure issue tree decomposes questions. A hypothesis tree makes an explicit claim at each node and tests it. A value-driver tree (covered in the chapter on doing the numbers) assigns numeric values to nodes and calculates upward through formula relationships.

MECE Studio supports all three modes — you can attach a hypothesis status to any node and run numeric values through formula splits — but the underlying structure is always a question broken into sub-questions. Start there, and the other modes layer on top naturally.

## Connecting the structure to the method

The issue tree is the skeleton of the whole method. Everything else — checking MECE, forming hypotheses, prioritising where to investigate, gathering evidence, synthesising findings — happens in relation to the tree. When you find a gap, you add a branch. When you find evidence, you attach it to a node. When you conclude, you read from the leaves back to the root.

That's the architecture of the whole process: build the map, investigate the map, and report from the map. The next chapter takes up the MECE standard — the quality test that tells you whether your map has the right shape.
