# Working hypotheses

Most people approach a complex problem the same way: map everything out, gather data on every branch, and wait for an answer to crystallise. It feels thorough. It's also one of the slowest paths to insight — and one of the most common reasons analyses run out of time or lose their audience.

Hypothesis-driven problem solving flips the sequence. Instead of analysing first and concluding later, you commit to a **candidate answer** early and use the tree to test it. The tree stops being a map of everything that might matter and becomes a targeted argument you are trying to break.

This chapter explains how to work that way and how to avoid the traps that come with it.

## What a hypothesis is

A **hypothesis** is a specific, falsifiable claim about your key question. Not a vague direction — a claim precise enough that evidence could prove it wrong.

"Profits are falling because our cost base grew faster than revenue" is a hypothesis. "There might be a cost issue" is not.

The best hypotheses have two properties:
1. They are **concrete** enough to point at specific data. You know what you would need to see to confirm or refute them.
2. They are **bold** enough to commit to a direction. A hypothesis that covers every possibility is just a restatement of the question.

> A good hypothesis is a bet. The purpose is not to be right on day one — it is to be wrong efficiently.

## Why start with a hypothesis at all?

The logic is counterintuitive but holds up in practice. When you have a hypothesis, every branch of the tree is doing one of two things: providing evidence that the hypothesis is correct, or providing evidence that it is wrong. Both outcomes are useful. Analysis without a hypothesis rarely achieves either — it accumulates facts without accumulating conviction.

There are three concrete gains.

**Focus.** A hypothesis tells you which branches carry the answer and which are background noise. In the profits-falling tree, if your hypothesis is "revenue is flat but volume mix shifted toward lower-margin products," you immediately know which sub-issues to develop and which to treat as secondary. You don't spend three weeks building an exhaustive cost model if costs aren't the story.

**Speed.** Working consultants and analysts often have days, not months. The hypothesis gives you the fastest path to either a defensible conclusion or a clear statement of why the original guess was wrong. Both end the right way.

**Communication.** An audience — whether your manager, a board, or a client — finds it far easier to engage with "here is our working answer, here is why we believe it, here is what would change our mind" than with "here is everything we found." The hypothesis frames the conversation before you open a single slide.

## Building the day-one hypothesis

A **day-one hypothesis** is your best early guess at the answer, formed before you have done deep analysis. It draws on whatever you already know: prior experience with similar problems, a quick scan of available data, intuition from people close to the situation.

This is legitimate and important. You are not supposed to arrive at the problem blank. The day-one hypothesis is the raw material the tree will sharpen or discard.

For the profits question, a day-one hypothesis might be: "Gross margin per unit is being squeezed by rising input costs, while pricing has stayed flat." That's specific enough to test. It points at input-cost data and pricing history. It ignores headcount and fixed overhead for now — not because those don't matter, but because your initial read says they're not the driver.

You write this down and make it explicit. One sentence on the whiteboard. Then you build the tree to test it.

## Turning sub-issues into testable claims

The tree in *The issue tree* chapter showed how to decompose a key question into sub-issues. In a hypothesis-driven tree, each sub-issue becomes a **testable claim**, not just a category.

Instead of: "What happened to gross margin?" → sub-issues: volume, price, cost.

You write: "Gross margin declined because input costs rose ~15% over the period while selling prices held flat."

Now the sub-issue is a claim. You know what confirming it looks like (input cost data showing a 15% rise, pricing data showing stability). You know what refuting it looks like (costs flat, or prices declining in step with costs). The branch has direction.

This is the practical mechanic of hypothesis-driven work: at each level of the tree, the split isn't just "what are the components?" but "what do I believe about each component, and what would change my mind?"

## Using MECE Studio to track status

As you gather evidence and reasoning, each node in your tree is in one of four states:

- **Open** — the claim is still live; you haven't confirmed or ruled it out yet.
- **Supported** — the weight of evidence points toward this being true.
- **Refuted** — the evidence is against it; this branch is no longer carrying the answer.
- **Parked** — possibly relevant, but you've decided not to pursue it in this analysis.

