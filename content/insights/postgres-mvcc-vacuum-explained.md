---
title: "MVCC and VACUUM, Finally Explained: Why Postgres Behaves the Way It Does"
description: "Understand row versions, vacuum eligibility and transaction horizons, then measure dead tuples and maintenance behavior under a controlled workload."
date: 2028-05-17
tags: ["Data Engineering", "Performance", "Programming", "Reliability"]
format: article
---

Postgres operational knowledge has a peculiar shape: a pile of seemingly unrelated folklore — "watch out for bloat," "tune autovacuum on busy tables," "beware transaction-ID wraparound," "long transactions are bad," "updates are expensive" — that turns out to be one fact wearing five costumes. The fact: **Postgres implements multi-version concurrency control by keeping old row versions in the table itself** — an UPDATE writes a *new* row version alongside the old one; a DELETE marks the row dead without removing it; and readers see whichever version their snapshot entitles them to (the isolation-level machinery, implemented as version visibility). The design buys the crown jewel — ordinary snapshot reads avoid many read/write conflicts, while row and table locks can still block operations — and it creates a maintenance debt: **dead versions accumulate until something reclaims them**, and that something is VACUUM. Understand this one trade and the folklore becomes mechanism.

## The consequences, one costume at a time

**Bloat** is the debt made visible: update-heavy tables carry dead versions inline — the table (and its indexes) grow beyond live-data size, scans read pages full of corpses, and the cache-hit economics degrade (the working-set math, taxed by ghosts). **Update cost** follows: every UPDATE is physically an insert-plus-tombstone, and — the detail with design consequences — *a non-HOT update can require new entries in applicable indexes even when their key values did not change* (the index-count write-amplification from indexing practice, with MVCC as the multiplier), except when the **HOT (heap-only tuple) optimization** applies: updates that fit on the original page and do not modify columns referenced by non-summarizing indexes can avoid new ordinary index entries. Summarizing indexes such as BRIN have separate maintenance rules in supported versions — which is the mechanical reason behind two schema-design rules: don't index columns you update constantly, and leave per-page slack (`fillfactor` below 100) on update-hot tables so HOT chains have room. **Long-running transactions** get their bad reputation here too: VACUUM can only reclaim versions *older than the oldest snapshot still alive* — one analyst's forgotten idle-in-transaction session (or one abandoned replication slot, per the CDC vigilance) holds the reclamation horizon back for the whole database, and bloat accumulates fleet-wide while everyone blames the workload; the countermeasures are policy, not tuning (idle-in-transaction timeouts, slot monitoring, and the batch-job discipline of short transactions).

**And the famous one — transaction-ID wraparound**: row versions are stamped with 32-bit transaction IDs, whose comparison arithmetic requires old stamps to be periodically "frozen" (marked forever-visible) before the counter wraps — VACUUM's second job. Defer it long enough (autovacuum disabled "for performance," or a wraparound-horizon held back at billions of transactions) and Postgres protects data integrity the only way it can: refusing new writes until a freeze completes — the legendary outage genre where the database "just stopped." The monitoring that makes wraparound a non-event is one query (database and table age versus the autovacuum-freeze threshold, alarmed with generous headroom) — it belongs on every Postgres estate's dashboard, but alerts also need timely ownership, capacity and a tested response.

## Autovacuum: tuning the janitor for the building it actually cleans

