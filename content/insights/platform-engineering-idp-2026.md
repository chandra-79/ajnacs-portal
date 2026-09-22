---
title: "Platform Engineering in 2026: What an Internal Developer Platform Actually Needs"
description: "Every team is building a platform. Few are building one that developers actually want to use. Here's what separates an IDP that accelerates delivery from one that adds process overhead dressed up as self-service."
date: 2027-08-16
tags: ["DevSecOps", "Cloud Architecture", "Engineering Leadership"]
format: article
---

The pitch for an internal developer platform is always the same: reduce cognitive load, standardise environments, let developers self-serve infrastructure. The reality, for many IDP initiatives, is a portal that developers route around and a platform team that spends most of their time answering questions about why the portal doesn't support their use case.

The gap between pitch and reality comes down to a few decisions made early.

## The product mindset that most platform teams miss

A platform is a product. Its customers are the developers who use it. If developers don't adopt it, the platform has failed — regardless of how well-engineered the underlying infrastructure is.

Platform teams that succeed treat adoption as their primary metric. They talk to developers before building, not after. They have a feedback loop. They measure time-to-deploy for new services, not lines of Terraform written.

Platform teams that struggle treat adoption as something that will happen once the platform is complete. The platform is never complete, adoption never comes naturally, and the platform team starts mandating use rather than earning it.

The practical test: when a developer has a deadline and needs to set up a new service, do they reach for the platform or do they go around it? If they go around it, the platform has failed on that use case. Finding out why — and fixing it — is platform work.

## The golden path: opinionated defaults, not the only option

The most effective IDP design pattern is the "golden path": a well-lit, well-supported route for the 80% use case. New service, standard tech stack, standard deployment target — the golden path should get a developer from zero to production-deployed in under an hour with no platform team involvement.

The key word is *path*, not *tunnel*. Developers who need to go off the golden path for legitimate reasons should be able to — with a documented off-ramp and appropriate support. A platform that can only do exactly what it was designed for becomes a constraint, not an accelerator.

Golden path components:
- **Service template**: a repository template that includes the standard project structure, CI/CD pipeline, Dockerfile, and platform integration hooks. Scaffolded with a single command.
- **Environment provisioning**: dev, staging, and production environments provisioned from the template, with correct RBAC, networking, and observability pre-configured.
- **CI/CD pipeline**: security scanning, testing, and deployment baked in. Developer pushes code; pipeline handles the rest.
- **Observability**: metrics, logs, and traces connected to the central observability platform automatically. The developer shouldn't need to wire this up.
- **Secrets management**: integration with the secrets manager without requiring developers to understand the underlying infrastructure.

## The portal: necessary but not sufficient

A developer portal (Backstage is the most widely adopted open-source option) surfaces the platform's capabilities: service catalogue, infrastructure self-service, documentation, deployment history, on-call routing.

Backstage is not a platform. It's a UI layer on top of the platform. Teams that build a Backstage instance without the underlying automation end up with a portal that lists services and links to documentation but doesn't actually enable self-service.

The portal is valuable when: the platform underneath has real capabilities (provisioning, deployment, observability), the catalogue is accurate and maintained, and developers find it genuinely faster to use than alternatives.

The portal is a liability when: it's out of date (catalogue has stale entries), it can't do the things developers actually need, or the portal interaction is slower than just opening the cloud console.

## The metrics that show whether the platform is working

**Time to production for a new service**: from "I need to deploy a new service" to the first deployment in production. For a mature golden path, this should be measured in hours, not days.

**Developer portal adoption**: what percentage of new services use the golden path vs. are built directly in the cloud console or from scratch?

**DORA metrics for platform team vs. non-platform-using teams**: if the platform is working, teams using it should deploy more frequently, with lower change failure rates and faster recovery.

**Time spent on platform support**: how many hours per week does the platform team spend on support tickets? High support time means the platform has gaps that developers are hitting. Low support time (combined with high adoption) means the platform is working.

**Developer satisfaction (NPS or qualitative)**: ask developers directly, at least quarterly, whether the platform is making their lives easier or harder. Act on the feedback.

## What platform engineering is not

Platform engineering is not a DevOps rebranding. Platform engineering that focuses entirely on tooling without addressing the product mindset produces better-tooled platforms with the same adoption problems.

Platform engineering is not the same as infrastructure automation. Infrastructure automation (Terraform, Pulumi, CDK) is a component of platform engineering, not the output. The output is developer capability — what can a developer do today that they couldn't do last quarter?

Platform engineering is not a solution to governance problems. If the platform is primarily a mechanism for enforcing standards on developers rather than accelerating them, developers will treat it as overhead. Governance is a constraint; the platform's job is to make compliance the path of least resistance, not to be a gatekeeper.

*Building or scaling an internal developer platform? [Happy to compare approaches — the design decisions compound.](/contact)*
