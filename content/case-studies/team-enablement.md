# Team enablement

## Teach Kubernetes rollout recovery by handing the learner a broken release
@meta kubernetes-rollout-lab | Have each learner diagnose a stalled deployment, restore service and explain the recovery evidence.
@flow Read deployment state | Identify failed readiness | Roll back a revision | Validate a service request
@metric Unaided restorations within 20 minutes | % | 4/12 | 10/12
@metric Median time among completed restorations | minutes | 19 | 12
@ref Kubernetes · Deployments | https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

### Situation and scope

A team can apply a manifest in a prepared demo. The organisation wants learners to investigate and restore a service independently. Success requires a healthy application response, the intended previous image and an incident note that shows how the learner verified recovery. Use an isolated namespace and a 20-minute scored exercise.

### Plan and execution

Baseline with a short exercise using a broken readiness configuration. Demonstrate how to compare deployment progress, replica state and events. Teach that a Deployment can report lack of progress without automatically taking the desired recovery action. Use a different fault for the post-lab assessment. Require each learner to distinguish a routing symptom from a failing application.

### Rollout and handover

Give each learner their own namespace and short-lived permissions. Reset the exercise from version-controlled manifests. Ask learners to update the runbook using the failure evidence they found. The platform team owns the next assessment round and a version matrix for the training cluster.

### How to read the numbers

The fictional cohort has 12 people attempting equivalent tasks before and after practice. Medians cover completed restorations only. The change reflects one lab and may include familiarity with the assessment format. Test an unfamiliar situation later to evaluate retention.

### Distinguish an unhealthy revision from a bad test

Set up two synthetic failure variants for the lesson. In one variant the container stays up but the new readiness path returns an unhealthy response. In the other the Pod is Ready and a caller still gets an unexpected status from the application. Ask the learner to identify the revision under test, compare readiness with the user request, and record the observation that justifies recovery. Assess a fresh variant rather than replaying the same broken manifest they saw in the demonstration. The [Kubernetes Deployment documentation](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) explains progress conditions and revision rollback.

### Verify the service after rollback

Keep the previous ReplicaSet and a recorded image reference available for the exercise. Give the operator an opt-in lab request that calls the Service and returns a known fixture value and build identifier. After restoring the previous version, require evidence that the intended revision is serving and that several separate requests reach the expected build. Check that the failed candidate no longer receives traffic. Application state in the fixture can be reset between attempts. A live deployment with a one-way schema change would need a different recovery plan, so keep the lab's rollback guarantee within the isolated fixture.

In a 20-minute assessment, the clock stops after the verification request and incident note are recorded. A learner who reaches a healthy status in nine minutes but cannot identify the version serving traffic has yet to complete the exercise. Count that outcome as unfinished at the cutoff.

## Run an incident command drill that scores the first ten minutes
@meta incident-command-drill | Train handoffs, scope statements and time-based decisions during a simulated degraded service.
@flow Page responder | Assign incident roles | Confirm impact and priority | Communicate next action
@metric Median time to name incident command | minutes | 8 | 2
@metric Timed updates with impact and next check-in | % | 7/24 | 20/24
@ref Google SRE Workbook · Incident Response | https://sre.google/workbook/incident-response/

### Situation and scope

An operations team resolves incidents but leaves callers guessing who owns communication. Practice a degraded reading service with intermittent symptoms. Require a named lead within three minutes and an update that states observed impact, known uncertainty and the next check-in.

### Plan and execution

Give participants only the initial alert. Use scripted injects with a noisy dashboard and an uncertain dependency. Have one person coordinate, one person investigate, and one person communicate. Score direct observations, assignment of responsibilities and explicit decisions separately from the technical fix. Repeat the exercise with a different fault so participants cannot memorise the answer.

### Rollout and handover

Debrief using the event log. Convert two missed handoffs into changes to the incident template. Leave scripts, a scoring rubric and a named exercise lead. Schedule a later drill with an unavailable incident lead to practice role transfer.

### How to read the numbers

Four fictional teams each produce six expected updates per exercise round. The median is taken across the teams. The score supports better coordination in the simulation, while reader-facing recovery still depends on the fault and the engineering response.

### Give each update a decision to support

