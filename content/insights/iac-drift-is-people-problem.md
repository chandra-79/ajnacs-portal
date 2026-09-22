---
title: "IaC drift is a people problem wearing a technical mask"
description: "Infrastructure as code drift — the gap between your IaC state and your actual cloud environment — gets discussed as a technical problem."
date: 2029-04-13
tags: ["Cloud Architecture", "Infrastructure", "DevSecOps"]
format: note
derived: true
---

Infrastructure as code drift — the gap between your IaC state and your actual cloud environment — gets discussed as a technical problem. The solutions offered are usually technical: drift detection pipelines, automated remediation, CI enforcement.

These solutions are correct. They're also insufficient without addressing why drift happens in the first place.

Drift happens when someone makes a console change during an incident because it's faster than updating Terraform. It happens when a "temporary" manual fix never gets reflected in the code. It happens when engineers who have write access to the cloud console don't have write access to the IaC repository. It happens when the team that wrote the code isn't the team running the infrastructure.

Every instance of drift represents a moment when the path of least resistance was not the path of correct operation. That's an organizational design problem.

The technical controls — read-only console access, drift detection on a schedule, PR-gated applies — create the constraint. But the constraint only works if leadership treats a drift alert with the same urgency as a security finding. If the response to "our Terraform state has 30 undocumented changes" is "we'll deal with it later," no amount of tooling will hold.

Make IaC the only path and support the teams that maintain it. The drift will stop.
