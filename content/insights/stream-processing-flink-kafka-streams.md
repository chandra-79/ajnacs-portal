---
title: "Stream Processing: Flink, Kafka Streams, and Thinking in Unbounded Data"
description: "Define event-time and lateness policies, scope processing guarantees, and measure how a synthetic stream changes as late events arrive."
date: 2027-09-29
tags: ["Data Engineering", "Distributed Systems", "Stream Processing", "Architecture"]
format: article
---

Batch processing has a comforting shape: the data arrives, the job runs, the answer exists. Stream processing removes the comfort by removing the end — the data never stops, so "the answer" becomes a moving computation over an unbounded input, and an entire batch-era mental model quietly breaks: there is no "all the data," no "job finished," no natural moment when the count is final. Teams that adopt streaming infrastructure while keeping batch mental models produce the field's characteristic bugs — counts that change after being reported, aggregations missing the events that arrived late, pipelines that silently double-count after failures. The fixes are conceptual first, tooling second.

## The concepts that do the heavy lifting

**Event time versus processing time** is the foundational split: *when the thing happened* versus *when your system saw it* — and they diverge constantly (mobile clients batching uploads, network delays, replayed backfills). Any computation whose meaning references the real world — "orders per hour," "sessions per user" — usually needs **event time**, with explicit handling of timestamp quality and lateness. Which creates the problem event time can't dodge: how long do you wait for stragglers before declaring an hour's window closed? That answer is the **watermark** — the stream's own moving assertion that "events earlier than T have (probably) all arrived" — and it's a *policy you choose*, trading latency against completeness: aggressive watermarks report fast and miss late events; more delayed ones trade additional latency for a larger opportunity to receive late data. Mature pipelines make the trade explicit and handle the leftovers deliberately (late-event side-outputs, window retractions/updates downstream — the "count was 1,042, now it's 1,047" reality that consuming systems must be designed to absorb, which is an *interface contract*, not an implementation detail).

