---
title: "SQLite in Production: The Serious Case for the Unserious Database"
description: "Evaluate SQLite concurrency, WAL and backup behavior, then test a single-writer workload and a restore before deployment."
date: 2028-01-31
tags: ["Data Engineering", "Programming", "Architecture", "Reliability", "Edge Computing"]
format: article
---

SQLite occupies a strange dual reputation: simultaneously the most deployed database in existence — running in every phone, browser, and embedded device, with a testing regime aerospace software would respect — and the punchline of server-side architecture reviews ("we'll obviously need a *real* database"). The last few years quietly ended the joke. A confluence of changes — WAL mode maturing, streaming-replication tools of the Litestream lineage, the single-node hardware renaissance, and a broader cultural correction against reflexive distribution — moved SQLite-in-production from contrarian stunt to legitimate default for a specific, sizable class of services. The engineering case is worth stating precisely, because both the enthusiasm and the dismissal tend to skip the load-bearing details.

## The architectural trade: the network hop is the product

SQLite's defining property isn't smallness — it's **in-process execution**: the database is a library reading a local file, and a query avoids a client/server network round trip. The resulting latency benefit depends on the workload and storage. That difference doesn't just make queries faster — it *changes what good application code looks like*: many small queries avoid network overhead locally, though their CPU, I/O and repeated work still require measurement, which means the dozens-of-small-queries style that object-oriented code naturally wants stops being a sin. Add the operational subtraction — no server to provision, patch, pool connections against, or fail over; backups require a coherent snapshot or the supported backup API; recovery, access control and disk management remain operational responsibilities — and the value proposition is clear: **for workloads that fit one node, SQLite deletes both the latency and the operational surface that client-server databases charge as their baseline rent.**

The concurrency truth that gates everything: SQLite serializes writes — **one writer at a time**, with WAL mode allowing readers and a writer to proceed concurrently in many cases, subject to documented locking and checkpoint behavior. This is disqualifying exactly where write concurrency is the workload (the high-TPS transactional tier) and irrelevant more often than intuition suggests: short transactions can support substantial write rates, but capacity must be measured with the chosen durability settings, which — per the envelope math that keeps recurring — covers the actual write rates of a very large share of real applications. The practical configuration floor: WAL mode on, a bounded busy timeout and explicit SQLITE_BUSY handling (some contention can wait, while other lock conflicts or expired waits still require a safe retry), one write connection with the application serializing writes through it (the queueing discipline made explicit), and synchronous settings chosen deliberately against durability needs.

## What made it production-grade: the replication layer

The historical dealbreaker was the single point of failure — one file on one disk — and the modern answer is the **streaming-replication tier**: Litestream-class tools tail the WAL and continuously ship it to object storage (point-in-time recovery from the bucket, per the backup disciplines, with a recovery point determined by measured shipping lag and successful restore tests), and the read-replica generation (LiteFS-class and successors) distributes copies across nodes/regions for read scaling and failover. The resulting shape — single writer, WAL-shipped durability, distributed read replicas — is the *single-writer-with-replicas* pattern from the replication chapter, implemented at file granularity, and it honestly serves the same envelope that pattern always served: read-heavy workloads, modest write rates, tolerance for a failover story that involves promoting a replica (with the same replication-lag honesty as any async setup). The edge deployment story is where this composition shines brightest: per-region or per-node SQLite replicas putting data beside the application, avoiding a remote database hop while retaining workload-dependent disk and query latency — the edge-computing placement logic, with the reads-distributed/writes-homed rule built into the architecture.

## The placement guide

**Where it's the right default**: single-node services inside the envelope (the internal tool, the SaaS product below the write-concurrency line, the CMS/read-heavy tier), edge and per-tenant architectures (one database file *per tenant* is a genuinely elegant isolation model — the multi-tenancy silo tier with per-file migration, backup and resource-management responsibilities, with tenant migration using a coherent backup or quiesced copy plus a deliberate write-ownership cutover), embedded and desktop contexts (its home turf, unchanged), the local-first application tier (SQLite on the client syncing to the server — the offline-first patterns), and — often overlooked — the **testing and development substrate** even for Postgres-targeting teams (with the honest caveat from testing practice: dialect differences mean the real engine must appear in the integration tier).

