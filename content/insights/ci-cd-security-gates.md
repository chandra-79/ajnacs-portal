---
title: "CI/CD Security Gates: What Belongs in Every Pipeline and What's Just Theatre"
description: "Not every security tool belongs in every pipeline stage. Here's how to sequence SAST, DAST, dependency scanning, secrets detection, and IaC security checks without creating a pipeline that takes 45 minutes and gets bypassed."
date: 2025-04-29
tags: ["DevSecOps", "CI/CD", "Security"]
series: "DevSecOps Pipeline"
seriesOrder: 1
format: article
---

The hardest problem in CI/CD security isn't adding security tools. It's adding them in the right places, in the right order, with the right failure modes — so that they catch real issues without becoming friction that engineers route around.

A pipeline that takes 45 minutes because of security scanning is a pipeline where people push directly to bypass it during incidents. Theatre disguised as security.

## The pipeline stages and what goes where

**Pre-commit / pre-push (developer machine):**

Secrets detection runs here, before anything reaches a remote repository. Tools like `git-secrets`, `detect-secrets`, or `gitleaks` scan diffs for API keys, passwords, and tokens. This is the only layer where you can prevent a secret from reaching version control at all — once it's in Git history, it's compromised and rotation is the only fix.

Fast feedback is essential here. Pre-commit hooks should run in under 5 seconds or developers will disable them.

**On pull request / merge request (CI trigger):**

This is where the majority of security scanning happens.

- **SAST** (static application security testing) — tools like Semgrep, Checkmarx, or SonarQube scan source code for known vulnerability patterns: SQL injection, XSS, insecure deserialization, hardcoded credentials in code rather than configuration. Semgrep with community rules is a good starting point for most stacks; it's fast and configurable.

- **Dependency vulnerability scanning** — Snyk, Trivy, OWASP Dependency-Check. This is non-negotiable. A significant proportion of application vulnerabilities are in third-party libraries. Scanning on every PR, with results that block merge for critical/high CVEs with known fixes, catches these before they deploy.

- **IaC security scanning** — Checkov, tfsec, or Trivy (which covers both containers and IaC). Terraform, Bicep, and CloudFormation templates should be scanned for misconfiguration: open security groups, unencrypted storage, permissive IAM policies. These misconfigurations are deployment-time decisions and the easiest place to catch them is before they're applied.

**On build / container image:**

- **Container image scanning** — Trivy or Grype scanning the final image, not just the source. Base image vulnerabilities that your SAST didn't see show up here. Run against the built image in CI before pushing to the registry.
- **SBOM generation** — a Software Bill of Materials that records every component in the image. Required for compliance in regulated environments and genuinely useful for understanding your attack surface.

**On deployment (CD stage):**

- **DAST** (dynamic application security testing) — tools like OWASP ZAP or Burp Suite running against a deployed instance in a staging environment. DAST finds runtime vulnerabilities that SAST can't: reflected XSS, authentication bypasses, insecure headers. It requires a running application, so it can't run earlier.
- **Infrastructure compliance checks** — Azure Policy, AWS Config, or OPA Gatekeeper verifying that deployed infrastructure matches your security baseline. These are detective controls, not preventive ones, but they catch drift.

## The failure mode that makes pipelines useless

The failure mode I've seen most often: all findings block the pipeline, including informational findings, low-severity issues with no available fix, and findings in vendor code you don't control. Engineers spend half their time triaging false positives and begin treating security findings as noise.

The configuration that works:
- **Block on**: critical CVEs with available fixes, exposed secrets, SAST findings in your code for critical vulnerability classes
- **Warn on**: medium CVEs without fixes available, dependency findings in transitive dependencies
- **Report on**: everything else

The distinction is important: blocking on something you can't fix is friction without benefit. Reporting on something you could fix but haven't prioritized yet creates a backlog that gets reviewed, not a blocker that gets bypassed.

## What a working pipeline looks like in practice

A Java microservice with a reasonable security pipeline:

```
Pre-commit:      gitleaks (< 3s)
PR:              Semgrep + Snyk + Checkov (parallel, ~4 min)
Build:           Trivy image scan + SBOM (~ 2 min)
Deploy to staging: OWASP ZAP baseline scan (~ 5 min)
```

Total: about 11 minutes on the critical path, with most running in parallel. Findings that block are actionable and owned. Findings that warn are visible but don't stop delivery.

That's the bar to aim for — not comprehensive coverage of every possible vulnerability class, but the right gates at the right stages with the right failure modes.

*Reviewing your CI/CD security posture or building a pipeline from scratch? [Happy to compare configurations.](/contact)*
