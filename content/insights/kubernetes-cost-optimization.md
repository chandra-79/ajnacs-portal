---
title: "Kubernetes Cost Visibility — The Gap That Kills FinOps Programs"
description: "Kubernetes is one of the hardest places to apply FinOps discipline. Here's what actual cost visibility requires and where most teams fall short."
date: 2026-06-01
tags: ["FinOps", "Containers", "Cloud Architecture"]
format: article
---

Kubernetes is, from a FinOps perspective, a visibility problem masquerading as a cost problem.

Cloud billing APIs tell you what a cluster costs. They tell you almost nothing about *why* — which workloads are driving that cost, which are over-provisioned, which are idle, and whether your bin-packing efficiency is anywhere near where it should be. That gap is where FinOps programs break down.

## Why Standard Cloud Billing Falls Short

When you look at an EKS, AKS, or GKE line item in your billing dashboard, you see:
- Node compute cost
- Managed control plane cost (on most providers)
- Storage cost
- Network egress

What you don't see:
- Which pods are consuming which fraction of node resources
- Which namespaces represent which teams or workloads
- Which pods have resource requests set 3x above actual consumption
- Whether your cluster has 40% idle capacity across node pools

Without that breakdown, cost attribution is at best approximate and at worst meaningless.

## The Three Layers of Kubernetes Cost Visibility

**Layer 1: Cluster-level visibility**
Node cost, managed control plane, storage, and egress — available from cloud billing APIs. This is table stakes and where most teams stop.

**Layer 2: Namespace-level visibility**
Proportional allocation of node cost to namespaces, based on request/limit ratios or actual utilization. Tools like Kubecost, OpenCost, or native cloud tools (AWS Cost Explorer with EKS, Azure Cost Management with namespace filtering) address this. This is where team-level showback becomes possible.

**Layer 3: Workload-level visibility**
Cost attribution to individual deployments, with efficiency metrics — actual consumption vs. requested resources, rightsizing recommendations, idle workload detection. This is where the actionable insight lives.

Most organizations are at Layer 1. Some are at Layer 2. Very few have Layer 3 instrumented consistently.

## The Common Over-Provisioning Pattern

The single most common finding in Kubernetes cost reviews: resource requests set to worst-case historical peaks, across every workload in the cluster.

Why it happens: engineers set requests conservatively when they first deploy a workload, because OOMKilled pods are painful. Nobody revisits them. Two years later, a workload that peaks at 400m CPU has a 2000m request. Multiply that across 50 workloads and you've paid for a significantly larger cluster than your actual demands require.

The fix isn't complicated: implement continuous rightsizing analysis (VPA in recommendation mode, or Kubecost's rightsizing recommendations), and build a quarterly review of resource requests into your platform engineering practice.

## Namespace and Label Discipline

The same principle that governs cloud cost tagging applies inside Kubernetes: you cannot attribute what you haven't labelled.

Standard labels that enable cost attribution:
```yaml
labels:
  app: service-name
  team: owning-squad
  env: production
  cost-centre: business-unit
```

Enforce label requirements at admission time using OPA/Gatekeeper or Kyverno. Without this discipline, namespace-level attribution is the best you'll achieve.

## The Cluster Architecture Question

Beyond workload-level efficiency, the bigger cost question is often cluster architecture:

- **Single large cluster vs. multiple smaller clusters** — single clusters have better bin-packing but worse isolation and noisy-neighbour risk
- **Spot/preemptible nodes for fault-tolerant workloads** — often 60–80% cheaper for batch and non-latency-sensitive workloads
- **Node pool composition** — right-sizing node types to workload profiles rather than running everything on general-purpose compute

These decisions have more impact than any workload-level optimization. The right cluster architecture for your workload mix is a FinOps conversation, not just an infrastructure one.

## What a 90-Day FinOps Programme for Kubernetes Looks Like

From a recent engagement — AKS cluster running 300+ microservices, $180K/month cloud spend:

**Days 1–30**: Deploy Kubecost, establish namespace-level attribution, identify top 10 most expensive workloads and their actual vs. requested resource ratios.

**Days 30–60**: Apply rightsizing recommendations to development and staging clusters first. Validate no regressions. Migrate spot node pools for non-production workloads.

**Days 60–90**: Apply approved rightsizing to production. Consolidate underutilised node pools. Implement automated scaling policies for time-based load patterns.

Outcome: 31% reduction in cluster cost without a single service incident.

The technology was straightforward. The time was spent on change management — convincing service owners that reducing their resource requests wouldn't cause instability.

---

*Running Kubernetes at scale and struggling with cost visibility? [Worth a conversation.](/contact)*
