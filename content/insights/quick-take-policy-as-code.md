---
title: "Policy-as-Code Without Organisational Champions: Why It Fails to Stick"
description: "Policy-as-code is a powerful practice for encoding security, compliance, and operational requirements in enforceable rules. Without people who own and maintain it, it becomes configuration files nobody reads."
date: 2025-11-24
tags: ["DevSecOps", "Policy-as-Code", "Engineering Leadership"]
format: article
---

The policy-as-code initiative ships. OPA policies are written. Conftest runs in CI. Infrastructure changes that violate the policies are rejected. This is the correct outcome.

Six months later, half the policies are in warn mode rather than enforce mode because teams were frustrated with failures they did not understand. New policies have not been added for four months. Two of the most important policies were disabled because they were producing false positives that nobody investigated. The engineers who wrote the original policies have moved to other teams.

Policy-as-code without organisational ownership degrades into policy-as-configuration-files.

## Why policy-as-code requires champions

Policy-as-code is not a one-time implementation. It is an ongoing practice. Policies need to be maintained as infrastructure patterns change. New policies need to be added as new risks or compliance requirements emerge. False positives need to be investigated and resolved, not bypassed. Teams need education about what the policies enforce and why.

All of this requires people who own the practice — who are responsible for policy quality, who are the escalation point when teams have questions, and who advocate for the practice within the organization.

Without this ownership, the natural entropy of any unowned system takes over. Policies become stale. Teams learn to work around them. The practice atrophies.

## What effective policy ownership looks like

**A named team or person.** Not "the security team is responsible for policies." A specific person or group that maintains the policy library, reviews additions, and is reachable when a policy is causing problems.

**A review process for policy additions.** Policies that are added without review produce false positives that erode trust. A lightweight review — does this policy express what we intend? does it cover the cases we are concerned about? does it produce false positives on existing infrastructure? — before enabling enforcement is worth the overhead.

**Feedback loops with affected teams.** Teams that encounter policy failures should have a clear path to understand why the policy exists and to propose changes if the policy is wrong. A policy-as-code system with no feedback loop produces a repository of policies that teams work around silently.

**Regular policy reviews.** Quarterly review of all active policies: are they still relevant? Are any producing excessive noise? Are there gaps in coverage for new infrastructure patterns?

The policies are the easy part. The organisational practice that keeps them effective is the investment.
