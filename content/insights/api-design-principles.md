---
title: "API Design for Long-Lived Systems: What Survives Five Years"
description: "Evaluate API contracts through resource modeling, error semantics, idempotency and compatibility, with concrete tests for behavior that callers can rely on."
date: 2028-01-07
tags: ["Programming", "API Design", "Software Engineering", "Distributed Systems"]
format: article
---

Most APIs are designed to solve the problem in front of you. The good ones are also designed for problems you haven't encountered yet: new consumers, schema changes, versioning requirements, deprecation. The difference between these two approaches is usually not visible for 12–18 months. Then it becomes the source of at least one painful migration.

The following principles make those commitments explicit.

## Version from the Start, Even If You Don't Need It Yet

Including a version segment in your API path (`/api/v1/resource`) when you launch feels like over-engineering. It isn't. The alternative — versioning later when you have multiple consumers you can't migrate simultaneously — requires introducing versions under pressure, while backward-compatible change is no longer possible.

An explicit version-selection policy can reduce ambiguity, but a path segment is only one option and still creates a support commitment.

What version means in practice: a commitment to backward compatibility within a version, and a migration window when moving consumers to a new version. Both require explicit policy. Write the policy when you write the API, not when you're managing the migration.

## Resource Semantics, Not Operation Semantics

Resource-oriented APIs can offer a consistent model: `POST /orders` creates an order, `GET /orders/{id}` retrieves it, `PATCH /orders/{id}` modifies it. Command-oriented APIs express operations directly: `POST /createOrder`, `POST /cancelOrder`, `POST /refundOrder`.

Why it matters: resource-oriented APIs compose naturally as requirements grow. Operation-oriented APIs accumulate endpoints, each of which is a new surface area to maintain, version, and document.

The common objection: some operations don't map cleanly to resources. True. The answer is to introduce a resource for the operation itself where appropriate: `POST /orders/{id}/cancellations` rather than `POST /cancelOrder?orderId={id}`. The resource model stays consistent.

## Be Conservative with What You Accept, Liberal with What You Return

Strict on inputs, generous on outputs.

**Inputs**: validate aggressively. Reject unknown fields (or at least fail with a clear error). Return informative validation errors with field-level detail. An API that accepts garbage silently is hard to debug and impossible to evolve safely.

**Outputs**: return the documented fields needed by the use case. Avoid exposing unnecessary sensitive data. Additive changes can be compatible when supported consumers tolerate them, but strict parsers and enum handling require explicit tests.

## Error Design Is Product Design

Error responses are as much part of your API contract as the happy path. The things that matter:

**Machine-readable error codes** distinct from HTTP status codes: `{ "code": "ORDER_NOT_FOUND", "message": "..." }`. Consumers can programmatically distinguish error types without parsing error strings.

**Consistent structure across all endpoints**: same error schema everywhere. This sounds obvious; it's violated constantly.

**Actionable messages for client errors**: "Invalid email address format" is actionable. "Bad Request" is not. Your error messages will end up in consumer logs, support tickets, and debugging sessions at 2am. Write them for that audience.

**Appropriate use of HTTP status codes**: 400 for client errors, 401/403 for auth, 404 for missing resources, 422 for validation failures, 500 for server errors. Not everything is a 200. Not everything is a 500. The status code is part of the contract.

## Pagination Design

Collection endpoints need an explicit bounded-response policy based on their payload and workload. Two patterns with different trade-offs:

**Offset pagination** (`?page=2&limit=50`): simple to implement and understand, but breaks under concurrent modification — items can be skipped or duplicated if the collection changes between pages. Acceptable for low-write collections.

**Cursor pagination** (`?after=last_item_cursor&limit=50`): can avoid some offset-shift problems when based on a stable ordered key. It does not guarantee snapshot consistency under all inserts, updates, or deletions.

Default to cursor pagination for anything that changes frequently. Include a `next` link in the response for discoverability — don't make consumers construct the next page URL themselves.

## The Documentation That Gets Read

API documentation gets read when something is broken. Design it for that context:

- Working code examples for every endpoint, in the languages your consumers actually use
- Error code reference with when each error occurs and how to recover
- Changelog with a clear record of breaking vs. non-breaking changes
- Deprecation notices with a timeline and migration guide before anything is removed

