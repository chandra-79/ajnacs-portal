---
title: "SRE vs DevOps is mostly a branding debate. The practices that matter are the same."
description: "The job titles proliferated faster than the practices they implied. Site Reliability Engineer became a hiring signal for candidates who expected Google-style SRE programs."
date: 2029-05-21
tags: ["DevSecOps", "Engineering Leadership"]
format: note
derived: true
---

The job titles proliferated faster than the practices they implied. Site Reliability Engineer became a hiring signal for candidates who expected Google-style SRE programs. DevOps Engineer became a catch-all for anyone who touched CI/CD pipelines. The debate about which model a given organisation was implementing consumed meeting time that could have been spent implementing SLOs.

The practices that produce operationally mature systems are not controversial and are not exclusive to either label. SLOs express the reliability level users need and the team can sustain. Error budgets make the trade-off between shipping new features and maintaining stability explicit rather than political. Post-mortems that produce engineering action items rather than accountability narratives build the institutional knowledge that prevents recurrence. Toil measurement and reduction keeps on-call work from consuming the engineering bandwidth that should go to reliability improvements.

These practices can be implemented by a team that calls itself SRE, a team that calls itself DevOps, or a team that calls itself platform engineering. The label does not determine the outcome. The practice does.

What the label debate often obscures: the difficulty of implementing these practices is not technical, it is organisational. SLOs require product and engineering leadership to agree on what good looks like. Error budgets require a policy decision about what happens when the budget is spent. Post-mortems require a blameless culture that many organisations claim and few actually have. These are harder problems than what to call the team.

## Assign the work before choosing the title

Try a responsibility exercise around one service rather than debating a department name. Identify who owns the user-visible objective, deployment safety, on-call response and work that reduces recurring effort. Some duties can be shared, but a shared duty still needs a decision process and an escalation owner.

In a hypothetical four-week record, a team spends 40 hours on repetitive manual recovery, 30 on investigation of new incidents and 50 on reliability improvements. The total is 120 hours. Only the first category is classified as toil in this example because it is repetitive and automatable with no enduring service improvement. The other categories may still be operational work without meeting that definition. The chart does not imply a universal target allocation.

Build a worksheet listing recurring tasks, frequency, hands-on minutes, risk and a candidate reduction. For one task, compare the cost of safer automation with the expected recurring effort, including maintenance and review. Then agree who can prioritize the change and how its effect will be measured. SRE and DevOps contain technical practices as well as organizational choices; renaming the team alone changes neither. Use the operating record to choose responsibilities and investment before deciding which label best communicates them.

| Observation | Value (hours) |
| --- | ---: |
| Repetitive recovery | 40 |
| Novel investigation | 30 |
| Reliability improvements | 50 |

**Figure method.** Synthetic four-week time ledger totals 120 hours. Toil classification here applies only to the repetitive automatable category; hours are not a universal staffing target.

## Further reading

- [Google SRE incident response](https://sre.google/workbook/incident-response/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
