---
title: "Kubernetes Autoscaling, Properly: HPA, VPA, Karpenter, and the Layers in Between"
description: "Autoscaling in Kubernetes is three separate problems wearing one name — scaling pods out, sizing pods right, and provisioning nodes. How the layers interact, the metrics that should drive them, and the failure modes of half-configured autoscaling."
date: 2027-04-05
tags: ["Containers", "Cloud Architecture", "Autoscaling", "FinOps", "Platform Engineering"]
format: article
---

"We have autoscaling" is one of the most ambiguous sentences in cloud operations. Kubernetes autoscaling is three distinct problems — how many *pod replicas* (horizontal), how big *each pod* (vertical), and how many *nodes* under them (cluster) — solved by different components with different failure modes, and a cluster with only one layer configured routinely behaves worse than a cluster with none: pods scale out onto nodes that don't exist, or nodes scale up under pods whose requests are fiction.

Here's the full stack, layer by layer, and how to make them cooperate.

## Layer 1: HPA — scaling out, on the right signal

The Horizontal Pod Autoscaler adjusts replica counts toward a target metric. The default — CPU utilization percentage — is also the most misleading default in Kubernetes, for two reasons. First, it's a percentage *of requests*, so wrong requests make the HPA hallucinate: a pod requesting 2 cores but using 0.2 at healthy load reads as 10% utilized, and the HPA will scale it *in* until latency explodes. HPA correctness is downstream of request correctness — fix sizing (layer 2) before trusting the scaler. Second, many services don't saturate on CPU at all: an async API gateway melts on connection counts and downstream latency while CPU idles.

The maturity path is moving the signal closer to the work: **requests-per-second or queue depth via custom metrics** (Prometheus Adapter or, far more common now, **KEDA** — which scales on external event sources like Kafka lag, SQS depth, or Prometheus queries, and adds scale-to-zero for event-driven workloads, something the HPA alone can't do). The best scaling signal is almost always "how much work is waiting," not "how busy is the CPU."

Behavioral tuning matters as much as the signal: the `behavior` stanza (stabilization windows, scale-up/down rate policies) is where you encode "scale up fast, scale down slow" — the asymmetry nearly every service wants, since under-capacity costs users and over-capacity costs cents. And every HPA needs sane min/max bounds: minimum high enough to absorb a node failure and cover baseline burst, maximum low enough that a metrics bug can't scale you into your cloud quota.

## Layer 2: sizing pods — VPA's promise and its practical role

The Vertical Pod Autoscaler observes actual usage and recommends (or applies) request adjustments. Its unresolved awkwardness: applying changes historically required pod restarts, and its updater plus HPA on the same CPU metric fight each other. In practice, the pattern that has won in most estates: **VPA in recommendation mode as a continuously-updated sizing oracle**, consumed by humans or automation that bakes the numbers into manifests through normal GitOps review — rather than VPA live-mutating production. (In-place resize is maturing in recent Kubernetes and slowly softening the restart caveat, but the recommendation-mode pattern remains the safe default.)

Why this layer is non-optional regardless of tooling: **requests are the currency of the whole scheduling economy.** Requests decide bin-packing (over-request and you pay for phantom capacity — the single largest waste line in most Kubernetes bills), HPA math (above), and eviction order. Limits are a different instrument: memory limits are genuinely protective (OOM containment); CPU limits are contested — throttling latency-sensitive pods at p99 is a classic self-inflicted wound, and many mature shops set CPU requests honestly and skip CPU limits entirely. Whatever the house policy, "every workload has evidence-based requests, reviewed quarterly" is the foundation the other layers stand on.

## Layer 3: nodes — from Cluster Autoscaler to Karpenter

Someone has to make the machines. The classic **Cluster Autoscaler** works against pre-defined node groups (ASGs/node pools): pending pods trigger scale-up of a group, empty nodes get reclaimed. It's stable and universal, but it thinks in *groups* — you curate instance types in advance, and heterogeneous workloads mean either group sprawl or poor fit.

**Karpenter** (now a CNCF project, first-class on AWS and spreading) inverted the model: it watches pending pods and provisions *individual, just-right nodes* directly from the provider's full instance catalog — considering price, availability, spot capacity, and the pods' actual shapes — then actively **consolidates**: repacking workloads onto fewer/cheaper nodes as load ebbs and replacing nodes when better economics appear. The measured wins are real (double-digit percentage node-cost reductions are routinely reported, alongside faster scale-up), and the operational shift is that node *churn becomes constant and normal* — which forcefully surfaces every workload that couldn't survive disruption anyway.

That churn is why the safety rails stop being optional at this layer: **PodDisruptionBudgets on everything that matters** (Karpenter and the autoscaler both respect them — a missing PDB is consent to arbitrary disruption), **topology spread constraints** so consolidation doesn't stack all replicas of a service onto one node, graceful shutdown handling in every service (SIGTERM → drain → exit, tested), and `do-not-disrupt` annotations reserved for the genuinely immovable few.

## Making the layers cooperate

The interaction contract, stated once: **HPA decides how many, requests decide how big, Karpenter/CA decides where** — and each layer trusts the one below. The composite failure modes are all violations of that trust: HPA scaling on fictional requests (fix sizing); pods pending because node provisioning lags a traffic spike (fix with some headroom — overprovisioning placeholder pods that evict for real work, or higher HPA minimums — because node boot time, even Karpenter-fast, is not zero); scale-down storms where HPA shrinks, consolidation repacks, and PDB-less services take simultaneous restarts (fix with PDBs and scale-down stabilization); and the thundering-herd variant where every service's HPA reacts to the same upstream spike and the cluster requests 400 nodes (fix with maxes, quotas, and priority classes so the important work wins the scramble).

Two disciplines close the loop. **Load-test the scaling itself** — not just "does the service handle load," but "does the *stack* handle the load arriving fast": watch pending-pod time, scale-up latency end-to-end, and what breaks during the subsequent scale-*down*, which is reliably where the surprises live. And **treat autoscaling as a FinOps instrument with SLOs on both sides**: a target for pending-time/latency (the user side) and a target for utilization/waste (the cost side), reviewed together — because autoscaling configured by the reliability team alone buys comfort with money, and configured by the cost team alone buys savings with outages. The whole point of the machinery is that you shouldn't have to choose more than once.
