---
title: "Why Most Documentation Is Written for the Person Who Already Knows the Thing"
description: "Documentation written by an expert who assumes reader context produces documentation that is only useful to other experts. Writing documentation that is actually usable requires deliberate perspective-taking."
date: 2025-11-26
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The documentation is written. It is accurate, technically precise, and covers the important cases. Engineers who contributed to the system find it useful as a reference. Engineers who are new to the system read it and still cannot figure out how to get started.

This is not a failure of documentation quality. It is a failure of documentation audience.

The person who writes documentation already knows the thing. They know which concepts need to be introduced before others. They know which steps are obvious and which are subtle. They know what "set up your environment" means, concretely, in this codebase.

The person who reads documentation does not know any of this. They are missing the context that the author considers background.

## The expert blind spot

The curse of knowledge is the cognitive bias that makes it difficult to remember what it was like not to know something. Once you understand how the authentication middleware works, it is almost impossible to write documentation that genuinely helps someone who does not.

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
