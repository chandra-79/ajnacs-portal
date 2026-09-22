---
title: "Most documentation is written for the person who already knows the thing"
description: "The person who writes documentation has the system fully loaded in their working memory. They know which step is a prerequisite for which other step."
date: 2026-01-05
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

The diagnostic test: hand the documentation to someone who has never touched the system and watch where they stop. Every pause is a gap the author assumed was obvious. That feedback is worth more than any amount of self-review.

Writing good documentation requires deliberately forgetting what you know — imagining your own ignorance of six months ago — and writing to that person. That's a harder cognitive task than writing the documentation itself, which is probably why most documentation doesn't do it.
