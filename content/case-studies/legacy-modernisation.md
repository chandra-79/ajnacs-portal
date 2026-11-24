# Legacy modernisation

## Extract the order-status endpoint a cohort at a time
@meta order-status-strangler | Route one read use case to a new service while the order system retains write authority.
@flow Map contract | Shadow and compare | Route stable cohorts | Retire the old read path
@metric End-to-end status response p95 | ms | 580 | 228
@metric Responses matching comparison rules | % | 9990/10000 | 9996/10000
@ref AWS Prescriptive Guidance · Strangler fig pattern | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html

### Situation and scope

A retailer wants independent releases, but twelve checkout journeys still use a common system. Start with one read-only status endpoint. Preserve authentication, response fields, freshness, and refund status semantics. Set p95 at no more than 300 ms and require 99.9% valid agreement on agreed canonical fields before routing a customer cohort.

### Plan and execution

Identify every consumer using gateway and application logs. Document status mapping and put contract tests around partial fulfilment and refunds. Route via a stable customer key and build a projection fed by committed orders. Shadow read requests against both implementations without allowing the shadow to produce side effects. Compare defined fields and mark windows where the projection is intentionally behind.

### Rollout and handover

Move a small cohort after validating fallback behaviour, then expand only after freshness and error gates hold during a peak period. Route back to legacy on sustained lag, semantic mismatches or elevated errors. Remove the route from the monolith only after dependent clients are accounted for and fallback ownership is agreed.

### How to read the numbers

Two paired replays each contain 10,000 status reads from the same synthetic journey mix. The agreement denominator includes mismatches and excludes no eligible response. Both routes use an independently prepared expected record. Latency alone cannot justify retiring the previous implementation.

## Deliver domain events from a committed outbox
@meta committed-order-events | Replace separate database and broker writes with a transactional outbox and verified consumer deduplication.
@flow Save order and outbox | Publish change record | Deduplicate consumer event | Reconcile ledger
@metric Orders without a downstream event by cutoff | % | 71/50000 | 4/50000
@metric Repeated effects after redelivery | effects | 18 | 0
@ref AWS Prescriptive Guidance · Transactional outbox | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html

### Situation and scope

An order service writes to its database and then publishes to a broker. A failure between the two can leave an order without an event. Accept no duplicate downstream effects in the replay and reconcile every committed order by its event ID within ten minutes, including restore and restart.

### Plan and execution

Write the outbox row in the order transaction. Preserve an aggregate identifier and sequence if downstream order matters. Publish using a controlled polling or change-data-capture process. Test failures before commit, after commit and after publish but before acknowledgement. The consumer records a unique event ID and its local effect transactionally where possible. Effects in external systems need an idempotency contract or an independent reconciliation step.

### Rollout and handover

Keep the old publisher active only for cohorts that have not migrated. Compare broker, outbox and consumer ledgers by immutable event ID. Stop on growing oldest-event age or incorrect effects. Leave a bounded replay process, offset recovery procedure and retention policy with the on-call team.

### How to read the numbers

Each synthetic run contains 50,000 committed orders and uses the same fault schedule. Four pilot events were still missing at cutoff, so the example misses the reconciliation gate. Inspect lag and publisher recovery before expanding. Zero duplicate effects in these runs cannot establish exactly-once delivery.

## Reconcile the new ledger alongside the legacy one
@meta parallel-ledger-reconciliation | Shadow calculations without creating a second book of record and require an explainable reconciliation.
@flow Immutable source feed | Replay to new ledger | Compare postings and balances | Sign off or hold
@metric Unexplained journal mismatches | % | 94/25000 | 0/25000
@metric End-of-day reconciliation time | minutes | 97 | 46
@ref AWS Prescriptive Guidance · Strangler fig pattern | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html

### Situation and scope

A billing team wants to replace overnight ledger jobs. The legacy ledger retains authority during parallel runs. Acceptance requires zero unexplained imbalances, matched debit and credit totals by currency, and a second reviewer able to reproduce exceptions from the same source events.

### Plan and execution