**State is what makes streaming hard** — and useful. The interesting computations (joins across streams, sessionization, running aggregates, deduplication, the fraud model's per-card history) all require remembering things per key across events, which means the processor is a *stateful distributed system*: state must be partitioned (by key, riding the Kafka-partition discipline), persisted (local stores with changelog/checkpoint backup), and — the crux — **restored consistently after failure**. This is where "exactly-once" earns its honest formulation: not an unqualified guarantee about every delivery and external effect but **exactly-once *state effects*** — checkpointing input positions and state snapshots atomically (Flink's coordinated checkpoints, Kafka Streams' transactional commits), so a crash rewinds to a consistent point and replays without double-counting *within the pipeline*. The fine print that survives all marketing: outputs to *external* systems still need transactional sinks or idempotent writes — the boundary discipline never goes away; the framework just handles the interior.

## The tooling decision, by workload shape

**Kafka Streams** (and its lighter functional kin) is a *library, not a cluster*: your stream job is a normal JVM application — deployed, scaled, and operated like any service (the same CI/CD, the same Kubernetes), with state in embedded stores backed by Kafka changelogs. It's the right default when the sources and sinks are Kafka, the team already operates services well, and the topology is application-shaped (enrich, join, aggregate, emit). Its constraints: JVM-only, Kafka-only, and coordination features (large state rebalancing, complex event-time machinery) that are workable but not its center of gravity.

**Flink** is a *platform*: a cluster (or managed service) running jobs with extensive event-time, watermark and state machinery, genuinely large state (terabytes, with incremental checkpoints), sophisticated windowing/CEP, and SQL as a first-class interface. It earns its operational weight when the workloads are pipeline-shaped and demanding — multi-stream joins at scale, complex event-time correctness, state beyond what embedded stores comfortably hold — or when a platform team serves many streaming use cases centrally. The managed offerings have substantially blunted the "Flink ops are hard" objection, per the usual buy-the-control-plane logic.

**Streaming SQL engines** (Flink SQL, the materialized-view engines, the streaming-database products) are the rising third option: declare the computation, let the engine maintain it incrementally. For the large fraction of streaming needs that are really "keep this aggregation/join current" — dashboards, features, caches — they collapse enormous implementation surface, and the honest modern evaluation starts here: *can this be a maintained view?* before *should this be a coded topology?*

(And the perennial pragmatic contender: **micro-batch** — Spark Structured Streaming and friends — remains a legitimate answer when its measured latency and processing model meet the requirement and the team's world is already Spark; the "real streaming vs micro-batch" purity debate matters far less than the latency requirement, which should be written down before any of this is chosen.)

## The operational reality: jobs that never finish

A streaming job is a service with a database inside, and its operations follow: **lag is the vital sign** (consumer lag per partition — the streaming SLO, alarmed by burn-rate logic like any other), **checkpoint health is the safety net's pulse** (duration and failure alarms, because a job whose checkpoints silently fail is accumulating an unbounded replay), **state size is capacity planning** (unbounded keys mean unbounded state — TTLs and windowing as policy, per the retention disciplines), **backpressure is the design question, not the incident** (when input outruns processing, something must give — buffer, shed, or scale; choosing at design time beats discovering at 2 AM), and **schema evolution rides the same governance as every stream** (the message-contract discipline, doubly binding because state *outlives* deployments — the job restored from checkpoint must read its own year-old state under the new code, which is a versioning discipline teams discover exactly once). And the **replay/backfill path is the superpower to preserve**: the log-plus-deterministic-job combination means bugs can be fixed by reprocessing history — if event-time logic is honest, sinks are idempotent, and topics retain enough (the tiered-storage economics making "enough" generous). Pipelines designed for replay make some data repairs reproducible, with reconciliation and communication still required — the same rebuildability principle as every derived-store pattern, and the reason the discipline pays for itself the first bad week.

The compact placement rule: **materialized-view engines for "keep this current," Kafka Streams for Kafka-native application logic, Flink for heavy multi-stream event-time work, micro-batch where its measured latency fits** — with event-time correctness, exactly-once state semantics, idempotent sinks, and replay-ability as the non-negotiables whatever runs underneath. The unbounded world is now the default shape of enterprise data; the teams that think in watermarks and state — rather than in jobs that finish — are the ones whose numbers stay true while the data keeps arriving.

## Write down when an answer is allowed to change

For every streaming output, define its key, event-time interval, update semantics and finalization policy. A dashboard may accept an early estimate that is revised; an invoice workflow may require a settled interval with explicit later adjustments. The sink must support the chosen contract. Appending every revised aggregate as though it were a new independent event can double-count a window even when the processor's internal state is correct.

Event time is appropriate when the question concerns when events occurred, while processing time can legitimately describe operational arrival or processing behavior. Neither is universally correct for every metric. Preserve both when they answer different questions. Device timestamps can be wrong, so define validation and clock-skew handling rather than assuming embedded event time is unquestionable truth.

### A hypothetical lateness policy

Suppose a fixed one-minute window ultimately contains one hundred events. Ninety arrive before an initial publication point, eight arrive within the accepted correction interval and two arrive after the final cutoff. The initial count is ninety; the corrected live count becomes ninety-eight; an offline reconciliation against the complete fixture yields one hundred. The chart compares those three values.

This is a synthetic arrival schedule, not a measured completeness rate. A watermark and lateness policy determine when the system advances and what it does with stragglers. A more delayed watermark does not prove that all events have arrived if delay is unbounded. Publish whether late events update the live result, enter a side output or require a later restatement.

## Watermarks can stall on quiet inputs

An operator combining inputs commonly advances according to the minimum relevant input watermark. One idle partition can therefore hold back event-time progress even while other partitions are busy. Configure idleness handling according to the source behavior and test a partition that becomes active again. Marking an input idle changes the progress assumption; it does not make its future old events disappear.

Track watermark lag separately from record backlog and processing latency. A job can process all available records quickly while windows remain open because event-time progress is stalled. Conversely, a watermark can advance while a downstream sink is slow. These are different failures with different remedies.

A replay can process days of event time in minutes of wall-clock time. Timers and external calls that rely on current wall-clock behavior can make replay diverge from the original computation. Identify nondeterministic enrichment and preserve the reference-data version or event-time lookup needed for reproducibility.

## State retention changes correctness

Deduplication requires remembering identifiers for a defined horizon. If an identifier expires from state and an older event is replayed, it may be counted again. Choose retention from the maximum supported duplicate/replay interval and document what happens beyond it. A short TTL that reduces memory can weaken a correctness guarantee; that trade must be explicit.

Stream joins need bounded temporal relationships or another retention plan. Two unbounded streams joined without a meaningful time constraint can accumulate state indefinitely. Define how long each side waits, whether unmatched records are emitted and how late matches revise results. Test a missing counterpart rather than only neatly paired events.

State size depends on active keys, per-key data and retained windows. A hot key can concentrate processing even when the overall input is well partitioned. Salting a key can help some aggregations only if a correct recombination stage exists; it can change ordering or session semantics for other workloads. Model the operation before applying a distribution trick.

## Checkpoints are a recovery protocol

A completed checkpoint records a consistent recovery boundary under the framework's source, state and sink contracts. Checkpoint configuration, storage durability and connector support matter. A checkpoint file existing somewhere is not proof that the job can restore with the current code. Test restoration with the exact state serializers and operator identifiers used by the deployed topology.

Measure checkpoint duration, failures, age of the latest successful checkpoint and restore time. Long periods without successful checkpoints increase replay work and can exceed source retention. Backpressure can affect alignment and checkpoint behavior; framework features that address it have resource and configuration tradeoffs. Evaluate them with the actual topology rather than turning them on as an unexplained default.

External effects require coordination. A payment API call, email or arbitrary database mutation is not automatically included in a stream processor's checkpoint. Use a transactional sink, an idempotent operation identifier or a durable handoff protocol. Test a crash after the effect but before checkpoint completion. Exactly-once internal state does not excuse duplicate external actions.

### A runnable-concept fixture

Create a deterministic input file or test topic containing event identifiers, keys, event timestamps and a prescribed arrival order. Include a duplicate, an out-of-order event, an event after the cutoff, an idle partition and a missing join partner. Compute the expected window results by hand, including corrections and side outputs. Feed the same fixture through the chosen framework's test harness.

Interrupt a local job after partial processing, restore it and compare final results with an uninterrupted run. Repeat after an application upgrade that changes a state field. Verify that incompatible state changes are detected or migrated through the supported mechanism. Keep the fixture and expected results with the topology so future changes protect the output contract.

## Select a framework by demonstrated obligations

Kafka Streams is attractive for applications centered on Kafka topics and its library deployment model. Flink provides rich stateful processing and event-time capabilities across supported connectors. Streaming SQL can reduce custom code where the query and changelog semantics fit. Micro-batch systems can meet a range of latency requirements, including sub-minute cases in suitable configurations; measure the actual objective rather than assigning them a fixed minutes-only category.

Compare connector guarantees, state size, recovery behavior, team operations and total cost. Run a representative sustained load that includes skew and a recovery interval. Record whether the job catches up after failure while live traffic continues. A streaming platform is successful when its outputs remain understandable through lateness, replay and upgrades, not when a demo produces a count quickly.

### Figure methodology

Synthetic one-minute window has 100 eventual events:90 before initial publication,8 within the correction interval,2 after the cutoff. Live counts become 90 then 98; offline full-fixture reconciliation yields 100. No observed completeness claim; cutoff policy controls treatment.

| Worked observation | events |
| --- | ---: |
| Initial publication | 90 |
| Live correction | 98 |
| Full reconciliation | 100 |

## Primary references and further study

- [Flink event time, watermarks and lateness](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/)
- [Flink checkpointing guarantees and configuration](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/checkpointing/)
- [Kafka Streams core concepts](https://kafka.apache.org/44/streams/core-concepts/)
