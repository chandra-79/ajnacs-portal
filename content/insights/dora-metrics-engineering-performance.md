---
title: "DORA Metrics Without the Cargo Cult: Measuring Delivery So It Improves"
description: "Use DORA’s current five delivery metrics with explicit definitions, reproducible calculations, and a service-level improvement process."
date: 2027-11-22
tags: ["Platform Engineering", "Engineering Leadership", "Engineering Practice", "Metrics", "Developer Experience"]
format: article
---

The DORA research program did something rare in software: it developed an empirical research program examining software delivery practices and organizational outcomes, originally summarized through four measures and now described through five delivery metrics. And then the industry did what it does — turned the research into dashboards, the dashboards into targets, and the targets into performance review inputs, at which point the metrics stopped measuring anything except teams' skill at metric management.

Both halves of that story are instructive. The metrics provide useful delivery evidence when their definitions and limitations are understood. Here's how to get the first without the second.

## The current five-metric model

DORA’s current model groups change lead time, deployment frequency, and failed deployment recovery time as throughput measures. Change fail rate and deployment rework rate describe instability. Rework rate captures unplanned deployments resulting from production incidents. The research reports that speed and stability can improve together; it does not establish that every local speed increase is safe or that a dashboard alone identifies causation. Review the measures together, with service context and user outcomes.

The useful operational reading, and the one that prevents most abuse: **these are outcome gauges, not steering wheels.** You cannot improve lead time by demanding lower lead time; you improve the system — test automation, deployment pipelines, PR size, architectural coupling, approval bureaucracy — and the gauges report whether it worked. A leadership team that treats the metrics as diagnostic instrumentation asks "what's constraining us?"; one that treats them as KPIs with targets gets Goodhart's law at machine speed.

## Instrumenting honestly (harder than the vendors suggest)

Each metric hides definitional choices that determine whether it means anything:

**Lead time** — start from the change committed to version control; PR-open-to-production is a useful separate measure, not an interchangeable definition, end at *running in production*. The distribution matters more than the mean: a median of two days with a p90 of six weeks says "we're fine except for the changes that aren't," and the tail can help identify changes that need closer investigation. Segment by repo/service, not by team-member — the moment lead time is a person-level number, it's a surveillance tool and the data corrupts within a sprint.

**Deployment frequency** — count *production* deployments per service; the definitional trap is batching semantics (one deploy of forty changes is not the same delivery capability as forty deploys of one). Pair it with batch size (changes per deploy) to keep it honest.

**Change failure rate** — the hardest one, because "failure" needs a written definition: a deployment requiring hotfix, rollback, flag-off, or causing an incident above severity X, within Y hours. Without the written rule, CFR silently becomes "incidents we felt like attributing," and its most common corruption is *improving* because incident attribution got lazier. Tie it to your incident tooling mechanically wherever possible.

**Recovery time** — measured from *user impact start* to *restoration* (not to root-cause fix), and only for deployment-caused degradations if you're being strict about the DORA definition. This metric rewards exactly the right investments: detection speed, rollback automation, feature flags — which is why it's often the best first target for improvement effort.

The infrastructure point: all five fall out of systems you already run (git, CI/CD, incident management) — the engineering-intelligence platforms are conveniences, not requirements, and the integration effort depends on the delivery systems and data quality. What can't be bought is the definitional discipline above.

## Reading them as a system

The five metrics diagnose in *combination*. High deployment frequency with rising CFR: investigate whether changed risk, workload mix, or measurement explains the pattern — look at test coverage and review depth. Great lead time on the median, terrible p90: something batches — usually a manual approval stage, a shared environment queue, or a fortress-team dependency, and a value-stream walk of one slow change will name it in an afternoon. Low deployment frequency with excellent stability: often a *mirage of stability* — big rare releases fail rarer but bigger; check MTTR and incident severity distribution before congratulating anyone. Fast recovery with high CFR warrants investigating recurring failure causes and the quality of corrective work. And all five excellent while the business complains: you're measuring delivery of changes, not delivery of *value* — the metrics do not establish whether the right things ship, which is why DORA's own framework has grown toward pairing them with reliability (SLO adherence) and user-outcome measures.

Historical reports used performance clusters such as elite, high, medium and low, with definitions tied to each study and its population. If using a benchmark, cite its report year, measurement definitions and relevant population rather than presenting one historical set of thresholds as a permanent current standard. They are not useful as OKR fodder across dissimilar services — the mobile app with store-review latency, the regulated mainframe batch, and the web frontend do not belong on one leaderboard.

## The organizational contract

The uses that work: **trend over time, per service, reviewed by the team that owns the service** as input to their own improvement backlog; **before/after evidence** for platform investments with explicit sample sizes and other changes during the comparison; **constraint-finding** at the portfolio level (which value streams are slow, and what structural property do they share?). The uses that reliably backfire: individual performance evaluation (instant Goodhart), cross-team leaderboards (instant gaming plus morale tax), and target-setting on the metrics themselves rather than on the practices ("reach 80% test coverage on changed code" is a practice target; "halve lead time" is an outcome wish).

One more habit distinguishes the organizations that get value here: they pair the quantitative gauges with the *qualitative* instrumentation the research also validates — developer-experience surveys, friction interviews — because the metrics tell you *that* the system is slow, and the humans inside it can usually tell you *why* in one honest hour. Measurement earns its cost when it shortens the argument about where the problem is, so the effort can go into fixing it. Kept in that role — gauges on the dashboard, engineers' hands on the actual levers — DORA metrics are the rare management instrument that both describes reality and survives contact with it.

## Build an event ledger before a dashboard

