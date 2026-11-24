# Architecture audit

## Find the timeout budget that checkout can actually meet
@meta checkout-timeout-budget | Trace a slow checkout through its retrying dependencies and verify a bounded request budget.
@flow Checkout entry | Payment authorisation | Order commit | Trace and error-budget review
@metric End-to-end p95 | ms | 1840 | 790
@metric Timed-out requests | % | 38/2000 | 9/2000
@ref Google SRE · Implementing SLOs | https://sre.google/workbook/implementing-slos/

### Situation and scope

A retailer's checkout times out occasionally while its payment provider dashboard looks healthy. The audit covers one checkout route, from request receipt to committed order or terminal error. A good pilot sustains an end-to-end p95 below 900 ms at the same offered load, preserves idempotency, and keeps an uncertain authorisation from being mistaken for failure.

### Plan and execution

Join order and payment spans with an opaque request identifier. Group by authorisation response class and inspect the critical path, including queueing and retry backoff. Avoid adding percentiles from separate hops. Construct a laboratory replay with the same request mix, a provider stub, and an explicit long tail. Compare an inherited retry policy to a route where the total deadline propagates and discretionary work runs after the response.

### Rollout and handover

Review payment semantics with the order owner. For a request with an uncertain result, query or reconcile by the stable idempotency key. Run the candidate route for a small, stable cohort and stop on rising terminal errors, failed reconciliation, or multiple authorisations. Deliver a latency breakdown, budget table, dashboard, and a runbook showing how to trace a failed checkout.

### How to read the numbers

Each simulated 2,000-request run uses the same arrival schedule, workload and stub response sequence. Latency includes completion and timed-out responses. The improved timeout rate is consistent with a better budget in this replay. Provider outages and production demand are outside the experiment.

### Allocate the stopwatch before the first call

Carry one deadline across the route. In an illustrative 900 ms budget, the gateway and request validation might spend 100 ms, inventory and pricing together might spend up to 200 ms, and the payment path might receive 450 ms. The last 150 ms goes to response construction, scheduling delays and other overhead. These are design limits for an experiment. They are separate from the measured endpoint p95. Use the remaining time on each call and retry only when enough of it remains to attempt a transaction usefully. A deadline shared by parent services prevents the total of individually reasonable timeouts from exhausting the customer's window. [AWS Builders' Library on retries and timeouts](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)

### Observe the durable result after a timeout

Include three named variants in the fixture. Delay the payment request until it expires before commitment. Commit the payment and drop the response. Finally, finish the checkout within budget and make a background notification fail. Inspect order and payment identifiers for each request and reconcile the fixture ledger after the retry period. An ambiguous response should lead to a status check or a repeat with the same idempotency identity, according to the payment interface's contract. The notification failure should stay visible in its own monitoring.

The example has 29 fewer request timeouts across equal arrivals. That comparison says little about incorrectly completed orders unless the reconciler accounts for every request that timed out. Keep a results column for correctly failed or deferred checkouts and one for pending or ambiguous payment commitments. A route that responds quickly while leaving more commitments unresolved does not pass the same acceptance gate.

## Separate queue delay from worker processing time
@meta queue-age-investigation | Diagnose queue ageing by measuring admission, start and completion under a fixed arrival schedule.
@flow Job admitted | Worker claims job | Processing and acknowledgement | Queue-age review
@metric p95 admission-to-start delay | minutes | 42 | 11
@metric Jobs done within 30 minutes | % | 850/1000 | 962/1000
@ref Google SRE Workbook · Monitoring | https://sre.google/workbook/monitoring/

### Situation and scope

End-of-day exports fall behind despite modest average CPU. Scope the audit to a FIFO batch with two job sizes. Set an acceptance target of 95% done within 30 minutes, and keep the completion threshold for smaller jobs while reducing large-job backlog. Keep queue wait and processing time separately visible.

### Plan and execution

Capture enqueue, claim, finish, and final acknowledgement from a common time base. Include failed jobs in the completion denominator and retain attempt identifiers beside logical job identifiers. Replay 1,000 jobs with a majority of short exports and a burst of long reports. One hypothesis is that long work consumes all executor slots. Test separate concurrency budgets for exports and reports before changing total capacity.

### Rollout and handover

Verify worker restart behaviour, lease expiration and redelivery. Start by segmenting a known queue with explicit routing ownership. Stop on delivery starvation or increased failed acknowledgements. Hand over the routing rule, queue-age dashboard and scale-out limit. Notify the team when unresolved jobs approach the user wait budget even if CPU remains low.

### How to read the numbers

