---
title: "Why Most Documentation Is Written for the Person Who Already Knows the Thing"
description: "Documentation written by an expert who assumes reader context produces documentation that is only useful to other experts. Writing documentation that is actually usable requires deliberate perspective-taking."
date: 2028-11-01
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The documentation is written. It is accurate, technically precise, and covers the important cases. Engineers who contributed to the system find it useful as a reference. Engineers who are new to the system read it and still cannot figure out how to get started.

This is not a failure of documentation quality. It is a failure of documentation audience.

The person who writes documentation already knows the thing. They know which concepts need to be introduced before others. They know which steps are obvious and which are subtle. They know what "set up your environment" means, concretely, in this codebase.

The person who reads documentation does not know any of this. They are missing the context that the author considers background.

## The expert blind spot

The curse of knowledge is the cognitive bias that makes it difficult to remember what it was like not to know something. Once you understand the authentication middleware, it can be hard to notice the assumptions a newcomer does not share. Observing a new reader attempt the task and revising the missing steps makes that gap testable.

The symptoms in documentation:

- Prerequisites that are assumed but not listed
- Steps that skip sub-steps that are "obvious"
- Terminology used before it is defined
- References to "the config file" without specifying which one or where it lives
- "It should now work" with no description of what working looks like

## The test that exposes it

Have someone unfamiliar with the system attempt to follow the documentation while narrating what they are doing and where they are confused. Watch without helping. Note every moment of confusion.

This is painful. Every moment of confusion is an implicit criticism of documentation the author wrote and considers good. It is also the most accurate signal available about where the documentation fails.

The version of the documentation written after observing one new person attempt to use it is substantially better than the original version. Not because the original was low-effort, but because the original was written without seeing the reader struggle.

## A structural improvement

The simplest structural improvement to most technical documentation is separating it into two distinct documents: a quickstart that gets a competent-but-unfamiliar engineer to "hello, working" in 20 minutes or less, and a reference that covers the complete system for someone who has already done the quickstart.

The quickstart is written for the reader who knows nothing about this specific system. The reference is written for the reader who needs to look up a specific detail.

Conflating these audiences in a single document produces documentation that is too detailed to be a quickstart and too introductory to be a reference.

## Define the reader's starting point

A quickstart needs a specific starting condition. “A developer” is too broad: an experienced Java engineer who has never used this repository needs different support from a platform maintainer checking an option. State the required language and tool knowledge, permissions, operating system assumptions, and accounts. Link to missing prerequisites rather than silently assuming them.

Choose a concrete finish line such as receiving a valid response from a local endpoint and understanding how to stop the service. A successful quickstart should include the expected response and the cleanup step. Avoid requiring a real customer account, a production credential, or a paid deployment merely to prove that the reader followed the instructions correctly.

In a fictional five-reader trial, three readers reach the expected output within a 30-minute observation window and two remain blocked. Completion is 3/5, or 60%. Record the two incomplete attempts in the denominator. Reporting only the median time of the three successes would hide the most important difficulty. The chart shows completion counts, not a statistically reliable estimate of the wider developer population.

## Observe the documentation, not the person

Use the same clean environment and initial permissions for each participant where practical. Ask readers to explain their expectations when a step is unclear, and record the step rather than their identity. If a prerequisite is missing because the test setup was wrong, distinguish that from a missing instruction. Both need correction, but they answer different questions.

Track where the first useful error message appears. An installation failure that prints a precise unsupported-runtime message is different from one that produces a long stack trace. A guide can include the observable symptom, its likely cause, and a safe diagnostic command. It should not ask the reader to delete caches or change permissions broadly without explaining what those actions do.

## Keep different kinds of help connected

The quickstart establishes a working path. A how-to guide supports a particular task, such as rotating a test credential. Reference material specifies parameters and return values. Explanation develops the design model. Those categories can link to each other without being collapsed into one long page. The Diátaxis framework is useful for examining these different reader needs; adopting its names alone does not make the content effective.

After revising the guide, repeat the trial with readers who did not see the previous version. Familiarity can make a second attempt look like a documentation improvement. Treat a small trial as evidence about specific obstacles, and keep collecting feedback as the toolchain changes. A working example checked in continuous integration can catch drift in commands and output, while a human trial still checks whether the instructions make sense.

## Further reading and source boundaries

- [Diátaxis documentation framework](https://diataxis.fr/)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
