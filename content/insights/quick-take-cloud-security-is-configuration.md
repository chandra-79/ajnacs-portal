---
title: "Cloud Security Configuration: Verify Exposure and Effective Permissions"
description: "Investigate public access, broad permissions and credential exposure alongside application and identity risks, then verify preventive controls and remediation."
date: 2028-08-02
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

Cloud security incidents make news in dramatic terms: breached, compromised, exfiltrated. Configuration weaknesses can include: a publicly accessible S3 bucket, an IAM role with more permissions than it needed, a security group that was opened for testing and never closed.

Such weaknesses can enable opportunistic attacks, while more complex identity, application and supply-chain paths also need assessment.

## Configuration weaknesses to investigate

**Public S3 buckets.** AWS made this harder to do accidentally with account-level public access blocks, but the pattern persists. A developer creates a bucket for a one-time data transfer, marks it public to avoid dealing with presigned URLs, and moves on. The bucket contains sensitive data. A search engine or scanner finds it. The data is exfiltrated before anyone notices.

**Overly permissive IAM roles.** Broad policies such as `AdministratorAccess` can grant far more actions than a workload needs. Effective permissions also depend on applicable boundaries, organization policies, resource policies and explicit denies. Establish the workload’s required operations and examine the actual reachable resources instead of assuming that a policy name alone describes the full attack boundary.

**Open security groups.** The 0.0.0.0/0 inbound rule that was added "just to test connectivity" and never removed. The RDS instance accessible from the public internet because it was easier than troubleshooting VPC routing.

**Access keys in code.** Treat a published credential as exposed and revoke or rotate it promptly, then investigate its use. Removing the latest file does not invalidate copies, cached content or repository history. Prefer supported temporary credentials and test the replacement path before relying on a cleanup of visible source files.

**Lack of CloudTrail logging.** A logging gap can limit detection and investigation. Define required management and data events, independent retention and access controls, then verify delivery and choose retention against investigation needs and obligations.

## The configuration attack surface

A cloud estate can distribute configuration decisions across identity, networking, storage and many managed services. On-premises estates can also have a large and complex control surface. Inventory the actual resources and trust boundaries in either environment rather than assuming that physical ownership implies a smaller or safer configuration problem.

Combine human review with automated checks appropriate to the estate. Infrastructure-as-code policy checks can examine planned resources before deployment; deployed-state inventory can detect resources and changes outside that path. Verify each tool’s supported services, collection interval and failure reporting rather than interpreting a quiet dashboard as complete coverage.

The goal is not perfect security at the moment of deployment. It is detection and remediation of configuration drift before it is exploited.

Treat exposed configuration as a concrete risk to verify and remediate, without assuming that it explains every cloud incident.

## Trace a reachable attack path before prioritizing findings

Configuration is an important source of exposure, but cloud incidents can also involve application vulnerabilities, stolen identities, supply-chain compromise and operational mistakes. A configuration scanner establishes facts about selected settings; it does not establish that every attack path is closed. Prioritize the interaction between reachability, permission, sensitive data and compensating controls.

Consider a hypothetical review of 50 storage resources. Eight allow a public access path, six contain data classified as restricted, and three belong to both groups. The three overlapping resources are the immediate investigation set for public restricted data. Adding eight and six would double-count that overlap and overstate the union; the union is 8 + 6 − 3 = 11 resources. Even these numbers require verification because policy settings and actual effective access can differ.

Use synthetic test objects and a designated unauthenticated client to validate the intended access boundary. A successful listing is different from a successful object read, and a denied public request does not prove that a compromised privileged identity cannot read the data. Record the tested action, principal, resource and applicable policy layers. Never use real sensitive data as a public-access probe.

## Couple prevention with a tested response

For each finding, identify the policy that should prevent recurrence, the deployed-state check that detects drift and the owner who can remediate safely. Infrastructure policy checks cover the planned change; runtime inventory catches resources created through other paths. Exceptions need a reason and expiry, especially when a public endpoint is a deliberate product requirement.

Rehearse credential revocation with a disposable identity and verify that the old credential can no longer perform the tested action. Revocation timing can depend on the credential type, active sessions and caches. Removing a secret from the latest Git commit does not remove it from history, and deleting history is not a substitute for revocation.

Retain audit evidence according to threat model, investigation needs and applicable obligations instead of treating a single retention duration as universally correct. Verify which events are collected, whether delivery fails and whether an attacker with application privileges can alter the archive. The final worksheet should connect an exposure to a concrete action and a repeatable negative test. A long list of scanner findings is useful inventory, but verified boundaries make it operational.

| Observation | Value (resources) |
| --- | ---: |
| Public path | 8 |
| Restricted data | 6 |
| Both conditions | 3 |
| Either condition | 11 |

**Figure method.** Synthetic 50-resource inventory. Intersection=3; union=8+6−3=11. Categories overlap and must not be summed as independent counts.

## Further reading

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
