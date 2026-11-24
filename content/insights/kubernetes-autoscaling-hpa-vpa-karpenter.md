---
title: "Kubernetes Autoscaling, Properly: HPA, VPA, Karpenter, and the Layers in Between"
description: "Autoscaling in Kubernetes is three separate problems wearing one name — scaling pods out, sizing pods right, and provisioning nodes. How the layers interact, the metrics that should drive them, and the failure modes of half-configured autoscaling."
date: 2027-04-05
tags: ["Containers", "Cloud Architecture", "Autoscaling", "FinOps", "Platform Engineering"]
format: article
---

"We have autoscaling" is one of the most ambiguous sentences in cloud operations. Kubernetes autoscaling is three distinct problems — how many *pod replicas* (horizontal), how big *each pod* (vertical), and how many *nodes* under them (cluster) — solved by different components with different failure modes, and incomplete coordination between these layers can leave scaling unable to meet the workload: pods scale out onto nodes that don't exist, or nodes scale up under pods whose requests are fiction.

Here's the full stack, layer by layer, and how to make them cooperate.

## Layer 1: HPA — scaling out, on the right signal

The Horizontal Pod Autoscaler adjusts replica counts toward a target metric. The default — CPU utilization percentage — is also the most misleading default in Kubernetes, for two reasons. First, it's a percentage *of requests*, so wrong requests make the HPA hallucinate: a pod requesting 2 cores but using 0.2 at healthy load reads as 10% utilized, and that utilization signal may recommend fewer replicas, depending on its target, tolerance, other metrics, bounds and stabilization. Whether latency worsens must be tested. HPA correctness is downstream of request correctness — fix sizing (layer 2) before trusting the scaler. Second, many services don't saturate on CPU at all: an async API gateway melts on connection counts and downstream latency while CPU idles.

The maturity path is moving the signal closer to the work: **requests-per-second or queue depth via custom metrics** (Prometheus Adapter or, **KEDA** — which scales on external event sources like Kafka lag, SQS depth, or Prometheus queries, and adds scale-to-zero for event-driven workloads, with behavior depending on metrics, configuration, and supported feature gates). Choose a scaling signal that predicts the resource constraint and the user objective; queue depth and CPU utilization each fit some workloads.

Behavioral tuning matters as much as the signal: the `behavior` stanza (stabilization windows, scale-up/down rate policies) is where you encode "scale up fast, scale down slow" — the asymmetry nearly every service wants, since under-capacity costs users and over-capacity has a workload-dependent cost. And every HPA needs sane min/max bounds: minimum high enough to absorb a node failure and cover baseline burst, maximum low enough that a metrics bug can't scale you into your cloud quota.

## Layer 2: sizing pods — VPA's promise and its practical role

The Vertical Pod Autoscaler observes actual usage and recommends (or applies) request adjustments. Its unresolved awkwardness: applying changes historically required pod restarts, and its updater plus HPA on the same CPU metric fight each other. In practice, a useful starting pattern: **VPA in recommendation mode as continuously updated sizing evidence**, consumed by humans or automation that bakes the numbers into manifests through normal GitOps review — rather than VPA live-mutating production. (In-place resize and VPA update modes depend on the installed versions and configuration. Recommendation mode permits inspection before choosing the update mechanism and its disruption policy.)

Why this layer is non-optional regardless of tooling: **requests are the currency of the whole scheduling economy.** Requests influence scheduling and bin-packing (over-request and you pay for phantom capacity — one potential source of unnecessary reserved capacity), HPA math (above), and resource-sharing and eviction considerations alongside other factors. Limits are a different instrument: memory limits constrain container memory use and can lead to OOM termination when exceeded; CPU limits are contested — throttling latency-sensitive pods at p99 is a classic self-inflicted wound, and many mature shops set CPU requests honestly and skip CPU limits entirely. Whatever the house policy, "every workload has evidence-based requests, reviewed quarterly" is the foundation the other layers stand on.

## Layer 3: nodes — from Cluster Autoscaler to Karpenter

Someone has to make the machines. The classic **Cluster Autoscaler** works against pre-defined node groups (ASGs/node pools): pending pods trigger scale-up of a group, eligible underutilized nodes can be removed. Its behavior depends on supported providers and configuration, but it thinks in *groups* — you curate instance types in advance, and heterogeneous workloads mean either group sprawl or poor fit.

