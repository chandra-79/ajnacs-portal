---
title: "Choosing Cloud Technology Your Team Can Operate"
description: "Compare workload fit with demonstrated recovery knowledge, support requirements and a concrete plan for closing operational gaps."
date: 2029-04-16
tags: ["Cloud Architecture", "Engineering Leadership"]
format: note
derived: true
---

Before adopting a technology, separate two questions.

First: is this technically interesting and would it be valuable to have on the team's résumé? Second: would I want to be the on-call engineer debugging this at 3am with a production incident in progress?

These questions are not the same, and they don't always have the same answer.

Genuinely new technologies are worth exploring. They often solve real problems that established tools handle poorly. But they come with: incomplete documentation, small communities, fewer colleagues who've seen the failure modes, and no established runbooks for incidents.

Consider a hypothetical team choosing PostgreSQL over a distributed store because both meet the workload requirements while the team has a tested operating model for PostgreSQL. Familiarity is relevant evidence, although it does not guarantee that every failure is already understood. The distributed store was more interesting. The Postgres choice was more defensible.

The question "is this the right technology for the problem?" is incomplete. The full question is: "is this the right technology for the problem, given the team that will run it, the operational complexity we're willing to accept, and the support we'll have when it fails?"

Choose boring technology deliberately. It's a valid architectural decision, not a lack of ambition.

## Test whether the team can explain a failure

Technology familiarity is one input to a decision, not a veto on learning. A new system may solve a requirement that an established system cannot meet. The adoption plan should make the knowledge gap visible and fund the operating work rather than assuming a successful tutorial closes it.

For a hypothetical evaluation, define six failure drills: unavailable dependency, expired credential, full storage, duplicate input, slow query and restore from backup. The team can diagnose four unaided on the familiar candidate and two on the new candidate. These counts describe current readiness for the selected drills, not inherent product quality. Repeat the new candidate's missing drills after training before deciding the gap is permanent.

Use a worksheet that asks for the first observable symptom, the hypothesis, the evidence and the safest recovery action. Have a second engineer reproduce the recovery from the notes. Record support channels and any capability that requires specialist knowledge. A decision to use the familiar option is defensible when it meets the workload's needs; a decision to adopt the new option is defensible when its additional value justifies a concrete learning and support plan.

| Observation | Value (drills) |
| --- | ---: |
| Selected scenarios | 6 |
| Familiar candidate | 4 |
| New candidate | 2 |

**Figure method.** Synthetic six-scenario assessment: four versus two independently diagnosed drills. Measures this team and test set, not product reliability or permanent capability.

## Further reading

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Google SRE incident response](https://sre.google/workbook/incident-response/)
