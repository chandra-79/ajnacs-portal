---
title: "Most documentation is written for the person who already knows the thing"
description: "The person who writes documentation has the system fully loaded in their working memory. They know which step is a prerequisite for which other step."
date: 2029-06-15
tags: ["Software Engineering", "Engineering Leadership"]
format: article
derived: true
---

The person who writes documentation has the system fully loaded in their working memory. They know which step is a prerequisite for which other step. They know what the error message means. They know which configuration value matters and which ones can be safely ignored.

The person who reads the documentation does not know any of this. They're encountering the system for the first time, possibly at 11pm during an incident, possibly on their second week in the role.

Documentation that's written from the author's knowledge state is useful to people who already know the system. It's nearly useless to the people who actually need it.

The specific patterns that create this failure:
- Undefined terms that are obvious to anyone familiar with the system
- Steps that assume prerequisite knowledge without stating that knowledge is required
- "How to do X" without explaining when and why you'd want to do X
- Runbooks that assume you know what healthy system state looks like before you can recognise an unhealthy one

The diagnostic test: hand the documentation to someone who has never touched the system and watch where they stop. A pause is a useful observation to investigate: it may expose a missing step, unfamiliar terminology or an environmental problem. Ask what blocked progress and use that evidence alongside technical self-review.

Writing good documentation requires deliberately forgetting what you know — imagining your own ignorance of six months ago — and writing to that person. That's a harder cognitive task than writing the documentation itself, which is probably why most documentation doesn't do it.

## Give the reader an observable checkpoint

A useful instruction says what to do, what should happen, and what to inspect if it does not. “Configure the service” hides too much. Specify the configuration path, whether it is an example or an active file, how required values are obtained, and which command validates the result. Mark placeholders clearly so they cannot be mistaken for usable credentials.

Try a fictional six-step setup guide with three unfamiliar readers. Record nine clarification requests: four about prerequisites, three about ambiguous paths, and two about expected output. Those counts are not a quality score for the authors or readers. They identify where the next revision should spend attention. A single reader can ask several questions, so the denominator is clarification requests, not people.

Rewrite one problematic step and test it in a clean environment. Include a small expected output fragment that distinguishes success from partial progress. For a server, a process that stays running does not establish that authentication or database access works. A health response needs to check the obligation the guide claims to demonstrate.

Separate recovery instructions from the main successful path, but keep them close enough to find. If cleanup removes a local test resource, name it explicitly and explain what is retained. Avoid broad deletion commands that a hurried reader could apply in the wrong directory.

Finally, ask another person to follow the revised step without coaching. Record the first place where their expectation differs from the document. This gives the writer a specific defect to fix and makes documentation review an observable engineering activity.

## Further reading and source boundaries

- [Diátaxis documentation framework](https://diataxis.fr/)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
