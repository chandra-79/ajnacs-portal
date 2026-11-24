---
title: "The right architecture for your system is the right architecture for your team, not for the problem."
description: "Architecture decisions are regularly made by examining the technical requirements of the system: expected throughput, latency targets, consistency requirements, failure tolerance…"
date: 2028-12-04
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

Architecture decisions are regularly made by examining the technical requirements of the system: expected throughput, latency targets, consistency requirements, failure tolerance, scaling dimensions. These are necessary inputs. They are not sufficient ones.

A microservices architecture deployed by a team of four engineers can create an operational surface that exceeds its available support capacity. Four engineers own twelve services, each with its own deployment pipeline, its own failure modes, its own monitoring configuration. The on-call engineer for a Saturday night incident is diagnosing a failure that spans multiple services, each of which requires different debugging context. The architecture is technically capable of handling the load. The team is not capable of operating it.

The inverse is also true. A monolithic architecture owned by eight domain teams can create coordination problems when ownership and release boundaries are unclear. Every deployment is a negotiation. Every shared data model change requires alignment across teams with different priorities. The architecture is operationally simple. The ownership model is a bottleneck.

Conway's Law operates whether or not it is acknowledged in the architecture decision. Systems designed without reference to team structure will drift toward the team structure over time, often through accreted workarounds and unofficial boundaries that appear in the code without appearing in the architecture documents. The path of least resistance is to acknowledge the law in the design phase and select the architecture that matches the team structure you have, or plan to build the team structure first and the architecture second.

The question that makes the constraint explicit: can the team that will own this system operate it reliably at 2am with one person? If not, the design needs a different support model, stronger automation, or a smaller operational surface before it is ready.

## Put support capacity into the design model

Team size is a warning signal, not a formula that chooses a topology. A small team with excellent deployment automation can operate several services. A large organisation can maintain a modular monolith with stable ownership. Neither arrangement removes the requirements for isolation, security, latency, and data integrity. Those requirements can rule out a convenient design even when the team prefers it.

Consider a hypothetical team with 120 engineering hours available in a week after leave and recurring obligations. The current application consumes 12 hours of routine maintenance and incident follow-up. A proposal introduces six separately deployed components. Estimate four hours per component for dependency updates, dashboard review, deployment care, and recovery exercises. The resulting 24 hours are 20% of capacity, compared with the current 10%. These are planning assumptions, not measured service costs. A shared platform could reduce them; unfamiliar technology could increase them.

The useful question is what the extra 12 hours buys. If one component needs a different security boundary or an independently scaled worker pool, record that requirement. If the justification is merely cleaner code, first test a module interface inside the current deployment. Code ownership and a separate process solve different problems.

## Rehearse ownership before committing

Ask the proposed on-call engineer to diagnose a deliberately failed dependency in a disposable environment. Provide the intended dashboards and runbook, then record which information is missing. Test an expired credential, a slow response, and a schema mismatch separately. A successful exercise includes safe mitigation and identification of the owning team; finding an error log is not the whole task.

Create an ownership worksheet with one row per deployable: primary owner, backup owner, release procedure, data restored, dependency credentials, and escalation route. Empty cells are design work, not paperwork for a later operations team. Review the worksheet with the people expected to take the rotation.

Approve the smallest boundary that meets the actual requirement. Revisit the choice when a measured constraint changes: release coordination becomes the main delay, one workload needs independent capacity, or a trust boundary changes. This makes organisational fit an explicit input while preserving the technical obligations the system must satisfy.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
