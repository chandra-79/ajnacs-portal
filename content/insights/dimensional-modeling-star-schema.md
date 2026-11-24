---
title: "Dimensional Modeling Still Matters: Star Schemas in the Lakehouse Era"
description: "Define fact-table grain, additive measures and historical dimensions, with a worked example showing why averages need weighting."
date: 2027-09-10
tags: ["Data Engineering", "Analytics", "Data Modeling", "Architecture"]
format: article
---

Every few years a new platform arrives with the same implicit promise — columnar engines, then big data, then the lakehouse: *storage is cheap and compute is elastic now, so you can skip the modeling*. And every few years, organizations that believed it rediscover the same swamp: a thousand bespoke tables nobody can join, seventeen definitions of revenue, dashboards that disagree, and analysts spending most of their time re-deriving what a modeled layer would have made a lookup. Dimensional modeling — the Kimball-lineage discipline of facts and dimensions — keeps outliving its obituaries for a reason the platform pitches miss: **it provides an interface for people asking questions of data, alongside physical-design tradeoffs**, and humans haven't changed.

## The core: facts, dimensions, and the grain declaration

The model's two citizens: **fact tables** hold measurements at a declared **grain**, such as an order-line event, a daily account snapshot or an accumulating process record — with numeric measures and foreign keys outward; **dimension tables** hold the descriptive context — who, what, where, which product, which day — denormalized into wide, human-readable tables that queries filter and group by. The star shape (facts center, dimensions radiating) gives the analytical engine exactly what it optimizes for and gives the analyst something better: *a predictable question grammar* — every business question becomes "measures from the fact, sliced by attributes of the dimensions," which is why BI tools, semantic layers, and — increasingly load-bearing — **AI query generation** can benefit from clear dimensional contracts compared with undocumented operational-schema sprawl (a star schema is, in context-engineering terms, a machine-legible statement of what the business measures; a documented star can clarify text-to-SQL context, but generated queries still require correctness checks).

The single most valuable discipline in the practice costs one sentence per table: **declare the grain, explicitly, first** — "one row per order line item as of latest state" — because grain confusion can cause consequential modeling errors: mixed grains in one table (order-level discounts jammed into line-level rows — the double-counting machine), or measures summed across a grain they don't own (the classic dashboard-inflation bug). Grain declared, everything else follows: which measures are additive (summable across all dimensions — the comfortable case), semi-additive (balances: summable across accounts, *not* across time — the snapshot-fact case), or non-additive (ratios and percentages — recomputed from their compatible additive components when aggregating; storing a ratio for a declared grain is possible, but summing or unweighted averaging it generally answers a different question, which is the "average of averages" lie in table form).

## Slowly changing dimensions: history as a design decision

The famous SCD taxonomy is really one question — *when a customer moves segments, what should last year's revenue report say?* — with two honest answers: **Type 1** (overwrite — history reflects current attributes; simpler, and correct when the business genuinely wants "as of now" reporting) and **Type 2** (versioned rows with effective-date ranges and a current flag — history reflects *what was true at the time*, which is useful when the reporting requirement needs historical attributes). The engineering notes that spare pain: Type 2 commonly uses **surrogate keys** to identify versions (the fact row points at the *version* of the customer that existed at event time — a natural key alone does not identify a particular version, which is the actual argument for surrogates, not warehouse folklore), the current-flag-plus-date-range pattern needs the same gap-and-overlap testing as any interval data (the data-quality checks that catch the customer with two "current" rows), and the CDC pipelines from integration practice are the natural feed (change events *are* SCD deltas — the pattern compositions keep converging). The pragmatic default: Type 2 for the dimensions whose history the business will ever ask about (customer, product, org hierarchy), Type 1 for correction-shaped attributes, and the decision *documented per column*, because "did we mean to lose that history?" is a question with no good retroactive answer.

## The modern amendments: what actually changed

