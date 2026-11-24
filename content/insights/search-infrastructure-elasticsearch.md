---
title: "Search Infrastructure: Running Elasticsearch/OpenSearch Without the Folklore"
description: "Plan shards, refresh behavior and relevance evaluation, with explicit capacity arithmetic and recovery checks for a search workload."
date: 2027-12-24
tags: ["Search", "Elasticsearch", "Programming", "Performance", "Data Engineering"]
format: article
---

Many organizations operate a search cluster — Elasticsearch or its OpenSearch fork — and most run it in a distinctive state of unease: it powers product search, log exploration, or both; it's operated by folklore inherited from whoever set it up; and it fails in ways that feel mystical (the cluster that went yellow, the query that took down a node, the index that quietly stopped accepting writes). The mystique dissolves once you hold the right model: **a search engine is an inverted index sharded across a distributed system, and every operational behavior follows from those two facts.**

## The model: inverted index plus Lucene segments

Documents go in; an **inverted index** — term → list of documents containing it — comes out, which is why search engines answer "which documents mention X" in milliseconds for suitable indexed text workloads; relational engines can also provide full-text indexing. The engine's second defining structure: indexes are built from **immutable segments** (Lucene's design) — writes accumulate in indexing buffers and refresh exposes new searchable segments; flush and durability are separate concepts; updates are really delete-markers plus re-inserts; background **merging** compacts segments and purges deletions. This one fact explains a family of behaviors: why documents aren't searchable instantly (the refresh interval controls memory-to-segment visibility — near-real-time, not real-time), why heavy updates are expensive (every "update" is a full reindex of the document), why disk usage exceeds data size until merges catch up, and why merge activity competes with query performance during bulk loads.

**Analysis** is the other half of index-time design: text is tokenized, normalized, stemmed, and filtered *at index time*, and queries must be analyzed compatibly — the wrong analyzer is the root cause of most "search doesn't find obvious things" complaints (exact-match fields analyzed as full text, language stemming absent or doubled, case surprises). Mappings — the field-type schema — deserve the same review discipline as database DDL, for the same reason: they're nearly immutable (mapping changes mean reindexing), and the default dynamic mapping (which guesses types from first-seen values and explodes fields from unbounded JSON) is how log clusters accrete tens of thousands of mapping fields and fall over. Explicit mappings, always, with dynamic templates for the controlled cases.

## Sharding: the decision you get one cheap chance at

