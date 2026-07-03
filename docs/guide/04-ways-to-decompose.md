# Ways to decompose

Knowing that a split should be MECE is one thing. Knowing *how* to cut it is another. Most practitioners who struggle with issue trees are not confused about the MECE principle — they are stuck staring at a blank node, wondering which children to draw. This chapter gives you a small toolkit of reliable decomposition types, a way to choose among them, and a feel for what each one looks like in practice.

The six types are: **binary**, **segments**, **process**, **formula**, **framework**, and **freeform**. None is universally right. Each is well-suited to a particular kind of question, and each has a different relationship to MECE.

## Binary (A / not-A)

A binary split divides the world into something and its complement: churned customers vs. customers who did not churn; products above target margin vs. products below; revenue from new channels vs. revenue from existing channels.

Binary is always MECE. The logic is airtight: something either belongs to the A group or it doesn't, there is no third option, and together A and not-A cover everything. You cannot overlap, and you cannot leave a gap.

Use binary when:

- You are not sure yet how to cut a question and need a safe start.
- You want to isolate a group you care about while keeping everything else in view. "Is the profit problem in the revenue line, or is it not in the revenue line?" forces you to look both places.
- You want to make sure you are not ignoring the other half. Binary makes the complement explicit, which is its greatest virtue. Teams routinely investigate the A side and forget the not-A side exists.

The limitation is precision. "Customers who did not churn" is a real and useful category, but it is also enormous and heterogeneous. Binary is typically a first cut that you then refine on one or both sides.

**Running example.** You suspect the profit decline is a revenue problem. A binary split of the root question: **Revenue is falling / Revenue is not falling**. If Revenue is fine, the whole problem is on the cost side and you can stop investigating revenue. If revenue is falling, you go one level deeper.

## Segments

A segment split divides a whole into its parts: geographic regions, customer types, product lines, business units, time periods. You are carving up a population or a total.

Segments are MECE only with an explicit **"Other"** bucket. This is the standard trap: you list the segments you know (Europe, Americas, Asia-Pacific) and implicitly assume nothing else exists. If even one customer or one dollar of revenue is in a country that fits none of those three, the split is not exhaustive. Adding "Rest of World" or "Other" makes it honest.

Use segments when:

- The question is naturally about parts of a whole: "where is the revenue concentrated?", "which customer group is driving churn?", "which product line is underperforming?"
- You have data already segmented this way and want the tree to match reality.
- The problem is likely to be concentrated in one part, and you want to isolate it.

Watch for the mixed-dimension trap described in *MECE: no overlaps, no gaps*. "Big / small / online" mixes size and channel. Pick one dimension at a time and split cleanly on that dimension before adding another.

**Running example.** Revenue splits into: **Domestic / International / Other**. Each region is a distinct segment; Other captures anything outside the main two. Now you can investigate whether the drop is concentrated in one region, or spread evenly, before going deeper.

## Process / stages

A process split follows the order of a sequence: the stages of a sales funnel, the steps in a supply chain, the phases of a customer journey. You are asking "at which stage does the problem occur?"

Process splits are MECE when the stages are ordered (each follows the last), non-overlapping (a unit is at one stage at a time), and complete (the sequence runs from start to finish with no steps missing). A classic funnel — Awareness → Consideration → Trial → Purchase → Retention — is MECE if those five stages cover the entire customer relationship.

Use process when:

- The question is explicitly about a pipeline, a journey, or a workflow: "where is the sales process leaking?", "at which stage are customers dropping off?", "which step in the production process creates the defect?"
- You need to assign ownership, because stages often map to teams.
- The goal is to isolate the bottleneck — which is much faster when you can rule out entire stages.

The risk is gaps in the sequence. If your customer journey has a post-purchase onboarding phase that matters but you omit it, you have a CE failure. Map the full process first, then decide which stages to group or split.