Freeze canonical posting rules using accounting sign-off. Capture input events with their order and schema version. Run the new ledger in isolation and compare both balances and lines. Report explanations by cause, including rounding, timestamp bucket, reversal and late adjustment. Preserve original currency amounts and avoid netting away discrepancies.

### Rollout and handover

Rehearse the month-end cutover with a frozen input watermark, pending-event report and named decision owner. Hold the switchover if the reconciler flags an unexplained imbalance. After an authority switch, use a documented forward repair or controlled reversal path so the two ledgers cannot accept independent writes. Hand over replay instructions plus the daily exception list.

### How to read the numbers

Both shadow runs use 25,000 synthetic postings, with one matched monthly workload bundle. Reconciliation time starts when both runs finish and stops at signed review. Zero unexplained differences in one bundle supports the next rehearsal. It cannot establish correctness for new transaction types.

## Rehearse blue-green rollback before changing live traffic
@meta blue-green-rollback-gate | Stage a compatible release in a separate environment and test rollback with live-shaped load.
@flow Provision green | Verify schema compatibility | Route a cohort | Restore blue or promote
@metric Restore time during injected regression | minutes | 28 | 5
@metric Successful requests during switch | % | 19444/20000 | 19930/20000
@ref AWS · Blue/green deployment with CodeDeploy | https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments.html

### Situation and scope

A service currently restores a prior VM image when releases fail. The next release must keep compatible reads and writes while traffic can return to the previous version in under six minutes. Scope the exercise to application and routing changes. Keep destructive database changes out of the same release.

### Plan and execution

Provision the green environment from versioned configuration. Compare identity, secrets access, probes and the steady-state resource model with blue. Apply additive schema changes and test both versions against them. Mirror safe requests before a limited traffic shift. Inject elevated timeouts in green and record when automated or manual traffic redirection begins.

### Rollout and handover

Use explicit health gates and retain adequate blue capacity. Confirm sticky sessions and in-flight work before releasing a cohort. Stop on mismatched writes, lower success rate or sustained tail latency. Leave a signed diagram of routing ownership, rollback commands, post-revert verification and the date blue can safely be retired.

### How to read the numbers

Each scenario handles 20,000 synthetic requests and uses an equivalent fault. Restore time runs from incident declaration to a passing service check. The example shows a shorter rollback at the cost of temporary parallel capacity. Data compatibility remains a separate gate.

## Retire a legacy API version without losing callers
@meta api-contract-retirement | Preserve compatibility, migrate consumers with evidence, and use traffic logs to decide when retirement is safe.
@flow Build consumer inventory | Publish fixtures | Migrate callers | Disable after observation
@metric Calls still using old version | % | 26000/100000 | 800/100000
@metric Approved consumer contract checks | % | 29/32 | 32/32
@ref Microsoft Azure Architecture Center · RESTful web API design | https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design

### Situation and scope

A partner API is replacing an ambiguous status field and needs a new response contract. Existing clients continue operating during the change. Define success as all known consumers passing their contracts and no old-version traffic in a window long enough to include monthly or quarterly consumers.

### Plan and execution

Inventory callers with scoped access logs and named owners. Separate structural compatibility from behaviour: unknown enum values and reordered pagination may still break a caller. Keep the legacy version available, add a new contract and publish fixtures for cancellation, pagination and idempotent retries. Replay representative requests, and let downstream teams sign off on relevant cases.

### Rollout and handover

Roll out behind a versioned route and monitor consumer-specific errors, latency and old-version calls. Give each owner the deadline and a recovery option. Keep contract negotiation in the gateway until legacy traffic reaches the agreed retirement gate. Return a deliberate retirement response only after the review is complete.

### How to read the numbers

Old-version share falls from 26% to 0.8% across equal synthetic request samples. The 800 remaining requests are enough to hold retirement even though all version-two contracts pass. Investigate batch windows and unknown consumers before disabling the route.

## Fail over a single-writer service without accepting two writers
@meta regional-failover-fencing | Rehearse a regional outage with a fenced write authority, tested client reconnects and reconciliation.
@flow Declare failure | Fence primary writes | Promote replica | Verify ledger and route
@metric Time to restore approved writes | minutes | 74 | 19
@metric Acknowledged records absent from promoted ledger | records | 210 | 19
@ref AWS Well-Architected · Disaster recovery strategies | https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html