**Karpenter** inverted the model: it watches pending pods and provisions *individual, just-right nodes* from the supported provider offerings permitted by NodePool, NodeClass and pod constraints — considering price, availability, spot capacity, and the pods' actual shapes — then actively **consolidates**: repacking workloads onto fewer/cheaper nodes as load ebbs and replacing nodes when better economics appear. Any cost and scale-up improvement must be measured for the workload, and the operational shift is that eligible node replacements become controller-managed events, bounded by configuration and disruption controls — which forcefully surfaces every workload that couldn't survive disruption anyway.

That churn is why the safety rails stop being optional at this layer: **PodDisruptionBudgets on everything that matters** (their protection applies to supported voluntary disruptions, not every failure or forced termination), **topology spread constraints** so consolidation doesn't stack all replicas of a service onto one node, graceful shutdown handling in every service (SIGTERM → drain → exit, tested), and `do-not-disrupt` annotations reserved for the genuinely immovable few.

## Making the layers cooperate

The interaction contract, stated once: **HPA decides how many, requests decide how big, Karpenter/CA decides where** — and each layer trusts the one below. The composite failure modes are all violations of that trust: HPA scaling on fictional requests (fix sizing); pods pending because node provisioning lags a traffic spike (fix with some headroom — overprovisioning placeholder pods that evict for real work, or higher HPA minimums — because node boot time, even Karpenter-fast, is not zero); scale-down storms where HPA shrinks, consolidation repacks, and PDB-less services take simultaneous restarts (fix with PDBs and scale-down stabilization); and the thundering-herd variant where every service's HPA reacts to the same upstream spike and the cluster requests 400 nodes (fix with maxes, quotas, and priority classes so the important work wins the scramble).

Two disciplines close the loop. **Load-test the scaling itself** — not just "does the service handle load," but "does the *stack* handle the load arriving fast": watch pending-pod time, scale-up latency end-to-end, and what breaks during the subsequent scale-*down*, which is reliably where the surprises live. And **treat autoscaling as a FinOps instrument with SLOs on both sides**: a target for pending-time/latency (the user side) and a target for utilization/waste (the cost side), reviewed together — because autoscaling configured by the reliability team alone buys comfort with money, and configured by the cost team alone buys savings with outages. The whole point of the machinery is that you shouldn't have to choose more than once.

## Calculate the first scaling decision by hand

Use a synthetic deployment with four ready replicas. Each requests 500 millicores and currently uses 375, so its CPU utilization relative to request is 75%. With a target of 50%, the simplified HPA recommendation is ceiling(4 × 75 / 50) = six replicas. This is the teaching form of the calculation; actual behavior also includes tolerance, missing metrics, readiness handling, stabilization, policies, and replica bounds.

Now change each request to 1,000 millicores while holding the same measured 375-millicore usage. Utilization becomes 37.5%, and the same simplified formula recommends ceiling(4 × 37.5 / 50) = three replicas. The chart compares current four, first recommendation six, and recommendation after the request change three. It illustrates coupling between resource requests and CPU-utilization scaling, not a recommended production resize.

The two recommendations do not mean the service's true capacity changed instantly. The denominator changed. If the application cannot meet its latency objective with three replicas, the new configuration is unsafe even though the arithmetic is correct. A utilization target is a control input selected from measured behavior, not a universal definition of adequate capacity. Track completed requests and latency during the experiment.

## Model the delay between a recommendation and useful capacity

Replica count is not ready capacity. After HPA changes desired replicas, a pod may wait for scheduling, a node, image download, initialization, readiness, and warm caches. Record timestamps for each stage. A pending pod caused by an impossible affinity rule will not be fixed by adding arbitrary nodes. A pod whose image cannot be pulled will not become useful because the desired replica count increases.

Suppose an illustrative burst adds 300 requests per second beyond the existing safe capacity and new replicas take 90 seconds to become ready. If all excess work queues, 27,000 requests accumulate before capacity arrives, ignoring changes in service rate. The queue may exceed memory or user deadlines long before the node appears. Headroom, admission control, caching, and workload scheduling can be necessary alongside autoscaling.

For asynchronous work, measure oldest-message age and processing rate as well as queue depth. A depth of 1,000 tiny jobs and 1,000 hour-long jobs imply different capacity needs. If retries multiply work or a downstream service is saturated, adding consumers may make the situation worse. Scale on a signal with a known relationship to useful work and apply a maximum consistent with dependency capacity.

