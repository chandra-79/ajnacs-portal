---
title: "The wrong abstraction is more expensive than no abstraction."
description: "The decision to create an abstraction is a prediction."
date: 2026-02-17
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

The decision to create an abstraction is a prediction. It predicts that the underlying complexity being abstracted will change in ways the abstraction can accommodate, and that the interface the abstraction exposes will remain stable even as the implementation behind it evolves. When that prediction is correct, the abstraction reduces complexity for its consumers. When it is wrong, it creates a layer of indirection between the consumer and what they actually need.

The failure mode of the wrong abstraction: the system grows in a direction the abstraction did not anticipate. Consumers need to control something the abstraction hides. The correct response would be to change the abstraction interface, but the abstraction has multiple consumers and changing the interface requires changing all of them. The practical response is a workaround — an escape hatch, a backdoor to the underlying implementation, or a parallel code path that doesn't use the abstraction. The abstraction is now a tax: it adds indirection for the consumers who can use it as designed, and requires workarounds for the consumers who cannot.

This is more expensive than the duplication the abstraction was meant to eliminate. Duplication is visible — two code paths doing similar things can be identified, compared, and refactored when the pattern is clear. The wrong abstraction is structural. Escaping it requires understanding all consumers, refactoring the interface, and migrating each consumer. The migration cost compounds with the number of consumers and the depth of the abstraction's integration.

The practice that limits wrong abstraction accumulation: abstract when you have evidence of a repeating pattern, not when you anticipate one. Two instances of a pattern are a data point. Three instances with a clear common structure are evidence. One instance of a pattern you expect to repeat is a prediction that has not been validated.