### Situation and scope

A regional inventory writer has an asynchronous replica. The rehearsal includes loss of routing to the primary while old clients might still reach it. The service target is less than 25 minutes to restore writes and a documented data loss boundary. An additional acceptance test verifies only one writer remains authorised.

### Plan and execution

Assign promotion to a named operator and design a fencing mechanism that stale clients cannot bypass. Capture replica replay state and the last acknowledged transaction available from the source ledger. Exercise dependencies such as keys, DNS caches and client connection pools. Inject partial network failure instead of assuming the old region is gone.

### Rollout and handover

Trace the sequence from declaration through a representative inventory update. Halt if the write authority cannot be established or evidence for the recovery point is missing. Reconcile writes before returning the old region to service. Record the exact promotion sequence, data repair escalation and rollback boundaries.

### How to read the numbers

Counts are missing acknowledged records checked against a dedicated fixture ledger. They do not equal minutes of data loss, which also depends on the timestamps and incident reference. The runbook must communicate both the time gap and the record-level consequence.

## Move the nightly batch with a watermark and a replay plan
@meta nightly-batch-watermark | Backfill historical reports, reconcile by business date, and cut over only after catch-up.
@flow Snapshot history | Backfill by business date | Replay from watermark | Compare published totals
@metric Rows disagreeing at daily cutoff | % | 640/800000 | 8/800000
@metric Completion time after cutoff | minutes | 155 | 82
@ref Apache Airflow · Backfill | https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html

### Situation and scope

A shipment report moves from a scheduled script to an orchestrated pipeline. Retain the old report until late events, corrections, time zones and holidays stay consistent. Agree on pacesetter checks for completion within 90 minutes and zero unexplained discrepancies.

### Plan and execution

Create immutable snapshots of the source for reproducible comparisons. Backfill business-date partitions separately from live processing so history can be retried without duplicating outputs. Record a source watermark or equivalent cursor. Apply new records from that point and rebuild affected partitions on late corrections. Compare record counts, distinct IDs and totals per source and business date.

### Rollout and handover

Allow a limited release covering one reporting audience. Publish one authoritative output at a time and retain the old path until consumers confirm their cutoffs. Monitor freshness and unprocessed inputs. Provide operators a command to re-run one partition safely and a sign-off checklist for taking the old job out of rotation.

### How to read the numbers

The same 800,000 fixture records and correction list feed both runs. The candidate meets the time target and has eight unexplained differences. Keep the date partition on the old system while the owner resolves the eight records.

## Move service provisioning from tickets to a supported path
@meta self-service-provisioning-pilot | Give a service team a versioned route from accepted request to policy-compliant deployment.
@flow Accept request | Create versioned service | Run required checks | Verify first healthy deployment
@metric Median elapsed time for completed attempts | hours | 30 | 6.5
@metric Completed during the 72-hour observation window | % | 9/10 | 8/10
@ref CNCF · Platforms White Paper | https://tag-app-delivery.cncf.io/whitepapers/platforms/

### Situation and scope

A department depends on a shared queue for repositories, identity and target environments. Pilot one service type in the same approved environment for both paths. Require faster successful deployment without fewer completions, with no widening of permissions.

### Plan and execution

Capture what the tickets actually authorise. Build a versioned template that provisions ownership, pipeline and runtime prerequisites, references approved secrets, and runs a health check. Start timing from an accepted request and use the same end gate. Require platform owners to review unresolved requests and watch support load. Keep track of opt-outs.

### Rollout and handover

Offer the pilot to a representative group and keep a path for exceptions. Test recovery after a partial provisioning failure. Reconcile all created resources to service ownership, including those attached to failed attempts. Document template upgrade responsibility and repeat the [onboarding worksheet](/insights/platform-engineering-idp-2026/#measurement-worksheet) after fixing the largest blocker.

### How to read the numbers

There are ten attempts in each synthetic cohort. The medians cover completions only. The candidate saves time for the services that deploy and misses the stated completion gate. It is ready for more diagnosis, with wider rollout held.
