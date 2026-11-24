---
title: "Platform Adoption: Remove the Friction Developers Actually Face"
description: "Observe a real onboarding journey, separate waiting from hands-on work and test whether a focused improvement helps."
date: 2029-07-09
tags: ["Platform Engineering", "Engineering Leadership"]
format: note
derived: true
---

An internal platform earns sustained use when it helps developers complete work safely and predictably. Adoption depends on technical capability, usability and organizational requirements. Mandated controls may be legitimate, but a mandate does not remove the need to understand where the supported path wastes time.

## Follow one journey before building another interface

In a hypothetical onboarding exercise, a developer spends 40 minutes configuring a project, waits 25 minutes for an access decision and spends 15 minutes deploying. Sequential elapsed time is 80 minutes. A preapproved access path reduces the wait to five minutes, producing a 60-minute journey: a 25% elapsed-time reduction. Hands-on configuration and deployment remain 55 minutes, so reporting a 25% reduction in engineering effort would be misleading.

The chart shows the original stages and the revised access wait. These illustrative values explain how to choose an improvement; they do not establish an industry onboarding target.

## Run an observation worksheet

Ask a new participant to deploy a harmless representative service using the published instructions. Record the starting prerequisites, each interruption, hands-on work, waiting and support. Define success as a qualifying service with the required identity, ownership, deployment and diagnostic evidence, not simply a green pipeline.

Change one repeated obstacle and observe another comparable attempt. Preserve abandoned attempts and note differences in participant experience. If the improvement merely moves work from the platform team to developers, make that visible. The next investment should follow the observed constraint: access workflow, documentation, local setup or deployment behavior. A portal is useful when it improves that journey, rather than becoming another place to request help.

| Observation | Value (minutes) |
| --- | ---: |
| Project setup | 40 |
| Original access wait | 25 |
| Deployment | 15 |
| Revised access wait | 5 |

**Figure method.** Synthetic sequential journey: 40+25+15=80 minutes; revised=40+5+15=60; reduction=20/80=25%. Hands-on work stays 55 minutes; waiting and effort are different measures.

## Primary references

- [The Twelve-Factor App](https://12factor.net/)
- [AWS architectural review](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
