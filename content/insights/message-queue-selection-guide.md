---
title: "Choosing a Message Queue: Kafka, RabbitMQ, SQS, and the Questions That Actually Decide It"
description: "Choose messaging by acknowledgement, ordering and replay semantics. Calculate backlog recovery and test duplicate and ambiguous deliveries."
date: 2027-03-17
tags: ["Distributed Systems", "Messaging", "Programming", "Architecture"]
format: article
---

Message-queue selection is a genre of architecture decision that attracts maximal opinion and minimal framework. Teams inherit Kafka because it's what serious companies use, or SQS because it was one click away, or RabbitMQ because someone knew it — and then spend years discovering that the technology's *semantics* fit or fight their actual workload. The corrective is to start from the questions whose answers genuinely partition the space, because the products differ less in quality than in *shape*.

## The fundamental split: queue semantics vs log semantics

The single most clarifying distinction: **a traditional work queue removes acknowledged work from active delivery; a retained log separates consumption position from retention.**

**Queue semantics** (RabbitMQ, SQS, ActiveMQ-lineage brokers): messages are *tasks* — produced, delivered to a competing consumer, acknowledged, gone. The natural fit is work distribution: send the email, process the upload, handle the order — units of work that want exactly one handler, retries on failure, and a dead-letter lane for the poisonous. The mental model is a to-do list.

**Log semantics** (Kafka, Pulsar, Kinesis, Redpanda): messages are *events* appended to a durable, ordered, replayable record; consumers are readers with positions (offsets), not competitors for deletion — many independent consumer groups read the same stream at their own pace, and yesterday's events are re-readable today (new consumer? bug fix requiring reprocessing? replay from the beginning). The mental model is a ledger.

Half of all messaging-selection pain is teams buying one shape while needing the other: the work-queue workload on Kafka fights per-message acknowledgment, delayed retries, and fair dispatch (all natural in RabbitMQ/SQS, all awkward on a partitioned log); the event-distribution workload on RabbitMQ reinvents replay and multi-subscriber fan-out that a retained log is designed to support, subject to retention and operational cost. Ask first: *are these tasks to complete, or facts to record?* Many estates legitimately need both — one of each, well-chosen, beats one tool contorted.

## The deciding questions

**Ordering — how much, scoped to what?** Global ordering is expensive everywhere and almost never actually required; the real requirement is usually *per-entity* ordering (all events for order 123 in sequence), which Kafka delivers via partition keys (a stable key mapping selects a partition; producer and consumer behavior must preserve the intended entity order), SQS via FIFO message groups (with throughput ceilings worth reading before promising), and RabbitMQ only with care (single queue, single consumer — parallelism and strict order are natural enemies). If someone claims to need global order, make them defend it; if per-entity order is genuinely required, the log side of the ledger gets a strong pull.

**Replay and retention — will anyone need the past?** Event sourcing, audit streams, rebuilding read models, feeding late-arriving analytics consumers, reprocessing after a bug: any yes points at log semantics, where retention is a config knob (and with tiered storage, cheap object storage extends it to months). Traditional work queues usually need an additional archive for this use; some products also offer retained-stream modes.

**Throughput and fan-out — honestly sized.** Throughput depends on payload size, durability, replication, storage, routing and consumer behavior; benchmark the intended configuration — the sizing dishonesty usually runs in Kafka's favor ("we might need scale" funding a cluster whose three-node minimum outweighs the workload's needs for years). Fan-out to many heterogeneous readers is a log's home game; competing-consumer scaling of task processing is a queue's.

**Delivery-time features — the queue side's quiet superpowers.** Per-message delays and scheduled delivery, priority queues, sophisticated routing (RabbitMQ's exchange/binding model remains genuinely elegant for content-based dispatch), per-message TTL, native dead-lettering with redelivery counts: task workflows lean on these constantly, and classic log-consumer designs may need additional mechanisms for them with extra topics and consumer gymnastics. If your architecture diagram is full of retry-with-backoff and route-by-type, weight this heavily.

