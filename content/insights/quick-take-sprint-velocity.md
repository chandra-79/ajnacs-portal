---
title: "Sprint Velocity Is the Metric That Confidently Measures the Wrong Thing"
description: "Velocity measures story points completed per sprint. It does not measure value delivered, code quality, sustainability, or team health. Here is what to track instead."
date: 2029-01-22
tags: ["Engineering Leadership"]
format: article
---

Sprint velocity is the most commonly tracked engineering metric in Agile teams and, simultaneously, one of the least useful ones.

Velocity measures how many story points a team completes in a sprint. It is useful for one specific purpose: predicting how much work a team can complete in a future sprint, given similar scope and similar team composition. For that purpose, it is reasonably effective.

For any other purpose — measuring productivity, comparing teams, setting targets, evaluating performance — it is actively harmful.

## Why velocity is misleading as a productivity metric

**Story points are relative and local.** A 5-point story on one team is not the same as a 5-point story on another team. Teams calibrate their own scales independently. Comparing velocity across teams compares apples and the concept of fruit.

**Velocity is gameable.** When velocity becomes a target rather than a measurement, teams estimate higher. This inflates velocity numbers while leaving actual throughput unchanged. The team that has a 40-point velocity after six months of pressure is likely not delivering twice as much value as when their velocity was 20. They have inflated their estimates.

**Velocity measures completion, not value.** A team that completes 50 points of work that turns out to be unnecessary features has high velocity and zero business value. A team that spends a sprint doing discovery and retiring 20 bad ideas has low velocity and enormous value.

**Velocity hides technical debt accumulation.** A team can maintain high velocity by cutting corners on testing, documentation, and architecture. The velocity stays high. The codebase degrades. Eventually the debt comes due, velocity collapses, and everyone is surprised.

## What to measure instead

**Lead time:** time from feature request to production. Measures the delivery pipeline efficiency.

**Deployment frequency:** how often the team deploys to production. High deployment frequency with acceptable change failure rate indicates a healthy, confident team.

**Change failure rate:** what percentage of deployments require a hotfix or rollback. A proxy for code quality and testing effectiveness.

**Cycle time per work item type:** how long do bugs take to resolve? How long do features take from development start to production?

These measure the delivery system, not the team's willingness to point stories high.
