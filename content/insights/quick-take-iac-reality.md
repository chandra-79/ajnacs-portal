---
title: "Infrastructure as Code Is Version Control for Creation, Not Management"
description: "IaC describes what infrastructure should exist. It does not automatically manage, monitor, or maintain it. The gap between 'code defines it' and 'code manages it' is where operational confusion lives."
date: 2028-07-05
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

The marketing around infrastructure as code promises that infrastructure becomes manageable, repeatable, and version-controlled in the same way software does. This is mostly true, with one important qualification that gets lost in the narrative.

IaC is version-controlled infrastructure creation. It is not, by itself, version-controlled infrastructure management.

## What the distinction means

A Terraform configuration file defines the desired state: three EC2 instances, one RDS instance, two security groups. When you apply the configuration, Terraform creates the resources to match that desired state. Version control captures every change to the desired state.

This is genuinely useful. It eliminates the snowflake server problem (manually configured servers whose configuration exists only as institutional memory). It makes environment reproduction reliable. It makes infrastructure changes reviewable and auditable.

What it does not do:

**It does not monitor the running infrastructure.** Terraform does not know that your EC2 instance's disk is 92% full. It does not know that the RDS query performance has degraded. It does not know that the security group you defined has drifted because someone added a rule in the console. You need monitoring, observability, and drift detection for this.

**It does not manage configuration that lives inside the resources.** The EC2 instance is created by Terraform. The application configuration, the package versions, the runtime settings, the cron jobs — these are managed by a configuration management tool (Ansible, Puppet, Chef) or baked into an AMI. IaC creates the box; CM tools configure what runs inside it.

**It does not handle day-2 operations.** Certificate rotation, secret rotation, database vacuuming, log management, patch management — these are operational activities that happen after the infrastructure exists. Terraform does not help with them.

## The operational gap

Teams that adopt IaC and assume it handles infrastructure management are in for a surprise. They have eliminated one category of operational pain (configuration drift due to manual provisioning) and still have all of the other categories (configuration inside instances, monitoring, operational hygiene).

The more complete picture: IaC handles the "what exists" layer. Configuration management handles the "what runs on it" layer. Monitoring handles the "how is it behaving" layer. All three are necessary.

IaC is a significant improvement over manual infrastructure. It is not a replacement for operations.
