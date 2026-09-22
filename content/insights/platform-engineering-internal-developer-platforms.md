---
title: "Platform Engineering: The Cloud Architecture Conversation Most Teams Are Having Too Late"
description: "Internal developer platforms aren't just DevOps at scale — they're a fundamentally different way of thinking about how your engineering organization interacts with infrastructure. Here's what's worth building and what isn't."
date: 2027-04-14
tags: ["Cloud Architecture", "DevSecOps", "Engineering Leadership"]
format: article
---

Platform engineering is having a moment. The term is everywhere, and like most things that go through a hype cycle, what it means varies wildly depending on who you ask.

Here's what I've observed works, what doesn't, and what the conversation is really about underneath.

---

## What platform engineering actually is

At its core, platform engineering is about treating your internal infrastructure as a product — with a team responsible for it, users (your developers) who are customers of it, and an ongoing commitment to improving the developer experience it delivers.

The alternative is what most organizations have: infrastructure as a set of tickets, tribal knowledge, and manual processes that developers navigate themselves, with varying success.

The shift isn't primarily technical. It's organizational. The technical parts — Kubernetes, Terraform, CI/CD pipelines, service templates — are the implementation. The actual change is deciding that developer productivity is worth a dedicated team's attention, and that infrastructure should serve developers rather than the other way around.

---

## What a good internal developer platform actually looks like

The platforms that work share a few consistent characteristics:

**A self-service golden path.** Developers can provision a new service — with networking, IAM roles, CI/CD pipeline, monitoring, and basic security controls configured — without raising a ticket or asking the platform team for help. The golden path is opinionated (it makes choices for you) but not a straitjacket (you can deviate when you have a reason to).

**Abstractions at the right level.** The platform hides Kubernetes, Terraform, and cloud-provider-specific details behind simpler interfaces. A developer deploying an API shouldn't need to understand how an AWS Application Load Balancer target group works. They should be able to say "I want an HTTP API with 3 replicas and this memory limit" and have the platform translate that into the right infrastructure.

**Compliance baked in, not bolted on.** Security scanning in CI/CD, audit logging, secret rotation, RBAC — configured by default in every service the platform provisions. Developers don't have to remember to add these; the platform makes the secure path the easy path.

**Documentation that's current.** The most common platform failure isn't technical. It's that the docs describe a system that existed 18 months ago. Keeping documentation current with the actual platform requires treating it with the same discipline as the code.

---

## What organizations get wrong

**Building a platform team that becomes a bottleneck.** The whole point is self-service. If your platform team is still the one who runs Terraform for every new environment, or who has to approve every CI/CD change, you've just created a different queue. The test: can a new engineer provision a complete service environment without talking to the platform team?

**Building the platform before understanding the users.** I've seen platform teams spend six months building an opinionated Kubernetes deployment system and then discover that most of the developers wanted better local development environments and didn't care about Kubernetes at all. Talk to your developer users. Prioritise based on where they're actually losing time.

**Over-engineering the abstraction.** There's a temptation to build a perfect, unified abstraction across every cloud provider, every runtime, every deployment pattern. The result is usually a lowest-common-denominator system that's good at nothing. Start narrower. Build excellent abstractions for the most common 80% of cases and let the 20% edge cases use lower-level tools directly.

**Treating the platform as infrastructure, not a product.** Product teams do user research, prioritize features, measure adoption, and iterate based on feedback. Platform teams that operate like infrastructure teams — reactive, ticket-driven, no roadmap — build platforms that developers route around.

---

## The metrics worth tracking

If you're trying to understand whether your internal platform is working:

- **Time to first deployment** — from a developer being onboarded to their first service running in staging. This is the most direct measure of platform friction.
- **Self-service rate** — what percentage of infrastructure provisioning happens without a platform team ticket?
- **Change lead time** — how long from a code commit to running in production? Platforms that improve this have demonstrably improved engineering velocity.
- **Developer satisfaction** — regular surveys, not just incident counts. Platform teams that don't measure this often discover accumulated frustration too late.

---

## Where to start if you don't have one yet

The most useful starting point isn't a platform team — it's an honest audit of where your developers are losing the most time.

Common answers: local development environment setup, provisioning non-production environments, debugging CI/CD failures, managing secrets, understanding how to deploy something new.

Pick the biggest pain point and fix it properly. Not with a ticket, not with a Confluence page — with tooling that makes it easy. Build the team's reputation on solving real problems, then expand from there.

The teams that build successful internal platforms are almost always the ones that started small and credible, not the ones that started with a grand unified vision.

*Building an internal developer platform or evaluating where to start? [Happy to think through the approach.](/about)*
