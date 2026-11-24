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
