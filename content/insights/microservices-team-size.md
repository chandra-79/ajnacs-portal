---
title: "Microservices scale with teams. Monoliths scale with databases. Know which problem you have."
description: "The microservices debate has produced more opinion than clarity, largely because the participants are arguing from different team sizes and different ownership models without…"
date: 2028-12-27
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

The microservices debate has produced more opinion than clarity, largely because the participants are arguing from different team sizes and different ownership models without acknowledging the difference.

Microservices are a solution to a specific class of problem: the coordination cost of multiple teams working in a shared codebase. When ten teams deploy to the same application, every release is a negotiation about what is included, who has tested what, and whose changes get held back because another team's changes aren't ready. Service boundaries replace code boundaries with team boundaries, giving each team an autonomous deployment unit they control.

This is a team scaling benefit. It has a real technical cost: distributed systems introduce network latency, partial failure modes, data consistency challenges, and debugging complexity that monoliths avoid. A distributed system that does not need to be distributed pays that cost for no benefit.

The technical case for microservices — performance at scale — is real but narrower than the adoption suggests. Most applications are not at a scale where monolithic deployment creates a technical ceiling. The teams that adopted microservices for technical reasons at sub-large scale often discover that the operational overhead exceeds the technical benefit. The teams that adopted them for team autonomy reasons at appropriate scale find that the operational overhead is a fair price for independent deployment capability.

The starting question: how many teams will own this system, and do those teams need independent deployment cadences? If the answer is one team with one cadence, the architectural pattern that is fastest to build and easiest to operate is the right answer, regardless of its label.

## Use release independence as a testable requirement

A separate repository or deployment pipeline does not guarantee that a team can change a service independently. Shared data, incompatible schemas, and synchronous dependency chains can still force a coordinated release. Conversely, several teams can work on a single deployment if module boundaries, feature controls, and release automation make coordination manageable.

Take a fictional six-service estate. Four services can deploy a backward-compatible change while their consumers remain on the previous release; two require every consumer to move together. The chart records four independently tested paths and two coordinated paths. It measures this rehearsal only. It does not prove that the architecture is better than a monolith.

For the two coupled paths, identify the exact dependency. A renamed response field may need a compatibility period. A shared table migration may need a change in ownership. A business invariant spanning services may justify a different boundary. “Team autonomy” is too vague to choose among those interventions.

Repeat the exercise with a rollback. Ask whether the previous service version can read data written by the new version and whether older queued events remain processable. A one-way deployment that succeeds once is weaker evidence than a supported upgrade and recovery path.

The architecture decision should explain the property gained, its operating cost, and the people responsible for it. Headcount and database size are useful context, but neither is a universal rule for selecting services or a monolith in production.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
