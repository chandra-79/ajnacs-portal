---
title: "Distributed Locks and Leader Election: Coordination Without Lying to Yourself"
description: "The 'only one of us should do this' problem shows up in every distributed system — and most solutions quietly don't work under the failures they exist for. Fencing tokens, lease semantics, the Redlock debate's lesson, and when to redesign instead of lock."
date: 2024-11-19
tags: ["Distributed Systems", "Programming", "Reliability", "Architecture", "Containers"]
format: article
---

Sooner or later every distributed system grows a sentence like "only one instance should run the billing job" — and with it, a distributed lock. It's the most innocent-looking requirement in the field, and it sits on top of one of its deepest holes: **in a system with independent failures and unbounded delays, "exactly one node is doing X right now" is not a fact any node can know for certain.** Locks held over networks can only be *leases* — time-bounded claims — and every correct design flows from taking that seriously. Most incorrect designs flow from pretending otherwise.

## Why the naive lock is a time bomb

The standard construction: acquire a lock (a Redis key with TTL, a database row, a ZooKeeper node), do the work, release. The TTL exists because holders crash — without expiry, a dead holder blocks everyone forever. But the TTL creates the defining failure mode: **the paused holder.** Node A acquires the lock (TTL 30s), then hits a long GC pause / VM migration / network partition; the lease expires; node B legitimately acquires; node A *resumes, still believing it holds the lock*, and both write. Nothing was misconfigured — this is the mechanism working as designed, and it means a lease alone cannot protect a resource. Any design whose safety story is "the TTL is probably long enough" is a probability, not a mutex.

The correct fix is the one worth internalizing from the classic Kleppmann/Redlock exchange: **fencing tokens.** The lock service issues a monotonically increasing number with each acquisition; the *protected resource* records the highest token it has seen and rejects operations bearing older ones. Now the resumed zombie's writes — carrying token 33 against a resource that has seen 34 — bounce. The profound implication hiding in that design: fencing requires the *resource* to participate in the protocol. If the thing you're protecting can check tokens (a database with a conditional update, storage with generation numbers), you can be safe; if it can't (a third-party API call, an email send), **no distributed lock of any sophistication makes the operation safe** — you need idempotency at the effect, which was the honest answer all along.

That exchange's broader lesson also settled the tooling hierarchy: locks built on a single Redis with TTL are *efficiency* locks — fine for "let's mostly avoid duplicate work" (cache stampede suppression, best-effort dedup), wrong for correctness. Correctness-grade coordination wants a **consensus-backed store** — etcd, ZooKeeper, or their cloud equivalents — where lease grant/expiry itself is linearizable, plus fencing at the resource. (Redlock, the multi-node Redis variant, occupies an uncomfortable middle that the debate left few reasons to choose.)

## Leader election: the same problem in a longer coat

Leader election is the continuous version — one node holds a lease and does the singleton work (scheduling, coordination, primary duties), renewing perpetually; on its failure the lease lapses and another candidate claims it. Everything above transfers: the deposed leader who doesn't know it yet is the central hazard, so real systems combine **lease-based election** (etcd/ZooKeeper primitives, or Kubernetes' own Lease-object machinery, which gives every operator and controller its election for free) with **fenced or idempotent actions** (the Kubernetes control plane's own pattern: controllers act through versioned, conditional API writes — a stale leader's mutations fail on resourceVersion conflicts, which is fencing by another name).

Design rules that keep elections boring: **renewal margin** — renew at a fraction of lease duration (a third is customary), and *step down deliberately* if renewal fails before the lease actually lapses (better a brief leaderless gap than a split-brain second); **fast follower readiness** — the standby that takes 10 minutes to warm up converts failover into an outage, so leaders should continuously replicate whatever state a successor needs; **observable leadership** — a metric for "who leads, since when, renewals failing?" because silent election flapping (leadership bouncing every few seconds under load) is a classic slow-burn incident; and **do less as leader** — the leader should *coordinate* work, not *perform* it all, or the singleton becomes the throughput ceiling and the failure domain in one.

## The redesign option (usually the right one)

The most effective distributed-locking technique is making the requirement disappear, and the catalog is richer than teams remember under deadline:

**Partition instead of lock.** "Only one worker per customer" doesn't need a lock service — consistent-hash the customers across workers (or use a partitioned log: Kafka's consumer groups *are* a leader-election-per-partition service you already run). Contention becomes routing.

**Let the database be the arbiter.** Single-database systems reaching for Redis locks to serialize their own writes have forgotten what transactions are: unique constraints, `SELECT ... FOR UPDATE SKIP LOCKED` (the job-queue workhorse — N workers pulling from one table, each row claimed exactly once, no coordinator anywhere), and conditional updates cover the great majority of "distributed" locking needs at zero additional infrastructure.

**Make duplicates harmless instead of impossible.** The idempotency discipline again: if two schedulers both fire the billing job but the job's effects are keyed and deduplicated, the race is a non-event. Systems that combine *probabilistic* singleton-ness (a simple lease, usually working) with *guaranteed* idempotency (always working) get practical exactly-once behavior with no heroics — this is the quiet architecture of most mature job systems.

**Or accept brief multiplicity.** Some work is merely wasteful duplicated, not harmful — two nodes refreshing the same cache is a shrug. Spending consensus-grade machinery to prevent shrugs is engineering pride, not engineering.

## The checklist

When the requirement survives redesign scrutiny: use a consensus-backed lease (etcd/ZooKeeper/K8s Lease/cloud equivalent), never a bare TTL key, for anything correctness-critical; fence at every resource that can check a token, and be honest that resources which can't are protected by idempotency or not at all; renew early, step down on renewal failure, alarm on flapping; size lease durations against your *actual* pause distribution (GC logs and live-migration behavior, not optimism); and test the ugly path deliberately — pause a leader mid-work (SIGSTOP is free chaos engineering) and verify the system converges without a double-write. Coordination code is exercised most under precisely the conditions that are rarest in development, which is why the untested lock always works until the incident that reveals it never did.

The through-line, one more time, because it's the field's most repeated lesson in miniature: distributed systems don't offer certainty about remote state — they offer leases, versions, and idempotency, and correct designs are built from those honest materials. "Only one of us should do this" is achievable; it's just never achieved by a lock alone.
