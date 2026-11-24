---
title: "Software Estimation for Grown-Ups: Forecasting Without the Fiction"
description: "Estimates fail for structural reasons — invisible work, asymmetric risk, and incentives that punish honesty. Reference-class forecasting, ranges over points, flow metrics as the estimation engine, and when to stop estimating and start slicing."
date: 2028-05-03
tags: ["Engineering Leadership", "Engineering Practice", "Agile", "Project Management", "Developer Experience"]
format: article
---

Software estimation is the discipline everyone practices, nobody trusts, and most organizations quietly run as theater: engineers produce numbers under social pressure, managers convert them into commitments, reality does what it was always going to do, and the retrospective blames "poor estimation" — scheduling the identical failure for next quarter. The way out isn't better guessing. It's understanding *why* software estimates fail structurally, then replacing the ritual with the handful of techniques that actually forecast.

## Why estimates fail (it's not incompetence)

**The work is invisible until entered.** Estimation folklore assumes the task is knowable up front; software's defining property is that the surprises live *inside* — the undocumented behavior of the system being modified, the integration quirk, the requirement that changes upon contact with a working demo. Estimating software is estimating exploration, and exploration estimates carry irreducible variance.

**The distribution is asymmetric.** A task estimated at five days has a possible lower bound and substantial uncertainty on the longer side — it can take four weeks if the surprise is bad enough. Task durations can be asymmetric, and point estimates do not describe that uncertainty. In general, a sum of medians is not the median of a sum; the distribution and dependence between tasks matter. This one statistical fact explains most "everything was on track until it wasn't" projects.

**And the incentives corrupt the channel.** When estimates become commitments — when the number an engineer offers under uncertainty returns as a deadline with their name on it — the rational responses are padding (inflation nobody can calibrate) or optimism-to-please (the anchor the roadmap gets built on). An organization that punishes honest ranges gets dishonest points; the estimation problem is usually a *safety* problem wearing a math costume.

## What works: outside views and ranges

**Reference-class forecasting** — the single highest-value upgrade. Instead of decomposing the new project and summing imagined parts (the "inside view," which invites every bias above), ask: *how long did work like this actually take us, historically?* Similar-shaped migrations, comparable integrations, features of this scope in this codebase: your own delivery history is a distribution, and it already includes all the invisible work — the meetings, the rework, the "done except for the edge cases" tax — that decomposition forgets. A relevant reference class can challenge an optimistic inside view, but it also needs calibration and comparable work. This requires only that someone keeps records — which flow tooling already does (below).

**Ranges with explicit uncertainty alongside any planning point.** "Six to ten weeks, with an explicitly assessed confidence level" communicates uncertainty; a single planning date needs its assumptions and range. An 80% label is meaningful only with a defensible estimation method and calibration. Communicating in ranges does two jobs: it transmits the actual uncertainty to the people making dependent decisions (who deserve it — betting the marketing launch on the median is *their* risk to weigh), and it makes calibration checkable — a team can *learn* whether its 80% ranges capture reality 80% of the time, which is a trainable skill, unlike a point estimate that omits uncertainty. For portfolio decisions, run the ranges through the arithmetic that respects them (Monte Carlo over task distributions — commodity tooling now), and watch the "when will all of it be done" answer become a probability curve — which is what it always was.

**Flow metrics as the standing forecast engine.** The modern replacement for ceremony-heavy estimation is measurement of actual throughput: track cycle times of *sliced, similarly-shaped work items* and let the historical distribution answer forecast questions (for example, a hypothetical observed range of 3–12 days and 8–11 completions weekly, with the sample and empirical percentiles reported) — the probabilistic forecasting practiced under kanban/flow disciplines. Its precondition is the real work: **slicing** — decomposing work into items small enough to be comparably shaped (days, not months). Slicing is where the exploratory unknowns actually surface (the act of splitting the epic *is* the analysis the estimate was pretending to be), and past a modest maturity, teams discover the counterintuitive endgame: when everything ships in thin slices measured by flow, per-item estimation stops paying rent — the debate about whether it's a 5 or an 8 costs more than it informs. "NoEstimates" as slogan overclaims; slicing-plus-flow-history as practice quietly delivers what estimation promised.

## The organizational contract

Technique fails without the surrounding deal, so name it explicitly: **estimates are forecasts, not commitments** — commitments are *decisions* leadership makes using forecasts plus risk appetite, and pretending the engineer's range was a promise transfers executive risk-taking onto the person with the least power in the room. **Re-forecast on cadence** — the estimate at kickoff is the worst-informed of the project's life; uncertainty may narrow as evidence accumulates, although new scope or constraints can widen it, and a monthly re-forecast against the burn-down of *remaining scope* (including discovered scope, which is real scope) converts the end-of-project surprise into a gentle early trendline someone can act on. **Fix the time, flex the scope** for anything deadline-shaped — the trades that keep dates are scope trades, and they require the scope to be sliced and priority-ordered *in advance*, which loops back to the same discipline everything here rests on. **And when accuracy truly matters** (the contractual bid, the regulatory date), buy it the only way it's honestly bought: a timeboxed spike doing the riskiest slice first — a focused investigation can reveal constraints that discussion alone misses, because it replaces forecasting with *evidence*.

