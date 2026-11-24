---
title: "Kubernetes is not the wrong answer. It is often the answer to a question you have not asked yet."
description: "The question is not whether Kubernetes is technically capable of running your workload. It is."
date: 2029-03-30
tags: ["Cloud Architecture", "Engineering Leadership"]
format: note
derived: true
---

The question is not whether Kubernetes is technically capable of running your workload. It is. The question is what operating Kubernetes costs a team that does not have a dedicated platform function.

Kubernetes requires someone to care about it continuously. Node upgrades, networking policies, Ingress controller configuration, certificate management, secret rotation, horizontal pod autoscaler tuning, PodDisruptionBudget definitions. That work is real. On a team of five, that work competes directly with product delivery.

Managed alternatives — ECS on Fargate, Cloud Run, Azure Container Apps — eliminate most of that operational surface. They are not as flexible. They do not let you run arbitrary workloads with arbitrary scheduling requirements. But for the workload profile of most small teams, that flexibility is not needed.

The adoption decision should start with load pattern and team structure. If you have multiple workloads with genuinely different scaling profiles, stateful and stateless services, batch and long-running processes all colocated — Kubernetes may justify its operating cost, subject to an explicit comparison. If you have a web application, a background worker, and a scheduler — a managed service handles that without a platform engineer.

The teams that run Kubernetes well at small scale share one characteristic: someone owns it as a product, not as infrastructure that was set up once. That person drives upgrades, monitors cluster health, and maintains the standards. Without that ownership model, Kubernetes becomes technical debt with a CNCF logo.

## Budget platform work against available capacity

Model ownership as scheduled work rather than an enthusiastic volunteer's spare time. In a hypothetical five-person team with 120 available engineering hours per person each month, total capacity is 600 hours. A cluster operating allocation of 60 hours consumes 10%; a managed application service allocation of 24 hours consumes 4%. The 36-hour difference is opportunity cost, not proof that either design meets the workload's requirements.

Create a one-page monthly ledger covering upgrades, vulnerability response, workload troubleshooting, access reviews and restore rehearsals. Keep platform work separate from product changes so it is visible in planning. Include a second trained responder and document how responsibilities transfer during leave; a named expert without backup is still a concentration of risk.

Then test the capability that motivates Kubernetes. If the requirement is a custom scheduling constraint, reproduce it on a disposable cluster and verify how it behaves when matching capacity disappears. If the requirement is merely running a web process and a queue consumer, compare deployment and recovery on a managed alternative. Choose using observed constraints and sustainable ownership. A small team can operate Kubernetes successfully, but team size or service count alone cannot establish the business case.

| Observation | Value (hours/month) |
| --- | ---: |
| Team capacity | 600 |
| Cluster allocation | 60 |
| Managed allocation | 24 |

**Figure method.** Synthetic capacity: 5 people×120 hours=600; 60/600=10%; 24/600=4%; allocation difference=36 hours. Not a general staffing benchmark.

## Further reading

- [Kubernetes production environment](https://kubernetes.io/docs/setup/production-environment/)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
