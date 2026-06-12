# Doing the numbers

Most problems that land on your desk have a number somewhere at the root. "Why are profits falling?" is not just a structural question — it is a quantitative one. The answer, eventually, has to be: *by how much, driven by what, fixable for how much?*

When your question is quantitative, your issue tree becomes something more specific: a **value-driver tree**. The logic is identical — MECE splits, working hypotheses, prioritisation — but now every split carries an operator, every leaf carries a number, and the whole thing rolls up into the number you care about at the root.

This chapter shows you how to build that kind of tree, read a reconciliation check, and use sensitivity analysis to find the number that actually matters.

## Why structure beats a spreadsheet

A spreadsheet can do all of this arithmetic. So why bother with a tree?

Because a spreadsheet hides its logic. You see cells and formulas, but you cannot see at a glance whether the model is MECE, which branch drives the most variance, or where the weak assumptions sit.

A value-driver tree makes the **structure visible**. Every split is justified — you cannot add a row out of habit; you have to explain why it belongs as a child of its parent. The MECE check is live, so overlaps and gaps surface immediately. And the sensitivity ranking is computed from the tree topology, not from a column you manually highlighted.

The practical effect: when you present the numbers, you can defend the structure as well as the arithmetic. That is a different conversation than "trust the model."

## Operators: sum, product, difference

Every node in a value-driver tree either carries a leaf value or is defined by its children via an **operator**. There are three that cover almost everything:

**Sum** — the parent is the total of its children.

> Gross revenue = Product A revenue + Product B revenue + Product C revenue

**Product** — the parent is the product of its children.

> Revenue = Price × Volume

**Difference** — the parent is one child minus another.

> Profit = Revenue − Cost

That third one is the split you will use most. Almost every profitability question decomposes, at the first level, into a difference: the top line minus the bottom line.

When you assign an operator to a node in MECE Studio, the tool knows that the node's value is *derived* — you do not enter it by hand. Instead you enter values on the leaves, and the parent is computed. This is what makes roll-up possible.

## Building the running example

Take the question from earlier chapters: **"Why are profits falling?"**

The first split is a difference:

```
Profit = Revenue − Costs
```

Revenue decomposes by product:

```
Revenue = Price × Volume
```

So Price and Volume are leaves. Costs decomposes as a sum:

```
Costs = Input costs + Operating costs
```

Both of those are also leaves for now.

Here is the tree with illustrative numbers filled in:

| Node | Operator | Value | Unit |
|---|---|---|---|
| Profit | difference | *computed* | DKK |
| Revenue | product | *computed* | DKK |
| Price | leaf | 250 | DKK/unit |
| Volume | leaf | 4 000 | units |
| Costs | sum | *computed* | DKK |
| Input costs | leaf | 620 000 | DKK |
| Operating costs | leaf | 380 000 | DKK |

Roll up: Revenue = 250 × 4 000 = **1 000 000 DKK**. Costs = 620 000 + 380 000 = **1 000 000 DKK**. Profit = 1 000 000 − 1 000 000 = **0 DKK**.

That is a break-even position. Now suppose last year's numbers were: Price 270, Volume 4 200, Input costs 590 000, Operating costs 350 000. Last year's profit: (270 × 4 200) − (590 000 + 350 000) = 1 134 000 − 940 000 = **194 000 DKK**.

The profit has gone from 194 000 to zero. That is the question. The tree tells you the arithmetic is exact — but it does not yet tell you which driver to chase.

## Entering values and units in MECE Studio

On a leaf node, open the node panel and enter a numeric value and a unit. Units matter: they prevent category errors (adding DKK to units), and they appear on exports so your audience can see what they are reading.

On an interior node, set the operator (sum / product / difference) and leave the value field blank — the tool computes it. If you do enter a value manually on an interior node, the **reconciliation check** activates.

## The reconciliation check

The reconciliation check answers a simple question: *do the children actually add up to what you claimed the parent is?*

This matters because you will sometimes inherit a parent value from an external source — a reported profit figure, a budget line, a benchmark — and build the tree from the top down. You fill in the leaf estimates, roll up, and then check: does the computed value match the external figure?

