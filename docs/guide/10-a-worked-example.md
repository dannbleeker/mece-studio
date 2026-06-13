# A worked example

You have read about the method. You have practised the moves in isolation — sharpening a question, running the MECE test, setting hypotheses, scoring impact × ease, hanging evidence, putting numbers on leaves and reading sensitivity, synthesising answer-first. This chapter puts all of those moves into a single sequence.

No new theory. Just a real problem, worked from the blank canvas to the board-ready paragraph.

---

## The question

Imagine you are a founder. Your SaaS company has been running for four years, profitable for two of them. Over the last three quarters, profits have been falling — not catastrophically, but steadily, and the trend is the wrong direction. You know something is off. You just don't know what.

That feeling — *something is off* — is not a key question. It is a worry. And as the chapter on **Start with the question** explains, you cannot build a useful tree from a worry. The root of your tree needs to be specific, decision-relevant, and answerable.

You sit down and press on it. *What exactly are we trying to answer? What decision hangs on the answer?* The falling profits will eventually require a response — either a cost move, a revenue move, or both. The question is which one, and in what order.

After a few minutes of sharpening, you rename the root node in MECE Studio:

> **Why have our profits fallen over the last three quarters, and what are the two or three highest-impact moves to reverse the trend?**

That is your key question. It is specific (three quarters, not "recently"), it points toward a decision (moves to reverse it), and it is answerable with data you can actually gather. The whole tree now exists to answer this question and nothing else.

---

## First cut of the tree

Profit is a difference: **Profit = Revenue − Costs**. That is not a choice — it is arithmetic. The chapter on **Ways to decompose** calls this a formula split, and it is almost always the right starting structure for a financial problem because the formula reconciles: once you know revenue and costs, you know profit exactly. There is no overlap and no gap.

You add two sub-issues to the root: **Revenue** and **Costs**. The live MECE dots in MECE Studio turn green immediately — the formula makes the split watertight.

Next, you decompose Revenue. Revenue in a subscription SaaS business is: **Revenue = Active customers × Revenue per customer**. Another formula split. You add both children. The dots stay green.

For Costs, you switch to a segments split — the cost buckets in your business are not connected by a formula, they simply add up. You add four children: **Hosting & infrastructure**, **Headcount**, **Sales & marketing**, and **Other**. Because this is a segment split, not a formula, MECE Studio nudges you: does "Other" cover anything you haven't named? You check — there is a small software licence cost that doesn't fit neatly. You leave "Other" in place rather than removing it. The CE side is now closed.

The tree at this point looks like this:

| Level | Node | Split type |
|---|---|---|
| Root | Why have profits fallen? | — |
| L1 | Revenue | Formula (Profit = Rev − Cost) |
| L1 | Costs | Formula (same) |
| L2 | Active customers | Formula (Rev = AC × RPC) |
| L2 | Revenue per customer | Formula (same) |
| L2 | Hosting & infrastructure | Segments |
| L2 | Headcount | Segments |
| L2 | Sales & marketing | Segments |
| L2 | Other | Segments (catch-all) |

Eight nodes. Enough structure to think with; not so much that you lose the map.

You will go deeper on the branches that matter. But you do not go deeper yet — as the chapter on **Prioritise the 80/20** warns, decomposing everything before you know where the action is is how you boil the ocean.

---

## Hypotheses

Before you look at a single number, you write down what you already believe. This is hypothesis-driven problem solving: you start from a best guess and use the tree to confirm it or kill it.

Your instinct, sitting in the founder seat: churn has been rising since a major release eight months ago. The release added three new features but broke the onboarding flow for trial users. You suspect a segment of new users never reaches activation, churns before the first renewal, and that is dragging active customers down.

In MECE Studio you set the **Active customers** node to hypothesis status **Open** and type the hypothesis text: *"Churn has increased since the August release; new-user activation is broken."*

You also have a vaguer suspicion about costs — hosting costs felt higher on the last two invoices. You set **Hosting & infrastructure** to **Open** with a note: *"Infra costs may have crept up with the new feature set."*

Everything else stays at the default (unset). You are not claiming the other branches don't matter — you are just being honest that you don't have a hypothesis about them yet. The open-hypothesis flags are not answers; they are bets you intend to test.