An index is split into **primary shards** (fixed at creation — changing requires supported split, shrink or reindex workflows) with **replicas** for redundancy and read throughput. The sizing folklore reduces to real rules: target **tens-of-GB per shard** (the commonly cited healthy band — 10–50GB; hundreds of tiny shards waste heap on per-shard overhead, and monster shards recover and rebalance glacially), remember **total shard count per node is a heap-bounded resource** (thousands of shards on a modest cluster is a cluster-state problem before it's a data problem), and derive counts from *data math, not optimism*: expected size ÷ target shard size, with time-based indexes (daily/weekly/monthly, or better, **rollover by size**) doing the scaling for append-heavy streams like logs, and ILM/ISM policies walking aged indexes through hot→warm→cold→delete tiers — the mechanism that makes retention an economic policy rather than a disk-full incident.

The write path has its own rules: bulk requests (sized by payload, not doc count), backpressure respected (429s from the cluster mean *slow down*, and your indexing pipeline needs a queue that can), refresh intervals loosened during bulk loads, and — the perennial one — **no unbounded cardinality in field names or index names**, the search-layer version of the metrics-cardinality discipline.

## The relevance layer: search is a product surface

Operationally healthy clusters still fail at their actual job when relevance is left to defaults. The craft, compressed: **BM25** (the default scorer) is a strong lexical baseline; product search layers onto it field boosting (title matches outrank body matches), function scores (recency, popularity, margin — business signals blended into rank), and query construction that mirrors user intent (multi-field matching with fuzziness for typo tolerance, phrase boosts for coherence, filters — which are unscored and may benefit from caching — separated from queries, which score). **Aggregations** — the group-by engine over the same index — power the facets and analytics dashboards, with their own memory discipline (deep cardinality aggregations are the classic node-killer; composite aggregations and sensible bucket limits are the guardrails).

And the modern addition: **vector search** (kNN over embeddings) is now native in both engines, making **hybrid retrieval** — BM25 for lexical precision plus vectors for semantic recall, fused (RRF-class combination) — an approach worth evaluating against lexical and vector baselines, and the pattern underlying enterprise RAG retrieval. The operational caveats: HNSW-class vector indexes are memory-hungry and *approximate* (recall/latency dials to tune consciously), and embedding-model changes mean full re-embedding — version your vectors like the schema they are.

The discipline that ties relevance together: **measure it.** A golden set of real queries with judged results, offline metrics (nDCG-class) on every relevance change, and online interleaving/A-B for the changes that matter — because relevance tuning without measurement is the search version of optimizing without profiling, and it regresses exactly as silently.

## Operations: the incident patterns are few and knowable

Search clusters fail in recurring shapes, that require monitoring and tested recovery: **heap pressure** (the JVM discipline applies wholesale — keep heap ≤50% of RAM so Lucene gets the OS file cache, which is where query performance actually lives; watch GC and circuit-breaker trips); **hot spots** (one shard/node absorbing disproportionate load from routing skew or one giant tenant — the multi-tenant fairness problem again; custom routing cuts query fan-out but concentrates risk); **cluster-state bloat** (too many indexes/shards/mappings — the control plane chokes before the data plane); **split-brain-adjacent quorum issues** (a supported master-eligible topology with deliberate failure-domain placement and role sizing); and **the recovery storm** (a node's departure triggers replica rebuilding that saturates the survivors — throttle recovery, use delayed allocation for transient departures, and know that the resilience settings you never touched are tuned for someone else's cluster). Snapshots are non-negotiable (searchable snapshots for the cold tiers double as economics), and every "we'll just query the search cluster for that too" impulse deserves the reminder that **search is a *derived* store**: the source of truth lives elsewhere, the index is rebuildable projection — an architecture stance (CDC/outbox pipelines feeding reindex-capable ingestion) that converts every mapping mistake and version upgrade from crisis into batch job.

The strategic summary: model it as immutable segments under an inverted index (behavior becomes predictable), shard by arithmetic with lifecycle policies (scale becomes routine), treat mappings and analyzers as reviewed schema (relevance becomes debuggable), measure relevance like the product feature it is, keep the source of truth outside and the index rebuildable — and the estate's most folklore-driven system becomes just another well-understood piece of infrastructure, which is what it always deserved to be.

## Separate searchable visibility from durable ingestion

A successful indexing response and visibility in a search query are different events. Refresh makes new segment content searchable; it is not the same operation as a flush or a complete durability policy. Configure the required acknowledgment and refresh behavior deliberately. A user who creates a document and immediately searches for it may need a supported wait-for-refresh path or a direct confirmation flow rather than repeated forced refreshes.

Bulk ingestion responses need item-level inspection. An HTTP request can succeed while individual documents fail because of mapping errors or rejected work. Persist failed identifiers and reasons, retry only eligible failures with a budget, and reconcile the accepted population. Retrying the whole batch without stable identifiers can create duplicate application documents in a poorly designed pipeline.

### A hypothetical shard-count model

Suppose a retained primary dataset occupies 600 GiB before replicas. At a modeled target of 30 GiB per primary shard, it needs twenty primaries. With one replica of each, that is forty shard copies and approximately 1,200 GiB of primary-plus-replica data before other overhead. At 10 GiB per primary, the same data uses sixty primaries and 120 copies; at 50 GiB, twelve primaries and twenty-four copies.

The chart compares twenty-four, forty and 120 copies for the three target sizes. These are synthetic sizing inputs, not a recommendation that the smallest count is best. Merge overhead, translogs, snapshots, compression, skew and free-disk headroom are excluded. Recovery time and query fan-out must be measured alongside the arithmetic. The documented shard-size range is a starting guideline, not proof that every workload inside it is healthy.

## Test mappings with the actual query vocabulary

Choose text fields for analyzed search and keyword-style fields for exact matching, sorting and aggregation where appropriate. A product code containing punctuation can be tokenized in ways that make an intuitive exact query fail. Use the analysis tools to inspect emitted tokens for real examples, including case, accents, hyphens and language variants. Store an exact representation when the product needs exact identifiers as well as full text.

Dynamic mapping can be useful under controlled rules, but unbounded field names can expand the mapping unexpectedly. A payload using user identifiers as field names is a schema-growth hazard. Consider a bounded object representation or a supported flattened structure when arbitrary keys are expected. Define how unknown fields are accepted, ignored or rejected and monitor violations.

Mapping changes need a migration plan. Create a new index with the intended mapping, populate it from an authoritative source or validated reindex path, catch up changes and switch an alias or equivalent application reference. Reconcile deletions and updates during the copy. Keep the old index through the rollback window, accounting for the temporary storage required by both.

## Relevance evaluation requires a stable question set

Select queries representing common intent, rare terminology, misspellings, identifiers and empty-result cases. Have knowledgeable reviewers judge relevance using a documented scale. Keep the corpus snapshot and judgments with each experiment. If the content changes between runs, a score difference can reflect a new corpus rather than a better ranking configuration.

Measure ranking quality and operational latency separately. A relevance change that improves a few head queries but harms specialist queries may not be acceptable. Inspect per-query differences and segments, not only one aggregate nDCG value. Online experiments require an exposure and outcome definition; click-through rate can be influenced by presentation and position rather than relevance alone.

Hybrid lexical/vector retrieval is an option to evaluate, not a universal best practice. Exact codes may favor lexical matching, while conceptual questions may benefit from embeddings. Fusion parameters and reranking can change results substantially. Preserve permission filters across every candidate path and verify that a reranker cannot reintroduce unauthorized documents.

## Bound expensive work before it reaches the cluster

Limit query result size, aggregation buckets, wildcard behavior and other potentially expensive features according to product needs. Deep pagination can consume substantial work; use supported cursor/search-after mechanisms with stable ordering when appropriate. A public search endpoint should not expose an unrestricted query language without resource and authorization controls.

High-cardinality aggregations and large per-query state can exhaust resources even when average request latency looks healthy. Measure concurrency and worst-case queries. Circuit breakers are protective mechanisms with limits, not a substitute for workload admission. Keep timeout and cancellation behavior aligned through the application so abandoned requests do not continue consuming resources unnecessarily.

Routing by tenant can reduce fan-out but concentrate a large tenant on one shard. Test the largest tenant and plan a different routing or index boundary when necessary. Separate operational logs and product search if their retention, query and availability requirements conflict. A shared cluster can be efficient, but ownership must include the interference between workloads.

### Recovery and reindexing lab

Use a disposable index with known identifiers and a small source-of-truth dataset. Bulk load it with one deliberate mapping failure, then verify that reconciliation finds the missing document. Update and delete records while rebuilding a second index. Switch the read alias only after the new index reaches a defined consistent boundary and the expected results match.

Take a supported snapshot, restore it into a separate environment and run the relevance fixture. Confirm mappings, settings, aliases and permissions as well as document counts. Test recovery with a node unavailable and observe whether remaining capacity meets the service objective. Replica availability is not a substitute for a tested snapshot, and an ingestion source is not a substitute for a measured rebuild time.

## Operate the chosen product and version

Elasticsearch and OpenSearch share ancestry but differ in features, APIs and operational guidance. Verify lifecycle policies, vector-search behavior, security configuration and upgrade procedures for the selected product. Do not copy a setting merely because a similarly named feature exists in the other engine.

Use the deployment's supported JVM sizing guidance, including automatic sizing where appropriate. Reserve memory for the filesystem cache and other processes, and monitor actual pressure. Master-eligible topology should follow the supported availability design and workload; “always exactly three dedicated nodes” is not a complete rule for every deployment shape.

A production review should connect ingestion completeness, search freshness, relevance, latency, capacity and recovery. The cluster is healthy when users receive correct permitted results within the objective and operators can restore that behavior after a failure—not only when the health indicator is green.

### Figure methodology

Synthetic 600 GiB primary dataset divided by 50,30 or 10 GiB yields 12,20 or 60 primaries. One replica doubles copies to 24,40,120. Excludes merge/translog overhead, skew and headroom; not a performance recommendation.

| Worked observation | shard copies |
| --- | ---: |
| 50 GiB primaries | 24 |
| 30 GiB primaries | 40 |
| 10 GiB primaries | 120 |

## Primary references and further study

- [Elastic shard-sizing methodology](https://www.elastic.co/docs/deploy-manage/production-guidance/optimize-performance/size-shards)
- [Elastic near-real-time refresh semantics](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search)
- [Elastic snapshot and restore](https://www.elastic.co/docs/deploy-manage/tools/snapshot-and-restore)
