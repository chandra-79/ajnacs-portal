---
title: "Zero-Downtime Database Migrations: The Expand/Contract Discipline"
description: "Rehearse expand-contract migrations with bounded backfills, lock checks, compatible application versions and an explicit recovery boundary."
date: 2028-03-13
tags: ["Data Engineering", "Deployment", "Platform Engineering", "Programming", "Reliability"]
format: article
---

Modern delivery practice made application code cheap to ship and cheap to revert — and left the database as the place where deployments still go to get scary. The reason is structural: code deploys are *replaceable* (old and new versions can coexist, traffic can shift, rollback is a redeploy), but a schema change mutates *shared, stateful* infrastructure that every running version depends on simultaneously. The `ALTER TABLE` that ships with the code that needs it is a distributed-systems bug disguised as a convenience: for the duration of any rolling deploy, old code runs against new schema (or new code against old), and one of those combinations wasn't tested.

The discipline that fixes this is **expand/contract** (also parallel change), and it's less a trick than a way of life: every schema change is decomposed into steps that are each individually backwards-compatible, deployed separately from the code that exploits them.

## The pattern, step by step

Take the canonical hard case — renaming a column (worse: changing its type and semantics). The naive version is one migration and one deploy and one outage. The expand/contract version:

**1. Expand:** add the new column (nullable or defaulted — check that every running reader and writer tolerates the additive shape). Deploy: schema-only, no code change, with compatibility and lock behavior verified.

**2. Dual-write:** ship code that writes *both* columns but still reads the old one. Any running mix of this version and the previous one is safe: old code writes old column (new column tolerates absence), new code writes both.

**3. Backfill:** migrate historical rows from old to new column — as a *background job*, not a migration statement (more below). Verify convergence: counts, checksums, sampled comparisons. This step has no deploy at all.

**4. Read switch:** ship code that reads the new column (still dual-writing). This is the moment of truth and it's *individually revertible* — if the new column's data is wrong, revert the deploy; the old column is still authoritative-capable because writes never stopped.

**5. Contract:** stop writing the old column; later — after a deliberate grace period measured in rollback horizons, not sprints — drop it. The drop is the step teams skip forever, which is how tables accrete ghost columns; put contraction tickets in the backlog *at expand time* with dates.

Five deploys where there was one. That's not overhead — that's the actual complexity of the change, made visible and made *reviewable at every intermediate state*, which is the same trade sagas make with transactions and trunk-based development makes with integration. Design pause points explicitly; some steps, especially contraction, require a forward repair or restore rather than a simple application rollback.

The same decomposition handles the whole catalog: new NOT NULL constraint (add nullable → backfill → validate-only constraint), splitting a table (create → dual-write → backfill → read-switch → contract), changing a type (new column of new type, same dance), extracting a service's data (dual-write across systems, with the outbox pattern carrying the second write).

## Backfills: the step that melts production

The backfill is where zero-downtime migrations acquire their operational scar tissue, because "UPDATE all 400 million rows" is a lock festival and a replication-lag bomb in one statement. The rules: **batch small** (thousands of rows per transaction, not millions), **throttle adaptively** (watch replication lag and lock waits between batches; back off when the database says so), **make it resumable and idempotent** (it *will* be interrupted; progress checkpoints, deterministic ordering), and **run it as a supervised job** with metrics — rows/sec, lag induced, ETA — because a backfill without observability is a slow-motion incident you can't see coming. For very large tables, the mature ecosystems have purpose-built machinery: online schema-change tools (gh-ost/pt-osc-class for MySQL, whose shadow-table-plus-triggers/binlog approach reduces some long blocking operations but still requires cutover coordination and engine-specific checks) — know when you've crossed the size threshold where they're the answer.

