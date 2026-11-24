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

### Compare status meaning across implementation boundaries

Build fixtures for a multi-item order that spans different fulfilment states, a refund that has been initiated but has yet to settle, and an order whose latest event falls just after the projection watermark. Use the fixture ledger to specify the expected status, order-level totals and the timestamp recorded by each implementation. Record which differences are explained by a known delay and retain them in the measurement with their classification. Validate authorization independently for both readers. Return a status only when the requester remains entitled to view the order. [AWS Prescriptive Guidance on the strangler fig pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html)

The candidate shows four discrepancies against the comparison rule, or 99.96% agreement. With a sample of 10,000, the 99.9% minimum allows ten. Review the four individually. A refund labeled complete too early can merit a hold even when the average passes. Use separate gates for authorization failures, incorrect customer-visible state and excessive projection lag.

### Keep the cohort switch reversible

Save the routing configuration and cohort definition alongside the comparison report, including the version of canonical status rules. During an exercise, pause the projection while legacy continues to receive order updates. Confirm that the lag rule triggers the agreed fallback and that a caller sees an appropriate state after switching. Once the projection catches up, rerun the statuses most sensitive to event order. Record which service owns the source data and when the fallback starts to depend on a second maintained path.

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

### Trace one order across four durable records

Store an immutable order identity, event identifier and schema version when the order transaction commits. Follow it into the outbox, the broker, and the consumer's local effect ledger. A useful reconciliation report shows the latest observed position at each step. Use the appropriate ordering key when a consumer must process successive changes to the same order in sequence. Validate retention for replay before trimming publication evidence. If a replay can outlive the consumer's deduplication records, establish another safe recovery method for the older events. [AWS Prescriptive Guidance on the transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

### Find the boundary of each unresolved event

Take the four misses in the fixture and classify them by the furthest durable record seen at the ten-minute cutoff. A pending outbox row suggests checking the publisher, while a delivered event without a recorded effect directs the investigation toward consumer handling. A sent acknowledgement without a downstream audit record remains an unresolved finding. At replay time, preserve the original event identity and log a separate replay attempt. Prove that republishing a delivered event does not repeat the business effect.

The baseline misses 71 of 50,000 events, or 0.142%. The candidate misses four, or 0.008%. The improved rate still fails the requirement to reconcile every order by cutoff. Capture what happens after minute ten to distinguish eventual delivery from a persistent loss. Report both categories so that quicker processing and successful recovery can be assessed independently.

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

### Prove that balanced totals contain the right postings

For each fixture event, compare the posting account, sign, currency code, original amount, posting date and reversal link. Keep precision appropriate to the currency and approved calculation rule. A balanced ledger can still contain an entry on a wrong account. An incorrect debit and correcting credit can also leave an aggregate unchanged while producing an incorrect journal. Keep a breakdown per account and currency together with the line-level results. Agree on how identifiers from the older system map to the candidate before any comparison starts.

Create one adversarial fixture for two reversals arriving on different business days, one for late adjustments after close, and one for a small rounding difference across multiple component charges. In each case, have a reviewer state whether any divergence is covered by an approved rule. Preserve the input, posting rules version, and exception decision. A new rule warrants rerunning earlier examples before signing off.

### Make the sign-off window meaningful

The fixture's review time falls from 97 to 46 minutes, a reduction of 51 minutes. Capture how much time went into gathering evidence versus reviewing exceptions in the next run. A lengthy month-end review could still emerge if a different transaction class dominates. Rehearse a traffic freeze using a known sequence watermark and prove that a paused business event resumes exactly once in the authoritative ledger. Retain the relevant approvals and reconciliation results for the finance and engineering owners.

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

### Confirm that data written during the canary remains usable

Build a compatibility matrix for a blue reader with green-written records, a green reader with existing records, and workers of each version receiving messages from either. Use test identities so derived state can be inspected and deleted after the exercise. Include a value only the candidate normally writes. If blue cannot read it safely, guard new writes with a separately reversible switch, or delay emitting the new value until the rollback window closes. [AWS CodeDeploy deployment types](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployments.html)

The synthetic green exercise has 70 unsuccessful requests versus 556 in the prior approach. That compares request outcomes within the replay, even though the selected release indicator is the five-minute restoration of an agreed service check. During the next drill, publish a timeline that distinguishes detection, decision, traffic change and recovery. Measure the declaration clock separately from the time an affected customer first encountered a failure.

### Verify both immediate recovery and delayed effects

Check the connection drain and any calls already executing when routing reverts. Reconcile work in queues, customer-visible writes and duplicate request identities after retries can arrive. Verify blue's capacity and configuration once it is handling the full exercise load. Keep a time-bounded decision on whether green should remain quiescent for diagnosis. Hand over the original configuration, the observations that justified rollback, and the evidence required before attempting promotion again.

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

### Give each caller an independently verifiable exit test

Use a scoped identifier for each known integration and track its last old-version call, proposed rollout date, responsible owner and contract-test status. Capture a complete pagination walk, including equal sort keys and a boundary after a cancellation. Add a retry fixture that sends the same operation identifier following a lost response. The expected result should match the contract used by the client. Test up-to-date and supported older client versions where both exist. [Azure Architecture Center on web API design](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)

A header can announce a retirement date, with documentation and a named escalation channel. The HTTP Sunset field signals the time after which a resource is expected to become unresponsive. Send partner notices through the agreed support channel as well and follow up with owners of active outdated callers. [RFC 8594 on the Sunset HTTP header](https://www.rfc-editor.org/rfc/rfc8594)

### Explain the decision to keep the old version available

A fall from 26% to 0.8% leaves 800 calls to investigate. The count alone cannot show how many integrations are still relying on that route. Group calls by authorized consumer and business function and examine them across the billing or batch cycle identified during planning. A synthetic check can be separated from live demand when its identity has been verified. A small remaining integration can still depend on essential quarterly processing. Record coverage of such windows and the owner who approved retirement after the gate passes.

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

### Require the writer to prove current authority

Use a promotion design whose decision can be checked at the point that accepts a write. For a design with an epoch per writer, the authoritative storage path must reject operations carrying an earlier epoch after promotion. Changing DNS while cached clients can still reach the old source does not by itself provide that guarantee. Rehearse a failed link between regions while both sites remain otherwise responsive. Use controlled identities and fixture records to verify that a previous writer is rejected and the approved writer succeeds. Store the epoch, promoted role, and observed write behavior with the decision record.

### Reconcile the consequence of asynchronous replication

The fixture records 19 minutes to resume approved writes, leaving six minutes below the target. The 19 acknowledged records missing from the promoted ledger need individual disposition. Capture their timestamps and sequence identities from the independent test ledger. Distinguish writes absent from the promoted state from requests that were never acknowledged, and deduplicate any replay of approved business events. Report the earliest and latest missing acknowledgements alongside the last contiguous intact record. [AWS disaster recovery strategies](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html)

Define what happens before reconnecting the previous region. It may need to rejoin from the current authoritative state after disputed writes are reconciled. Ask the operator to explain which role is allowed to accept each write throughout the recovery. A repeated attempt should pause if the team cannot establish that fact from its evidence.

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

### Give every replay a defined input boundary

Record a source cursor and snapshot reference together. Business date determines the destination partition. The cursor determines which inputs arrived after the snapshot. A shipment corrected after month end can have an old business date and a new source position. Feed that event into the affected partition and compare totals against the original published version. Test two events with the same timestamp and a rerun after partial output. Use a deterministic tie-breaker for cursor order where necessary. Publish only after the partition has been validated. [Apache Airflow backfill concepts](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/backfill.html)

### Check which differences can affect a published report

The trial completes in 82 minutes, leaving eight minutes under the 90-minute gate. Its eight mismatches correspond to 0.001% of the fixture records. The count does not capture business impact because a few shipments can carry a material share of revenue or service penalties. Inspect the differences by carrier, day, status and financial amount, with the cause and evidence on each row.

Simulate an overlapping scheduled run and historical backfill. Prevent both from publishing the same business-date partition concurrently. Verify that an interrupted attempt can run again with the stable inputs and does not duplicate published rows. Store the source cursor, code and calendar versions, and reviewed checks with the finished partition. A downstream consumer should be able to identify which version supplied its report.

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

### Locate the paths a completed-attempt median hides

Instrument accepted request, ownership registration, repository creation, policy decision, deployment and verification as distinct events under the same attempt ID. Record retries and time waiting for support. Check which step was in progress at the 72-hour cutoff for the two unresolved candidate attempts. For example, a missing ownership mapping requires a different fix from an environmental approval that has to wait for a particular operator. Use interviews and event evidence together. Keep all attempts in the completion rate and identify the smaller denominator used by the elapsed-time median. [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)

### Recover a partially provisioned service safely

In staging, let provisioning create a repository, then fail before it attaches the workload identity. Retry under the same request identity and check whether the repository is reused and bound to the approved owner. For an abandoned request, use the agreed review process for any resources created by the failed attempt. Verify that a recovery does not attach broader permissions or silently omit a required policy step.

The median falls from 30 to 6.5 hours for completed attempts, while completion falls from 90% to 80%. Check the leading cause of the two unresolved candidate attempts and rerun the pilot with representative service teams. Compare support load, permissions and both timing measures before widening use.
