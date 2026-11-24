---
title: "Reliable Batch Jobs: Reruns, Checkpoints, and Missing Intervals"
description: "Separate logical runs from attempts, publish complete output, test recovery, and reconcile expected intervals with verified results."
date: 2027-07-30
tags: ["Programming", "Reliability", "Data Engineering", "Architecture"]
format: article
---

Batch jobs are the estate's unsupervised workforce: the nightly reconciliation, the hourly export, the weekly report, the cleanup task from 2019 — running in the dark, watched by nobody, discovered to have failed only when their absence surfaces downstream ("why is the report empty?" is the batch world's most common alert, and it fires days late in the worst cases). The interactive stack gets SLOs, dashboards, and on-call attention; the batch tier gets a cron expression and hope. Yet batch failures have a distinctive severity profile — they *compound silently* (each missed run deepens the backlog, per the queueing math) and they *corrupt quietly* (the half-completed run that wrote partial state is worse than the run that never started). The disciplines that fix this are a compact set, and most are the series' recurring principles pointed at the workload everyone forgot to point them at.

## The prime directive: design for the rerun

Every batch job will someday be run twice for the same period — by retry automation, by a human fixing things, by a scheduler misfire — and the single most consequential design property is whether that's safe. The idempotency toolkit applies wholesale: **jobs keyed by their logical period, not their execution time** ("process orders for 2026-07-02" as an explicit parameter — never `now() - 1 day` computed inside the job, which is the design flaw that makes reruns process the *wrong* day and backfills impossible; the parameter-versus-clock rule is the batch world's most valuable single habit), **writes as replaces or upserts at the period grain** (atomically replace a validated partition where supported, or merge by a stable key — so running twice converges instead of doubling; the fact-table partition-overwrite pattern from warehouse practice exists exactly for this), and **side effects gated by dedup** (the job that sends emails or calls partner APIs needs the idempotency-key discipline on each effect, because "rerun the job" must not mean "re-invoice the customers" — the effects ledger, not the job wrapper, is what makes that true).

**Checkpointing** extends the same thinking into the job's interior: long jobs that fail at hour three should resume, not restart — progress recorded at batch boundaries (the resumable-backfill discipline from migration practice), work decomposed into independent, individually-committable chunks (which also unlocks parallelism — the chunked design is the same design), and the failure-handling asymmetry made explicit: transient chunk failures retry; poison chunks need an explicit quarantine or stop policy with alerting and a documented effect on completeness — the messaging patterns, applied to iteration.

## Scheduling: the missed-run problem and the dependency truth

