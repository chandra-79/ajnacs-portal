---
title: "Policy-as-Code with OPA and Rego: What Enterprise Adoption Actually Looks Like"
description: "Open Policy Agent solves a real problem. The organizational work required to make policy-as-code stick in a large engineering organization is what nobody talks about."
date: 2027-02-26
tags: ["DevSecOps", "Policy-as-Code", "Cloud Architecture", "Governance"]
format: article
---

Open Policy Agent is one of the better things to happen to enterprise infrastructure in the last five years. The ability to express compliance, security, and governance policies as code — versionable, testable, auditable — solves a problem that organizations have historically addressed with spreadsheets and manual review processes.

What the documentation doesn't cover is the organizational work required to make it stick.

## What Policy-as-Code Actually Enables

The core value: instead of policies living in audit reports, approval processes, or the heads of a central security team, they live in code that runs at enforcement points throughout the infrastructure lifecycle.

For enterprise cloud infrastructure, this typically means:

**Terraform/IaC validation**: OPA via Conftest evaluating infrastructure changes before they're applied. "No public S3 buckets", "all compute requires CMK encryption", "no security groups open to 0.0.0.0/0" — expressed as tests, run in CI.

**Kubernetes admission control**: OPA/Gatekeeper or Kyverno enforcing pod security standards, resource limit requirements, mandatory label policies, image registry restrictions. Runs at configured admission points; coverage, exemptions and failure policy determine which requests are actually enforced.

**CI/CD gate policies**: OPA evaluating pipeline decisions — which environments can receive which deployments, what approval gates are required for production, which artefacts meet compliance requirements.

## The Rego Learning Curve Is Real

Rego, OPA's policy language, is not intuitive coming from general-purpose programming languages. It's a purpose-built logic language, and its evaluation model requires a different mental model than imperative code.

The learning curve matters for adoption: if only your security team understands Rego, your policies become a centralised bottleneck. Engineers can't read, audit, or contribute to the policies that govern their work.

A practical adoption approach is: a small investment in Rego training for senior engineers in each squad — not deep expertise, but enough to read policies, understand why a check is failing, and contribute simple additions. This distributes the cognitive load and builds organizational ownership.

## The Policy Governance Problem

Policy-as-code creates a new governance problem: who owns the policies? Who reviews changes? How do you manage policy drift as the architecture evolves?

Organisations that implement OPA without answering these questions end up with:
- Policies written for a previous architecture that now flag legitimate work as violations
- A growing "exception" list that quietly undermines the enforcement model
- Policy changes that go unreviewed because there's no ownership

The model that works: treat policies like software.

Policy-as-code should have:
- Code review via PRs, with security team as required approver
- CI testing — policies tested with known-good and known-bad inputs
- A versioning and change log
- A quarterly policy review cycle to retire rules that no longer reflect current requirements

## Starting Smaller Than You Think You Should

The most common failure mode in policy-as-code rollouts: too much scope, too fast.

A central platform team writes 150 OPA policies, deploys them in enforcement mode, and immediately generates hundreds of violations across the engineering organization. A broad rollout can produce pressure to switch to warning mode. Warnings can still serve a detective control when they have owners and response deadlines, but they are not preventive enforcement.

The pattern that works: start with five to ten high-confidence, high-value policies in enforcement mode. Add surface area incrementally, with engineering teams involved in defining the rules that apply to their workloads. Build trust in the enforcement mechanism before expanding scope.

The enforcement model is only as credible as the process for handling legitimate exceptions. Build that process before the exceptions start arriving.

## Where This Actually Saves Time

One potential benefit to evaluate is automated evidence generation for the controls actually covered by the policy and its enforcement path.

A CI report can show that a specific input passed a policy version. Evidence about the deployed estate and a review period may also require inventory, runtime assessments and protected history. That changes the economics of compliance work significantly — and makes the annual security review a documentation exercise rather than an engineering emergency.

That's the argument that gets budget. Build toward it explicitly.

