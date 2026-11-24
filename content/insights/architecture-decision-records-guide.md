---
title: "Architecture Decision Records: Why and How to Use Them Effectively"
description: "ADRs capture the why behind architectural decisions — not just what was decided, but the context, the options considered, and the trade-offs accepted. Here's how to write them well and integrate them into your team's workflow."
date: 2029-03-07
tags: ["Engineering Leadership", "Architecture", "Programming"]
format: article
---

A year after a decision is made, most teams can reconstruct what was decided. Few can reconstruct why. Why did we choose PostgreSQL over MongoDB for this service? Why is authentication handled at the gateway rather than in each service? Why did we adopt this particular pattern for event publishing?

Without a record, that context lives in the heads of the engineers who made the decision — and when they move on, it's gone. New engineers make changes that violate implicit assumptions. Old decisions get relitigated from scratch. The same trade-offs get evaluated again without the context of why they were resolved the way they were.

Architecture Decision Records (ADRs) are a lightweight way to preserve this context.

## What an ADR is — and isn't

An ADR is a short document recording a significant architectural decision: the context that drove it, the options that were considered, the decision that was made, and the consequences (both positive and negative).

An ADR is **not** a design document. Design documents describe how something works. ADRs explain why it was decided to build it that way.

An ADR is **not** a comprehensive requirements specification. It's a focused record of one decision, typically 200-500 words.

An ADR is **not** meant to be exhaustive. Not every decision warrants an ADR — only decisions that are significant, non-obvious, have trade-offs worth recording, or are likely to be questioned later.

## The ADR format

The most widely used format comes from Michael Nygard's 2011 blog post. The fields:

**Title**: brief and descriptive; an imperative is one option ("Use PostgreSQL for the orders service", not "PostgreSQL Decision")

**Status**: Proposed → Accepted → Deprecated → Superseded. A superseded ADR links to the one that replaced it.

**Context**: the situation that made a decision necessary. What forces were at play? What constraints existed? What was the problem?

**Decision**: the decision made. Stated clearly and in active voice.

**Consequences**: what becomes easier and what becomes harder as a result of this decision. Don't just list the benefits — record the trade-offs honestly. An ADR that only has positive consequences is suspicious.

A worked example:

```markdown
# ADR-012: Use the outbox pattern for reliable event publishing

## Status
Accepted

## Context
Our order service needs to publish events to Kafka when order state changes.
The naive implementation — update the database, then publish to Kafka — has a 
failure window: if the process crashes after the database commit and before the 
Kafka publish, the event is lost. In this hypothetical example, this can cause inconsistent state 
between the orders service and the inventory service.

## Decision
We will implement the outbox pattern: outgoing events are written to an `outbox` 
table in the same database transaction as the business data change. A separate 
relay process reads from the outbox and publishes to Kafka, marking messages as 
processed after confirmation.

## Consequences
- Committed events remain available for relay retries, subject to storage durability and operational recovery
- Relay adds operational complexity: another process to monitor and maintain
- Per-aggregate ordering requires an explicit sequencing and relay design
- Consumers must handle duplicate events (idempotency required)
- The `outbox` table grows indefinitely without periodic cleanup
```

## Where to store ADRs

Store ADRs in the same version control repository as the code they describe. This keeps the decision history alongside the code it governs and makes ADRs a natural part of code review.

The convention: a `docs/decisions/` or `architecture/adr/` directory, with files named `ADR-NNN-title-in-kebab-case.md`. Numbers are monotonically increasing and never reused — even for superseded decisions.

The index: a `README.md` in the decisions directory that lists all ADRs with their status and a one-line summary. This is how new team members find relevant context.

## When to write one

Triggers that suggest an ADR is warranted:
- A decision that took more than a day of discussion before reaching consensus
- A decision where multiple reasonable options existed and the choice was non-obvious
- A decision that contradicts a common convention or industry default (and the reason matters)
- A decision that will be hard to reverse
- A decision that will affect how other teams work or what choices are available to them
- Anything where you expect the question "why did we do it this way?" to come up in the future

Triggers that suggest you don't need an ADR:
- Following a well-established convention without deviation
- A tactical implementation choice with obvious alternatives
- A decision that's easy to change if it turns out to be wrong

## Integrating ADRs into team workflow

ADRs are most valuable when they're a natural part of how architectural decisions get made, not a documentation tax applied afterward.

The workflow that works:
1. Before a significant architectural decision, create a draft ADR in "Proposed" status
2. Review the ADR in a design review or pull request — this is where the discussion happens
3. After the agreed decision and required approvals, update the status to "Accepted" and merge
4. When a decision is revisited and changed, write a new ADR and update the old one to "Superseded"