Cron answers "when to start" and nothing else, and the gaps define batch operations: **What happens to the run that didn't happen?** (the host was down at 02:00 — cron's answer is silence; real batch needs *catch-up semantics* decided per job: must-run-eventually jobs need backfill-on-recovery, run-if-current jobs should skip stale periods — and this decision, undeclared, is how estates accumulate silent gaps in "daily" data). **What prevents the overlap?** (the slow run that's still going when the next fires — double-processing plus resource contention; overlap policy — skip, queue, or kill-and-supersede — is a per-job decision, and the distributed-lock-or-lease machinery from coordination practice is how multi-host schedulers enforce it, fencing included). **And who runs first?** — the deeper truth that most "batch problems" are *dependency* problems: the export that ran before the load finished, the report computed on yesterday's half-arrived data. Time-based sequencing ("load at 2, transform at 3, export at 4") is coupling by luck — the buffer either wastes hours or, on the slow night, silently inverts the order. The fix is the orchestration layer from workflow practice: dependencies declared as a graph, downstream triggered by upstream *completion* (or better, by data-availability sensors — the "partition exists and passes checks" gate that fuses scheduling with the data-quality tier), with the whole DAG visible, backfillable, and owned. The placement rule stands: the moment a cron job's correctness depends on another cron job's timing, you've outgrown cron.

## Monitoring for absence, and the operational rim

Batch monitoring inverts the interactive default: the failure mode isn't error spikes — it's *silence*, and silence looks exactly like health to a metrics dashboard. The disciplines: **freshness/heartbeat alerting as the primary signal** ("this job's success marker is older than its period plus tolerance" — the dead-man's-switch pattern; every batch job gets one, because it catches the crashed host, the disabled schedule, and the wedged run identically — the absence-detection that error-rate alerting structurally cannot provide), **duration tracking with trend alarms** (the run that took 20 minutes last year and takes 3 hours now is announcing its scaling cliff — the time-to-wall trajectory from capacity practice, and the early warning before it collides with its window), **per-run structured results** (rows processed, rejected, skipped — the canonical-log-line discipline per run, feeding the reconciliation checks: a "successful" run that processes an unexpectedly low volume may indicate missing input or a legitimate change in demand that requires reconciliation, and volume and reconciliation checks can reveal it), and **an owner per job** (the estate audit that lists every scheduled job with owner, purpose, and last-review date reliably finds the 2019 cleanup task nobody can explain — the zombie tier, which is both waste and risk, per every inventory discipline; deletion, as ever, is celebrated).

The closing calibration: the batch tier is where the estate's operational maturity is most honestly measured, precisely because nobody is watching — the interactive stack's discipline is enforced by users complaining in real time; the batch stack's discipline exists only if it was engineered in. Period-parameterized, rerun-safe, checkpointed, dependency-ordered, absence-monitored, and owned: six properties, none exotic, and the difference between the nightly jobs being infrastructure and being the estate's slowest-burning incident generator. The 02:00 workforce deserves the same engineering as the 14:00 one — it just can't ask for it.

## Separate the logical run from each execution attempt

A daily reconciliation has a logical interval, input revision, and intended output. It may take several execution attempts to produce that output. Give the logical run a stable identity and give each attempt a separate identifier. This allows an operator to distinguish “the same day retried” from “a corrected calculation of that day using a new ruleset.” Both can be legitimate, but they should not silently overwrite each other's evidence.

Record interval boundaries explicitly, including time zone and whether the end is exclusive. A half-open interval such as start-inclusive and end-exclusive avoids counting a boundary event twice across adjacent periods when applied consistently. A civil day in a named time zone need not contain exactly 24 hours. Do not derive a business day by subtracting a fixed duration from the current clock unless that is actually the domain rule.

Input completeness is another separate state. The scheduled time can arrive before all upstream records have arrived. Define a watermark, readiness marker, or reconciliation check appropriate to the source. A directory's existence alone does not prove that its files are complete. Include source version or partition metadata so a rerun can explain why its output differs from the first attempt.

## A hypothetical checkpoint calculation

Imagine a fictional job processing 1,000 records in ten chunks of 100. Six chunks have committed their output and checkpoint atomically when the worker fails. Under a full-restart design, the next attempt examines all 1,000 records again, requiring idempotent writes to avoid duplication. Under a valid checkpoint design, the next attempt examines the remaining 400 records.

The chart compares 1,000 and 400 records examined after recovery. It assumes stable input membership and ordering, no partial seventh chunk, and no need to revalidate earlier output. It does not claim a 60% runtime reduction: startup, reading, validation, and external calls may dominate. If the source changes between attempts, simply resuming at an offset may skip or repeat records.

A checkpoint must describe committed work, not merely observed progress. Recording the checkpoint before output commits can lose data after a crash; recording it after output without an atomic relationship can replay work. Use an appropriate transaction, idempotent output key, or staged publication protocol for the stores involved. A progress bar is useful to people but is not automatically a recovery contract.

## Publish complete output deliberately

For a report or export, write to a versioned staging location, validate the result, and then update the authoritative pointer or marker. Readers should either see the previous complete result or the new complete result according to the chosen publication model. Deleting the old partition and slowly rewriting it can expose an empty or partial result if the storage system does not make that replacement atomic.

Validation should include more than process exit status. Check required columns, expected partitions, duplicate keys, rejected-record counts, and reconciled totals. Expected volume is a useful signal, but a naturally quiet business day is not automatically a failure. Define thresholds and exceptions with the data owner, and preserve the reason for accepting unusual output.

If some records are quarantined, make the resulting completeness contract explicit. A financial reconciliation may need to stop until every relevant record is resolved, while an analytical report may publish with an identified exclusion count. Sending a poison record to a dead-letter queue does not make the whole job semantically successful by itself. The downstream consumer must know what was omitted.

## A crash-and-rerun lab

Create a synthetic input set of 1,000 uniquely identified records and a transformation with a verifiable total. Process in chunks of 100, storing output under a logical run identifier. Introduce a controlled failure after the sixth committed chunk. Restart with the same run parameters and confirm that the final set has exactly the expected keys and aggregate, with no duplicate side effects.

Repeat the experiment with failures before output commit, after output commit, and before checkpoint persistence. Where the implementation cannot commit output and checkpoint together, verify the deduplication behavior that closes the gap. Then alter an input record between attempts and confirm that the job either uses the original snapshot or clearly creates a new input revision. Silent mixing of two source versions is not reproducible recovery.

Add a simulated external notification for each completed business item. The local output transaction cannot atomically include an unrelated provider's action. Use an outbox and a stable effect key where appropriate, and retain the ambiguous-send case when a provider lacks idempotency support. Rerunning the calculation should not casually resend every notification.

Finally, start two attempts for the same logical run. A scheduler's concurrency policy may prevent some overlaps, but manual execution or a second scheduler can bypass that policy. Use output uniqueness, ownership checks, or fencing suited to the actual store. A lease that expires while a paused worker is still alive needs protection against that old worker writing after a new owner takes over.

## Missing runs are a reconciliation problem

Maintain an expected-run calendar or derive expected intervals from the declared schedule. Compare it with successful logical runs, not merely the latest process heartbeat. A worker can keep sending heartbeats while making no progress, and one recent successful interval can hide an older gap. Report missing, running, failed, superseded, and deliberately skipped intervals distinctly.

When the scheduler recovers from an outage, choose catch-up behavior explicitly. Replaying six months of expensive jobs at once can overwhelm databases and delay current work. Limit backfill concurrency, prioritize current obligations, and show the remaining recovery backlog. Jobs whose output is obsolete may be skipped by policy, while reconciliation and accounting jobs may need every interval completed.

Time-based scheduling systems differ in their treatment of missed starts, time zones, overlap, and daylight-saving transitions. Kubernetes CronJob documentation explicitly describes cases where more than one Job or no Job may be created, so the workload still needs idempotent behavior. Workflow systems also have version-specific interval and trigger semantics. Test the configured scheduler instead of inferring its behavior from a familiar cron expression.

## Keep the runbook executable

A useful runbook states the exact logical parameters, input revision, output location, expected validations, retry command, and conditions for escalation. It should explain how to inspect a failed chunk and how to resume without changing the interval accidentally. Include rollback or publication reversal where the output supports it, and describe which external effects cannot simply be undone.

Measure deadline completion and output freshness from the consumer's perspective. A job that finishes successfully after the business cutoff may still miss its service objective. Retain attempt history, but make the logical run's status and data quality the primary story. Reliable batch processing is demonstrated by recovery and reconciliation, not by a long streak of green scheduler icons.

## Further reading and source boundaries

- [Kubernetes: CronJob limitations and concurrency](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Apache Airflow: DAG runs and data intervals](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html)
- [Microservices.io: transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- [PostgreSQL: transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html)