The p95 wait is calculated on jobs that reached a worker during each run. Completion counts retain all admitted jobs. The two populations answer different questions. Replay again with the long-job fraction doubled before adopting the same pool weights elsewhere.

### Make the lifecycle visible across worker attempts

Emit immutable timestamps for admission, first claim and durable completion. Include an attempt ID, job class, and worker pool on claim and completion events. Measure both first-claim delay and user-visible end-to-end time. After a release, redelivery can raise queue delay and repeat processing inside a single job. Keep that distinction when grouping multiple attempts under one job identifier. Use a consistent clock source where possible, and flag observations where clock skew makes a duration impossible.

Measure completion against the 30-minute target from the admission timestamp. With 1,000 jobs in each sample, the baseline's 850 qualifying jobs leave 150 misses and the candidate's 962 leave 38. The decrease is 112 misses. Examine the 38 remaining jobs by class, largest waits, number of attempts and dependency time. Compute end-to-end percentiles from joined job records. Separate queue and service percentiles may reflect different jobs at the tail.

### Confirm that the faster queue still treats job classes fairly

Replay a burst of short jobs immediately before the slower class becomes eligible. Record admission and start counts for each class and the maximum age among still-open work. Check if particular accounts are regularly crowded out and whether jobs that are redelivered can keep ahead of jobs that have never started. Retain a way to return to the earlier scheduling rule and watch for lingering in-flight work from the candidate deployment. Compare both variants with the same initial backlog, capacity and cutoff.

Record the worker software and queue policy versions with the run.

## Audit repetitive work before buying an automation project
@meta on-call-toil-baseline | Distinguish recurring operator effort from novel investigation and estimate the cost of a safer replay path.
@flow On-call diary | Reconcile tickets | Pilot idempotent replay | Review net effort
@metric Manual effort and upkeep | hours per fortnight | 24 | 11
@metric Batch jobs requiring intervention | % | 32/1200 | 14/1200
@ref Google SRE Book · Eliminating Toil | https://sre.google/sre-book/eliminating-toil/

### Situation and scope

An operations team has a recurring task: rerunning jobs that failed after a retryable warehouse timeout. A pilot should recover at least six person-hours per week, keep reporting on time and preserve one reliable mechanism to identify what the rerun changed.

### Plan and execution

Log hands-on time for each operator during two weeks, including confirmation and cleanup. Trace the trigger and compare tuning the timeout with a bounded replay proposal. Define the replay scope from business date and job ID. In a lab, inject a timeout immediately before and immediately after commit. Confirm that the replay checks job identity and refuses a partial item whose prior outcome cannot be determined.

### Rollout and handover