**Where the dismissal remains correct**: genuine write concurrency (many simultaneous writers is the workload's shape — client-server databases exist for this), multi-node *write* availability requirements (the failover story above is promotion, not multi-master), very large working sets (the single-file, single-node ceilings), and — the organizational one — teams whose operational muscle memory is entirely Postgres-shaped and whose workload sits comfortably in Postgres's envelope anyway: the migration *to* SQLite is only worth it where its specific dividends (latency, operational subtraction, per-tenant isolation, edge placement) are the point.

The meta-lesson mirrors the DuckDB story and the broader single-node renaissance: the industry spent a decade pricing every architecture as if distribution were free and mandatory, and the correction — measure the envelope first, distribute when the workload demands it, and collect the simplicity dividend the rest of the time — keeps finding the same answer at different layers. SQLite is that answer at the transactional layer: not a toy that grew up, but a rigorously-engineered component the server world finally built the missing pieces around. The boring file, it turns out, was load-bearing all along.

## Start with the write occupancy, not a database slogan

A single writer is a constraint on concurrent write transactions, not a universal transactions-per-second specification. Transaction duration depends on storage, durability settings, indexes, page access and the work performed while holding the transaction open. A service that writes infrequently but holds a transaction across a remote API call can experience worse contention than one that commits many small local changes quickly. Remove network waits from the critical transaction where the business protocol allows it.

A hypothetical service receives 100 write transactions per second. If each holds the writer for an average of 2 milliseconds, offered writer occupancy is 100 × 0.002 = 0.20, or 20 percent. At 5 milliseconds it is 50 percent; at 9 milliseconds it is 90 percent. The figure shows these modeled occupancies. It does not predict response latency: burstiness, variance and checkpoint interference are omitted. Near saturation, a small slowdown can produce a large queue, so the average alone is not an admission-control policy.

Measure transaction hold time, queue wait and end-to-end request time separately. A busy timeout is a bounded waiting policy; it does not add write capacity and should fit within the caller's deadline. Retrying every busy response without a budget can multiply load during a burst. A deliberate single write queue can make pressure visible, but it also needs a maximum length, cancellation handling and a recovery story after process failure.

## WAL changes concurrency, not the failure model

WAL mode allows readers to observe stable snapshots while a writer appends changes. It still has one writer and operational interactions around checkpointing and long readers. A reader that keeps an old snapshot open can delay checkpoint progress and cause the WAL to grow. Monitor file growth and checkpoint behavior together with reader duration. Closing a cursor or transaction promptly is part of resource management, not merely application style.

SQLite's WAL documentation describes a shared-memory requirement for ordinary WAL operation. Do not put the database on a network filesystem and assume that local-disk concurrency guarantees transfer unchanged. Validate the supported filesystem and deployment arrangement. Container storage must survive the lifecycle you expect; a writable path inside an ephemeral container is not an adequate persistence plan just because the database file exists during a demonstration.

Durability settings require a failure test. Document which failures must preserve acknowledged commits: process crash, operating-system crash, node loss or storage loss. Then choose settings and replication arrangements that support that objective. A successful normal shutdown says little about crash recovery. Record the exact version, journal mode, synchronous setting, filesystem and storage class in performance comparisons so a faster but weaker durability configuration is not presented as an equivalent result.

## Back up a coherent database

Copying only the main database file while writes are active can omit changes that remain in the WAL. Use the supported online backup API or a documented snapshot/backup mechanism that produces a coherent database. A file copy is safe only under conditions that guarantee the required consistency, not as an unconditional backup recipe. Keep encryption and access controls appropriate for the data in both the live file and backup destination.

Test restoration into a separate environment. Verify schema version, representative row counts, application invariants and the latest recoverable acknowledged event. If a replication tool ships changes asynchronously, measure its actual lag and recovery behavior rather than assuming a particular number of seconds of recovery-point loss. Backups do not automatically implement a coordinated failover protocol or prevent two nodes from believing they own the writer role.

A failover plan must specify who chooses the new writer, how the old writer is fenced and how clients find the authoritative instance. A replica that is available for reads can still lag behind a recent successful write. Decide whether the application requires read-your-writes consistency and route or wait accordingly. These are application guarantees that must be tested through the chosen replication product; they are not features obtained merely by enabling SQLite WAL.

## A bounded load and recovery exercise

Use a disposable database with an orders table and a unique operation identifier. Generate a known workload of short transactions, then add a second worker and deliberate bursts. Record accepted operations, busy responses, retries, queue depth and duplicate-operation attempts. Keep the write transaction small and avoid sleeps or remote requests while it is held. Repeat with a long-lived read transaction to observe the checkpoint and WAL consequences.

Interrupt the process during writes and restart it. Reconcile operation identifiers against the caller's acknowledgments, distinguishing a failed response from a confirmed rollback: a caller may lose the response after a commit succeeds. Retry with the same operation identifier so the application can recognize completed work. The test's acceptance rule should define whether the system preserves every acknowledged operation and whether retried requests create duplicates.

Next restore a backup without using the live database directory. Check the newest recoverable operation and time until the application serves a representative query. This exposes missing credentials, undocumented paths and untested migration assumptions. A backup that cannot be restored by the on-call procedure is an inventory item, not demonstrated recovery capability.

## Choosing the boundary honestly

Per-tenant files can simplify data placement and some isolation concerns, but they multiply migration, backup, file-count, quota and monitoring responsibilities. Define how thousands of tenant databases receive schema changes and how failures are retried. Establish a noisy-neighbor budget for CPU and disk; separate files on one host still share physical resources. Tenant deletion needs a policy covering backups and replicas as well as the active file.

SQLite can make local transactional storage straightforward when the workload and ownership model fit. A client/server database may be preferable when many application hosts need coordinated writes, operational tooling is already established or centralized access control is a core requirement. Make the decision from measured contention, recovery objectives and deployment constraints. A successful choice includes the point at which the team will revisit it and the export path that keeps that future decision practical.

### Figure methodology

Synthetic arrival rate is 100 write transactions/second. Occupancy = arrival rate × average writer hold time ×100, giving 20%, 50% and 90% for 2, 5 and 9 ms. This excludes bursts, variance and checkpoint effects and does not forecast latency.

| Worked observation | percent |
| --- | ---: |
| 2 ms transactions | 20 |
| 5 ms transactions | 50 |
| 9 ms transactions | 90 |

## Primary references and further study

- [SQLite appropriate-use guidance](https://www.sqlite.org/whentouse.html)
- [SQLite WAL concurrency and checkpoints](https://www.sqlite.org/wal.html)
- [SQLite online backup API](https://www.sqlite.org/backup.html)