In one simulated run, the first page shows increased read timeouts. A later note says that background requests are also slowing down. Give these observations to different responders at scheduled times, and preserve when each one arrived. The communications lead should be able to say which user action has been observed failing and what is still being tested. A narrowly worded update helps a partner team decide whether to pause a dependent change without promoting a tentative diagnosis to a fact. The role separation follows the [Google SRE incident response workbook](https://sre.google/workbook/incident-response/).

### Rehearse a handoff while the facts are moving

Ask the incident lead to hand command to a second responder partway through the exercise. Require the new lead to state the active mitigation, the person working on it, the next decision time, and the point at which they would reverse course. The observer scores the handoff at the moment it occurs. A retrospective note can explain omissions, but it cannot fill in what a different responder needed to know during the handoff.

A scored update qualifies only if it reaches the nominated channel by its deadline and contains the observed impact and next check-in. Keep missing and late updates in the 24 expected opportunities. Score timing and content independently during debrief so teams can tell whether the message itself needed work or the communications owner was overloaded.

## Teach observability by tracing an asynchronous order
@meta trace-context-lab | Carry trace context across a queue and use the resulting graph to distinguish delay from processing.
@flow Inject request context | Propagate in message metadata | Join producer and consumer traces | Explain the delay
@metric Complete expected trace chains | % | 98/150 | 147/150
@metric Learners locating the delay unaided | % | 3/10 | 9/10
@ref OpenTelemetry · Context propagation | https://opentelemetry.io/docs/concepts/context-propagation/

### Situation and scope

Engineers have application logs and a dashboard, but cannot connect a web request to a queue worker. Use one HTTP entry and one asynchronous service. Learners pass by finding the slow stage and explaining why standalone worker latency failed to reveal it. Use an exercise backend with controlled end-to-end sampling.

### Plan and execution

Provide starter instrumentation and a broken propagation path. Use W3C trace context for the HTTP boundary and carry supported context in message metadata. Choose parent or link relationships according to the messaging semantics and explain the choice. Add timestamps for queued and processing phases. Avoid customer payloads, unrestricted baggage and identifiers that become labels with unlimited cardinality.

### Rollout and handover

Give the pair a second service with a different failure. Assess the query, explanation and privacy checks independently. Leave a troubleshooting sheet for missing spans, sampled traces and background consumers. Ask each team to adapt it once to an application it owns.

### How to read the numbers

The trace-chain denominator is 150 fixture messages per round, while the assessment denominator is ten synthetic learners. Missing instrumentation and sampling losses must be distinguished in production. This lab controls sampling to make the exercise diagnosis interpretable.

### Label the queue interval before inspecting the trace

In a synthetic order, suppose the fixture records six seconds from broker acceptance to the start of processing and 400 milliseconds from processing start to completion. The queue interval accounts for 6 of the 6.4 observed seconds after acceptance, or approximately 94%. A worker duration instrument would report only the 400 milliseconds. Capture both bounds deliberately, define what constitutes acceptance for the broker in the exercise, and use comparable clocks. If the producer timestamps and worker timestamps come from independent hosts, clock offset can distort the difference. The fixture can give both timestamps from the same observation clock.

### Test a retry and a batch

Include one fixture message delivered twice. Keep the business order identifier stable and preserve a separate attempt identifier so the learner can explain which consumer span describes each execution. Then deliver an unrelated pair in a single batch. Verify that the learner can follow both message creation contexts. The [OpenTelemetry messaging conventions](https://opentelemetry.io/docs/specs/semconv/messaging/messaging-spans/) explain how links relate a processing span to creation contexts, and the [W3C Trace Context specification](https://www.w3.org/TR/trace-context/) defines the HTTP trace context format.

The assessor queries an explicit list of expected message and attempt identifiers. An apparent gap may arise at injection, extraction, sampling, export, or the query itself. Require the learner to locate the boundary with a known good fixture before accepting a wider instrumentation change. Keep raw customer content outside the exercise and hand over the fixture record with the expected edges.

## Make a pipeline pass only with recoverable artifacts
@meta delivery-pipeline-lab | Teach promotion of one immutable artifact and prove what happens when verification or deployment fails.
@flow Build immutable artifact | Run contract checks | Promote by digest | Recover a known-good release
@metric Unaided successful promotion and recovery | % | 5/14 | 12/14
@metric Median time from seeded commit to test result | minutes | 23 | 14
@ref DORA · Continuous integration | https://dora.dev/capabilities/continuous-integration/

### Situation and scope

A development group runs build and deployment manually. The lab teaches participants to place a useful check early, promote the same artifact to a test environment, and recover without depending on a developer's workstation. Require a passing test and a previously recorded artifact digest.

### Plan and execution

Give each pair a small service, an integration fixture and an intermittent check. Teach how to isolate flaky verification, test a failing contract and publish the build result. Deploy by a recorded digest and prove the rollback points to the previous tested artifact. Simulate a runner interruption after artifact creation and verify the restarted run can recover safely.

### Rollout and handover

Assess each learner on a fresh repository with permissions limited to that exercise. Include build logs and verification output in the submission. Leave a reusable pipeline fragment and state what enterprise-specific checks belong at promotion. Review whether the team running the platform can support the pipeline without trainer intervention.

### How to read the numbers

Use fourteen paired learner attempts with equivalent workflows. Test time excludes running the later deployment exercise and measures the wait for the first useful result. An organisation would track production change and recovery measures separately.

### Freeze the candidate and replay the decision

Give the learner two artifact records from the lab. Each record carries the source revision, image digest, expected platform, verification result, and target environment. The learner submits the candidate digest and the evidence that belongs to it. A known-good digest can recover service after promotion fails. A tag makes an image convenient to find, while [Docker's digest documentation](https://docs.docker.com/reference/cli/docker/image/pull/) describes how a pull can reference the immutable image identifier. Keep both digests in the fixture registry so retention does not make the rollback exercise impossible.

### Separate an unreliable check from a failed contract

In one synthetic run, a flaky integration fixture produces a timeout while the image remains available. In another, the runner reliably observes a response that violates the advertised contract. Ask the learner to preserve the first result, reproduce the relevant condition, and specify whether promotion is allowed. A rerun can provide evidence about a transient fault, but the decision record still needs all observed outcomes. Rebuilding from the same commit after an interruption also requires verifying the resulting artifact against the approved digest. Resuming with an existing approved artifact avoids that ambiguity.

Require one failed promotion and a return to the known-good build during the assessment. Confirm the active digest, send the lab's test request, and preserve the evidence from the failed candidate and the rollback. Keep this time distinct from the time to a useful check result in the original exercise. The two clocks help the platform owner decide whether to tune test feedback or deployment recovery first.

## Use a first-deployment exercise to uncover platform onboarding gaps
@meta platform-onboarding-practice | Have learners independently deploy a small service through a versioned supported path.
@flow Accept learner request | Create service | Pass policy and health checks | Review support needs
@metric Completed deployment within four hours | % | 8/15 | 13/15
@metric Assisted minutes across the cohort | minutes | 260 | 135
@ref CNCF · Platforms White Paper | https://tag-app-delivery.cncf.io/whitepapers/platforms/

### Situation and scope

A platform team maintains a starter repository and calls it self-service. Test whether engineers new to it can reach one healthy, policy-compliant deployment in an approved environment. Keep the exercise time fixed. Require participants to label each request for help by step and cause.

### Plan and execution

Run the existing instructions with newly provisioned accounts. Observe access, template creation, build results and health checks. Test a small revision that resolves the most common prerequisite. Compare equivalent tasks and record both acceptance time and the first qualifying deployment. Require the same controls and access boundaries for both routes.

### Rollout and handover

Write onboarding instructions alongside template code. Define a recovery path for partially created resources. Hand the platform owner an issue list grouped by access, documentation, product defect and support responsibility. Keep an escalation route available for workloads the template cannot support.

### How to read the numbers

There are 15 hypothetical learners per cohort and the cutoff is four hours. Completion includes the required checks. Trainer assistance measures hands-on time during the exercise. Consider mixing differently experienced teams or using matched cohorts before attributing the changes solely to the revised instructions.

### Record where the first deployment waits

For each synthetic attempt, keep the time of submission, any wait for access, template start, policy result, and first confirmed health check. Use the same start event and four-hour cutoff for every learner. An accepted request that never reaches a passing health check belongs in the attempt count. Capture the point where it stopped and the cause the learner can observe. Split waiting for a prerequisite from time spent correcting a failed build. Those two intervals suggest different changes to the supported path.

Use a technical acceptance check with two parts. The lab must prove a healthy response from its approved environment and record a passing policy result for that same deployment. A completed form or a successful shell command is intermediate evidence. Grade assisted completions separately from completions where the learner could use the written instructions and finish without a person stepping in.

### Test whether the fix resolves the right problem

Change one documented prerequisite for the repeat exercise and reset accounts and template versions between runs. Use the aggregated assistance figures as a clue. The example moves from 260 to 135 assisted minutes across groups of 15, a difference of about 8.3 minutes per learner. It cannot show which step improved without the event record. If most of the difference is concentrated in access requests, inspect what happened to access failures and confirm the same review still took place. Frame the follow-up as a platform usability check, consistent with the emphasis on users' needs in the [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/).

## Get architecture decisions out of the meeting and into a reviewable record
@meta architecture-decision-workshop | Run a trade-off workshop whose output includes an owner, disconfirming test and decision expiry.
@flow State constraint | Compare alternatives | Record decision and consequences | Revisit with evidence
@metric Records with owner, alternatives and revisit trigger | % | 5/18 | 16/18
@metric Median time for a new reviewer to explain the rationale | minutes | 21 | 9
@ref Michael Nygard · Documenting Architecture Decisions | https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

### Situation and scope

A group makes architecture choices in meetings and later debates why. Use two fictional decisions, one reversible and one involving a difficult cutover. Set a rubric that requires context, viable alternatives, rationale, operational consequences and evidence that would warrant reopening it.

### Plan and execution

Give mixed-discipline groups a scenario with incomplete demand figures and an availability constraint. Ask them to bound assumptions, rather than fill missing workload data with invented facts. Design a small test that distinguishes two feasible options. Write one decision per document in plain language, then have a peer group review it without attending the discussion.

### Rollout and handover

Start with an accessible repository and a durable decision index. Ask an owner to close, supersede or reopen a record when its trigger fires. Leave anonymised exercise material, a rubric and example review comments. Score how long a different reviewer needs to recover the decision and consequence.

### How to read the numbers

Each round has 18 synthetic decision records, scored against the same rubric. The review timing applies to a reader reconstructing rationale, rather than the original decision duration. Check whether real teams still consult the records during later releases.

### Compare alternatives under the same constraint

Give both groups the same fictional situation. A reporting service needs a recoverable data copy and has a nightly period of low traffic. One viable design favours a simpler restore procedure. Another pays for a warm replacement that can accept traffic sooner. Ask the groups to state how much data loss and downtime the service can tolerate. If nobody has that information, list it as missing and plan a way to obtain it. Each record should name the people who bear the extra cost or operational work, and an observation that could make the less attractive option preferable.

### Give a future reviewer something to test

Use the context, decision, status, and consequences described in [Michael Nygard's original decision record format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions). Add a named owner, a review trigger, and the evidence and assumptions used in this exercise. In the fictional restore example, an owner could schedule a timed test and reopen the record if the team cannot restore inside its agreed window. That trigger is meaningful only if someone owns the test and can find its results.

Ask an independent reader to explain why the team chose the design, which part can still change cheaply, and what would bring the choice back for review. Score those responses against the record that was available during the review. A later verbal explanation cannot count as information the written record already contained. Separate reviewer speed from correctness to detect records that are easy to skim but omit a crucial consequence.

## Teach cost ownership with a ledger that has to reconcile
@meta cost-allocation-lab | Let engineering and finance reconcile one shared charge and explain a service's unit cost together.
@flow Load fixture bill | Classify direct and shared costs | Allocate by driver | Reconcile and explain
@metric Submissions reconciling to the full charge | % | 3/12 | 10/12
@metric Absolute unallocated difference at median | USD | 87 | 0
@ref FinOps Foundation · Allocation | https://www.finops.org/framework/capabilities/allocation/

### Situation and scope

Engineers see a cloud dashboard but cannot explain why a shared service appears in their bill. The lab uses a fictional billing export with direct costs, a shared gateway and untagged usage. Require each submission to reconcile the whole expense, declare any residual and state its unit-cost denominator.

### Plan and execution

Provide a service map and two candidate allocation drivers. Ask learners to prove that costs counted directly are removed from the shared pool and that exclusions are visible. Introduce a zero-volume period and a late credit so learners distinguish unavailable unit cost from zero and reconcile adjusted periods. Have finance and engineering participants review each other's rationale.

### Rollout and handover

Give one checkable dataset and one unseen transfer exercise. Leave a renamed CSV with definitions, formula calculations and validation checks. The owner should update the example when source billing columns or allocation policy change. Include a check that forecasts and chargeback use authorised policy.

### How to read the numbers

Twelve fictional submissions per round report their absolute unexplained difference. A zero median does not imply every group reconciled. Two post-lab submissions still fail. Read the count and median together before declaring the cohort ready.

### Reconcile the pool before dividing it

Use a fictional three-row export with $100 directly attributed to service A, $80 to service B, and a $120 shared gateway charge. With an agreed request split of 75% and 25%, the gateway allocations are $90 and $30. The service ledgers carry $190 and $110 in total. Their sum matches the $300 fixture bill. If nobody can support the split, keep the $120 visible as an unallocated shared charge until the owner approves a driver. The [FinOps Foundation allocation guidance](https://framework.finops.org/framework/capabilities/allocation/) discusses classification and how shared costs can be distributed.

### Test which driver changes the decision

Ask a second group to repeat the allocation with a 50% and 50% split accepted only for comparison. A's cost would decrease by $30 and B's would increase by $30, while the bill stays at $300. The calculation illustrates why disagreement about a driver matters even after the ledger balances. Require a note on why the driver is a sensible proxy for use, which period it represents, and how the team would deal with missing observations. If A completed 1,000 eligible units, its $190 ledger would represent $0.19 per unit. If B completed zero units, its unit cost is undefined and its $110 still belongs in the ledger.

Hand over the unmodified fixture, the allocation rules and effective date, a versioned calculation, and the record of any approved exceptions. Re-run every row through reconciliation before allowing the result to inform showback or chargeback.

## Hand over recurring operations through a practiced runbook
@meta toil-handoff-lab | Measure whether a receiving team can execute and recover a repeat operation without adding unsafe shortcuts.
@flow Define task acceptance | Run hands-on exercise | Rehearse an exception | Sign off on ownership
@metric Tasks completed unaided with correct evidence | % | 11/24 | 20/24
@metric Median operator effort among completed tasks | minutes | 18 | 11
@ref Google SRE Workbook · Eliminating Toil | https://sre.google/workbook/eliminating-toil/

### Situation and scope

A new on-call rotation inherits a repeated operational task. Train operators to recognise eligible cases, verify effects and know when to escalate. Require the attempt record to show who acted, the chosen scope and a check of the downstream state. Seed cases where the correct action is to stop and escalate.

### Plan and execution

Observe the current operator twice and capture decisions that never made it into the runbook. Replace stale screenshots with concrete checks and expected outputs. Have pairs practice with normal, partial-success and ambiguous cases, using an isolated data set. Follow with an individual exercise and include the stop cases in the score.

### Rollout and handover

Assign an owner, designate an escalation contact and give the receiving team a supported practice window. Track manual time and recurring exceptions separately from permanent engineering work. Revisit after a full rotation and feed repetitive steps into the [toil guide](/insights/sre-toil-reduction/).

### How to read the numbers

The simulations have 24 tasks per round, including tasks for which the checked result is escalation. The timing measure excludes failed exercises. Treat the figures as evidence about one assessment design. Confirm real handover quality with independent operational checks and records.

### Design cases where a stop is the right result

Give the learner fictional cases with the same visible symptom and different downstream states. In a normal case, the task has never been applied to the target and the expected state is clear. A second case can show a completed first step and a missing acknowledgement. A third can present conflicting evidence about the target. Ask the learner to read back the scope and the last known safe state before acting. In the ambiguous case, award credit for preserving evidence and escalating rather than repeating an operation without knowing its effect.

### Measure both completion and what it took to get there

An evaluator keeps one record per assigned task, with the expected outcome, actions taken, observed result, and any intervention by the trainer. Mark when the learner first starts hands-on work and when the acceptance evidence is available. Record waiting and escalation time separately from the active effort figure. A shorter median among completed tasks can coexist with failures at harder checkpoints. Compare it alongside the full set of assigned tasks and inspect the unfinished exercises before changing staffing or support.

Hand over a runbook that names its owner, lists the checks that establish a safe start, and explains how to show the outcome. Include a version or date for the last independent rehearsal. Keep a separate list of manual steps that recur with no lasting benefit and review them using the [Google SRE workbook's toil guidance](https://sre.google/workbook/eliminating-toil/). Some tasks can be automated after their safe execution is understood. Leave exception decisions with an explicitly named owner.
