---
title: "Kubernetes Cost Visibility — The Gap That Kills FinOps Programs"
description: "Kubernetes is one of the hardest places to apply FinOps discipline. Here's what actual cost visibility requires and where most teams fall short."
date: 2025-02-17
tags: ["FinOps", "Containers", "Cloud Architecture"]
format: article
---

Kubernetes is, from a FinOps perspective, a visibility problem masquerading as a cost problem.

Cloud billing APIs tell you what a cluster costs. They tell you almost nothing about *why* — which workloads are driving that cost, which are over-provisioned, which are idle, and whether your bin-packing efficiency is anywhere near where it should be. That gap is where FinOps programs break down.

## What to measure

**Cost per unit with requests and usage visible.** If nodes cost $1,800 to serve 12 million successful jobs, allocation is $0.15 per 1,000 jobs. Pair it with requested versus used CPU and memory. A higher utilisation ratio only helps if cost or capacity improves at the same reliability objective.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [FinOps Foundation, State of FinOps 2026](https://data.finops.org/).

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

Illustrative scenario. An AKS cluster runs 300 microservices with $180,000 in monthly spend. Use the following plan to investigate allocation and optimization. These numbers are inputs to the example.

**Days 1–30**: Deploy Kubecost, establish namespace-level attribution, identify top 10 most expensive workloads and their actual vs. requested resource ratios.

**Days 30–60**: Apply rightsizing recommendations to development and staging clusters first. Validate no regressions. Migrate spot node pools for non-production workloads.

**Days 60–90**: Apply approved rightsizing to production. Consolidate underutilised node pools. Implement automated scaling policies for time-based load patterns.

Define acceptance before rightsizing: compare allocation-adjusted cost and unit cost while monitoring eviction, throttling, saturation, and user-facing objectives. Record baseline and post-change windows using the same demand mix. Have owners reverse or revise changes when guardrails fail. Savings become a measured result only after that comparison.

*Running Kubernetes at scale and struggling with cost visibility? [Worth a conversation.](/contact/)*

## Tie allocations to the bill without hiding idle capacity

Choose a reporting interval and classify the costs that support the cluster. Attribute persistent volumes and workload-specific network charges with clear owners where the export supports it. Build a node-hour pool for capacity. Separate infrastructure overhead, shared system workloads, and unused node capacity. If you redistribute the latter two to teams, publish that rule and show the undistributed amounts somewhere a reviewer can inspect.

Use an illustrative $120 node pool for one interval. Workload A is assigned $44 of capacity, workload B $36, and platform components $10. The difference from $120 is $30 of idle asset cost, or 25% of the pool. Cluster cost did not decline when you allocated those dollars. If the two workloads must absorb idle proportionally to their already assigned capacity, A receives $16.50 and B receives $13.50. The original $30 should remain available as a separate dimension even after it is attributed for showback. The [OpenCost specification](https://opencost.io/docs/specification/) separates these ideas and describes several methods for distributing overhead.

## Model the scheduling constraint behind a large node pool

A workload's resource request helps the scheduler decide whether there is usable capacity on an individual node. Aggregate unused CPU can look plentiful while the shape a pod actually needs is unavailable on any single node. Memory, affinity, topology, and taints can bind placement independently of CPU. A cost review that combines all requested CPU into one cluster total hides those placement restrictions.

Suppose four nodes each have three allocatable CPU cores left across two separate zones. A pending pod requests four cores. Twelve cores exist in aggregate but the pod fits nowhere. Reducing unrelated memory requests is unlikely to help that pod. Check scheduler events, the effective CPU and memory requests, and where the pod is eligible to run. Compare a reshaped node pool against a validated smaller request. Do not reduce a request so aggressively that the pod only meets its latency objective when no other workload competes with it. Use the [Kubernetes resource management documentation](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) to interpret placement and limits.

## Test interaction with the autoscaler

A CPU utilization target can be defined relative to requests. Changing the request therefore changes the percentage at the same actual usage. In an illustrative service, each of four replicas uses 200 millicores on average. At a 400-millicore request, utilization is 50%. At a 250-millicore request, it becomes 80%. A controller targeting 60% may add replicas even though total traffic is unchanged. That calculation is a signal to test the deployment and the controller together, including stabilization and missing metrics. See the [Kubernetes horizontal autoscaler algorithm](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

Compare new replica counts, queue time, memory working set, restarts, throttling, placement, and node count. Measure accepted jobs or successful operations so a less reliable workload does not appear cheaper simply because it did less. Rehearse one eviction during peak traffic when evaluating interruptible nodes. Report retries, timeouts, or additional checkpoint writes as part of the test.

## Confirm that the trial actually releases spend

Run a limited trial and assign it a decision owner. Keep a frozen copy of previous requests, rollout configuration, and autoscaler settings. Cut over one representative deployment, wait through a normal peak, and exercise rollback. Inspect whether another pod can fill the capacity or whether an actual node can be removed. A reduction in an allocated workload total does not necessarily eliminate a fixed node, managed pool minimum, or existing commitment.

A trial is successful when it keeps the same reliability target and either reduces the effective bill, delays a planned capacity purchase, or frees clearly measured headroom for another workload. Avoid combining those outcomes into a single savings claim. Record the unit, timing, and evidence for each. A decision to retain safe idle capacity can be appropriate if the estate is about to hit a demand peak or if autoscaling cannot react within the service's latency budget.

For the next close, use unchanged ownership keys even if pods were replaced. Match costs to deployment or service identities and use dated rules when labels change. Publish both the result at the cluster boundary and the result per successful unit. Ask the owner to reproduce the figures from the invoice scope, the node inventory, and the workload outcomes. Investigate any difference before recommending the same request change across other namespaces.

Keep one counterfactual for finance. If the existing fleet would have grown next month, record what triggered the expected purchase and which period it covered. Delayed growth is useful capacity planning evidence. The scope and resource price still need to match when validating the next forecast.
