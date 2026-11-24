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