A tolerance exists because real data is messy. If the mismatch is small (within tolerance), the check passes. If it is large, the check flags it: the children do not reconcile with the parent.

> A failing reconciliation is not always a mistake. It is sometimes a discovery — that your mental model of how the parts relate to the whole was wrong.

Common causes of reconciliation failure:

- A missing branch (a cost category you forgot)
- Double-counting (a driver that appears in two places)
- Wrong operator (summing something that should be a product)
- Stale data (a leaf value that belongs to a different time period)

Each of these is structurally informative. The reconciliation check is not an error message — it is a MECE check applied to numbers.

## Sensitivity analysis: finding the number that matters

Once the tree rolls up correctly, the most powerful thing you can do is ask: **which leaf driver, if it moved, would move the root the most?**

This is sensitivity analysis. The mechanics are simple: move each leaf driver up 10% and down 10%, one at a time, and measure how much the root changes. Then rank the drivers by the size of that swing.

In MECE Studio, this is a one-click operation on any tree that has numeric leaves. The output is a ranked list. For the example above, with the numbers as given, the ranking looks roughly like this:

| Driver | ±10% swing on Profit | Interpretation |
|---|---|---|
| Volume | ±100 000 DKK | Largest lever |
| Input costs | ±62 000 DKK | Significant |
| Operating costs | ±38 000 DKK | Moderate |
| Price | ±100 000 DKK | Tied with volume |

Wait — Price and Volume tie here because Revenue = Price × Volume, and both are 250 and 4 000 respectively. The tie is arithmetically exact in this symmetric case. In real data, they will diverge.

The point is not the exact ranking. The point is that **the ranking tells you where to spend your investigation time**.

If volume is the largest swing, go find out why volume fell — and whether it can be recovered. If input costs dominate, go understand the cost structure. The sensitivity ranking does not answer those questions, but it tells you which questions to answer first.

> The sensitivity ranking is a prioritisation tool wearing arithmetic clothes. It does exactly what the impact axis in a prioritisation matrix does — but it computes the impact from the structure of the tree, rather than asking you to estimate it.

This connects directly to the chapter on **Prioritise**: there, you score branches by impact and ease; here, impact is *derived* rather than *asserted*. Both approaches point at the same thing: where to spend time.

## A sensitivity reading in practice

Suppose your sensitivity output shows that volume has a 3× larger swing than price. What does that tell you?

First, it tells you that fighting over a 10% price improvement will move profit less than achieving a 10% volume improvement. If you have a fixed amount of management attention, spend it on volume.

Second, it tells you which assumptions to stress-test. If volume is that sensitive, your profit forecast is fragile to volume assumptions. Before you present numbers to a board, you want the volume estimate to be well-grounded — sourced from pipeline data, customer contracts, or a credible market model. A back-of-the-envelope volume number will undermine the whole tree.

Third, it shapes the conversation. When you present, you can say: "Profit is most sensitive to volume — a 10% shortfall here costs us X DKK, which is three times larger than the same miss on price. So the conversation we need to have is about the volume trajectory." That is a specific, defensible claim. It comes directly from the tree.

## When to stop subdividing

Value-driver trees can grow deep fast. Every leaf can, in principle, be split further — Volume into new customers and retained customers; Input costs into raw materials and energy and logistics. When do you stop?

Stop when the split no longer helps you make a decision or focus an investigation. Ask: *if I had two different numbers for these two children, would I do anything differently?* If the answer is no, the split adds complexity without adding value.

In practice, two to three levels of decomposition is usually sufficient to get from the root question to drivers that someone in the organisation actually controls or can measure. Go deeper only when the sensitivity ranking points you at a node that is still too aggregate to act on.

## From numbers to insight

A value-driver tree with a completed sensitivity ranking does something that a spreadsheet cannot: it names the lever. It says, in the language of the problem, which driver is doing the most work — and by how much.

That is the input the next step needs. Once you know which driver matters, you need to assemble the evidence (covered in **Evidence**) and build the argument for what to do about it. The numbers tell you where to look; the synthesis tells you what to say about what you found.

The chapter that follows, **Answer-first**, shows how to take the output of a completed, prioritised, evidence-backed tree and turn it into a communication that works.
