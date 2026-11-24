---
title: "Green Software Engineering: Carbon as a Nonfunctional Requirement"
description: "Define a software carbon boundary, estimate energy and embodied emissions per useful output, and compare efficiency, placement and scheduling with explicit constraints."
date: 2027-01-18
tags: ["Sustainability", "Cloud Architecture", "FinOps", "Engineering Leadership", "Architecture"]
format: article
---

Software carbon work becomes actionable when a team defines the service boundary, the useful output and the assumptions behind its estimate. A bill can identify expensive resources, while energy and carbon calculations answer different questions. Discounts, licensing and regional pricing can change spend without changing physical consumption. Treat cost and emissions as separate outcomes that can sometimes improve together, then test that relationship for the selected workload. An engineering estimate should also remain distinct from an organization-wide reporting or compliance claim, whose boundaries and assurance requirements may differ.

## Measurement: imperfect numbers, useful directions

A carbon estimate is only as useful as its inputs and boundary. Record whether energy comes from a meter, a provider allocation or a hardware model, and document the electricity-intensity source and accounting method. Different methods can answer different questions. FinOps ownership tags may help allocate a workload, but a currency amount is not an energy measurement: an expensive licensed service can consume less electricity than a cheaper compute-heavy one. Preserve the uncertainty and resolution of each input. If the estimate cannot distinguish two alternatives, state that limitation and collect better evidence rather than ranking them by a small numerical difference.

## The hierarchy of actual impact

The following options form a decision inventory, not a universal ranking. Estimate each against the same useful output and operational constraints:

**1. Remove unnecessary work and capacity.** Review idle environments, redundant pipelines, unused retained data and excessive reservations. Verify ownership and recovery needs before deletion. Consolidating workloads may reduce provisioned capacity, but a reduction in reservations does not automatically prove that physical hardware or electricity use fell. Record whether equipment powers down, scales in, or remains available to other tenants; explain how the chosen allocation treats that change.

**2. Compare platforms and locations.** Hardware, runtime and managed-service choices can affect energy per completed task. Benchmark the actual application at comparable quality, throughput and latency rather than assuming an architecture is universally more efficient. For regional placement, include the selected electricity factor, transfer work, data residency, reliability and user latency. A lower regional factor can be relevant while still failing the complete service constraint.

**3. Schedule flexible work against an explicit deadline.** A batch can sometimes move to a lower-intensity time or location, but forecasts, queueing, data movement and recovery time affect the result. Keep enough slack for a failed run to retry. Record the scheduler’s added complexity and the consequence of a missing intensity signal. Compare deadline compliance and completed output alongside the carbon estimate; time flexibility does not mean implementation is free.

**4. Measure software-level efficiency.** Profiling, avoiding redundant work, improving queries and reducing unnecessary transfers can alter energy per useful result. A percentage reduction in execution time is not necessarily the same percentage reduction in energy, particularly when idle power or shared hardware dominates. Compare controlled runs and retain output-quality checks. There is no fixed ordering that always places code optimization behind placement or capacity changes.

**AI workloads need their own boundary.** Training, experimentation and inference have different schedules and resource patterns; no fixed ratio determines which dominates a particular product. Quantization, batching and smaller-model routing can change compute demand, but also affect quality, latency and repeated attempts. Evaluate completed useful outputs under a stable quality criterion and include failed generations and retries. A small model that requires repeated correction may not improve the complete workflow, while unnecessary inference can sometimes be avoided altogether.

## The program: make it boring, make it visible

