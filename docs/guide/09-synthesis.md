# Answer-first

You have done the hard work. The question is sharp. The tree is MECE. The high-priority branches are clear. The evidence is in. The numbers, in the chapter **Doing the numbers**, pointed you at the levers.

Now someone is going to ask you what you found.

This chapter is about how to answer them. Specifically, it is about a discipline called **answer-first** — leading with your conclusion, not with the story of how you reached it. It is also about how a well-built issue tree practically writes this communication for you.

## The trap: narrating the analysis

The natural instinct, after a thorough investigation, is to tell the story in the order you lived it. Here is the data we collected. Here is what we looked at first. Here is what we ruled out. Here is what we found. Therefore, here is the answer.

This is **bottom-up narration**, and it fails for most professional audiences because:

1. The answer arrives last, after the audience has already spent effort trying to guess where you are going.
2. Senior stakeholders will interrupt before you get there — they will ask "so what's the recommendation?" in the middle of your third slide.
3. If the answer is uncomfortable, building to it slowly signals that you are not fully behind it.
4. It is long. Most of the analysis story is irrelevant to a decision-maker; they need the conclusion and its justification, not the analytical journey.

The answer-first alternative inverts the structure entirely.

## The answer-first principle

> Lead with your governing thought. Then deliver the fewest MECE arguments that prove it. Then the evidence.

