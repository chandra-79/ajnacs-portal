---
title: "Security review at the end of the sprint is too late to be useful"
description: "When a security review happens at the end of a sprint, the findings that require architectural changes are almost guaranteed to get deferred."
date: 2025-12-10
tags: ["DevSecOps", "Security"]
format: note
---

When a security review happens at the end of a sprint, the findings that require architectural changes are almost guaranteed to get deferred. The code is written. The tests pass. The team is ready to ship. A finding that says "the authentication design needs to change" means rework measured in days — and rework at ship time is rework that gets pushed to the next sprint, which means it doesn't happen before the next sprint's pressure arrives.

This isn't a security culture problem. It's a sequencing problem. Security review is happening after decisions that are expensive to reverse.

The practices that actually change the outcome:
- **Threat modelling during design**, before implementation starts. When you're still whiteboarding the architecture, changing the authentication design is a discussion. When you're reviewing completed code, it's a rewrite.
- **Security requirements in acceptance criteria**. If the story card includes the security requirements alongside the functional requirements, they get addressed during development, not after.
- **Automated checks in CI**. SAST, dependency vulnerability scanning, and secrets detection catch whole classes of issues before any human review happens. These are not substitutes for thoughtful security review, but they remove the routine findings that consume review bandwidth.

Shift-left means security engineers reading design documents and reviewing pull requests early — not performing archaeology on completed features.
