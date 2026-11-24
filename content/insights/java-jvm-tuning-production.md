---
title: "JVM Tuning for Production: Heap, GC, and the Flags Worth Setting in 2026"
description: "A practical guide to tuning the JVM for production services — heap sizing, choosing between G1, ZGC, and Shenandoah, container awareness, and the observability flags every deployment should carry."
date: 2026-10-14
tags: ["Java", "JVM", "Performance", "Cloud Architecture"]
format: article
---

JVM tuning has a reputation problem: it's either treated as dark magic requiring a specialist with a beard, or dismissed entirely because "the defaults are fine now." Both takes are wrong. The defaults *are* dramatically better than a decade ago — and a handful of deliberate decisions still separate services that hum from services that page you.

Here's the 2026 version of what's worth knowing, for engineers running Java services on JDK 17/21+ in containers and clouds.

## What to measure

**Tail latency and GC contribution.** Measure request latency, pause duration and allocation rate under identical traffic. If request p99 falls from 250 ms to 190 ms, the reduction is 24%. Correlate per-window pause events with request traces before attributing the whole improvement to GC.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Heap sizing: the decision that drives everything else

**Set `-Xms` equal to `-Xmx`.** Growing the heap is work the JVM does at the worst time (under load), and in containers the memory is reserved anyway. Predictability beats elasticity inside a single process.

**How big?** Start from measurement, not folklore: run the service under realistic load, look at the heap occupancy *after* full/mixed collections (the live set), and size the heap at roughly 2.5–4× the live set. Below 2× the GC runs hot and throughput suffers; above 5× you're renting memory to avoid collections that would have been cheap anyway.

**Remember the JVM is bigger than the heap.** Process memory = heap + metaspace + thread stacks (1 MB × threads adds up) + code cache + direct buffers + GC overhead. A container with a 4 GB limit and `-Xmx4g` will be OOM-killed, and the kernel's kill message won't mention Java. Budget 25–35% headroom above heap for a typical service, more if it uses direct buffers heavily (Netty, Kafka clients).

**In containers, prefer percentages:** `-XX:MaxRAMPercentage=70` sizes the heap off the container limit, so resizing the pod resizes the JVM coherently. Modern JDKs are fully container-aware (cgroup v2 included); the historical horror stories about the JVM seeing the host's 256 GB date from JDK 8 builds you should no longer be running.

## Choosing a collector: an actual decision tree

The good news: there are only three answers now, and all of them are good.

**G1 (the default): the right choice for most services.** Balanced throughput and latency, pause goals honored reasonably well (`-XX:MaxGCPauseMillis=200` is the only G1 flag most services need), and decades of collective operational experience. If your p99 latency budget is 50 ms or more, G1 and stop thinking about it.

