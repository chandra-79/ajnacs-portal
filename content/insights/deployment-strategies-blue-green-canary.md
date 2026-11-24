---
title: "Deployment Strategies Compared: Rolling, Blue-Green, Canary, and When Each Actually Fits"
description: "Rolling updates, blue-green switches, canary releases, and shadow traffic — what each strategy really costs, what each protects against, and the database problem that constrains all of them."
date: 2026-03-20
tags: ["Deployment", "Platform Engineering", "Engineering Practice", "Containers", "Reliability"]
format: article
---

Deployment strategy discussions have a way of floating free of their constraints. Teams debate blue-green versus canary as if choosing a philosophy, when the real determinants are unglamorous: how many instances you run, whether your traffic layer can split by percentage, what your observability can detect in five minutes, and — above all — whether your database schema can serve two application versions at once.

Here's the strategy landscape with the constraints attached.

## What to measure

**Absolute error change and canary sample size.** In a comparable window, 30 errors in 10,000 canary requests is 0.3%; 100 errors in 100,000 control requests is 0.1%. The difference is 0.2 percentage points. Check cohort mix and the sample needed for the decision before expanding traffic.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [DORA’s software delivery performance metrics](https://dora.dev/guides/dora-metrics/).

## The baseline: rolling updates

Replace instances a few at a time behind a load balancer until the fleet runs the new version. This is Kubernetes' default and the industry's workhorse, and its virtues are real: no extra capacity beyond a surge margin, no traffic-management sophistication required, built into every orchestrator.

Its limits define why the other strategies exist. During a rollout, **both versions serve mixed traffic with no control over who gets what** — you can't aim the new version at 1% or at internal users first. Detection is coarse: by the time your error-rate alert fires, the rollout may be 60% complete. And "rollback" is a second rolling deployment, taking as long as the first, during which the bad version keeps serving.

Rolling is the right answer when changes are low-risk, releases are frequent and small, and your test pipeline catches most problems pre-production. Its two non-negotiables: real **readiness checks** (traffic must not arrive before warmup — a JVM serving requests during class-loading is a self-inflicted incident) and **graceful termination** (drain connections before killing instances; the deploy-time 502 blip that teams learn to ignore is almost always a draining bug, and learned alarm-ignoring is expensive).

## Blue-green: the binary switch

Run two complete environments; deploy to the idle one, smoke-test it against production infrastructure, then flip traffic atomically at the router. The router can send new requests back to the previous environment after the configuration takes effect. Measure that transition and check in-flight requests and durable-state compatibility separately.

What you're buying: **instant, rehearsed rollback** and the ability to validate the real artifact on real infrastructure before any user meets it. What you're paying: double capacity (transient in cloud/Kubernetes, where "environments" are just deployments and the cost is an hour of duplicate pods, not a second data center), and — the underrated one — **all-at-once exposure**: when you flip, 100% of users hit the new version simultaneously, so anything your smoke tests missed hits everyone at once. Blue-green trades blast-radius control for rollback speed.

Operational details that decide success: long-lived connections (websockets, streaming) need a drain story at flip time; background workers and schedulers must not double-run while both environments exist; and the idle environment's configuration must be *provably* identical — drift between blue and green converts your rollback plan into a second incident.

Blue-green fits when releases are infrequent and chunky, rollback speed is the dominant requirement (payments, trading windows), or compliance demands a validated-then-promoted artifact with a clean audit line.

## Canary: measured exposure

Route a small slice of traffic — 1%, then 5%, 25%, 100% — to the new version, comparing its health against the stable fleet at each step, with automatic rollback on regression. This is the strategy hyperscalers converge on, because it converts deployment risk into a controlled experiment: worst case, 1% of users saw the bug for four minutes.

The honest cost is that **canary is an observability program wearing a deployment costume.** To progress safely you need per-version metrics (latency, errors, saturation, and ideally one business metric — orders completed, not just HTTP 200s), traffic splitting finer than instance granularity (a service mesh or L7 load balancer; ingress percentage routing), and *automated* analysis — humans watching dashboards do not reliably catch a 2% error-rate delta at step three of a 2 AM rollout. Tooling exists precisely for this (Argo Rollouts and Flagger drive the analysis loop against Prometheus/Datadog queries in Kubernetes-land); adopting the tool without defining the metrics is the common half-implementation.

Two sharp edges: **session affinity** (a user bouncing between versions mid-session must be safe, or you need sticky routing), and **sample size** — at 1% traffic on a modest service, rare failure modes simply won't occur during the canary window; size steps and durations against actual request volumes, not round numbers.

A canary's quieter sibling deserves mention: **shadow traffic** — mirror production requests to the new version and *discard its responses*. Mirroring can provide performance and error evidence with responses discarded. Isolate shadow capacity and disable or isolate writes and other side effects before duplicating requests. Rewrites and migrations should shadow before they canary.

## The constraint underneath all of them: the database

Every strategy above assumes two application versions can coexist against one database. That assumption — not the traffic mechanics — is where zero-downtime deployment is actually won or lost. The discipline is **expand/contract**: additive schema changes first (new columns nullable or defaulted, new tables, dual-write where needed), deploy code that works with both shapes, backfill, then contract (drop the old shape) releases later, after rollback windows close. A coupled change can remove the option to run both versions or reverse traffic safely. Rehearse a compatible migration or plan a coordinated maintenance window. Schema review — "can version N-1 run against this?" — belongs in the pipeline as a gate, not in the post-incident review as a finding.

The same coexistence test applies to queues (old consumers meeting new message schemas), caches (serialization compatibility), and any singleton background jobs.

## Choosing, and the maturity path

The selection heuristic in one breath: **rolling** for routine low-risk changes with good pre-prod coverage; **blue-green** when rollback-in-seconds is the requirement and all-at-once exposure is acceptable after smoke tests; **canary** when user-facing risk must be bounded and you have (or will build) the observability to automate judgment; **shadow** before big rewrites. These compose — plenty of mature shops blue-green the infrastructure layer while canarying application releases through it.

And note what all four strategies quietly assume: **decoupling deploy from release**. Feature flags let code ship dark and activate independently, which shrinks deployment risk to "does the binary run" while product risk is managed per-feature. Teams that internalize that separation stop needing deployment strategies to carry product risk at all — which is the actual end state worth aiming for: deploys so routine and reversible that the strategy discussion gets boring. Boring is the win condition.

## Turn the rollout into a decision record

Before making traffic changes, write a short decision record that names the artifact digest, environments, the expected user-visible change, the state transitions this artifact can write, and the previous artifact that must still function. The release captain owns the go or stop decision. A database owner confirms whether any migration is reversible after new writes. A separate responder needs enough access and context to restore service if the release captain loses connectivity. Use a change identifier in logs, metrics, and the incident timeline so the first regression can be placed against the actual traffic shift. The time a pipeline job starts is a poor proxy for the first request handled by the new version.

Make every gate return one of three results. A pass means an explicit criterion was met. A failure means measured behavior crossed the guardrail. An inconclusive result means the signal could not support a decision, usually because of low volume, missing telemetry, or a population mismatch. Pause on inconclusive and check the measurement pipeline. A check that treats missing data as zero errors can promote a version that has stopped reporting. One that treats every missing sample as an outage will make routine releases expensive. Define both behaviors deliberately.

## Calculate time at risk

Suppose a fictional service receives 250 requests per second, routes 2% to the candidate, and keeps that stage for four minutes. The candidate receives roughly 1,200 requests if traffic and selection are stable. At a baseline failure probability of 0.1%, the candidate would be expected to receive 1.2 failures even if it behaves identically. One failure does not establish a regression. Conversely, zero failures is weak evidence against rare problems. If a failure affects one in 2,000 independent requests, the probability of observing no failures in 1,200 requests is approximately 55%. Doubling the dwell period, testing a representative cohort explicitly, or using a symptom that occurs more frequently can improve a gate. Determine which change is worth the extra exposure.

Bound exposure in requests as well as time. If candidate traffic is five requests per second, the gate needs three minutes to detect a regression, and the route takes another minute to converge after a rollback command, about 1,200 candidate requests can arrive between onset and convergence. A gate that runs only when a deployment stage completes can add the rest of the dwell period to that exposure. Record the moment the routing configuration takes effect at the edge by observing version labels in live request completions. Add a separate limit for unresolved state transitions, because a failed page view and an unreconciled payment pose different risks.

## Make the controller and the business gate agree

For a rolling Kubernetes Deployment with 12 desired replicas, a 25% surge allows three extra replicas and 25% unavailable permits three unavailable during the rollout. Availability therefore could fall to nine of the desired replicas under the controller's update accounting. That accounting does not say that nine replicas can carry your load. Suppose each measured replica handled 30 requests per second within the objective in a matching load test. Nine would offer an indicative capacity of 270 requests per second under those same conditions. A burst to 310 requests per second exceeds it. In that situation set a smaller unavailable allowance, reserve capacity for the surge, or schedule the rollout in a lower demand interval. Check that nodes can actually place the additional Pods. A configured surge is of little help when quota, affinity, or available resources prevent scheduling.

Record where availability is measured. Readiness eligibility at the Pod does not prove every client can complete a new request, and a passed smoke test from a build runner does not cover the path through the public router. Build a gate that checks both. Set the duration to include warmup and a representative interval of steady demand. Kubernetes documents that a deployment can report `ProgressDeadlineExceeded` and continue processing. Treat that condition as a signal for your explicit mitigation policy. Test what happens when verification stalls instead of assuming the controller will revert on its own. See [the Kubernetes Deployment API](https://kubernetes.io/docs/reference/kubernetes-api/apps/deployment-v1/).

## Rehearse rollback after the first real write

Pick one workflow that crosses the version boundary, such as a client creating an order and a worker finalizing it later. In a controlled rehearsal, create it through the candidate and read or complete it through the previous version. Repeat with the order of versions reversed. Capture the resulting durable state and emitted event. If the original artifact cannot interpret a new record, returning the router weight to zero will still leave some users broken. Either keep the new shape compatible, add a reversible transformation with tested limits, or classify the change as requiring repair or recovery after a defined point.

Follow the same logic for background work. Each job must have a single accountable executor or a provably idempotent design while both environments exist. When shadowing, confirm that mirrored work cannot send notifications, execute order changes, or consume scarce capacity on a shared dependency. Run a shadow workload first against isolated or controlled dependencies and identify which performance conclusions survive that isolation. For blue-green, record separately how quickly new connections return to the old environment and when existing connections on the new one drain. Verify the behavior from representative clients rather than trusting the control plane status.

## Close the release based on user outcomes

At the end, record the peak version exposure, the reason for moving through each gate, and the number of unresolved state transitions. Compare the failure classifications in both populations. In a fictional checkout service, total response errors can improve after a release because invalid coupon requests get clearer error messages. The same release could still lower completed payments for customers using a particular gateway. Break out the denominator for accepted payment attempts and preserve that cohort in the gate. For sensitive workflows, run controlled synthetic transactions and reconcile the downstream record after the user-facing action succeeds.

Keep the previous artifact, configuration, and schema compatibility window available until an agreed verification period ends. Remove them when the owners have reviewed the evidence and can explain how to recover without them. A repeatable release record might reveal that the largest source of failure sits after deployment, such as delayed work or incomplete notifications. In that case strengthen the post-release consumer checks before spending time on smaller traffic steps. See the [DORA delivery metrics](https://dora.dev/guides/dora-metrics/) for separate views of delivery speed, recovery, and deployment stability.