Test with one low-impact pipeline and leave the duty engineer a documented manual fallback. Record alert volume and operator reviews after rollout. Assign code ownership alongside the upstream batch team, so repeated exceptions have a permanent owner. Deliver the inventory and audit data alongside the [toil worksheet](/insights/sre-toil-reduction/#measurement-worksheet).

### How to read the numbers

The follow-up contains nine hours of manual work and two hours of upkeep. Across two equally scoped windows the example releases 6.5 hours per week. The intervention rate is based on unique jobs. Neither measure estimates customer impact unless freshness and correctness are checked separately.

### Build an operator log that can be audited

Attach the incident, ticket or alert identity to each intervention and record active minutes by person. A half-hour handoff between two operators can consume one person-hour when both spend the full time. Record wall-clock waiting separately. Define how a new failure mode is classified and measured when it becomes a repeat operation. Group time by trigger and desired outcome so several alerts from the same recurring interruption do not each receive the full operator cost. [Google SRE Workbook on eliminating toil](https://sre.google/workbook/eliminating-toil/)

The candidate uses nine hours of direct work and two hours of upkeep per fortnight, against 24 hours previously. That is a reduction of 13 person-hours per fortnight. Add three hypothetical hours of exception handling in the same period and the gain falls to five hours per week, below the six-hour goal. This gives the operator a concrete reason to keep collecting follow-up work after the first trial.

### Rehearse the handoff on a partly finished operation

Make the action log record the input identifier, operator or automation identity, previous checkpoint, decision and expected final state. Simulate an interruption between commitment and checkpoint acknowledgement. Ask the next on-call engineer to identify which downstream effect already happened before allowing a replay. Verify that escalation gives an operator the context needed to finish safely when the action cannot proceed automatically. A reduction in intervention count can hide a smaller set of harder incidents, so compare the remaining events and the longest operator sessions alongside total time.

## Diagnose a PostgreSQL plan that changes with the tenant
@meta postgres-tenant-query-plan | Compare plans for skewed tenant sizes and validate a targeted index under read and write load.
@flow Query fingerprint | Small and large tenants | Plan and buffer analysis | Mixed workload replay
@metric Dashboard query p95 | ms | 760 | 155
@metric Insert p95 | ms | 28 | 34
@ref PostgreSQL · Using EXPLAIN | https://www.postgresql.org/docs/current/using-explain.html

### Situation and scope

A tenant dashboard in a shared database is fast in development and slow for large tenants. The audit covers one read fingerprint and its write dependencies. Require read p95 below 200 ms and insert p95 under 40 ms at the same offered load. Include index space and write amplification in the recommendation.

### Plan and execution

Capture representative parameter sets for large and small tenants in a redacted fixture. Compare estimates and actual rows with EXPLAIN on a restored staging database. EXPLAIN ANALYZE executes the statement. Use controlled snapshots and run both warm and cold tests. If recent rows are requested per tenant, test a candidate index that matches the query's filter and sort, then check plans across tenant sizes and the resulting write overhead.

### Rollout and handover

Choose a low-traffic creation window, monitor old transactions and disk headroom, and verify the index reaches a valid state before rollout. Reuse the same query fingerprint in the production dashboard. Hand over a query capture recipe and a clear fallback: disable the query change or revert the index when it is safe to do so.

### How to read the numbers

Illustrative p95 values come from separate 30-minute runs replaying the same 12,000 reads and 6,000 inserts. Faster reads coincide with slower writes. Investigate the hottest tenant and storage growth before broad adoption.

### Inspect the plan at more than one tenant size

Start with the exact statement, parameters and sort order used by the application. Choose small, median and large tenants from the fixture. For an endpoint that filters by tenant and status, then returns the latest 50 records, compare a candidate B-tree keyed on tenant, status and creation time with the existing plan. Check if that shape also fits queries without a status filter. Review estimated and actual rows, plan loops, buffer activity and sorting before assigning the effect to a single index. EXPLAIN ANALYZE executes the statement, so use a representative staging environment for experiments with writes or costly queries. [PostgreSQL on reading query plans](https://www.postgresql.org/docs/current/using-explain.html)

Check whether the application prepares statements and whether the same statement receives a generic plan or a custom plan for its parameters. Test with the connection behavior used in production and run the replays on equivalent snapshots. A good plan for one tenant does not establish that the estimate remains sound at another tenant size. [PostgreSQL PREPARE](https://www.postgresql.org/docs/current/sql-prepare.html)

### Record the cost paid by writers

The example finishes with read p95 of 155 ms and insert p95 of 34 ms. The read has 45 ms of room below its 200 ms gate. The insert has 6 ms below 40 ms. Repeat the paired read/write load during a busier period before expanding. Include index size and observed write-ahead log volume in the evidence, and agree on a revert trigger that uses both read and write results.

## Prove a restore meets the recovery objectives
@meta recovery-restore-test | Recover a clean database snapshot and measure service restoration and the latest recoverable commit.
@flow Choose failure boundary | Restore isolated data | Verify application invariants | Handover approval
@metric Service recovery time | minutes | 134 | 51
@metric Latest recoverable data gap | minutes | 25 | 8
@ref NIST · Contingency Planning Guide for Federal Information Systems | https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final

### Situation and scope

A document service advertises backups but has never timed an application-level recovery. The scoped failure is loss of its primary deployment. Business owners accept at most 60 minutes until normal use resumes and 10 minutes of lost acknowledged writes. Start the clock at incident declaration and stop after a representative application transaction passes.

### Plan and execution

Inventory database snapshots, replay logs, key access, application configuration and object versions. Restore into an isolated environment and point the application at the recovered data. Compare checksums and count sampled documents against snapshot metadata. Introduce a deliberately broken credential and a missing object version in separate rehearsals to verify that the runbook detects incomplete recovery gates.

### Rollout and handover

Update the restore job, staged credentials and owner escalation. Require a service owner to perform the second rehearsal using the runbook. Deliver the measured timeline, latest safe transaction timestamp, exception method and recurring test schedule. For a production disaster decision, identify who authorises traffic cutover and confirms write reconciliation.

### How to read the numbers

Compare one simulated initial and one improved exercise against the same failure and restored data size. The time and data gap are separate objectives. Rehearse more than once and vary workload volume before treating the results as a reliable recovery commitment.

### Build a test ledger independent of the service

Seed a small number of durable writes with known identifiers and timestamps near the disruption. Keep an independent expected record for comparison and document which time represents service failure. Verify the backed-up database, object version and the encryption key that can open the restored data. Use isolated restore destinations and disable outbound notifications until an operator has verified that the recovery environment cannot write back to the original store or notify customers accidentally. [AWS Well-Architected recovery testing](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_periodic_recovery_testing_data.html)

Capture one clock reading at disruption and more as the team obtains access, loads data, applies logs, restores dependencies and completes a verified transaction. Include manual wait time. The example's 51-minute completion leaves nine minutes for unexpected delay under the 60-minute threshold. The eight-minute recovery gap leaves two minutes under the ten-minute threshold. If key access takes ten minutes longer and all other steps stay the same, the approach would miss the time objective, even if the recovered data is equally fresh.

### Review the evidence before making the next drill harder

Have another operator repeat the run from the instructions and confirm the same most recent intact write and related object data. The status page or a green health probe alone cannot account for a partial restore. Keep the backup identifier, integrity checks, transaction evidence and failure timestamps with the run. Record omitted dependencies and pick the one most likely to change the measured time or recovery point for a later drill.

## Attribute cloud spend to completed units of work
@meta order-unit-cost-audit | Reconcile service costs and completed orders to expose the unit cost even while absolute spend grows.
@flow Billing export | Service allocation map | Deduplicated order ledger | Reconciled unit cost
@metric Allocated effective cloud cost | USD | 240 | 280
@metric Unique completed orders | orders | 1200 | 2000
@metric Allocated cost per completed order | USD per order | 0.2 | 0.14
@ref FinOps Foundation · Unit Economics | https://www.finops.org/framework/capabilities/unit-economics/

### Situation and scope

An order service costs more this week, while its operator believes a batching change improved efficiency. Constrain the exercise to the same service, cost basis, currency and seven-day boundaries. Require the sum of direct, shared-allocated and excluded amounts to reconcile to the scoped export before using the unit rate in an investment decision.

### Plan and execution

Map charges to an owner and separate shared gateway and database costs from directly attributable usage. For the gateway, allocate by request share and show the unallocated remainder. For the order denominator, resolve the terminal completion event by order identity. Retry costs remain in the numerator. Test whether an alternative shared driver changes the conclusion.

### Rollout and handover

Provide billing and business owners with paired aggregates and an audit trail from rates to source categories. Version the allocation rule and record its effective date. Include a late-arrival and zero-volume policy in the [cloud unit-cost worksheet](/insights/cloud-unit-economics/#measurement-worksheet). Review service-level performance at the same time.

### How to read the numbers

In the synthetic comparison spend rises 16.7%, orders rise 66.7%, and cost per completion falls 30%. The calculation does not isolate the effect of batching from traffic mix, provisioning or changes in retry volume.

### Separate volume growth from the change in the unit rate

At the baseline rate of $0.20, the candidate's 2,000 completed orders would carry $400 of effective cost. The candidate's modeled cost is $280, or $120 below that volume-normalized comparison. Observed spend across the two example periods actually increases by $40. The $120 difference describes what the accounting comparison yields under a constant baseline rate. It cannot be assigned to a specific engineering action without more evidence. Workload mix, credits, uptime, and shared capacity utilization can all change the rate. [FinOps Foundation on unit economics](https://www.finops.org/framework/capabilities/unit-economics/)

### Publish a small ledger others can reproduce

Write one record per day with the effective cost field, included accounts, currency, list of excluded charges, and the identifier of the allocation rule. Build the denominator from persisted completions, collapsing duplicate events for the same order. Use the same cutoff and known treatment of late completions for all windows. Include retry and cancellation costs if those attempts belong to the scoped service, and count admitted and abandoned orders separately. This makes it easier to spot a period that appears cheaper because fewer expensive journeys finished.

Check usage and costs by product or delivery class. A change in the share of expensive routes can drive a rate movement without any efficiency change within a route. Leave behind the reference ledger, reproducing query, result owner and criteria for comparing the next month.

## Audit Kubernetes capacity before adjusting requests
@meta kubernetes-capacity-audit | Test requests and reserved capacity against a controlled burst and a node-drain rehearsal.
@flow Collect usage and throttling | Replay peak traffic | Drain a node | Approve workload budget
@metric Requested CPU in the pool | vCPU | 80 | 62
@metric Service p95 under peak replay | ms | 220 | 247
@metric Requests meeting latency objective | % | 19840/20000 | 19792/20000
@ref Kubernetes · Resource Management for Pods and Containers | https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/

### Situation and scope

A cluster has enough aggregate CPU utilisation headroom, yet new Pods queue for a node. Scope one deployment and one node pool. Success requires lower reserved CPU while maintaining the service's p95 under 260 ms and at least 98.5% of requests within the service objective.

### Plan and execution

Compare requests, limits, actual CPU, throttling and memory under steady traffic, burst and a drain. Distinguish a scheduler fit problem from a runtime saturation problem. Test a lower CPU request with the application and autoscaling owners. Hold limits and traffic mix constant for the first comparison, and account for any horizontal autoscaler tied to utilisation as a proportion of requested CPU.

### Rollout and handover

Change one pool and keep the old deployment manifest available. Watch unschedulable events, restart reasons, replica churn and latency at peak. Roll back if the threshold is missed or if a planned node drain violates workload availability. Document whether the observed request reduction can actually remove a node or avoid a future purchase.

### How to read the numbers

Both replay runs contain 20,000 requests. Headroom improves in the scheduling model while p95 worsens in the replay. The pilot still meets its illustrative gate. Actual capacity savings depend on bin packing, redundancy and billing.

### Show where the remaining capacity is usable

Capture allocatable resources and requested capacity per node and zone. Overlay replica placement, reserved system resources and memory constraints. A pool may have enough aggregate CPU to survive a drain while each eligible node lacks room for a large replacement pod. In the drill, inspect how long evicted replicas remain unavailable and check whether new replicas start on an allowed node. Record what happens to readiness and in-flight tasks during replacement. Set the disruption budget and rollout controls before repeating the drain under burst load. [Kubernetes on safely draining a node](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)

The candidate's 247 ms p95 leaves 13 ms below the 260 ms limit. Successful requests decrease from 99.20% to 98.96%, with 48 more failures across 20,000 arrivals. That still meets a 98.5% minimum in this specific fixture. The loss of margin matters if the production arrival mix is heavier on CPU or the load runs for longer than the replay.

### Name the event that would release spend

Document whether the next action is to remove a node, defer a purchase, or move the headroom to another workload. Compare the candidate with the same committed spend and minimum fleet settings. Before changing any settings across the entire estate, deploy to one representative slice and observe both a normal peak and a planned drain. Keep the old requests and controller settings together for recovery.

## Reduce unused privilege without breaking service ownership
@meta cloud-permission-audit | Review workload grants and replace broad identity policies with tested service-specific access.
@flow Identify workloads and owners | Map permissions to actions | Test narrow policies | Record exceptions
@metric Approved identity grants | grants | 162 | 104
@metric Required workflow checks passed | % | 48/48 | 48/48
@ref AWS IAM · Security best practices | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

### Situation and scope

A platform migration left multiple workloads with a shared broad role. Review the identities of two non-interactive services. Acceptance requires every required workflow to pass with its new role and each exception to have a named owner, expiry and justification.

### Plan and execution

Map identities to code owners and intended resource use. Use observed access as one input. Include recurring jobs, monthly reconciliation and recovery permissions that a short observation period might miss. For each candidate policy, test expected success and denial cases in a staging environment. Keep human recovery access separate from routine service access, with authorised operators and a documented review trail.

### Rollout and handover

Switch one workload at a time, watch authorisation errors and compare task completion. Preserve a documented and time-bounded recovery option if critical operations fail. Have the owning team sign off on the test matrix and schedule a re-review after the next monthly job.

### How to read the numbers

The grant count uses a consistent definition in both scenarios: one identity-action-resource entry after normalisation. The 48 checks cover only the listed workflows. A lower grant count is evidence of reduced scope in this simulation. Review effective inherited permissions and resource sensitivity separately.

### Score the proposed changes with an authorization matrix

Keep one row per workflow and include its principal, approved resource, expected action, and the context required for access. Mark scheduled or emergency operations explicitly. Use recent recorded activity to find candidate grants for review. Confirm applicability with the workload owner before removing permissions for an infrequently used process. AWS IAM Access Analyzer can generate a policy from supported CloudTrail activity, with limitations on how much action-level detail is available. Treat that output as one input to review. [IAM Access Analyzer policy generation](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-policy-generation.html)

In authorized staging, test an approved action, removal of an obsolete action, a request scoped to an unrelated test resource, and expiry of approved emergency access. Verify both the expected decision and audit evidence. Review the resource policy, role trust and any applicable boundaries or organization-level restrictions for each tested principal. This helps prevent a policy edit from shifting trust in an unexpected way.

### Agree on how far the evidence extends

The example has 58 fewer grants on the same counting basis, a drop of about 35.8%. The count gives equal weight to every grant in the inventory. The 48 passing expected workflows cover their recorded scope and the fixture's approved conditions. Keep the redacted comparison, the list of explicitly checked denials, and the expiry and owner of any time-limited exception. At the next release, run the matrix again for changes to identity or resources.
