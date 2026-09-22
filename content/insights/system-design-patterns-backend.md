---
title: "System Design Patterns Every Backend Engineer Should Know"
description: "CQRS, event sourcing, saga pattern, outbox pattern — the patterns that solve specific distributed systems problems, what trade-offs they introduce, and when the simpler option is actually the right one."
date: 2026-10-28
tags: ["Programming", "Architecture", "Cloud Architecture"]
format: article
---

System design patterns are solutions to recurring problems in distributed systems. The trap is learning them as a catalogue and applying them because they exist rather than because they solve a specific problem. Some of the most over-engineered systems I've seen are over-engineered with legitimate patterns applied in contexts where simpler options would have worked.

The patterns worth knowing deeply are the ones that solve problems you will actually encounter — data consistency across services, handling high write loads, maintaining audit history, coordinating distributed transactions. Here's how I think about the ones that come up most often.

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

This guarantees at-least-once delivery — the event will eventually be published. Consumers need to be idempotent (handling the same event twice is harmless) which is good practice regardless.

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

*Working through a distributed systems design challenge? [Always happy to think through trade-offs.](/contact)*
