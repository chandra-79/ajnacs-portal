---
title: "Zero-Downtime Database Migrations: The Expand/Contract Discipline"
description: "Application deploys got fast and reversible; schema changes stayed dangerous. The expand/contract pattern in detail — backwards-compatible steps, backfills that don't melt production, lock-safety in Postgres/MySQL, and the pipeline gates that enforce it."
date: 2028-03-13
tags: ["Data Engineering", "Deployment", "Platform Engineering", "Programming", "Reliability"]
format: article
---

Modern delivery practice made application code cheap to ship and cheap to revert — and left the database as the place where deployments still go to get scary. The reason is structural: code deploys are *replaceable* (old and new versions can coexist, traffic can shift, rollback is a redeploy), but a schema change mutates *shared, stateful* infrastructure that every running version depends on simultaneously. The `ALTER TABLE` that ships with the code that needs it is a distributed-systems bug disguised as a convenience: for the duration of any rolling deploy, old code runs against new schema (or new code against old), and one of those combinations wasn't tested.

The discipline that fixes this is **expand/contract** (also parallel change), and it's less a trick than a way of life: every schema change is decomposed into steps that are each individually backwards-compatible, deployed separately from the code that exploits them.

## The pattern, step by step

Take the canonical hard case — renaming a column (worse: changing its type and semantics). The naive version is one migration and one deploy and one outage. The expand/contract version:

**1. Expand:** add the new column (nullable or defaulted — additive changes are compatible with all running code, which simply ignores them). Deploy: schema-only, no code change, zero behavioral risk.

**2. Dual-write:** ship code that writes *both* columns but still reads the old one. Any running mix of this version and the previous one is safe: old code writes old column (new column tolerates absence), new code writes both.

**3. Backfill:** migrate historical rows from old to new column — as a *background job*, not a migration statement (more below). Verify convergence: counts, checksums, sampled comparisons. This step has no deploy at all.

**4. Read switch:** ship code that reads the new column (still dual-writing). This is the moment of truth and it's *individually revertible* — if the new column's data is wrong, revert the deploy; the old column is still authoritative-capable because writes never stopped.

**5. Contract:** stop writing the old column; later — after a deliberate grace period measured in rollback horizons, not sprints — drop it. The drop is the step teams skip forever, which is how tables accrete ghost columns; put contraction tickets in the backlog *at expand time* with dates.

Five deploys where there was one. That's not overhead — that's the actual complexity of the change, made visible and made *safe at every intermediate state*, which is the same trade sagas make with transactions and trunk-based development makes with integration. Every step can pause, every step can revert, and no step requires the world to stop.

The same decomposition handles the whole catalog: new NOT NULL constraint (add nullable → backfill → validate-only constraint), splitting a table (create → dual-write → backfill → read-switch → contract), changing a type (new column of new type, same dance), extracting a service's data (dual-write across systems, with the outbox pattern carrying the second write).

## Backfills: the step that melts production

The backfill is where zero-downtime migrations acquire their operational scar tissue, because "UPDATE all 400 million rows" is a lock festival and a replication-lag bomb in one statement. The rules: **batch small** (thousands of rows per transaction, not millions), **throttle adaptively** (watch replication lag and lock waits between batches; back off when the database says so), **make it resumable and idempotent** (it *will* be interrupted; progress checkpoints, deterministic ordering), and **run it as a supervised job** with metrics — rows/sec, lag induced, ETA — because a backfill without observability is a slow-motion incident you can't see coming. For very large tables, the mature ecosystems have purpose-built machinery: online schema-change tools (gh-ost/pt-osc-class for MySQL, whose shadow-table-plus-triggers/binlog approach sidesteps long locks entirely) — know when you've crossed the size threshold where they're the answer.

Lock-safety knowledge is table stakes per engine. Postgres: most `ADD COLUMN` is instant, but beware `NOT NULL` on existing columns (use `ADD CONSTRAINT ... NOT VALID` then `VALIDATE` separately), index creation must be `CONCURRENTLY` (and can't run in a transaction — migration tooling must know this), and *every* DDL takes a brief exclusive lock that will queue behind — and then block — long-running queries, so set `lock_timeout` and retry rather than letting a stuck ALTER dam the whole connection pool. MySQL: know which ALTERs are truly in-place vs table-rebuilds per version, and reach for the online tools earlier. These specifics change with engine versions; the *practice* that doesn't change is testing migrations against production-sized data before production meets them — a staging environment with 10k rows validates syntax, not safety.

## The pipeline: making the discipline enforceable

Human discipline decays; gates don't. The estates that keep this working encode it: **migrations deploy separately from code** (ordering enforced: expand-migrations land before the code that assumes them — the deployment pipeline should refuse a release whose code references schema not yet live); **migration linting in CI** (tools exist for the major engines that flag unsafe operations — non-concurrent index builds, NOT NULLs without defaults, type changes on large tables — turning tribal lock-safety knowledge into merge-blocking feedback); **a "compatible with N-1" review question on every schema PR** — can the *previous* release run against this schema? if not, it's not one change, it's an expand/contract sequence that hasn't been decomposed yet; and **runbooks only for the exceptions** — the rare genuinely-breaking change (an emergency security fix that must drop something now) should be a named, ceremonied event precisely because everything else stopped being one.

Two honest costs to acknowledge in the adoption conversation. Expand/contract multiplies small deploys and stretches changes across days — teams accustomed to "one PR, done" feel the friction acutely until the first time step 4 gets reverted harmlessly and they see what the friction bought. And dual-write windows create their own bug class (drift between the columns when one write path fails) — mitigate with write-path monitoring and the convergence checks, and keep windows short. The pattern's overhead is real; it's just smaller than the outage budget it replaces.

The strategic point mirrors every other discipline in this series: the database was never actually exempt from continuous delivery — it was just the place where the industry kept accepting risk it had engineered away everywhere else. Expand/contract, batched backfills, lock-aware tooling, and pipeline gates extend the same principles — small reversible steps, compatibility across versions, automation over heroism — to the layer where mistakes are least forgiving. Once it's routine, the last scary deploy artifact in the estate becomes just another sequence of boring ones, and boring, as ever, is the goal.
