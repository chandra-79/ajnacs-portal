---
title: "Helm in Production: Chart Design, Values Discipline, and Life Under GitOps"
description: "Helm remains Kubernetes' package manager by default and its templating engine by necessity. How to design charts that stay maintainable, run a values hierarchy that scales past ten teams, and the umbrella-chart and hook pitfalls that fill postmortems."
date: 2028-01-17
tags: ["Containers", "Helm", "Platform Engineering", "GitOps"]
format: article
---

Helm occupies an odd position in the Kubernetes toolchain: routinely criticized (text-templating YAML is nobody's idea of elegance), routinely predicted to be replaced, and still — years into those predictions — the way most third-party software installs into most clusters and the way most platform teams package their golden paths. Tools this durable deserve operational respect rather than fashionable disdain. Here's how to run Helm like it's load-bearing, because it is.

## Chart design: the library mindset

The charts that age well are designed like software libraries, not like YAML with holes punched in it.

**A small, opinionated values surface.** The chart that exposes every Kubernetes field as a value has no opinion and pushes all complexity onto every consumer; the chart that exposes twelve values — image, resources, replicas, ingress host, env vars, and a handful of deliberate feature toggles — encodes the platform team's opinion and makes the right thing the short thing. Provide an escape hatch for the long tail (a `podSpecOverrides`-style passthrough merged late) rather than growing a value per request; the values file is an API, and APIs grow by design review, not accretion.

**Validate at the door.** `values.schema.json` turns "typo in the values file" from a runtime mystery into an install-time error with a message. Combined with `helm lint` and a rendered-manifest check (`helm template | kubeconform`) in chart CI, most classes of bad chart change die before any cluster meets them. Charts without schemas are still the norm in the wild; internally, there's no excuse.

**Template hygiene:** helpers (`_helpers.tpl`) for every repeated construct (names, labels, selectors — the standard label set on every resource, once, correctly); `include` over `template` (it composes with pipelines); explicit `toYaml | nindent` for structures rather than string interpolation; and *no logic that requires a comment to understand* — when a template needs three nested conditionals, that's the chart asking for either a schema'd value or a second chart. Resist the sub-chart-of-sub-charts tower: umbrella charts (one chart depending on many) are legitimate for packaging a product of several services, but as an *environment* composition mechanism they couple release cadences and turn every upgrade into a convoy; GitOps composition (many releases, one repo) does that job better.

**Version like you mean it.** Chart version (SemVer, bumped on every change, breaking changes major) is distinct from appVersion (the software inside); changelogs per chart; and immutable published versions in a real registry — OCI registries are now the standard distribution channel, giving charts the same provenance, signing (cosign), and lifecycle tooling as images. Internal platform charts deserve the same supply-chain treatment as internal images, because a poisoned chart is `kubectl apply` with extra steps.

## Values at scale: the hierarchy problem

The chart is half the system; the other half is how values flow. A single service in a real estate has values from: chart defaults, platform-wide policy (registry mirrors, security contexts, label taxonomies), environment (replicas, resource tiers, endpoints), and service-specifics — and the failure mode is those layers living in a directory of `values-prod-final-v2.yaml` files whose merge order exists only in a pipeline script.

The disciplines that keep it legible: **an explicit, documented layering order** (defaults → platform → environment → service, merged in exactly that sequence, ideally by the GitOps tool's native mechanisms — Argo CD multiple-sources / Flux HelmRelease valuesFrom); **no secrets in values, ever** (values files are the most-shared, most-logged, most-diffed artifacts in the pipeline; secrets ride External Secrets/SOPS as established elsewhere); and **diff-driven review** — the merge gate for a values change shows the *rendered manifest diff* (helm-diff, or Argo CD's built-in), because reviewing YAML-that-generates-YAML without rendering is how a one-line indentation slip removes every resource limit in production and passes review looking tidy.

## Life under GitOps: Helm as template engine, not deployer

The quiet architectural shift of the GitOps era: in Argo CD and Flux estates, **Helm's release machinery gives way to Helm's rendering machinery** — Argo renders charts to manifests and reconciles them itself (no Tiller-descended release objects, no `helm rollback`; git revert is the rollback), while Flux's HelmRelease keeps true Helm releases under a controller. Either way, two Helm habits need re-examination under reconciliation:

**Hooks.** Helm hooks (pre-install, pre-upgrade — the classic home of database migration Jobs) behave differently across plain Helm, Flux, and Argo (which maps them onto its own sync-wave model, mostly-but-not-exactly equivalently). The resilient pattern: keep hook usage minimal and idempotent, prefer explicit sync-waves/dependency ordering in the GitOps layer, and design migration Jobs to be safe when re-run — because under reconciliation, "exactly once" is not a promise anyone is making.

**Lookup and randomness.** `lookup` calls and `randAlphaNum`-style generation render differently (or emptily) depending on who's rendering and when — a chart that generates a random password at template time regenerates it at every reconcile, with results ranging from comic to outage. State belongs in operators or external secret managers; templates should be pure functions of their values.

## Third-party charts: adopt, but quarantine

Community charts are enormous accelerators and unreviewed root access, simultaneously. The estate rules: **pin exact versions** (never track latest); **mirror into your own registry** (availability plus a scan/review checkpoint); **render and read** what a chart actually creates before first install — cluster roles, webhooks, and privileged DaemonSets hide in respectable charts; and **wrap, don't fork** — carry your policy (values overrides, added NetworkPolicies) in a thin internal wrapper chart or post-render step (kustomize-as-post-renderer covers the awkward gaps), so upstream upgrades stay cheap. The fork you made to change two labels in 2023 is the unpatched CVE you'll own in 2026.

The summary that fits on a sticky note: treat charts as versioned software with schemas and CI; treat values as a designed API with an explicit merge order; treat rendered-diff review as the merge gate; let the GitOps layer own ordering and rollback; and treat third-party charts like third-party code, because that's what they are. Helm's ergonomics will keep being argued about; estates that run it with this discipline stop noticing — the packaging layer goes quiet, which is all anyone ever wanted from it.
