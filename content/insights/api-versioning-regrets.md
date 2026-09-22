---
title: "API versioning decisions made quickly will haunt you for years"
description: "The API versioning decision you make before you ship v1 will affect your engineering priorities five years later."
date: 2029-07-30
tags: ["API Design", "Software Engineering", "Programming"]
format: note
derived: true
---

The API versioning decision you make before you ship v1 will affect your engineering priorities five years later. It's worth slowing down to get right.

The patterns I've inherited that cause ongoing pain:
- **Version numbers in the URL with no deprecation policy**: `/v1` is still in production three years after `/v2` launched because some clients never migrated and nobody enforced the timeline. You now support two versions of every endpoint indefinitely.
- **No versioning at all**: breaking changes get deployed, integrations that the team didn't know existed break, and incidents get raised by partners who were consuming undocumented behavior.
- **Header-based versioning inconsistently applied**: correct in theory, broken in practice because half the clients don't set the version header and default to whatever behavior the server implements for unversioned requests.

The versioning choice implies a support commitment. If you ship `/v1` and `/v2`, you've implicitly committed to supporting both until you explicitly deprecate one. If you ship without a deprecation policy, you've committed to supporting everything you've ever shipped.

The questions to answer before the first API version ships:
- What constitutes a breaking change for your API consumers?
- What is the minimum support window you'll give consumers when you deprecate a version?
- How will you communicate deprecation timelines?
- Who owns the deprecation process?

These are contract management questions as much as technical ones. Answer them before you have ten active API versions and no path to reducing that number.
