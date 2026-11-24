---
title: "System Design Patterns Every Backend Engineer Should Know"
description: "CQRS, event sourcing, saga pattern, outbox pattern — the patterns that solve specific distributed systems problems, what trade-offs they introduce, and when the simpler option is actually the right one."
date: 2026-10-28
tags: ["Programming", "Architecture", "Cloud Architecture"]
format: article
---

System design patterns are solutions to recurring problems in distributed systems. The trap is learning them as a catalogue and applying them because they exist rather than because they solve a specific problem. Some of the most over-engineered systems I've seen are over-engineered with legitimate patterns applied in contexts where simpler options would have worked.

The patterns worth knowing deeply are the ones that solve problems you will actually encounter — data consistency across services, handling high write loads, maintaining audit history, coordinating distributed transactions. Here's how I think about the ones that come up most often.

## What to measure

**Traffic, queue lag and user-visible outcomes.** During a load ramp, track successful throughput and tail latency. If production runs at 800 messages/s and consumers process 700, backlog grows by 100 messages/s, or 6,000 per minute. Set a visible lag objective and test how the system drains after a burst.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## CQRS: separate your read model from your write model

Command Query Responsibility Segregation separates the data model used to modify state (commands) from the data model used to read state (queries).

The problem it solves: in most applications, read patterns and write patterns have conflicting requirements. Writes need normalised data for integrity. Reads need denormalised data for performance — joining five tables on every page load is a performance problem waiting to happen at scale. CQRS acknowledges this and makes the separation explicit.

**Command side**: handles writes, enforces invariants, updates the write model (typically a normalised relational store).

**Query side**: maintains read-optimized projections, potentially in a different store (Elasticsearch for search, a materialised view for dashboard queries, a Redis cache for frequently-accessed aggregates).

The trade-off: eventual consistency. The read model lags behind the write model, updated by events or replication. For most read operations this is acceptable — you don't need to see the change you just made immediately. For some operations (confirmation pages, payment status) it's not, and you need to query the write model directly.

When NOT to use it: when your read patterns are simple and your data volume is low. CQRS adds operational complexity — two models to maintain, synchronisation to manage. A well-indexed PostgreSQL table with optimized queries is faster to build and easier to operate for most services.

## Event sourcing: store events, derive state

Instead of storing the current state of an entity (the order is "shipped"), event sourcing stores the sequence of events that produced that state (OrderPlaced → PaymentConfirmed → WarehousePicked → Dispatched → Shipped).

The benefits: complete audit history, the ability to replay events to rebuild state, the ability to derive new projections from historical events.

The trade-off: querying current state requires replaying events, which is expensive unless you maintain snapshots. Event schema evolution is hard — events are permanent, so a schema change to an event is a migration problem that can never be fully resolved. The conceptual model is unfamiliar to most engineers.

When event sourcing is genuinely valuable: financial ledgers (every transaction matters, audit is a regulatory requirement), systems where audit history has business value, systems where you need to rebuild state from scratch reliably.

When it's overkill: most CRUD applications. If your primary need is to know the current state and you don't need the full history, a standard relational model with an audit log table covers the requirement at a fraction of the operational cost.

## The saga pattern: distributed transactions without distributed locks

Distributed transactions — operations that span multiple services and must either all succeed or all fail — are hard. Two-phase commit exists but is slow and creates coupling; a coordinator failure can leave transactions in an indeterminate state.

The saga pattern decomposes a distributed transaction into a sequence of local transactions, each of which publishes an event or message triggering the next step. If any step fails, compensating transactions undo the completed steps.

```
CreateOrder → ReserveInventory → ProcessPayment → ConfirmShipment
                ↕ compensate     ↕ compensate      ↕ compensate
              ReleaseInventory  RefundPayment   CancelShipment
```

**Choreography**: each service listens for events and reacts. No central coordinator. Loose coupling. Hard to trace the saga's progress and harder to handle timeout scenarios.

