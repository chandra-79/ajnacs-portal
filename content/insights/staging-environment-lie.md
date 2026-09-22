---
title: "Your staging environment stopped reflecting production six months ago and you're testing in a fiction"
description: "Staging environment drift is one of those problems that announces itself only during production incidents."
date: 2026-02-02
tags: ["DevSecOps", "Infrastructure", "Software Engineering"]
format: note
---

Staging environment drift is one of those problems that announces itself only during production incidents. "But it worked in staging" is a statement that reveals the staging environment was no longer testing what production runs.

The drift accumulates gradually. A schema migration that went to production urgently didn't get applied to staging. A configuration value was tweaked in production during an incident and never reflected in the staging deployment. The test data in staging is from a database snapshot taken fourteen months ago, and the data shape has evolved since then. Third-party integrations in staging point to vendor sandbox environments that don't fully replicate production behavior.

The result: staging tests your code against a different system than the one it will run on. Confidence in staging becomes confidence in your own optimism.

The expensive fix is continuous environment parity: infrastructure as code that provisions staging from the same template as production, automated configuration synchronisation, recent anonymised production data refreshed on a schedule. This is the right answer and it requires genuine engineering investment.

The accessible fix: a monthly staging parity review. Someone compares staging configuration against production configuration, identifies the gaps, and closes them before the next release cycle. Not automated, not elegant — but it catches the most consequential divergences before they become production incidents.

Staging is only worth the compute cost if it's actually testing what production will run.
