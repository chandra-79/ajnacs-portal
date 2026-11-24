---
title: "Diagnosing Java Memory Growth: Heap, Native Memory and Retention"
description: "Use bounded evidence collection, comparable workloads and retention analysis to distinguish leaks from legitimate growth and capacity limits."
date: 2027-12-22
tags: ["Java", "JVM", "Performance", "Observability", "Debugging"]
format: article
---

Java was supposed to end memory leaks. What it actually did was change their shape: instead of forgetting to free memory, we now *accidentally keep references* to memory we'll never use again — and the garbage collector, doing exactly its job, dutifully preserves it all until the heap fills and the pager fires.

Memory leak diagnosis has a reputation for being an art. It isn't. It's a method, and the method fits in one post.

## First: confirm it's actually a leak

Plenty of "memory leaks" are services legitimately using more memory than someone guessed they would. Before diagnosing, establish the signature. Chart heap occupancy *after* GC (the post-collection floor) over hours or days. A leak shows a **rising floor**: each collection reclaims less, the sawtooth's valleys climb. Stable valleys with big oscillation is normal allocation behavior, and the fix — if any — is heap sizing, not leak hunting.

Two impostors to rule out in the same step. **Load growth:** more traffic or bigger cache limits raise the floor legitimately; correlate the memory chart with request rate before blaming code. **Native memory:** if the *container* is OOM-killed but the Java heap chart looks healthy, stop — investigate process and cgroup accounting, native allocations and sizing as well as heap retention; heap objects can still own native resources. That branch of the method: enable Native Memory Tracking (`-XX:NativeMemoryTracking=summary`, overhead dependent on the runtime and workload), compare `jcmd <pid> VM.native_memory baseline`/`summary.diff` across the growth window, and a growing category narrows the investigation — class, thread and other categories need correlation with relevant runtime metrics; category names alone do not establish a leak or library cause.

## The core move: differential heap analysis

For genuine heap leaks, one technique does most of the work: **two heap dumps, separated by growth, diffed.**

Capture the first dump once the service is warm (`jcmd <pid> GC.heap_dump /dumps/before.hprof`, with the collection and impact behaviour of the installed JDK understood). Let the leak accumulate — an hour, a day, whatever the growth curve says makes the delta obvious. Capture the second dump. A heap dump can pause the JVM and generate substantial I/O; the duration depends on heap size, storage, JDK and collection behaviour, so take it on one instance pulled from the load balancer, not the whole fleet; and if you run with `-XX:+HeapDumpOnOutOfMemoryError` (you should), a Java-level allocation failure may produce a dump if configured and resources permit; external OOM kills may not.