---

## Prioritise

You have eight branches. You cannot work all of them equally. The chapter on **Prioritise the 80/20** says: score impact and ease, then focus where both are high.

You score each L2 node in the impact × ease panel. The scoring is fast — you are working from intuition and a rough sense of the numbers, not from data yet:

| Branch | Impact | Ease | Band |
|---|---|---|---|
| Active customers (churn hypothesis) | High | High | **High** |
| Revenue per customer (pricing) | Medium | Low | Med |
| Hosting & infrastructure | Low | High | Med |
| Headcount | Medium | Low | Med |
| Sales & marketing | Low | Low | **Low** |
| Other | Low | High | Low |

The **Active customers** branch lights up as the obvious first move: if churn is up, recovering even a fraction of it has a large direct effect on revenue, and the data (product analytics, cohort retention) is readily available. You can test the hypothesis cheaply.

The **Hosting & infrastructure** hypothesis is easy to check — one invoice review — but even if it is true, the dollar impact is small relative to a revenue problem. You flag it as a quick parallel check, not the main line of investigation.

You park **Sales & marketing** for now. The tree makes that explicit: a Low-band branch is not ignored, it is deprioritised with a visible reason.

---

## Evidence

You spend two days gathering. You pull cohort data from your analytics platform, look at trial-to-paid conversion rates by signup month, and review the last three infrastructure invoices.

**On the Active customers branch:**

- Cohort data shows trial-to-paid conversion dropped from 28% to 17% in the cohort that signed up after the August release. You attach this as supporting evidence, strength: **Strong**.
- Month-on-month churn of existing customers is flat. The problem is not retention of paying customers — it is activation of new ones. You attach this as **contradicting** evidence for the specific framing "churn is up" — and update the hypothesis text to be more precise: *"New-user activation broke after the August release; trial-to-paid conversion is down 11 points."* The status stays **Open** — supported on the activation sub-point, but you haven't yet confirmed that this fully explains the revenue decline.
- You find a product ticket from September noting that the onboarding wizard silently fails for users who sign up via Google OAuth. That ticket was closed as "low priority." You attach it as supporting evidence, strength: **Strong**.

At this point you flip **Active customers** to **Supported**. The hypothesis is now effectively confirmed: activation broke, and the data is clean.

**On the Hosting & infrastructure branch:**

- Invoice review: hosting costs are up £800/month versus a year ago, largely from auto-scaled compute on the new feature. You attach this as supporting evidence, strength: **Medium**.
- But £800/month is roughly £9,600/year. That is real money, but it explains only a small fraction of the profit decline. You set the node to **Supported** and note the finding — but the impact score does not change. This branch is not the main event.

**On the Revenue per customer branch:**

- You check average contract value (ACV) over the period. It has barely moved — up 2% year-over-year, within noise. You attach a **contradicting** note, strength: **Strong**, and flip the status to **Refuted**. Pricing is not the story.

Three hypotheses entered; one fully supported (activation), one supported but small (hosting), one refuted (pricing). The tree has done its job: it showed you where to look and stopped you spending time on a branch that turned out to be irrelevant.

---

## The numbers

The tree is qualitatively convincing. Before you write a recommendation, you want to quantify it — not to reach a different conclusion, but to sharpen it. The chapter on **Doing the numbers** explains why: numbers tell you which driver dominates, which tells you how big a fix needs to be.

You put illustrative values on the value-driver leaves. All figures are monthly:

| Driver | Value | Unit |
|---|---|---|
| Active customers (current) | 420 | customers |
| Active customers (prior peak) | 510 | customers |
| Revenue per customer | 180 | £/customer/month |
| Hosting & infrastructure | 12,400 | £/month |
| Headcount | 38,000 | £/month |
| Sales & marketing | 9,200 | £/month |
| Other | 2,800 | £/month |

MECE Studio rolls up:

- **Revenue** = 420 × £180 = **£75,600/month**
- **Total costs** = £12,400 + £38,000 + £9,200 + £2,800 = **£62,400/month**
- **Profit** = £75,600 − £62,400 = **£13,200/month**

You then set the prior-peak scenario — 510 customers at the same revenue per customer — and the roll-up gives:

