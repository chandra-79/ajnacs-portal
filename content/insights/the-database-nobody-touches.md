---
title: "Every enterprise has a database that nobody wants to touch, and that database contains the most critical data"
description: "The database that nobody wants to touch is a recognisable archetype in every enterprise I've worked in."
date: 2026-03-16
tags: ["Data Engineering", "Engineering Leadership"]
format: article
derived: true
---

The database that nobody wants to touch is a recognisable archetype in every enterprise I've worked in. It's old. It has stored procedures that reach into systems whose original developers have long since moved on. The schema has no documentation, or documentation that was accurate in 2017 and hasn't been touched since. It runs on hardware that's been in "extended support" for years.

And it contains the most business-critical data in the organization. Naturally.

The risk compounds every year it stays in this state. New code gets written that depends on it. More stored procedures accumulate. The engineers who held its history in their heads leave, taking the tribal knowledge with them. The migration gets scheduled and descoped and rescheduled and descoped again, because the risk is always too high when the moment arrives.

The way out is not a big-bang migration — that's exactly the kind of project that gets cancelled. It's an incremental strangler:

First, document what you know. Even incomplete documentation of the access patterns, the key stored procedures, and the integration points is more than you have now. Second, instrument it. You need to understand actual query patterns before you can migrate anything safely. Third, stop adding to it. New features get built on a new data store, even if migration of existing data takes years. Fourth, migrate in seams — identify the most self-contained parts and migrate those first, building confidence and methodology before touching the critical core.

The cost of leaving it alone is not zero. It defers and compounds.
