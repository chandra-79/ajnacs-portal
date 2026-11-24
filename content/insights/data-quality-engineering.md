---
title: "Data Quality Engineering: Tests, Contracts, and the Trust Budget of a Data Platform"
description: "Turn data quality into testable contracts, freshness objectives and incident response, with a worked defect-rate exercise."
date: 2028-05-29
tags: ["Data Engineering", "Data Quality", "Analytics", "Engineering Practice", "Observability"]
format: article
---

Consider a hypothetical data platform whose operational priorities change. The build years assume the constraint is *availability* — get the data in, model it, serve it. In this scenario, a decision-maker uses a dashboard that has been wrong for three weeks (an upstream schema change, a duplicated load, a timezone shift at the source), the correction is embarrassing, and the organization discovers the real constraint was always *trust* — because a data platform's value isn't the data it holds; it's the decisions people are willing to make on it, and trust, once spent, rebuilds at a fraction of the rate it burns. Data quality engineering is the discipline of spending that budget deliberately: making correctness a *tested, monitored, owned* property rather than an assumption that survives until audited.

## Quality as testable assertions, at the right layers

The vague aspiration ("our data should be accurate") becomes engineering when decomposed into the classic dimensions, each with a concrete test shape: **completeness** (row counts against expected volumes, null-rate ceilings per column, the "did yesterday's partition arrive *at all*" check that catches the silently-dead pipeline), **uniqueness** (grain assertions — the one-row-per-declared-grain tests from dimensional practice, which catch the duplicate-load and fan-out-join bugs that inflate every downstream metric), **validity** (values within domains: enum membership, ranges, format constraints — the schema-shaped checks), **consistency** (cross-dataset reconciliation: does revenue in the warehouse tie to the billing system within tolerance? — the reconciliation-loop pattern from every integration discipline, here as the defense against drift between systems of record and their projections), and **freshness** (below, because it deserves its own economics). The tooling landscape matured into exactly this shape — assertion frameworks embedded in the transformation layer (dbt-style tests running with every build, per the pipeline-gate philosophy: configured blocking checks can prevent publication of a failing result) plus standalone expectation suites for ingestion edges — and the placement rule mirrors testing practice everywhere: **cheap structural checks at every layer boundary, expensive semantic reconciliations at the critical few** (the revenue pipeline earns cross-system ties; lower-risk clickstream use cases may justify sampling with explicit detection limits).

Two disciplines separate mature suites from checkbox suites. **Severity tiers with different behaviors**: blocking failures (grain violations, schema breaks) halt the pipeline; warning-tier anomalies (volume drift, null-rate creep) alert without halting — because a quality system that blocks on everything trains operators to bypass it (the alert-fatigue physics, applied to data), while one that warns on everything is a log nobody reads. **And coverage measured against consumption, not tables**: the question isn't "what fraction of tables have tests" but "do the datasets feeding the top twenty decisions have grain, freshness, and reconciliation coverage" — the criticality-ranked approach every SLO discipline uses.

## Freshness SLOs and the anomaly-detection layer

**Freshness is the quality dimension users feel first** — the dashboard that's *correct but stale* fails its purpose invisibly — and it deserves the full SLO treatment from reliability practice: per-dataset freshness targets ("orders mart current within 2 hours") declared in metadata, measured continuously, alerted by burn-rate rather than single-miss, and *published to consumers* (the staleness-budget honesty from caching and CDC practice — a dashboard footer reading "data as of 09:40" converts silent staleness into informed consumption). Lineage-aware freshness — knowing that the executive mart's lateness *traces to* the upstream extract that stalled — is where the data-observability platforms earn their licenses: the lineage graph from privacy-and-catalog practice, reused as an incident-triage map.