For the AI-era coda: generation velocity shifts the ratio of typing to verifying, which changes reference classes (recalibrate on recent history, not 2022's) but none of the structure — the invisible work, the long tails, and the incentive dynamics survive every tooling revolution intact, because they were never about typing speed.

The one-page version: stop asking individuals for brave points; keep history and use reference classes; speak in calibrated ranges and let Monte Carlo do portfolio math; slice work thin and let flow metrics forecast; re-forecast on cadence and trade scope, not honesty; spike the risky parts when a date really matters. Estimation done this way loses its theater and gains the only property anyone ever actually wanted from it — decisions made on numbers that mean something.

## Define the forecast question precisely

A forecast of when one item will finish is different from a forecast of when an entire release will finish. Define the start and end events, the scope included, and the calendar used. Does completion mean merged code, deployed behavior, customer acceptance, or the end of a migration window? A team can meet one definition while missing another. Make the decision the forecast supports explicit: staffing, a launch window, a contract discussion, or the order of work.

Record assumptions about capacity and work intake. Historical throughput from a stable team may not represent a period with holidays, an incident, or substantial new operational responsibilities. Similarly, a backlog that continues to grow is not a fixed set of work. A forecast should say whether new requests are excluded, included at an assumed rate, or handled by a separate capacity allocation.

Separate discovery from execution where that distinction is useful. A short investigation may determine whether an integration is feasible, but its output is evidence rather than a production feature. Do not count the investigation as if it guarantees the remaining implementation can be scheduled precisely. It can reduce some uncertainty while revealing other work that was previously invisible.

## Worked example: throughput scenarios, not false precision

Consider a hypothetical backlog of twenty-four similarly sized, independently deliverable items. At a sustained throughput of four completed items per week, simple division gives six weeks. At six items per week, it gives four weeks. At eight items per week, it gives three weeks. The chart shows those three scenario durations. None is assigned a probability because the example provides no empirical distribution from which to estimate one.

The calculation assumes fixed scope, stable throughput, no dependency constraints, and no partially completed work at the start. Real delivery often violates several assumptions. A mandatory external approval at the end could add a delay that item throughput does not capture. A shared specialist could create a bottleneck even when the team has enough total capacity. Add those mechanisms explicitly rather than burying them in an unexplained contingency percentage.

For an empirical forecast, collect completed-item counts over comparable time windows and retain low-throughput periods. Resampling that history can produce a distribution of simulated completion times under assumptions of future similarity. It does not manufacture certainty. Changes in team composition, work mix, or dependency structure can invalidate the historical comparison. Publish the sampling rule, data window, and excluded periods alongside the result.

## Quantiles cannot be added casually

A median is the point below which half a distribution lies; it is not the same as a mean. The median of a sum is generally not the sum of the medians. Likewise, adding task-level eightieth percentiles does not automatically produce a project-level eightieth percentile. The dependence between tasks matters. If several tasks share an unreliable environment, their delays may occur together rather than independently.

A useful simulation models the structure relevant to the decision. Independent sampling may be adequate for some rough planning questions and misleading for a tightly coupled migration. Document the assumption and test sensitivity to correlated delays. A sophisticated-looking chart does not compensate for a model that excludes the project's dominant constraint.

Avoid claiming that every software task has a specific long-tailed distribution. Duration patterns vary with task definitions, work policies, and cancellation rules. Inspect the data. Very old items may be blocked, abandoned, or incorrectly marked as active. Cleaning the dataset means resolving those states transparently, not deleting inconvenient observations until the distribution looks well behaved.

## Calibration is a repeated practice

If a team issues many nominal eighty-percent forecast intervals, roughly eighty percent should contain the observed outcome over a sufficiently large and comparable set of cases. A single miss does not prove the method is poor, and a handful of successes does not prove calibration. Record forecasts before the outcome is known. Retrospectively reconstructing what people supposedly expected invites hindsight bias.

Check interval width as well as coverage. A range from tomorrow to five years may capture most outcomes while being useless for planning. The objective is informative uncertainty: ranges narrow enough to support a decision and honest enough to reflect the evidence. Compare methods on the same questions rather than praising whichever one happened to be correct on a memorable project.

When a forecast changes, explain the mechanism. Newly discovered scope, lower observed throughput, a dependency delay, and a changed definition of done are different reasons. That explanation lets stakeholders respond appropriately. They may remove scope, change the launch strategy, provide missing expertise, or accept the later date. A revised number without a reason merely moves the argument.

## A forecasting worksheet

Write the decision, completion definition, scope count, historical comparison set, capacity assumptions, dependencies, and uncertainty method. Include an explicit list of unknowns. For each unknown, decide whether a short investigation could materially change the plan. If it could, schedule the investigation and define what evidence it must produce. If it could not, retain the uncertainty and avoid spending effort on an estimate that will not affect a decision.

Create a small number of scenarios that a stakeholder can act on. A minimum useful release may fit an earlier window than the complete feature set. Explain what is omitted and whether the omitted work creates later migration or support costs. Scope reduction is not free when it leaves incompatible intermediate behavior or an operational burden.

Review the forecast at a cadence suited to the decision horizon. Daily recalculation may create noise for a multi-quarter program, while a monthly update may be too slow during a time-critical migration. Keep prior versions so the team can learn whether assumptions or execution changed. The historical record should support improvement rather than assign blame for uncertainty that was disclosed honestly.

## Use estimates to choose, not to certify

A forecast is an input to a commitment, not a certificate that reality will comply. Leaders may deliberately accept a risky date because the business consequence of waiting is larger. Record that decision and its contingency plan. Do not rewrite the original uncertainty after the fact to make the commitment appear technically guaranteed.

The practical takeaway is to match the method to the question and the available evidence. Use simple scenario arithmetic when data is sparse, empirical distributions when the comparison is credible, and targeted investigation when an unknown dominates. A transparent rough forecast often supports a better decision than a precise model whose assumptions nobody can explain.

## Sources and further reading

- [US GAO · Cost Estimating and Assessment Guide](https://www.gao.gov/products/gao-20-195g)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
