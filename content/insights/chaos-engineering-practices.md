---
title: "Chaos Engineering: Testing Reliability Before Production Tests It For You"
description: "Chaos engineering injects controlled failures to validate that systems actually behave as designed under real-world failure conditions. The gap between the architecture diagram and production behavior is where reliability lives."
date: 2026-11-11
tags: ["Cloud Architecture", "DevSecOps"]
format: article
---

There is a specific failure mode in reliability engineering: a system with excellent documentation, comprehensive runbooks, and well-designed redundancy that nonetheless fails catastrophically during an incident — because the failover mechanism has never actually been tested in production.

Chaos engineering exists to close this gap. Instead of discovering failure behavior during an incident, you engineer controlled failures in a systematic way to validate that your reliability assumptions are correct.

## What to measure

**Error budget spent by one experiment.** If a controlled fault affects 30 of 100,000 eligible requests and the period allows 100 failed requests, the test consumes 30% of that period’s error budget. Define abort criteria and watch user-visible errors before increasing the blast radius.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [Google’s SRE Workbook, Implementing SLOs](https://sre.google/workbook/implementing-slos/).

## The core principle

The Netflix Chaos Engineering paper articulated the core idea: deliberately inject failures in a controlled manner to identify weaknesses before they manifest as incidents. The controlled environment lets you choose the failure, limit the blast radius, and observe the system behavior with your full attention — instead of discovering the failure at 2am under incident conditions.

The important distinction: chaos engineering is not random destruction. It is hypothesis-driven experimentation. Before running an experiment, state a specific hypothesis: "We believe that if the database read replica goes down, the application will automatically fail over to the primary with less than 1 second of degradation." Then run the experiment and observe whether the hypothesis holds.

If the hypothesis fails — the application doesn't fail over, or it fails over with 30 seconds of degradation, not 1 second — you have found a reliability gap that needs to be addressed.

## Starting with steady-state definition

Before injecting failures, define what "normal" looks like. Steady-state metrics: request success rate, p99 latency, error rate, queue depth, whatever represents healthy system behavior in your context.

Chaos experiments validate that steady-state is maintained (or recovers to steady-state within defined parameters) after a fault is injected. If you don't have a clear definition of steady-state, you can't tell whether a fault caused a problem.

## The fault injection ladder

Start simple. The temptation is to begin with complex multi-service failures; the discipline is to start with simple, contained experiments and build complexity as you develop confidence in the system and process.

**Infrastructure faults** (start here):
- Terminate a single instance or pod
- Restrict network bandwidth between services
- Add artificial latency to database queries
- Fill a disk partition to capacity

**Dependency faults** (next):
- Return errors from a specific downstream service
- Return responses slower than normal (timeout simulation)
- Drop all traffic to a service (complete unavailability)
- Return corrupted or unexpected data formats

**Regional faults** (for systems requiring regional redundancy):
- Fail over to a secondary region
- Simulate network partition between regions
- Lose access to a specific availability zone

Each step up the ladder requires the lower-level experiments to have been validated first. Running a regional failover experiment before validating single-instance failure behavior is skipping steps.

## Tooling

**AWS Fault Injection Service (FIS)**: native AWS service for injecting EC2, ECS, EKS, RDS, and network faults. Integrated with CloudWatch for observability. Good for AWS-native workloads.

**Azure Chaos Studio**: equivalent for Azure workloads. Supports VM, AKS, and network faults with built-in experiment management.

**Chaos Mesh**: Kubernetes-native chaos platform. Supports pod, network, I/O, and time faults across any Kubernetes cluster. More flexible than cloud-native tools for multi-cloud or on-premises environments.

**Gremlin**: commercial platform with pre-built attack types, experiment management, and orchestration across multi-cloud and on-premises environments.

Start with one synthetic service in an isolated environment. First replay a control batch of requests. For the experiment batch, have the test dependency delay its own response by a configurable amount, such as 100 milliseconds. Compare the user-facing success rate, latency and retry volume. Stop at the first predeclared guardrail breach or when the observation window ends. Use the same request mix for both batches.

## The GameDay format

GameDays are planned chaos engineering exercises run as team events — a time-boxed period where a team runs experiments and responds to system behavior together. The format:

**Preparation**: define experiments, state hypotheses, brief the on-call team, notify stakeholders, prepare rollback procedures for each experiment.

**Execution**: run experiments one at a time, with a facilitator managing the process and observers monitoring system behavior. Document observations, not just outcomes.

**Debrief**: what hypotheses were validated? What failed? What new hypotheses do we have? What changes need to be made? What did we learn about the system that we did not know before?

GameDays build confidence in system resilience and build team capability to handle incidents. Engineers who have practiced responding to injected failures respond more effectively to real ones.

*Introducing chaos engineering to a reliability program or planning a first GameDay? The experiment design depends on the specific failure modes you most need to validate. [Happy to think through the approach.](/contact/)*

## Turn the experiment into a decision

Choose a decision that the team will make from the evidence. If a payment dependency goes slow, the decision may be whether the service can retry within its existing deadline or needs to switch to a pending workflow. Use a representative test environment and a dependency with a controllable simulator for first runs. Define the system and data included in the exercise and the operator who can end it. The principles of chaos engineering describe steady-state behaviour through measurable outputs and emphasise minimising the effect of an experiment on customers. [Principles of Chaos Engineering](https://principlesofchaos.org/)

A sample hypothesis reads, “On the test checkout lane, the percentage of accepted test orders confirmed within 2 seconds stays above 99% during slow dependency responses, and each accepted order produces one ledger entry.” The two parts are worth measuring separately. A service that returns a fast acknowledgement while dropping a write will seem healthy on a latency panel. A service that posts duplicates can look healthy on both traffic and success dashboards.

Write down what counts as an accepted operation. Keep rejected, expired and pending operations in a separate count and show how pending work resolves. Define the observation window before the run. A two-minute sampling window would miss work that accumulates in a ten-minute retry cycle. Measure the point where a customer’s result becomes durable, in addition to the point where the edge responds.

## Pair the test with a useful comparison

Prepare a matched lane with the same build, starting backlog, request mix and volume. Keep its upstream independent of the fault. Before proceeding, compare the pre-test period for both lanes and check that their baseline error and latency distributions are close enough for the question. Batch windows or scheduled deploys can explain a change even when a graph lines up with the experiment. An experiment log should state when traffic reached steady state and list any events both lanes shared.

For an illustrative test, assume each lane sees 20,000 accepted requests during the observation window. The test lane confirms 19,870 within the deadline, or 99.35%. The comparison lane confirms 19,960, or 99.8%. The test passed its 99% operating threshold for that run while losing 90 more timely confirmations than the comparison. Check whether misses clustered in a specific request class or time interval. A repeat can test whether the difference recurs. Compare uncertainty and sample size, especially if you choose a rarer-event threshold. No duplicate ledger entries in one rehearsal cannot establish a general duplicate rate.

## Make stopping independent of the chart you are testing

Choose abort signals observable outside the test path. Give one person clear authority to stop and a direct way to do it if the primary dashboard is unavailable. Configure a fixed maximum duration for the exercise, track escalation, and have the resource owner verify the scope selection before starting. Run through the stop procedure before the first timed exercise. Managed experiment tools can sometimes stop on a CloudWatch alarm, but the manual authority and the recovery sequence still matter. [AWS Fault Injection Service stop conditions](https://docs.aws.amazon.com/fis/latest/userguide/stop-conditions.html)

In a rehearsal checklist, include lost telemetry as a stop signal. Confirm that dashboards can distinguish a missing series from its healthy value. Record when the stop was requested, when the injected condition cleared and when normal service returned. A tool reporting a stopped experiment means that its run ended. Queued retries, half-complete workflows or overloaded workers can persist after that event. Have a separate owner check those effects and decide when to reopen the test lane.

## Finish with recovery evidence and an owned change

Validate side effects using accepted request IDs, compare the ledger and work queue, and sample any work that completed after the fault cleared. Record both accepted orders that were never fulfilled and unrecognised work that appeared without a matching order. Confirm that retries remain bounded when the dependency returns. A queue that eventually drains can still delay time-sensitive work or consume capacity needed for fresh traffic. Separate total recovery time from the time required to finish reconciliation.

Publish the baseline, exact test boundary, start and abort times, request count, thresholds and outcomes. If the exercise exposes a gap, nominate the owner, make one behavioural change and rerun the same comparison before exercising a second fault. For example, if pending orders cause retry pressure after recovery, validate that progress reporting and retry limits improve together. Include conditions this result leaves open, such as a longer outage, different traffic mix, or a simultaneous dependency failure. That list lets a future reader tell which next experiment is justified by the evidence.

Keep the dashboard queries and exercise inputs under version control beside the result. An incident reviewer should be able to identify which build, simulator configuration and workload produced the charts. Timestamp manual observations separately so delays in recording an event do not shift the measured timeline.
