---
title: "Cloud Cost Optimisation Is Not a Project — It's an Engineering Practice"
description: "The cloud cost optimization initiative that runs for three months, produces savings, and then stops is a project. The engineering practice that embeds cost awareness into how systems are built and operated is what actually works."
date: 2028-07-28
tags: ["FinOps", "Engineering Leadership"]
format: article
---

The cloud bill has grown. Leadership notices. A project is initiated: a team of engineers and a FinOps specialist spend three months identifying waste, right-sizing instances, purchasing reserved capacity, and eliminating unused resources. Cloud spend drops 35%.

Six months later, cloud spend has returned to 95% of the pre-initiative level.

This is not a failure of execution. It is a predictable outcome of treating cost optimization as a project rather than a practice.

## Why projects do not hold the gains

Cloud cost optimization produces savings by finding and eliminating inefficiency. Projects find the inefficiency that exists at the time they run. They do not prevent new inefficiency from accumulating after they complete.

New services are provisioned with default (oversized) configurations. Development environments are left running over weekends. Services that were launched experimentally remain running after the experiment ends. Cache layers are sized based on estimates that were never revised after deployment. None of this is malicious — it is the natural behavior of a team building quickly without cost feedback.

A project that runs every 12 months catches this accumulation once a year. A practice embeds the feedback earlier.

## What the practice looks like

**Cost visibility in the build process.** Engineers who can see the projected monthly cost of a Terraform change before applying it make different decisions than engineers who find out three months later. Tools like Infracost integrate cost estimation into CI pipelines.

**Tagged resources with team ownership.** If every resource has a team tag, the monthly cost report can be broken down by team. This creates accountability without requiring a central FinOps team to chase individual engineers.

**Weekly cost review as a standing agenda item.** Not a separate meeting — 10 minutes in an existing sync. Teams that review their cloud costs weekly build intuition for what normal looks like and notice anomalies faster.

**Reserved capacity as a planning activity.** Reserved instances and savings plans should be reviewed when roadmaps are reviewed, not once a year in a separate process. Capacity commitments and product commitments should be aligned.

**Decommissioning as part of completion.** A feature flag retired without the underlying infrastructure being removed is a cost leak. The definition of done for any feature should include infrastructure cleanup.

The organizations that compound cost savings year over year are not running better optimization projects. They are building teams where cost awareness is a normal part of engineering judgment.
