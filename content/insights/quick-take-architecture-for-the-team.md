---
title: "The Right Architecture Is the One Your Team Can Actually Run"
description: "System design textbooks describe ideal architectures. Production systems run on architectures the team can operate, debug, and evolve. The gap between these two things is where most architectural failures live."
date: 2025-12-22
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

The architecture that is 20% less theoretically optimal but is understood by the whole team will outperform the optimal architecture that only two people can operate. In practice, by a lot.

Design for the team you have, not the team you aspire to have.
