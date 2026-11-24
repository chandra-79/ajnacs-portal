---
title: "Staying technically connected without becoming the decision bottleneck"
description: "Read the evidence, ask questions about assumptions and preserve clear technical ownership as leadership scope grows."
date: 2029-01-17
tags: ["Engineering Leadership"]
format: article
---

The transition into engineering leadership often includes implicit advice to "let go" of the technical work — to focus on people, process, and strategy, and trust the engineers to handle the technology.

This is partially right. Engineering leaders should not be the technical bottleneck on their team. They should not be the one making every architecture decision. Any implementation work should fit the role and avoid creating an ownership dependency.

But "let go of technical work" and "stop engaging with the technical reality of what your team is doing" are different things. The engineering leader who stops understanding the technical reality of their team's work loses the ability to do their job.

## What happens when technical depth degrades

**Trade-off conversations become abstract.** An engineering leader who cannot evaluate the technical specifics of a build-vs-buy decision, a database selection, or an architecture approach can only manage the process of making the decision — facilitating the conversation, ensuring stakeholders are present — but cannot substantively contribute to the quality of the outcome. Engineers may need technical perspective, process facilitation or organizational support depending on the decision.

**Credibility with engineers erodes.** Engineers trust leaders who understand what they do. The leader who asks questions that reveal technical misunderstanding, who makes commitments about what engineering can do without checking, who cannot follow a technical discussion — loses the respect that enables them to lead effectively. This is not about ego. It is about whether engineers believe their leader understands what they are dealing with.

**Estimates and commitments drift from reality.** An engineering leader who cannot evaluate whether a 2-week estimate is reasonable for a specific technical challenge will either accept it uncritically or push back based on intuition rather than technical judgment. Both produce worse outcomes than an informed conversation.

## What staying technical actually looks like

Staying technical does not mean spending 40% of your time coding. It means:

- Reviewing code regularly — not to catch bugs, but to stay connected to the state of the codebase
- Pairing with engineers on technically complex problems occasionally
- Reading about the technologies your team uses — keeping up with the field, not in exhaustive detail but enough to track where things are going
- Participating in architecture discussions as a contributor, not just a facilitator
- Doing the occasional production investigation yourself

The time needed varies with scope and familiarity. Evaluate whether the investment improves the decisions the role is responsible for.

The leaders who maintain this investment tend to be the ones who describe their job as still deeply interesting. The ones who don't often describe a growing gap between what they do and what they want to do.

## Choose a technical learning question that serves the role

A leader does not need to compete with every specialist on implementation detail. They need enough context to understand constraints, ask useful questions and avoid commitments based on an obsolete model. Choose a question connected to an upcoming decision: why recovery needs a particular sequence, what limits a migration window, or how a dependency affects the service objective.

Ask the engineer closest to the work to select a representative artifact. Read a sanitized trace, a design decision, a failing test or a deployment change together. Explain back what you think it means and invite correction. This is a way to expose a gap in your understanding before that gap influences a roadmap or staffing decision.

## A fictional review-preparation budget

A leader prepares for three consequential reviews in a month. Each requires 45 minutes to read the proposal and 30 minutes to clarify assumptions with its author. Total preparation is 225 minutes, or 3.75 hours. The chart separates 135 minutes of reading from 90 minutes of clarification. These are planning inputs, not a universal weekly requirement for technical credibility.

The value depends on what the preparation enables. It may reveal a shared dependency, a missing specialist or an unrealistic operational commitment. Record that decision rather than claiming that time spent reading automatically improves leadership. A manager can also contribute substantially through staffing, prioritization and conflict resolution, even when a technical specialist supplies the deepest analysis.

## Use questions that expose an assumption

Ask what evidence would make the team choose a different option. If the proposal is to cache a response, ask which staleness is acceptable and how invalidation is handled. If it is to split a service, ask which ownership or scaling constraint the split resolves and which new operational work it introduces. These questions help clarify the decision without requiring the manager to dictate the design.

Avoid using a review to reassert technical authority through minor preferences. A different naming style or familiar library may not affect the problem being solved. Distinguish a requirement, a risk, a suggestion and a personal preference. Let the named owner decide within the agreed boundary and document material exceptions.

## Keep your knowledge map current

Identify the areas where your experience is strong, dated or absent. Ask for specialist review when the consequence of being wrong is significant. Acknowledging uncertainty can improve the decision process; bluffing can make the team spend time satisfying an assumption nobody has tested. Revisit prior advice when the service, team or vendor behavior changes.

Do not turn occasional hands-on work into an unplanned ownership dependency. If you investigate a production issue, follow the incident process and leave a useful record. If you write code, ensure someone else can review and support it. Staying connected to technical reality should increase the team's ability to make informed decisions, not make more work wait for the manager's availability.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Google Engineering Practices · Code review](https://google.github.io/eng-practices/review/reviewer/)
