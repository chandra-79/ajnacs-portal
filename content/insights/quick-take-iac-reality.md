---
title: "Infrastructure as Code: Manage Changes and Verify Runtime Responsibilities"
description: "IaC describes what infrastructure should exist. It does not automatically manage, monitor, or maintain it. The gap between 'code defines it' and 'code manages it' is where operational confusion lives."
date: 2028-07-05
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

The marketing around infrastructure as code promises that infrastructure becomes manageable, repeatable, and version-controlled in the same way software does. This is mostly true, with one important qualification that gets lost in the narrative.

IaC provides reviewed declarations and tooling for infrastructure creation, updates and deletion. It does not by itself establish runtime health, complete inventory or every day-two operating procedure.

## What the distinction means

A Terraform configuration file defines the desired state: three EC2 instances, one RDS instance, two security groups. When you apply the configuration, Terraform creates the resources to match that desired state. Version control captures every change to the desired state.

This is genuinely useful. It eliminates the snowflake server problem (manually configured servers whose configuration exists only as institutional memory). It makes environment reproduction reliable. It makes infrastructure changes reviewable and auditable.

What it does not do:

**A plan is not continuous runtime monitoring.** A Terraform refresh and plan can detect supported out-of-band changes to managed resource attributes, including a security-group rule changed through a console. It does not inherently monitor guest disk usage or application query latency. Distinguish provider-readable configuration drift from runtime health, then give each an appropriate observation and response process.

**Provider scope determines what can be declared.** Infrastructure tooling can manage more than a virtual-machine shell when providers expose application, policy or service resources. Guest packages and runtime settings may instead be built into an image or managed by a configuration system. Choose one accountable controller for each field and document the boundary rather than assuming every workload needs the same tool stack.

**It does not handle day-2 operations.** Certificate rotation, secret rotation, database vacuuming, log management, patch management — these are operational activities that happen after the infrastructure exists. Terraform can declare supporting policies and resources where providers expose them, but execution, verification and incident response still need accountable operating processes.

## The operational gap

Teams that adopt IaC and assume it handles infrastructure management are in for a surprise. They have reduced one category of operational pain (inconsistent provisioning), without automatically eliminating out-of-band drift and still have all of the other categories (configuration inside instances, monitoring, operational hygiene).

The more complete picture assigns desired state, execution and runtime verification to explicit owners. Immutable images, managed services and configuration-management tools can implement different parts of that design. The responsibilities remain necessary even when one product covers several of them or a particular tool category is unnecessary.

IaC is a significant improvement over manual infrastructure. It is not a replacement for operations.

## Treat a plan as a proposed change to a living system

Infrastructure as code can create, update and destroy resources; describing it as creation alone understates its capabilities. Its limit is that declaring infrastructure does not automatically implement every operational responsibility. Some rotation, monitoring or maintenance resources can be declared through providers, while their runtime success still needs observation and ownership.

A hypothetical platform has 24 operational obligations. Ten are directly represented in reviewed infrastructure configuration, eight are executed by managed services or controllers, and six are manual procedures. The chart partitions obligations by executor, not by whether they are important. Configuration coverage is 10/24 = 41.7%; accountable ownership can still be 100% if all three groups have named owners and evidence. Conversely, putting every obligation in code does not prove that it runs correctly.

For a lab, choose certificate renewal. Identify the declared certificate resource, domain validation, renewal authority, deployment mechanism and expiry alert. Force a harmless renewal or use a short-lived test certificate in an isolated environment. Verify that the application serves the new certificate and that the old trust assumptions no longer apply where appropriate. A successful apply is only one event in that chain.

## Build a responsibility map instead of a tool boundary slogan

The worksheet should list desired state, execution trigger, controller, observable completion and failure response. A database backup policy may be defined in Terraform while the provider performs backups and the team validates restores. An autoscaling rule may be declared in code while the controller adjusts capacity continuously. The division is intentional when each authority owns its fields and operators understand the handoff.

Check a planned destructive change against the actual data lifecycle. Replacement of a resource can create a new endpoint, invalidate dependencies or remove data if protections are misconfigured. Review the plan, preserve necessary backups and exercise recovery before authorizing an irreversible action. Do not infer application health from a clean state file.

Finally, compare the inventory with the state and account for objects managed by other systems. A complete operating model combines declarations, runtime signals and response procedures. This makes the practical gap visible without suggesting that Terraform is incapable of managing changes or that a configuration-management tool is mandatory for every immutable or managed workload.

| Observation | Value (obligations) |
| --- | ---: |
| IaC-controlled | 10 |
| Service or controller | 8 |
| Manual procedure | 6 |

**Figure method.** Synthetic partition of 24 obligations: 10+8+6=24; directly declared share 10/24=41.7%. Classification does not measure reliability or ownership completeness.

## Further reading

- [Terraform resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
