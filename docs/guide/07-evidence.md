# Evidence

A hypothesis is a claim. Evidence is what transforms a claim into a conclusion. Without it, your issue tree is an organised speculation — useful for structuring the problem, not useful for answering it.

This chapter is about how evidence works in structured problem solving: where it comes from, how to weigh it, and why the evidence that challenges your hypothesis is worth more than the evidence that supports it.

## Two directions of evidence

Every piece of evidence does one of two things relative to a hypothesis: it either **supports** it or **contradicts** it.

Supporting evidence is consistent with the claim being true. Contradicting evidence is consistent with the claim being false. Both are useful; both belong in the analysis.

This sounds obvious. In practice, most analysts weight supporting evidence heavily and let contradicting evidence slip away. They remember the interview that confirmed their view and forget the one that didn't. They pull the data that fits and treat the data that doesn't as an anomaly worth explaining later.

That is confirmation bias, and it produces conclusions that collapse under scrutiny. The discipline of working with evidence starts with committing to log both directions honestly.

> Contradicting evidence is not a problem to be explained away. It is information the tree needs.

## Not all evidence is equal

A second dimension matters as much as direction: **strength**.

Consider two pieces of supporting evidence for the claim "gross margin compression is being driven by rising input costs":
1. A cost controller mentions in passing that "things feel more expensive lately."
2. A line-by-line comparison of input invoices from Q1 last year versus Q1 this year shows a 14% weighted average cost increase across the top-ten materials.

Both support the hypothesis. They do not carry equal weight. The second piece should move your confidence substantially. The first should move it only a little.

The practical categories are roughly:
- **Weak**: anecdote, single observation, unverified secondhand account, intuition of a knowledgeable person.
- **Moderate**: directional data from a limited sample, a consistent pattern across several interviews, internal benchmarks.
- **Strong**: clean quantitative data covering the relevant population, multiple independent sources converging, external benchmarks from comparable organisations, primary research with statistical validity.

You don't need a precise formula. What you need is an honest read: is this the kind of evidence that would hold up if someone challenged it in front of a sceptical audience?

In MECE Studio, when you attach evidence to a node you set both its direction (supporting or contradicting) and a strength rating that you can cycle through. The node displays a count badge showing how many supporting and contradicting items you've gathered. This makes the state of evidence visible at a glance — a node with five strong supporting items and zero contradicting items is in a different position from a node with two weak supporting items and one moderate contradicting item.

## The special value of disconfirming evidence

One solid contradicting fact is often worth more to your analysis than ten confirming ones.

This is not intuitive, but the reasoning is sound. If your hypothesis is correct, you expect confirming evidence to show up almost everywhere you look. It's the default. The absence of contradicting evidence in a thorough search is meaningful; the presence of confirming evidence in an unstructured search is not.

Contradicting evidence, by contrast, is harder to find because you tend not to look for it — and when you do find it, it's diagnostic. One data point that clearly contradicts your hypothesis can:
- Prompt you to refine the hypothesis (the claim was too broad)
- Reveal a boundary condition you hadn't accounted for
- Kill the branch entirely, saving you from building a case that will fall apart later

The practical implication: when you are gathering evidence for a branch, deliberately search for the contradicting case. Ask the interviewee who is most likely to see it differently. Pull the numbers for the time period or segment most likely to look wrong. If you find nothing, that is genuine support. If you find something, you needed to find it.

## Practical evidence sources

Evidence doesn't require a research budget. It requires looking in the right places.

**Internal data** is usually the first stop: sales figures, cost ledgers, operational metrics, historical comparisons. These are often imperfect — incomplete, inconsistently defined, covering the wrong time horizon — but they are fast and free. The question is not whether the data is perfect but whether it is directionally reliable enough to move your belief about the hypothesis.

**Interviews** are underused in quantitative-heavy teams and overused in qualitative-heavy ones. The right framing: interviews are evidence sources, not proof. A consistent pattern across six independent interviews — where each person is describing the same dynamic from their own vantage point — is moderate-to-strong evidence. A single interview where someone confirms what you already believe is weak evidence, regardless of how senior the person is.

**Observation** means looking at what actually happens rather than what people say happens. For operational questions especially — "why is the process slow?", "where are errors introduced?" — watching the process is often faster and more accurate than interviewing people about it. Walk the floor. Run a transaction yourself. The gap between described process and actual process is frequently where the answer lives.

**External benchmarks** answer the question "is this unusual?" Your cost base grew 12% — is that fast or slow relative to comparable organisations? Without a benchmark, you can't calibrate. Industry reports, public financial filings, third-party databases, and published research all provide reference points. Benchmarks are often the fastest way to move a branch from "possibly the driver" to "definitely the driver" or "probably not the driver."

## How evidence moves a node from open to resolved

The mechanism is cumulative and a matter of judgment, not formula.

A node starts **open**: you have a claim and no evidence. As you gather evidence, you are building a case. At some threshold — when the weight of evidence is clear enough that a reasonable sceptic would accept the direction — the node moves to **supported** or **refuted**.

In MECE Studio, you make this call explicitly. You look at the evidence attached to the node: how many supporting items, how many contradicting, at what strength levels. You consider whether the contradicting evidence has been investigated and explained or whether it remains a genuine challenge. Then you set the status. The colour-coded edge reflects your judgment.

This is deliberate. There is no algorithm that sets the status automatically, because the judgment requires understanding the evidence, not just counting it. Two weak supporting items and one moderate contradicting item might resolve differently depending on whether the contradicting item has a known explanation or not.

What MECE Studio does is ensure you do not skip this judgment. Every node in the tree has a visible status, and an open node with accumulated evidence is a flag: you have what you need to call it, but you haven't called it yet.

## The confirmation bias trap in practice

Confirmation bias shows up in evidence work in specific, recognisable patterns:
- You interview the people most likely to agree with you.
- You pull data for the period or segment that looks best for your hypothesis and treat other periods as "exceptional."
- You weight an anecdote from a credible senior person heavily because it confirms your view, without noticing you would treat the same anecdote as weak if it contradicted you.
- You mark a branch supported after finding two moderate confirming items, without checking whether there's a strong contradicting data set you haven't looked at.

The most useful counter-habit: before marking any branch supported, ask yourself what the strongest possible case against this branch is, and whether you've actively looked for evidence of it. If you haven't, do that first. The time you spend looking for the thing that kills the hypothesis is almost never wasted — either you find something important, or you close out the branch with much higher confidence.

## Evidence and synthesis

Once nodes start moving from open to supported or refuted, the synthesis (see *Answer-first synthesis*) begins to write itself. The answer to the key question is the pattern of supported and refuted branches, read up from the bottom of the tree.

Evidence is what makes that synthesis credible rather than merely plausible. When you present a conclusion and someone asks "how do you know?", the answer should be: this branch is supported by these three items of evidence at these strength levels; this alternative was refuted by this contradicting data; the finding holds up across these independent sources.

That is the difference between a structured hypothesis and a structured answer. The tree gives you the structure. Evidence gives you the substance.

In MECE Studio, when you run the answer-first synthesis, the evidence attached to supported and refuted nodes is available to pull into the narrative — the ✓ and ✗ counts are a reminder of what's behind each claim. The goal is not to produce an evidence dump, but to make sure every claim in the synthesis has something behind it, and that you know what that something is before you walk into the room.
