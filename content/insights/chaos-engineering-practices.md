---
title: "Chaos Engineering: Testing Reliability Before Production Tests It For You"
description: "Chaos engineering injects controlled failures to validate that systems actually behave as designed under real-world failure conditions. The gap between the architecture diagram and production behavior is where reliability lives."
date: 2026-02-23
tags: ["Cloud Architecture", "DevSecOps"]
format: article
---

There is a specific failure mode in reliability engineering: a system with excellent documentation, comprehensive runbooks, and well-designed redundancy that nonetheless fails catastrophically during an incident — because the failover mechanism has never actually been tested in production.

Chaos engineering exists to close this gap. Instead of discovering failure behavior during an incident, you engineer controlled failures in a systematic way to validate that your reliability assumptions are correct.

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

```yaml
## Chaos Mesh example: inject 100ms network latency on a specific service
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: order-service-latency
spec:
  action: delay
  mode: all
  selector:
    namespaces: [production]
    labelSelectors:
      app: order-service
  delay:
    latency: "100ms"
    correlation: "100"
    jitter: "10ms"
  duration: "10m"
```

## The GameDay format

GameDays are planned chaos engineering exercises run as team events — a time-boxed period where a team runs experiments and responds to system behavior together. The format:

**Preparation**: define experiments, state hypotheses, brief the on-call team, notify stakeholders, prepare rollback procedures for each experiment.

**Execution**: run experiments one at a time, with a facilitator managing the process and observers monitoring system behavior. Document observations, not just outcomes.

**Debrief**: what hypotheses were validated? What failed? What new hypotheses do we have? What changes need to be made? What did we learn about the system that we did not know before?

GameDays build confidence in system resilience and build team capability to handle incidents. Engineers who have practiced responding to injected failures respond more effectively to real ones.

*Introducing chaos engineering to a reliability program or planning a first GameDay? The experiment design depends on the specific failure modes you most need to validate. [Happy to think through the approach.](/contact)*
