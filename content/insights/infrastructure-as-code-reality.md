---
title: "Infrastructure as Code: Add Inventory, Drift and Operating Controls"
description: "IaC manages declared infrastructure changes; complete control also needs inventory, policy enforcement, drift review and runtime ownership."
date: 2028-12-08
tags: ["DevSecOps", "Cloud Architecture"]
format: article
derived: true
---

Infrastructure as code is widely adopted and frequently misunderstood in terms of what it provides. The adoption creates a genuine improvement: infrastructure changes are reviewed, versioned, and repeatable. It does not automatically create infrastructure control.

The gap between IaC adoption and infrastructure control is typically filled by: resources created outside the IaC workflow, drift between the declared state and actual infrastructure state, and policy violations that occur because the apply pipeline does not enforce policy.

Resources created outside IaC workflows accumulate for understandable reasons. A team needs to debug a production issue quickly and creates a temporary resource through the console. The temporary resource becomes permanent because it is load-bearing before anyone notices. There is no IaC definition for it. The next Terraform plan cannot account for it. An audit finds infrastructure that exists in no code repository.

Drift occurs when cloud APIs are called directly — through the console, through CLI commands, through other automation — after the IaC state was last applied. Terraform's `plan` command detects drift; it does not prevent it. Drift detection requires running plans on a schedule and alerting on differences, not only on the deployment path.

The complete picture: IaC policy checks can reject changes through the enforced pipeline; cloud-side access controls and inventory remain necessary for changes through other paths. Drift detection on a daily schedule surfaces out-of-band changes. Console access restrictions require justification for break-glass scenarios. Import coverage brings historical clickops resources into managed state. These four together produce infrastructure control. IaC tooling alone produces infrastructure visibility, which is valuable but different.

## Reconcile inventory before reconciling declarations

A plan compares managed objects with configuration and provider observations; it is not automatically a complete cloud-asset discovery service. Start with an independent inventory and join it to state addresses, resource IDs and ownership records. A resource absent from the state may be intentionally managed elsewhere, unmanaged, or incorrectly classified. Resolve that distinction before importing it.

For a hypothetical account with 120 inventoried resources, 90 are mapped to Terraform state, 20 belong to an approved external controller and 10 have no known owner. Terraform management coverage is 90/120 = 75%. Accountable ownership coverage is (90 + 20)/120 = 91.7%. Neither percentage establishes policy compliance. The ten unexplained objects are investigation work, not permission to delete them.

Build a worksheet containing resource ID, controlling system, business owner, drift status and intended action. Exercise an out-of-band tag change on a disposable resource. Review the plan and decide whether to revert the change or adopt it in code. Then create an untracked resource and confirm whether the inventory process detects it. These are different controls. Gate applies through the normal pipeline, while documenting emergency access and reconciliation deadlines so legitimate incident work does not silently become permanent unmanaged infrastructure.

| Observation | Value (resources) |
| --- | ---: |
| Terraform managed | 90 |
| External controller | 20 |
| Unassigned | 10 |

**Figure method.** Synthetic inventory totals 120. Terraform coverage 90/120=75%; assigned ownership 110/120=91.7%. Inventory and policy completeness must be assessed separately.

## Further reading

- [Terraform resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
