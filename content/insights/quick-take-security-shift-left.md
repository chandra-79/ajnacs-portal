---
title: "Shift Left on Security Means Earlier, Not Fewer"
description: "Security earlier in the development process is unambiguously better. Security earlier does not mean security functions are eliminated — it means the security function moves from audit to enablement."
date: 2028-10-09
tags: ["DevSecOps", "Engineering Leadership"]
format: article
---

Shift left is the principle that security controls should be applied as early as possible in the development lifecycle — in design, in development, in CI/CD — rather than in a late-stage security review before release.

This is correct. Security issues found in design are cheap to fix. Security issues found in production are expensive.

The misapplication: using "shift left" as a reason to eliminate security team involvement in the delivery process entirely. If the developers are doing security now, the thinking goes, we do not need a security team in the loop.

This is not shifting security left. It is removing security review while hoping that developers catch the issues instead.

## What shifting left actually requires

**Developers who have security knowledge appropriate for their role.** Not security specialists — engineers who understand the common vulnerability patterns for the technologies they use, who can write secure code by default, and who know when to escalate to a security specialist.

**Automated security tooling in the development pipeline.** SAST (static analysis) to catch code-level vulnerabilities, dependency scanning to catch known-vulnerable libraries, IaC scanning to catch misconfigured infrastructure, container scanning to catch image vulnerabilities. These tools provide security feedback at the moment the code is written, not weeks later.

**Security requirements at the design stage.** Threat modeling, data classification, and access control design should happen before the first line of code is written for significant features. Security architects or engineers involved in design reviews catch architectural vulnerabilities that no amount of code-level scanning will find.

**Security specialists who are enabling, not auditing.** The shifted-left security team spends less time doing final audits and more time writing secure patterns, reviewing libraries, maintaining the automated tooling, and consulting on design decisions. They are earlier and more embedded — not eliminated.

## The failure mode

The team that shifts security left by adding linting and then stops getting security reviews is getting less security, not more. The tools catch some classes of problems. They do not catch logical access control errors, authentication design flaws, or business logic vulnerabilities that require understanding the application's behavior.

Shift left. Keep the security function. Change how it engages. In that order.
