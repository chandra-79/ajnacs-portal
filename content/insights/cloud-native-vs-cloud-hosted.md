---
title: "Cloud native and cloud hosted are not the same thing. Treating them as equivalent is where most migrations go wrong."
description: "The language around cloud adoption conflates two genuinely different things, and the conflation produces unrealistic expectations that erode confidence in cloud programs."
date: 2029-04-04
tags: ["Cloud Architecture"]
format: note
derived: true
---

The language around cloud adoption conflates two genuinely different things, and the conflation produces unrealistic expectations that erode confidence in cloud programs.

Cloud-hosted means your workload runs on cloud infrastructure — virtual machines, cloud networking, cloud storage. The software architecture is unchanged. Operational patterns are largely unchanged. You have gained geographic flexibility and shifted capital expense to operational expense. You have not gained the elastic cost scaling, the operational leverage, or the resilience patterns of cloud-native design. The cost comparison depends on utilization, commitments, licensing, facilities, staffing and the accounting boundary; hosting location alone does not determine the result.

Cloud-native means the application is designed for and depends on cloud capabilities. Managed services replace self-managed infrastructure. Autoscaling is a design assumption, not an add-on. Failure is expected and handled by the architecture. The operational model is built around observability, immutability, and disposable compute.

These are different destinations with different costs, timelines, and organizational requirements. Cloud-hosted is achievable with a standard migration project. Cloud-native requires re-architecture, which is a software development effort, not an infrastructure project.

Organizations that plan cloud hosting but use cloud-native language in board presentations create a mismatch between executive expectations and engineering reality. The honest description of a lift-and-shift as a necessary first phase, with modernization as a subsequent program, is more credible and more manageable than framing it as a transformation when the first deliverable is a VM.

## Make replacement an acceptance test

The hosting location does not determine whether an application is resilient. A useful operational test asks whether a process can disappear without losing accepted work. For a hypothetical report service, 500 jobs are accepted, 460 complete before a worker restart, and 40 remain queued. After recovery, all 40 complete. The accounting is 460 + 40 = 500; the restart is successful only if output checks also establish that no job was duplicated or corrupted.

Repeat the exercise after moving transient state from local disk to an explicit durable store. Record which component acknowledges a job and when ownership transfers. If acknowledgment occurs before durable storage, a process crash can lose work even though the infrastructure automatically restarts it. If it occurs afterward, duplicate delivery may still require idempotent handling.

Use a worksheet with accepted, completed, pending, failed and duplicated counts, together with a clear observation cutoff. Do not count pending jobs as failures without stating the completion deadline. Cloud-native practices can be applied in private infrastructure as well as public clouds, and managed services retain customer responsibilities. Evaluate useful properties such as recoverable state, bounded retries and automated deployment directly; neither cost savings nor resilience follows automatically from the architectural label.

| Observation | Value (jobs) |
| --- | ---: |
| Accepted | 500 |
| Before restart | 460 |
| After recovery | 40 |

**Figure method.** Synthetic job ledger: 460 pre-restart completions+40 recovered completions=500 accepted. Requires separate duplicate and content checks; pending work uses an explicit deadline.

## Further reading

- [The Twelve-Factor App](https://12factor.net/)
- [Kubernetes production considerations](https://kubernetes.io/docs/setup/production-environment/)
