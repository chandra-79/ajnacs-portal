---
title: "Policy-as-code without organizational champions is just configuration files nobody reads"
description: "OPA, Sentinel, Azure Policy, and similar tools are genuinely useful for expressing security, compliance, and operational constraints as code."
date: 2029-07-11
tags: ["DevSecOps", "Policy-as-Code", "Engineering Leadership"]
format: note
derived: true
---

OPA, Sentinel, Azure Policy, and similar tools are genuinely useful for expressing security, compliance, and operational constraints as code. They're also remarkably easy to deploy in ways that have no practical effect.

Policy-as-code programmes fail when policies run in "audit mode" indefinitely. Teams with audit-mode policies have warnings. They don't have enforcement. The violations accumulate in a report that gets reviewed quarterly, if at all. The policies exist as documentation of intent, not as active controls.

The pattern that makes policy-as-code effective:
- Policies block deployments, not generate warnings. A preventive policy blocks the relevant operation; a detective policy can also be a control when findings have a reliable response and evidence process.
- Violations are triaged by a named function. Someone owns the violation queue, reviews it regularly, and routes genuine violations to the responsible team with a remediation timeline.
- Exceptions are documented and time-limited. A waiver granted without justification or expiry is a permanent hole in your policy coverage.
- Policy decisions are explained. Future maintainers and auditors need to understand why a specific policy exists, not just what it enforces.

The governance model surrounding the technology is what determines whether policy-as-code produces security outcomes or compliance theatre. The code is straightforward. Getting the organization to treat violations as requiring response is the harder work.

## Treat policy decisions as an operational queue

Preventive enforcement is valuable, but detective policy checks can also be controls when findings trigger a reliable response. Choose the mode according to the objective and deployment risk. An audit-only policy with no owner is ineffective because nobody acts, not because every nonblocking control is inherently a suggestion.

For a hypothetical month, a policy emits 40 findings. Twenty-five are corrected, eight receive approved time-limited exceptions and seven remain open. The closed workflow count is 33, or 82.5%, but exception closure is not the same as removing the underlying exposure. Keep those outcomes separate and track expiry.

Build a worksheet with rule ID, resource, reason, owner, due date, exception expiry and evidence of correction. Re-run evaluation after remediation to confirm the finding clears for the intended reason. Test a known violating fixture periodically so an empty queue is not mistaken for success when the evaluator has stopped receiving inputs. Ownership is demonstrated by triage, explanation and verified resolution, including a safe process for changing a rule that proves incorrect.

| Observation | Value (findings) |
| --- | ---: |
| Corrected | 25 |
| Temporary exception | 8 |
| Still open | 7 |

**Figure method.** Synthetic 40-finding month: 25+8+7=40; workflow closure=(25+8)/40=82.5%. Exceptions retain exposure and require expiry; closure is not remediation rate.

## Further reading

- [OPA testing guidance](https://www.openpolicyagent.org/docs/policy-testing)
- [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)