**Anomaly detection** (the ML-flavored layer the vendors lead with) has an honest, bounded role: statistical monitors on volumes, distributions, and null rates catch the *unknown unknowns* your assertions didn't anticipate — the upstream product change that shifted a distribution, the new enum value nobody announced. Treat it as the warning tier's automation, not the foundation: anomaly detection without assertion coverage is a smoke detector in a house with no walls — it fires constantly, attributes nothing, and the false-positive stream burns the exact trust it was bought to protect. Assertions encode what *must* be true; anomalies flag what *changed*; the pairing works, in that order.

## The organizational layer: contracts, ownership, and data incidents

The recurring root cause of data-quality incidents isn't inside the pipeline — it's the *seam*: an upstream team changed a schema, semantics, or cadence without knowing (or owing) anything to downstream consumers. The structural fix is the **data contract** discipline from integration practice, applied at the producer boundary: schemas versioned with compatibility rules, semantic expectations (grain, nullability, enum domains, freshness) declared machine-readably, breaking changes flowing through deprecation windows — with the crucial political corollary that *producers own quality at the source* (the data-mesh ownership argument in its most defensible form: producers own source semantics, while transforming teams own the correctness of their published derivations). Where contracts don't yet exist, CDC-fed staging layers with quarantine-and-alert semantics (invalid rows diverted, not dropped — the dead-letter pattern for data) buy the detection while the contract conversation happens.

And when quality fails anyway — it will — **data incidents deserve incident discipline**: severity by decision-impact, a declared owner, consumer notification ("this dashboard is under investigation" banners beat silent wrongness by a wide margin — the status-page instinct, applied inward), root-cause review with the blameless mechanics, and the remediation that data uniquely allows: *backfill and restatement* (the replay-ability superpower from streaming and CDC practice — pipelines designed for reprocessing convert quality incidents from permanent scars into corrected history, with the restatement *communicated*, because a metric that changed retroactively without explanation burns trust twice).

The closing frame for the platform review: measure the trust budget directly — dashboard usage trends interpreted alongside consumer feedback and product changes, the ratio of decisions citing the platform versus spreadsheet-shadow-IT, incident counts weighted by detection source (found-by-tests versus found-by-VP is the metric that matters most). Data quality engineering, done as above — assertions in the build, SLOs on freshness, contracts at the seams, incidents with owners — is how a platform earns the only compounding asset in analytics: the organizational habit of believing the numbers.

## Turn a quality requirement into a falsifiable test

Start with a decision and work backward to the data it requires. For a weekly fulfilled-order report, declare one row per order, an explicit fulfillment timestamp, a defined cancellation treatment and a reconciliation source. A test that the table is nonempty is useful but cannot establish those semantics. Write assertions at the grain of the business claim, and retain examples of records that should fail.

A uniqueness assertion must name the key and scope. An order identifier may be unique globally, within a tenant or only within a source system. Testing the wrong key can either reject valid data or miss duplicates. The same applies to nulls: an optional delivery timestamp can be valid for a pending order and invalid for a completed one. Conditional business rules often matter more than blanket non-null checks.

### A hypothetical reconciliation with overlapping defects

Suppose a fixture contains 1,000 records. Forty have invalid status values, thirty have missing required identifiers, and ten belong to both groups. The number with at least one of these defects is 40 +30 −10 =60, so 940 pass these two checks. The figure shows the two defect counts, their overlap and the distinct rejected population. Do not sum defect counters without accounting for overlap.

These are synthetic records and do not establish a real error rate. A production report should distinguish row-level defect prevalence from the number of failed assertions and from affected business value. Ten malformed high-value invoices may matter more than a thousand harmless optional-field omissions. Severity should follow the affected decision and recovery obligation, not only the largest count.

## Freshness has several clocks

Record event time, source commit time, ingestion time, transformation completion and publication time where they are available. A maximum event timestamp can look recent even when most events are missing, and an old timestamp can be correct for a quiet source. Define freshness against the expected population or source progress, not an unqualified maximum alone.

