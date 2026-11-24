# Instrument the first useful deployment
@lesson first-deploy-cohorts | Define onboarding events and include people who never reached the outcome in the cohort.
@chart Teams deployed within the deadline | %
@value Existing path | 6/12
@value Guided path | 10/12
@match first deployment | onboarding | time to first | developer experience | golden path | paved road
@source DORA · Platform engineering | https://dora.dev/capabilities/platform-engineering/
@source DORA · Quick Check | https://dora.dev/quickcheck/

## Establish a start and an end

Assign an onboarding attempt ID when a team receives its first actionable request. Capture the repository and service class. Record provisioning, first build, first deploy, and the independent verification event. A starter service must meet a pre-agreed outcome, such as a healthy route with the expected identity and traces visible. Avoid making a generated repository the outcome when teams still cannot deploy it.

## Account for incomplete attempts

Twelve eligible teams start in each example cohort. Within seven business days, six teams on the existing path and ten teams on the guided path reach the outcome. Report 50% and 83.3% completion. A median calculated only on the completed attempts describes speed among finishers. It cannot tell whether the path helped teams that never completed. Preserve an explicit disposition for blocked, abandoned, and still-in-progress attempts. Close the cohort only after everyone has received the same observation window.

Build a record for duplicate attempts and transfers. Reopening a team ticket must not silently create a second successful team. Keep human-readable event definitions beside the dashboard so a change to the verification event can be treated as a measurement change.

## Limits of the example

The cohorts are illustrative. Team readiness, service risk, access policy, and vacation schedules can move the result. First useful deployment is an onboarding metric. DORA change lead time measures a different interval from committed code to running production code.

# Separate waiting time from engineering work
@lesson onboarding-wait-states | Reconstruct the critical path and identify the queue where removing a handoff would actually speed up onboarding.
@chart Time spent in one traced attempt | hours
@value Access waiting | 18
@value Build waiting | 4
@value Active work | 3
@value Elapsed on this trace | 25
@match provisioning | queue time | handoff | bottleneck | pipeline | waiting time
@source DORA · Platform engineering | https://dora.dev/capabilities/platform-engineering/

## Trace a single attempt

In one worked attempt, an access request waits 18 hours. The team then completes three hours of active work and waits another four hours for a build runner. With no overlap, the elapsed time is 25 hours. Ask whether access can be granted by policy before the start event. If it can, this exact trace would fall to seven hours, provided the other stages do not change. Speeding up a three-hour stage by 50% cannot recover the same amount of calendar time.

## Compare attempts without distorting them

Capture queue-entry, owner-assigned, start, and end events per stage. Normalize them to a single clock and repair missing end events before aggregation. Stage percentiles are not additive. The team with the slowest access request is often not the team with the slowest build. Preserve overlapping work as intervals, take their union for elapsed-time accounting, and trace the longest dependent path when stages can run in parallel.

Suppose access and build can wait simultaneously after a design change. Their independent 18 and four hours are then bounded by 18 hours on the critical path rather than a guaranteed 22. Confirm that the new access policy does not create extra manual exception work elsewhere.

## Limits of the example

One trace shows where to look. Group more traces by service type, environment, team, and policy risk before changing the default workflow. Re-run a known blocked case after the design change and report caught policy violations alongside faster onboarding.

# Evaluate a golden path without hiding blocked teams
@lesson golden-path-rollout-gates | Compare within-cohort completion, workload mix, and guardrails before rolling out a platform change.
@chart Completion in two service classes | %
@value Existing, standard | 16/20
@value Guided, standard | 18/20
@value Existing, regulated | 3/10
@value Guided, regulated | 4/10
@match adoption | change failure | sample size | rollout | golden path | developer satisfaction
@source DORA · Measuring platform impact | https://dora.dev/capabilities/platform-engineering/
@source Kubernetes · Deployments | https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

## Set the gate before the launch

Write down a primary outcome, a guardrail, an observation window, and a rollback owner. An illustrative gate could require an increase of at least five percentage points in seven-day completion for comparable standard services, with no unexplained production policy bypasses and no material increase in failed deployments. A deployment approved by the platform is not necessarily healthy. Record post-deploy health and whether the release needed rollback or remediation.

## Interpret a result in strata

With equal denominators in each class, standard service completion rises from 80% to 90%, and regulated service completion from 30% to 40%. The example pooled rate moves from 19/30 to 22/30, about 63.3% to 73.3%. A new rollout that enrolls proportionally more regulated work may still show a lower pooled rate despite better within-class outcomes. Show denominators and the mix in each arm.

Use a staged rollout or assign teams to the pilot before observing their outcomes. Analyze assignments as made where practical, preserving teams that abandoned a difficult path. Keep a record of any overrides so you can reproduce the known exception route.

## Limits of the example

The sample cannot establish that the platform alone caused the improvement. With 10 regulated teams per arm, one outcome moves the rate by 10 points. Repeat the experiment or stage the roll-forward when the decision is sensitive to a few teams. Time-box rollback and document how to return to the known safe path.