The documentation that doesn't get read: long descriptive paragraphs about what the API does. Developers skip directly to the example. Start with the example.

*Building an internal or external API and thinking through the design? [Happy to workshop it.](/contact)*

## Model a complete operation, including uncertainty

An API contract describes the outcomes a caller can rely on. Start with one operation and write its state transitions before choosing endpoint names. For a fictional report request, the states might be accepted, running, completed, failed, and cancelled. Define which states are terminal, how a client discovers progress, and whether cancellation can race with completion. An attractive resource model is useful only if these behaviours are understandable.

Separate a request identifier from a business idempotency key. The first helps locate a particular attempt in telemetry; the second can identify repeated attempts at the same intended operation. Define the key's scope, retention, and behaviour when a caller reuses it with a different payload. Do not imply that adding a header alone makes every side effect idempotent. The server needs durable rules for recognising and resolving repeated work.

For a worked example, suppose 1,000 intended report jobs produce 1,080 request attempts because 80 attempts are retries. If the service starts one job per attempt, it creates 80 excess jobs. A correct deduplication contract produces 1,000 jobs while still recording all 1,080 attempts for operational analysis. The chart compares intended work with attempts; it does not claim a measured customer duplicate rate or guarantee that every implementation deduplicates correctly.

## Make the failure contract useful to software and people

Choose stable machine-readable problem types and provide a concise human explanation. A response should not require a consumer to parse a sentence to decide whether an input can be corrected. For field validation, define paths and codes that let a client associate the error with a control. Avoid returning internal stack traces or sensitive record details. A correlation identifier can help support find internal evidence without exposing it publicly.

Status classes are useful signals, but retry behaviour depends on the operation and failure. A client may retry a throttled request after an appropriate delay, while a repeated side-effecting operation can be unsafe even after a server error. Explain any `Retry-After` handling and the overall deadline. If the server cannot determine whether an earlier request completed, expose a way to query the operation's outcome rather than encouraging blind resubmission.

Use contract tests for malformed input, missing permission, a conflict, a rate limit, and a downstream failure. Check both the HTTP status and the documented body. A framework upgrade can preserve successful responses while changing validation errors; consumers need that path tested too.

## Bound collections without promising a snapshot accidentally

Choose a page-size limit from measured query, response, and client costs rather than a universal item threshold. A response containing ten large documents may cost more than one containing a thousand small identifiers. State the maximum and the behaviour for invalid page sizes. Keep filtering and sorting explicit so callers do not accidentally download an entire dataset to find a few records.

A cursor should represent a defined position in a stable ordering, usually with a unique tie-breaker. It is not automatically a snapshot of a changing collection. Updates to sort keys, deletions, and changes in filters can still affect traversal. If an export needs a fixed snapshot, design that separately using the database or export mechanism appropriate to the system.

Treat cursor contents as an implementation detail. Bind a cursor to relevant filters or reject incompatible reuse, validate its integrity, and reapply authorisation on every page. A cursor that once pointed at an authorised row does not grant permanent permission to all later rows. Test a user whose permissions change between page requests.

## A practical review worksheet

For one endpoint, record its caller, required permission, stable identifiers, input limits, success state, error types, retry policy, pagination semantics, and compatibility promise. Add one example for each meaningful outcome. Ask someone who did not implement the endpoint to build a small test client using only the documentation and a sandbox.

Introduce a controlled failure after the server commits work but before the response reaches the client. Check whether the client can recover without duplicating the business action. Next, return an unfamiliar optional response field and an unfamiliar enum value. Determine whether the supported consumer contract allows those additions and whether the client behaves accordingly.

Finally, make a small compatible server change while the old client continues to run. The exercise reveals whether the claimed support policy exists in tests or only in prose. Keep its results with the API definition and revisit them when the representation, gateway, authentication, or client generator changes. Long-lived APIs need a repeatable way to evaluate change, not a prediction of every field a future consumer might want.

## Further reading and source boundaries

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9457: Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html)
- [PostgreSQL: LIMIT and OFFSET](https://www.postgresql.org/docs/16/queries-limit.html)
