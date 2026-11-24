# Calculate how much replay time a cutover needs
@lesson cutover-replay-window | Estimate catch-up time from a backlog and the rates at which changes arrive and apply.
@chart Replay time for 240,000 pending changes | seconds
@value Writes paused | 200
@value 800 changes/s arriving | 600
@value 1,000 changes/s arriving | 1200
@match replication lag | replay | change data capture | logical replication | wal | cutover
@source PostgreSQL · Monitoring database activity | https://www.postgresql.org/docs/current/monitoring-stats.html
@source PostgreSQL · Logical replication restrictions | https://www.postgresql.org/docs/current/logical-replication-restrictions.html

## Start at the correct boundary

Select a snapshot boundary and record the position from which changes resume. A replication slot or retention window must hold the changes needed during the load. Track positions at receive and apply separately. A subscriber accepting network traffic can still be far behind at durable apply. Observe retention and disk capacity during the longest plausible initial load.

## Compute drain time

The example backlog is 240,000 changes. The apply rate is 1,200 changes per second. With writes paused it drains in 200 seconds. With 800 new changes arriving per second it drains at the net rate of 400 per second and needs 600 seconds. With 1,000 arriving per second it needs 1,200 seconds. If arrivals equal or exceed apply capacity, this simple model has no finite catch-up time.

Use equivalent units. A WAL byte backlog cannot be divided directly by a transaction count. In practice, record both event and byte throughput. Reserve time after replay for reconciliation, traffic switching, and verification of new writes. The dry run must include a burst and a large transaction so the average rate does not dominate the plan.

## Limits of the example

Rates are illustrative and fixed. Locks, payload size, transaction ordering, and missing indexes change the actual apply rate. Schema changes and sequence state need explicit checks. Confirm how the specific database version handles them before switching writes.

# Reconcile migrated tables at the same consistent cut
@lesson partition-reconciliation | Use counts and deterministic fingerprints to isolate discrepancies before accepting a migration.
@chart Rows counted in one UTC partition | rows
@value Source snapshot | 25000
@value Initial target snapshot | 24996
@value Target after repair | 25000
@match row count | checksum | source of truth | reconciliation | dual write | data integrity
@source PostgreSQL · Transaction isolation | https://www.postgresql.org/docs/current/transaction-iso.html
@source PostgreSQL · Logical replication restrictions | https://www.postgresql.org/docs/current/logical-replication-restrictions.html

## Compare like with like

Choose a stable primary key, schema version, and UTC partition boundary. Record the source snapshot or transaction cutoff and wait for the corresponding position at the target. Comparing a live count taken at two different times says little about correctness. The example partition has 25,000 source rows and 24,996 target rows. It is short by four rows at the aligned boundary.

## Isolate the failure

Compare exact key sets for the failing partition, then compare values for shared keys. Canonicalize columns in a stable order. Distinguish NULL from an empty string and document the treatment of decimals, timestamp precision, and character encoding. Bucket by deterministic key ranges and calculate reproducible fingerprints over ordered keys and canonical values. Use counts as a cheap screen, not as a certificate of equality.

Repair the identified records, reapply to a known point, and repeat the checks. In the example, matching counts after repair exclude a net row deficit. A deleted key and an unrelated duplicate can cancel in aggregate, so confirm key uniqueness and values before release. Verify application invariants, such as a ledger balance, separately from transport integrity.

## Limits of the example

The chart contains illustrative counts. A fingerprint can miss a difference if the selected columns or canonical representation omit it. Do not use sampled results as guarantees for all partitions. Record which ranges received exact comparisons and who approves exceptions.

# Rehearse the point where rollback becomes recovery
@lesson recovery-cutover-gates | Define the stop conditions that separate a safe rollback from a forward recovery after writes move.
@chart Stages in a sample recovery rehearsal | minutes
@value Exposure until detection | 4
@value Stop and fence writes | 5
@value Reconcile and restore | 14
@value End-to-end recovery | 23
@match rollback | failover | rpo | rto | point in time | fenced | disaster recovery
@source NIST · Contingency Planning Guide for Federal Information Systems | https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final
@source PostgreSQL · Continuous archiving and point-in-time recovery | https://www.postgresql.org/docs/current/continuous-archiving.html

## Name the last reversible point

Before the target accepts writes, a rollback can normally direct traffic to the still-authoritative source. After target writes exist, that source may no longer carry every acknowledged result. Define your recovery path before the change, including ownership of write fencing, verification of replication positions, and whether writes can be safely replayed. Accept only one authoritative writer during a controlled cutover unless a tested multi-writer design resolves conflicts.

## Run the clock

In the rehearsal, detection takes four minutes from interruption. Fencing writes takes five minutes. Reconciliation and service restoration take 14 minutes. The non-overlapping elapsed recovery is 23 minutes. Against an example 30-minute recovery time objective, there are seven minutes of margin for these conditions.

Measure recovery point separately from elapsed recovery. Compare the point of interruption with the last recoverable business transaction. An older copy that starts quickly may miss the allowed data-loss window. Rehearse backup availability, replica lag, duplicate requests, and stale DNS or client connections. Verify restored service with a business write and read, not only a health check.

## Limits of the example

These are rehearsal inputs, not an availability promise. A successful dry run says what worked at its tested scale with its tested staff. Repeat the rehearsal with fewer responders or a larger backlog. Record timestamps from an independent observer and keep the validated recovery artifacts.