Lock-safety knowledge is table stakes per engine. Postgres: some `ADD COLUMN` forms avoid a table rewrite but still acquire a DDL lock. For an existing column, a validated `CHECK (column_name IS NOT NULL)` can support a staged NOT NULL transition in supported versions: add the CHECK as NOT VALID, validate it separately, then apply SET NOT NULL with a bounded lock wait. Verify the exact version and statement, index creation on a busy table may require `CONCURRENTLY` (and can't run in a transaction — migration tooling must know this), and DDL lock modes and duration depend on the operation; an ALTER waiting behind a long-running query can in turn cause later operations to queue, so set `lock_timeout` and retry rather than letting a stuck ALTER dam the whole connection pool. MySQL: know which ALTERs are truly in-place vs table-rebuilds per version, and reach for the online tools earlier. These specifics change with engine versions; the *practice* that doesn't change is testing migrations against production-sized data before production meets them — a staging environment with 10k rows validates syntax, not safety.

## The pipeline: making the discipline enforceable

Human discipline decays; gates don't. The estates that keep this working encode it: **migrations deploy separately from code** (ordering enforced: expand-migrations land before the code that assumes them — the deployment pipeline should refuse a release whose code references schema not yet live); **migration linting in CI** (tools exist for the major engines that flag unsafe operations — non-concurrent index builds, NOT NULLs without defaults, type changes on large tables — turning tribal lock-safety knowledge into merge-blocking feedback); **a "compatible with N-1" review question on every schema PR** — can the *previous* release run against this schema? if not, it's not one change, it's an expand/contract sequence that hasn't been decomposed yet; and **runbooks only for the exceptions** — the rare genuinely-breaking change (an emergency security fix that must drop something now) should be a named, ceremonied event precisely because everything else stopped being one.

Two honest costs to acknowledge in the adoption conversation. Expand/contract multiplies small deploys and stretches changes across days — teams accustomed to "one PR, done" feel the friction acutely until the first time step 4 gets reverted harmlessly and they see what the friction bought. And dual-write windows create their own bug class (drift between the columns when one write path fails) — mitigate with write-path monitoring and the convergence checks, and keep windows short. The pattern's overhead is real; it's just smaller than the outage budget it replaces.

The strategic point mirrors every other discipline in this series: the database was never actually exempt from continuous delivery — it was just the place where the industry kept accepting risk it had engineered away everywhere else. Expand/contract, batched backfills, lock-aware tooling, and pipeline gates extend the same principles — small reversible steps, compatibility across versions, automation over heroism — to the layer where mistakes are least forgiving. Once it's routine, the last scary deploy artifact in the estate becomes just another sequence of boring ones, and boring, as ever, is the goal.

## Compatibility is a matrix of readers and writers

Before a schema change, list every application version, worker, scheduled job, reporting query and connector that reads or writes the affected field. A rolling deployment is only one source of overlap. A delayed job or a rollback image can continue using the old contract after the main web deployment completes. Define the supported overlap period and the evidence required before removing the old representation.

An additive column is not automatically risk-free. Positional inserts, `SELECT *` consumers, strict decoders and logical replication can react to a changed shape. Defaults and generated expressions can have different rewrite or evaluation behavior by engine version. Rehearse the actual statement and application combinations. The objective is no unacceptable service interruption, not a promise that schema operations take no locks or resources.

### A hypothetical backfill throughput model

Assume one million historical rows need conversion. A job processes batches of 1,000 rows. Each batch takes 0.2 seconds and then pauses for 0.8 seconds, yielding one batch per second and an idealized rate of 1,000 rows per second. The full backfill takes 1,000 seconds, about 16.7 minutes. After 250, 500 and 1,000 seconds, the modeled completed counts are 250,000, 500,000 and 1,000,000.

The chart uses constant synthetic timings. Real progress varies with locks, cache state, row size, replica lag and concurrent writes. An ETA should update from observed progress and include the remaining reconciliation, not only the data-copy phase. Larger batches may reduce overhead while increasing lock duration, WAL bursts and retry cost. Choose a batch budget by foreground service impact rather than a universal row count.

## Avoid overwriting concurrent application changes

A backfill that reads an old value and later writes a transformed value can race with a user update. Define the authoritative representation and use a conditional update, row version or transaction protocol that prevents stale overwrite. If both columns are in one database, updating them in the same transaction can preserve their relationship for new writes. Cross-system dual writes need an outbox, CDC or another explicit consistency protocol.

During a rolling transition, old writers may populate only the old column. Do not switch all readers to the new column merely because one initial backfill finished. Either retire old writers and perform a final convergence pass, or implement a supported synchronization mechanism during overlap. Record how rows created after the backfill's starting point are handled. A count of initially migrated rows does not establish ongoing consistency.

Use stable keyset progress rather than offset pagination over a changing table. Persist a checkpoint only after the corresponding batch commits, and make repeated batches safe. Handle deleted rows and sparse identifiers. If conversion can fail, quarantine the key and reason without letting one malformed row permanently block all later work. Reconcile the exception set before declaring the migration complete.

## Lock behavior is operation-specific

PostgreSQL DDL lock modes vary by operation. Even a metadata-only change can wait behind another transaction, and a waiting strong lock can contribute to a queue of later requests. Set an appropriate lock timeout and make retries controlled. A short timeout limits waiting; it does not prove that executing the operation after acquiring the lock is cheap.

A common path to a NOT NULL requirement is to add a suitable CHECK constraint as NOT VALID, validate existing rows separately, then apply the final column property using the deployed version's supported optimization. Do not confuse that pattern with a universal `NOT VALID` modifier for every constraint form. Consult the exact ALTER TABLE syntax and lock behavior. Validate against representative data with realistic concurrent transactions.

Concurrent index creation can preserve ordinary writes but still performs scans, waits and resource-intensive work. It has restrictions and can leave an invalid index after failure. Inspect status and clean up deliberately. Online migration tools for other engines also need cutover locks or coordination; they reduce certain blocking periods rather than abolishing all locking.

## Read switching needs semantic reconciliation

Compare more than non-null counts. For a unit conversion, verify bounds, rounding and domain-specific invariants. For a table split, compare join cardinality and required relationships. For a status migration, ensure every old state maps to a defined new state and that unknown historical values are handled explicitly. Sample comparisons supplement aggregate checks but should not replace full checks for critical invariants.

A shadow read can compare old and new results without changing the user response. Record mismatches by category and investigate them before switching. Avoid logging sensitive payloads unnecessarily. If the new model intentionally changes semantics, document which differences are expected; a blanket requirement for byte equality may be wrong, while ignoring all differences is equally unhelpful.

### A failure-injection exercise

On a disposable database, run old and new writers concurrently while the backfill proceeds. Kill the backfill after a committed batch and restart it from its checkpoint. Inject one invalid source value and one concurrent update. Verify that progress resumes without duplication or stale overwrite and that the exception is visible. Then switch readers and exercise an application rollback while dual writing continues.

Finally test the point after contraction. Dropping the old field is not generally reversible by redeploying old code, especially after new writes cannot be represented in the old schema. Define a forward-fix or restore strategy and its data-loss implications before this step. The reversible window must end deliberately, with evidence that old readers and writers are gone.

## Publish a migration record

Keep the compatibility matrix, statements, batch parameters, progress metrics and reconciliation queries together. Name a pause owner and stopping conditions such as elevated application latency, replication lag, lock waits or disk pressure. A paused migration should leave a supported application state rather than an ambiguous half-cutover.

Completion means the new representation is authoritative, consumers are migrated, reconciliation passes, monitoring is updated and obsolete compatibility paths are removed through a planned change. Expand-and-contract makes risk manageable by exposing the intermediate states; it does not turn every state into an automatically safe one.

### Figure methodology

Synthetic 1,000,000-row backfill uses 1,000-row batches taking 0.2 s plus 0.8 s pause, giving 1,000 rows/s. Progress at 250,500 and 1,000 s is 250,000,500,000 and 1,000,000. Excludes contention, retries and final reconciliation.

| Worked observation | rows completed |
| --- | ---: |
| 250 seconds | 250000 |
| 500 seconds | 500000 |
| 1,000 seconds | 1000000 |

## Primary references and further study

- [PostgreSQL ALTER TABLE lock and validation rules](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL concurrent index creation](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Transactional outbox for cross-system changes](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
