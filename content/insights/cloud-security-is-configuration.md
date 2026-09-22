---
title: "Most cloud security incidents are not sophisticated attacks. They are configuration errors at scale."
description: "The mental model that shapes most cloud security investment: sophisticated external adversaries employing novel attack techniques that require advanced threat detection capabilities to…"
date: 2025-06-17
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

The mental model that shapes most cloud security investment: sophisticated external adversaries employing novel attack techniques that require advanced threat detection capabilities to identify. The reality that shapes most cloud security incidents: misconfigured resources and overly permissive access controls that make the sophisticated attack technique unnecessary.

An attacker who finds an S3 bucket with public read access containing a database export does not need a zero-day exploit. An attacker who finds an IAM access key in a public GitHub repository does not need to compromise the network perimeter. An attacker who finds an EC2 instance with a public IP and an unrestricted security group rule can attempt credential brute force without any sophisticated technique. These are not theoretical scenarios. They are the recurring patterns in cloud security incident reports from every major cloud provider.

The implication for security investment: configuration hygiene addresses the dominant attack surface before advanced threat detection does. Policy-as-code (Sentinel, OPA, AWS SCPs, Azure Policy) enforces configuration requirements at resource creation time, preventing misconfiguration from reaching production. Continuous configuration monitoring (AWS Config, Azure Policy Compliance, cloud security posture management tools) detects drift after deployment. Secret scanning in CI pipelines catches credentials before they reach repositories. These are fundamentally preventive investments.

Threat detection is necessary and should be layered on top of a hygiene baseline. But threat detection tools deployed into an environment with public S3 buckets, overpermissioned IAM roles, and unrotated access keys are detecting attacks that could have been prevented by controlling the configuration that enabled them. Sequence matters: hygiene first, detection second.