This structure — conclusion first, then reasons, then support — is sometimes called the **pyramid principle** (the McKinsey tradition traces it to Barbara Minto's work). The mental model is a pyramid: the point sits at the top; below it are the supporting arguments; below those are the facts and evidence.

Applied to the "Why are profits falling?" question, the pyramid looks like this:

```
GOVERNING THOUGHT
Profit has fallen 194 000 DKK year-on-year, driven primarily
by a 5% volume decline and a 5% rise in input costs.

SUPPORTING ARGUMENTS
1. Volume fell from 4 200 to 4 000 units (−5%)
2. Input costs rose from 590 000 to 620 000 DKK (+5%)
3. Price and operating costs were broadly stable

EVIDENCE
- Sales pipeline data showing lost accounts in Q3
- Supplier invoices showing raw material price increases
- P&L comparison confirming stable operating cost base
```

Each level is MECE. The three supporting arguments together account for the full profit gap — no overlap, no gap. The evidence substantiates each argument.

Notice what is missing: the months of analysis, the branches you ruled out, the data cleaning. None of that appears in the communication. It happened; it is why you can stand behind the conclusion; but it is not in the story you tell.

## How the tree writes the synthesis

This is the payoff for all the structural work in earlier chapters.

A well-built, prioritised, evidence-backed issue tree already contains everything the pyramid needs — in the right order.

The **root question** becomes the occasion. ("We set out to understand why profits fell.")

The **governing thought** comes from the highest-priority branches plus your hypothesis status. If your Revenue hypothesis was supported ("Revenue is down") and your Costs hypothesis was also supported ("Costs are up"), and sensitivity showed both are significant, your governing thought is: *Profit is being squeezed from both sides — lower revenue and higher costs — with volume and input costs as the primary drivers.*

The **supporting arguments** come from the first-level branches, sorted by priority. The chapter **Prioritise** covered how to score each branch by impact and ease; that score now determines what you say first, second, third. High-priority, confirmed hypotheses become your headline arguments. Low-priority or unconfirmed branches either get a brief note ("Price was broadly stable") or are omitted.

The **evidence** is already on the nodes. In **Evidence** you attached sources, data references, and observations to each node. The synthesis just surfaces them in the right place — under the argument they support.

The MECE check ensures there are no logical gaps in the argument. If the synthesis panel flags an overlap, it means two of your arguments are not independent — you need to restructure before communicating. If it flags a gap, you may be leaving out a factor that your audience will ask about.

None of this requires you to rebuild the communication from scratch. The structure already exists. You are reading it back in the right order.

## MECE Studio's synthesis panel

The synthesis panel reads your tree and renders it answer-first automatically.

It opens with your **governing answer** — the day-one hypothesis you stated in the **Answer** banner above the canvas — paired with a rolled-up **verdict** computed from the top branches' status: *"3 of 5 top branches supported, 1 refuted — the answer partially holds."* That one line is the pyramid's apex, with the tree's own bookkeeping standing behind it.

Then come the branches, led by the **highest-priority** one and continuing in priority order, descending. For each branch it surfaces:

- The **hypothesis status** (✓ supported, ✗ refuted, ⊘ parked; open branches carry no mark) so your audience can see what is settled and what is still uncertain
- The **evidence** you attached to that branch — sources, data, observations
- In a value-driver tree, the **numbers**: each node's value and unit, the rolled-up total on a formula parent, and the **most-sensitive driver** — so the answer includes its maths
- Any **MECE flags** — gaps or overlaps the live checker found

The result is a structured narrative you can read top to bottom. It does not write prose for you, but it gives you the skeleton: the right argument, in the right order, with its support visible.

From the panel you can **copy as Markdown** and paste directly into a document, email, or presentation notes. The structure survives the paste — you get headings, bullet points, and evidence inline, ready to edit into prose.

When the deliverable is the answer itself, skip the paste altogether: **Export ▾ → Answer (1-page)** writes a clean, self-contained **HTML memo** — thesis on top, verdict, then the branches in priority order — ready to hand over as-is. It is the actual handoff document, not a canvas screenshot.

## Communicating with different formats

The tree synthesis gives you the logical structure. How you package it depends on the format:

**Slide deck** — One slide per supporting argument. The title of each slide is the argument stated as a conclusion ("Volume declined 5% due to Q3 account losses"), not a topic label ("Volume analysis"). The body of the slide is the evidence. The first slide is the governing thought. This is the "SCR" structure (Situation, Complication, Resolution) or the "action title" convention that consulting decks use — the tree writes it for you.

**Email or briefing note** — The first paragraph is the governing thought. Each subsequent paragraph covers one supporting argument, in priority order. Evidence is cited inline or attached. This is the format senior stakeholders read on their phones; they stop after the first paragraph unless they want detail.

**Meeting or verbal presentation** — Start with: "Here is what we found: [governing thought]." Then: "Let me walk you through the three reasons." Then one supporting argument at a time, with evidence. Questions will arrive; the tree structure means you can answer "where does that fit?" precisely — either it is on the tree, or it is not, and you can say which.

## Handling supported, refuted, parked, and open hypotheses

Not everything will be settled when you communicate. Some hypotheses stay open because you could not get the data in time. Some are refuted — which is itself a finding worth stating.

The pyramid handles this cleanly:

- **Supported** hypotheses become supporting arguments. State them as facts.
- **Refuted** hypotheses belong in a brief section ("What we ruled out") if your audience is likely to ask, or in an appendix. They are part of the story only if the audience needs to trust the process.
- **Parked** hypotheses — ones you deliberately set aside — show a ⊘ mark in the synthesis. Name them as deferred so no one assumes they were tested and dismissed.
- **Open** hypotheses should be named as uncertainties. "We believe X, but we have not yet confirmed the underlying driver. The risk is Y." Open branches carry no mark — they are simply untested, a signal to you and your audience that work remains.

Hiding open hypotheses is a common failure mode. If you present a conclusion that rests on an unconfirmed assumption, and the audience later discovers this, you lose credibility. Better to name the uncertainty and state what it would take to resolve it.

## The loop back to the key question

A synthesis is not just a communication technique. It is also a **quality check** on the analysis.

Read your governing thought back against the key question from the chapter **Start with the question**. Does the governing thought actually answer the question?

"Profits are falling because of volume and input costs" answers "Why are profits falling?" — yes.

"Volume declined in Q3 due to account losses in the enterprise segment" does not answer the original question on its own — it is a supporting argument, not a governing thought.

This check catches a common failure: drifting from the original question as the analysis deepens. You get absorbed in a particularly interesting branch — say, the competitive dynamics behind the volume decline — and end up presenting a detailed answer to the wrong question.

> The key question is the north star. The governing thought must answer it. If it does not, either reframe the governing thought or go back and check whether the key question has evolved.

A related check: is the governing thought something your audience can act on? "Profits are falling because of structural industry headwinds" is technically an answer, but it implies helplessness. "Profits are falling primarily because of input cost inflation, which can be partially offset by renegotiating the top three supplier contracts" is actionable. The difference is in the specificity of the supporting structure — which is exactly what the tree provides.

## The synthesis as a living document

The synthesis panel in MECE Studio reflects the current state of the tree. As you gather more evidence, mark hypotheses supported or refuted, or adjust priorities, the synthesis updates. This means you can use it iteratively — not just at the end of the process, but throughout.

At each stage-gate in a project, you can read the synthesis and ask: given what we know now, what would we tell the client or the steering committee? This keeps the communication honest. It prevents the common failure of presenting a confident synthesis built on analysis that is actually three weeks out of date.

When you copy the Markdown output, it captures the governing thought, the branches in priority order with their hypothesis status (✓ supported, ✗ refuted, ⊘ parked), the evidence on each, and any outstanding MECE flags — the whole state of the analysis as a structured snapshot. Anyone reading it later sees exactly which hypotheses were settled and which were still open.

## What you have, and what it is worth

By the time you reach synthesis, you have:

- A question that is worth answering
- A MECE tree that covers the full problem space
- Hypotheses that direct the analysis toward the most likely answers
- Priorities that tell you which branches to act on first
- Evidence that substantiates the claims
- Numbers (where relevant) that quantify the drivers and rank the levers

What the synthesis does is **make all of that communicable**. The structure that has been invisible to your audience — the tree, the MECE logic, the prioritisation — becomes the backbone of a clear, defensible argument.

Answer-first is not a presentation trick. It is the natural consequence of building the analysis the right way. If the tree is well built, the synthesis is already there. You are reading it out loud.

You have now seen every move in isolation. The next chapter runs them in sequence — one real problem, from a vague worry to a board-ready answer.
