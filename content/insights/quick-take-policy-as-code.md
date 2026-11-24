---
title: "Policy-as-Code Without Organisational Champions: Why It Fails to Stick"
description: "Policy-as-code is a powerful practice for encoding security, compliance, and operational requirements in enforceable rules. Without people who own and maintain it, it becomes configuration files nobody reads."
date: 2028-08-28
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

## Give each rule a contract and a test fixture

A policy should state the input it expects, the condition it enforces and the decision it returns. The same business requirement may need different adapters for a Terraform plan, a Kubernetes admission request and an inventory report. A rule that expects a field absent from one input can silently evaluate differently unless missing values are tested explicitly.

In an illustrative policy suite, 24 fixtures comprise ten allowed configurations, ten denied configurations and four malformed or incomplete inputs. A change passes 22 fixtures and fails two negative cases. Reporting 91.7% passing tests does not justify enforcement: the two failures may admit exactly the prohibited resources. The chart shows fixture categories, while the release decision depends on each expected outcome.

For the lab, choose a rule that requires an explicit owner tag on a resource. Test a valid owner, a missing key, an empty string, the wrong type and an exempt resource with an approved exception. Keep the fixture data synthetic and record the policy and input-schema versions. An empty or malformed field should not be interpreted as a valid owner merely because the key exists.

## Roll out enforcement without hiding uncertainty

Run the rule against representative existing plans and classify failures before blocking all changes. Audit mode is a legitimate detective phase when it has an owner, a response path and a time-bounded decision. Enforcement is useful for preventive controls, but a policy can also produce actionable evidence after deployment. Choose the mode according to the control objective instead of declaring every warning worthless.

The operating worksheet needs a policy owner, rationale, supported input types, exception process, remediation advice and rollback plan. A policy deployment can cause an availability problem if it blocks an emergency repair or rejects every workload because an upstream schema changed. Test the policy engine's failure behavior and define who can authorize a narrow bypass.

Review decision logs for both unexpected denials and suspicious absence of denials. Zero violations may mean the estate is compliant, or that the policy never received relevant inputs. Retain a known failing fixture as a health check for the evaluation path. Policy ownership becomes concrete when someone can explain a decision, correct a rule and verify that the intended boundary still holds after the surrounding platform changes.

| Observation | Value (fixtures) |
| --- | ---: |
| Allowed cases | 10 |
| Denied cases | 10 |
| Malformed input | 4 |

**Figure method.** Synthetic suite has 24 fixtures; 22/24=91.7% pass in the example, but two failed negative cases block release. Category counts do not prove policy coverage.

## Further reading

- [OPA policy testing](https://www.openpolicyagent.org/docs/policy-testing)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