- **Revenue (peak)** = 510 × £180 = **£91,800/month**
- **Profit (peak)** = £91,800 − £62,400 = **£29,400/month**

The gap is £16,200/month. That is the size of the problem: roughly £194,000 per year in lost profit, almost entirely attributable to the 90-customer shortfall.

Now you run sensitivity on the Active customers leaf at ±10%:

- +10% customers (462 vs 420): Revenue up £7,560/month → Profit up £7,560/month
- −10% customers (378 vs 420): Revenue down £7,560/month → Profit down £7,560/month

You run the same ±10% on Revenue per customer:

- +10% RPC (£198 vs £180): Revenue up £4,200/month → Profit up £4,200/month
- −10% RPC: Profit down £4,200/month

The volume driver is nearly twice as sensitive as the price driver. Even if you raised prices by 10% — a painful move that risks its own churn — the impact is smaller than recovering 42 customers. The numbers confirm what the qualitative evidence already suggested: **fix activation, recover volume, and the profit problem largely solves itself.**

> Sensitivity tells you which driver deserves the most attention. Here, a 10% swing in active customers moves profit by £7,560/month; the same swing in price moves it by £4,200/month. Fight over the number that matters most.

You also look at hosting costs: even eliminating the £800/month infra creep entirely moves profit by £9,600/year — meaningful, but less than a single recovered customer-cohort. You note it as a hygiene fix, not a strategic priority.

---

## Answer-first synthesis

The tree is done. You open the synthesis panel in MECE Studio, read through the auto-generated summary, and tighten the language. You then copy it out as Markdown — ready to paste directly into the board deck.

Here is what lands on the page:

---

**Why have profits fallen, and what should we do?**

Profits have fallen by roughly £16,200/month (≈£194k/year) since last summer, almost entirely because active customers have dropped from 510 to 420. Revenue per customer is stable and cost categories are broadly in line — the problem is not pricing, not headcount, and not a cost spiral. It is activation. Trial-to-paid conversion dropped 11 percentage points after the August release, tracing to a silent OAuth bug in the onboarding wizard that has been open since September.

**The two moves:**

1. **Fix the onboarding bug immediately.** Restoring trial-to-paid conversion from 17% toward 28% recovers the lost cohort flow. At current trial volumes, closing half the gap adds roughly 35–40 active customers within 90 days, worth approximately £6,300–7,200/month in profit.

2. **Audit and instrument activation.** The August release introduced the bug; the team didn't see it for weeks because activation was not being tracked by cohort. Add a cohort conversion dashboard to the weekly metrics review so any future regression is caught within a sprint cycle, not a quarter.

Infrastructure cost crept up by £800/month and should be reviewed, but it is a hygiene fix — it does not explain the profit decline and resolving it does not change the strategic picture.

---

You copy that out of the synthesis panel. It leads with the answer (volume, not price or costs), names the cause (activation bug), quantifies the gap (£194k/year), and gives two concrete moves with enough specificity that an engineering team and a finance team know exactly what to act on. The appendix to the board deck can link to the full tree — every claim is traceable to a branch, a hypothesis status, and a piece of evidence.

---

## Reflection

Look at what just happened.

You started with a feeling — *the business feels off* — and ended with a specific, auditable answer in roughly three days of focused work. You did not guess. You did not anchor on the first explanation someone suggested. You did not boil the ocean.

The structure did the work.

The formula split told you the problem had to live in revenue or costs, not both. The MECE test forced you to name "Other" in the cost segments, so nothing hid in the gaps. The hypothesis panel stopped you treating instincts as conclusions. The impact × ease scores kept you from spending two days on a sales-and-marketing hypothesis that would have been a distraction. The sensitivity run told you not to lead with a price increase — which would have been the instinctive move for many operators — because the numbers showed clearly that volume is the bigger lever.

And because the whole analysis lives in a single tree, anyone can audit it. Your CFO can look at the cost branches and verify the cost story. Your head of product can look at the activation evidence and challenge the interpretation. Your investors can trace the £194k figure back to the arithmetic that produced it. The tree is not just a thinking tool — it is a shared object that lets other people think alongside you.

**The answer was earned, not guessed. And anyone can check the working.**

That is what structured problem solving is for.
