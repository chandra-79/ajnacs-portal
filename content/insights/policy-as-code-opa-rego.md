---
title: "Policy-as-Code with OPA and Rego: What Enterprise Adoption Actually Looks Like"
description: "Open Policy Agent solves a real problem. The organizational work required to make policy-as-code stick in a large engineering organization is what nobody talks about."
date: 2026-04-07
tags: ["DevSecOps", "Policy-as-Code", "Cloud Architecture", "Governance"]
format: article
---

Open Policy Agent is one of the better things to happen to enterprise infrastructure in the last five years. The ability to express compliance, security, and governance policies as code — versionable, testable, auditable — solves a problem that organizations have historically addressed with spreadsheets and manual review processes.

What the documentation doesn't cover is the organizational work required to make it stick.

## What Policy-as-Code Actually Enables

The core value: instead of policies living in audit reports, approval processes, or the heads of a central security team, they live in code that runs at enforcement points throughout the infrastructure lifecycle.

For enterprise cloud infrastructure, this typically means:

**Terraform/IaC validation**: OPA via Conftest evaluating infrastructure changes before they're applied. "No public S3 buckets", "all compute requires CMK encryption", "no security groups open to 0.0.0.0/0" — expressed as tests, run in CI.

**Kubernetes admission control**: OPA/Gatekeeper or Kyverno enforcing pod security standards, resource limit requirements, mandatory label policies, image registry restrictions. Runs at API admission time — you cannot create a workload that violates policy.

**CI/CD gate policies**: OPA evaluating pipeline decisions — which environments can receive which deployments, what approval gates are required for production, which artefacts meet compliance requirements.

## The Rego Learning Curve Is Real

Rego, OPA's policy language, is not intuitive coming from general-purpose programming languages. It's a purpose-built logic language, and its evaluation model requires a different mental model than imperative code.

The learning curve matters for adoption: if only your security team understands Rego, your policies become a centralised bottleneck. Engineers can't read, audit, or contribute to the policies that govern their work.

What I've found works: a small investment in Rego training for senior engineers in each squad — not deep expertise, but enough to read policies, understand why a check is failing, and contribute simple additions. This distributes the cognitive load and builds organizational ownership.

## The Policy Governance Problem

Policy-as-code creates a new governance problem: who owns the policies? Who reviews changes? How do you manage policy drift as the architecture evolves?

Organisations that implement OPA without answering these questions end up with:
- Policies written for a previous architecture that now flag legitimate work as violations
- A growing "exception" list that quietly undermines the enforcement model
- Policy changes that go unreviewed because there's no ownership

The model that works: treat policies like software.

Policy-as-code should have:
- Code review via PRs, with security team as required approver
- CI testing — policies tested with known-good and known-bad inputs
- A versioning and change log
- A quarterly policy review cycle to retire rules that no longer reflect current requirements

## Starting Smaller Than You Think You Should

The most common failure mode in policy-as-code rollouts: too much scope, too fast.

A central platform team writes 150 OPA policies, deploys them in enforcement mode, and immediately generates hundreds of violations across the engineering organization. The response is almost always to switch to warn mode — which means the policies exist but do nothing.

The pattern that works: start with five to ten high-confidence, high-value policies in enforcement mode. Add surface area incrementally, with engineering teams involved in defining the rules that apply to their workloads. Build trust in the enforcement mechanism before expanding scope.

The enforcement model is only as credible as the process for handling legitimate exceptions. Build that process before the exceptions start arriving.

## Where This Actually Saves Time

The payoff that convinced the engineering leaders I've worked with: automated compliance evidence generation.

When infrastructure policies are enforced as code and auditable, the answer to "show me evidence that your environments comply with X" is a CI report, not a manual audit. That changes the economics of compliance work significantly — and makes the annual security review a documentation exercise rather than an engineering emergency.

That's the argument that gets budget. Build toward it explicitly.

---

*Evaluating OPA/Rego for your platform, or struggling with adoption? [Happy to share more detail from what I've seen work.](/contact)*
