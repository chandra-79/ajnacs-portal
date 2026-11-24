---
title: "Probabilistic Data Structures: Choose the Error Contract"
description: "Use membership filters, cardinality estimators and distribution sketches with explicit assumptions, measured error and exact fallbacks."
date: 2027-03-05
tags: ["Algorithms", "Distributed Systems", "Performance", "Data Engineering", "Programming"]
format: article
---

There's a family of data structures built on a bargain most engineers never consciously accept, even while operating systems full of them: **give up exactness — in a precisely bounded way — and questions that require gigabytes collapse into kilobytes.** How many distinct users this month? Is this URL in the malware set? What's the p99 latency across a billion requests? Answered exactly, each demands memory proportional to the data; answered *probabilistically*, each fits in a structure smaller than this article — with error bars you chose in advance. These structures hide inside Redis, Cassandra, ClickHouse, your CDN, and your observability stack, and knowing the four workhorses converts both design reviews and vendor documentation from magic to mechanism.

## Bloom filters: "definitely not" as a superpower

The Bloom filter answers set membership with a one-sided guarantee: **under the ordinary insert-only model with correct updates, "no" rules out membership and "yes" may be a false positive** (a tunable false-positive rate, traded against size — practical filters spend ~10 bits per element for ~1% error, regardless of element size). Mechanism: a bit array plus k hash functions; insertion sets k bits; lookup checks them — all set means "probably present," any unset means "provably absent."

Its killer application is **skipping expensive work when the answer is no**, and it's everywhere: storage engines (Cassandra, RocksDB-lineage LSM trees) consult per-file filters before touching disk — "does this SSTable possibly hold this key?" — turning point-reads across hundreds of files into a handful of real I/Os; caches use them to avoid lookups for keys that were never cached (the one-hit-wonder admission problem — CDNs famously filter "seen once" objects to keep them from polluting cache space); databases push them into distributed joins ("ship a filter of the join keys, not the table"); and security systems screen URLs/passwords against breach corpora locally, escalating to the authoritative check only on filter hits. The design-review reflex: any hot path performing expensive lookups that *usually miss* is a Bloom filter waiting to be installed. The operational fine print: classic filters don't delete (bits are shared — use counting variants or rebuild periodically), sizing is set at construction (over-filling degrades the error rate — plan for growth or use scalable variants), and the modern refinements (cuckoo filters: deletion and better space at low error rates) are worth knowing when the classic shape chafes.

## HyperLogLog: counting millions of distincts in twelve kilobytes

Distinct-counting is the query that quietly wrecks exact systems — `COUNT(DISTINCT user_id)` at scale means hashing every ID into a giant set, per group, per time window. **HyperLogLog** trades register count and representation against estimation error. Under the standard asymptotic analysis, relative standard error is approximately `1.04 / sqrt(m)` for `m` registers: 4,096 registers give about 1.625%, while 16,384 give about 0.8125%. Memory depends on register width, sparse representations and implementation overhead; these are standard errors, not hard error bounds. It estimates cardinality using an idea of indecent elegance: hash every element and observe the maximum run of leading zeros — seeing a hash with twenty leading zeros suggests you've seen on the order of a million distinct values (rare patterns imply many draws); average that observation across a few thousand buckets and the estimate becomes stable. Two properties make it infrastructure rather than trivia: **fixed size regardless of cardinality** (counting a thousand or a billion distincts costs the same bytes), and **mergeability** — compatible HLL register sets merge by per-register maxima, while cardinality remains approximate, so per-shard, per-hour sketches roll up into per-cluster, per-month answers without recounting; this is why it's a native type in Redis (`PFCOUNT`), ClickHouse/BigQuery-class engines (`APPROX_COUNT_DISTINCT`), and every serious analytics pipeline. The placement rule: some dashboards can tolerate a declared probabilistic error model; billing and other consequential uses need requirements-specific evaluation — know which query is which (the honest-metrics discipline, applied to approximation).

