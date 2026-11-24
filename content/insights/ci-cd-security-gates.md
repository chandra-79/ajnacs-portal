---
title: "CI/CD Security Gates: What Belongs in Every Pipeline and What's Just Theatre"
description: "Not every security tool belongs in every pipeline stage. Here's how to sequence SAST, DAST, dependency scanning, secrets detection, and IaC security checks without creating a pipeline that takes 45 minutes and gets bypassed."
date: 2027-03-08
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

The failure mode A possible failure pattern is most often: all findings block the pipeline, including informational findings, low-severity issues with no available fix, and findings in vendor code you don't control. Engineers spend half their time triaging false positives and begin treating security findings as noise.

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

## Make the operating contract explicit

A security gate should connect a finding to a decision. A scanner's severity is an input, not a complete release rule. Consider whether the affected component is present in the deployed artifact, reachable in the workload and exposed to the relevant threat. Also consider the cost and confidence of remediation. A known secret committed to a repository may require revocation even after the string is removed; the build result alone cannot establish that the credential is safe.

Keep fast feedback near the change while retaining deeper review for designs that need it. Dependency analysis, secret checks and policy tests can often run automatically. Trust boundaries, authorization semantics and unusual data flows need contextual review. Moving checks earlier should make the feedback useful sooner, not remove specialists from decisions where they contribute. Document the cases that trigger a design review before implementation becomes expensive to change.

Exceptions are part of the control. Require a named owner, bounded scope, expiration and the reason a release is allowed despite an unresolved finding. Make exceptions visible to the next build and to the team operating the service. An override that exists only in a chat message cannot be reliably evaluated later. Measure detection and remediation quality rather than the number of tools inserted into a pipeline.

## Make a failing gate actionable

A useful failure message identifies the affected artifact, the violated rule, the relevant evidence and the route to remediation or review. A generic security check failed message creates support work without helping the developer fix the problem. Keep secret values and sensitive exploit details out of ordinary build logs while retaining an appropriate restricted evidence path.

Test the gate itself. A deliberately invalid fixture should fail, a reviewed valid fixture should pass, and a stale exception should stop authorizing the release. Check what happens when the scanner or policy service is unavailable. A skipped tool must not silently look like a successful security decision. The pipeline can wait, fail or follow a documented bounded exception process, but its result should state which happened.

Finally, verify that the artifact reaching production is the reviewed artifact. Rebuilding after approval or accepting an unverified tag can sever the connection between the gate and the deployed software.

## Work through an illustrative scenario

A fictional pipeline produces forty dependency findings. After artifact and reachability review, eight affect deployed reachable code, twelve affect deployed code without an established reachable path, and twenty are confined to development tooling. These categories guide further investigation; they do not automatically mark twenty findings harmless. The release team gives the eight confirmed reachable cases immediate ownership while recording uncertainty for the others.

| Observation | Value (findings) |
| --- | ---: |
| Deployed and reachable | 8 |
| Deployed uncertain reach | 12 |
| Development-only scope | 20 |

**Calculation and limits.** Synthetic classification of forty findings after reviewing the built artifact and application paths. Reachability is evidence-dependent. Categories do not replace severity, exploitability, compensating controls or a documented release decision.

## Build the evidence worksheet

**Artifact identity.** Bind the finding to the actual build digest and dependency graph deployed to the environment.

**Exposure evidence.** Explain whether the affected component and vulnerable behavior are reachable in this service.

**Release rule.** State which conditions block release and which require review rather than silently inheriting scanner defaults.

**Remediation owner.** Assign the team able to change the dependency, configuration or application behavior.

**Exception expiry.** Record a time-bounded approval and compensating controls for any accepted unresolved risk.

**Post-deployment check.** Verify the deployed artifact and runtime configuration still satisfy the decision made in the pipeline.

## Rehearse the failure boundary

1. **Introduce a known test finding.** Confirm the expected gate fails with a useful explanation and owner.

2. **Use an expired exception.** Ensure it no longer authorizes the build and directs the team to a supported renewal process.

3. **Change the deployed digest.** Reject a release artifact that differs from the reviewed artifact.

4. **Rotate a leaked test credential.** Verify revocation at the authority, not just removal of its text from the repository.

## Sources for the mechanisms

- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
