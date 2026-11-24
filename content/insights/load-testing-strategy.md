---
title: "Load Testing: Workload Models, Queueing, and Reproducible Evidence"
description: "Choose arrival models deliberately, measure offered and completed work, validate correctness, and publish the limits of a performance experiment."
date: 2027-04-21
tags: ["Performance", "Programming", "Reliability"]
format: article
---

Load testing has a credibility problem it earned honestly: the test said 5,000 requests per second, production fell over at 1,200, and everyone concluded load testing doesn't work. But the test wasn't wrong about what it measured — it measured a different system (staging-sized), under a different workload (uniform synthetic requests), with a different traffic model (polite clients that wait), reported through metrics that hide exactly the behavior users feel. Load testing supports production decisions when those gaps are measured and the remaining uncertainty is explicit. Here's how.

## Model the workload, not the number

The first failure is testing a *rate* instead of a *workload*. Production traffic has structure that dominates system behavior: a **mix** (for an invented planning example, 70% reads, 20% searches and 10% writes; the cost of each operation must be measured rather than assumed), a **distribution** (entity popularity and working-set size affect cache behaviour; use measured skew when it exists rather than assuming a universal popularity law), **sessions** (users log in, browse, act, leave — with think times and state), and **data scale** (query plans, cache hit rates, and GC behavior all change with table size; a small database cannot establish the query behavior of a much larger production population). The honest source for all of it is production telemetry: build the workload model from real traffic distributions — top endpoints by rate and by total time, payload size percentiles, entity popularity curves — and refresh it periodically, because the model rots as the product evolves.

Two corollaries. Test *through* the same path production traffic takes (load balancer, TLS, gateway — testing straight to the service skips the layers that fail first). And test with production-realistic *data shape* even where privacy forbids production data — synthetic generation should preserve the relevant cardinalities and skew and be validated against the intended workload.

## Choose the test shape for the question

Different questions, different curves — and mislabeling them wastes runs: **baseline/regression tests** (moderate steady load, run continuously — the tripwire for "this release is 15% slower"); **stress tests** (ramp until failure — the question is not *whether* it breaks but *how*: gracefully with backpressure and clean 503s, or catastrophically with connection-pool collapse and cascading timeouts — the failure *mode* is the finding); **soak tests** (hours-to-days at realistic load — a useful test for leaks, fragmentation, log-disk exhaustion, and the slow degradations that define week-two production behavior); **spike tests** (instant load steps — what breaks when the marketing email lands: autoscaler lag, cold caches, connection storms); and **capacity tests** (the formal "what's our headroom at SLO" measurement that feeds planning). A team that only runs one shape is answering one question and assuming the other four.

## The measurement discipline: where tests lie

**Averages and even p95s conceal what users experience** — report full percentile spectra (p50/p90/p99/p99.9) and time series, alongside means and counts where they answer a useful question; a flat average with a growing p99 is the classic early-warning signature.

**Coordinated omission is the subtle one:** most load tools are *closed-loop* — N virtual users each wait for a response before sending the next request — which means when the system slows, the test *politely slows its arrival rate*, and the recorded latencies systematically exclude the delay that queued requests would have felt. Real traffic may combine independent arrivals, sequential user sessions, retries, and feedback effects. The fix: use arrival-rate-based load generation (modern tools support open-loop modes explicitly) when independent arrivals match the question, and interpret closed-loop latency under its bounded-population assumptions.

**Watch the system, not just the tool:** the load tool reports symptoms; diagnosis needs the full observability stack live during runs — saturation metrics (CPU, connection pools, queue depths, GC), traces of slow requests, and the downstream dependencies' health. The most valuable single artifact from a good load test is the *first bottleneck identified with evidence* — the pool that pegged, the lock that serialized — because that's the engineering to-do item; "it handled X RPS" is merely a fact.

**And verify the generator isn't the bottleneck** — saturated load-injector CPU or client-side connection limits produce beautiful, meaningless plateaus. Scale injectors horizontally and confirm their headroom before believing any ceiling.

## Environment honesty and the production question

The staging-vs-production gap admits three honest postures. **Full-scale replica** — potentially useful and expensive, with remaining differences in data, dependencies and traffic that must still be documented. **Scaled-down with modeled extrapolation** — the pragmatic norm, but scaling is *not linear* (a half-size cluster is not half the capacity: cache ratios, coordination costs, and per-node overheads all bend the curve), so extrapolate only with measured scaling curves, never arithmetic. **Testing in production** — an option for answering some workload-realism questions when the owner explicitly authorizes the risk, done with the safety rails the SRE literature has standardized: synthetic traffic tagged and excludable from business metrics, load added gradually under error-budget supervision, instant kill switches, and off-peak windows. The strongest programs combine the latter two: continuous baseline tests in staging catching regressions cheaply, periodic production capacity validation catching what staging cannot.

Wherever it runs, make it *continuous*: a performance test that runs quarterly is an event that produces a report; one that runs per-release (with automated pass/fail against latency-and-throughput budgets — the pipeline-gate pattern from benchmark-in-CI practice) is an instrument that prevents regressions from shipping. The single most common performance-incident retro line — "this got slow three releases ago and nobody noticed" — is precisely the line continuous baselines delete.

## The program in one paragraph

Model the workload from production telemetry (mix, skew, sessions, data scale) and refresh it; pick test shapes to match questions, and run all five over a program's life; choose an arrival model that matches the question and preserve scheduled waiting time when evaluating independent demand; report percentile spectra with the system's own metrics alongside; distrust ceilings until the injector and the environment are proven honest; extrapolate scaled environments with measured curves only; graduate to guarded production testing as maturity grows; and wire baseline runs into the release pipeline with budgets, so performance is a *tested property* rather than a hoped-for one. Load testing done this way can reduce performance surprises — and starts producing something rarer and more valuable: capacity decisions, scaling architectures, and launch approvals grounded in measured reality rather than institutional optimism.

