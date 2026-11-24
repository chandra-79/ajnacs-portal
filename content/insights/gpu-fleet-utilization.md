---
title: "GPU Fleet Economics: Utilization, Scheduling, and Idle Capacity"
description: "GPU fleets are capacity planning with the stakes multiplied — scarce supply, brutal unit costs, and utilization numbers that would embarrass any CPU estate. The measurement honesty problem, the scheduling and sharing toolkit, and the organizational allocation that actually moves the number."
date: 2027-02-22
tags: ["AI Adoption", "FinOps", "Cloud Architecture", "Capacity Planning", "AI & MLOps"]
format: article
---

The GPU fleet is where every FinOps and capacity discipline in this series meets its most expensive test case: accelerators whose price, suitability and availability vary by hardware, region, contract and workload, with some capacity requiring advance reservation, and — in some workloads — **a large gap between allocated capacity and useful output**. The size of any underutilization problem must be established from the fleet's own measurements, workload mix and availability requirements.

## The measurement honesty problem

GPU utilization lies in layers, and the first discipline is knowing which layer you're reading: **allocation utilization** (the pod/instance holds the GPU — what cluster dashboards show) versus **kernel utilization** (something is executing — what `nvidia-smi`-style metrics show) versus **effective throughput** (accepted work per unit time, interpreted alongside profiler metrics such as SM activity and memory bandwidth). The gaps between layers are where the money goes: the notebook holding four GPUs while its owner is at lunch (allocated, idle — one possible reservation pattern to measure in research clusters), the training job blocked on data loading (allocated, kernel-idle — an input-pipeline bottleneck that utilization alone does not identify; correlate accelerator activity with host and pipeline profiling: the storage-and-preprocessing tier from data-pipeline practice failing to feed the accelerator), and the inference server running kernels at 15% occupancy (busy-looking, throughput-poor — the batching economics from inference practice, unapplied). The instrumentation floor: per-GPU, per-team, per-job metrics on all three layers, on the same FinOps dashboards as spend — because "our GPUs are all allocated" and "our GPUs are working" differ by the price of a small engineering org.

## The toolkit: sharing, scheduling, and the two workload shapes

The remedies sort by the two GPU workload shapes, which want opposite things. **Training/batch** (throughput-oriented, preemption-tolerant in principle): the scheduling tier does the heavy lifting — gang scheduling for multi-GPU jobs (the all-or-nothing allocation that prevents deadlocked partial claims), **queue-based platforms over hand-reservation** (the Kueue/Volcano-class batch layer on Kubernetes, or the managed equivalents — jobs declare shapes and priorities, the scheduler packs the fleet; a queue can reclaim abandoned reservations, but its effect must be measured against the actual workload), **preemptible tiers with checkpointing discipline** (the training job that checkpoints per the batch-resumability rules can ride lower-priority capacity and absorb eviction — which unlocks both spot economics and the priority ladder: production retraining preempts research exploration, per the criticality-tier logic), and the **input-pipeline engineering** that keeps the expensive silicon fed (prefetching, parallel decode, cached datasets — profiling can distinguish data starvation from insufficient accelerator capacity).

**Inference/serving** (latency-oriented, always-on): the utilization levers are the serving-stack disciplines — continuous batching and KV-cache management as the foundation, **fractional sharing for the small-model tier** (MIG-style hardware partitioning for isolation-grade splits, time-slicing for the tolerant tier — the appropriate sharing ratio depends on model footprint, traffic and isolation needs), model routing so small requests hit small models on shared slices (the routing economics, again the biggest lever), and autoscaling with the honest cold-start math (model-loading minutes mean scale-up leads demand — the capacity-headroom trade, priced at GPU rates; scale-to-zero only where the latency contract allows).

Underneath both: the **capacity portfolio** discipline from cloud-economics practice, sharpened by scarcity — committed/reserved capacity for the modeled floor, on-demand and spot for the crest, and the *utilization-versus-commitment* review run quarterly, because idle reserved GPUs are the purest waste in the building, and over-commitment is how they happen.

