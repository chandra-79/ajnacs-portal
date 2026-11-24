---
title: "Distributed Locks and Leader Election: Coordination Without Lying to Yourself"
description: "Test lease expiry and paused workers, distinguish election from fencing, and enforce ownership at the resource that accepts each effect."
date: 2027-05-05
tags: ["Distributed Systems", "Programming", "Reliability", "Architecture", "Containers"]
format: article
---

Sooner or later every distributed system grows a sentence like "only one instance should run the billing job" — and with it, a distributed lock. It's the most innocent-looking requirement in the field, and it sits on top of one of its deepest holes: **in a system with independent failures and unbounded delays, "exactly one node is doing X right now" is not a fact any node can know for certain.** Remote lock designs may use sessions, transactions or leases; failure recovery and ownership validity must be specified — and every correct design flows from taking that seriously. Most incorrect designs flow from pretending otherwise.

## Why the naive lock is a time bomb

The standard construction: acquire a lock (a Redis key with TTL, a database row, a ZooKeeper node), do the work, release. The TTL exists because holders crash — without expiry, a dead holder blocks everyone forever. But the TTL creates the defining failure mode: **the paused holder.** Node A acquires the lock (TTL 30s), then hits a long GC pause / VM migration / network partition; the lease expires; node B legitimately acquires; node A *resumes, still believing it holds the lock*, and both write. Nothing was misconfigured — this is the mechanism working as designed, and it means a lease alone cannot protect a resource. Any design whose safety story is "the TTL is probably long enough" is a probability, not a mutex.

The correct fix is the one worth internalizing from the classic Kleppmann/Redlock exchange: **fencing tokens.** The lock service issues a monotonically increasing number with each acquisition; the *protected resource* records the highest token it has seen and rejects operations bearing older ones. Now the resumed zombie's writes — carrying token 33 against a resource that has seen 34 — bounce. The profound implication hiding in that design: fencing requires the *resource* to participate in the protocol. If the thing you're protecting can check tokens (a database with a conditional update, storage with generation numbers), you can be safe; if it can't (a third-party API call, an email send), **a lock alone does not make an external ambiguous side effect exactly once** — you need idempotency at the effect, which was the honest answer all along.

The practical design distinction is the failure model and protected invariant: locks built on a single Redis with TTL are *efficiency* locks — fine for "let's mostly avoid duplicate work" (cache stampede suppression, best-effort dedup), wrong for correctness. Correctness-grade coordination wants a **consensus-backed store** — etcd, ZooKeeper, or their cloud equivalents — where lease grant/expiry itself is linearizable, plus fencing at the resource. Evaluate any proposed lock against its published timing assumptions and the resource-side safety mechanism.

## Leader election: the same problem in a longer coat

Leader election is the continuous version — one node holds a lease and does the singleton work (scheduling, coordination, primary duties), renewing perpetually; on its failure the lease lapses and another candidate claims it. Everything above transfers: the deposed leader who doesn't know it yet is the central hazard, so real systems combine **lease-based election** (etcd/ZooKeeper primitives, or Kubernetes' own Lease-object machinery, which provides election machinery but does not itself guarantee fencing) with **fenced or idempotent actions** (conditional API updates can detect conflicting object versions, but resourceVersion alone is not a leadership-generation fence for every effect).

Design rules that keep elections boring: **renewal margin** — renew at a fraction of lease duration (a third is customary), and *step down deliberately* if renewal fails before the lease actually lapses (better a brief leaderless gap than a split-brain second); **fast follower readiness** — the standby that takes 10 minutes to warm up converts failover into an outage, so leaders should continuously replicate whatever state a successor needs; **observable leadership** — a metric for "who leads, since when, renewals failing?" because silent election flapping (leadership bouncing every few seconds under load) is a classic slow-burn incident; and **do less as leader** — the leader should *coordinate* work, not *perform* it all, or the singleton becomes the throughput ceiling and the failure domain in one.

## The redesign option (usually the right one)

The most effective distributed-locking technique is making the requirement disappear, and the catalog is richer than teams remember under deadline:

