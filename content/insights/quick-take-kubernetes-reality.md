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

- At least three control plane nodes for high availability (or accepting the risk of a single-node control plane)
- Worker nodes sized for the workload plus scheduling overhead
- A networking plugin (Calico, Cilium, Flannel) that adds a configuration layer
- An ingress controller
- A logging solution that understands container logs
- A monitoring stack that understands Kubernetes metrics
- Engineers who can debug all of the above when something goes wrong

For a team of four engineers deploying three services, this is a significant operational burden relative to the workload. The equivalent on a managed container service (AWS ECS, Google Cloud Run, Azure Container Apps) or on three EC2 instances with a deployment script is dramatically simpler, less expensive, and easier to debug.

## The right question

Kubernetes is not wrong. "Should we use Kubernetes for this?" is the right question to ask, and the answer should be derived from the workload and team, not from what the industry is doing.

The signal that Kubernetes is the right answer: you are feeling pain around inconsistent deployments across services, manual scaling, and cross-service networking — and you have the engineering investment capacity to adopt Kubernetes properly. Not halfway, with a misconfigured cluster that nobody fully understands. Properly.

Complexity has carrying costs. Make sure the benefits are real before you pick them up.