## Test the complete loop in a disposable cluster

Deploy a small service with explicit requests, readiness checks, shutdown handling, and an HPA. Use a bounded synthetic load generator that records offered requests, successful completions, latency, and errors. Start below capacity, increase load gradually, then apply one controlled step change. Capture HPA conditions, desired and ready replicas, pending reasons, and node events on the same timeline.

Repeat with a deliberately unavailable metrics source. Observe the controller's conditions and behavior rather than assuming it scales to zero or freezes in every situation. Then test a missing resource request on a relevant container. Sidecars can change utilization calculations and scheduling footprint, so include the actual pod composition. A single-container demo may conceal a production request configuration error.

Next constrain node availability using a test quota or an intentionally narrow instance selection. Verify that pending workloads produce an actionable signal and that request latency or queue age is visible before the application collapses. Remove the constraint and observe recovery. Node provisioning needs provider permissions, available capacity, subnet addresses, quotas, and valid placement; none is supplied by HPA itself.

Finally reduce load and watch scale-down. Confirm that terminating pods stop receiving new work, finish or safely return in-flight work, and exit within the grace period. An application that acknowledges a job before durable completion may lose work when a node is consolidated. A PodDisruptionBudget does not repair that acknowledgment protocol.

## Treat disruption controls as scoped mechanisms

A PodDisruptionBudget constrains certain voluntary disruptions through the eviction mechanism. It cannot prevent a node failure, guarantee spare capacity, or automatically make every form of termination safe. Karpenter's disruption behavior distinguishes methods and includes time limits and other constraints; review the version you operate. An annotation that blocks one voluntary action is not protection against every provider interruption or manual deletion.

Design replica placement across the failure domains that matter, but check that the topology and affinity constraints remain schedulable under the capacity you can actually obtain. A strict distribution rule can improve isolation and also leave pods pending during an outage. Test the reduced-capacity case. Define the acceptable degraded behavior instead of assuming every desirable constraint can always be satisfied simultaneously.

Node consolidation is a cost optimization with movement costs. Image pulls, cache warming, connection churn, and redistributed load can affect the application. Measure the resulting service behavior and total cost, including transition overhead. A cheaper instance price does not prove a lower cost per successful unit of work if disruption causes retries or latency violations.

## Use vertical recommendations as evidence

VPA recommendations describe observed usage under its model and history. They can miss a rare workload phase that has not occurred in the observation window. Review startup peaks, periodic jobs, traffic seasonality, and memory growth before applying a lower request. A workload's memory limit can cause termination when exceeded; it is not a complete containment guarantee against every host-pressure failure.

When horizontal and vertical controllers both react to CPU, changing requests changes the utilization signal that drives HPA. Avoid an uncontrolled feedback loop by choosing compatible metrics and update policies. Recommendation-only operation is one practical starting point. In-place resizing and updater behavior depend on the cluster and VPA versions, so test their actual capabilities and disruption semantics rather than assuming a release feature is enabled everywhere.

CPU limits and requests solve different problems. A limit can constrain noisy workloads and can also throttle latency-sensitive work. Omitting limits has resource-sharing consequences and may conflict with platform policy. Evaluate the choice with neighboring workloads and the failure scenario, not only a quiet single-service benchmark. Include system and daemon overhead when calculating node fit.

## Review reliability and cost on the same worksheet

For each experiment, record successful units, elapsed time, resource consumption, node cost under declared prices, and SLO violations. Use identical offered work or normalize carefully when comparing configurations. An inexpensive configuration that completed fewer jobs is not automatically more efficient; a configuration that overprovisions indefinitely may be reliable but unnecessarily costly.

The deployment is ready when the team can explain its scale-up signal, bounds, time to usable capacity, dependency limits, scale-down safety, and unavailable-capacity behavior. Keep a rollback for policy changes and retain the experiment data. Autoscaling should be a tested control system whose limitations are visible, not a promise that an orchestrator will invent capacity exactly when users need it.

## Primary references

- [Kubernetes HPA algorithm and behavior](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)
- [Kubernetes node autoscaling](https://kubernetes.io/docs/concepts/cluster-administration/node-autoscaling/)
- [Karpenter disruption semantics](https://karpenter.sh/docs/concepts/disruption/)

- [Karpenter NodePool and pod requirements](https://karpenter.sh/docs/concepts/nodepools/)
