---
title: "Transaction Isolation Levels: The Concurrency Bugs You Signed Up For Without Reading"
description: "Read committed, repeatable read, snapshot, serializable — every database defaults to weaker isolation than developers assume, and the anomalies are subtle, load-dependent, and real. What each level actually permits, write skew explained properly, and the practical toolkit."
date: 2028-03-01
tags: ["Data Engineering", "Programming", "Distributed Systems", "Reliability"]
format: article
---

Here is the quiet contract most applications run on without anyone having read it: your database's default isolation level permits concurrency anomalies that can corrupt business invariants, the anomalies appear only under concurrent load (never in tests, rarely in staging), and the vendors chose those defaults because stronger guarantees cost throughput. "We use transactions" is where most engineers' confidence ends — and it's roughly as informative as "we use locks." Transactions guarantee atomicity and durability unconditionally; what they guarantee about *concurrent* transactions seeing each other's work is the isolation level, it's configurable, and the differences have eaten real money.

## The anomaly zoo, from famous to underrated

**Dirty reads** (seeing uncommitted data that may roll back) are blocked by essentially every sane default — historical interest only. The action starts above them:

**Non-repeatable reads and phantoms:** within one transaction, re-reading data returns different results because a concurrent commit landed in between. The report that sums a column twice and gets two answers; the check-then-act that validated a condition which stopped being true before the act. **Read Committed** — the default in PostgreSQL, Oracle, and SQL Server — permits both: each *statement* sees a consistent snapshot, but the transaction as a whole watches the world move.

**Lost updates:** two transactions read the same row, compute, and write back — the second write silently overwrites the first's contribution. The classic counter/balance bug, permitted at Read Committed, and the reason `UPDATE ... SET balance = balance + ?` (atomic, in-place arithmetic) beats read-modify-write in application code — the absolute-state-over-relative-mutation discipline from idempotency practice, earning its keep again.

**Write skew** — the underrated one, and the reason "we use snapshots, we're fine" is false confidence. Two transactions each read a *consistent snapshot*, each check an invariant ("at least one doctor must remain on call"), each modify a *different* row, and each commit successfully — jointly violating the invariant no single transaction broke (both doctors went off call, each having verified the *other* was still on). Snapshot isolation — what PostgreSQL's Repeatable Read and Oracle's Serializable actually provide — prevents everything above *except this*: invariants spanning multiple rows, enforced by check-then-write logic, are exactly where snapshots don't protect you. Every "how did we end up with two…?" incident in a snapshot-isolated system is this anomaly wearing a business costume: double-booked resources, over-issued vouchers, duplicate usernames pre-constraint, budget lines that jointly exceed the cap.

## What the levels actually mean (and the vendor asterisks)

The SQL-standard ladder — Read Uncommitted, Read Committed, Repeatable Read, Serializable — describes anomalies, not implementations, and the implementations are where engineers get surprised: **PostgreSQL's Repeatable Read is snapshot isolation** (stronger than the standard's requirement — no phantoms — but write-skew-permitting), and its **Serializable is the real thing** (SSI — serializable snapshot isolation: optimistic, non-blocking, detecting dangerous patterns at commit and aborting one participant with a serialization error — meaning *your application must retry*, which is the operational contract most teams miss: enabling Serializable without retry loops converts subtle corruption into user-facing errors). **MySQL/InnoDB defaults to Repeatable Read** with its own flavor (gap locks, and read patterns that can still admit surprises under mixed workloads). **Oracle tops out at snapshot** (its "Serializable" is snapshot isolation — write skew included) — the asterisk that has surprised a generation of migrating teams. The portable truth: *read your engine's documentation for the level you run, and trust the anomaly definitions over the level names.*

Distributed and replicated systems add their own axis: read replicas serve *stale* snapshots (read-your-own-writes is a routing discipline, not a given), and the NewSQL/Spanner-class systems that advertise external consistency are selling exactly this problem's absence — at the latency cost the multi-region physics demands. The isolation conversation and the replication-lag conversation are the same conversation at different scales.

## The practical toolkit, in order of preference

Real systems mix techniques per operation rather than globally cranking the dial:

**1. Make the database enforce the invariant declaratively.** Unique constraints, foreign keys, check constraints — enforced atomically regardless of isolation level, immune to write skew by construction. The two-usernames race dies at a unique index, not at Serializable. Always the first question: *can this invariant be a constraint?*

**2. Make contended updates atomic in SQL.** In-place arithmetic, conditional updates (`WHERE status = 'pending'` — the zero-rows-affected answer *is* the concurrency signal), and upserts. This eliminates lost updates without locks or retries.

**3. Lock what you check.** `SELECT ... FOR UPDATE` on the rows a decision depends on converts check-then-act into a serialized critical section — the right tool for the doctor-on-call shape when the checked rows are few and known. (Its cousin `SKIP LOCKED` builds the job-queue pattern from coordination practice.) Costs: held locks under load, and deadlock handling as a fact of life (deadlocks are the database *detecting* your lock-order inconsistency — retry them, and standardize acquisition order).

**4. Optimistic concurrency for read-mostly contention.** A version column checked at write (`WHERE version = ?`) — the lost-update guard with no held locks, at the price of application-level retry. This is also the *only* game in town across HTTP boundaries (the ETag/If-Match pattern — API-layer optimistic concurrency), where database locks can't reach.

**5. Serializable, scoped.** For the operations whose invariants span rows and resist constraints — the true write-skew shapes — run *those transactions* at Serializable (per-transaction settings exist precisely for this), with retry-on-serialization-failure wrappers, and keep the hot high-throughput paths at Read Committed with techniques 1–4. Global Serializable is rarely wrong on correctness and often wrong on economics; scoped Serializable is the adult compromise.

And the meta-discipline that makes any of it stick: **concurrency review as a code-review lens** — every check-then-act sequence flagged, every read-modify-write challenged, every "can two of these run at once?" asked explicitly — plus load tests that actually run contended scenarios (the retry storms and race windows from load-testing practice), because the defining property of isolation bugs is that they *pass every sequential test you write*. The database kept its promises; they were just weaker promises than anyone remembered agreeing to. Read the contract, match the tool to the invariant, and the concurrency weather stays boring — which, as ever, is the goal.