What separates green engineering from green marketing is the same machinery as every other operational discipline: **a baseline** (current footprint by team/service via the FinOps taxonomy — imperfect, published anyway), **targets that retain both intensity and absolute emissions** (emissions per completed transaction can fall while total emissions rise; show both outcomes and the growth assumptions instead of treating either metric as a complete success claim), **defaults over evangelism** (the paved road runs on efficient instance types, right-sized requests, carbon-aware batch windows, and clean-region placement *by default* — sustainability by configuration beats sustainability by persuasion, exactly as security learned), **review-gate presence** (the architecture-review checklist gains one line: "placement and scheduling considered for carbon?" — most of the time the answer is "rides the default," which is the point), and **honesty about offsets and claims** (engineering leaders should know enough accounting to keep their company's public claims defensible — "matched annually with renewable certificates" and "runs on clean energy" are different sentences, and the gap is where credibility dies).

An executive review should compare candidate changes by expected emissions, financial cost, delivery effort and operational risk. No universal percentage split establishes how much of the work belongs to FinOps, placement, scheduling or application optimization. Assign owners to the largest uncertainties and choose one bounded experiment whose result could change the decision. Reuse inventory and ownership processes where appropriate, while retaining the distinct physical assumptions needed for a carbon estimate.

## Make the operating contract explicit

A software carbon calculation needs an explicit boundary and a useful output. Include the energy attributable to the selected workload and the share of hardware embodied emissions included by the chosen method. State the location and time basis of the electricity intensity. A rate per completed transaction answers a different question from total emissions over a month; both can matter when usage changes.

Avoid converting CPU utilization directly into emissions. A server has idle power, nonlinear load behavior and shared infrastructure overhead. An application running at twice the utilization does not automatically halve its carbon per result. Measure or estimate energy using a documented model, and retain uncertainty. A region-level average electricity factor also differs from a marginal factor used to estimate the consequence of shifting demand. Those are different analytical questions, not interchangeable inputs.

Optimization needs service constraints. Delaying a batch until electricity intensity is lower can be useful only if its completion deadline, data locality and reliability remain acceptable. Moving data across regions can introduce transfer energy and extra replicas. Deleting unnecessary work is often easier to reason about than relocating it, but the outcome still requires a consistent measurement boundary. Keep the quality of the completed output constant when comparing approaches.

## Keep the environmental claim narrower than the model

An estimate can support an engineering comparison without supporting a broad environmental claim. If the model covers one batch's compute energy and an allocated hardware contribution, it does not establish the footprint of the entire product or company. Document excluded storage, networking, end-user devices and organizational activity. The result becomes more credible when the boundary is precise rather than when the number is presented with excessive decimal places.

Choose an output that resists accidental improvement. Counting attempted requests can make a retry-heavy system look efficient because failures increase the denominator. Counting bytes processed can reward redundant processing. Prefer completed useful work at a defined quality level and keep total demand beside the rate. If optimization lowers the rate but substantially increases total usage, both observations should remain visible. The engineering decision may still be useful, but it answers more than one question.

For shared hardware, allocation is an assumption that needs inspection. CPU time, reserved capacity and resource occupancy can yield different shares. A workload with little CPU activity can still reserve memory or prevent a machine from being powered down. State why the chosen allocation is appropriate to the system boundary, and test whether a reasonable alternative changes the recommendation. Do not present a modeled hardware share as a direct meter reading.

Treat carbon-aware scheduling as constrained scheduling. Record the latest completion time, data location, retry behavior and the reliability of the intensity signal. A job moved to a lower-intensity period may overlap other jobs and require additional capacity. A delayed failure may leave insufficient time for recovery before the business deadline. Run a bounded pilot that records completed work, energy estimate and deadline compliance together. Those observations support a practical decision more reliably than a generic assertion that one region or processor is greener.

Preserve the original measurement inputs alongside the figure. Energy units, electricity-factor units and the output count should be reproducible without reading the chart image. A reviewer should be able to change one assumption and recalculate the rate. When uncertainty is large, a range is more informative than a precise-looking point estimate. The worked values in this article demonstrate the arithmetic only; replacing them with a local estimate requires a documented data source and a boundary that matches the actual workload.

Keep absolute emissions beside the intensity rate when demand changes.

## Work through an illustrative scenario

A fictional batch uses 100 kWh at an assumed electricity intensity of 300 gCO2e/kWh. Operational emissions are 30,000 gCO2e. Add an explicitly allocated 5,000 gCO2e hardware contribution and divide by 10,000 completed jobs: 3.5 gCO2e per job. An optimized run uses 80 kWh with the same factor, hardware allocation and output, producing 2.9 gCO2e per job. These inputs are illustrative; the chart does not represent a cloud region, a provider footprint or a measured customer workload.

| Observation | Value (gCO2e per job) |
| --- | ---: |
| Original batch | 3.5 |
| Reduced-energy batch | 2.9 |

**Calculation and limits.** Synthetic calculation: (energy in kWh times 300 gCO2e/kWh plus 5,000 gCO2e allocated hardware emissions) divided by 10,000 completed jobs. Energy changes from 100 to 80 kWh; other inputs and output quality are held constant.

## Build the evidence worksheet

**Functional unit.** Define the completed output, quality threshold and denominator used for the rate.

**Energy boundary.** Identify application compute, storage, network and shared overhead included in the estimate.

**Electricity factor.** Record the intensity source, location, time interval and whether the factor is average or marginal.

**Hardware allocation.** Explain the embodied-emissions allocation and the device lifetime or capacity assumptions behind it.

**Service constraint.** Retain latency, deadline, locality and availability requirements during optimization.

**Uncertainty.** Show which inputs are metered and which are modeled so a small apparent improvement is not overstated.

## Rehearse the failure boundary

1. **Reduce output volume.** Compare total emissions and emissions per job to reveal fixed overhead that remains.

2. **Change the intensity factor.** Show sensitivity to the chosen location or time basis without silently changing the system boundary.

3. **Delay a batch.** Verify that completion deadlines and downstream dependencies still work before claiming a benefit.

4. **Add an extra replica.** Include its energy and hardware allocation rather than counting only the optimized primary worker.

## Sources for the mechanisms

- [Software Carbon Intensity specification](https://sci.greensoftware.foundation/)
- [AWS architectural trade-offs](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

## Check whether the comparison survives uncertain inputs

Before presenting a preferred option, vary the uncertain electricity factor and hardware allocation within justified ranges. If the ordering reverses, report that sensitivity and identify which missing measurement would resolve it. Repeat the workload with a declared dataset, concurrency and output-quality check; record warm-up, caching and background activity so a shorter run is not mistaken for a physical reduction caused by the code change.

Archive the input dataset identifier, energy-estimation configuration, output count and code revision beside each comparison so another reviewer can repeat it. Retain unsuccessful experiments too. A lower-compute implementation can increase storage retention, transfer volume or retries. Extend the boundary when those effects are material, and distinguish an estimated allocation change from an observed meter change. This makes the worksheet useful for an engineering decision even when a precise product-wide footprint is unavailable.
