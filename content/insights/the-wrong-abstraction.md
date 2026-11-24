---
title: "The wrong abstraction is more expensive than no abstraction."
description: "The decision to create an abstraction is a prediction."
date: 2028-12-25
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

The decision to create an abstraction is a prediction. It predicts that the underlying complexity being abstracted will change in ways the abstraction can accommodate, and that the interface the abstraction exposes will remain stable even as the implementation behind it evolves. When that prediction is correct, the abstraction reduces complexity for its consumers. When it is wrong, it creates a layer of indirection between the consumer and what they actually need.

The failure mode of the wrong abstraction: the system grows in a direction the abstraction did not anticipate. Consumers need to control something the abstraction hides. The correct response would be to change the abstraction interface, but the abstraction has multiple consumers and changing the interface requires changing all of them. The practical response is a workaround — an escape hatch, a backdoor to the underlying implementation, or a parallel code path that doesn't use the abstraction. The abstraction is now a tax: it adds indirection for the consumers who can use it as designed, and requires workarounds for the consumers who cannot.

This is more expensive than the duplication the abstraction was meant to eliminate. Duplication is visible — two code paths doing similar things can be identified, compared, and refactored when the pattern is clear. The wrong abstraction is structural. Escaping it requires understanding all consumers, refactoring the interface, and migrating each consumer. The migration cost compounds with the number of consumers and the depth of the abstraction's integration.

The practice that limits wrong abstraction accumulation: abstract when you have evidence of a repeating pattern, not when you anticipate one. Two instances of a pattern are a data point. Three instances with a clear common structure are evidence. One instance of a pattern you expect to repeat is a prediction that has not been validated.

## Test the prediction with a change example

The number of repeated call sites is a heuristic, not proof that an abstraction is right. Three similar implementations can still encode different policies. Conversely, a stable standard such as a cryptographic library boundary can be valuable before a team has three local examples. Ask which decisions are shared and which ones change independently.

Consider a fictional document export helper used by five workflows. Three need the same filename and retention rules; two have legally reviewed retention requirements that differ. A single function with a `specialRetention` flag makes the exceptional policy harder to discover. Separate policy names may be clearer even if both paths use the same low-level storage client. The chart counts three shared-policy and two distinct-policy callers; it does not quantify code quality.

Write a small worksheet for each caller: purpose, invariant, allowed inputs, side effects, and reason to change. Then introduce a hypothetical requirement, such as a different deletion deadline. Identify exactly which callers should change. If the abstraction forces unrelated callers to understand that rule, reconsider where its boundary sits.

A safe refactor preserves existing observable behaviour while moving responsibility. Test the callers first, migrate one path, and remove unused flags only when no supported consumer needs them. Keep policy corrections separate from structural cleanup so reviewers can recognise a deliberate behaviour change. The aim is to make the next decision easier to express, not to win a contest for the fewest functions. Ask a reviewer to explain the new boundary using the business rule alone. If they still need to inspect hidden flags, the important distinction remains unclear.

## Further reading and source boundaries

- [Sandi Metz: The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
