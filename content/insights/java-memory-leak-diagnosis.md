---
title: "Diagnosing Java Memory Leaks in Production: A Working Method"
description: "From 'the pods keep restarting' to a named line of code — a systematic method for Java memory leak diagnosis using heap dumps, JFR, and NMT, plus the leak patterns that account for most real incidents."
date: 2027-12-22
tags: ["Java", "JVM", "Performance", "Observability", "Debugging"]
format: article
---

Java was supposed to end memory leaks. What it actually did was change their shape: instead of forgetting to free memory, we now *accidentally keep references* to memory we'll never use again — and the garbage collector, doing exactly its job, dutifully preserves it all until the heap fills and the pager fires.

Memory leak diagnosis has a reputation for being an art. It isn't. It's a method, and the method fits in one post.

## First: confirm it's actually a leak

Plenty of "memory leaks" are services legitimately using more memory than someone guessed they would. Before diagnosing, establish the signature. Chart heap occupancy *after* GC (the post-collection floor) over hours or days. A leak shows a **rising floor**: each collection reclaims less, the sawtooth's valleys climb. Stable valleys with big oscillation is normal allocation behavior, and the fix — if any — is heap sizing, not leak hunting.

Two impostors to rule out in the same step. **Load growth:** more traffic or bigger cache limits raise the floor legitimately; correlate the memory chart with request rate before blaming code. **Native memory:** if the *container* is OOM-killed but the Java heap chart looks healthy, stop — you have a native memory problem (direct buffers, metaspace, threads), and heap dumps will tell you nothing. That branch of the method: enable Native Memory Tracking (`-XX:NativeMemoryTracking=summary`, ~5% overhead), compare `jcmd <pid> VM.native_memory baseline`/`summary.diff` across the growth window, and the category that grows names the culprit — `Class` means classloader/metaspace leak, `Thread` means thread creation runaway, `Other`/`Internal` usually means direct ByteBuffers, most often from a networking library.

## The core move: differential heap analysis

For genuine heap leaks, one technique does most of the work: **two heap dumps, separated by growth, diffed.**

Capture the first dump once the service is warm (`jcmd <pid> GC.heap_dump /dumps/before.hprof`, ideally after a forced `GC.run` so you're looking at live objects). Let the leak accumulate — an hour, a day, whatever the growth curve says makes the delta obvious. Capture the second dump. A dump pauses the JVM for seconds on multi-GB heaps, so take it on one instance pulled from the load balancer, not the whole fleet; and if you run with `-XX:+HeapDumpOnOutOfMemoryError` (you should), the crash itself hands you the second dump for free.

Open both in **Eclipse MAT** (or IntelliJ's profiler, or VisualVM for smaller heaps) and look at the **dominator tree** — the view that answers "what is *keeping* memory alive" rather than "what exists." Sort by retained size, compare against the first dump, and in the overwhelming majority of real incidents the answer is embarrassingly visible: one collection, one cache, one map whose retained size went from 40 MB to 3.1 GB. MAT's "Leak Suspects" report automates exactly this and is right more often than pride wants to admit.

Then follow the **path to GC root** from the bloated object: that path is the reference chain your code built, and it ends at a field, a static, a ThreadLocal, or a listener registration — a named line of code. That's the deliverable.

When dumps are impractical (giant heaps, no window for a pause), JFR's **OldObjectSample** event is the lower-resolution fallback: continuous recording, samples of long-lived objects with their allocation stacks, enough to name the suspect class and allocation site with near-zero overhead.

## The usual suspects

Years of incident reviews compress into a short list of patterns; check them in this order.

**The unbounded map.** A static `ConcurrentHashMap` used as a cache, keyed by something with unbounded cardinality (session ID, request ID, tenant+day), with no eviction. The fix is a real cache — Caffeine with `maximumSize` and expiry — not a bigger heap. Its cousin: a map keyed by objects missing `equals`/`hashCode`, where every put is a unique key forever.

**Listener and callback registration without deregistration.** Something subscribes per-request or per-connection to a long-lived event source and never unsubscribes; the source's listener list becomes the leak. Grep for `addListener`/`register` calls whose remove twin appears nowhere.

**ThreadLocals on pooled threads.** A ThreadLocal set during request handling and never removed survives as long as the pool thread does — effectively forever, multiplied by pool size, and invisible until you know to look. The reference chain in MAT runs through `Thread.threadLocals`, which is the tell. `try/finally` with `remove()`, always.

**The classloader leak** — the enterprise classic. After hot redeploys, old application classloaders can't unload because one object they loaded is still referenced from outside: a JDBC driver registered in the JVM-global `DriverManager`, a shutdown hook, a scheduled task still ticking, a ThreadLocal on a shared thread. Symptom: metaspace climbs per redeploy until the app server dies. Modern fix: stop hot-deploying — restart processes/containers instead — which converts this entire category into a non-problem and is half the operational argument for containerized Java.

**Caches of caches:** an object cached at layer A holding a reference into layer B's context (a request, a session, an entity manager), retaining a whole object graph per entry. Retained size in the dominator tree exposes it instantly — entries "should" be 2 KB and are 800 KB.

**Substring/buffer aliasing** in native buffers and some serialization frameworks: a tiny logical object pinning a large backing array. Same tell — retained size wildly out of proportion to shallow size.

## Making the next one boring

The diagnosis method works, but the mature posture is making leaks *loud and cheap* instead of silent and catastrophic. Alert on the post-GC heap floor trending up over 24h windows — that alert fires days before the OOM. Run with heap-dump-on-OOM and a disk budget for it in every environment, so every crash is born with its evidence attached. Keep continuous JFR on in production. Put `maximumSize` on every cache as a code-review rule — an eviction policy is a bug-report generator you'll never read; an unbounded cache is a pager. And load-test soak runs (hours at steady state, watching the floor) catch the unbounded-map class of leak before any customer meets it.

The craft here isn't mystical. Confirm the rising floor, rule out native, diff two dumps, read the dominator tree, walk the path to the root, name the line. Every step is a standard tool doing a standard thing — which is exactly what you want from a 3 AM procedure.