## The organizational layer: allocation is where the number moves

The technical toolkit stalls without the incentive layer, and GPU estates reproduce every commons failure: hoarding (the team that fought for quota and won't release it — allocation-as-property), invisible cost (research clusters where nobody sees a price), and the squeaky-wheel capacity process (allocation by escalation rather than by return). The countermeasures are familiar economics applied firmly: **showback/chargeback at the team-and-job grain** (the tagging-and-attribution discipline — a GPU-hour has a price and a consumer, visible weekly), **quota with reclamation** (idle allocations above threshold auto-release to the queue — the lease model over the property model, with the utilization telemetry as enforcement), **a real priority ladder adjudicated once** (the criticality-inventory review: production inference > scheduled retraining > time-boxed research bursts > exploratory — decided calmly, enforced by the scheduler, revisited quarterly — not re-litigated per Slack thread), and **the efficiency review for the top consumers** (the ten biggest jobs get profiling attention — the total-time discipline from performance practice; improving a major job can reduce the capacity needed for a fixed workload). And the meta-metric that keeps leadership honest: **cost per unit of ML outcome** (per training run to target quality, per thousand inferences at SLO — the unit economics that connect the fleet to the business), because "we need more GPUs" is only evaluable against "at what utilization, producing what."

The closing calibration: GPU scarcity gets narrated as a procurement problem, and it can also involve engineering and allocation decisions alongside genuine procurement constraints — the fleet you have, measured honestly, queued rather than hoarded, fed properly, shared fractionally, and allocated by priority, may have reclaimable capacity, although its amount requires measurement. The most expensive computer in the building deserves the estate's best operational disciplines; mostly it gets its newest. Closing that gap is the cheapest capacity anyone will buy this year.

## Start with a capacity ledger

An accelerator fleet needs a denominator before it needs an optimization target. Record device type, usable hours, maintenance exclusions, allocation owner and workload class. A GPU reserved for a latency-sensitive service can appear idle while providing deliberate recovery capacity. That reserve has a cost, but reclaiming it without checking the service objective is not an efficiency improvement.

For training, useful output might be a completed experiment that meets a declared validation threshold. For inference, it might be an accepted response delivered within the latency objective. Raw tokens are an intermediate quantity: generating twice as many unnecessary tokens can improve a throughput graph while making the product slower and more expensive. Keep both physical utilization and useful output in the ledger, without pretending one substitutes for the other.

Device-level averages also hide distribution. Four fully occupied devices and four idle devices can have the same average as eight partially occupied devices, yet support different scheduling decisions. Multi-device jobs may need specific interconnect topology, memory size or placement. A free GPU in an unsuitable topology is not necessarily usable capacity for the queued job.

## Worked example: account for the full week

Suppose a hypothetical fleet has eight identical GPUs available for a seven-day week. Its gross capacity is 8 × 24 × 7 = 1,344 GPU-hours. A synthetic ledger records 720 hours executing intended workloads, 240 hours allocated but idle, 192 hours reserved as serving headroom and 192 hours unavailable during maintenance. These categories are mutually exclusive and add to 1,344.

The chart reports those four categories. Work-executing time is 720/1,344, approximately 53.6% of gross capacity. If maintenance is excluded, the available denominator is 1,152 hours and the same 720 hours represents 62.5%. Neither is effective arithmetic utilization: the execution category can contain inefficient kernels or jobs waiting on communication. Publishing the denominator prevents an apparent improvement caused solely by removing maintenance from the calculation.

Assume, purely for budgeting, that the internal allocated cost is $3 per gross GPU-hour. The weekly ledger totals $4,032. Reclaiming 120 of the 240 allocated-idle hours makes 120 hours available to other work, with an attributed cost of $360. It does not automatically reduce the invoice by $360 if the hardware is already owned or committed. The benefit may instead be shorter queues or avoiding a future purchase. Cost avoidance, increased output and cash savings should have separate labels.

A proposed scheduler change can be tested against this ledger. If it moves 120 hours from allocated-idle to useful execution without changing headroom or maintenance, execution rises to 840 hours, or 62.5% of gross capacity. This is a scenario calculation, not a promise that any particular scheduler will achieve it. The next question is whether those extra hours produce accepted results.

## Profile the bottleneck before sharing the device

A low utilization signal can reflect CPU preprocessing, storage latency, network communication, small batches, synchronization or an intentionally low arrival rate. Compare the accelerator timeline with data-loader throughput and step timing. If the training process waits for decoded images, adding GPU sharing may make the queue look busier while leaving the input bottleneck unchanged.

Hardware partitioning and time sharing solve different problems. A partition can provide stronger resource separation on supported devices, but profiles and supported workloads constrain placement. Time sharing permits multiple processes to take turns and does not imply memory isolation or latency guarantees. Test interference with the actual tenant mix, especially when one task has bursty memory demand or a strict response deadline.

Memory is often the first scheduling constraint. Model weights, optimizer state, activations and caches have different growth patterns. A job's initial footprint does not necessarily represent its peak. Include startup, evaluation and checkpoint phases in profiling. A scheduler that packs only against average usage can create repeated out-of-memory failures that destroy the apparent utilization benefit.

## Queue policy is a product decision

Publish who can use capacity, how long a reservation lasts, what can be preempted and how a waiting user can understand their position. A strict priority ladder can starve lower-priority research indefinitely unless the policy also includes quotas, aging or guaranteed windows. Fairness should be an explicit requirement instead of an accidental property of the scheduler's default ordering.

Checkpointing needs a recovery test. A saved file is insufficient if the resumed run loses optimizer state, repeats data incorrectly or depends on local files that disappear on eviction. Measure checkpoint duration, storage consumption and lost work after interruption. Frequent checkpoints reduce replay work but consume bandwidth and execution time; choose the interval against the observed interruption risk and recovery objective.

For inference, do not preempt the minimum serving capacity based only on current traffic. Model load time, warmup and cache rebuilding create a delay before replacement capacity serves correctly. Rehearse a replica loss during a realistic burst. If the surviving replicas cannot meet the objective while replacements start, the headroom is serving a measurable purpose.

## A practical fleet-review worksheet

Take a 48-hour window and join scheduler allocations, accelerator metrics, job outcomes and attributed cost by device and job identifier. Use a small enough interval to see idle reservations but a large enough interval to avoid interpreting momentary sampling noise as waste. Mark missing telemetry explicitly rather than replacing it with zero utilization.

For each top consumer, record requested devices, allocated duration, active execution duration, peak memory, completed useful work and interruption count. Select one intervention with a clear causal hypothesis: reduce preprocessing delay, reclaim abandoned interactive sessions, or change batch admission. Do not simultaneously change model size, precision and scheduler policy if the goal is to understand which intervention improved output.

Run a matched rehearsal with the same workload set and similar capacity. Report queue wait, completion time, failed jobs, service latency and useful output per gross GPU-hour. If jobs complete faster but more fail, the tradeoff belongs in the decision. Preserve the raw ledger and calculation script so another engineer can reproduce the chart without relying on a screenshot.

## Capacity decisions after the experiment

A fleet review should end with a specific decision: reclaim a named reservation, change one queue policy, retain headroom for a documented failure scenario, or buy capacity because the constrained resource is genuinely exhausted. Procurement can be the right answer. The evidence should show why existing capacity cannot meet the accepted workload, rather than assuming every low average means waste or every long queue means shortage.

Revisit the decision when model architecture, request length or workload mix changes. A previous packing arrangement may become invalid after a memory-intensive feature launches. Treat the capacity ledger as a living operating record, with owners and definitions, so efficiency gains remain visible and service quality does not become the hidden cost of a better utilization percentage.

## Sources and further study

- [NVIDIA — DCGM feature and profiling overview](https://docs.nvidia.com/datacenter/dcgm/latest/user-guide/feature-overview.html)
- [vLLM — Paged attention design](https://docs.vllm.ai/en/latest/design/paged_attention/)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
