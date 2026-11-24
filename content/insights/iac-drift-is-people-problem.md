---
title: "IaC drift is a people problem wearing a technical mask"
description: "Infrastructure as code drift — the gap between your IaC state and your actual cloud environment — gets discussed as a technical problem."
date: 2029-04-13
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: note
derived: true
---

Infrastructure as code drift — the gap between your IaC state and your actual cloud environment — gets discussed as a technical problem. The solutions offered are usually technical: drift detection pipelines, automated remediation, CI enforcement.

These solutions are correct. They're also insufficient without addressing why drift happens in the first place.

Drift happens when someone makes a console change during an incident because it's faster than updating Terraform. It happens when a "temporary" manual fix never gets reflected in the code. It happens when engineers who have write access to the cloud console don't have write access to the IaC repository. It happens when the team that wrote the code isn't the team running the infrastructure.

Some drift reflects a bypassed workflow; other drift reflects authorized controllers or provider behavior. Classify the source before deciding whether the live state or declaration should change. That's an organizational design problem.

The technical controls — read-only console access, drift detection on a schedule, PR-gated applies — create the constraint. But the constraint only works if leadership treats a drift alert with the same urgency as a security finding. If the response to "our Terraform state has 30 undocumented changes" is "we'll deal with it later," no amount of tooling will hold.

Make the reviewed path usable, control emergency changes and support reconciliation. Continue detecting drift from provider behavior and other legitimate controllers rather than promising that it will disappear.

## Measure how emergency changes return to the reviewed state

A blanket ban on console work may block a legitimate recovery while failing to address changes made by other controllers. Define the emergency boundary instead: who may act, which evidence must be retained and how the final configuration is reconciled. Reconciliation can adopt a safe live change or revert it; the original code is not always the correct destination.

Suppose a hypothetical month has twelve emergency changes. Seven are codified within one day, three within three days and two remain unresolved after a week. The closure count is ten, or 83.3%; the two open items need risk-based follow-up. An average over closed items alone would hide that backlog.

Use a worksheet with incident reference, resource, field, reason, temporary owner, expiry and final decision. Exercise it by changing a harmless tag in a disposable account, then require someone other than the author to classify and reconcile it. Check whether the normal repository permissions and pipeline actually allow that person to finish. Treat the drill as workflow evidence, not a claim that all drift is caused by people. Provider normalization, autoscaling and incomplete declarations still need their own technical handling.

| Observation | Value (changes) |
| --- | ---: |
| Closed in one day | 7 |
| Closed in three days | 3 |
| Open after one week | 2 |

**Figure method.** Synthetic twelve-change month: 7+3=10 closed, 10/12=83.3%; two remain open. Excluding open items biases elapsed-time summaries.

## Further reading

- [Terraform resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
