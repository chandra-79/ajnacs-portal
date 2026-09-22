---
title: "Cloud Security Is a Configuration Problem, Not a Sophistication Problem"
description: "Most cloud security incidents trace to misconfiguration: public S3 buckets, overly permissive IAM roles, open security groups. Understanding the pattern is the first step to preventing it."
date: 2028-08-02
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

Cloud security incidents make news in dramatic terms: breached, compromised, exfiltrated. The underlying cause is almost always mundane: a publicly accessible S3 bucket, an IAM role with more permissions than it needed, a security group that was opened for testing and never closed.

This is not sophisticated adversarial work. It is opportunistic exploitation of configuration errors that should not exist.

## The most common configuration mistakes

**Public S3 buckets.** AWS made this harder to do accidentally with account-level public access blocks, but the pattern persists. A developer creates a bucket for a one-time data transfer, marks it public to avoid dealing with presigned URLs, and moves on. The bucket contains sensitive data. A search engine or scanner finds it. The data is exfiltrated before anyone notices.

**Overly permissive IAM roles.** The path of least resistance in IAM is to attach `Administrator` or `PowerUser` policies to roles because it is easier than working out the minimum required permissions. An application running with `Administrator` access has a blast radius of the entire account when compromised.

**Open security groups.** The 0.0.0.0/0 inbound rule that was added "just to test connectivity" and never removed. The RDS instance accessible from the public internet because it was easier than troubleshooting VPC routing.

**Access keys in code.** AWS access keys committed to GitHub are scanned by attackers within minutes. The key is rotated the next day but the git history is permanent and the scans have already run.

**Lack of CloudTrail logging.** Not a misconfiguration that causes a breach, but a misconfiguration that makes a breach undetectable and uninvestigable. CloudTrail in every region, logs shipped to a separate account, retention of at least 90 days.

## The configuration attack surface

What makes cloud security specifically challenging is the surface area. An on-premises environment has physical network boundaries and a relatively small number of configuration surfaces. A cloud environment with hundreds of resources across multiple services has thousands of configuration decisions that each represent a potential exposure.

Manual review cannot cover this surface area. Infrastructure as code with policy-as-code scanning (Checkov, tfsec, OPA/Conftest) moves the review to before the resource exists. Cloud security posture management tools (AWS Security Hub, Prisma Cloud, Wiz) continuously evaluate the deployed configuration.

The goal is not perfect security at the moment of deployment. It is detection and remediation of configuration drift before it is exploited.

Almost none of the major cloud breaches required sophisticated attackers. They required open doors that nobody closed.
