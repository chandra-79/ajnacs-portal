---
title: "Policy-as-code without organizational champions is just configuration files nobody reads"
description: "OPA, Sentinel, Azure Policy, and similar tools are genuinely useful for expressing security, compliance, and operational constraints as code."
date: 2026-05-06
tags: ["DevSecOps", "Policy-as-Code", "Engineering Leadership"]
format: note
---

OPA, Sentinel, Azure Policy, and similar tools are genuinely useful for expressing security, compliance, and operational constraints as code. They're also remarkably easy to deploy in ways that have no practical effect.

Policy-as-code programmes fail when policies run in "audit mode" indefinitely. Teams with audit-mode policies have warnings. They don't have enforcement. The violations accumulate in a report that gets reviewed quarterly, if at all. The policies exist as documentation of intent, not as active controls.

The pattern that makes policy-as-code effective:
- Policies block deployments, not generate warnings. If a policy violation doesn't stop the resource from being created, it's not a control — it's a suggestion.
- Violations are triaged by a named function. Someone owns the violation queue, reviews it regularly, and routes genuine violations to the responsible team with a remediation timeline.
- Exceptions are documented and time-limited. A waiver granted without justification or expiry is a permanent hole in your policy coverage.
- Policy decisions are explained. Future maintainers and auditors need to understand why a specific policy exists, not just what it enforces.

The governance model surrounding the technology is what determines whether policy-as-code produces security outcomes or compliance theatre. The code is straightforward. Getting the organization to treat violations as requiring response is the harder work.
