---
title: "API Versioning Strategies: Choosing the Right Approach for Long-Lived APIs"
description: "API versioning is one of those decisions that looks easy until you have to support an API for five years across many clients. The approach you choose determines how much pain you create for yourself and your API consumers."
date: 2027-05-14
tags: ["Architecture", "Engineering Leadership"]
format: article
---

Every API that has external consumers (and most that have internal consumers) will eventually need to change in a way that breaks backward compatibility. How you handle that change — or more precisely, how you designed the API to accommodate change before the change became necessary — determines how painful that moment is.

## The main versioning approaches

**URL versioning** (`/v1/users`, `/v2/users`): a widely used approach. The version is visible in the URL, which makes it explicit and easy to see in logs. Clients know exactly which version they are calling. The cost: routing to different handlers for different versions, and the operational overhead of maintaining multiple running versions simultaneously.

**Header versioning** (`Accept: application/vnd.myapi.v2+json`): the version lives in an HTTP header rather than the URL. URLs remain clean and stable. The cost: the version is invisible without inspecting headers, which makes debugging harder and caching more complex.

**Query parameter versioning** (`/users?api-version=2`): version in a query parameter. Easy to add to existing APIs. The cost: easy to omit (and potentially hit the wrong default), it needs explicit validation and a documented default, just like other selectors.

**Compatibility-led evolution**: add fields and capabilities under the published compatibility policy, deprecate with an explicit migration path, and reserve breaking changes for a declared boundary. Semantic versioning can describe a versioned API contract, but it does not prescribe URL structure or a promise that deprecated fields remain forever. Test real consumers because apparently additive changes can still expose strict parsers or changed assumptions.

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

**Potentially compatible changes** (verify against the documented consumer contract):
- Adding a new optional field to a response
- Adding a new optional field to a request
- Adding a new endpoint
- Adding new valid values to a string field (if consumers ignore unknown values)
- Relaxing validation (accepting more values than previously)

The consumer's contract: consumers must ignore fields they do not understand. If a consumer fails when it encounters an unknown field, that consumer is brittle in a way that makes adding new fields a breaking change. Document this expectation.

## The versioning lifecycle

Publishing a new API version is the easy part. Deprecating and retiring old versions is harder.

**Deprecation notice**: inform consumers before deprecating. Changelog, email if you have consumer contact information, the standard `Deprecation` and `Sunset` response headers with correctly formatted dates.

**Migration window**: the time between announcing deprecation and removing the old version. Choose the window from contractual obligations, consumer upgrade cycles, and the actual migration effort; no single duration fits all APIs.

**Usage monitoring**: before retiring a version, verify that traffic has actually migrated. Retiring a version that still has active consumers because the migration deadline passed is a bad outcome. Check actual traffic, not just whether migration notices were sent.

**Hard cutoff vs. graceful degradation**: on the retirement date, does the old version return an error, redirect to the new version, or just stop working? Error with a clear message is usually the right approach. Silently redirecting can mask migration issues.

## API design for longevity

The best versioning strategy is to need fewer version bumps. API design choices that reduce the frequency of breaking changes:

**Additive design**: design APIs to be extended with new optional fields and endpoints, not redesigned. If the API must change, prefer adding over modifying.

**Hypermedia and resource URLs**: return URLs as opaque strings rather than constructing them in clients. If a resource moves, the API can update the URL returned without clients needing to change their URL construction logic.

**Tolerant reader pattern**: define handling of unknown fields explicitly. Clients can tolerate documented additive response fields, while servers should validate requests according to the contract and reject ambiguous or unsafe input.

**Avoid exposing internal structure**: an API that exposes your database schema directly will change every time your schema changes. APIs that model the domain (resources, actions, relationships) are more stable than APIs that expose implementation details.

*Designing a versioning strategy for a new API or working through how to deprecate a version of an existing API? [Happy to think through the trade-offs for your specific consumer base.](/contact)*

## Specify the contract before selecting the version marker

