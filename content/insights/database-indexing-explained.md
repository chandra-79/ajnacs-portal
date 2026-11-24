---
title: "Database Indexing, Actually Explained: B-Trees, Composite Keys, and the Query Planner's Point of View"
description: "Design indexes from query predicates, compare candidate rows and execution plans, and account for write and maintenance costs."
date: 2027-05-03
tags: ["Data Engineering", "Performance", "Programming"]
format: article
---

Database indexing occupies a strange knowledge niche: every backend engineer knows indexes make queries fast, most can add one, and surprisingly few can predict *which* queries an index will and won't serve — which is why production systems accumulate both missing indexes (the slow query everyone tolerates) and useless ones (the write-amplifying dead weight nobody audits). The gap closes with one mental model, held firmly: the index as a sorted structure, read the way the query planner reads it.

## The mental model: a sorted phone book with pointers

A B-tree index — the default nearly everywhere — is a balanced tree keeping entries **in sorted order by the indexed value(s)**, each entry pointing at its table row. Every capability and every limitation flows from "sorted": an index on `email` answers `email = ?` in a handful of page reads (tree descent, logarithmic), serves `email > ?` and `email BETWEEN` (walk the sorted range), serves `ORDER BY email` without sorting (it's *already* sorted), and can serve prefix patterns `LIKE 'smith%'` when the collation and operator class support that range search. A plain B-tree does not provide a selective suffix search for `LIKE '%smith'`, nothing for `lower(email) = ?` (the index stores `email`, not `lower(email)` — function-wrapped columns need *expression indexes* matching the exact expression), and may be less attractive for a predicate matching a large fraction of the table. There is no universal matching-percentage cutoff: covering, clustering, cache state and row width change the cost.

The second half of the model is the read path's cost structure: an index lookup finds *pointers*; fetching the actual rows costs additional random I/O per row. This one fact explains the two planner behaviors that most confuse people. **Why did it ignore my index?** Because for low-selectivity predicates (matching a big fraction of the table), thousands of random row-fetches cost more than one sequential scan — the planner is usually right, and the fix is a more selective predicate or a better index, not planner hints. **What's a covering index?** One that contains every column the query needs (via composite keys or INCLUDE columns), so some or all row fetches can be avoided when visibility and engine conditions permit — the query is answered entirely inside the index, which is why covering hot queries is one of the biggest single wins available.

## Composite indexes: the leftmost-prefix rule and the design recipe

Multi-column indexes are where engineering judgment concentrates, and one rule governs them: a composite index on `(a, b, c)` is sorted by `a`, then `b` within `a`, then `c` within that — so it serves queries filtering on `a`, on `a,b`, on `a,b,c` (leftmost prefixes), while queries on only `b` or `c` may require broader scans or version-specific strategies such as skip scan. The recipe that follows for designing an index for a query: **equality columns first, then the range or sort column** — `WHERE tenant_id = ? AND status = ? AND created_at > ? ORDER BY created_at` wants `(tenant_id, status, created_at)`; the equality columns pin a contiguous block, and within it, `created_at` is sorted — filter and order both served, no sort step. Put the range column earlier and everything after it degrades (a leading range can limit how later ordering helps, while later predicates may still reduce work).

Corollaries with daily relevance: an index on `(a,b)` may overlap one on `(a)`, but constraints, size and workload evidence must be reviewed before removal; column *order within the index* matters far more than most schema reviews notice; and "one index per column, let the database combine them" (bitmap-AND exists but underwhelms) is a weak substitute for one well-designed composite per critical query shape. Design indexes *from the query workload* — the top slow queries by total time — not from the schema's aesthetics.

## What indexes cost: the accounting nobody does

An index adds a data structure and maintenance rules: an INSERT must maintain applicable indexes, while a partial index only includes rows satisfying its predicate. UPDATEs can require maintenance when indexed values or predicate membership change (and in Postgres, thanks to its MVCC row-versioning, potentially more than that — one reason hot-updated tables want lean indexing). Ten indexes on a high-write table introduce up to ten index-maintenance paths, with different entry sizes, page effects and eligibility; this does not imply a fixed tenfold increase in total write time — plus buffer-cache pressure (index pages compete with data pages for memory) and storage. The operational hygiene that follows: **audit for unused indexes** (every engine exposes usage counters — `pg_stat_user_indexes` and friends; unused indexes on write-hot tables are pure tax, and their removal can reduce maintenance but requires checking constraints and infrequent uses), audit for *redundant* ones (prefix-subsumed as above), and treat "add an index" PRs with the same cost-consciousness as "add a dependency" ones. Indexes are not free speed; they're a purchase of read performance with write currency, and the exchange rate varies by table.

## Beyond the B-tree, briefly

The specialized structures earn their keep in their niches: **partial indexes** (index only rows matching a predicate — `WHERE status = 'active'` — small, hot, and precisely aimed at queries with the same predicate; chronically underused); **expression indexes** (for the `lower(email)`, date-truncation, and JSON-extraction predicates your queries actually use); **GIN-class inverted indexes** for containment questions (full-text, JSONB, arrays — "which rows contain X" is the inverted index's home game and the B-tree's nightmare); **BRIN-class block-range summaries** for huge naturally-ordered tables (append-only time series — tiny indexes, great for time-range scans); and the vector indexes (HNSW-class) of the embedding era, which come with *approximation* semantics — recall/latency trade-offs — that deserve conscious tuning rather than default acceptance. The selection principle: name the query shape first, then pick the structure built for it.

## The working loop

Index work is empirical or it's guesswork. The loop: capture the workload's expensive queries (slow-query logs, `pg_stat_statements`-class aggregation — sort by *total* time, not just worst-case, because the 5 ms query run a million times an hour outranks the 2-second nightly one); read the plan (`EXPLAIN ANALYZE` — learn to spot the sequential scan on the big table, the sort that an index order would erase, the row-estimate wildly off from reality signaling stale statistics); design the minimal index for the shape; verify the plan changed *and* the metrics moved; and re-audit quarterly, because workloads drift and last year's crucial index is this year's write tax. Keep statistics fresh (autovacuum/analyze health is index performance in Postgres), and remember the planner is a cost model — it's only as good as its statistics, and an unexpected plan can reflect stale statistics, unmodeled correlations, parameter-sensitive estimates, cost settings or a mismatch between the index and query shape.

The compact takeaway: sorted-structure mental model, equality-then-range composite design, covering indexes for the hottest paths, partial/expression indexes for the predicates you actually write, write-cost accounting on every addition, and an empirical loop instead of superstition. That's the whole craft — and it remains, byte for byte, the highest-ROI performance discipline in ordinary backend systems: no rewrite, no infrastructure, a measured schema change with workload-dependent benefits, still slightly magical every time.

## Build one index from a complete query

Consider a hypothetical order feed with a million rows. The application requests the newest fifty pending orders for one tenant. The predicate is `tenant_id = ? AND status = 'pending'`, the order is descending creation time and identifier, and the response includes a small set of columns. The index design needs all of those facts: filtering, ordering, limit and selected values. An index named after a field is not a complete design argument.

A candidate B-tree could use `(tenant_id, status, created_at DESC, id DESC)`. A partial index restricted to pending rows might instead use `(tenant_id, created_at DESC, id DESC)` if the query predicate and planner can use it. Choose between them by the full workload, including queries for other statuses and the frequency with which orders change status. A partial index is smaller only relative to the qualifying population, and status transitions still require maintenance.

```sql
CREATE INDEX orders_pending_feed
ON orders (tenant_id, created_at DESC, id DESC)
WHERE status = 'pending';
```

This example assumes existing columns and is for a disposable fixture. Production index creation needs a rollout plan, lock assessment and the appropriate build method. Do not copy it into a busy database without checking the deployed version's concurrent-build behavior and failure cleanup.

### A synthetic candidate-set experiment

Construct one million orders, exactly ten thousand for the selected tenant and exactly five hundred pending within that tenant. The chart compares those three logical candidate populations. A full table predicate begins with one million rows; tenant filtering narrows the set to ten thousand; tenant plus pending status narrows it to five hundred. The requested page contains fifty rows, but that does not mean the physical plan always examines only fifty entries.

Run the actual query with and without the candidate index and retain `EXPLAIN (ANALYZE, BUFFERS)` output. Measure examined rows, rows removed by filters, heap fetches, buffers and elapsed time. Repeat for a large tenant, an empty result and a tenant whose pending fraction is much higher. These constructed counts are not a speedup estimate. The improvement depends on page layout, cache state, visibility and the chosen plan.

## The leftmost-prefix rule is a heuristic, not the whole planner

Leading equality constraints usually make a multicolumn B-tree especially effective because they narrow the contiguous range to inspect. Later conditions can still be checked in the index, and deployed PostgreSQL versions can use strategies such as skip scan under suitable distributions. A query on a nonleading column is not categorically incapable of using the index. The question is how much work that access path avoids compared with alternatives.

Likewise, an index on `(a,b)` does not automatically make `(a)` safe to drop. The shorter index may be smaller, support different uniqueness semantics, have different predicates or operator classes, or serve a workload where its size matters. Check constraints, dependencies and representative usage before removal. “Unused” counters also depend on the observation interval, resets, replicas and infrequent operational queries.

Equality-first is a useful starting point, but range and sort requirements can compete. A query filtering a wide date range while ordering by another column may benefit from a different index than one fetching a narrow time interval. The planner may combine indexes with bitmap operations or choose a sequential scan. Evaluate the requested result and total workload rather than defending one mnemonic against measured evidence.

## Index-only does not mean visibility-free

An index containing the projected columns can make an index-only scan possible. PostgreSQL must still establish row visibility, and heap visits can remain when visibility-map information is insufficient. Inspect the plan's heap-fetch count and table update pattern. A covering index on a frequently updated table may provide less benefit than a benchmark over a static fixture suggests.

Adding large payload columns to INCLUDE can increase index size, reduce cache efficiency and increase write cost. Include only what the critical query justifies. A query returning a large document may be better served by a selective index followed by a small number of heap fetches. The best index minimizes total useful work; it does not maximize the number of columns stored twice.

Expression indexes require matching semantics, including data type, collation and relevant operator behavior. Prefix text searches can use a B-tree under appropriate collation and operator-class conditions, while leading-wildcard searches often need a different strategy. Do not assume every LIKE expression has the same indexing behavior. Test the exact application expression, including implicit casts.

## Budget the write side and the rollout

Measure insert and update latency before and after the index under representative concurrency. Record WAL volume, storage growth and maintenance behavior. The number of indexes is not a linear multiplier of total write time: index types, changed columns, HOT eligibility, cache state and storage determine the cost. A useful report includes both read benefit and write impact rather than claiming an arbitrary tenfold overhead from ten indexes.

During a concurrent build, monitor progress and resource pressure. A failed build may leave an invalid index requiring explicit cleanup. Concurrent creation also has restrictions and waits that should be understood in the deployed engine. A rollout should identify the stopping condition, the application metric being protected and the safe removal procedure if the candidate does not help.

### Index-review worksheet

For each proposed index, record the exact query family, parameter distribution, expected result size and service objective. Attach before-and-after plans from representative fixtures and a write-cost measurement. State whether the index supports a constraint, which existing index it might replace and what evidence supports that replacement. Include the build method and disk headroom.

Review after the workload has run long enough to include normal reporting and maintenance cycles. Keep the index if it provides a justified benefit or necessary invariant; otherwise remove it through the same controlled process. An index is successful when it improves a measured operation within an acceptable maintenance budget, not simply when EXPLAIN prints its name.

### Figure methodology

Synthetic table contains 1,000,000 orders,10,000 in one tenant and 500 pending within that tenant. Counts describe logical predicate populations, not physical index visits or measured speedups. Actual work depends on the execution plan and data layout.

| Worked observation | rows |
| --- | ---: |
| All orders | 1000000 |
| Tenant orders | 10000 |
| Tenant pending orders | 500 |

## Primary references and further study

- [PostgreSQL multicolumn indexes and skip scan](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- [PostgreSQL index-only scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)
- [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL plan interpretation](https://www.postgresql.org/docs/current/using-explain.html)