**Running example.** You are investigating why revenue from new customers is falling. You split the sales process into: **Lead generation / Qualification / Proposal / Close / Onboarding**. Each stage is ordered, non-overlapping, and the five stages cover the full journey from stranger to active customer. You can now ask at which stage the conversion rate has changed.

## Formula / value-driver

A formula split decomposes an outcome using arithmetic: Revenue = Price × Volume; Profit = Revenue − Costs; Customer lifetime value = Average order value × Purchase frequency × Gross margin.

Formula splits are provably exhaustive because the equation is the proof. If the equation holds, you cannot have a gap — every contributor to the outcome appears as a term. And the terms are exclusive by definition, because each represents a distinct quantity.

Use formula when:

- The question is quantitative: "why is revenue below target?", "what is driving margin compression?", "how sensitive is the model to price changes?"
- You want to anchor the tree in arithmetic that can be measured and stress-tested.
- You are building toward a value-driver tree where numbers on the leaves roll up to the root.

The mechanics of value-driver trees — how to assign values, units, and operators, how numbers roll up, and how to run a sensitivity analysis — are covered in *Doing the numbers*. What matters here is the structural point: writing the equation first gives you the split for free, and the split is MECE by construction.

**Running example.** Revenue splits into **Price** and **Volume** (Revenue = Price × Volume). You can immediately ask: has average selling price fallen, or have units sold fallen, or both? Those are different investigations, requiring different data and pointing to different remedies.

## Framework

A framework split uses an established lens: People / Process / Technology; the 4 Ps (Product, Price, Place, Promotion); McKinsey's 7-S; Porter's Five Forces; the 3 Cs (Company, Customers, Competitors). Someone else has already done the decomposition work, and you are borrowing it.

Frameworks are fast and give you something credible to show stakeholders who recognise the lens. The risk is that a generic framework may not be MECE for your specific problem. The 4 Ps were designed for marketing; applied to "why is employee retention falling?", Price and Place are at best a stretch. Before committing to a framework split, run the standard ME and CE tests: would anything fall between the categories? Can anything land in two?

Use frameworks when:

- The problem is well-trodden and the framework was designed for it.
- Speed matters more than precision — a framework gets you to a draft tree in minutes.
- You need to communicate the structure to a broad audience and the framework carries meaning for them.

Always check the fit explicitly. A framework is a starting point, not a certification of MECE.

**Running example.** You split the cost question using People / Process / Technology. Labour costs sit in People; inefficient workflows in Process; software and equipment in Technology. Check: is there anything that fits two buckets? Consulting fees paid to fix a technology problem could land in either. Either rename the buckets or accept the overlap and note it. Check: is there anything that fits none? Rent, raw materials, energy — none of the three standard categories clearly owns these. Add a fourth, or switch to a formula split of the cost line instead.

## Freeform

Freeform is what you do when none of the structured types fits yet. You name children as they occur to you, without committing to a structural principle. It is brainstorming, not decomposition.

Freeform is a legitimate early step. Messy problems rarely announce their structure upfront. Writing down four or five possible drivers as freeform children is often the fastest way to see whether they cluster into a cleaner type.

Use freeform when:

- You genuinely do not know how the problem divides yet.
- You are exploring with a client or team and want to capture ideas before organising them.
- You are mid-tree and have hit a node that resists a clean structural cut.

The discipline is to treat freeform as temporary. Once you have the children on the canvas, ask: do these cluster? Do they follow a sequence? Can I write an equation? Could I split binary first? If the answer to all of those is no, freeform may be the right permanent answer — but you should have asked.

## How to choose

Start from how the thing naturally divides.

**If the question is quantitative**, write the equation. Formula.

**If you can identify a sequence**, map the steps. Process.

**If you are looking at parts of a population or total**, decide on one dimension and segment. Add Other.

**If you are stuck**, go binary. It is always MECE, it forces you to consider the complement, and it gets something on the canvas immediately.

**If the domain is well-understood**, borrow a framework. Check the fit.

**If nothing else works**, start freeform and look for structure after you have the ideas out.