**Orchestration**: a central saga orchestrator sends commands and waits for responses. Easier to monitor and handle failures. Coupling to the orchestrator.

For complex sagas (5+ steps, long-running), orchestration is more maintainable. For simple sagas (2-3 steps, short duration), choreography is often sufficient.

## The outbox pattern: reliable event publishing

The problem: you want to update your database and publish an event atomically. Write to the database but crash before publishing the event — your state is updated but the event is lost. Publish the event but the database write fails — the event fires for a change that didn't happen.

The outbox pattern stores outgoing events in an `outbox` table as part of the same database transaction as the business data change. A separate process (the relay) reads from the outbox and publishes to the message broker, marking entries as processed.

```sql
BEGIN;
UPDATE orders SET status = 'CONFIRMED' WHERE id = ?;
INSERT INTO outbox (aggregate_id, event_type, payload) 
  VALUES (?, 'ORDER_CONFIRMED', ?);
COMMIT;
-- relay reads outbox, publishes to Kafka, marks as sent
```

The transaction commits both the business record and the outbox record. Delivery still depends on a functioning relay, broker availability, and retention. A relay can publish again after a crash between broker acknowledgement and marking the item sent. Use a stable event ID and idempotent consumer processing, and monitor undelivered records. See the [transactional outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

## Cache-aside: reading from cache, falling back to the database

The most common caching pattern: application checks cache, cache hit returns data, cache miss reads from database and writes to cache before returning.

The failure modes that aren't always obvious:
- **Cache stampede**: if the cache entry expires and many requests arrive simultaneously, all miss the cache and hit the database concurrently. Solution: probabilistic early expiration or a locking strategy that lets one request populate the cache while others wait.
- **Stale reads**: cache and database diverge on writes. Decide explicitly on your staleness tolerance and either accept it or implement cache invalidation.
- **Cold cache**: after a deployment or cache flush, the entire load falls on the database. Warm the cache before switching traffic.

## The pattern selection question

Before applying any of these patterns, the question worth asking: what is the actual problem I'm solving?

If the answer is "our read performance is poor under load" — CQRS or read replicas.
If the answer is "we need full audit history for regulatory compliance" — event sourcing or an append-only audit table.
If the answer is "we need a multi-service operation to be consistent" — saga.
If the answer is "our event publishing is unreliable" — outbox.

A pattern applied because it's architecturally interesting, not because it solves a specific problem, adds complexity without benefit. The simplest implementation that meets the requirements is usually the right one.

*Working through a distributed systems design challenge? [Always happy to think through trade-offs.](/contact/)*

## Start with the invariant the product depends on

Take a hypothetical order workflow where a customer can authorise payment while a warehouse reserves stock. Write down the properties the system must preserve. The confirmed order must have a valid reservation. A customer should never be charged twice for the same order. The support team needs to know when a payment is awaiting reconciliation. Put the team that can enforce each rule next to it in the design. A local database can enforce the uniqueness of an order record. Confirmation across an external payment service needs a way to identify and verify the outcome before fulfilling.

Draw the boundary around each durable write and mark any communication that follows it. A synchronous API response is observable by the caller but it remains possible for the client to lose it. An event confirms whatever its producer has actually committed, and its consumer may see duplicates or delays. Build a test matrix that crosses these boundaries. For each one, check what callers see before, during and after a failure. Count duplicates, unknowns and delayed confirmations separately.

## Keep CQRS proportionate to the difference between reads and writes

You can apply command and query separation in one process and one database. For one overloaded summary query, try an appropriate index, a separate query model or a materialised view before adding a new store. Teams can move projections out later if they need an independently scaled or differently shaped read path. Once there is a separate projection, put its freshness in the contract and identify how readers handle updates that have not appeared yet. [Azure CQRS pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)

Suppose a dashboard projection receives 400 accepted changes per second for five minutes and applies 350 during that period. It accumulates 15,000 changes. When new traffic drops to 200 changes per second and it keeps applying 350, the backlog takes 100 seconds to clear under the illustrative rates. An ordered offset gives a position, while the age of the oldest relevant pending change describes a different consequence. Correlate both with publication time and verified data. Show a visible pending state that points to the authoritative order when the product needs a recent confirmation.

Include a rebuild strategy. Start from a named snapshot or a source position, replay to a known watermark and check record counts and the underlying business totals. Catch up changes written during the rebuild before switching the reader. Rehearse recovery while the old projection remains available. Check that consumer offsets and the comparison are scoped to the same schema and partition layout.

## Design compensation around business semantics

A compensation is a new business action. It may have a cost and may complete long after the request times out. Refunds can post on a different schedule from capture, and releasing an inventory hold should verify that it has not already been fulfilled. Identify the first action that cannot be reversed within the needed time, also called a pivot in some saga designs. Prefer validating reservations and permissions beforehand. After the pivot, recovery may mean progressing to a consistent final outcome, compensating where possible or sending the case to an operator. [AWS saga patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-patterns.html)

Represent the next legal actions explicitly in a workflow state. Give execution and compensation separate identifiers so a retried refund can be recognised without suppressing a legitimate second operation. On a timeout from an external service, reconcile before repeating an irreversible action. In a fixture, test a payment that completed but never returned, a reservation that expired before confirmation and a compensation that needs human review. Judge the result from the stored workflow and the external ledger, including whether support can explain the state accurately.

Record the backlog of workflows waiting for a transition, the age of the oldest one, the count of reversals and the number of cases needing intervention. For choreography, rebuild the history by following one stable workflow ID across its events. For orchestration, ensure the coordinator’s durable state can be recovered by another operator. The choice affects what is easy to observe and repair. Test a restart in both cases before adopting one broadly.

## Treat event replay like a production release

Define which events are business facts and give each type a version. Test a replay using older records, unknown optional fields and repeated events. A consumer may use upcasting or support several schema versions at once. A replay that reconstructs a read model must avoid repeating notifications, charges or other external side effects. Set a clear boundary between rebuilding derived state and requesting new work. Verify a replay against a stable set of expected totals before relying on it for recovery. [Azure Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)

Snapshots reduce work only if they can be understood by the restoring code and reconciled against later events. Document their format, position and checks, and run a restore from a prior snapshot on a schedule appropriate to the service. Handle retained sensitive fields deliberately. An event store needs access control, a data retention policy and a way to fulfil obligations to customers. An audit table or ledger may meet a narrower history requirement with fewer moving parts when replay of the entire workflow has no product value.

## Verify delivery at the point where the event matters

The outbox row establishes that a state change produced a durable intent to publish. Record publish attempts, delivery age and the applied effect for critical consumers. Imagine 40,000 orders written during a worked example. The publisher reports 40,040 accepted deliveries due to repeated attempts, and the projection applies all 40,000 unique order IDs. The goal is satisfied for this dataset only if the relevant values also match, such as amount, currency and status. If three IDs are missing, identify whether the publisher skipped them or a later consumer failed. A dashboard showing only broker throughput cannot provide that evidence. [AWS transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

Scope ordering to the operation that depends on it. A projection may need one order’s updates to arrive in sequence, while separate orders have no shared invariant. Event IDs support replay and deduplication. Revisions or expected versions can also detect an unexpected sequence. Decide where to defer, rebuild or alert, and keep the record long enough for someone to resolve it. Exercise duplicate delivery after a consumer restart and confirm any deduplication record survives it.

At the design review, attach tests to the decisions about where each pattern is used. Include a plan to withdraw a candidate if its delivery lag, operational cost or failure modes exceed your tolerances. Publish the test inputs, result and limitations beside the architecture. An implementation choice should follow from the workflow’s needs and what the team has demonstrated it can operate.

For the first release, pick one representative workflow and record its behaviour in an agreed test ledger. Give support a lookup by order identifier, provide finance with a reconciliation view and ask each service owner to verify the transitions it owns. Repeat with the operator who would respond after hours. Review how often provisional states or manual repairs occur before expanding the workflow to independent services.
