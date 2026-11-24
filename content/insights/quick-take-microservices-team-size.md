---
title: "Microservices Scale With Teams, Monoliths Scale With Databases"
description: "The choice between monolith and microservices is primarily an organizational decision, not a technical one. Matching the architecture to the team structure is more important than matching it to the technical requirements."
date: 2028-06-14
tags: ["Architecture", "Engineering Leadership"]
format: article
---

Conway's Law states that organizations design systems that mirror their communication structures. In software architecture, this is not just an observation — it is a design principle.

Microservices work when each service is owned by a team that can develop, deploy, and operate it independently. Monoliths work when a single team can hold the whole system in their head and coordinate deployments without significant overhead.

## What this means in practice

A startup with 4 engineers may find a monolith a suitable starting point. The entire team can review the codebase, change anything quickly, and deploy the full system several times a day. The coordination overhead of microservices — separate repositories, separate CI pipelines, separate deployment cadences, service mesh configuration — is pure cost with no benefit.

A company with 50 engineers across 8 teams should examine whether its shared application creates meaningful ownership or release bottlenecks. Eight teams making changes to a shared codebase spend significant time on merge conflicts, build coordination, and release management. The cost of coordination dominates.

The transition point is when the coordination cost of a shared codebase exceeds the coordination cost of service boundaries.

## Scaling databases vs. scaling teams

Monoliths typically share a single database. At read-heavy scale, a single database can be scaled vertically (bigger instance) and horizontally (read replicas). This can serve substantial workloads when query patterns, write demands, and availability requirements permit it. The ceiling is real but high.

Microservices decouple databases — each service owns its data. This enables horizontal scaling at the service level and allows different storage technologies for different services. The cost is that cross-service data queries are now distributed transactions or eventual consistency problems.

The monolith's database bottleneck is real but appears later and has more solutions than the distributed transaction problem that microservices create prematurely.

## The sequence that works

Start with a monolith. Build with clean internal module boundaries. When specific components have genuinely different scaling requirements or when team ownership friction becomes the dominant bottleneck, extract services. Each extraction is motivated by a specific, real need.

This is not the exciting answer. The exciting answer is "design for scale from day one." The practical answer is "design for the team and scale you actually have, and evolve deliberately."

Workload and ownership evidence should determine when extraction earns its cost; neither future headroom nor migration runway can be assumed.

## Measure coupling rather than counting engineers

Headcount does not specify a correct deployment topology. Four engineers might operate a small, well-supported service estate, while fifty engineers might work effectively on modules inside one application. Data rules, release tooling, security boundaries, and the support platform all affect the result. Team size is a prompt to investigate coordination, not an architectural threshold.

Use change evidence to make the argument concrete. In a hypothetical month, a team delivers 20 changes. Six require another team's approval because a shared database contract changes; fourteen remain within one ownership boundary. The cross-team fraction is 6 divided by 20, or 30%. Splitting deployment pipelines does not remove those six dependencies if the database contract stays shared. A separate service might even make the same dependency harder to observe.

For each cross-team change, record why coordination was needed. Distinguish a genuine shared business rule from accidental access to another module's tables, and both from a slow approval process. The interventions differ. An explicit module API can address accidental coupling. A shared invariant may need a deliberate transaction boundary. Faster review can address waiting without any infrastructure migration.

## Test independent change as a property

Choose one proposed service boundary and attempt a backward-compatible change through it. Can the owner deploy the provider while the consumer remains on its current version? Can it revert safely? What happens to data written under the new version? Include a consumer that misses the upgrade window and a queued message produced by the old implementation.

If the exercise requires every team to release together, the services are operationally distributed but release-coupled. Document whether that is temporary migration work or an accepted characteristic. Do not sell independent deployment until the compatibility mechanism exists.

Finally, include the human cost of operating the boundary. Name primary and backup support owners and rehearse a dependency failure. The right design meets its data, isolation, and delivery obligations with a support model the organisation can sustain. Engineer count alone cannot establish that conclusion. Include the support platform in the assessment: a managed deployment path can remove work that would otherwise be repeated for every service, while an unsupported runtime can add it back.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