**ZGC: evaluate alongside your latency budget.** JDK 21 introduced generational ZGC as an opt-in mode with `-XX:+UseZGC -XX:+ZGenerational` ([JEP 439](https://openjdk.org/jeps/439)). JDK 23 made the generational mode the default when ZGC is selected ([JEP 474](https://openjdk.org/jeps/474)). Replay a representative workload on the JDK build you deploy. Measure request latency, allocation stalls, throughput, CPU, and memory headroom before making a collector choice.

**Parallel GC: when only throughput matters.** Batch jobs, Spark executors, overnight ETL — nobody sees a pause in a batch job. `-XX:+UseParallelGC` finishes the work sooner for less CPU.

(Shenandoah occupies ZGC's niche with different internals and is a fine choice, particularly on Red Hat builds; benchmark it against generational ZGC if you're in that market.)

The anti-pattern is the flag pile: fifteen `-XX` options copied across generations of services, each one an answer to a question nobody remembers. On a modern JDK, a service with more than five GC-related flags is nearly always carrying dead weight. Delete them, set heap + collector + pause goal, and re-measure.

## The flags every production JVM should carry

Not tuning — observability. These cost almost nothing and pay for themselves the first bad day. GC logging: `-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime:filecount=5,filesize=20m`. Heap dump on OOM: `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps`. Flight recorder always on: `-XX:StartFlightRecording=maxsize=200m,maxage=12h` — continuous JFR is production-safe (~1% overhead) and means the incident that happened at 3 AM left a recording. Crash artifacts: `-XX:ErrorFile=/logs/hs_err_%p.log`. And `-XX:+ExitOnOutOfMemoryError` in orchestrated environments, because a half-dead JVM that flaps its health check is worse than a clean restart.

## Reading the signals: a short diagnostic grammar

**Rising GC frequency with stable traffic** → live set is growing → suspect a leak; take two heap dumps an hour apart and diff dominator trees.

**Long pauses on G1** → check the GC log for *to-space exhaustion* or humongous allocation churn (objects over half a region). Fixes, in order: bigger heap, bigger regions (`-XX:G1HeapRegionSize`), or stop allocating 30 MB byte arrays in a hot path.

**High GC CPU, short pauses, everywhere** → allocation rate problem. JFR's allocation profiling names the call sites; the fix is in code (buffer reuse, streaming instead of materializing), not flags.

**Latency spikes with no GC activity** → look at safepoints in the log (that's why `safepoint` is in the logging config). Time-to-safepoint stalls from long-running counted loops or massive array copies masquerade as GC problems while the collector is innocent.

**Process RSS grows, heap flat** → native: direct buffers, metaspace (classloader leak — the classic in anything doing hot redeploys), or a native library. `jcmd VM.native_memory` after starting with NMT answers which.

Start with GC logging or a scoped JFR recording. Use `jcmd` diagnostics after checking the documented impact for that exact command and JDK. Oracle classifies `GC.class_histogram` and `GC.heap_dump` as high impact. A heap dump can request a full GC and consume significant disk space. Review the [JDK diagnostic command reference](https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html).

## What modern Java changed

Three shifts worth internalizing if your mental model dates from JDK 8:

**Virtual threads (JDK 21) change thread math, not heap math.** You'll stop tuning thread pool sizes for I/O-bound services, and thread-stack memory pressure eases. Allocation and GC behavior stay the same — a million virtual threads all allocating still feed the same collector.

**Compact object headers (JDK 24+, `-XX:+UseCompactObjectHeaders`) shrink every object by 4–8 bytes.** For allocation-heavy services that's a real live-set reduction for one flag. Worth testing as it stabilizes in your JDK line.

**AOT/CDS advances (Project Leyden)** keep cutting startup and warmup — `-XX:CacheDataStore` style training runs matter for serverless and autoscaled fleets where cold JVMs meet traffic.

## The discipline

Every flag in production should have: a reason written down, a date, the JDK version it was tested on, and a benchmark result. Re-validate the whole set at every major JDK upgrade — collectors improve, and yesterday's workaround is tomorrow's regression. Tune one thing at a time against a load test that resembles production, and let the GC log — not the vibe — declare the winner.

The JVM in 2026 is a superb piece of engineering that mostly tunes itself. Your job is to size it honestly, pick the collector that matches your latency contract, keep the observability flags on, and resist the urge to help it more than that.

## Establish the container memory budget before moving the heap

A heap limit is an input to resource planning. Its practical value depends on allocation pressure and the live data the collector must maintain. The container can also hold committed native memory, caches, resident mapped files, helper processes, and write buffers. Start with the observed peak against the effective cgroup limit. Record which accounting boundary each measurement uses. The JVM's view of memory, a process's resident set, and the cgroup total answer different questions and can diverge even when none is wrong.

For an illustrative service, use a 4 GiB cgroup limit. A representative high-load run reports an operating heap near 2.1 GiB and roughly 1.1 GiB in other steady cgroup charges. During a burst an additional 0.35 GiB appears outside the measured Java heap, leaving about 0.45 GiB of cgroup margin. Raising the heap ceiling by 0.5 GiB may move the process closer to the limit exactly when native activity rises. Before making that change, identify whether the burst comes from networking buffers, thread activity, mapped files, or a separate process. Repeat the allocation ramp after reducing the suspected contributor. The arithmetic is illustrative and assumes the charges occurred concurrently. Size using co-observed values rather than adding maxima from unrelated times.

Compare balanced initial and maximum heap settings against your deployment lifecycle. An equal initial and maximum setting can reduce variation from growth for a stable, dedicated workload. A fleet whose process startup or idle memory is the binding platform limit may benefit from a lower initial setting. Measure resident memory after warm-up and after a sustained quiet period. Avoid turning an observed heap ceiling into assumptions about which pages are resident or reclaimable.

## Run a controlled comparison that reveals trade-offs

Choose one dependent business metric and several explanatory signals. For a request service, the denominator might be accepted requests with valid outcomes, aligned to the same load window. Collect p50, p95, p99, errors and rate-limited requests, process CPU, scheduler delay, container throttling, collection activity, and memory high-water marks. Observe collection pause duration and the fraction of requests that actually intersect those events. Clock alignment matters. A graph with five-minute averages can hide a cluster of short pauses during a single high-load second.

Keep the data, runtime build, CPU budget, warm-up, workload generator, dependency state and deployment node class fixed. Run an A/B/A sequence where practical so you can tell a change from environmental drift. Save raw traces or representative histograms together with the tested flags and source revision. For important tail measurements, keep counts as well as quantiles so other reviewers can tell whether the p99 represents sufficient traffic. In a trial with only 200 requests, the top two observations can dominate that quantile.

Use the collector implementation and version as part of the test name. In JDK 21, generational ZGC was introduced as a selectable mode by [OpenJDK JEP 439](https://openjdk.org/jeps/439). JDK 23 made it the default when selecting ZGC, as described in [JEP 474](https://openjdk.org/jeps/474). Record the mode explicitly when comparing results from different JDK releases. Changes in defaults, warm-up behavior, and event instrumentation can otherwise produce a result that looks like a flag improvement. The [Java garbage collection tuning guide](https://docs.oracle.com/en/java/javase/21/gctuning/) is a starting point for interpreting the measurements for a particular release.

## Separate memory growth from delayed release

Use two snapshots at known points rather than relying on one large total. For a process that climbs steadily, establish a warmed baseline after normal initialization. Collect a second observation after a controlled window with known arrival volume and dependency behavior. Record post-collection heap occupancy and process memory along with categories from Native Memory Tracking, if previously enabled. Oracle's [Native Memory Tracking documentation](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html) describes scope and limitations. Third-party native allocations are outside its coverage. A rise in RSS alongside a flat Java heap and unchanged tracked categories may warrant investigating separately measured process mappings or native components.

Consider an illustrative JVM whose heap occupancy after a relevant collection rises from 850 to 930 MiB during the first busy period, then stays near 930 after repeating it. That could be retained caches reaching a stable size. A similar second period that takes occupancy to 1,010 MiB, followed by the same growth across further trials, calls for a retention investigation. Compare deliberately repeated phases and keep request counts and payload mix fixed. Otherwise a workload becoming larger can look like an application retaining memory longer.

Inspect low-impact evidence first. Count names, sizes, durations, and queue age at application boundaries. Scope a recording to a reproducible behavior where possible. If a heap dump becomes necessary, use an approved diagnostic path with enough disk headroom, account for pause behavior, and decide who can inspect its contents. Heap dumps may contain values used by the application. Capture, retention and access approvals belong in the runbook alongside the command. Use the [jcmd documentation](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html) to verify command support and impact for the runtime under investigation.

## Make rollback part of the result

A tuning change is only as reproducible as the configuration that applied it. Keep a small inventory with the workload baseline, JDK build, image identity, available cores, cgroup limits, flags and diagnostic options. Attach representative evidence of before and after. Effort spent explaining the result is valuable here because the next upgrade may otherwise inherit a parameter that solved a different workload years earlier.

Consider an illustrative collector change that reduces p99 from 180 to 140 milliseconds during normal load, but allows only 850 successful requests per second under the same CPU allocation compared with 1,000 before. If the expected surviving replica must deliver 900 during a recovery, the faster tail is not sufficient by itself. Test downstream dependencies and overload behavior before changing the capacity plan. Report a pass only when improvement holds under each agreed scenario or when you deliberately accept and document the trade-off.

Try production rollout first with a small comparable traffic cohort. Evaluate restart behavior and time until it handles normal load, particularly if images or runtime startup flags changed. Keep the previous container and its exact configuration available throughout the trial. Decide what triggers a reversal, who executes it, and how the service returns to the prior behavior. Mark the test invalid and repeat if infrastructure throttling or an upstream incident prevents a fair comparison. The next reader should be able to reconstruct the workload, reproduce the configuration, and explain why the chosen alternative fit the operational constraint.

Where allocation rate is the suspect, follow the data path before attempting to tune it away. In a deliberately simplified request path, removing an 80 KiB temporary buffer at 500 requests per second avoids about 39 MiB of allocation per second if the same allocation occurs on every request. Verify that the object is actually allocated at run time by the deployed compiler and that the replacement does not create an equally large copy one layer later. Some optimizations lower allocation but retain a larger working set. Test both post-collection occupancy and request throughput before rolling out the change.
