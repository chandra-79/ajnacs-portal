---
title: "Kubernetes is not the wrong answer. It is often the answer to a question you have not asked yet."
description: "The question is not whether Kubernetes is technically capable of running your workload. It is."
date: 2025-08-13
tags: ["Cloud Architecture", "Engineering Leadership"]
format: note
---

The question is not whether Kubernetes is technically capable of running your workload. It is. The question is what operating Kubernetes costs a team that does not have a dedicated platform function.

Kubernetes requires someone to care about it continuously. Node upgrades, networking policies, Ingress controller configuration, certificate management, secret rotation, horizontal pod autoscaler tuning, PodDisruptionBudget definitions. That work is real. On a team of five, that work competes directly with product delivery.

Managed alternatives — ECS on Fargate, Cloud Run, Azure Container Apps — eliminate most of that operational surface. They are not as flexible. They do not let you run arbitrary workloads with arbitrary scheduling requirements. But for the workload profile of most small teams, that flexibility is not needed.

The adoption decision should start with load pattern and team structure. If you have multiple workloads with genuinely different scaling profiles, stateful and stateless services, batch and long-running processes all colocated — Kubernetes pays for itself. If you have a web application, a background worker, and a scheduler — a managed service handles that without a platform engineer.

The teams that run Kubernetes well at small scale share one characteristic: someone owns it as a product, not as infrastructure that was set up once. That person drives upgrades, monitors cluster health, and maintains the standards. Without that ownership model, Kubernetes becomes technical debt with a CNCF logo.
