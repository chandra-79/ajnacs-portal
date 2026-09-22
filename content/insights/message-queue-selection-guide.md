---
title: "Choosing a Message Queue: Kafka, RabbitMQ, SQS, and the Questions That Actually Decide It"
description: "The messaging landscape sorted by what systems actually need — log vs queue semantics, ordering and replay requirements, operational cost, and a decision framework that survives vendor slideware."
date: 2027-03-17
tags: ["Distributed Systems", "Messaging", "Programming", "Architecture"]
format: article
---

Message-queue selection is a genre of architecture decision that attracts maximal opinion and minimal framework. Teams inherit Kafka because it's what serious companies use, or SQS because it was one click away, or RabbitMQ because someone knew it — and then spend years discovering that the technology's *semantics* fit or fight their actual workload. The corrective is to start from the questions whose answers genuinely partition the space, because the products differ less in quality than in *shape*.

## The fundamental split: queue semantics vs log semantics

The single most clarifying distinction: **a queue destroys what it delivers; a log remembers.**

**Queue semantics** (RabbitMQ, SQS, ActiveMQ-lineage brokers): messages are *tasks* — produced, delivered to a competing consumer, acknowledged, gone. The natural fit is work distribution: send the email, process the upload, handle the order — units of work that want exactly one handler, retries on failure, and a dead-letter lane for the poisonous. The mental model is a to-do list.

**Log semantics** (Kafka, Pulsar, Kinesis, Redpanda): messages are *events* appended to a durable, ordered, replayable record; consumers are readers with positions (offsets), not competitors for deletion — many independent consumer groups read the same stream at their own pace, and yesterday's events are re-readable today (new consumer? bug fix requiring reprocessing? replay from the beginning). The mental model is a ledger.

Half of all messaging-selection pain is teams buying one shape while needing the other: the work-queue workload on Kafka fights per-message acknowledgment, delayed retries, and fair dispatch (all natural in RabbitMQ/SQS, all awkward on a partitioned log); the event-distribution workload on RabbitMQ reinvents replay and multi-subscriber fan-out that a log gives free. Ask first: *are these tasks to complete, or facts to record?* Many estates legitimately need both — one of each, well-chosen, beats one tool contorted.

## The deciding questions

**Ordering — how much, scoped to what?** Global ordering is expensive everywhere and almost never actually required; the real requirement is usually *per-entity* ordering (all events for order 123 in sequence), which Kafka delivers via partition keys (same key → same partition → strict order), SQS via FIFO message groups (with throughput ceilings worth reading before promising), and RabbitMQ only with care (single queue, single consumer — parallelism and strict order are natural enemies). If someone claims to need global order, make them defend it; if per-entity order is genuinely required, the log side of the ledger gets a strong pull.

**Replay and retention — will anyone need the past?** Event sourcing, audit streams, rebuilding read models, feeding late-arriving analytics consumers, reprocessing after a bug: any yes points at log semantics, where retention is a config knob (and with tiered storage, cheap object storage extends it to months). Queues offer nothing here — acknowledged means gone.

**Throughput and fan-out — honestly sized.** Kafka-class systems handle millions of messages/sec and dozens of independent consumer groups without breaking form; RabbitMQ comfortably serves tens of thousands/sec, which is *more than most enterprises' actual workloads* — the sizing dishonesty usually runs in Kafka's favor ("we might need scale" funding a cluster whose three-node minimum outweighs the workload's needs for years). Fan-out to many heterogeneous readers is a log's home game; competing-consumer scaling of task processing is a queue's.

**Delivery-time features — the queue side's quiet superpowers.** Per-message delays and scheduled delivery, priority queues, sophisticated routing (RabbitMQ's exchange/binding model remains genuinely elegant for content-based dispatch), per-message TTL, native dead-lettering with redelivery counts: task workflows lean on these constantly, and log systems either lack them or simulate them with extra topics and consumer gymnastics. If your architecture diagram is full of retry-with-backoff and route-by-type, weight this heavily.

**Operational appetite — the question that overrides the others.** Self-managed Kafka is a real operational commitment (even post-ZooKeeper: partition rebalancing, broker upgrades, capacity management, the consumer-group pathologies) that deserves either a dedicated platform team or a managed service (MSK/Confluent-class), and the managed-service bill deserves honest comparison against **SQS/SNS-class serverless messaging** — which, for teams on that cloud with moderate needs, is the pragmatic default: nothing to operate, effectively infinite scale for task workloads, per-message pricing that's a bargain until very high volumes, and well-understood limits (visibility timeouts, FIFO throughput, 14-day retention) that most workloads never meet. The unfashionable truth: a large fraction of enterprise messaging needs are fully served by the boring managed queue plus a topic-fan-out service, at a fraction of the operational surface.

## The short-form recommendations

**Task/work distribution, moderate scale, cloud-native:** SQS (+SNS/EventBridge for fan-out and routing) — take the boring win. **Task workloads needing rich routing, delays, priorities, on-prem or multi-cloud:** RabbitMQ — mature, operable at human scale, does exactly what it says. **Event backbone — many producers, many independent consumers, replay, stream processing (Kafka Streams/Flink), high throughput, event sourcing:** Kafka (managed unless you have the platform team), with Redpanda/Pulsar as legitimate alternates where their specific advantages (operational simplicity, multi-tenancy/geo-replication respectively) match your constraints. **Both shapes present:** run both without embarrassment — the "one messaging platform" consolidation instinct produces the contortions above; what should be consolidated is *per shape*, not per company.

Two closing disciplines that outrank the selection itself. First, **whatever you choose delivers at-least-once in practice** — the idempotent-consumer discipline is non-negotiable across the whole landscape, and "exactly-once" marketing changes nothing about your handlers' obligations. Second, **govern the schemas, not just the broker**: the messaging system's real API is the message format, and unmanaged payload evolution (a producer "just adding a field," a consumer assuming one) is the outage generator that survives every infrastructure choice — schema registry, compatibility rules, and contract review turn the message bus from a shared liability into the stable seam between teams it was purchased to be. Brokers are replaceable; the discipline travels.
