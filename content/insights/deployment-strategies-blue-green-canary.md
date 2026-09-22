---
title: "Deployment Strategies Compared: Rolling, Blue-Green, Canary, and When Each Actually Fits"
description: "Rolling updates, blue-green switches, canary releases, and shadow traffic — what each strategy really costs, what each protects against, and the database problem that constrains all of them."
date: 2024-11-11
tags: ["Deployment", "Platform Engineering", "Engineering Practice", "Containers", "Reliability"]
format: article
---

Deployment strategy discussions have a way of floating free of their constraints. Teams debate blue-green versus canary as if choosing a philosophy, when the real determinants are unglamorous: how many instances you run, whether your traffic layer can split by percentage, what your observability can detect in five minutes, and — above all — whether your database schema can serve two application versions at once.

Here's the strategy landscape with the constraints attached.

## The baseline: rolling updates

Replace instances a few at a time behind a load balancer until the fleet runs the new version. This is Kubernetes' default and the industry's workhorse, and its virtues are real: no extra capacity beyond a surge margin, no traffic-management sophistication required, built into every orchestrator.

Its limits define why the other strategies exist. During a rollout, **both versions serve mixed traffic with no control over who gets what** — you can't aim the new version at 1% or at internal users first. Detection is coarse: by the time your error-rate alert fires, the rollout may be 60% complete. And "rollback" is a second rolling deployment, taking as long as the first, during which the bad version keeps serving.

Rolling is the right answer when changes are low-risk, releases are frequent and small, and your test pipeline catches most problems pre-production. Its two non-negotiables: real **readiness checks** (traffic must not arrive before warmup — a JVM serving requests during class-loading is a self-inflicted incident) and **graceful termination** (drain connections before killing instances; the deploy-time 502 blip that teams learn to ignore is almost always a draining bug, and learned alarm-ignoring is expensive).

## Blue-green: the binary switch

Run two complete environments; deploy to the idle one, smoke-test it against production infrastructure, then flip traffic atomically at the router. Rollback is flipping back — seconds, not minutes.

What you're buying: **instant, rehearsed rollback** and the ability to validate the real artifact on real infrastructure before any user meets it. What you're paying: double capacity (transient in cloud/Kubernetes, where "environments" are just deployments and the cost is an hour of duplicate pods, not a second data center), and — the underrated one — **all-at-once exposure**: when you flip, 100% of users hit the new version simultaneously, so anything your smoke tests missed hits everyone at once. Blue-green trades blast-radius control for rollback speed.

Operational details that decide success: long-lived connections (websockets, streaming) need a drain story at flip time; background workers and schedulers must not double-run while both environments exist; and the idle environment's configuration must be *provably* identical — drift between blue and green converts your rollback plan into a second incident.

Blue-green fits when releases are infrequent and chunky, rollback speed is the dominant requirement (payments, trading windows), or compliance demands a validated-then-promoted artifact with a clean audit line.

## Canary: measured exposure

Route a small slice of traffic — 1%, then 5%, 25%, 100% — to the new version, comparing its health against the stable fleet at each step, with automatic rollback on regression. This is the strategy hyperscalers converge on, because it converts deployment risk into a controlled experiment: worst case, 1% of users saw the bug for four minutes.

The honest cost is that **canary is an observability program wearing a deployment costume.** To progress safely you need per-version metrics (latency, errors, saturation, and ideally one business metric — orders completed, not just HTTP 200s), traffic splitting finer than instance granularity (a service mesh or L7 load balancer; ingress percentage routing), and *automated* analysis — humans watching dashboards do not reliably catch a 2% error-rate delta at step three of a 2 AM rollout. Tooling exists precisely for this (Argo Rollouts and Flagger drive the analysis loop against Prometheus/Datadog queries in Kubernetes-land); adopting the tool without defining the metrics is the common half-implementation.

Two sharp edges: **session affinity** (a user bouncing between versions mid-session must be safe, or you need sticky routing), and **sample size** — at 1% traffic on a modest service, rare failure modes simply won't occur during the canary window; size steps and durations against actual request volumes, not round numbers.

A canary's quieter sibling deserves mention: **shadow traffic** — mirror production requests to the new version and *discard its responses*. Zero user risk, superb for validating performance and error behavior of risky rewrites; useless for anything with side effects unless you can stub them. Rewrites and migrations should shadow before they canary.

## The constraint underneath all of them: the database

Every strategy above assumes two application versions can coexist against one database. That assumption — not the traffic mechanics — is where zero-downtime deployment is actually won or lost. The discipline is **expand/contract**: additive schema changes first (new columns nullable or defaulted, new tables, dual-write where needed), deploy code that works with both shapes, backfill, then contract (drop the old shape) releases later, after rollback windows close. The moment a deployment requires a schema change and a code change to land *together*, you've bought an outage window regardless of your traffic strategy. Schema review — "can version N-1 run against this?" — belongs in the pipeline as a gate, not in the post-incident review as a finding.

The same coexistence test applies to queues (old consumers meeting new message schemas), caches (serialization compatibility), and any singleton background jobs.

## Choosing, and the maturity path

The selection heuristic in one breath: **rolling** for routine low-risk changes with good pre-prod coverage; **blue-green** when rollback-in-seconds is the requirement and all-at-once exposure is acceptable after smoke tests; **canary** when user-facing risk must be bounded and you have (or will build) the observability to automate judgment; **shadow** before big rewrites. These compose — plenty of mature shops blue-green the infrastructure layer while canarying application releases through it.

And note what all four strategies quietly assume: **decoupling deploy from release**. Feature flags let code ship dark and activate independently, which shrinks deployment risk to "does the binary run" while product risk is managed per-feature. Teams that internalize that separation stop needing deployment strategies to carry product risk at all — which is the actual end state worth aiming for: deploys so routine and reversible that the strategy discussion gets boring. Boring is the win condition.