MECE Studio lets you set this status on each node. The node displays a colour-coded edge so you can scan the whole tree and immediately see which branches are alive, which have been disproved, and which you're not pursuing. When you have fifteen nodes in the tree, this visual at-a-glance state is what keeps the team oriented.

The key mental shift: **a refuted branch is progress, not failure.** If your day-one hypothesis was "input costs are the driver" and you now have solid data showing costs were flat, you have learned something real. You mark that branch refuted, and the tree tells you where to look next. Elimination is half the work of structured problem solving.

Parked is also a legitimate status. Sometimes a branch is genuinely relevant to a deeper question but isn't the right fight for this engagement or timeline. Marking it parked is honest — you're not pretending it doesn't exist, you're making a conscious resource decision. MECE Studio keeps it visible so it doesn't get forgotten.

## The discipline: try to kill your hypothesis

This is where most people go wrong. Once you've formed a hypothesis and started building support for it, there is a strong pull toward confirming rather than testing. You notice the data that fits, you underweight the data that doesn't, you frame questions in ways that lead witnesses toward the answer you expect.

This is confirmation bias in its most professionally damaging form. It produces analyses that feel airtight right up until someone in the room asks the one question you didn't pursue — and the whole argument collapses.

The antidote is a standing discipline: **actively look for the thing that would kill your hypothesis.**

Ask yourself explicitly: what data, if I saw it, would force me to abandon this branch? Then go look for that data. If you can't find it, that is genuine support. If you do find it, you've saved everyone a lot of time.

Practically, this means:
- Identifying the **critical assumption** your hypothesis rests on — the one thing that has to be true — and testing it first.
- Seeking out people who disagree and understanding their reasoning.
- Treating contradicting evidence as higher priority than confirming evidence, because it's rarer and more valuable.

If your hypothesis is "revenue is falling because of customer churn," the critical assumption is that the customer base is actually shrinking. Before you build a fifty-slide churn analysis, check that assumption. If retention is actually flat and the revenue decline is from lower order values among existing customers, you've just redirected the whole analysis in an hour.

## Don't fall in love with the first hypothesis

The day-one hypothesis is a starting position, not a conclusion. The tree may evolve it significantly.

Common patterns:
- The hypothesis is **directionally correct but misspecified**. Costs are the driver, but it's logistics costs, not input costs. You refine rather than discard.
- The hypothesis is **correct but incomplete**. Churn is real, but so is price erosion. The answer requires two branches.
- The hypothesis is **simply wrong**. The data contradicts it cleanly. You shift to an alternative, using what you now know.

All three of these are fine outcomes. What you want to avoid is carrying a refuted hypothesis forward because you've invested in it. The colour-coded tree helps here — it makes it hard to pretend a red branch is green. When three of your five sub-issues are marked refuted, the hypothesis supporting them needs to change.

In MECE Studio you can also **park** a hypothesis you've moved away from without deleting it. That matters if someone asks later why you didn't pursue a particular direction — you have a record that you considered it and when you set it aside.

## A note on sequencing

The chapters *Prioritise the 80/20* and *Evidence* build directly on what's here. Prioritisation helps you decide which branches to test first — the answer is almost always: test the critical assumption of your current hypothesis before you test anything else. Evidence is the mechanism by which nodes move from open to supported or refuted.

Together, these three practices — hypothesis formation, prioritisation, and evidence gathering — are the operating cycle of a hypothesis-driven analysis. You form a belief, you decide what to test, you gather what you need, and the tree reflects reality more accurately with each iteration.

The tree at the end of a good analysis looks very different from the tree at the start. Many branches are refuted. A few are supported. The synthesis almost writes itself, because the answer is visible in the structure before you put words to it. That is the goal — not a perfect first hypothesis, but a disciplined process that converts a messy question into a clear conclusion, fast.
