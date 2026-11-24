---
title: "Transaction Isolation Levels: The Concurrency Bugs You Signed Up For Without Reading"
description: "Compare transaction anomalies and isolation guarantees, reproduce a write-skew scenario, and enforce business invariants at the database boundary."
date: 2028-03-01
tags: ["Data Engineering", "Programming", "Distributed Systems", "Reliability"]
format: article
---

Here is the quiet contract most applications run on without anyone having read it: your database's default isolation level permits concurrency anomalies that can corrupt business invariants, the anomalies appear only under concurrent load (potentially missed by sequential tests), and the vendors chose those defaults because stronger guarantees cost throughput. "We use transactions" is where most engineers' confidence ends — and it's roughly as informative as "we use locks." Transactions provide atomicity for their covered database operations; durability depends on the configured acknowledgment and storage guarantees; what they guarantee about *concurrent* transactions seeing each other's work is the isolation level, it's configurable, and the differences have eaten real money.

## The anomaly zoo, from famous to underrated

**Dirty reads** (seeing uncommitted data that may roll back) are blocked by essentially every sane default — historical interest only. The action starts above them:

**Non-repeatable reads and phantoms:** within one transaction, re-reading data returns different results because a concurrent commit landed in between. The report that sums a column twice and gets two answers; the check-then-act that validated a condition which stopped being true before the act. **Read Committed** permits nonrepeatable and phantom reads across statements. PostgreSQL and Oracle provide statement snapshots for ordinary reads; SQL Server uses locking reads when `READ_COMMITTED_SNAPSHOT` is off and statement-level row versions when it is on. Do not assume that an isolation-level name implies the same snapshot implementation across engines.

**Lost updates:** two transactions read the same row, compute, and write back — the second write silently overwrites the first's contribution. The classic counter/balance bug, permitted at Read Committed, and the reason `UPDATE ... SET balance = balance + ?` (atomic, in-place arithmetic) beats read-modify-write in application code — a concurrency-safe relative update for this row. Replaying that statement still applies the increment again, so request idempotency is a separate concern.

**Write skew** — the underrated one, and the reason "we use snapshots, we're fine" is false confidence. Two transactions each read a *consistent snapshot*, each check an invariant ("at least one doctor must remain on call"), each modify a *different* row, and each commit successfully — jointly violating the invariant no single transaction broke (both doctors went off call, each having verified the *other* was still on). Snapshot isolation — what PostgreSQL's Repeatable Read and Oracle's Serializable actually provide — prevents everything above *except this*: invariants spanning multiple rows, enforced by check-then-write logic, are exactly where snapshots don't protect you. Some cross-row invariant failures in a snapshot-isolated system have this shape: double-booked resources, over-issued vouchers, duplicate usernames pre-constraint, budget lines that jointly exceed the cap.

## What the levels actually mean (and the vendor asterisks)

The SQL-standard ladder — Read Uncommitted, Read Committed, Repeatable Read, Serializable — describes anomalies, not implementations, and the implementations are where engineers get surprised: **PostgreSQL's Repeatable Read is snapshot isolation** (stronger than the standard's requirement — no phantoms — but write-skew-permitting), and its **Serializable is the real thing** (SSI — serializable snapshot isolation: monitoring read/write dependencies while retaining ordinary database locking and aborting one participant with a serialization error — meaning *your application must retry*, which is the operational contract most teams miss: enabling Serializable without retry loops converts subtle corruption into user-facing errors). **MySQL/InnoDB defaults to Repeatable Read** with its own flavor (gap locks, and read patterns that can still admit surprises under mixed workloads). **Oracle tops out at snapshot** (its "Serializable" is snapshot isolation — write skew included) — the asterisk that has surprised a generation of migrating teams. The portable truth: *read your engine's documentation for the level you run, and trust the anomaly definitions over the level names.*

Distributed and replicated systems add their own axis: read replicas serve *stale* snapshots (read-your-own-writes is a routing discipline, not a given), and the NewSQL/Spanner-class systems that advertise external consistency are selling exactly this problem's absence — at the latency cost the multi-region physics demands. Transaction isolation and replica consistency are related but distinct contracts; serializable execution alone does not establish the real-time freshness of a separately routed replica read.