*Evaluating OPA/Rego for your platform, or struggling with adoption? [Happy to discuss the policy design and operating trade-offs.](/contact)*

## Treat the input adapter as part of the policy

OPA evaluates a decision against supplied input and policy data. It does not independently discover whether a cloud resource is secure. A Terraform plan, an admission request and a runtime authorization request have different schemas and different missing-value behavior. Document the adapter that converts the source into the policy's input, and test that adapter together with the rule.

For a hypothetical deployment policy, the requirement is that production resources have an accountable owner and an approved region. Build 36 fixtures: twelve valid cases, twelve deliberate violations and twelve incomplete or malformed inputs. Suppose a candidate policy correctly handles 32 and misclassifies four incomplete cases. Accuracy over the fixture set is 32/36 = 88.9%, but the four failures can invalidate enforcement regardless of the aggregate. The figure partitions expected cases rather than claiming a production detection rate.

Use current Rego syntax and pin the toolchain used by the project. A language upgrade can change which constructs are accepted or how the test runner behaves. The article's examples should identify whether they are conceptual input models or runnable code against a specified adapter. A generic field named `resource` is not automatically the shape of a Terraform plan.

## Build the policy's decision contract

The worksheet should contain the control objective, input schema, allow and deny outputs, reason codes, data freshness and policy version. Decide how missing input is handled. An undefined result must not accidentally become permission because the caller assumes anything except an explicit denial is safe. Conversely, indiscriminate denial on every data-source outage may block critical recovery, so failure behavior needs a deliberate resource-specific decision.

For an isolated exercise, create JSON fixtures for an allowed resource, an unapproved region, an empty owner, a missing owner and an exception with an expired timestamp. Run the policy tests through the same toolchain used in CI. Check both the decision and the explanation. A stable reason code helps callers route remediation without parsing an English sentence that may change.

Test the enforcement integration separately. A correct OPA decision has no preventive effect if the pipeline ignores its exit status or a separate deployment path bypasses it. Verify that an expected denial stops the intended operation and that a valid request still proceeds. Retain a known failing fixture as a health check for the complete evaluation path.

## Roll out policy like a dependency

Start with a bounded rule and a representative pilot population. Audit mode can provide useful detective control and rollout evidence when findings have owners and deadlines. It is not inherently useless, but it should not be reported as preventive enforcement. Before switching modes, inspect existing violations and determine whether they reflect genuine risk, unsupported cases or a rule error.

Version policy bundles and record which version produced each decision. A rule update can break a deployment as surely as an API change. Test compatibility, publish the behavior change and provide a narrowly scoped rollback or exception process. Avoid a global bypass when one workload needs a temporary deviation.

Exceptions should include scope, reason, compensating control, approver and expiry. Test expiration with a fixture so a waiver cannot remain effective because an integration forgot to evaluate time. Keep expired and repeatedly renewed exceptions visible as product feedback about the rule or supported platform path.

## Preserve the boundary of the evidence

A CI report demonstrates that a particular input was evaluated by a particular policy version at a particular time. It does not prove that every deployed resource remained compliant throughout a review period. Pair preventive checks with inventory, deployed-state assessment and protected history where the requirement needs them.

Measure decision latency, evaluation failures, unexpected denials and unresolved findings in addition to rule count. A repository containing hundreds of rules can provide less useful coverage than a small suite whose inputs, owners and response paths are understood. The objective is an explainable decision that reaches the correct enforcement point, backed by tests that remain meaningful as the surrounding infrastructure changes.

| Observation | Value (fixtures) |
| --- | ---: |
| Valid inputs | 12 |
| Deliberate violations | 12 |
| Incomplete inputs | 12 |

**Figure method.** Synthetic suite totals 36 fixtures. Candidate handles 32/36=88.9%; four failed incomplete-input cases block release. Fixture coverage is not production threat coverage.

## Further reading

- [OPA policy testing](https://www.openpolicyagent.org/docs/policy-testing)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
- [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final)
