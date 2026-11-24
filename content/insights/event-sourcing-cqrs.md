---
title: "Event Sourcing and CQRS: What the Pattern Actually Solves"
description: "Event sourcing and CQRS are powerful patterns that solve specific problems. They also introduce significant complexity. Understanding exactly what problem each one solves prevents applying them to problems they don't actually address."
date: 2027-04-12
tags: ["Architecture", "Data Engineering"]
format: article
---

Event sourcing and CQRS (Command Query Responsibility Segregation) are frequently mentioned together and often applied together. They are separate patterns that solve different problems and can be applied independently. Conflating them leads to applying both patterns to problems that only one — or neither — addresses.

## CQRS: the simpler pattern

CQRS separates the read model (queries) from the write model (commands). In a traditional CRUD system, the same data model handles both reading and writing. In a CQRS system, writes update one model; reads use a different, potentially denormalized model optimized for the specific query patterns needed.

**Why this helps**: relational write models normalized for consistency are often inefficient for reads. A complex dashboard query may benefit from a specialised read model, but join count alone does not establish poor performance; inspect the actual plan, indexes and workload. CQRS allows maintaining a separate read model (a materialized view, a separate cache, a search index) that is optimized for the queries that actually need to be answered.

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

*Complete audit history*: every change to every entity is recorded, with timestamp and context. Audit suitability still requires controls for identity, completeness, access, retention, integrity and applicable requirements; event sourcing alone is insufficient.

*Event replay*: if you need to rebuild a read model, add a new projection, or debug how an entity reached its current state, replay the event stream. A current-state-only record cannot reconstruct discarded history, although conventional systems can retain history through other mechanisms.

*Temporal queries*: "what was the state of this entity at 3pm last Thursday?" is answerable by replaying events up to that point.

*Integration via events*: downstream systems receive events directly rather than querying a database. This natural integration point enables the kinds of decoupled architectures that are difficult to retrofit onto state-centric systems.

**The significant costs**:

*Querying current state requires projection*: to answer "what is the current plan for user 1?", you must replay all events for user 1 (or maintain a projection that has done so). For every query. This requires either materialized projections (read-optimized views of current state) or a cache.

*Schema evolution is harder*: a changed event schema must still work with historical events. Historical events are normally treated as immutable within the design; correction and retention policies still need explicit handling; new events must be compatible with the projection logic that reads old ones.

*Operational complexity*: the event store is infrastructure. Snapshots (periodic state snapshots to avoid replaying 10 years of events) are infrastructure. Multiple read model projections are infrastructure.

*Eventually consistent read models*: if projections are updated asynchronously, a read immediately after a write may not see the new state. This surprises developers accustomed to synchronous consistency.

## When to use each

CQRS without event sourcing: when read and write patterns differ significantly and you want read-optimized projections, but you do not need the full event history or replay capability.

Event sourcing without CQRS: uncommon but possible — you want the audit history and replay capability but read and write models are similar enough to use the same model.

Both together: when you need audit history, replay capability, and significantly different read/write models. Financial systems, trading platforms, and systems with complex regulatory audit requirements are common candidates.

Neither: the default for most applications. Start with a simple, consistent model. Add CQRS or event sourcing when you have a specific, demonstrated need that these patterns address.

The architectural mistake is reaching for event sourcing because it is interesting or because a technical blog post made it sound like best practice. Applied without a specific problem to solve, it adds significant operational overhead for no benefit.

*Evaluating whether event sourcing or CQRS fits a specific system design? The answer depends heavily on the consistency requirements and query patterns. [Happy to think through the trade-offs.](/contact)*

## Separate the command decision from the historical fact

A command requests a change; an event records an accepted fact. “Reserve five units” can fail because stock is unavailable. “Five units reserved” should represent a transition that has already passed the relevant rule. Storing every attempted command as if it were a successful event produces an ambiguous history.

In a fictional stock aggregate, begin with 20 units, reserve 5, release 2, and reserve 4. Replaying those accepted events yields balances of 20, 15, 17, and 13 units. The chart shows that sequence. These are synthetic inventory quantities, not customer results. The projection applies the declared transitions in order; it does not query today's external stock service during historical replay.

That last constraint matters. If replay calls a current exchange-rate API, reads today's feature flag, or sends another notification, the result may differ or create unwanted side effects. Capture the inputs required to interpret the historical decision and separate state reconstruction from outward actions. A replay mode should not silently resend every historical email.

## Concurrency belongs in the append contract

Two writers can read the same aggregate version and both decide there is enough stock. The event store needs a concurrency rule, such as appending only when the expected stream version matches. One writer succeeds; the other reloads the updated history and reevaluates its command. Retrying the append blindly with a new version would bypass the business decision.

An event identifier helps distinguish a repeated command from a new one, but identity and expected version solve different problems. Document both. Include a test where the client loses the response after a successful append and retries the same command. The system should return or reconstruct the prior outcome under the declared idempotency contract.

## Snapshots are an optimisation with a validity rule

A snapshot can store aggregate state at a known stream position so reconstruction starts from that point. It is not a replacement for understanding the events that follow. Record the snapshot schema and the position it covers; reject an incompatible snapshot or rebuild it from the source history.

For a teaching exercise, create a snapshot after the release event in the stock example, at balance 17. Replay the final reservation of four and confirm the result is 13. Then deliberately associate the snapshot with the wrong stream position and show how double application or omission changes the answer. This exposes why snapshot metadata is part of correctness.

## Projection rebuilds need operational design

A new read model can be built alongside the existing one, consuming the same history into a separate destination. Track its checkpoint and lag, validate selected aggregates against known results, and switch readers only after the declared readiness criteria are met. Rebuilding in place can leave users with incomplete data or inconsistent query results.

Define what readers see immediately after a command. Options include returning the accepted state directly, waiting for a projection position, or showing a pending update. The correct policy depends on the user journey. A balance display or access-control decision may have different consistency requirements from a historical analytics chart.

Schema evolution must account for old events. A new reader might transform an older event representation into the form its logic expects, or handle versions explicitly. Test a corpus containing every retained version, including malformed or previously corrected records. Structural parsing is only the first check; semantic interpretation must still match the original fact.

## An event-store decision exercise

Choose one business aggregate and list the questions its history must answer. Determine whether a conventional transactional model plus an audit trail, change-data capture, or temporal tables could satisfy them with less operational complexity. Event sourcing is justified by a need for event-based reconstruction and domain history, not simply by the desire to keep logs.

Build a small in-memory reducer and fixture stream before selecting infrastructure. Test ordinary transitions, duplicate commands, concurrent expected-version conflicts, an invalid transition, snapshot reconstruction, and replay without external effects. Make each expected state explicit. This is a practical way to discover whether the domain events are sufficiently precise.

Finally, review retention and personal-data handling. An append-only design does not remove deletion, correction, access-control, or compliance obligations. Avoid placing unnecessary personal information in permanent event payloads, and design the applicable lifecycle with appropriate specialists. Event history can support an audit process, but no architecture pattern automatically satisfies a legal or regulatory requirement.

## Further reading and source boundaries

- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Martin Fowler: CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Chris Richardson: transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)
