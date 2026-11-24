---
title: "API versioning decisions made quickly will haunt you for years"
description: "The API versioning decision you make before you ship v1 will affect your engineering priorities five years later."
date: 2029-07-30
tags: ["API Design", "Software Engineering", "Programming"]
format: note
derived: true
---

The API versioning decision you make before you ship v1 will affect your engineering priorities five years later. It's worth slowing down to get right.

Patterns that can create ongoing maintenance work include:
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

## Check a consumer, not just the schema

Imagine a fictional shipping API with six supported clients. An added status value is accepted by four clients, while two exhaustive switches reject it. The server considers the field additive, but the supported consumer behaviour reveals a compatibility problem. Four of six passing clients is about 66.7% test coverage of successful upgrades, not a safe partial deployment strategy.

Reproduce the case with recorded synthetic responses. Test an unknown enum, an omitted optional field, an additional object property, and an error response. Determine which behaviours are actually part of the compatibility promise. Keep those tests beside the published contract so the next change is evaluated against evidence rather than intuition.

Document how a client selects a version and what happens when it omits the selector. A stable default is a support decision; “latest” can silently change behaviour for consumers that did not deploy anything. Check gateway, cache, and webhook behaviour as well as the application handler.

Before announcing retirement, maintain an inventory of owners and migration evidence. Use the relevant operating cycle: a monthly reconciliation client may not appear in a one-day traffic sample. Set a support contact and a procedure for unresolved integrations. A sunset date is useful when it coordinates work; it is dangerous when treated as proof that the work has already happened.

For a deeper compatibility matrix, continue with [API Versioning Strategies](/insights/api-versioning-strategies/). The primary references below describe an implemented version-selection policy and HTTP negotiation semantics; apply those ideas to the compatibility promises your own API makes.

## Further reading and source boundaries

- [Stripe API versioning](https://docs.stripe.com/api/versioning)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
