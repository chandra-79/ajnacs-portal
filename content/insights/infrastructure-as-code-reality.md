---
title: "Infrastructure as code is not automated infrastructure management. It is version-controlled infrastructure creation."
description: "Infrastructure as code is widely adopted and frequently misunderstood in terms of what it provides."
date: 2025-07-16
tags: ["DevSecOps", "Cloud Architecture"]
format: article
derived: true
---

Infrastructure as code is widely adopted and frequently misunderstood in terms of what it provides. The adoption creates a genuine improvement: infrastructure changes are reviewed, versioned, and repeatable. It does not automatically create infrastructure control.

The gap between IaC adoption and infrastructure control is typically filled by: resources created outside the IaC workflow, drift between the declared state and actual infrastructure state, and policy violations that occur because the apply pipeline does not enforce policy.

Resources created outside IaC workflows accumulate for understandable reasons. A team needs to debug a production issue quickly and creates a temporary resource through the console. The temporary resource becomes permanent because it is load-bearing before anyone notices. There is no IaC definition for it. The next Terraform plan cannot account for it. An audit finds infrastructure that exists in no code repository.

Drift occurs when cloud APIs are called directly — through the console, through CLI commands, through other automation — after the IaC state was last applied. Terraform's `plan` command detects drift; it does not prevent it. Drift detection requires running plans on a schedule and alerting on differences, not only on the deployment path.

The complete picture: IaC tooling with policy enforcement (Sentinel, OPA) blocks non-compliant resources from being created. Drift detection on a daily schedule surfaces out-of-band changes. Console access restrictions require justification for break-glass scenarios. Import coverage brings historical clickops resources into managed state. These four together produce infrastructure control. IaC tooling alone produces infrastructure visibility, which is valuable but different.
