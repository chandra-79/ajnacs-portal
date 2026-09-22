---
title: "The Wrong Abstraction Is More Expensive Than No Abstraction"
description: "An abstraction that does not match the problem domain forces every user of that abstraction to work against it. The cost is paid continuously and compounds with every new user."
date: 2026-01-19
tags: ["Architecture", "Engineering Leadership"]
format: article
---

There is a common progression in software systems that becomes recognizable once you have seen it a few times:

1. A pattern is observed across several code paths
2. The pattern is extracted into an abstraction (a base class, a utility function, a shared module)
3. New code is written using the abstraction
4. The problem domain evolves; the abstraction stops fitting cleanly
5. New code is written around the abstraction, adding special cases and exceptions
6. The abstraction has grown to handle exceptions it was not designed for
7. Everyone who needs to modify the behavior fights the abstraction rather than just writing the behavior

Step 7 is the wrong abstraction in its mature state.

## What makes an abstraction wrong

An abstraction fits when: using it is simpler than writing the behavior directly, the model it encodes matches the problem domain, and new requirements fit naturally within it.

An abstraction is wrong when: using it requires understanding its internals to use it correctly, exceptions have been added to handle cases it was not designed for, or new requirements consistently require circumventing it.

The wrong abstraction does not announce itself. It accumulates exceptions. The first exception is reasonable. The second exception is added because the first exception made it necessary. By the fifth exception, the abstraction has become a framework for managing its own inconsistencies.

## Why the wrong abstraction is more expensive than none

No abstraction: each code path is explicit. Behavior is easy to read. Changing one code path does not affect others. The cost is repetition.

Wrong abstraction: each code path fights the abstraction. Changing the abstraction requires understanding all its consumers. The abstractions exceptions create coupling between code paths that should be independent. The cost is friction on every modification.

The repetition cost of no abstraction is paid once per code path. The friction cost of the wrong abstraction is paid on every modification, by every engineer who touches it, indefinitely.

## The harder question

Identifying the wrong abstraction is the easy part. Addressing it is harder — the abstraction has consumers who depend on its current behavior, and changing it requires coordinating those consumers.

The practical approaches: the strangler fig (build the right abstraction alongside the wrong one, migrate consumers, delete the wrong one) or the expansion-contraction refactor (expand the abstraction to handle all cases explicitly, then contract it to the correct model).

Neither is fast. Both are faster than continuing to pay the friction tax forever.
