---
title: "Your cloud tagging problem is an organizational problem, not a technical one"
description: "Most enterprises have a tagging standard. Most enterprises also have significant tagging gaps. The standard exists; the compliance doesn't."
date: 2025-12-05
tags: ["FinOps", "Cloud Architecture", "Engineering Leadership"]
format: note
derived: true
---

Most enterprises have a tagging standard. Most enterprises also have significant tagging gaps. The standard exists; the compliance doesn't. This isn't a tooling problem — every major cloud provider has comprehensive tagging capabilities. It's an accountability problem.

Tagging gaps persist because the team provisioning resources and the team accountable for cloud spend are frequently different people. When there's no direct consequence for creating an untagged resource — no blocked deployment, no visible gap in cost reporting, no team-level accountability — tags become suggestions.

The technical fix is straightforward: use Azure Policy, AWS Service Control Policies, or GCP Organisation Policies to deny provisioning of resources without required tags. Mandatory tag enforcement at the infrastructure level removes the choice. Resources without required tags simply don't get created.

The organizational fix is harder: engineers and product teams need to see their cloud spend attributed to their work. When a team sees a dashboard showing their resource costs and can't explain 30% of it because it's untagged, the gap becomes their problem to solve, not a platform team's complaint.

The pattern that works: enforce tags at provisioning, publish team-level dashboards, and make unattributed spend a monthly agenda item in engineering reviews. The tagging rate will improve because the incentive structure changes.

Tag enforcement is a day's work. Building the culture that treats tagging as ownership documentation takes longer. Start the enforcement piece today regardless.
