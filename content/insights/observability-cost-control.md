---
title: "The Observability Bill: Controlling the Cost of Knowing What Your Systems Do"
description: "Telemetry spend became a top-line infrastructure cost, sometimes rivaling compute — driven by cardinality, retention, and volume decisions nobody owns. The cost model of metrics-logs-traces, the cardinality trap, the pipeline-processing tier, and value-based retention."
date: 2027-07-28
tags: ["Observability", "FinOps", "Reliability", "Cloud Architecture", "Engineering Leadership"]
format: article
---

Observability crossed a threshold that reframed it from unalloyed good to budget line under scrutiny: for many organizations, telemetry spend now rivals — occasionally exceeds — the compute it observes, and the "instrument everything, keep it forever" reflex of the observability-culture era collided with vendor pricing models that meter exactly the dimensions that reflex maximizes. The correction isn't less observability (the flying-blind alternative costs far more, one prolonged incident at a time) — it's **observability as a managed cost**, with the same FinOps disciplines this series applies to compute and storage, pointed at the three signals whose economics differ sharply.

## The three cost models, because they're not the same

**Metrics** are cheap per data point and lethal by *cardinality* — the number of unique time series, which is the *product* of every label's distinct values. The metric `http_requests` labeled by `endpoint` (50) × `status` (10) × `region` (5) is 2,500 series (fine); add `user_id` or `request_id` or a raw `url` with query strings, and you've multiplied by millions — the **cardinality explosion** that is the single most common cause of a surprise observability bill and a melted metrics backend simultaneously (the labels-as-dimensions trap: high-cardinality identifiers belong in traces and logs, which are *built* to carry them, never in metric labels, which multiply against everything). The discipline: label taxonomy governed like a schema (bounded value sets, reviewed additions — the metric label PR that adds `customer_id` gets the same scrutiny as a database index), cardinality *monitored as its own metric* (the series-count dashboard alarmed before the bill arrives), and the recurring audit finding — the forgotten debug label, the unbounded enum — pruned on a cadence.

**Logs** are cheap to emit and expensive to *ingest and index*, priced by volume, and their cost discipline is the structured-logging chapter's economics: sampling the high-volume happy-path streams (keep all errors, sample the INFO firehose), tiered retention (hot-indexed days, warm-queryable weeks, cold-archive-in-object-storage for the compliance horizon — the log data that must be *kept* for audit needn't be *indexed* for search, and the pricing gap between those is often 10×), and the ruthless question per log line ("who queries this?") — because the top ten event types are reliably most of the volume, and half of them serve no query anyone runs.

**Traces** are priced by span volume and controlled by the sampling chapter's machinery: head-sampling the noise at the source, tail-sampling to keep the errors and outliers, and — the leverage move — deriving metrics from spans *before* sampling so the aggregate truth survives at metric prices while full traces are kept only where investigation starts (exemplars linking the two). The composition insight across all three: **much of what teams pay to store as expensive raw signal should be pre-aggregated into cheap signal at the pipeline tier** — which is the architecture that changed the economics.

## The pipeline tier: process before you pay

The structural shift that gave cost control real leverage: the **telemetry pipeline** (the OpenTelemetry Collector and its vendor-neutral kin) sitting between emission and the expensive backend, where the FinOps work happens *before* the meter runs — dropping the known-useless (the health-check spans, the debug logs that escaped to prod, the redundant labels), aggregating at the edge (span-to-metric conversion, log-to-metric extraction for the "just count these" cases that were being stored as full logs), sampling with the strategies above, routing by value (the audit logs to cheap compliant storage, the debug tier to short-retention, the SLO-critical metrics to the premium backend), and — the strategic dividend — **decoupling instrumentation from vendor** (OpenTelemetry as the emission standard means the backend becomes a swappable cost center, which is the negotiating leverage the observability-vendor lock-in previously denied — the portability-as-leverage argument from cloud practice, at the telemetry layer). This tier converts observability cost from a property of how much you instrument (which should stay high) into a property of how much you *retain at full fidelity* (which should be deliberate) — the same instrument-freely-but-store-thoughtfully split that every data discipline arrives at.

## The governance: ownership, attribution, and value

The organizational half, mirroring every cost discipline: **attribution** (telemetry spend allocated per team/service — the tagging that makes the team generating 40% of the log volume *see* it; unattributed observability cost is the tragedy of the commons, and the pipeline's per-source metering is the meter), **budgets with the value question attached** (not "minimize telemetry" — that's the flying-blind failure — but "is this signal earning its retention?": the metric no dashboard displays and no alert queries, the log tier no incident has consulted, the trace retention beyond any investigation's reach — the deletion-as-hygiene discipline, applied to signals), **the incident-value defense** (the counter-pressure that keeps cost-cutting honest: every signal proposed for elimination gets the "would we have wanted this during the last three incidents?" test — some expensive telemetry is expensive *insurance*, and the discipline is distinguishing insurance from hoarding, not slashing both), and **the review cadence** (quarterly: cardinality trends, cost per service, retention tiers versus actual query patterns — the same rhythm as capacity and cloud-spend review, because it's the same kind of review).