**Partition instead of lock.** "Only one worker per customer" doesn't need a lock service — use an ownership protocol to assign customer partitions across workers (or use a partitioned log: Kafka's consumer groups *are* a leader-election-per-partition service you already run). Routing reduces contention, but reassignment and paused old owners still require safe handover.

**Let the database be the arbiter.** Single-database systems reaching for Redis locks to serialize their own writes have forgotten what transactions are: unique constraints, `SELECT ... FOR UPDATE SKIP LOCKED` (the job-queue workhorse — N workers pulling from one table, rows locked transactionally while claimed; crash recovery can still cause a job to run again), and conditional updates cover the great majority of "distributed" locking needs at zero additional infrastructure.

**Make duplicates harmless instead of impossible.** The idempotency discipline again: if two schedulers both fire the billing job but the job's effects are keyed and deduplicated, the race is a non-event. Systems that combine *probabilistic* singleton-ness (a simple lease, usually working) with idempotency enforced within a documented persistence and retention boundary get practical exactly-once behavior with no heroics — this is a useful architecture when the effect boundary supports it.

**Or accept brief multiplicity.** Some work is merely wasteful duplicated, not harmful — two nodes refreshing the same cache is a shrug. Spending consensus-grade machinery to prevent shrugs is engineering pride, not engineering.

## The checklist

When the requirement survives redesign scrutiny: choose coordination with documented consistency guarantees and enforce the business invariant at the destination; a Kubernetes Lease alone does not fence effects; fence at every resource that can check a token, and be honest that resources which can't are protected by idempotency or not at all; renew early, step down on renewal failure, alarm on flapping; size lease durations against your *actual* pause distribution (GC logs and live-migration behavior, not optimism); and test the ugly path deliberately — pause a leader mid-work (SIGSTOP is free chaos engineering) and verify the system converges without a double-write. Coordination code is exercised most under precisely the conditions that are rarest in development, which is why the untested lock always works until the incident that reveals it never did.

The through-line, one more time, because it's the field's most repeated lesson in miniature: distributed systems don't offer certainty about remote state — they offer leases, versions, and idempotency, and correct designs are built from those honest materials. "Only one of us should do this" is achievable; it's just never achieved by a lock alone.

## Worked failure: ownership expires while the worker is paused

Use a hypothetical job that updates a shared report. Worker A acquires ownership generation 41 at elapsed time zero with a 30-second lease. It pauses at second 10 and resumes at second 45. In the meantime, the lease expires and worker B obtains generation 42 at second 31. B writes the new report at second 35. Without a storage-side ownership check, A can overwrite B's result when it resumes. Extending the lease merely changes which pause duration exposes the problem.

The figure shows the four relevant elapsed times: lease expiry at 30 seconds, successor acquisition at 31, successor write at 35 and stale-worker resume at 45. These are invented times used to explain event order, not a measured failover distribution. There is a 14-second interval between the new acquisition and A's resumption. The safety requirement is that A's subsequent mutation is rejected even though A has not yet processed any notification that it lost leadership.

A storage-side check can compare the submitted generation with the resource's current ownership generation. After generation 42 is installed, a write carrying 41 must fail atomically with respect to the mutation. Checking the generation in one request and writing in a later unconditional request leaves a race. If the destination simply remembers the highest token it has seen, it fences an older token after observing the newer one; a design that needs the old owner rejected immediately at acquisition must arrange that ownership transition at the destination before new work begins. State precisely which property the protocol provides.

A generation is also not the same as an operation identifier. Generation 42 might legitimately perform several updates, while retrying one update must not apply it twice. Use a monotonically ordered ownership epoch for fencing and a stable business-operation key for deduplication where necessary. Rejecting every repeated generation would incorrectly reject a leader's second valid operation; accepting every repeated operation would permit duplicates. The resource's transaction needs to distinguish both fields.

## Build the resource contract before choosing a lock library

For a relational database, write the intended invariant and identify the transaction that enforces it. A uniqueness constraint can prevent two rows representing the same billing run. A conditional update can refuse an obsolete version. A row lock can serialize transactions while the database connection and transaction remain valid. These mechanisms can be simpler than coordinating the database through an additional remote lock service.

