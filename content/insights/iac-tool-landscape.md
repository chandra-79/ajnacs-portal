---
title: "Infrastructure as Code Beyond Terraform: The Tool Landscape and the Decisions That Matter More"
description: "Terraform's license drama, OpenTofu's fork, Pulumi's general-purpose languages, Crossplane's control-plane model, and the cloud-native templates — a placement guide, plus the state, module, and drift disciplines that outweigh the tool choice."
date: 2027-12-06
tags: ["Platform Engineering", "Infrastructure as Code", "Cloud Architecture", "Infrastructure"]
format: article
---

The infrastructure-as-code conversation spent a decade being simple — "use Terraform" — and then got interesting again: the 2023 license change and the **OpenTofu** fork split the default, **Pulumi** made real programming languages a serious alternative to HCL, **Crossplane** reframed IaC as Kubernetes-style control planes, and the AI-assistance wave changed what "writing infrastructure code" even means. The tool question deserves an honest map — and then a demotion, because the practices around state, modules, and drift determine outcomes far more than the syntax does.

## The landscape, placed

**Terraform/OpenTofu** remain the center of gravity: declarative HCL, the plan/apply workflow that made infrastructure changes *reviewable*, and the provider ecosystem nothing else matches. The fork question is mostly governance, not capability — OpenTofu (Linux Foundation, open license) tracks feature parity and adds its own (state encryption arrived there first), and enterprises choose between them on licensing posture and vendor relationships rather than engineering merit. HCL's limits are real (expressiveness strains at loops-and-logic; the `count`/`for_each` gymnastics genre exists because a configuration language is being asked to program), but the constraint is also the virtue: HCL configurations are *legible as inventory* in a way general-purpose code isn't.

**Pulumi** answers the expressiveness complaint directly: infrastructure in TypeScript/Python/Go/etc., with real abstractions, real testing frameworks, and the same cloud providers underneath (it wraps the Terraform provider ecosystem where needed). It shines where infrastructure *is* software — dynamic environments, complex conditional topologies, platform teams building infrastructure APIs for others — and where the team's identity is developers-who-do-infra rather than ops-who-code. The trade: general-purpose power invites general-purpose complexity (the infrastructure codebase that needs its own architecture review), and the legibility-as-inventory property degrades exactly as cleverness rises — the same tension every DSL-vs-library debate carries.

**Crossplane and the control-plane school** change the model rather than the language: infrastructure declared as Kubernetes custom resources, *continuously reconciled* by controllers — not applied-then-drifting but converged-forever, the GitOps reconciliation philosophy extended from workloads to cloud resources. Its sweet spot is the platform-engineering pattern: platform teams define **compositions** (opinionated abstractions — "a database" that expands to the fully-governed RDS-plus-networking-plus-monitoring bundle), and application teams claim them self-service, with the paved-road governance built into the abstraction (the golden-path machinery, applied to infrastructure). The costs: Kubernetes as a hard dependency for your infrastructure control plane (with its own availability stakes), and a maturity curve steeper than the demo suggests. The cloud-native templates (CloudFormation/Bicep/CDK) round out the map as the single-cloud loyalists' option — deep provider integration, no multi-cloud story, with CDK sharing Pulumi's languages-over-configuration bet.

The placement heuristic: **Terraform/OpenTofu as the default estate backbone; Pulumi where infrastructure logic is genuinely programmatic; Crossplane where a platform team is productizing infrastructure for many consumers; cloud-native templates where single-cloud depth beats portability.** Mixed estates are normal and fine — what must be singular is the *workflow* discipline below.

## The disciplines that outweigh the tool

**State is production data — treat it accordingly.** Remote backends with locking, encryption, and access control (state files contain secrets and the complete map of your estate — the security review applies); state *segmentation* as blast-radius design (the monolithic state file where a typo's plan touches everything is the IaC equivalent of the shared database — split by environment and domain, with explicit cross-state references); and state surgery (imports, moves, refactors) as rehearsed, scripted operations, because the day you must rename a resource without destroying it is not the day to learn `state mv`.

**Modules are an API surface — govern them like one.** The internal module registry is the paved road's implementation: versioned (SemVer, changelogs — consumers pin and upgrade deliberately, the dependency disciplines verbatim), opinionated (the module encodes the security-and-tagging policy so consumers can't forget it — policy *products*, not policy documents), and tested (plan-diff tests at minimum, ephemeral-environment apply tests for the critical ones). The anti-pattern registry: the copy-paste module estate (forty divergent copies of "the VPC module" — the polyrepo drift problem in miniature) and the god-module whose fifty variables make every consumer an expert in its internals.

**The pipeline is the control plane.** Plans posted to PRs (the rendered-diff review discipline — infrastructure changes reviewed as *predicted effect*, not as HCL aesthetics), policy-as-code gates (OPA/Sentinel-class checks rejecting the public bucket, the untagged resource, the wrong-region deployment — the guardrails tier from IAM practice, enforced pre-apply), applies from CI only with short-lived cloud credentials (OIDC federation, never static keys — the workload-identity rules), and environment promotion as code motion (the same module version flowing dev→staging→prod, per the build-once principle). Console changes outside this path are incidents-in-waiting, which brings the last discipline:

**Drift is a signal, manage it explicitly.** Scheduled plan runs (or continuous reconciliation, where the Crossplane model applies) detecting the delta between declared and actual; drift triaged like the finding it is — either an unauthorized change (security conversation), an emergency fix that needs codifying (the retro item), or a provider-side mutation (the noise to suppress deliberately). Estates that don't watch drift are declarative in documentation only.