**Operational appetite — the question that overrides the others.** Self-managed Kafka is a real operational commitment (even post-ZooKeeper: partition rebalancing, broker upgrades, capacity management, the consumer-group pathologies) that deserves either a dedicated platform team or a managed service (MSK/Confluent-class), and the managed-service bill deserves honest comparison against **SQS/SNS-class serverless messaging** — which, for teams on that cloud with moderate needs, is the pragmatic default: less broker infrastructure to operate, managed scaling subject to service quotas and workload constraints, per-message pricing that's a bargain until very high volumes, and well-understood limits (visibility timeouts, FIFO throughput, 14-day retention) that most workloads never meet. The unfashionable truth: a large fraction of enterprise messaging needs are fully served by the boring managed queue plus a topic-fan-out service, at a fraction of the operational surface.

## The short-form recommendations

**Task/work distribution, moderate scale, cloud-native:** SQS (+SNS/EventBridge for fan-out and routing) — take the boring win. **Task workloads needing rich routing, delays, priorities, on-prem or multi-cloud:** RabbitMQ — mature, operable at human scale, does exactly what it says. **Event backbone — many producers, many independent consumers, replay, stream processing (Kafka Streams/Flink), high throughput, event sourcing:** Kafka (managed unless you have the platform team), with Redpanda/Pulsar as legitimate alternates where their specific advantages (operational simplicity, multi-tenancy/geo-replication respectively) match your constraints. **Both shapes present:** run both without embarrassment — the "one messaging platform" consolidation instinct produces the contortions above; what should be consolidated is *per shape*, not per company.

Two closing disciplines that outrank the selection itself. First, **delivery guarantees vary by configuration and boundary; external side effects still need an explicit retry and deduplication design** — the idempotent-consumer discipline is non-negotiable across the whole landscape, and "exactly-once" marketing changes nothing about your handlers' obligations. Second, **govern the schemas, not just the broker**: the messaging system's real API is the message format, and unmanaged payload evolution (a producer "just adding a field," a consumer assuming one) is the outage generator that survives every infrastructure choice — schema registry, compatibility rules, and contract review turn the message bus from a shared liability into the stable seam between teams it was purchased to be. Brokers are replaceable; the discipline travels.

## A capacity exercise before a product shortlist

Start with an invented workload of 200 messages per second and an average processing time of 0.25 seconds per message. Ignoring overhead, a worker processing one message at a time can complete four messages per second. Fifty equally effective concurrent workers would therefore match the average arrival rate exactly. That leaves no capacity to drain a backlog or absorb variation. This arithmetic is a starting model, not a recommended production utilization target.

Suppose processing stops for ten minutes while producers continue at 200 messages per second. The backlog becomes 200 times 600, or 120,000 messages. After recovery, total processing capacity of 300 messages per second leaves 100 per second for catch-up after serving new arrivals. Clearing the backlog takes 120,000 divided by 100, or 1,200 seconds: 20 minutes. At 400 per second, the net drain is 200 and recovery takes ten minutes. At 600 per second, net drain is 400 and recovery takes five minutes. The figure plots these three idealized recovery times.

Real processing time is variable, messages may retry, and the downstream database may not sustain the extra concurrency. A worker-count change can therefore reduce throughput rather than increase it. Measure the service rate and the dependency limits under the catch-up workload. Define the recovery objective as an age bound for the oldest unfinished business item, not merely a target for the broker's message count.

## Describe the semantics in a comparison worksheet

For each candidate, record the acknowledgement boundary. A publisher confirmation can establish that the broker accepted a message according to its configured policy. It is not confirmation that a consumer completed the business action. A consumer acknowledgement or deletion usually advances the delivery lifecycle, but it cannot retroactively make an uncommitted database update durable. Write down what happens if the worker crashes immediately before and immediately after each boundary.

Then record the ordering scope. A Kafka partition provides a log order, but producers, retries, key mapping changes and consumer concurrency still need a compatible design. A FIFO message group expresses a different scope from an entire queue. RabbitMQ ordering depends on queue type, consumer arrangement and redelivery behavior. Avoid a single yes/no cell labelled ordered. Use a concrete example such as two updates for the same order, and state whether application completion must preserve their sequence.