## Count-min sketch and t-digest: frequencies and percentiles

**Count-min sketch** under a nonnegative-update model answers "how often has X occurred?" in a fixed grid of counters (rows of hashed buckets; read the minimum across rows) — with one-sided error (never undercounts, may overcount by a bounded amount, biased against rare items) that makes it precisely the right tool for **heavy-hitter detection**: the hot keys, the top talkers, the trending items, the rate-limit offenders — questions where you care about the big counts and the noise floor doesn't matter. It's the mechanism inside "find the hot partition" tooling, DDoS top-source detection, and trending algorithms, and its mergeability gives the same roll-up property as HLL.

**T-digest** (and relatives like DDSketch) solves the percentile problem that haunts observability: percentiles don't average — you can't combine per-host p99s into a fleet p99 (the classic dashboard lie) — and exact percentile computation requires sufficient access to the ordered data or an exact counting representation. Digests keep a compressed, mergeable summary of the distribution, accurate precisely where it matters (the tails), in kilobytes: different metrics backends use different histogram or sketch representations, whose accuracy contracts must be checked, and the mechanism behind histogram-based SLO math (burn-rate calculations generally require compliant and total event counts; the instrument must support the chosen objective). The operator's takeaway: understand whether your observability pipeline merges digests/histograms (correct) or averages percentiles (fiction), because entire latency SLOs have been theater over the second kind.

## The engineering discipline of being wrong on purpose

Using these structures well is mostly about *placing the error where it's free*: *choose one-sided errors that fail safe* (a Bloom false positive costs one wasted lookup — harmless; using it where a false "yes" grants access would be catastrophic misplacement); *pair the sketch with an exact escalation path* where decisions matter (screen with the filter, confirm with the database — the sketch as bouncer, not judge); *budget the error like latency* (it's a chosen parameter with a memory price — write it in the design doc: "unique counts use a stated estimator, relative-error model and confidence interpretation; frequency estimates use declared additive-error and confidence parameters"); and *exploit mergeability as the architectural feature* — sketches are the data structures of distributed aggregation, turning "collect everything centrally" problems into "merge small summaries" problems, which is frequently the difference between a pipeline that exists and one that was deemed infeasible (the same decentralize-then-consolidate shape as every edge and streaming pattern).

The meta-point for the design review: exactness is a *requirement to be justified*, not a default to be assumed — most aggregate questions at scale (counts, tops, percentiles, membership screens) tolerate bounded error invisibly, and the engineer who knows the four workhorses can sometimes reduce memory and aggregation cost substantially, subject to measurement. The systems you admire already made that trade, quietly, everywhere. Knowing where is the difference between operating them and merely running them.

## Decide which wrong answer the system can tolerate

Approximation is a property of a particular query, not a licence to make every result imprecise. A membership prefilter can tolerate false positives when they cause an extra exact lookup. An access-control decision cannot treat “probably present” as authorisation. A cardinality estimate may be useful for capacity planning while the underlying records still require exact accounting.

Write the consequence of each error before choosing a structure. For a fictional document archive, a Bloom filter can avoid a database query when a checksum is definitely absent from the complete inserted set. A positive result triggers the database check. If the filter is stale and missing recent inserts, even a negative result is no longer authoritative about the current database. The mathematical guarantee applies to the filter's own correctly maintained set.

A rebuild or distributed update protocol must preserve that distinction. Switching to an incomplete filter can introduce operational false negatives despite the classic data structure's insertion-only guarantee. Treat filter version, source position, and publication state as part of the design. Fall back to the exact store when completeness is uncertain.

## Work through the Bloom sizing model

For the standard approximate analysis, let m be the number of bits, n the inserted distinct items, and k the hash count. Under the usual uniform-hashing assumptions, false-positive probability is approximately `(1 - exp(-k*n/m))**k`. It describes a query for an item not inserted into the filter; it is not the probability that any positive result is wrong.

