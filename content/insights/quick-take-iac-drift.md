---
title: "Diagnose IaC Drift: People, Controllers and Provider Behavior"
description: "Classify out-of-band changes, controller-owned fields and unmanaged resources before deciding what to reconcile."
date: 2028-07-31
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: article
---

The Terraform state says there are three t3.medium instances. The AWS console shows five. The extra two were provisioned through the console by an engineer who was debugging an issue last month and forgot to clean up.

This is unmanaged infrastructure alongside the declared estate. Changes to existing managed objects are a related drift problem; both require reconciliation and accountable ownership. The technical solution — immutable infrastructure, policy enforcement, drift detection — is available and effective. Drift can arise from human changes, legitimate controllers, provider defaults and incomplete modeling. The response needs both technical evidence and workflow context.

## Why drift happens

People bypass IaC for understandable reasons:

**Urgency.** There is a production incident. The engineer needs a resource now. Opening a PR, getting a review, running the pipeline, and waiting for the apply is a 30-minute process. Clicking "launch" in the console is 30 seconds. The incident is contained. The console-provisioned resource stays.

**Uncertainty.** The engineer is not sure if their Terraform change is correct. They test it manually first. The manual test works. They forget to go back and codify it properly.

**Friction.** The IaC pipeline requires credentials, a specific environment, a review process, and approval. The console requires a browser. When the friction is high enough, the console wins for anything that feels exploratory.

**Escape hatch mentality.** The engineer who does not fully trust the IaC process maintains the ability to work around it. This is often protective behavior: "if the Terraform apply breaks something, I can fix it manually." The manual capability is preserved. It gets used.

## Technical enforcement is necessary but not sufficient

Drift detection tools (Terraform's built-in drift detection, AWS Config, Driftctl) identify drift after it occurs. Service control policies and IAM constraints can prevent manual console changes in production environments. Both are useful.

But they treat the symptom. The underlying cause is that the IaC path is not as convenient as the manual path for common workflows.

A usable IaC workflow reduces incentives to bypass review. Combine timely feedback, appropriate access, skills and emergency procedures with technical controls; neither convenience nor enforcement alone establishes low drift.

Make the correct path the easy path. Then enforce it. In that order.

## Distinguish unmanaged resources from changed resources

An extra console-created machine may be outside Terraform's state rather than drift of an already managed object. A provider default changing a field, an autoscaler adjusting capacity and a person editing a security rule are also different cases. The response should depend on the controlling system and the risk, not merely on whether an automated comparison found a difference.

In a hypothetical weekly review, an independent inventory flags 18 discrepancies. Six are approved autoscaler changes, five are emergency edits awaiting reconciliation, four are unknown objects and three are provider-normalized values that do not require an action. The actionable queue is nine items if the five emergency edits and four unknown objects require follow-up. That classification is a local policy choice; it does not make approved changes immune from review.

For the lab, create a disposable resource under Terraform, change a harmless tag through the provider API and run a refresh-enabled plan. Then create another resource outside the configuration and compare what the plan sees with what the provider inventory sees. Retain both outputs after removing secrets. This demonstrates the limits of each control without touching a production access rule.

## Design the reconciliation path people can finish

The worksheet needs the resource identifier, detected difference, expected controller, reason for the change, risk and resolution. For emergency edits, include an expiry and the person responsible for either codifying or reverting the change. A scheduled detector without a staffed resolution path simply accumulates alerts.

Do not blindly apply the old declaration after an incident. It may restore the condition the responder was trying to avoid. Review whether the live change was an authorized mitigation, whether the code should adopt it and whether another controller will immediately change it again. Terraform lifecycle exceptions can reduce irrelevant noise but can also conceal changes; document why each ignored field belongs to another authority.

Measure time to classify and time to reconcile separately. If engineers bypass the normal path because a small safe change waits two days for review, improve that workflow while preserving appropriate access boundaries. Technical enforcement and usable procedures reinforce each other. Neither guarantees zero drift, because external services, defaults and legitimate controllers continue to change the environment.

| Observation | Value (items) |
| --- | ---: |
| Approved controller | 6 |
| Emergency edits | 5 |
| Unknown objects | 4 |
| Normalized values | 3 |

**Figure method.** Synthetic 18-item review: 6+5+4+3=18. Actionable items under this policy are 5+4=9; categories are illustrative and not universal risk rankings.

## Further reading

- [Terraform resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