Retention is equally specific. A traditional acknowledged work queue usually removes a completed message from its active delivery lifecycle, while a retained log can support independent consumer positions. Products increasingly support several models: RabbitMQ has streams, and Kafka has capabilities beyond classic consumer groups. Evaluate the documented feature and version in use instead of making a permanent queue-versus-log classification of the vendor. A replay requirement also needs enough retention, compatible schemas and safe replay behavior at the destination.

## Test the failure windows that determine the design

Use a fake side-effect service and uniquely identified messages. In the first trial, publish a message but drop the confirmation response. Retry with the same logical message identifier and inspect whether the broker or consumer sees a duplicate. In the second, let the consumer commit its business update, then terminate it before acknowledgement. After redelivery, verify that the update is not applied twice. In the third, acknowledge before deliberately failing the update and demonstrate why that ordering can lose work.

Store deduplication state and the business mutation in one local transaction where the destination supports it. If the effect is external, use the external system's documented idempotency protocol or reconciliation endpoint. A deduplication record written before an external call can suppress a necessary retry after a crash; one written afterwards can permit a duplicate. The existence of an inbox table is not enough unless its atomic boundary matches the promised effect.

Introduce one malformed message and decide whether it blocks later messages for the same entity. A dead-letter queue provides isolation, not resolution. Assign an owner, an alert, a retention period and a reprocessing procedure. Replaying a fixed poison message after later entity updates may require ordering or version checks. Record its original identifier and causal context so remediation does not create an unrelated new business action.

## Measure cost in the same unit as the workload

A fair cost worksheet includes operations, transferred bytes, retained bytes, replication, cross-zone traffic, monitoring and staff time. Managed services remove some operational work, but they still have quotas, credentials, capacity assumptions and incident responsibilities. Self-managed brokers may make infrastructure cost visible while hiding engineering effort. Use current regional pricing only when preparing an actual estimate, and preserve the date and assumptions with that estimate.

Message size and batching can dominate the comparison. A million tiny messages and a million large payloads are not equivalent workloads. Include envelope overhead, compression, batch size, producer wait time and consumer fetch settings in a benchmark. If payloads are moved to object storage, account for the additional read path, access control, object lifetime and failure when the pointer arrives before the object is accessible.

Security and tenancy belong in the same decision. Specify who can publish, consume, inspect historical data and replay it. Treat a message containing a tenant identifier as untrusted input unless authorization has already been enforced at the relevant boundary. A shared topic or queue can become a noisy-neighbor and data-exposure surface. Observe per-tenant backlog and consumption where the isolation requirements demand it.

## A decision record that survives a future migration

Write a short acceptance test suite around the semantics rather than the product API alone. It should cover duplicate publication, consumer restart, ambiguous acknowledgement, ordered entity updates, poison-message handling, backlog recovery and retention expiry. Run it against a small realistic workload before committing to a service. Keep the generated message identifiers and expected final state so the result is reproducible.

Choose the candidate that satisfies the required behavior with an operational burden the team can sustain. Document which attractive features were unnecessary and which limitations the application must handle. Revisit the decision when retention, fan-out, ordering or processing latency changes, rather than when a different broker becomes fashionable. The durable output is an explicit contract for producers and consumers; the infrastructure choice is one implementation of that contract.

### Figure methodology

Synthetic arrivals are 200 messages/s. A 600-second processing outage creates 120,000 messages. Drain time = backlog / (processing capacity - arrival rate), then divide seconds by 60. Capacity assumptions exclude retries, overhead and downstream bottlenecks.

| Worked observation | minutes to drain |
| --- | ---: |
| Capacity 300 per second | 20 |
| Capacity 400 per second | 10 |
| Capacity 600 per second | 5 |

## Primary references and further study

- [Apache Kafka: design and delivery semantics](https://kafka.apache.org/44/design/design/)
- [RabbitMQ: consumer acknowledgements and publisher confirms](https://www.rabbitmq.com/docs/confirms)
- [Amazon SQS: standard-queue at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html)
