---
title: "SRE vs DevOps is mostly a branding debate. The practices that matter are the same."
description: "The job titles proliferated faster than the practices they implied. Site Reliability Engineer became a hiring signal for candidates who expected Google-style SRE programs."
date: 2025-10-27
tags: ["DevSecOps", "Engineering Leadership"]
format: note
---

The job titles proliferated faster than the practices they implied. Site Reliability Engineer became a hiring signal for candidates who expected Google-style SRE programs. DevOps Engineer became a catch-all for anyone who touched CI/CD pipelines. The debate about which model a given organisation was implementing consumed meeting time that could have been spent implementing SLOs.

The practices that produce operationally mature systems are not controversial and are not exclusive to either label. SLOs express the reliability level users need and the team can sustain. Error budgets make the trade-off between shipping new features and maintaining stability explicit rather than political. Post-mortems that produce engineering action items rather than accountability narratives build the institutional knowledge that prevents recurrence. Toil measurement and reduction keeps on-call work from consuming the engineering bandwidth that should go to reliability improvements.

These practices can be implemented by a team that calls itself SRE, a team that calls itself DevOps, or a team that calls itself platform engineering. The label does not determine the outcome. The practice does.

What the label debate often obscures: the difficulty of implementing these practices is not technical, it is organisational. SLOs require product and engineering leadership to agree on what good looks like. Error budgets require a policy decision about what happens when the budget is spent. Post-mortems require a blameless culture that many organisations claim and few actually have. These are harder problems than what to call the team.