The closing calibration: observability's cost problem is a maturity symptom, not a reason to retreat — organizations only get a big telemetry bill by instrumenting enough to have one, which is progress that overshot its governance. The fix restores the balance the culture skipped: keep instrumenting everything (the emission is cheap and the blindness is expensive), process aggressively at the pipeline before the meter, retain at full fidelity only what earns it, attribute the cost to who generates it, and defend the incident-critical signals against the cost-cutting they'll periodically face. Knowing what your systems do is worth paying for — the discipline is paying for the *knowing*, not for the hoarding that accumulated while no one was watching the one bill observability itself couldn't see.

## Make the operating contract explicit

Start an instrumentation review with a question that a responder must answer. Which operation failed? Which dependency consumed the request budget? Did the change affect every tenant or one cohort? Metrics, events and traces can each contribute. The familiar three-signal model is a useful organization, not a guarantee that installing three products makes those questions answerable.

Bound dimensions deliberately. A request identifier is useful for locating one execution but usually inappropriate as an unbounded label on a continuously aggregated metric. A route template is often more useful than the raw URL for request-rate charts. Cardinality estimates should be based on combinations that actually occur; multiplying every label's theoretical range is an upper bound rather than a promise that all combinations exist. Histogram buckets and other instrument details add their own series cost.

Preserve correlation without leaking information. Trace context can join events across services, but it should not become a place to store secrets or unreviewed personal attributes. Sampling and collection failures can leave partial traces, so a missing span is not proof that a dependency was never called. Include sampling policy, clock behavior and collector health in the investigation. Cost controls are successful only when the retained information still supports the questions that justified collection.

## Prove the retained data can answer a real question

Choose a recent class of failure or construct a harmless equivalent. For example, add a controlled delay to one dependency in an isolated environment. Ask a responder to identify the affected operation, time interval and dependency using the proposed telemetry. Record which query or pivot they used and what remained uncertain. This tests the information path rather than the number of dashboards or the volume of collected data.

Now repeat the exercise after the proposed cost reduction. If a sampling change removes the only evidence of rare failures, the saving has changed the operational capability. A different design may preserve all selected error cases while sampling routine successes, but that policy needs a clear selection rule and a bounded data budget. Error status alone may not identify every important request: a slow successful request or a semantically incorrect response can also matter.

Tail-based sampling has operational costs of its own. A collector must retain enough trace information to decide which traces to keep, and distributed collection can make those traces incomplete. Head-based sampling decides earlier and is simpler to bound, but it may miss rare events. Neither approach guarantees a complete record of every relevant execution. Keep audit obligations on a separately defined path when completeness is required.

Metric aggregation needs equally clear semantics. An average of instance averages can misrepresent the population when instances handle different volumes. A p95 calculated on each instance cannot generally be averaged into a fleet p95. Use the instrument and backend's supported aggregation representation, and retain the observation window and units. When presenting a service-level result, explain whether it covers requests, users, jobs or some other population.

Finally, make telemetry ownership visible. A service team should know which high-volume events it emits, which labels it adds and what retention it receives. A central budget alone cannot identify whether a particular signal is valuable. Pair cost review with investigation exercises so that removal decisions are grounded in actual use.

Query performance is part of usability. A retained signal that takes longer to retrieve than the incident's decision window may need an index, a smaller operational view or a better starting query. Test the common investigation with a realistic time range and retention tier. Record the query cost and access requirements as well as the answer. This keeps a storage-saving change from quietly moving all its cost into responder time and delayed mitigation.

Maintain a tested starting query for each urgent investigation rather than relying on remembered dashboard filters.

## Work through an illustrative scenario

A fictional request metric uses twenty route templates, five status classes and three regions. If every combination occurs, it has 20 × 5 × 3 = 300 label combinations before accounting for instrument-specific series. Adding a customer dimension with 200 values raises that upper bound to 60,000. Restricting that dimension to ten explicitly approved service tiers gives an upper bound of 3,000. The chart compares potential combinations, not a measured memory footprint or a bill.

| Observation | Value (possible label combinations) |
| --- | ---: |
| Route status region | 300 |
| Plus customer ID | 60000 |
| Plus service tier | 3000 |

**Calculation and limits.** Synthetic cardinality upper bounds: twenty routes times five status classes times three regions, multiplied by 200 customers or ten tiers. Real observed combinations and histogram series counts must be measured separately.

## Build the evidence worksheet

**Investigation question.** Name the decision the signal must support and the responder who will use it.

**Signal contract.** Specify units, timestamps, service identity and the meaning of success or failure.

**Dimension budget.** List bounded labels and estimate observed combinations before adding a high-cardinality dimension.

**Correlation.** Use stable trace or event identifiers where appropriate and document sampling boundaries.

**Retention tiers.** Separate operational query needs from audit-retention obligations and avoid sampling required evidence.

**Collection health.** Monitor exporter errors, queue pressure, dropped data and arrival delay so silence is interpretable.

## Rehearse the failure boundary

1. **Add a high-cardinality label.** Observe series creation and query behavior in a bounded test before considering wider rollout.

2. **Drop a trace segment.** Ensure responders can distinguish incomplete telemetry from an absent dependency call.

3. **Delay log delivery.** Verify that receipt time and event time remain distinguishable in the investigation view.

4. **Reduce retained volume.** Repeat the original investigation exercise and compare answer quality as well as storage cost.

## Sources for the mechanisms

- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