## The practical toolkit, in order of preference

Real systems mix techniques per operation rather than globally cranking the dial:

**1. Make the database enforce the invariant declaratively.** Unique constraints, foreign keys, check constraints — enforced according to their documented semantics; the constraint must actually express the intended invariant. The two-usernames race dies at a unique index, not at Serializable. Always the first question: *can this invariant be a constraint?*

**2. Make contended updates atomic in SQL.** In-place arithmetic, conditional updates (`WHERE status = 'pending'` — the zero-rows-affected answer *is* the concurrency signal), and upserts. This can prevent a lost update in the covered operation, while the database still uses locks and callers may need to handle contention or retries.

**3. Lock what you check.** `SELECT ... FOR UPDATE` on the rows a decision depends on converts check-then-act into a serialized critical section — the right tool for the doctor-on-call shape when the checked rows are few and known. (Its cousin `SKIP LOCKED` builds the job-queue pattern from coordination practice.) Costs: held locks under load, and deadlock handling as a fact of life (deadlocks are the database *detecting* your lock-order inconsistency — retry them, and standardize acquisition order).

**4. Optimistic concurrency for read-mostly contention.** A version column checked at write (`WHERE version = ?`) — a lost-update guard that avoids holding a read lock throughout application think time, although the conditional write still acquires the engine's normal write locks and may require application-level retry. This is also a useful technique across HTTP boundaries (the ETag/If-Match pattern — API-layer optimistic concurrency), where database locks can't reach.

**5. Serializable, with a complete participation boundary.** For invariants that depend on several reads and writes, identify *all* transactions that can affect the rule. In PostgreSQL, relying on Serializable requires participating readers and writers to use that level; leaving a competing writer at Read Committed can defeat the intended protection. Alternatively, enforce a constraint or locking protocol shared by every relevant writer. Per-transaction configuration is useful only after this boundary is understood. Measure contention and retry costs, and retry the whole failed decision.

And the meta-discipline that makes any of it stick: **concurrency review as a code-review lens** — every check-then-act sequence flagged, every read-modify-write challenged, every "can two of these run at once?" asked explicitly — plus load tests that actually run contended scenarios (the retry storms and race windows from load-testing practice), because the defining property of isolation bugs is that they *pass every sequential test you write*. The database kept its promises; they were just weaker promises than anyone remembered agreeing to. Read the contract, match the tool to the invariant, and the concurrency weather stays boring — which, as ever, is the goal.

## Reproduce an invariant violation with two sessions

Use an isolated PostgreSQL test database and a fictional duty roster with two rows, one for Ada and one for Ben. Each row initially says on_call = true. The business invariant is that at least one person remains on call. The names and setting are a concurrency exercise, not an operational scheduling recommendation.

In session A, begin a repeatable-read transaction and count the on-call rows. In session B, begin the same kind of transaction and count them before A commits. Both observe two. A updates Ada's row to false; B updates Ben's row to false. Because they modify different rows and each decision used a snapshot in which the other person remained on call, both can commit under this pattern. The final count is zero. A correct individual read did not make the combined business decision safe.

Now restore both rows and repeat the interleaving using serializable transactions for both sessions. PostgreSQL must prevent the incompatible committed result; one transaction may fail with a serialization error. Retry the entire failed transaction from a fresh snapshot. It now observes one on-call person and should refuse to remove the last one. The figure contrasts the final invariant count for this carefully controlled schedule, not the frequency of an anomaly in production.

The test is useful because the execution order is explicit. A load test that happens not to reproduce the race is weak evidence. Introduce barriers after the reads so both sessions reach the decision point before either changes a row. Preserve the sequence and expected outcome as a regression test. If the application changes its query shape or isolation configuration, rerun the same schedule.

## Build the retry boundary around the whole decision

