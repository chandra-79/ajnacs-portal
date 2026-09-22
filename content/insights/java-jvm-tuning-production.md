---
title: "JVM Tuning for Production: Heap, GC, and the Flags Worth Setting in 2026"
description: "A practical guide to tuning the JVM for production services — heap sizing, choosing between G1, ZGC, and Shenandoah, container awareness, and the observability flags every deployment should carry."
date: 2026-10-14
tags: ["Java", "JVM", "Performance", "Cloud Architecture"]
format: article
---

JVM tuning has a reputation problem: it's either treated as dark magic requiring a specialist with a beard, or dismissed entirely because "the defaults are fine now." Both takes are wrong. The defaults *are* dramatically better than a decade ago — and a handful of deliberate decisions still separate services that hum from services that page you.

Here's the 2026 version of what's worth knowing, for engineers running Java services on JDK 17/21+ in containers and clouds.

## Heap sizing: the decision that drives everything else

**Set `-Xms` equal to `-Xmx`.** Growing the heap is work the JVM does at the worst time (under load), and in containers the memory is reserved anyway. Predictability beats elasticity inside a single process.

**How big?** Start from measurement, not folklore: run the service under realistic load, look at the heap occupancy *after* full/mixed collections (the live set), and size the heap at roughly 2.5–4× the live set. Below 2× the GC runs hot and throughput suffers; above 5× you're renting memory to avoid collections that would have been cheap anyway.

**Remember the JVM is bigger than the heap.** Process memory = heap + metaspace + thread stacks (1 MB × threads adds up) + code cache + direct buffers + GC overhead. A container with a 4 GB limit and `-Xmx4g` will be OOM-killed, and the kernel's kill message won't mention Java. Budget 25–35% headroom above heap for a typical service, more if it uses direct buffers heavily (Netty, Kafka clients).

**In containers, prefer percentages:** `-XX:MaxRAMPercentage=70` sizes the heap off the container limit, so resizing the pod resizes the JVM coherently. Modern JDKs are fully container-aware (cgroup v2 included); the historical horror stories about the JVM seeing the host's 256 GB date from JDK 8 builds you should no longer be running.

## Choosing a collector: an actual decision tree

The good news: there are only three answers now, and all of them are good.

**G1 (the default): the right choice for most services.** Balanced throughput and latency, pause goals honored reasonably well (`-XX:MaxGCPauseMillis=200` is the only G1 flag most services need), and decades of collective operational experience. If your p99 latency budget is 50 ms or more, G1 and stop thinking about it.

**ZGC: when pauses are the product.** Sub-millisecond pauses at multi-terabyte heaps, and since **generational ZGC** (default ZGC mode from JDK 21) the old "ZGC burns extra CPU and needs huge headroom" caveats have softened substantially. Trading systems, real-time bidding, interactive APIs with single-digit-millisecond p99s: `-XX:+UseZGC` and benchmark. The costs are a few percent of throughput and slightly higher memory usage — measure whether you care.

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

The tools, in the order to reach for them: GC log (free, always there), `jcmd` (thread dumps, heap histograms, NMT — all safe in production), JFR + JDK Mission Control (the profiler you already have), async-profiler when you want flame graphs with native frames.

## What modern Java changed

Three shifts worth internalizing if your mental model dates from JDK 8:

**Virtual threads (JDK 21) change thread math, not heap math.** You'll stop tuning thread pool sizes for I/O-bound services, and thread-stack memory pressure eases. Allocation and GC behavior stay the same — a million virtual threads all allocating still feed the same collector.

**Compact object headers (JDK 24+, `-XX:+UseCompactObjectHeaders`) shrink every object by 4–8 bytes.** For allocation-heavy services that's a real live-set reduction for one flag. Worth testing as it stabilizes in your JDK line.

**AOT/CDS advances (Project Leyden)** keep cutting startup and warmup — `-XX:CacheDataStore` style training runs matter for serverless and autoscaled fleets where cold JVMs meet traffic.

## The discipline

Every flag in production should have: a reason written down, a date, the JDK version it was tested on, and a benchmark result. Re-validate the whole set at every major JDK upgrade — collectors improve, and yesterday's workaround is tomorrow's regression. Tune one thing at a time against a load test that resembles production, and let the GC log — not the vibe — declare the winner.

The JVM in 2026 is a superb piece of engineering that mostly tunes itself. Your job is to size it honestly, pick the collector that matches your latency contract, keep the observability flags on, and resist the urge to help it more than that.
