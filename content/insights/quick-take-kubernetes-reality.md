---
title: "Kubernetes: The Right Answer for Fewer Problems Than Its Adoption Rate Suggests"
description: "Kubernetes solves real problems at scale. It also creates real problems at small scale. Understanding what those problems are determines whether Kubernetes is right for your situation."
date: 2028-06-05
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: article
---

Kubernetes is the default infrastructure platform for a large fraction of new production deployments. Some of these deployments run workloads that genuinely benefit from Kubernetes. Many run workloads that would have been simpler, cheaper, and more reliably operated on managed services or single-server deployments.

The technology is not the problem. The reflexive adoption is.

## What Kubernetes is actually good at

Kubernetes is excellent when:

- You have many services that need consistent deployment, scaling, and networking primitives
- You need to run many containers on many nodes with efficient bin-packing
- You need sophisticated rollout strategies (canary, blue/green) across a fleet
- You have platform engineering investment to maintain the cluster and the tooling around it
- Your team has the expertise to operate it — which means debugging scheduler decisions, understanding network policies, troubleshooting pod evictions and resource pressure

At scale, Kubernetes delivers genuine operational efficiency. At small scale, it delivers operational complexity in exchange for capabilities you are not using.

## What Kubernetes costs at small scale

A Kubernetes cluster requires:

- A control-plane availability design appropriate to the implementation; managed services may operate this layer, while self-managed clusters need explicit quorum and failure-domain planning
- Worker nodes sized for the workload plus scheduling overhead
- A networking plugin (Calico, Cilium, Flannel) that adds a configuration layer
- An ingress controller
- A logging solution that understands container logs
- A monitoring stack that understands Kubernetes metrics
- Engineers who can debug all of the above when something goes wrong

For a team of four engineers deploying three services, this is a significant operational burden relative to the workload. A managed container service or simpler VM deployment may reduce the operating burden, but compare workload constraints, recovery behavior and total costs rather than assuming a fixed advantage.

## The right question

Kubernetes is not wrong. "Should we use Kubernetes for this?" is the right question to ask, and the answer should be derived from the workload and team, not from what the industry is doing.

The signal that Kubernetes is the right answer: you are feeling pain around inconsistent deployments across services, manual scaling, and cross-service networking — and you have the engineering investment capacity to adopt Kubernetes properly. Not halfway, with a misconfigured cluster that nobody fully understands. Properly.

Complexity has carrying costs. Make sure the benefits are real before you pick them up.

## Compare the ownership obligations before the feature list

A managed Kubernetes control plane changes who operates some components; it does not remove the team's duties for workload identity, add-ons, node pools where applicable, resource requests, rollout safety and application recovery. Conversely, a self-managed control plane's topology depends on the chosen availability design. Counting three machines without explaining quorum, failure domains and upgrade procedures is not an architecture review.

Use a hypothetical workload consisting of six APIs and two workers. During a four-week evaluation, record the time spent on deployment configuration, platform maintenance and incident exercises. Suppose Kubernetes needs 24, 20 and 12 hours respectively. A managed application platform needs 16, 6 and 10 hours. Total observed effort is 56 versus 32 hours, a difference of 24 hours for that period. These synthetic figures do not establish which platform is cheaper over a year. The first period includes learning, and a larger service fleet may amortize common work differently.

The exercise is to reproduce the same operational outcomes on both candidates: roll back a broken build, rotate a credential, recover after a worker disappears and expose an application health signal. Record hands-on time separately from elapsed waiting time. A platform that completes deployment quickly but requires an expert during recovery may have transferred effort rather than removed it.

## Treat scheduling requirements as test cases

Write down the concrete requirements that could justify Kubernetes: a particular operator, GPU scheduling constraint, portability boundary or policy mechanism. Test the requirement rather than assuming its presence means the whole platform is suitable. Canary releases and autoscaling are available in multiple systems; neither is unique to Kubernetes.

Inspect the busiest worker's resource requests and observe an intentional node drain in an isolated test cluster. Verify that replacement capacity exists and that disruption budgets do not make maintenance impossible. An application with one replica cannot gain workload redundancy from a highly available control plane alone. Also test the route back to a simpler deployment: image portability is useful, but secrets, storage, networking and rollout semantics still need translation. End the evaluation with an accountable service owner, an upgrade calendar and an explicit reason for accepting the remaining operational load.

| Observation | Value (hours) |
| --- | ---: |
| Kubernetes trial | 56 |
| Managed app trial | 32 |
| Difference | 24 |

**Figure method.** Synthetic four-week effort: Kubernetes 24+20+12=56 hours; managed platform 16+6+10=32; difference 24. Learning effects and future scale are excluded.

## Further reading

- [Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