**And the AI-era note:** assistants generate plausible IaC prolifically, which raises the stakes on exactly the above — generated configurations reviewed as plans and policies (machines checking machines, per the SDLC-era verification shift), because a hallucinated-but-syntactically-valid security group is precisely the artifact the guardrail gates exist to catch.

The closing calibration: teams switch IaC tools hoping to escape pain that lives in their practices — the unsegmented state, the unversioned modules, the console cowboys, the missing policy gates. The tool choice is real but secondary; the workflow — reviewable plans, governed modules, gated applies, watched drift — is what separates the estates where infrastructure changes are boring from the ones where every apply is an adventure. Pick the tool for your team's shape, then spend the real effort where the outcomes are decided.

## Make the operating contract explicit

Infrastructure as code manages a declared relationship between configuration, tool state and provider resources. Drift is a disagreement among those views, not automatically evidence of misconduct. A service may have changed through an emergency procedure, another controller or a provider default. Classify the cause before choosing whether to restore the declaration or adopt the observed change. An automatic apply against unexplained drift can undo a necessary incident mitigation.

Treat saved plans and state as sensitive operational artifacts. They can include secrets or values that are not intended for general repository readers. Restrict access, retain the version and provider context, and make stale-plan rejection part of the execution workflow. State locking reduces concurrent writer conflicts where the backend supports it, but it does not replace ownership boundaries or prevent a separate tool from modifying the same resources.

Choose a tool by the operating contract it can support. A general-purpose language offers abstractions and testing libraries; a declarative language may make resource review easier. Either can become difficult to maintain when modules hide destructive behavior or teams apply changes outside the agreed pipeline. Compare import, replacement, drift review, state recovery and emergency access using one representative resource lifecycle. A successful initial deployment is only the first test.

## Review the lifecycle, including adoption and retirement

An infrastructure tool evaluation should include a resource that already exists. Import it into a test state, explain the generated or required configuration and compare the next plan with the live object. Adoption should not unexpectedly replace a healthy resource. Check which attributes the provider can read and which defaults the configuration must specify. A tool that creates an object easily may have a more demanding import or change-management story.

Retirement needs equal care. A resource may hold data or serve dependents that are not represented in the same state. A deletion plan is a proposal, not proof that the object is unused. Inventory consumers, retention obligations and recovery options. Test the retirement procedure with a harmless resource and make the approval boundary clear. For data-bearing resources, use the provider's supported protection and snapshot behavior where appropriate, while recognizing that protection flags can also block an urgent recovery operation.

Module versioning should describe behavior, not just packaging. A change to a default network rule can affect every consumer even if no variable was removed. Publish a meaningful change note and a representative plan difference. Consumers should know whether an upgrade adds resources, modifies them in place or may replace them. Automated tests can exercise the module contract, but provider behavior and existing state still require an integration path for consequential changes.

Choose dependency exchange deliberately. Reading another team's state can reveal more than its advertised outputs when the reader has access to the underlying state snapshot. Where the trust boundary is narrower, publish the required identifiers through an appropriate configuration or discovery interface. Avoid a dependency graph in which every application must read every platform state. The resulting access and coupling can be harder to manage than the configuration reuse it was intended to provide.

Capture the provider and tool versions in the experiment. A plan is interpreted through those versions and the provider's current view of remote objects. Upgrading a provider can introduce new defaults, validation or replacement behavior even when the resource configuration is unchanged. Review the upgrade as a separate change where its impact is consequential. Reproducibility also includes the credentials' scope and the environment selected by the runner; two plans using different accounts can both be syntactically valid while describing entirely different infrastructure.

For a destructive change, preserve the resource identifier and recovery artifact in the approval record. A later reviewer should be able to connect the proposed replacement with the object actually changed.

## Work through an illustrative scenario

A hypothetical estate contains 120 declared resources. A scheduled comparison finds twelve differences: five emergency edits awaiting reconciliation, four expected controller-managed fields and three unintended changes. Treating all twelve as identical remediation tasks would create work and risk. After recording the controller-owned fields and resolving the emergency edits, the team still has three genuine changes to investigate. The chart reports categories of differences rather than implying that every difference should be overwritten.

| Observation | Value (resource differences) |
| --- | ---: |
| Emergency edits | 5 |
| Controller-owned fields | 4 |
| Unintended changes | 3 |

**Calculation and limits.** Synthetic review of 120 resources with twelve observed differences. Each difference receives one primary category after investigation. Counts do not indicate severity and are not a production drift benchmark.

## Build the evidence worksheet

**Declared owner.** Identify the repository, module and team responsible for the resource lifecycle.

**Observed change.** Capture the provider resource identity and the specific field differences rather than only a plan summary.

**Change authority.** Link an emergency action or controller reconciliation to the actor and the reason for the change.

**State boundary.** Record backend isolation, locking support and the principals that can read or write state.

**Review decision.** Choose restore, adopt or investigate with a named approver and an explanation of the service impact.

**Recovery route.** Retain state versions and a tested procedure for recovering tool state without recreating healthy infrastructure.

## Rehearse the failure boundary

1. **Edit a sandbox resource.** Confirm that the next comparison identifies the actual changed field.

2. **Run competing plans.** Verify the backend and pipeline behavior under concurrent changes and reject stale execution.

3. **Restore a prior state copy.** Practice only in an isolated exercise and verify mappings before any provider mutation.

4. **Introduce a controller-owned field.** Decide explicit ownership instead of alternating two tools that continually overwrite each other.

## Sources for the mechanisms

- [Terraform resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)
- [Terraform tests](https://developer.hashicorp.com/terraform/language/tests)
