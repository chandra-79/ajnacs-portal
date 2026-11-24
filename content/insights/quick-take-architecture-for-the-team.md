---
title: "The Right Architecture Is the One Your Team Can Actually Run"
description: "System design textbooks describe ideal architectures. Production systems run on architectures the team can operate, debug, and evolve. The gap between these two things is where most architectural failures live."
date: 2027-12-13
tags: ["Architecture", "Engineering Leadership"]
format: article
---

Architectural decisions are often made by evaluating the problem. The team looks at the requirements — scale, latency, consistency, data model — and designs a system that meets them elegantly.

Then the system goes to production and the real evaluator shows up: the team that has to operate it at 2am when it breaks.

## Architecture is a people problem first

A microservices architecture is technically superior to a monolith for certain problems. Distributed event sourcing handles certain data access patterns better than relational models. CQRS separates read and write concerns in ways that scale better under specific load profiles.

All of that is true and mostly irrelevant if your team has three engineers who have never operated a message broker, two of whom have been on the team for less than a year.

The system that gets built by a team of three in six months, that the team fully understands, that can be debugged with standard tooling, and that has clear ownership boundaries is not a compromise architecture. It is the correct architecture for that team at that scale. The textbook-ideal system that nobody fully understands, that requires specialist knowledge to debug, and that has unclear ownership of each service is an architectural risk, not an architectural achievement.

## The operational question

Before committing to a design, ask: when this system breaks in production at 3am — and it will — what does the on-call engineer need to know and do to restore service?

Walk through the failure scenarios:

- Can the on-call engineer identify the failing component from the available observability without understanding the entire system?
- Can they roll back or redeploy without deep knowledge of the deployment pipeline?
- Are the failure modes documented?
- Is there anyone on the team who genuinely cannot debug a problem in this system, and is that acceptable?

If the honest answers to these questions reveal a system that only two people can actually operate, the architecture needs to be simpler regardless of its theoretical properties.

## Complexity has a carrying cost

Every layer of complexity in a system needs to be maintained, understood by each new team member, and operated through every incident. The carrying cost of complexity is paid continuously, not just at design time.

A design that the support team can operate safely may be preferable to a more efficient design whose recovery depends on unavailable expertise. Quantify the workload and support trade-offs rather than assigning an unsupported performance percentage.

Design for the team you have, not the team you aspire to have.

## Translate familiarity into an observable capability

Operational familiarity is more specific than “the team knows the stack.” Someone must be able to identify a failure, preserve data, restore a safe service state, and explain when to escalate. A familiar technology can still be badly configured, while a new managed component may reduce the work the team owns. Assess tasks and dependencies rather than confidence alone.

For a hypothetical design review, define five recovery tasks: find a failed dependency, rotate a test credential, restore a database copy, roll back an application version, and replay one interrupted job safely. Four engineers rehearse them in a disposable environment. Three complete the restore task independently; one needs help. The chart counts that specific observation. It is not an employee performance rating or proof that production recovery will succeed under pressure.

The gap can be closed in several ways. Improve the runbook, simplify the deployment, provide a safer tool, or arrange specialist cover. Architecture is one possible intervention, not the only one. If every recovery action requires a person who is routinely unavailable, however, the support model needs work before the risk can be considered accepted.

## Include resource and data obligations

Suppose the application must preserve an acknowledged order after any single worker failure. Choosing a simple synchronous implementation does not satisfy that requirement by itself. The design still needs a durable state transition and a recovery route. The team should be able to point to the exact acknowledgement boundary and demonstrate the outcome after killing the worker on either side of it.

Similarly, an architecture described as easy to debug may still violate tenant isolation if a shared query lacks an appropriate authorisation check. Ease of operation and technical correctness must be evaluated together. Neither becomes irrelevant because the team is small.

## Make learning part of the rollout

Identify one capability the design requires that the team does not yet possess. Build a bounded rehearsal before placing that capability on the critical path. For a message broker, this might include a duplicate message, a poison message, and a consumer restart during processing. Record how the service detects each condition and what the operator can safely do.

Use the rehearsal to decide whether additional automation, managed infrastructure, or a simpler boundary is justified. Repeat it after a major operational change rather than assuming training is permanent. The result should be a design decision with named support obligations, not a claim that one topology is inherently understandable to every engineer.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