For a daily dataset, measure whether the required interval is complete by its deadline. For a continuously updated projection, measure source-to-publication lag and identify clock uncertainty. Choose alerting behavior that matches the observation schedule: burn-rate reasoning requires a defined SLI denominator and evaluation interval, not merely attaching a familiar alert name to a stale timestamp.

Publish freshness to consumers with enough context to act. “Updated at 09:00” can mean the pipeline ran, the source was read or the data became complete through 08:30. Use the appropriate meaning and include provisional status when late records can still change the result. A consumer should not have to infer completeness from a green job icon.

## Use anomalies as evidence to investigate

A volume change can be a defect, a holiday, a product launch or a deliberate retention change. Compare against relevant seasonality and known interventions, and track false positives. A statistical detector should provide the affected segment, baseline and observed deviation so an owner can investigate. A score without context encourages repeated dismissal.

Keep hard invariants separate from learned expectations. A duplicated primary key may violate a contract regardless of historical frequency; a lower-than-usual sales volume may be entirely real. Avoid teaching a detector to accept a persistent defect as the new normal without a review. Conversely, do not halt every pipeline because a legitimate new category differs from last month's distribution.

Sampling can reduce the cost of expensive checks but creates a detection limit. If defects are rare or concentrated in a small tenant, a random sample may miss them. Use targeted full checks for critical invariants and stratify samples when important subpopulations differ. Publish sample size and coverage so “passed” does not imply that every row was examined.

## Quarantine and correction are part of the contract

A rejected record needs an identifier, failure reason, source version and disposition. Preserve enough evidence to repair it while respecting retention and access rules. Distinguish permanent contract violations from temporary missing reference data; the latter may become valid after a dependency arrives. A retry policy should not repeatedly process a structurally invalid record without changing the cause.

When correcting historical output, assign a new dataset version or an auditable revision. Notify downstream owners of affected intervals and metrics. A repair can alter already published business decisions, so a silent overwrite is inadequate. Record whether consumers must recompute aggregates, invalidate caches or restate reports. Keep a known-good publication available where the storage and retention model permits.

### Lab: a small quality suite with known failures

Build a disposable table with valid orders, duplicate keys, a missing required identifier, an unknown status, a late event and a valid cancellation. Write checks that return failing rows rather than only a boolean. Verify the expected failure set by identifier. Then create a join that accidentally duplicates one order and confirm that a downstream grain or reconciliation check catches it even though source validation passes.

Add a transformation that converts a timestamp incorrectly and a source interval that is absent entirely. These failures demonstrate why row-level validity alone cannot establish dataset completeness or temporal correctness. Keep the expected outputs with the fixture and run it whenever the quality rules or transformation logic change.

## Measure the quality system itself

Track time to detection, time to consumer notification, time to corrected publication and recurring manual repair effort. Review incidents discovered by consumers to identify missing checks, but do not assume every externally discovered issue could have been prevented cheaply. Record the tradeoff and prioritize by consequence and recurrence.

Usage and trust surveys can provide context, but dashboard abandonment has many possible causes and is not direct proof of distrust. Combine qualitative feedback with observable correctness and freshness. The quality program earns confidence by showing what it checks, what it cannot yet check and how it responds when the data is wrong.

### Figure methodology

Synthetic 1,000-row fixture has 40 status defects,30 identifier defects and 10 overlapping records. Inclusion-exclusion gives 40+30−10=60 distinct rejected and 940 passing these two checks. Counts are not independent or additive; no real defect rate is claimed.

| Worked observation | records |
| --- | ---: |
| Invalid status | 40 |
| Missing identifier | 30 |
| Both defects | 10 |
| Distinct rejected | 60 |

## Primary references and further study

- [dbt data-test semantics and failing rows](https://docs.getdbt.com/docs/build/data-tests)
- [Schema compatibility rules](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Data-product ownership principles](https://martinfowler.com/articles/data-mesh-principles.html)
