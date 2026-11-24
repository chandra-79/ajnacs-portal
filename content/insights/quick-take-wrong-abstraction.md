---
title: "The Wrong Abstraction Is More Expensive Than No Abstraction"
description: "An abstraction that does not match the problem domain forces every user of that abstraction to work against it. The cost is paid continuously and compounds with every new user."
date: 2028-06-21
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

Duplicated code can also create recurring maintenance work when shared rules change. The friction cost of the wrong abstraction is paid on every modification, by every engineer who touches it, indefinitely.

## The harder question

Identifying the wrong abstraction is the easy part. Addressing it is harder — the abstraction has consumers who depend on its current behavior, and changing it requires coordinating those consumers.

The practical approaches: the strangler fig (build the right abstraction alongside the wrong one, migrate consumers, delete the wrong one) or the expansion-contraction refactor (expand the abstraction to handle all cases explicitly, then contract it to the correct model).

The appropriate migration depends on the callers, the risks of changing behaviour, and the cost of leaving the current design in place.

## Distinguish shared syntax from shared meaning

Two functions can look similar while enforcing different business rules. A discount for an annual subscription and a refund for a cancelled order might both multiply an amount by a rate, but they differ in eligibility, rounding, timing, and audit requirements. A shared arithmetic primitive may be appropriate; a single policy object with many flags may hide the differences that reviewers need to see.

For a hypothetical exercise, inventory twelve callers of a pricing helper. Seven use the default path, three pass a special rounding flag, and two bypass the helper after calling it. The chart records those groups. The five exceptions are a reason to inspect the abstraction, not proof that it must be deleted. Some variation is legitimate and can be represented clearly.

Trace one caller from input to output. Write down the invariant in domain language before looking at the implementation. Then compare it with a second caller that uses a flag. If their invariants differ, the shared API may be combining policies that deserve separate names. If the invariants are identical, the exception may instead reveal an implementation defect.

## Refactor with behaviour preserved

Create characterisation tests for the current callers using synthetic examples. Include boundary values, rounding cases, empty inputs where supported, and invalid states. A test should explain the observable result it protects rather than freezing private implementation details. If existing behaviour is wrong, separate the correction from the structural refactor so reviewers can see the intended change.

Extract one explicit path behind a new name and migrate a small set of callers. Compare outputs before removing the old path. For code with side effects, use a comparison strategy that does not execute the effect twice: compare planned operations or run against isolated test dependencies. “Run both and compare” is unsafe for charges, emails, or data deletion.

Keep a compatibility adapter only as long as it has a concrete migration purpose. Record which callers remain and the owner of their migration. An adapter with no removal condition can become the next abstraction nobody understands.

## Judge the result on the next change

Reduced line count is not the primary success condition. Ask whether a later rule change can be implemented in one clear place without surprising unrelated callers. Compare the number of policies a reviewer must understand to assess that change. The refactor is useful if it makes the domain distinction explicit and preserves the obligations of each caller, even if some code is intentionally duplicated.

## Further reading and source boundaries

- [Sandi Metz: The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
- [Martin Fowler: Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
