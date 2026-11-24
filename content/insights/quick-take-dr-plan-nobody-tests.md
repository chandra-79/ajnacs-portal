---
title: "An Untested Disaster Recovery Plan Is Not a Plan — It's a Hope"
description: "Test recovery assumptions about access, data, dependencies and service validation, then publish measured timings and the limits of the exercised scenario."
date: 2028-04-12
tags: ["Cloud Architecture", "Disaster Recovery", "Resilience"]
format: article
---

A disaster-recovery plan can contain unverified assumptions about access, capacity, data and execution. Testing provides evidence about those assumptions under the conditions exercised.

The gap between "plan that looks complete on paper" and "recovery that works under real conditions" is not a documentation gap. It is a gap that only testing reveals.

## What testing reveals that documentation cannot

A DR plan describes a sequence of steps. It does not describe what happens when:

- The backup turns out to be corrupt or incomplete
- The recovery scripts assume environment variables that are not set in the failover environment
- The IAM roles in the secondary region do not have the permissions needed to restore the database
- The RTO estimate was based on a small test dataset, not production volume
- The engineers who wrote the plan have moved on and the engineers executing it are doing it for the first time
- Two systems come back online in the wrong order, causing a cascade failure

Every one of these is a real failure mode. A plan can anticipate these cases, while an exercise checks whether its assumptions and procedures hold in the selected environment.

## The uncomfortable test cadence

An initial exercise can reveal invalid assumptions; recurring exercises can check whether later changes invalidate earlier evidence. Select cadence from service criticality, material changes, obligations and exercise risk. A quarterly schedule may be useful in one setting, but neither that schedule nor a successful drill guarantees recovery under every disaster scenario.

Systems change constantly. New services are added to the architecture. Databases grow. Dependencies change. An RTO that was achievable 18 months ago on a 500GB database may not be achievable today on a 4TB database without changes to the recovery process.

The DR plan that was tested once and never updated is progressively less accurate with each passing month.

## Practical testing approaches

**Tabletop exercises.** Low cost, low disruption. Walk through the plan step by step with the team that would execute it. Identify assumptions, gaps, missing roles. Produces improvements to the plan without touching production systems.

**Partial recovery testing.** Restore a selected database or service into an isolated destination and validate the recovered application behavior. Use an appropriately protected production backup when that is authorized and needed to test representativeness, or a representative synthetic fixture where it answers the question. Measure the exercised recovery duration and identify excluded steps before comparing it with the service RTO.

**Full failover exercise.** Choose full failover scope and cadence from criticality, material change, obligations and exercise risk rather than a universal annual rule. Redirect production traffic to the secondary environment, operate from it for a defined period, fail back. It can validate important end-to-end behavior under its exercised conditions, while remaining dependencies and untested failure scenarios still limit the claim.

The best time to find out your DR plan does not work is during a scheduled test. The second best time is right now, by scheduling one. The worst time is during an actual disaster.

Write and test the plan, and keep the current procedure available during execution so responders do not have to rely on memory.

## Grow the exercise from a restore to a service recovery

A tabletop, isolated restore and production failover answer different questions. A tabletop can expose missing authority and dependencies; a restore can verify backup usability; an end-to-end exercise can test routing and application behavior. Choose cadence and scope from system criticality, material changes and risk. There is no universal rule that every service must redirect production traffic annually or that a quarterly test alone maintains readiness.

For a hypothetical dependency chain, identity recovery takes eight minutes, database recovery 35 and application validation 12. If the database restore can begin while identity recovery runs, the critical path is max(8, 35) + 12 = 47 minutes. If restore credentials depend on recovering identity first, the same tasks become sequential and require 55 minutes. The chart compares those two designs. The eight-minute difference comes from dependency ordering, not faster backup media.

Draw the recovery prerequisites before timing the drill. For each step, record what must already be available: keys, credentials, network paths, artifacts, quotas and authoritative data. Do not assume the incident communication channel or documentation site survives the same failure being tested. Keep an appropriately protected offline or independent route to essential instructions where the threat model requires it.

## Verify the recovered business state

Restore synthetic or appropriately protected data into an isolated destination and validate important invariants. Count records, check known transaction IDs and exercise a representative application workflow. If using a production backup, apply the required access, retention and privacy controls to the recovered copy; a recovery drill must not create a poorly protected duplicate of sensitive data.

The worksheet needs RTO and RPO definitions, observed timestamps, recovery evidence, manual interventions and unresolved assumptions. A measured restore duration is not automatically the complete service RTO. A recent backup timestamp is not automatically the last recoverable business transaction. Preserve those distinctions in the report.

Repeat failed steps after correction and test again when material dependencies change. Keep the runbook available during exercises rather than encouraging responders to rely on memory; written procedures reduce mistakes under pressure and help new responders participate. A successful drill establishes evidence for the tested conditions. Publish the conditions and limitations so growth in dataset size, changed credentials or new dependencies can trigger an informed retest instead of an unsupported belief that the old result still applies.

| Observation | Value (minutes) |
| --- | ---: |
| Parallel prerequisites | 47 |
| Identity gates restore | 55 |

**Figure method.** Synthetic tasks: identity 8, restore 35, validation 12 minutes. Parallel prerequisite path=max(8,35)+12=47; sequential path=8+35+12=55. Durations are illustrative and assume no additional dependencies.

## Further reading

- [AWS disaster-recovery planning](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/plan-for-disaster-recovery-dr.html)
- [PostgreSQL recovery mechanics](https://www.postgresql.org/docs/current/continuous-archiving.html)
