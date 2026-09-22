---
title: "Your Monolith Running Fine in Production Is Not a Problem"
description: "The urge to decompose a working monolith into microservices is strong, culturally driven, and often misguided. A monolith that serves the business well is an asset, not a liability."
date: 2028-06-12
tags: ["Architecture", "Engineering Leadership"]
format: article
---

The monolith has run in production for four years. It deploys once a day, handles the current load fine, and the team knows it well. The CTO has been reading about microservices and wants to know why they have not decomposed yet.

The answer — "because there is no reason to" — is correct but not always accepted.

## What the monolith is actually doing well

A well-maintained monolith has properties that are genuinely valuable and genuinely hard to replicate in a distributed architecture:

**Transactional consistency.** Operations that span multiple domain objects can be wrapped in a database transaction. In a microservices architecture, the equivalent operation requires distributed transactions or eventual consistency, both of which are significantly more complex and less reliable.

**Simple deployment.** One artifact to build, test, and deploy. The deployment topology is simple. Rollbacks are simple. The operational surface area is small.

**Easy debugging.** A request that fails produces a stack trace through a single process. Distributed tracing across five services is more powerful for the right problems and more complex for every problem.

**Low operational overhead.** One service to monitor, one infrastructure to maintain, one deployment pipeline to care for. The overhead scales linearly with complexity, and the complexity is low.

These are not consolation prizes. They are genuine engineering advantages that microservices trade for other advantages (independent scaling, team autonomy, independent deployment).

## When the trade is worth making

The trade is worth making when the advantages of microservices are genuinely required by the situation:

- Teams are large enough that coordination around a shared codebase is the dominant bottleneck
- Services have genuinely different scaling profiles that a monolith cannot accommodate
- Different parts of the system need to be released independently, on different schedules, by different teams

If these conditions are not present, the microservices architecture is paying the complexity cost without receiving the benefits.

## The productive question

Rather than "should we move to microservices?", ask "what is the problem we are trying to solve, and is microservices the best solution to that specific problem?"

If the problem is deploy frequency (can solve with CI/CD improvements), or operational visibility (can solve with observability tooling), or team coordination (can solve with module boundaries and team structure) — there are solutions that do not require re-architecting the whole system.

Solve the problem. Do not change the architecture to match the trend.
