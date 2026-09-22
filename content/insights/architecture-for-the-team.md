---
title: "The right architecture for your system is the right architecture for your team, not for the problem."
description: "Architecture decisions are regularly made by examining the technical requirements of the system: expected throughput, latency targets, consistency requirements, failure tolerance…"
date: 2025-06-16
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

Architecture decisions are regularly made by examining the technical requirements of the system: expected throughput, latency targets, consistency requirements, failure tolerance, scaling dimensions. These are necessary inputs. They are not sufficient ones.

A microservices architecture deployed by a team of four engineers creates an operational surface that the team cannot maintain at production quality. Four engineers own twelve services, each with its own deployment pipeline, its own failure modes, its own monitoring configuration. The on-call engineer for a Saturday night incident is diagnosing a failure that spans multiple services, each of which requires different debugging context. The architecture is technically capable of handling the load. The team is not capable of operating it.

The inverse is also true. A monolithic architecture owned by eight domain teams creates a coordination problem that slows every team down. Every deployment is a negotiation. Every shared data model change requires alignment across teams with different priorities. The architecture is operationally simple. The ownership model is a bottleneck.

Conway's Law operates whether or not it is acknowledged in the architecture decision. Systems designed without reference to team structure will drift toward the team structure over time, often through accreted workarounds and unofficial boundaries that appear in the code without appearing in the architecture documents. The path of least resistance is to acknowledge the law in the design phase and select the architecture that matches the team structure you have, or plan to build the team structure first and the architecture second.

The question that makes the constraint explicit: can the team that will own this system operate it reliably at 2am with one person? If not, the architecture is wrong for the team, regardless of what it is right for technically.