Autovacuum uses configured thresholds and scale factors, with additional triggers and version-specific limits. A hypothetical scale factor of 0.2 contributes 200 million tuples on a billion-row table *before* considering a base threshold or any maximum threshold. That arithmetic is not the current default firing point. Inspect the deployed settings and actual cleanup progress; defaults may require adjustment for the workload. The tuning that works is *per-table and threshold-shaped*: on the hot tables, drop the scale factor toward flat thresholds (vacuum after N-thousand dead tuples, not after a percentage), raise autovacuum's cost limits so it can actually keep pace (appropriate throttling depends on available storage bandwidth and foreground latency — the disk-headroom trade from capacity practice, spent on maintenance), and add workers where many tables compete. The complementary statistics job (ANALYZE, riding the same machinery) feeds the query planner — the stale-statistics plan disasters from plan-reading practice are frequently autovacuum starvation wearing an optimizer costume. And the honest escalation path: ordinary VACUUM mainly makes space reusable inside the relation; it can sometimes return entirely empty tail pages to the operating system, but it does not generally compact live rows throughout the file — the repack tier (`pg_repack`-class online rebuilds) is the remediation for the table that got away, scheduled like the maintenance it is.

**Monitoring closes the loop** with a short vital-sign list: dead-tuple counts and bloat estimates per table (trend, not snapshot), last-autovacuum timestamps on the hot tables (the table that hasn't been visited in days *is* the incident precursor), the oldest-transaction/slot horizon (the reclamation blocker detector), and wraparound age (above). Four queries, one dashboard, and the entire folklore genre — the mystery bloat, the sudden slowness, the write freeze — becomes a set of signals that can reveal trouble early, with warning time determined by the workload.

The closing calibration: MVCC-in-heap is neither flaw nor accident — it's a deliberate trade (concurrent reads at the cost of background maintenance) that Postgres made differently than its peers (the undo-log designs relocate the debt rather than deleting it — every MVCC database pays somewhere), and operating Postgres well is mostly *respecting the trade*: schemas that let HOT work, transactions that end, autovacuum tuned to the workload's actual churn, and the four vital signs watched. The database's most mystifying behaviors are, underneath, one honest mechanism keeping one honest promise — snapshot visibility that reduces many read/write conflicts — and sending the bill to whoever reads the maintenance manual. Be the estate where someone has.

## Observe the visibility horizon before changing settings

An old row version is not removable simply because a newer version exists. PostgreSQL must preserve versions that an active snapshot can still need. The operational investigation therefore has two parts: how quickly obsolete versions are created, and what prevents cleanup from advancing. Increasing vacuum throughput addresses the first problem only if eligible tuples exist. It cannot make an active reader's required history disappear safely.

Long transactions are not equivalent in every isolation mode, and a session's age alone does not tell you its snapshot requirements. Inspect transaction state and horizon information rather than terminating the oldest connection reflexively. Replication slots also differ: physical and logical replication retention mechanisms must be examined separately. A logical slot can retain WAL and relevant row/catalog horizons; an unused slot is an operational resource with an owner, not just a harmless configuration entry.

A diagnostic worksheet should record the table, live-row estimate, dead-tuple estimate, last vacuum and analyze times, oldest relevant transaction, slot retention, database transaction-ID age, WAL growth and free disk. The counts in PostgreSQL statistics views are estimates, not an exact census of recoverable bytes. Check whether counters were recently reset and whether the workload changed before comparing two snapshots.

### Hypothetical maintenance queue

Assume a controlled fixture starts with 100,000 obsolete row versions eligible for reclamation. New updates create another 20,000 eligible versions per minute. A first configuration processes 30,000 versions per minute, giving a net reduction of 10,000 per minute. After five minutes, the modeled backlog is 50,000; after ten, it is zero. A second configuration processes only 15,000 per minute, so the same backlog grows by 5,000 per minute to 150,000 after ten minutes.

These are synthetic throughput assumptions, not PostgreSQL benchmarks. They illustrate why a vacuum that runs regularly can still fall behind. Actual cleanup occurs in page-oriented operations with variable eligibility, index work, visibility-map state and I/O contention. A blocked horizon can make the useful reclamation rate effectively zero even while the vacuum process consumes resources. Measure table growth and horizon progress alongside activity.

## A safe two-session exercise

Use a disposable database and a small table. Insert a known number of rows, then open a repeatable-read transaction in session A and issue a SELECT so it holds an established snapshot. In session B, update a set of rows and commit. Session A should continue to see its snapshot's values; a new transaction can see the committed updates. Run ordinary VACUUM in another session and inspect the diagnostic output and relation statistics. End session A, run cleanup again and compare.

Do not infer that the operating system must immediately report a smaller database file. Ordinary VACUUM primarily makes internal space reusable, and sometimes can truncate empty pages at the end under suitable conditions. `VACUUM FULL` rewrites a relation, needs extra working space and takes a strong lock. It is a different maintenance operation, not a more enthusiastic version of the background cleaner. Test the lock and disk implications before scheduling a rewrite.

Make the exercise reproducible by recording the PostgreSQL version, isolation level, row count, table fillfactor and exact transaction sequence. Run it on a nonproduction instance; do not create a deliberately long snapshot on a busy shared service just to demonstrate the effect. A successful lab explains the mechanism without producing an avoidable operational backlog.

## HOT updates are conditional

Heap-only tuple updates can avoid creating new entries in ordinary indexes when the relevant indexed attributes do not change and space is available on the same heap page. Exact eligibility has version-specific details, including treatment of summarizing indexes. Lower fillfactor can reserve room for future updates, but it also increases the initial space footprint and can alter read I/O. It is a workload trade, not an automatic improvement.

Compare a narrow frequently updated table with and without an index on its changing field. Measure the HOT update fraction, WAL volume, relation size and representative read latency. If removing the index harms a critical lookup, consider separating stable identity and frequently changing state into different tables. A cleaner storage pattern may solve the conflict better than increasingly aggressive maintenance settings.

## Tune with budgets and stopping rules

Inspect the deployed version's actual settings before quoting default scale factors or thresholds; defaults and additional trigger limits can change. For a large busy table, a smaller per-table vacuum threshold can start work earlier. More workers or higher cost limits may improve throughput, but they also consume CPU, memory and storage bandwidth. Reserve enough capacity for foreground queries and checkpoints. Track whether the improvement persists during the busiest ingestion interval.

A staged change should have explicit stop conditions: worsening application latency, unexpected lock contention, unsafe free-disk headroom or failure of the reclamation horizon to advance. If the bottleneck is an abandoned transaction, deal with its owning workload and retry semantics. If it is replication retention, assess replica recovery and downstream data loss before dropping a slot. If it is genuine maintenance throughput, adjust resources and thresholds with a measurable target.

Transaction-ID age deserves a separate alert budget. A rapid transaction rate can consume remaining headroom faster than a time-based dashboard suggests. Monitor age and its rate of change, understand anti-wraparound behavior for the deployed release, and retain a response procedure that does not disable protective maintenance. Table freshness, disk health and transaction-ID safety are related responsibilities, but none can stand in as a complete proxy for the others.

### Operational handoff

Publish a per-table maintenance record with the measured churn, selected settings, expected cleanup rate and an owner. Include the oldest allowed transaction behavior, replication-slot review procedure and the point at which maintenance becomes an incident. A useful runbook distinguishes “vacuum cannot remove these versions yet” from “vacuum is eligible but cannot keep up.” That distinction determines whether the next action belongs to application transaction management, replication recovery or database capacity planning.

### Figure methodology

Synthetic model starts at 100,000 eligible obsolete versions. Creation is 20,000/minute for ten minutes. Cleanup at 30,000/minute yields max(0,100,000+200,000−300,000)=0; cleanup at 15,000/minute yields 150,000. No blocked snapshots are assumed; this is not a benchmark.

| Worked observation | row versions |
| --- | ---: |
| Starting backlog | 100000 |
| Cleanup keeps up | 0 |
| Cleanup falls behind | 150000 |

## Primary references and further study

- [PostgreSQL routine vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [PostgreSQL monitoring statistics](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [PostgreSQL explicit locks](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL heap-only tuples and summarizing indexes](https://www.postgresql.org/docs/current/storage-hot.html)
