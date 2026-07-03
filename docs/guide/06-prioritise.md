# Prioritise the 80/20

A well-built issue tree can have fifteen, twenty, thirty nodes. You cannot work all of them equally. And if you try, you will spend three weeks doing analysis that a sharper team would finish in four days — and you'll probably reach a weaker conclusion.

Prioritisation is how you decide where to spend the hours you actually have.

## The core lens: impact × ease

Every branch of the tree can be rated on two dimensions.

**Impact** is how much working this branch could move the answer. If this sub-issue turns out to be the driver, how significantly does it explain what you're investigating? For the profits question: if gross-margin compression on the top-five products is responsible for 80% of the profit decline, that branch has enormous impact. The branch tracking administrative overhead on a segment that represents 3% of revenue has very little.

**Ease** is how cheap the branch is to test. Cheap means: the data is already available, the analysis is quick, and the conclusion is clear. Expensive means: you'd need weeks of fieldwork, primary research, or modelling to reach a conclusion.

The rule is blunt: **pursue high-impact, high-ease branches first.** They give you the most answer per unit of effort. If you're lucky, one or two of these will crack the problem wide open before you've touched the difficult branches at all.

> The point of prioritisation is not to do less work. It is to do the right work before you run out of time.

## The 80/20 instinct

The Pareto principle is a pattern, not a law — but it holds surprisingly often in structured problem solving. A small number of branches usually carry most of the explanatory weight.

In practice: of a twenty-node tree, three or four nodes typically account for the bulk of the answer. The rest is context, nuance, or simply not the story this time. If you let yourself get pulled into equal treatment of all branches, you dilute your resources across work that doesn't move the conclusion.

The 80/20 instinct means looking at your tree at the start of each day and asking: if I could only work three branches today, which three would get me closest to an answer? Then working those three, not the five easiest, not the ones you happen to find interesting, and not the ones your stakeholder mentioned last.

## How to score branches

You don't need a complex model. A simple 1–3 rating on impact and a 1–3 rating on ease gives you nine cells. The top-right corner (high impact, high ease) is your immediate priority. The bottom-left corner (low impact, hard to test) can often be dropped entirely.

In MECE Studio, you set a branch's priority in one click on a **3×3 impact-by-ease matrix** in the inspector — the nine cells of exactly this scoring model — with the resulting **High / Medium / Low priority band** shown live as you pick, and as a chip on the node itself, so when you look at the canvas you can see at a glance which branches are tier-one work and which are background. (On the canvas, pressing <kbd>P</kbd> on a selected node cycles its priority without opening the inspector.) When you export or generate the synthesis, MECE Studio orders the findings by priority — the high-impact nodes come first in the narrative, which is usually also the right structure for the answer.

Scoring doesn't have to be precise. A rough calibration across the team ("we all agree gross-margin compression is high impact; we all agree the admin overhead branch is low impact") is good enough to direct effort. The value is the shared prioritisation decision, not the score itself.

## The branches you should kill early

Some branches in a tree are there because MECE discipline required them — they complete the exhaustive coverage of the space — not because you expect them to carry the answer.

Killing these branches early (marking them low priority and moving on) is a feature, not a shortcut. You are not ignoring them; you are making an explicit, informed choice to treat them as background. MECE Studio's parked status in the hypothesis workflow (see *Working hypotheses*) handles this case — a branch can be structurally present without consuming analysis hours.

The test: if this branch turned out to be the driver, how surprised would you be? If the answer is "extremely surprised," it's a candidate for early deferral. If the answer is "not very surprised," it probably deserves time.

## The fairness trap

The most common prioritisation failure is spending equal time on every branch because it feels rigorous or fair. It is neither.

A team that allocates one week to each of eight branches will produce eight shallow analyses and a thin conclusion. A team that allocates six weeks to the three branches most likely to carry the answer and two weeks across the rest will produce a real finding.

Equal treatment signals an absence of judgment. Stakeholders often read it that way. "We looked at everything" is a weak conclusion. "We identified the key driver, confirmed it with data, and ruled out three alternative explanations" is a strong one.

The other version of the fairness trap: spending disproportionate time on the branch that's easiest to staff or most interesting to the team, regardless of its likely impact. The availability of data should influence your ease score, not your impact score. Don't let easy-to-access work crowd out the harder inquiry on the branches that actually matter.

## Sequencing your hypothesis tests

Prioritisation and hypothesis-driven analysis (see *Working hypotheses*) work together most powerfully when you sequence your hypothesis tests by impact.

Your day-one hypothesis rests on at least one critical assumption. Find that assumption, check its impact score, and test it first. If it's high impact and the data is available, you should be able to confirm or refute the core of your hypothesis within the first day or two of analysis.

This is not always possible — sometimes the critical assumption requires fieldwork or modelling that takes time. In that case, run the high-ease / high-impact branches you can test quickly in parallel, so the team is generating findings while the harder test is running.

The goal: by the midpoint of any analysis, you should have a defensible position on the question. Not a final answer, but a working answer that would hold up to scrutiny. Prioritisation is what gets you there.

## When to revisit priorities

Priorities are not fixed. As branches get resolved — either supported or refuted — the landscape changes. A refuted high-priority branch shifts priority to whatever the next-best hypothesis requires. A surprising finding on a low-priority branch might suddenly make adjacent low-priority branches more interesting.

Revisit the priority scores briefly at natural checkpoints: when a major branch resolves, when you get a large new data set, when a stakeholder conversation changes your read on the problem. Don't re-score the whole tree every morning — that's analysis paralysis applied to the meta-process. But don't let a priority allocation made on day one go unexamined for three weeks either.

## The summary rule

If you take one thing from this chapter: bias heavily toward the branches most likely to crack the problem, test them early, and be willing to abandon low-value work rather than carrying it out of completeness anxiety.

A complete tree with twenty-five evenly-worked branches and a vague conclusion is not rigorous. A tree where twelve branches are parked or refuted and three are deeply evidenced, pointing clearly to a finding, is what rigour actually looks like.

The 80/20 principle won't be precisely 80/20 in your specific problem. But the underlying truth holds: a few branches carry most of the answer. Find them fast, work them hard, and let the rest wait.

Priorities decide *where* the hours go. The next chapter — *Evidence* — is about what those hours actually produce: the facts that move a branch from a bet to a finding.