A transactional job claim using SKIP LOCKED lets concurrent workers avoid waiting on rows already locked by another transaction. It does not guarantee exactly-once job execution. A worker can perform an external effect and crash before recording completion, after which the job may be retried. Holding a database transaction open during a slow network call also retains resources and can obstruct maintenance. Choose a claim, heartbeat and retry protocol with explicit crash recovery; keep external side effects idempotent or reconcile them using the provider's operation identifier.

For an object store, inspect its conditional-write and generation semantics rather than assuming that the word version means fencing. For an external API, identify whether it supports an idempotency key, how long that key is retained, and whether parameters must match on retry. If neither conditional ownership nor deduplication is supported, a coordinator can reduce duplicate attempts but cannot by itself make an ambiguous remote outcome disappear. The business process may need an unknown state and a reconciliation queue.

## A pause-and-resume lab

Use a disposable environment with a fake side-effect endpoint that records every attempted operation, ownership generation and acceptance decision. Start two workers and make the pause deterministic immediately after A has acquired ownership but before its write. Allow B to acquire the next generation and install it at the destination. Resume A and assert that the destination rejects its stale mutation. An assertion about which worker currently thinks it leads is insufficient: the evidence must come from the protected resource.

Repeat the experiment with the response to B's successful write dropped. B should retry the same operation identifier, and the resource should return the prior result or make an equivalent safe decision. Then restart the destination and ensure its fencing and deduplication state survives according to the documented durability policy. An in-memory high-water mark that disappears on restart can re-admit a stale owner even when the coordinator behaved correctly.

Test lock release as well. A delayed unlock from A must not delete B's ownership record. Many implementations prevent this using an ownership value and an atomic compare-and-delete operation. Exercise failure to renew, failure to release, coordinator unavailability, worker termination and a destination timeout separately. They are different transitions and should not all collapse into a single catch block that retries everything.

## Leader election is an input to safety, not its proof

The Kubernetes client-go leader-election documentation explicitly says that its implementation does not guarantee fencing. A Lease object helps contenders coordinate leadership, but arbitrary downstream effects are not automatically protected by the API server. A resourceVersion conflict protects a particular conditional object update; it does not prove that only the current elected leader can make every mutation or external call. Controllers still need reconciliation semantics, version checks and appropriate idempotency.

Similarly, etcd's lock API can return an ownership key that guards transactions within etcd. When the protected resource is outside etcd, the protocol must bridge that boundary safely. Reading the key and then performing an unrelated mutation is not one atomic operation. This is the central design question to put in the worksheet: where is the ownership check made indivisible from the effect?

Record lease duration, renewal deadline, retry period, expected pause behavior, successor readiness, and the action taken on uncertain ownership. Use observed latency and pause distributions to choose operational values, while retaining fencing for pauses outside those expectations. Monitor leadership changes, renewal failures, rejected stale writes, duplicate-operation attempts and time without a usable leader. A healthy election count alone can miss a broken side-effect boundary.

The final acceptance exercise is a review of every effect reachable from the leader's code path. For each, identify its invariant, atomic guard, retry key, persistence and recovery owner. If one effect cannot meet the same guarantee as the others, expose that limitation in the workflow rather than describing the whole job as exactly once. This makes the coordination design testable at the point where a duplicate or stale action would actually matter.

### Figure methodology

Synthetic timeline: a 30-second lease begins at t=0; a successor acquires at t=31 and writes at t=35; the paused old worker resumes at t=45. Bars show event timestamps, not durations or benchmark results. Storage-side fencing must reject the old generation.

| Worked observation | seconds since acquisition |
| --- | ---: |
| Lease expiry | 30 |
| New owner acquired | 31 |
| New owner writes | 35 |
| Old owner resumes | 45 |

## Primary references and further study

- [etcd: lock and election API ownership](https://etcd.io/docs/v3.6/dev-guide/api_concurrency_reference_v3/)
- [Kubernetes client-go: leader-election limitations](https://pkg.go.dev/k8s.io/client-go/tools/leaderelection)
- [PostgreSQL: SELECT locking and SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html)
- [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests)
