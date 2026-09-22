---
title: "DORA Metrics Without the Cargo Cult: Measuring Delivery So It Improves"
description: "Lead time, deployment frequency, change failure rate, and recovery time are the best-validated delivery metrics we have — and the most misused. How to instrument them honestly, read them as a system, and avoid the dashboard theater that turns measurement into damage."
date: 2024-11-22
tags: ["Platform Engineering", "Engineering Leadership", "Engineering Practice", "Metrics", "Developer Experience"]
format: article
---

The DORA research program did something rare in software: it produced empirically validated, repeatedly replicated findings about what distinguishes high-performing delivery organizations, distilled into four measurable outcomes. And then the industry did what it does — turned the research into dashboards, the dashboards into targets, and the targets into performance review inputs, at which point the metrics stopped measuring anything except teams' skill at metric management.

Both halves of that story are instructive. The metrics are genuinely the best delivery instrumentation we have; the misuse patterns are genuinely predictable. Here's how to get the first without the second.

## The four, and why these four

Two metrics measure **velocity**: **lead time for changes** (commit to production) and **deployment frequency**. Two measure **stability**: **change failure rate** (what fraction of deployments cause degraded service) and **failed deployment recovery time** (how fast you restore when they do). The design is the insight: velocity and stability are measured *together* because the research's most important finding is that they are not a trade-off — elite organizations are fast *and* stable, because the same practices (small batches, automated pipelines, fast feedback, loosely coupled architecture) produce both. Any measurement scheme that tracks velocity alone invites the speed-at-any-cost failure; stability alone invites the frozen-in-fear one. The four travel as a set or they lie.

The correct causal reading, and the one that prevents most abuse: **these are outcome gauges, not steering wheels.** You cannot improve lead time by demanding lower lead time; you improve the system — test automation, deployment pipelines, PR size, architectural coupling, approval bureaucracy — and the gauges report whether it worked. A leadership team that treats the four as diagnostic instrumentation asks "what's constraining us?"; one that treats them as KPIs with targets gets Goodhart's law at machine speed.

## Instrumenting honestly (harder than the vendors suggest)

Each metric hides definitional choices that determine whether it means anything:

**Lead time** — start the clock at *first commit* (or PR open — pick one, document it), end at *running in production*. The distribution matters more than the mean: a median of two days with a p90 of six weeks says "we're fine except for the changes that aren't," and the p90 is where the process problems live. Segment by repo/service, not by team-member — the moment lead time is a person-level number, it's a surveillance tool and the data corrupts within a sprint.

**Deployment frequency** — count *production* deployments per service; the definitional trap is batching semantics (one deploy of forty changes is not the same delivery capability as forty deploys of one). Pair it with batch size (changes per deploy) to keep it honest.

**Change failure rate** — the hardest one, because "failure" needs a written definition: a deployment requiring hotfix, rollback, flag-off, or causing an incident above severity X, within Y hours. Without the written rule, CFR silently becomes "incidents we felt like attributing," and its most common corruption is *improving* because incident attribution got lazier. Tie it to your incident tooling mechanically wherever possible.

**Recovery time** — measured from *user impact start* to *restoration* (not to root-cause fix), and only for deployment-caused degradations if you're being strict about the DORA definition. This metric rewards exactly the right investments: detection speed, rollback automation, feature flags — which is why it's often the best first target for improvement effort.

The infrastructure point: all four fall out of systems you already run (git, CI/CD, incident management) — the engineering-intelligence platforms are conveniences, not requirements, and a quarter of platform-team effort wires the pipeline events into honest metrics. What can't be bought is the definitional discipline above.

## Reading them as a system

The four metrics diagnose in *combination*. High deployment frequency with rising CFR: you've bought speed with unreviewed risk — look at test coverage and review depth. Great lead time on the median, terrible p90: something batches — usually a manual approval stage, a shared environment queue, or a fortress-team dependency, and a value-stream walk of one slow change will name it in an afternoon. Low deployment frequency with excellent stability: often a *mirage of stability* — big rare releases fail rarer but bigger; check MTTR and incident severity distribution before congratulating anyone. Fast recovery, high CFR: the team has automated rollback but not learned from failures — the retro loop is broken. And all four excellent while the business complains: you're measuring delivery of changes, not delivery of *value* — the four say nothing about whether the right things ship, which is why DORA's own framework has grown toward pairing them with reliability (SLO adherence) and user-outcome measures.

The benchmark bands (elite/high/medium/low) are useful for exactly one thing: locating yourself coarsely and noticing that "elite" is achievable by ordinary organizations (on-demand deploys, sub-day lead times, CFR in the low percentages, sub-hour recovery). They are not useful as OKR fodder across dissimilar services — the mobile app with store-review latency, the regulated mainframe batch, and the web frontend do not belong on one leaderboard.

## The organizational contract

The uses that work: **trend over time, per service, reviewed by the team that owns the service** as input to their own improvement backlog; **before/after evidence** for platform investments ("the pipeline rebuild cut median lead time from 9 days to 1"); **constraint-finding** at the portfolio level (which value streams are slow, and what structural property do they share?). The uses that reliably backfire: individual performance evaluation (instant Goodhart), cross-team leaderboards (instant gaming plus morale tax), and target-setting on the metrics themselves rather than on the practices ("reach 80% test coverage on changed code" is a practice target; "halve lead time" is an outcome wish).

One more habit distinguishes the organizations that get value here: they pair the four quantitative gauges with the *qualitative* instrumentation the research also validates — developer-experience surveys, friction interviews — because the metrics tell you *that* the system is slow, and the humans inside it can usually tell you *why* in one honest hour. Measurement earns its cost when it shortens the argument about where the problem is, so the effort can go into fixing it. Kept in that role — gauges on the dashboard, engineers' hands on the actual levers — DORA metrics are the rare management instrument that both describes reality and survives contact with it.