The version marker is a routing and negotiation mechanism. The contract includes much more: validation rules, defaults, ordering, pagination, authorisation, error types, side effects, and event delivery. An implementation can keep the same JSON schema and still break clients by changing a default sort order or interpreting a timestamp in another timezone. Review behaviour as well as field names.

Create a compatibility table from supported consumer expectations. For each proposed change, identify which clients may be affected and the evidence that establishes compatibility. An optional field can be safe for a tolerant parser and unsafe for a client that rejects unknown fields. Relaxing validation can also change behaviour if consumers depend on a previously rejected input producing an error. The support policy should say which assumptions clients may rely on.

Distinguish the product's release version from the API contract version. A deployment can fix an internal defect without changing the public contract. A library package can have its own semantic version while selecting a particular server contract. Conflating these identifiers makes migration guidance difficult to interpret: a client upgrade does not necessarily mean an API-version upgrade, and the reverse can also be true.

## Work a migration inventory

Suppose a fictional API has fifteen registered integrations. Nine pass the replacement contract suite, four are in active migration, and two have no confirmed owner. Verified migration readiness is 9/15, or 60%. The remaining six cannot be counted as complete simply because they produced no traffic yesterday. The chart shows the inventory categories and keeps missing ownership visible.

For each integration, record the relevant business cycle, selected contract version, client library version where applicable, owner, last successful test, and cutover evidence. A nightly job and a quarterly reporting tool need different observation windows. Use service identifiers rather than retaining sensitive request payloads merely to discover who calls an endpoint.

Ask migrated clients to stop using the old path in an isolated or controlled test first. Confirm that monitoring identifies a forgotten dependency and that the error points to the migration instructions. Do not silently redirect a non-compatible write request to a new version; a new URL can have different validation or side-effect semantics. A redirect is a contract decision, not a universal retirement mechanism.

## Communicate deprecation and sunset accurately

Deprecation announces that a resource or contract should no longer be adopted for new work. Sunset communicates an expected time after which it may become unavailable. They are different events. RFC 9745 defines the `Deprecation` response header using a structured date value, while RFC 8594 defines `Sunset` using an HTTP-date. Do not invent a `Deprecated: true` header and describe it as the standard field.

For an actual implementation, generate the dates from one reviewed configuration and test their syntax. Ensure that the sunset does not precede the deprecation date. Link to the migration guidance and describe the scope: one resource, a group of resources, or the entire version. Headers supplement release notes and direct communication with known consumers; they do not ensure that a human will notice a notice in an automated client's response.

The support window should follow the product's agreements, consumer deployment constraints, and risk. There is no universally correct number of months for all external or internal APIs. A mobile application with infrequent upgrades differs from a centrally managed internal service. Estimate the migration work before choosing a date that the provider cannot realistically honour.

## Test the version boundary through the deployed path

Run requests through the gateway and any cache, not just directly against the application. Verify version selection when the marker is present, absent, invalid, or inconsistent with another selector. Do not allow two selectors to disagree silently. If a header changes the representation, check that caches distinguish the variants according to the applicable cache and `Vary` rules.

Include events and webhook retries in the migration suite. A server upgrade may emit a new event shape while an older delivery remains queued. Consumers need a documented way to identify and process the supported representations. Keep stored examples for older versions so a new deserializer cannot accidentally break replay.

## Make retirement a completed operational change

Before removal, reconcile the consumer inventory, the communication record, and test evidence. Name the person accountable for unresolved cases and for the final decision. After retirement, remove obsolete routing, credentials, documentation links, and monitoring expectations. Preserve a concise historical record of the contract and its replacement so later incident investigation can interpret old records.

Use a rehearsal with synthetic clients to verify the retirement response and support instructions. A completed version migration means that consumers have a supported path and the provider has removed the old obligations deliberately. Publishing a new endpoint alone does not establish that outcome.

## Further reading and source boundaries

- [RFC 9745: Deprecation header](https://www.rfc-editor.org/rfc/rfc9745.html)
- [RFC 8594: Sunset header](https://www.rfc-editor.org/rfc/rfc8594.html)
- [Stripe API versioning](https://docs.stripe.com/api/versioning)