Open both in **Eclipse MAT** (or IntelliJ's profiler, or VisualVM for smaller heaps) and look at the **dominator tree** — the view that answers "what is *keeping* memory alive" rather than "what exists." Sort by retained size, compare against the first dump, and a useful clue may be a collection, cache, or map whose retained size grows substantially between comparable snapshots. MAT's "Leak Suspects" report suggests candidates that still require investigation against intended object lifetimes.

Then follow the **path to GC root** from the bloated object: that path is the reference chain your code built, and it ends at a field, a static, a ThreadLocal, or a listener registration — a named line of code. That's the deliverable.

When dumps are impractical (giant heaps, no window for a pause), JFR's **OldObjectSample** event is the lower-resolution fallback: continuous recording, samples of long-lived objects with their allocation stacks, enough to name the suspect class and allocation site with configuration- and workload-dependent overhead.

## The usual suspects

Years of incident reviews compress into a short list of patterns; check them in this order.

**The unbounded map.** A static `ConcurrentHashMap` used as a cache, keyed by something with unbounded cardinality (session ID, request ID, tenant+day), with no eviction. The fix is a real cache — Caffeine with `maximumSize` and expiry — not a bigger heap. A related problem is using distinct but logically equivalent key objects with identity equality, unintentionally creating separate entries. Reusing the same key instance still replaces its entry; review the intended equality and hash contract.

**Listener and callback registration without deregistration.** Something subscribes per-request or per-connection to a long-lived event source and never unsubscribes; the source's listener list becomes the leak. Grep for `addListener`/`register` calls whose remove twin appears nowhere.

**ThreadLocals on pooled threads.** A value left in a pooled thread's ThreadLocal state can remain reachable beyond the request and leak context into later work. Retention depends on references, replacement, cleanup and thread lifetime; explicit removal at the intended scope boundary is safer than relying on incidental cleanup. The reference chain in MAT runs through `Thread.threadLocals`, which is the tell. `try/finally` with `remove()`, always.

**The classloader leak** — the enterprise classic. After hot redeploys, old application classloaders can't unload because one object they loaded is still referenced from outside: a JDBC driver registered in the JVM-global `DriverManager`, a shutdown hook, a scheduled task still ticking, a ThreadLocal on a shared thread. Symptom: metaspace climbs per redeploy until the app server dies. Process replacement can avoid retaining old application classloaders across in-process redeploys, but cleanup and ownership still matter for long-running processes, plugin systems and other dynamic loading.

**Caches of caches:** an object cached at layer A holding a reference into layer B's context (a request, a session, an entity manager), retaining a whole object graph per entry. Retained-size and reference-path analysis can reveal the discrepancy; compare the result with the intended object lifetime rather than assuming every large retained object is a leak.

**Substring/buffer aliasing** in native buffers and some serialization frameworks: a tiny logical object pinning a large backing array. Same tell — retained size wildly out of proportion to shallow size.

## Making the next one boring

The diagnosis method works, but the mature posture is making leaks *loud and cheap* instead of silent and catastrophic. Alert on the post-GC heap floor trending up over 24h windows — the useful warning interval depends on growth rate, workload and available headroom. Choose heap-dump-on-OOM, disk capacity and access controls deliberately for each environment. A Java allocation failure may produce a dump when configured and resources permit; an external kill or some native failures may not. Keep continuous JFR on in production. Require an explicit cache resource and lifecycle policy in review. Entry-count limits, weighted size, expiry and admission controls solve different problems; an expiry policy alone may still allow excessive growth under a high arrival rate. And load-test soak runs (hours at steady state, watching the floor) catch the unbounded-map class of leak before any customer meets it.

The craft here isn't mystical. Confirm the rising floor, rule out native, diff two dumps, read the dominator tree, walk the path to the root, name the line. Every step is a standard tool doing a standard thing — which is exactly what you want from a 3 AM procedure.

## Establish which limit ended the process

A Java heap allocation failure, metaspace exhaustion, native allocation failure, and container OOM kill are different events. Start with the actual termination evidence and effective limits. A process killed externally may never throw a Java `OutOfMemoryError`, so heap-dump-on-OOM settings do not guarantee an artifact for every memory-related restart.

Record the container limit, heap configuration, thread count, direct-buffer use where available, mapped files, and the operating-system memory view. Heap maximum is not a complete process-memory budget. Native libraries, thread stacks, code cache, class metadata, and runtime structures also consume memory, while accounting details vary by environment.

A stable heap does not uniquely prove a native leak. Workload growth, page cache charged to the container, an undersized limit, or another process in the same resource group can contribute. Use the evidence to narrow hypotheses rather than converting one graph into a categorical diagnosis.

## A hypothetical retention-growth example

Consider a synthetic service observed after three comparable work cycles. Post-collection retained heap is 300 MiB, 420 MiB, and 540 MiB. The increase is 120 MiB per cycle. If a suspected map gains 60,000 retained entries each cycle, the simple ratio is 120 MiB / 60,000, approximately 2,097 bytes per entry using binary MiB.

The chart shows the three retained-heap observations. These are invented values, not production measurements. The ratio is an attribution hypothesis: other objects may grow at the same time, and retained sizes can overlap when object graphs share references. It suggests what to inspect, not proof that every map entry independently owns exactly that many bytes.

Compare cycles with similar completed work and in-flight work. A larger queue legitimately retains more payloads until processing catches up. If growth stops after the queue drains, investigate admission and throughput as well as object lifetime. A leak investigation should not label all retained business work as garbage.

## Collect evidence within an explicit impact budget

Heap dumps can pause the JVM and require substantial disk space. The impact depends on heap size, collector, command options, storage, and runtime version. Taking an instance out of traffic can reduce user exposure but may also change the workload that creates the growth. Decide what observation is needed and whether a smaller reproduction or sample is sufficient.

Heap contents can include passwords, tokens, personal information, and document bodies. Restrict access, encrypt storage where required, and define retention before collecting a dump. Do not attach raw dumps to a public issue or an unrestricted support ticket. A diagnostic artifact is a data-handling responsibility as well as a technical resource.

Avoid forcing collection casually on a stressed service. It can perturb latency and the evidence, and some collectors or configurations treat explicit collection differently. Consult the installed JDK's command help and rehearse the procedure in a representative environment. Record the exact command and whether it requested collection.

## Read retention paths critically

A dominator tree helps identify objects that retain other objects under the analysis model. A large retained size makes an object worth investigating, but it does not by itself establish a bug. A correctly sized cache or active batch can intentionally retain a large graph. Compare with the application's intended lifetime and configured bounds.

Follow paths to roots and identify who is responsible for releasing or replacing the reference. For a listener collection, find registration and deregistration paths, including exceptions and cancellation. For a ThreadLocal, inspect cleanup under every request exit path. For a cache, inspect maximum size, value weight, key cardinality, expiry and whether expired entries are actually reclaimed under the implementation's policy.

A shallow-size comparison can miss a small wrapper retaining a large graph. Conversely, summing retained sizes across related objects can double-count ownership. Use the analysis tool's definitions and focus on the reference chain that explains why the unwanted objects remain reachable.

## Native-memory tracking is a partial view

NMT can help compare JVM-managed native allocation categories over time when enabled appropriately. It does not account for every allocation made by arbitrary native code, and reserved versus committed memory are distinct. A growing category is a clue to investigate with runtime metrics and other tools; it is not a one-to-one mapping to a named library defect.

For thread growth, correlate thread count and stack reservations with the component creating threads. For class metadata, compare loaded and unloaded class counts and classloader lifetimes. For direct buffers, use the available buffer-pool metrics and relevant library diagnostics. If process memory grows outside NMT's explanation, investigate mapped files and native allocations rather than forcing the result into an NMT category.

JFR can provide sampled allocation and old-object evidence with a chosen recording configuration. Sampling has coverage limits, and overhead depends on enabled events and workload. A missing sample is not proof that a class is harmless. Use recording evidence to choose a more focused reproduction or capture.

## A leak-reproduction and fix exercise

Build a disposable service with a deliberately unbounded map keyed by unique synthetic request identifiers. Run a fixed number of requests per cycle, let work finish, and record retained object counts and memory. Then add an explicit cache policy or remove the unnecessary retention, depending on the intended behaviour.

Repeat the same workload and verify both memory behaviour and functional correctness. An aggressive eviction rule may lower memory while causing repeated expensive loads or incorrect missing results. Measure cache misses, latency, and downstream demand alongside retained size. The right fix respects the application's contract and resource budget.

Test exceptional paths as well as the normal one. Cancel requests, simulate listener failures, and restart relevant components. A cleanup fix that works only after successful completion leaves the original risk in place during incidents.

The final finding should identify the retained object graph, the unwanted owner reference, the triggering workload, and the verified lifecycle correction. Retain a bounded regression exercise and the operational limits. That is stronger than naming a large class in a heap dump or raising the heap size until the next restart is farther away.

## Further reading and source boundaries

- [Oracle JDK 21: troubleshooting memory leaks](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshooting-memory-leaks.html)
- [Oracle JDK 21: Native Memory Tracking](https://docs.oracle.com/en/java/javase/21/vm/native-memory-tracking.html)
- [Eclipse Memory Analyzer: dominator tree](https://help.eclipse.org/latest/topic/org.eclipse.mat.ui.help/concepts/dominatortree.html)
- [Oracle JDK 21: jcmd reference](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html)
