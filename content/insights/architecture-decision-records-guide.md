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

**Title**: brief, using imperative ("Use PostgreSQL for the orders service", not "PostgreSQL Decision")

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
Kafka publish, the event is lost. We've seen this cause inconsistent state 
between the orders service and the inventory service.

## Decision
We will implement the outbox pattern: outgoing events are written to an `outbox` 
table in the same database transaction as the business data change. A separate 
relay process reads from the outbox and publishes to Kafka, marking messages as 
processed after confirmation.

## Consequences
- Events are guaranteed to be published at least once (no silent data loss)
- Relay adds operational complexity: another process to monitor and maintain
- Message ordering is preserved per-aggregate (events for order-123 are published 
  in the order they were written)
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
3. After consensus, update the status to "Accepted" and merge
4. When a decision is revisited and changed, write a new ADR and update the old one to "Superseded"

The review-via-PR approach has a practical benefit: GitHub's PR comment threads are an excellent place for architectural discussion, and the final merged ADR contains the decision with all context, while the PR discussion contains the full debate. Both are preserved.

*Building documentation practices for an engineering team or trying to capture institutional knowledge? [Happy to compare approaches.](/contact)*