The review-via-PR approach has a practical benefit: GitHub's PR comment threads are an excellent place for architectural discussion, and the final merged ADR contains the decision with all context, while the PR discussion contains the full debate. Both are preserved.

*Building documentation practices for an engineering team or trying to capture institutional knowledge? [Happy to compare approaches.](/contact)*

## Make the decision boundary explicit

An architecture decision record works best when it answers one consequential question. “Modernize the platform” is too broad. “Use a transactional outbox to connect order commits with event publication” is narrow enough to describe constraints and alternatives. If several decisions depend on each other, link separate records rather than compressing every tradeoff into one large document.

State who can accept the decision and which reviews are required. Consensus can be useful, but it is not the only governance model. A named owner may decide after collecting input, while a security-sensitive change may require a specific approval. The record should reflect the actual process so a future reader can understand whether it is a proposal, an accepted choice, or an obsolete instruction.

Separate acceptance from implementation. An accepted ADR describes what the organization intends to do; it does not prove the system already behaves that way. Link implementation work and verification evidence. If the implementation differs materially, update the decision history with an explanation rather than allowing the record and the running system to diverge silently.

## Worked example: record an outbox decision honestly

Consider a hypothetical order service that must save an order and publish an event. Writing the event into an outbox in the same database transaction as the order avoids the local failure window between those two writes. A separate relay publishes committed events. This does not eliminate every failure: the relay can publish an event and crash before recording its progress, causing a duplicate after restart.

Suppose the synthetic scenario contains one hundred committed orders and the relay republishes three events after such a crash. The broker receives 103 deliveries representing 100 distinct event identifiers. A correctly implemented consumer deduplicates the three repeats and applies 100 business effects. The arithmetic illustrates delivery attempts versus distinct effects; it does not claim that exactly-once behavior follows automatically from the outbox pattern.

The conceptual figure shows commit, relay, broker, and idempotent consumer as separate responsibilities. The method is a design explanation, not measured data. Delivery depends on durable storage, a functioning relay, suitable retries, and operational recovery. Ordering also requires explicit design, such as an aggregate sequence and compatible relay and partitioning behavior. It is not guaranteed merely because rows were inserted in a particular order.

## Capture alternatives and their failure modes

A direct database write followed by a broker publish is simple but has a crash window between operations. Publishing first has the opposite problem: an event may exist for a database change that later fails. A distributed transaction may be possible in some environments but introduces support, availability, and operational considerations. Describe why the chosen option fits the actual constraints rather than declaring all alternatives universally wrong.

Record what the decision does not solve. The outbox does not define the event schema, consumer authorization, retention policy, or business compensation behavior. Those may need separate decisions. A reader should be able to see which guarantee belongs to which mechanism. This prevents an attractive architectural pattern from becoming a blanket promise of reliability.

Consequences should include ongoing work. The relay needs monitoring, backlog limits, recovery procedures, and cleanup rules. Consumers need a deduplication strategy whose scope and retention match the retry model. Data deletion or privacy requirements may affect retained events. Naming these obligations makes the decision useful to operators as well as designers.

## A review worksheet for an ADR

Ask whether the context includes the constraints that actually drove the choice. Check that each important claim has evidence or is marked as an assumption. Verify that the alternatives are plausible and described fairly. Identify the condition under which another option would become preferable. A decision made for a small workload may deserve review if scale or regulatory requirements change.

Then examine the verification plan. For the outbox example, test a crash after database commit but before publication, a crash after publication but before progress recording, and a consumer restart during processing. Use a disposable environment and synthetic records. Check both missing effects and duplicate effects. A happy-path integration test alone does not examine the failure window that motivated the design.

Keep the record short enough to review, while linking detailed experiments and specifications. A target word count is a convenience, not a rule that should remove a critical constraint. The ADR should let a future engineer reconstruct the decision without searching through every discussion thread, but it does not need to duplicate the entire implementation guide.

## Preserve history when the context changes

When a decision is superseded, link the old and new records in both directions and explain what changed. Preserve the original reasoning as historical context. Minor corrections can be made with a visible version history; a reversal of the architectural choice deserves a new record. Do not leave two accepted records giving contradictory instructions without clarifying their scopes.

Maintain an index organized by system or decision area as well as by number. Sequential identifiers help reference records, but a newcomer usually searches by a problem such as identity, storage, or deployment. Link ADRs from the code and operational documentation where the rationale matters. A well-written record that nobody can find provides little practical protection against rediscovery.

The takeaway is to preserve reasoning and its limits. An ADR is valuable when it explains why a choice was sensible under stated conditions, what obligations it created, and what evidence could justify changing it. That makes architecture easier to evolve without treating past decisions as either unquestionable law or inexplicable mistakes.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Michael Nygard · Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Chris Richardson · Transactional outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html)
