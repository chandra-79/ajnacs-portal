---
title: "Kubernetes is the right answer for fewer problems than its adoption rate suggests"
description: "Kubernetes is genuinely impressive engineering."
date: 2029-04-27
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: note
derived: true
---

Kubernetes is genuinely impressive engineering. The abstractions it provides for container orchestration, service discovery, storage, and network policy are powerful and, at sufficient scale, essential. This is not an argument against Kubernetes.

It's an argument against the assumption that Kubernetes is the default answer for container workloads.

The operational cost of running Kubernetes well is substantial. Cluster upgrades that require careful planning and execution. RBAC configuration that becomes a governance problem at scale. Networking models that require genuine expertise to debug. Storage classes and persistent volume management that introduce complexity for stateful workloads. And a blast radius when configuration is wrong that can affect many services simultaneously.

For teams with a dedicated platform engineering function, this cost is absorbed and the value is clear. For a team of eight engineers shipping three services, it's operational overhead that competes directly with product delivery.

The managed alternatives have matured considerably. AWS Fargate, Google Cloud Run, and Azure Container Apps provide container scheduling, autoscaling, service mesh basics, and a reduced infrastructure-management surface, with application and configuration responsibilities remaining. They sacrifice some of Kubernetes' flexibility — custom schedulers, complex network policies, exotic storage requirements. For most teams, the sacrificed flexibility was never going to be used.

Choose Kubernetes when: your scale requires the bin-packing efficiency, your team structure maps to multiple independent service teams, and you have the platform engineering investment to run it well. Choose a managed container service when you want containers without Kubernetes as a full-time concern.

## Test the disruption you are accepting

A platform choice should include maintenance behavior, not just deployment convenience. In a hypothetical service with three replicas, each tested to handle 40 requests per second at the required latency, total nominal capacity is 120 requests per second. Removing one replica leaves 80. If demand is 90, the service has insufficient tested capacity during that disruption even though three replicas sounded redundant.

Use a disposable environment to drain one worker and observe placement, disruption controls, startup time and successful request rate. Record whether remaining capacity exists and whether a disruption budget delays maintenance. A budget constrains voluntary disruption; it does not create capacity or prevent every involuntary failure.

The worksheet should name the required peak, per-replica tested capacity, reserve, placement constraints and recovery behavior. Repeat the comparison on a managed application platform where possible. Managed products can reduce infrastructure duties, but they do not provide zero operating overhead or identical features. Kubernetes is justified when its capabilities and ownership model satisfy the workload better than alternatives, not when a nominal service count crosses an assumed universal threshold.

| Observation | Value (requests/second) |
| --- | ---: |
| Three replicas | 120 |
| After one removal | 80 |
| Required demand | 90 |

**Figure method.** Synthetic tested capacity=3×40=120 requests/s; after one replica removal=2×40=80, below 90 demand by 10. Assumes equal capacity and no other bottleneck.

## Further reading

- [Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
