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

**Transactional consistency.** Operations that span multiple domain objects can be wrapped in a database transaction. In a microservices architecture, the equivalent operation requires distributed transactions or eventual consistency, both of which add failure and recovery cases that need explicit design.

**Simple deployment.** One artifact to build, test, and deploy. The deployment topology is simple. Application rollbacks can be straightforward, although incompatible schema and data changes still require a recovery plan. The operational surface area is small.

**Easy debugging.** A request that fails produces a stack trace through a single process. Distributed tracing across five services is more powerful for the right problems and more complex for every problem.

**Low operational overhead.** One service to monitor, one infrastructure to maintain, one deployment pipeline to care for. The overhead depends on dependencies and operational requirements; one deployable can still be complex.

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

## Separate symptoms before choosing an intervention

A monolith is a deployment arrangement; it does not tell you whether modules are well separated, data is shared carelessly, or releases are safe. A service estate can be tightly coupled too. Start by observing where work waits. If ten teams edit the same configuration file, extracting unrelated services will not necessarily remove that dependency. If a slow report consumes the checkout database's connection budget, a separate application process will not isolate the shared database automatically.

For a hypothetical service, ten weekly releases require eight minutes of human checking each. Improving the release script reduces that to three minutes. The active effort changes from 80 to 30 minutes, saving 50 minutes per week. If the script takes ten hours to build and maintain initially, simple payback is 600 divided by 50, or 12 weeks, before ongoing upkeep. This calculation evaluates a release improvement, not the return on the entire architecture.

Compare an extraction proposal against that baseline. List migration effort, temporary duplicate operation, new alerts, data ownership, and the reversal plan. Include the benefit that motivates extraction: perhaps a worker's capacity can grow independently or a failure must be contained outside the user-facing process. A lower deployment count is not a reason to accept a security boundary that cannot be enforced.

## A four-week investigation

In week one, sample changes that were slow or risky and identify the actual dependency responsible. In week two, place an interface around one problematic area and add a test that forbids bypassing it. In week three, improve the release or query causing the largest measured delay. In week four, compare the same measures and decide whether a process boundary still addresses an unmet need. These are suggested work stages, not promised delivery dates.

Keep a record of counterexamples. If independent release scheduling remains impossible after module ownership is clarified, say so. If a shared database makes isolation ineffective, evaluate a data-boundary change explicitly. The decision should survive evidence that contradicts the team's preferred architectural style. Keep the baseline alongside the result so the next review can challenge the interpretation instead of reconstructing the original measurement.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