For a fictional service, create a deployment ledger with a unique deployment identifier, environment, artifact digest, source revisions, start and completion timestamps, and outcome. Join incident records through an explicit deployment relationship rather than a guess that the most recent deployment caused every failure. Record corrections when an investigation changes attribution. The ledger should preserve enough provenance to reproduce a published number.

Decide what counts as production for this service. A canary can serve real users before the fleet completes its rollout. A deployment to an idle environment may not expose anyone until traffic switches. Define the boundary used for the metric and retain separate rollout milestones if they help diagnose delay. A consistent local definition is more useful than a superficially comparable number built from different events each month.

Keep deployment attempts and completed production deployments distinguishable. A pipeline that fails before changing production is operationally relevant, but it is not the same event as a deployment that causes production degradation. Flag changes, configuration changes, and infrastructure changes also need an explicit treatment. If they are excluded from a delivery metric, keep a separate change record so incident analysis can still find them.

## Work through a small, fully disclosed example

The chart uses a synthetic 20-business-day period with 40 production deployments. Four deployments require immediate intervention after causing a problem, giving a change fail rate of 4 / 40 = 10%. Six deployments are unplanned follow-up work caused by production incidents, giving a deployment rework rate of 6 / 40 = 15%. These categories can overlap; do not add them and call the result a combined failure percentage.

Average deployment frequency in this exercise is two per business day, but include the calendar convention. Forty deployments concentrated in one release day differ from two on each day. The chart shows the 40 total, four failed, and six rework deployments as counts, with the subsets clearly described. It is not a performance benchmark or an example of a real team's results.

For the four failed deployments, suppose restoration durations are 20, 30, 50, and 140 minutes. Their mean is 60 minutes and median is 40. The 140-minute event deserves investigation even when a single average looks acceptable. Four observations are too few to make a stable tail-percentile claim. Publish the individual values or their distribution and sample size rather than attaching unwarranted precision to a p95.

For lead time, retain a row for each included change and its production association. Squash merges, cherry-picks, and rebased history can complicate the start timestamp. Choose and document a mapping rule, then manually verify a sample. If one deployment contains ten changes, it contributes one deployment and potentially ten lead-time observations. Mixing those denominators produces an average that cannot be interpreted.

## An audit exercise for the metric pipeline

Take ten recent deployment records and trace each back to the delivery system and source control. Confirm that retries of the same pipeline did not become duplicate production deployments and that a rollback did not erase the original failed deployment. Review incident links with the service owner. Missing links should remain visible as incomplete attribution, not silently become successful changes.

Write a small fixture containing a normal deployment, a pre-production failure, a canary stopped after user impact, a rollback, an unrelated infrastructure incident, and an unplanned repair deployment. State the expected counts before running the transformation. This tests the interpretation rather than merely repeating the implementation's queries. Keep the fixture alongside the metric definition so future tool migrations preserve meaning.

Next simulate missing data from the incident system for one week. The report should show coverage is incomplete, not celebrate a sudden zero-percent failure rate. Reconcile totals with independent delivery records. A monitoring pipeline has its own failure modes: late events, time-zone mistakes, duplicated webhook delivery, deleted repositories, and renamed services. Give those failures an owner and a visible quality indicator.

## Use trends to choose a constrained experiment

Suppose the service's median lead time rises while deployment frequency stays stable. That observation supports several hypotheses: changes may be larger, review may queue, deployment may batch, or the event mapping may have changed. Walk a few slow changes with the people who made them before selecting a remedy. A metric narrows the investigation; it does not name the cause by itself.

Choose one reversible improvement, such as removing an unnecessary approval handoff for a defined low-risk change class. Record the expected effect and the guardrails: review quality, failed deployments, rework, and user-facing reliability. Compare a suitable before-and-after period, including changes in workload mix and staffing. Without those caveats, a holiday lull or a new service boundary can masquerade as the effect of the intervention.

Avoid declaring causal success from one favorable chart. A practical report can say that lead time improved during the intervention while acknowledging other changes and limited sample size. Stronger attribution may require a more controlled design. The decision to continue an improvement can still be reasonable when the evidence is imperfect, provided the uncertainty is explicit and the operational cost is acceptable.

## Protect the conversation that makes the numbers useful

Individual ranking changes what people optimize. If a developer is judged on deployment count, splitting a change into arbitrary deployment events can look productive while creating no user value. If a team is punished for reported failures, incident attribution can become a negotiation. Agree that the metrics describe the delivery system and support improvement, with clear boundaries on access to person-level source data.

Pair the ledger with a short qualitative review. Ask where people waited, which steps prevented an error, which steps only repeated evidence, and what work the dashboard missed. A slower change may involve a necessary compatibility migration; a fast change may be a trivial configuration correction. Context helps distinguish a real constraint from variation in the work being delivered.

A portfolio view should preserve service boundaries and definitions. Do not average percentages from services with very different deployment counts without deciding what the aggregate means. A service with one failed deployment out of two and another with one out of 100 have very different denominators. Pooling produces two out of 102, while averaging the percentages produces 25.5%; both are calculations, but they answer different questions.

## Publish methodology with the scoreboard

A useful scoreboard includes the observation window, service scope, metric-definition version, event counts, coverage limitations, and links to the underlying transformation or reproducible worksheet. Annotate changes to instrumentation so a definition change is not mistaken for an engineering improvement. Keep historical results under their original definitions or explicitly recompute them with a documented migration.

End each review with one owned improvement hypothesis and a date to inspect its result. If the metrics repeatedly generate discussion without changing a decision, simplify the reporting and return to the workflow. Delivery measurement earns its place when it helps the team remove a real obstacle while preserving service quality. The dashboard is evidence for that work, not the work itself.

## Primary references

- [DORA current delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [DORA original research archive](https://dora.dev/research/)
