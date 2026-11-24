---
title: "Give Architecture Reviews a Decision to Change"
description: "Use early reviews to test options and later reviews to verify the chosen design meets its obligations."
date: 2029-03-12
tags: ["Architecture", "Engineering Leadership"]
format: note
derived: true
---

Architecture reviews are most useful when they happen early enough to influence choices. A later review serves another purpose: checking that the chosen design actually meets its obligations. Give each review a clear decision and ask for evidence appropriate to that stage.

## Use the review to change a decision

An early review should expose a choice while alternatives remain affordable. Ask for one user journey, a failure scenario, the data involved, and two plausible approaches. The goal is to find assumptions that change the decision, not to require a polished diagram. A review that happens late can still identify a release-blocking issue; late timing reduces room for change but does not make the review meaningless.

In a hypothetical migration, the team estimates that adding an idempotency record before implementation requires six hours. After three clients have implemented their own retry behaviour, the corresponding change requires six hours in the service and four hours in each client: 18 hours. The chart illustrates one dependency-cost model. It is not evidence that early reviews always save two-thirds of effort.

Record what changed: the retry contract, its owner, the tests that demonstrate duplicate suppression, and the condition that would invalidate the decision. If a reviewer finds a data-loss risk late, the team must still decide whether to stop, limit exposure, or accept a documented risk with an accountable owner. A deadline does not erase the failure mode.

For the next design, schedule a short options discussion before implementation and an evidence review before release. Compare the questions answered by each meeting. Keep both only if they perform distinct work.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
