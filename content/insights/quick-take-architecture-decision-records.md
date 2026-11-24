---
title: "Architecture Decision Records: Why They Fail and How to Make Them Work"
description: "ADRs are one of the highest-value low-cost engineering practices. Most teams either do not write them or write them in a way that makes them useless. Here is the difference."
date: 2028-11-13
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The Architecture Decision Record (ADR) concept is simple: when you make a significant architectural decision, write a short document that records what was decided, why, and what alternatives were considered. Future engineers can then understand not just what the system does but why it was built that way.

The concept is simple. The execution is where teams fail.

## Why ADRs fail in practice

**They are written after consensus, not before.** An ADR written after a decision is made can still be useful, but it should identify any reconstructed or missing reasoning. The value of an ADR is capturing the reasoning at the moment of decision — the options that were seriously considered, the constraints that shaped the choice, the trade-offs that were explicitly accepted. Writing it retroactively produces a document that justifies the decision rather than explains it.

**They are never read.** A collection of ADRs that nobody consults when making related decisions is a filing cabinet. The practice only produces value when engineers check the record before making decisions in areas that have existing ADRs. This requires that ADRs are discoverable — linked from the codebase, indexed in the internal wiki, referenced in onboarding documentation.

**They are written at the wrong granularity.** A familiar choice such as React may still deserve an ADR if it creates significant constraints. "We will use React with server components but not Next.js because of our existing Express infrastructure and the cost of the migration" is a decision worth recording. The test: would a senior engineer joining the team want to understand why this specific choice was made? If yes, write the ADR.

**They describe what, not why.** An ADR that says "we chose PostgreSQL for the user database" provides no value. An ADR that says "we chose PostgreSQL over MongoDB because our data model has strong relational consistency requirements, the team has existing PostgreSQL expertise, and the write volume is below the threshold where Mongo's horizontal scaling would matter" is useful.

## A minimal format that works

- **Context**: what problem were we solving, what constraints applied
- **Decision**: what we decided, in one clear sentence
- **Alternatives considered**: what else was evaluated and why it was not chosen
- **Consequences**: what this decision implies for future work — what it makes easier, what it makes harder

Four sections. One page or less. Written before consensus is finalized so the discussion is still fresh. Committed to version control alongside the code.

Write for an engineer who arrives later and needs to understand which constraints still apply, rather than assuming the original decision-makers will be available.

## Write the record around a reversible question

An ADR can document an earlier decision honestly, provided it distinguishes contemporary evidence from later reconstruction. The important failure is inventing certainty about what people considered. If the original rationale is missing, say which facts are known and which assumptions were inferred. That is more useful than presenting a retrospective justification as a complete historical record.

The significance of a decision also depends on context. Choosing React may deserve a record if it changes hiring, accessibility work, support obligations, or compatibility with an existing application. A familiar technology does not make a consequential commitment trivial. Keep the record proportional to the consequences rather than using the tool's popularity as the test.

Consider a fictional order service choosing between synchronous validation and a queued approval workflow. In the sample workload, 900 of 1,000 requests finish validation within the interactive time budget; 100 need a human check. An ADR might choose a synchronous response for the first group and an explicit pending state for the second. The chart describes those assumed cases. It does not prove that queues reduce latency or that 90% is an acceptable success target.

## Capture the condition that changes the decision

Record the invariant first: an order cannot be marked approved until all required checks pass. Then explain which status the user sees while approval is pending, how duplicate requests are recognised, and which component owns the transition. The alternatives section should show why a single blocking request was rejected for work that may need human intervention. The consequences section should acknowledge that consumers now need to handle pending and rejected states.

Add a revisit condition. For example, review the design if a new downstream rule requires a decision before reserving inventory, or if consumers cannot safely represent a pending order. These conditions are more helpful than a vague promise to revisit every six months. A calendar reminder can organise review, but it does not identify what would make the decision wrong.

## Test whether a new engineer can use it

Give someone the ADR and a proposed change: a second approval source can finish after the first one rejects. Ask them to identify the state-transition rule and the relevant tests without asking the original author. If they cannot, improve the links or the explanation. Do not score the engineer; evaluate the document.

Keep accepted and superseded records distinguishable. Link a replacement decision back to the old one, preserve the historical reasoning, and update the service entry point so readers find the current rule first. An ADR earns its maintenance cost when it helps a later decision avoid repeating an investigation or violating an important invariant.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
