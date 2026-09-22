---
title: "IaC Drift Is a People Problem in Technical Clothing"
description: "Infrastructure drift — where the actual infrastructure diverges from what the code describes — is almost never a Terraform problem. It is a process and incentive problem."
date: 2028-07-31
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: article
---

The Terraform state says there are three t3.medium instances. The AWS console shows five. The extra two were provisioned through the console by an engineer who was debugging an issue last month and forgot to clean up.

This is IaC drift. It happens on every team that has not made IaC the exclusive path for infrastructure changes. The technical solution — immutable infrastructure, policy enforcement, drift detection — is available and effective. The reason drift exists is not technical. It is human.

## Why drift happens

People bypass IaC for understandable reasons:

**Urgency.** There is a production incident. The engineer needs a resource now. Opening a PR, getting a review, running the pipeline, and waiting for the apply is a 30-minute process. Clicking "launch" in the console is 30 seconds. The incident is contained. The console-provisioned resource stays.

**Uncertainty.** The engineer is not sure if their Terraform change is correct. They test it manually first. The manual test works. They forget to go back and codify it properly.

**Friction.** The IaC pipeline requires credentials, a specific environment, a review process, and approval. The console requires a browser. When the friction is high enough, the console wins for anything that feels exploratory.

**Escape hatch mentality.** The engineer who does not fully trust the IaC process maintains the ability to work around it. This is often protective behavior: "if the Terraform apply breaks something, I can fix it manually." The manual capability is preserved. It gets used.

## Technical enforcement is necessary but not sufficient

Drift detection tools (Terraform's built-in drift detection, AWS Config, Driftctl) identify drift after it occurs. Service control policies and IAM constraints can prevent manual console changes in production environments. Both are useful.

But they treat the symptom. The underlying cause is that the IaC path is not as convenient as the manual path for common workflows.

The organizations with the least drift are not the ones with the most technical enforcement. They are the ones where IaC is genuinely faster than the alternative for day-to-day work — where the pipeline is fast, the feedback loop is quick, local testing is straightforward, and engineers develop IaC skills naturally rather than under compliance pressure.

Make the correct path the easy path. Then enforce it. In that order.
