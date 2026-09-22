---
title: "GitOps in the Enterprise: Argo CD, Flux, and the Operating Model That Makes Them Work"
description: "GitOps turned deployment from a push script into a reconciliation loop. What that actually changes operationally, how Argo CD and Flux differ, the repo structures that scale past ten teams, and the failure modes nobody puts in the demo."
date: 2027-11-03
tags: ["Platform Engineering", "GitOps", "Containers", "Deployment"]
format: article
---

GitOps is one of those terms that arrived with more marketing than definition, which is a shame, because underneath the branding is a genuinely better operating model for Kubernetes estates: **desired state lives in git; an in-cluster agent continuously reconciles reality toward it; drift is detected and corrected rather than accumulated.** Deployment stops being "CI pushes kubectl commands at clusters" and becomes "merge a change; the system converges."

Here's what that shift actually buys, how the two major tools differ, and where enterprise implementations wobble.

## What changes when you invert the pipeline

Traditional CD *pushes*: a pipeline holds cluster credentials and imperatively applies changes. GitOps *pulls*: an agent inside the cluster (with no inbound access required) watches repositories and converges. The consequences are bigger than they sound.

**The audit story becomes the git log.** Every production change is a commit with an author, a review, and a diff; every rollback is a revert. For regulated environments this collapses a whole compliance apparatus — change tickets reconstructed after the fact — into infrastructure that generates its own evidence.

**Drift dies.** The kubectl-edit hotfix at 3 AM, the "temporary" replica bump from March — the reconciler either reverts them (self-heal on) or surfaces them loudly (drift detection). Clusters stop diverging from their documentation because the documentation *is* the actuating artifact.

**Credentials centralize and shrink.** CI systems — the most-compromised link in modern supply chains — no longer hold god-mode kubeconfigs for every cluster. They build images and update manifests; only the in-cluster agent applies.

**Disaster recovery becomes cloning.** A cluster's entire workload definition lives in repos; rebuilding it is bootstrap-agent-plus-point-at-repo. Estates that have exercised this describe it as the moment GitOps paid for itself.

The tax: you've introduced eventual consistency into deployment ("merged" no longer means "live"), and everyone's mental model has to move from *imperative actions* to *desired-state convergence* — which is precisely the maturity Kubernetes already demanded, now applied end-to-end.

## Argo CD vs Flux: a real difference in philosophy, a small one in outcome

Both are CNCF-graduated, production-proven at scale, and either is a defensible choice. The differences that matter in selection:

**Argo CD** ships an opinionated experience: a first-class UI showing sync state, resource trees, and diffs; the Application/ApplicationSet abstractions for stamping deployments across fleets of clusters and teams; built-in SSO/RBAC aimed at multi-tenant platform teams. In organizations where many teams of mixed Kubernetes fluency consume the platform, Argo's visual model measurably lowers support load — engineers can *see* why something is out of sync. Rollouts (its progressive-delivery sibling) adds canary/blue-green analysis in the same ecosystem.

**Flux** is a set of composable controllers (sources, kustomizations, Helm releases, image automation, notifications) with no UI opinion — a toolkit that disappears into a platform. It's leaner, deeply Kubernetes-native (everything is a CRD; nothing exists outside the API), and favored where platform teams build their own developer experience on top or want minimal moving parts. Its image-update automation (watch a registry, commit tag bumps back to git) closes the CI→GitOps loop natively.

The honest tiebreakers: choose Argo CD when the UI and multi-tenant RBAC are load-bearing for your org; choose Flux when you're composing a platform and want unopinionated primitives. Outcomes at steady state converge — the operating model matters far more than the agent.

## The repo and environment architecture (where designs actually differ)

The decisions that determine whether GitOps scales past the pilot:

**Separate application code from deployment config.** The app repo builds images; a config repo (or directory tree) holds manifests/Helm values per environment. This keeps deploy changes reviewable by the right owners and lets CI write "bump image tag" commits without touching source repos.

**Environments as directories, not branches.** The branch-per-environment model (merge dev→staging→prod) seduces with familiarity and then delivers merge-conflict promotion, divergent histories, and cherry-pick archaeology. The pattern that survives: one branch, `envs/dev|staging|prod/` directories sharing a base (Kustomize overlays or Helm value layers), promotion as a small PR copying a version bump forward — reviewable, diffable, revertible.

**App-of-apps / ApplicationSets for fleet shape:** a root application declares which applications exist per cluster; onboarding a team or standing up cluster #14 is a PR, not a runbook.

**Secrets get decided early, deliberately.** Plaintext secrets in git is the disqualifying mistake; the workable patterns are External Secrets Operator (reference a vault/cloud secret manager — the current default recommendation), or SOPS/sealed-secrets (encrypted-in-repo) where an external manager isn't available. Pick one, standardize, and audit for stragglers.

## The failure modes the demo omits

**The sync loop fight:** an HPA adjusts replicas, GitOps reverts them, forever — any controller that mutates spec fields will duel the reconciler. Fixes are mundane (ignore-differences on those fields, or don't declare what another controller owns) but must be policy, or each team rediscovers the duel independently.

**Eventual consistency meets human expectations:** "I merged, where is it?" needs an answer — sync status surfaced in the developers' tooling (PR comments, Slack notifications, the Argo UI) — or trust erodes and people route around the system.

**Helm hooks and jobs behave differently under reconciliation** than under `helm install`; database-migration Jobs especially need explicit sequencing (sync waves, pre-sync hooks) and idempotency, or upgrades race their own schema changes.

**Repo sprawl and RBAC drift:** by team twenty, who may change what in the config monorepo (or across forty config repos) is a governance surface of its own. CODEOWNERS per environment directory, protected paths for cluster-scoped resources, and periodic access review — the boring machinery, applied to the new control plane, because that's what the config repo now is: **your control plane.** Protect it like one — branch protection, signed commits where the bar is high, mandatory review for prod paths, and an understanding that a compromise of that repo is a compromise of every cluster it feeds.

**And the cultural one:** GitOps fails softly when leadership funds the agent but not the migration — half the estate reconciling, half still kubectl-applied, drift alarms ignored because "that namespace is special." The value proposition is categorical (everything converges, everything audits); carve-outs decay it fast. Timebox the exceptions with owners and dates.

## The adoption sequence that works

Start with one platform-owned cluster and the platform's own components (ingress, cert-manager, monitoring) — infrastructure-as-GitOps before application teams arrive. Establish the repo structure, secrets pattern, and promotion flow while the blast radius is yours alone. Then onboard two pilot application teams end-to-end (image build → automated tag bump → PR promotion → notified sync), write the golden-path documentation from their friction, and only then open the floodgates with ApplicationSets and self-service onboarding. Estates that invert this — mass migration first, patterns later — spend a year consolidating forty artisanal GitOps layouts into one.

The quiet endgame: deployment stops being an *event* anyone performs and becomes a *property* the system maintains — git as the single writable surface, clusters as read replicas of intent. Once that's true, the interesting conversations move up a level, to what should be declared — which is exactly where an engineering organization's attention belongs.