Honest scorekeeping on the platform era's claims: **columnar storage changes the tradeoff** (compression can make repeated dimension attributes efficient — star and snowflake choices still depend on workload and governance; the compression-and-encoding economics reward exactly the repetitive columns dimensions have), **One Big Table has a real niche** (pre-joined wide tables as *serving* artifacts — performance-optimized projections for specific dashboards or feature stores, generated *from* the dimensional layer; the mistake is OBT as the *modeling* layer, where every new question re-litigates the joins that dimensions had already settled, and every definition fork breeds — the derived-store discipline applies: OBTs are caches of the model, rebuildable, never the truth), **the semantic layer is dimensional modeling's new enforcement point** (metrics defined once — measure, grain, allowed dimensions — and served to every tool; the seventeen-revenues problem is a governance failure the metrics layer exists to close, and it works precisely because it's a dimensional contract wearing modern tooling), and **the transformation stack changed the workflow, not the design** (dbt-style layered builds — staging → dimensional core → serving marts — with the model under version control, tested (grain uniqueness, referential integrity, SCD validity as CI checks per the data-contract disciplines), and documented where analysts and AI agents can read it; the medallion-architecture vocabulary maps cleanly: a gold layer can expose dimensional or other purpose-built products with explicit semantics).

The placement judgment, because the discipline has boundaries: dimensional modeling is particularly useful for *human and BI analytical consumption*. Its governed facts and historical dimensions can also feed ML features or streaming projections, whose point-in-time joins, freshness and serving contracts need additional design. It does not replace the transactional model merely because an analytical star is convenient to query. The estates that thrive run the layered flow: raw → cleaned → *dimensional core as the semantic contract* → purpose-shaped serving projections — with the middle layer as the only place "what does revenue mean" gets decided.

The closing argument mirrors every interface discipline in this series: cheap storage and elastic compute made it *possible* to skip modeling, and simultaneously made the cost of skipping it larger — because the bottleneck was never the terabytes; it was the humans (and now the models) trying to ask questions and trust answers. Facts, dimensions, declared grains, and versioned history are how a data platform states its meaning once, legibly, for every consumer that follows. Platforms keep changing; the questions — and the questioners — keep needing the interface.

## Start with a business event and an exact grain

Take a hypothetical retail model whose fact grain is one row per order line at purchase time. Each row stores order identifier, line identifier, product-version key, customer-version key, quantity and agreed net amount. The order identifier alone is not unique because an order can have several lines. A uniqueness test belongs on the declared composite key or a stable line identifier, and downstream queries must respect that grain.

An order-level shipping charge cannot simply be copied to every line and then summed. Either keep it in a separate order-grain fact or allocate it to lines using a documented rule. The rule might use quantity, weight or line value, but it must preserve the order total and specify rounding. A modeling choice becomes a business definition when consumers use it to report margin.

### A hypothetical weighted-average error

Suppose store A sells ten units for total revenue of 100 currency units, so its average price is ten. Store B sells ninety units for revenue of 450, so its average is five. The unweighted average of the two store averages is 7.5, but the correct combined average price is (100+450)/(10+90)=5.5. The figure compares 10, 5, 7.5 and 5.5.

These are invented sales figures. The point is that a ratio should be recomputed from compatible numerator and denominator components at the requested grain. Retaining quantity and revenue makes the rollup possible. Storing only each store's average loses the weights. The same issue appears in conversion rates, average durations and utilization percentages, though each metric also needs its own valid aggregation semantics.

## Time semantics determine the historical answer

A Type 2 dimension can preserve attribute versions with effective intervals and surrogate keys, but it does not automatically reconstruct truth at every point in time. Distinguish when a change became effective in the business from when the warehouse learned about it. A correction received in March may state that a customer segment changed in January. Decide whether historical facts are restated and whether readers need an “as known then” view as well as an effective-time view.

Use nonoverlapping interval conventions, such as inclusive start and exclusive end, and test boundary events. A sale exactly at midnight on a change date should join to one version, not zero or two. Late-arriving facts need a lookup against the appropriate historical version; joining them to the current row can silently rewrite the story. Missing dimensions need a deliberate unknown or inferred-member strategy and later reconciliation.

Surrogate keys are a common way to identify dimension versions. A natural key plus version can also express history in principle, but the chosen representation must be stable and unambiguous. Do not treat the presence of a surrogate integer as proof that historical joins are correct. Test the mapping from business identifier and event time to version.

## Facts can represent different business processes

A transaction fact records an event, a periodic snapshot records state at a regular interval, and an accumulating snapshot tracks milestones in a process. Their measures aggregate differently. An account balance can be summed across accounts at one time but not naively across every daily snapshot. A duration between milestones needs definitions for incomplete or reopened processes.

Avoid joining two detailed fact tables directly on a shared dimension key when that creates a many-to-many multiplication. Aggregate each to the compatible reporting grain first, then combine through conformed dimensions or a documented multipass query. Validate totals before and after the combination. A dashboard that uses the correct table names can still double-count through an incorrect join.

Conformed dimensions require agreement on identifiers and attribute meanings across processes. Two tables both named customer may represent billing accounts and individual users. Document that distinction rather than forcing a misleading one-to-one mapping. Where a bridge is needed for a many-to-many relationship, define weighting and the intended count semantics.

## Wide tables and semantic layers remain design choices

Columnar compression can make repeated descriptive attributes efficient, but denormalization still has storage, update and governance costs. A wide serving table can be useful for a known workload; it should have a declared grain, ownership and refresh behavior. Normalization is not obsolete, and a gold-layer label does not guarantee a dimensional model or a trustworthy metric.

A semantic layer can centralize definitions, but its metrics must still be tested against known business examples. Define allowed dimensions, time filtering, currency treatment and exclusions. Prevent joins that create invalid aggregation paths where the tool supports such controls. Generated SQL, including AI-assisted SQL, requires validation; a well-documented star makes the task clearer but does not guarantee correct answers.

### Modeling workshop and executable checks

Choose three questions: revenue by purchase month, units by product category at purchase and current customer-segment distribution. State whether each uses historical or current attributes. Build a small fixture with two orders, multiple lines, a product category change, a late-arriving fact and a refund. Write expected results by hand before implementing the model.

Add tests for fact-key uniqueness, dimension-key references, nonoverlapping effective intervals and reconciliation of allocated order charges. Test a query that intentionally joins the wrong dimension version and ensure the fixture exposes the error. A test suite should protect the business meaning, not only the existence of columns.

## Publish methodology with the chart

Every analytical chart should identify the grain, population, time zone, currency or unit, aggregation formula and treatment of missing or corrected data. If the result uses a snapshot, state its effective date. If it uses provisional events, explain when the interval becomes complete. These details allow a reader to reproduce the number and understand when a different question needs a different query.

Modeling is an ongoing interface responsibility. When a definition changes, version the metric or document the restatement and notify consumers. Preserve enough lineage to explain why last month's number changed. The durable benefit of a dimensional model is shared, testable meaning across questions, not a particular diagram shape or storage platform.

### Figure methodology

Synthetic store A sells 10 units for 100; B sells 90 for 450. Their averages are 10 and 5. Unweighted(10+5)/2=7.5; combined(100+450)/(10+90)=5.5. Uses common currency and comparable units; no customer sales data.

| Worked observation | currency units per unit |
| --- | ---: |
| Store A average | 10 |
| Store B average | 5 |
| Unweighted average | 7.5 |
| Combined weighted average | 5.5 |

## Primary references and further study

- [Kimball dimensional modeling techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/)
- [dbt executable data assertions](https://docs.getdbt.com/docs/build/data-tests)
- [SQL window semantics for analytical context](https://www.postgresql.org/docs/current/functions-window.html)
