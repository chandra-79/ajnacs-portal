---
title: "Architecture Decision Records: Why They Fail and How to Make Them Work"
description: "ADRs are one of the highest-value low-cost engineering practices. Most teams either do not write them or write them in a way that makes them useless. Here is the difference."
date: 2025-11-18
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The Architecture Decision Record (ADR) concept is simple: when you make a significant architectural decision, write a short document that records what was decided, why, and what alternatives were considered. Future engineers can then understand not just what the system does but why it was built that way.

The concept is simple. The execution is where teams fail.

## Why ADRs fail in practice

**They are written after consensus, not before.** An ADR written after a decision is already made is documentation, not a decision record. The value of an ADR is capturing the reasoning at the moment of decision — the options that were seriously considered, the constraints that shaped the choice, the trade-offs that were explicitly accepted. Writing it retroactively produces a document that justifies the decision rather than explains it.

**They are never read.** A collection of ADRs that nobody consults when making related decisions is a filing cabinet. The practice only produces value when engineers check the record before making decisions in areas that have existing ADRs. This requires that ADRs are discoverable — linked from the codebase, indexed in the internal wiki, referenced in onboarding documentation.

**They are written at the wrong granularity.** "We will use React" does not need an ADR — it is a standard choice at this point. "We will use React with server components but not Next.js because of our existing Express infrastructure and the cost of the migration" is a decision worth recording. The test: would a senior engineer joining the team want to understand why this specific choice was made? If yes, write the ADR.

**They describe what, not why.** An ADR that says "we chose PostgreSQL for the user database" provides no value. An ADR that says "we chose PostgreSQL over MongoDB because our data model has strong relational consistency requirements, the team has existing PostgreSQL expertise, and the write volume is below the threshold where Mongo's horizontal scaling would matter" is useful.

## A minimal format that works

- **Context**: what problem were we solving, what constraints applied
- **Decision**: what we decided, in one clear sentence
- **Alternatives considered**: what else was evaluated and why it was not chosen
- **Consequences**: what this decision implies for future work — what it makes easier, what it makes harder

Four sections. One page or less. Written before consensus is finalized so the discussion is still fresh. Committed to version control alongside the code.

The ADR you write today will be read by an engineer who joins in two years and spends three hours trying to understand why the system works the way it does. Two years from now, you will not remember either.
