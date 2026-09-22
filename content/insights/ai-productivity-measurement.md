---
title: "Measuring AI productivity impact is harder than it looks and most orgs are doing it wrong."
description: "The productivity claims for AI coding tools are plausible but routinely measured at the wrong scope."
date: 2025-11-11
tags: ["AI & MLOps", "Enterprise AI", "Engineering Leadership"]
format: article
---

The productivity claims for AI coding tools are plausible but routinely measured at the wrong scope. Controlled studies that measure individual task completion time for isolated programming tasks find meaningful improvements. These studies tell you something real about a narrow slice of the software development process.

Software development is not a series of isolated programming tasks. It is a collaborative process that includes requirement clarification, design discussion, implementation, code review, testing, deployment, and ongoing maintenance. AI tools affect each of these phases differently. Their most visible effect — accelerating initial code production — is measurable in isolation. Their effects on downstream phases are less studied.

Code review time for AI-generated code merits investigation. Code that was generated quickly may require more review than code written at a considered pace by an experienced developer, because the generation process optimises for plausibility rather than maintainability. A senior engineer reviewing AI-assisted code from a junior developer is making judgments about code that looks syntactically correct but may have subtle semantic issues that require deep context to detect. That review cost does not appear in individual task completion time measurements.

Maintenance cost over a two-to-three-month horizon would be a more complete measurement of AI tool value. Code that is fast to write but opaque to maintain — because it was generated to solve the immediate problem without considering how subsequent engineers would understand it — creates downstream cost that the initial productivity gain does not account for.

The measurement that would produce the most useful signal: a controlled comparison of production bugs, code review cycle time, and team-reported maintenance burden for AI-assisted versus non-AI-assisted codebases, measured over six months. This study exists in very few organisations because it is significantly harder to run than a developer satisfaction survey.
