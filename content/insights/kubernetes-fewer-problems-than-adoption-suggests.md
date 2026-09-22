---
title: "Kubernetes is the right answer for fewer problems than its adoption rate suggests"
description: "Kubernetes is genuinely impressive engineering."
date: 2026-02-09
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: note
derived: true
---

Kubernetes is genuinely impressive engineering. The abstractions it provides for container orchestration, service discovery, storage, and network policy are powerful and, at sufficient scale, essential. This is not an argument against Kubernetes.

It's an argument against the assumption that Kubernetes is the default answer for container workloads.

The operational cost of running Kubernetes well is substantial. Cluster upgrades that require careful planning and execution. RBAC configuration that becomes a governance problem at scale. Networking models that require genuine expertise to debug. Storage classes and persistent volume management that introduce complexity for stateful workloads. And a blast radius when configuration is wrong that can affect many services simultaneously.

For teams with a dedicated platform engineering function, this cost is absorbed and the value is clear. For a team of eight engineers shipping three services, it's operational overhead that competes directly with product delivery.

The managed alternatives have matured considerably. AWS Fargate, Google Cloud Run, and Azure Container Apps provide container scheduling, autoscaling, service mesh basics, and zero infrastructure management overhead. They sacrifice some of Kubernetes' flexibility — custom schedulers, complex network policies, exotic storage requirements. For most teams, the sacrificed flexibility was never going to be used.

Choose Kubernetes when: your scale requires the bin-packing efficiency, your team structure maps to multiple independent service teams, and you have the platform engineering investment to run it well. Choose a managed container service when you want containers without Kubernetes as a full-time concern.