Use synthetic inputs m = 10,000 bits and k = 7. With n = 1,000 inserted items, the approximation gives about 0.82% false positives. At n = 2,000 it gives about 13.78%. The chart compares those two modeled probabilities. The filter size is 1,250 raw bytes before implementation metadata, and the second case deliberately overfills the original planning capacity.

The difference illustrates why population growth matters. A fixed bit array does not maintain the same error rate as more items are inserted. A scalable implementation may allocate additional filters, changing memory use and query behaviour. Check the chosen library's contract rather than assuming the textbook fixed-size model applies unchanged.

## Conditional probability changes the meaning of a hit

Suppose only one in a thousand queried keys is actually present, while the filter's false-positive rate for absent keys is 1%. Among 100,000 hypothetical queries, about 100 are true members and 99,900 are absent. The expected false positives are about 999, so only about 100 / 1,099, or 9.1%, of positive answers correspond to actual members under this simplified model.

This does not contradict the 1% false-positive rate. The denominator differs: the rate applies to absent queries, while the positive predictive value depends on prevalence. This is why a filter hit should trigger an exact check rather than be described to users as “99% certain to exist.” Query distribution matters as much as the configured error target.

## Distinguish estimator error from a hard bound

HyperLogLog's standard error is a statistical characteristic under its assumptions, not a promise that every estimate lies within a fixed percentage. Implementation details, precision, hash quality, and cardinality regime affect behaviour. Compatible sketches can be merged without retaining original identifiers, but the resulting count remains an estimate.

Merge only structures with compatible precision, hashing, representation, and semantics. A daily unique-user sketch and a daily unique-session sketch cannot meaningfully be combined just because both use HyperLogLog. Distinct counts also cannot generally be subtracted to recover intersections or deletions. Decide how window expiry and corrections are represented before adopting the structure.

A count-min sketch supports frequency estimates for supplied keys under a nonnegative-update model. It does not by itself enumerate the most frequent keys; a candidate-tracking mechanism is needed for a top-k result. Negative updates, counter overflow, and incompatible merges can invalidate the familiar no-underestimate property. State the update model in the documentation.

## Percentile summaries have different guarantees

A t-digest, DDSketch, fixed histogram, and HDR-style histogram are not interchangeable names for the same error contract. Some designs emphasise rank accuracy, others relative value error or configured bucket resolution. Tail behaviour and merge effects depend on the algorithm and implementation. Read the actual guarantee before using a sketch to make a threshold decision.

For a latency objective defined as a fraction of requests below 300 milliseconds, a histogram with an exact boundary at 300 milliseconds can directly count compliant requests within the instrument's semantics. An estimated p99 answers a different question. Do not replace the objective's required count with a percentile merely because the dashboard makes it convenient.

## A reproducible approximation lab

Generate a seeded set of synthetic identifiers and retain the exact set as a reference. Insert a declared subset into the filter, query both inserted and known-absent identifiers, and record false positives and any unexpected false negatives separately. Repeat at the planned capacity and at twice that capacity. Publish the seed, hash configuration, implementation version, and query counts with the result.

For cardinality estimation, generate overlapping shard populations, build one sketch per shard, merge them, and compare with the exact union. Do not sum per-shard estimates when identifiers overlap. Repeat across several seeds and cardinalities so one lucky estimate is not presented as the algorithm's error profile.

The deployment decision should include the exact fallback, memory budget, expected population, update and deletion model, merge compatibility, and monitoring for saturation or drift. Approximation earns its place when its errors are understood and harmless within that workflow, not when a compact structure makes a large number look impressive.

## Further reading and source boundaries

- [Redis: Bloom filter semantics](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)
- [Flajolet and colleagues: original HyperLogLog analysis](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)
- [Redis: count-min sketch](https://redis.io/docs/latest/develop/data-types/probabilistic/count-min-sketch/)
- [t-digest original implementation and accuracy notes](https://github.com/tdunning/t-digest)
