---
title: "API Versioning Strategies: Choosing the Right Approach for Long-Lived APIs"
description: "API versioning is one of those decisions that looks easy until you have to support an API for five years across many clients. The approach you choose determines how much pain you create for yourself and your API consumers."
date: 2025-04-25
tags: ["Architecture", "Engineering Leadership"]
format: article
---

Every API that has external consumers (and most that have internal consumers) will eventually need to change in a way that breaks backward compatibility. How you handle that change — or more precisely, how you designed the API to accommodate change before the change became necessary — determines how painful that moment is.

## The main versioning approaches

**URL versioning** (`/v1/users`, `/v2/users`): the most widely used approach. The version is visible in the URL, which makes it explicit and easy to see in logs. Clients know exactly which version they are calling. The cost: routing to different handlers for different versions, and the operational overhead of maintaining multiple running versions simultaneously.

**Header versioning** (`Accept: application/vnd.myapi.v2+json`): the version lives in an HTTP header rather than the URL. URLs remain clean and stable. The cost: the version is invisible without inspecting headers, which makes debugging harder and caching more complex.

**Query parameter versioning** (`/users?api-version=2`): version in a query parameter. Easy to add to existing APIs. The cost: easy to omit (and potentially hit the wrong default), not strongly enforced, inconsistent across the industry.

**Semantic versioning with backward compatibility**: avoid breaking changes wherever possible. New fields are added as optional; fields are never removed, only deprecated. The version number changes but the URL does not. This works until a breaking change is unavoidable.

URL versioning is the pragmatic choice for most APIs with external consumers. It is explicit, widely understood, easy to implement, and easy to route. The overhead of running multiple versions is real but manageable.

## What constitutes a breaking change

Understanding the boundary between breaking and non-breaking changes determines how often you need to increment the version.

**Breaking changes** (require a new version):
- Removing a field from a response
- Renaming a field
- Changing a field's data type (string → integer)
- Adding a required field to a request
- Changing the meaning of a field (changing what values are valid, changing what a value means)
- Changing error codes or error response structure
- Removing an endpoint

**Non-breaking changes** (safe to add without a version bump):
- Adding a new optional field to a response
- Adding a new optional field to a request
- Adding a new endpoint
- Adding new valid values to a string field (if consumers ignore unknown values)
- Relaxing validation (accepting more values than previously)

The consumer's contract: consumers must ignore fields they do not understand. If a consumer fails when it encounters an unknown field, that consumer is brittle in a way that makes adding new fields a breaking change. Document this expectation.

## The versioning lifecycle

Publishing a new API version is the easy part. Deprecating and retiring old versions is harder.

**Deprecation notice**: inform consumers before deprecating. Changelog, email if you have consumer contact information, deprecation headers in responses (`Deprecated: true`, `Sunset: Sat, 31 Dec 2026 00:00:00 GMT`).

**Migration window**: the time between announcing deprecation and removing the old version. For external APIs, 12-18 months is a reasonable minimum. For internal APIs with known consumers, 3-6 months may be sufficient if you can coordinate directly.

**Usage monitoring**: before retiring a version, verify that traffic has actually migrated. Retiring a version that still has active consumers because the migration deadline passed is a bad outcome. Check actual traffic, not just whether migration notices were sent.

**Hard cutoff vs. graceful degradation**: on the retirement date, does the old version return an error, redirect to the new version, or just stop working? Error with a clear message is usually the right approach. Silently redirecting can mask migration issues.

## API design for longevity

The best versioning strategy is to need fewer version bumps. API design choices that reduce the frequency of breaking changes:

**Additive design**: design APIs to be extended with new optional fields and endpoints, not redesigned. If the API must change, prefer adding over modifying.

**Hypermedia and resource URLs**: return URLs as opaque strings rather than constructing them in clients. If a resource moves, the API can update the URL returned without clients needing to change their URL construction logic.

**Tolerant reader pattern**: both the server and clients should be tolerant of unexpected input. Servers ignore unknown request fields; clients ignore unknown response fields.

**Avoid exposing internal structure**: an API that exposes your database schema directly will change every time your schema changes. APIs that model the domain (resources, actions, relationships) are more stable than APIs that expose implementation details.

*Designing a versioning strategy for a new API or working through how to deprecate a version of an existing API? [Happy to think through the trade-offs for your specific consumer base.](/contact)*