A single tree can mix types across levels. The root might split by formula (Profit = Revenue − Costs), Revenue by segment (Domestic / International / Other), and the domestic revenue shortfall by process (at which funnel stage is conversion falling?). The rule is that each individual split uses a coherent type, not that the whole tree must use one.

## Scaffolds in MECE Studio

When you add a child node in MECE Studio and choose a decomposition type, the tool seeds **scaffold** starter children appropriate for that type:

- **Binary** → two children labelled with a placeholder and its complement, ready for you to rename.
- **Segments** → two placeholder segments plus an "Other" bucket, already satisfying the exhaustiveness requirement for segment splits.
- **Process** → a short sequence of placeholder stages.
- **Formula** → placeholder terms reflecting a simple equation structure.

A scaffold is a prompt, not an answer. The labels are generic; your job is to rename them to reflect the actual question. The point of the scaffold is to remove the blank-canvas problem — you always have something to react to — and to make the structural requirement of the type concrete. A segments scaffold that includes "Other" from the start reminds you that exhaustiveness requires it, even before you have filled in the real segments.

You can ignore the scaffold and type your own children directly. The decomposition type still governs the MECE check, so a segments node without an Other child will still flag the CE warning. The scaffold just makes it easier to start right.

The same idea applies from the very first move: when you build a tree from the Start page's key-question box, MECE Studio asks **"how do you want to split it?"** — pick a type and you land on a scaffolded, already-checkable first split instead of a lone root box (or start blank and decide later). Choosing the cut is the first analytical decision, and the tool puts it where it belongs: up front.

## Named frameworks in MECE Studio

Beyond the generic scaffolds, the **Templates** page carries a small library of **named frameworks** — the established lenses from the Framework section above, ready to drop onto a blank tree with their canonical branches already filled in. Pick one and you get a starter tree to rename to your situation:

- **Marketing** — the 4 Ps (Product / Price / Place / Promotion) and Lauterborn's customer-centric 4 Cs (Consumer wants / Cost / Convenience / Communication).
- **Strategy and industry** — Ohmae's 3 Cs (Company / Customers / Competitors), Porter's Five Forces, PESTEL, SWOT, and the BCG and Ansoff matrices.
- **Organisation** — McKinsey's 7-S.
- **Growth and diagnosis** — the AARRR "pirate metrics" funnel and the Ishikawa fishbone (the 6 Ms) for root-cause work.

Two things are deliberate about how these behave. First, they are *starters*, not answers — the root is a placeholder you rename, and every branch is yours to adapt. Second, and more important, MECE Studio does **not** badge them as provably MECE. They are typed as framework (or process, for the AARRR funnel), so the tool reports their exclusivity and exhaustiveness as *unchecked* rather than guaranteed. This is honest by design. None of these famous lenses is a clean partition: PESTEL's Political and Legal factors overlap, SWOT is a discussion starter that makes no claim to be exhaustive, and Porter built the Five Forces precisely because he found SWOT lacking in rigour. The library gives you the speed of a recognised framework while the checks keep reminding you to verify the fit — which is exactly the discipline this chapter argues for.

## Summary

Six decomposition types, each with a different MECE relationship:

| Type | MECE? | Best for |
|---|---|---|
| Binary | Always | Stuck; want to isolate A and see not-A |
| Segments | With "Other" | Parts of a population or total |
| Process | When complete | Pipeline, funnel, journey |
| Formula | By construction | Quantitative outcome; value-driver tree |
| Framework | Check the fit | Well-trodden domain; speed |
| Freeform | Rarely | Early exploration; treat as temporary |

Choose based on how the thing naturally divides. Prefer binary when stuck. Use formula whenever the question is quantitative, and read *Doing the numbers* to take it further. Use scaffolds as a starting point in MECE Studio — rename freely, but notice what the structure is telling you.

With the structure standing, the next move is to commit to a working answer and let the tree test it. That is the job of *Working hypotheses* — and *Prioritise* then decides which branches to work first.
