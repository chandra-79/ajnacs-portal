---
title: "Event Sourcing and CQRS: What the Pattern Actually Solves"
description: "Event sourcing and CQRS are powerful patterns that solve specific problems. They also introduce significant complexity. Understanding exactly what problem each one solves prevents applying them to problems they don't actually address."
date: 2025-12-22
tags: ["Architecture", "Data Engineering"]
format: article
---

Event sourcing and CQRS (Command Query Responsibility Segregation) are frequently mentioned together and often applied together. They are separate patterns that solve different problems and can be applied independently. Conflating them leads to applying both patterns to problems that only one — or neither — addresses.

## CQRS: the simpler pattern

CQRS separates the read model (queries) from the write model (commands). In a traditional CRUD system, the same data model handles both reading and writing. In a CQRS system, writes update one model; reads use a different, potentially denormalized model optimized for the specific query patterns needed.

**Why this helps**: relational write models normalized for consistency are often inefficient for reads. A complex query joining eight tables to produce a dashboard view is slow because the model was designed for write integrity, not read performance. CQRS allows maintaining a separate read model (a materialized view, a separate cache, a search index) that is optimized for the queries that actually need to be answered.

**The operational cost**: when the write model is updated, the read model must also be updated (synchronously or asynchronously). This is additional complexity. For systems where read and write patterns are similar and performance requirements are modest, CQRS adds complexity without sufficient benefit.

CQRS is worth it when: read patterns are very different from write patterns, read and write loads differ significantly, or different latency/consistency requirements apply to reads vs. writes.

## Event sourcing: a different pattern

Event sourcing stores the history of state changes as an immutable log of events, rather than storing current state directly. The current state is computed by replaying the event log.

```
Traditional: users table → {id: 1, email: "a@b.com", plan: "enterprise"}

Event sourced:
  events → UserRegistered(id: 1, email: "a@b.com")
         → UserUpgraded(id: 1, plan: "enterprise")
  current state = replay of all events for user 1
```

**What this genuinely provides**:

*Complete audit history*: every change to every entity is recorded, with timestamp and context. Regulatory requirements for audit trails are satisfied without additional logging infrastructure.

*Event replay*: if you need to rebuild a read model, add a new projection, or debug how an entity reached its current state, replay the event stream. This is impossible with state-only storage.

*Temporal queries*: "what was the state of this entity at 3pm last Thursday?" is answerable by replaying events up to that point.

*Integration via events*: downstream systems receive events directly rather than querying a database. This natural integration point enables the kinds of decoupled architectures that are difficult to retrofit onto state-centric systems.

**The significant costs**:

*Querying current state requires projection*: to answer "what is the current plan for user 1?", you must replay all events for user 1 (or maintain a projection that has done so). For every query. This requires either materialized projections (read-optimized views of current state) or a cache.

*Schema evolution is harder*: a changed event schema must still work with historical events. Events already in the log cannot be changed; new events must be compatible with the projection logic that reads old ones.

*Operational complexity*: the event store is infrastructure. Snapshots (periodic state snapshots to avoid replaying 10 years of events) are infrastructure. Multiple read model projections are infrastructure.

*Eventually consistent read models*: if projections are updated asynchronously, a read immediately after a write may not see the new state. This surprises developers accustomed to synchronous consistency.

## When to use each

CQRS without event sourcing: when read and write patterns differ significantly and you want read-optimized projections, but you do not need the full event history or replay capability.

Event sourcing without CQRS: uncommon but possible — you want the audit history and replay capability but read and write models are similar enough to use the same model.

Both together: when you need audit history, replay capability, and significantly different read/write models. Financial systems, trading platforms, and systems with complex regulatory audit requirements are common candidates.

Neither: the default for most applications. Start with a simple, consistent model. Add CQRS or event sourcing when you have a specific, demonstrated need that these patterns address.

The architectural mistake is reaching for event sourcing because it is interesting or because a technical blog post made it sound like best practice. Applied without a specific problem to solve, it adds significant operational overhead for no benefit.

*Evaluating whether event sourcing or CQRS fits a specific system design? The answer depends heavily on the consistency requirements and query patterns. [Happy to think through the trade-offs.](/contact)*