## Write a falsifiable performance question

A useful test begins with a proposition such as: “This service can sustain the specified order-entry workload at 200 scheduled arrivals per second for 20 minutes, with fewer than the agreed fraction of failed operations and with latency measured from scheduled arrival.” Include the environment, data population, operation mix, and acceptance thresholds in the test record. The numbers here describe a hypothetical test plan, not an Ajna production result.

Define success as a business operation, not merely an HTTP response. A search that returns an empty array after a dependency failure may be fast and return status 200 while failing its purpose. A checkout that creates duplicate orders on retry is not a successful performance result. Add correctness checks that verify the expected response and side effects without making the injector itself the dominant bottleneck.

Keep offered load, started operations, completed operations, failures, and dropped or unstarted iterations separate. A report showing only completed requests hides demand that the harness could not generate or the system could not admit. Also distinguish request latency from complete-journey latency: a workflow with several calls and retries may have a different tail than any individual endpoint.

## A hypothetical queue calculation

Consider a simplified synthetic service receiving 120 jobs per second while completing 100 jobs per second. Assume these rates remain constant, the queue starts empty, there are no retries or cancellations, and all jobs are comparable. The queue grows by 20 jobs each second. After 10 seconds it contains 200 waiting jobs, after 20 seconds 400, and after 30 seconds 600. The chart plots those three backlog values.

If arrivals stop at 30 seconds and service continues at 100 jobs per second, draining 600 waiting jobs takes approximately six seconds under these assumptions. This calculation excludes jobs already in service and any change in service rate. It does not model a real latency distribution, variable work, scheduling, or resource contention. Its purpose is to show that a short run can end before the accumulated demand becomes visible as an operational problem.

In a real system, increasing queue size can change processing cost through memory pressure, connection exhaustion, lock contention, or timeouts. Measure the backlog and its oldest age directly. A stable average completion rate does not demonstrate equilibrium if queued work continues to grow. Conversely, rejecting work early can keep latency bounded while reducing successful throughput; report the rejection rate alongside the latency improvement.

## Open and closed models answer different questions

A closed model represents a bounded population whose next action depends on finishing the previous one, potentially with think time. That can be appropriate for interactive sessions or a fixed worker pool. An open model schedules new arrivals independently of previous completions, which is useful for an external arrival stream. Many products combine both: new users arrive independently while each user follows a sequential journey.

Coordinated omission arises when the observation process fails to represent delays that the intended arrival model would have experienced. An arrival-rate executor helps preserve offered demand, but it does not automatically make every reported metric correct. Record scheduled start, actual start, and completion where the tool supports them. If the generator runs out of virtual users or CPU, dropped iterations are a finding about the experiment that must remain in the report.

Do not retroactively add estimated queueing delay to a histogram without documenting the assumed arrival schedule and correction method. A corrected histogram is a model-based estimate, not a direct observation. The strongest approach is to design the experiment and timestamps so the relevant waiting time is captured in the first place. Preserve raw counts and the measurement definition for review.

## A repeatable local experiment

Use an isolated service with a deliberately bounded worker pool and synthetic requests. Run a steady arrival schedule below its observed capacity, then a short controlled step above it, with an automatic stop condition. The stop condition can include excessive queue age, an agreed error threshold, or resource pressure. Never aim an exploratory stress test at a shared production endpoint without the owning team's authorization and an explicit operating plan.

Collect injector CPU, actual scheduled and started iterations, service completion counts, queue depth, queue age, process resources, and a sample of traces. Start with a small fixture so correctness is inspectable, then repeat with representative data volume and skew. Keep authentication, TLS, and gateway behavior in the path when they are part of the production question. If a component is intentionally omitted, label the result as a component test.

Run the baseline more than once under the same conditions. Record warm-up separately, including cache state and runtime compilation effects. Reset mutable fixtures or explain how they accumulate. Otherwise a later run may appear faster because the first populated caches, or slower because its writes changed indexes and table size. Preserve exact application, database, configuration, and harness revisions.

Change one suspected bottleneck and repeat the relevant experiment. If a larger connection pool improves throughput while database waits rise sharply, the bottleneck may have moved rather than disappeared. Compare complete operation success and resource use, not only the headline request rate. A test should narrow the explanation for a change, not simply produce a larger number.

## Report uncertainty and avoid percentile arithmetic

Percentiles describe a distribution within a defined population and window. Do not average per-instance p99 values and label the result the fleet p99; merge appropriate distributions or use a measurement system that supports the required aggregation. Small samples provide weak evidence about extreme percentiles. Include sample counts, failures, timeouts, and the time range with every tail-latency claim.

A timeout is not a fast completed request whose latency can be dropped. Treat it according to the operation's outcome policy and retain its waiting time or censored status. Separate successful latency from all-attempt behavior when useful, but explain the denominators. Otherwise a change that times out more slow work can appear to improve latency.

The final report should state the tested envelope and the limits of inference. A single-node benchmark does not establish multi-region behavior, a short steady test does not establish week-long memory stability, and a staging result does not establish a linear production capacity multiple. Publish the workload generator, synthetic-data method, run configuration, and observations so a reviewer can reproduce the conclusion or challenge its assumptions.

## Further reading and source boundaries

- [Grafana k6: open and closed workload models](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/)
- [Grafana k6: dropped iterations](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/dropped-iterations/)
- [Google SRE: handling overload](https://sre.google/sre-book/handling-overload/)
- [HdrHistogram: latency recording and coordinated omission](https://github.com/HdrHistogram/HdrHistogram)