A serialization failure means the transaction's read-dependent work must be reconsidered. Retrying only the final UPDATE preserves a decision made from an invalidated view. The retry wrapper should start a new transaction, repeat the reads, re-evaluate the rule and perform the writes again. Bound attempts and time so sustained contention cannot create an unbounded retry storm.

Separate database work from external effects. An email or payment API call performed before commit cannot be rolled back by the database. If a transaction is retried, that effect may happen more than once. Use an outbox, an idempotent external operation or another deliberate coordination mechanism so a fresh database attempt does not accidentally repeat a business action.

Record retry counts and the final outcome, while avoiding sensitive parameters in logs. A rise in retries can indicate a hot key, long transactions or an overly broad read set. It is an operational signal, not proof that serializable isolation is defective. Investigate whether the data model can express the invariant more directly or whether work can be partitioned without weakening the rule.

## Choose a constraint that matches the invariant

A unique constraint is appropriate for a uniqueness rule over its declared key. A row-level check can validate a relationship among values in that row. Neither automatically enforces an arbitrary cross-row rule such as a minimum roster count. Writing a function inside a check does not safely turn a row constraint into a general concurrent database-wide assertion.

For a reservation, a conditional update can combine checking and changing one known row: update the available quantity only when enough remains, then inspect the affected-row count. That avoids an application read followed by an unconditional overwrite. It still acquires database locks as required, and it can encounter contention or deadlocks. The advantage is a clearer atomic operation, not an absence of coordination cost.

For an invariant involving several known rows, acquiring locks in a consistent order may serialize the relevant decision. Ensure the protected set includes everything whose change would invalidate the decision. Locking existing rows does not necessarily protect the absence of a row or a future matching insert in every isolation mode. Test the actual query and engine behavior rather than treating FOR UPDATE as a universal race-prevention keyword.

## Keep isolation separate from freshness and durability

Isolation describes interactions among concurrent transactions. A read from an asynchronously updated replica can be transactionally consistent within that replica while still missing a recently committed primary write. Decide where a read requiring read-your-writes must go and how the application establishes the necessary freshness. Changing a transaction isolation level on a stale replica does not make replication instantaneous.

Durability also depends on the storage and acknowledgment configuration. Relaxed synchronization or asynchronous replication can change which acknowledged work survives a failure. State those settings in the reliability model rather than assuming that the word transaction establishes every recovery guarantee. Likewise, application validation and authorization remain necessary even when database constraints protect structural invariants.

When comparing engines, specify the actual guarantee and the tested anomaly, not just an isolation-level name. Defaults and implementations differ. This example is deliberately scoped to PostgreSQL's documented repeatable-read and serializable behavior; it is not a promise that another product with the same labels has identical locking or retry semantics.

## A review worksheet for a real operation

Write one sentence describing the invariant. List the rows and predicates read to make the decision, the rows changed, the isolation mode and any declarative constraints. Mark every external effect and every route through which the same data can be modified. A safe path in one service is insufficient if a batch job bypasses the protection.

Then define two concurrent requests that compete for the same invariant. Record a deterministic interleaving, expected committed result and allowed retry or rejection outcome. Add a failure after the database commit but before the caller receives the response; the caller may retry even though the first attempt succeeded. Use a stable request identity where the business operation must not be repeated.

Finally, review the recovery behavior with the service objective. A bounded retry can be acceptable for an interactive request, while a long-running workflow may need durable resumption. The design is complete when it specifies what the caller sees, how operators identify unresolved work and how the invariant remains true under duplicate requests, contention and partial failure.

### Figure methodology

Synthetic two-session schedule with two initially active rows. Both snapshot transactions read before either commits and update different rows. Under serializable execution with complete transaction retry and the stated business rule, at least one row remains active. Counts are an illustrative trace, not measured anomaly rates.

| Worked observation | on-call rows |
| --- | ---: |
| Initial roster | 2 |
| Snapshot race | 0 |
| Serializable retry | 1 |

## Primary references and further study

- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [SQL Server: isolation and READ_COMMITTED_SNAPSHOT](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17)
- [Transactional outbox for external effects](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
