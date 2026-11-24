---
title: "The API that was supposed to be temporary is now in four production systems."
description: "There is no such thing as a temporary API in production. There is only an API whose permanent status has not yet been acknowledged."
date: 2028-12-11
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

A temporary API in production needs an explicit removal mechanism. Without one, its lifespan is usually longer than the original label suggests.

The lifecycle is consistent. An engineer needs to expose some functionality quickly — for a prototype, a partner integration, or an internal tool that "won't be around long." They build the simplest possible endpoint: no versioning because it's temporary, minimal documentation because it's for internal use, authentication that's serviceable but not production-grade because it won't need to be. The endpoint works. Someone else on the team finds it useful. A second service starts calling it. A third.

Six months later, the engineer who built it has moved to another team. The endpoint is in four production paths. Nobody wants to deprecate it because they don't know all its consumers. Nobody wants to change its interface because they can't test all the impact. The endpoint that was supposed to be temporary has become the endpoint that will never be changed.

The engineering practice that interrupts this cycle: treat every API endpoint as permanent from the moment it has more than one consumer. Not because temporary APIs are bad, but because the definition of temporary changes the moment adoption occurs. A simple API registry — even a YAML file checked into the service repository — that records endpoint, owner, consumers, authentication model, and intended lifespan forces the conversation early. The deprecation date creates accountability. The ownership field creates a contact when consumers need to migrate.

This is not bureaucracy. It is the discipline that makes the "we'll clean it up later" conversation actually happen before the endpoint is load-bearing.

## Give the endpoint an accountable lifespan

Temporary can be a legitimate status if removal is an engineered operation. A feature preview might have a fixed audience, expiring credentials, a documented shutdown date, and a replacement path. What makes it risky is leaving those facts implicit while callers depend on it.

Take a fictional export endpoint with four known consumers. Usage logs identify one scheduled integration, two internal dashboards, and a partner application. Three consumers successfully exercise a replacement in a test environment; one has no verified owner. Migration readiness is therefore three of four, or 75%, under the declared rule. It is not 100% because the unowned consumer was quiet during the last hour. Scheduled monthly activity can be invisible in a short sample.

Extend observation over the relevant business cycle, while minimising personal data in access logs. A service credential or registered application identifier is usually more useful than storing every request body. Compare observed callers with the registry and investigate unknown ones. Traffic proves use, but lack of traffic does not by itself prove removal is safe.

## Make retirement testable

Write a small retirement worksheet: authenticated caller, owning team, purpose, replacement operation, last observed use, test evidence, and agreed switch date. Exercise the replacement with the caller's failure cases, including an expired token and a repeated request. Confirm equivalent authorisation, pagination, and error semantics rather than checking only the success payload.

Set a reversible enforcement stage before deletion. For example, disable access for a migrated test account first and confirm that monitoring detects a forgotten dependency. Keep a clear support contact and use a published deprecation policy for external consumers. Remove secrets and permissions after the last dependent path is retired. Keeping a forgotten credential active is not a useful rollback strategy.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
