---
title: "API Design for Long-Lived Systems: What Survives Five Years"
description: "API design decisions made in week one can haunt a system for years. These are the principles I've seen hold up — and the ones that look right initially but don't."
date: 2025-04-23
tags: ["Programming", "API Design", "Software Engineering", "Distributed Systems"]
format: article
---

Most APIs are designed to solve the problem in front of you. The good ones are also designed for problems you haven't encountered yet: new consumers, schema changes, versioning requirements, deprecation. The difference between these two approaches is usually not visible for 12–18 months. Then it becomes the source of at least one painful migration.

These are the principles I've seen hold up.

## Version from the Start, Even If You Don't Need It Yet

Including a version segment in your API path (`/api/v1/resource`) when you launch feels like over-engineering. It isn't. The alternative — versioning later when you have multiple consumers you can't migrate simultaneously — requires introducing versions under pressure, while backward-compatible change is no longer possible.

The version segment costs nothing when you add it. The absence of it costs significantly when you need to add it retroactively.

What version means in practice: a commitment to backward compatibility within a version, and a migration window when moving consumers to a new version. Both require explicit policy. Write the policy when you write the API, not when you're managing the migration.

## Resource Semantics, Not Operation Semantics

The most durable APIs are resource-oriented: `POST /orders` creates an order, `GET /orders/{id}` retrieves it, `PATCH /orders/{id}` modifies it. The least durable are operation-oriented: `POST /createOrder`, `POST /cancelOrder`, `POST /refundOrder`.

Why it matters: resource-oriented APIs compose naturally as requirements grow. Operation-oriented APIs accumulate endpoints, each of which is a new surface area to maintain, version, and document.

The common objection: some operations don't map cleanly to resources. True. The answer is to introduce a resource for the operation itself where appropriate: `POST /orders/{id}/cancellations` rather than `POST /cancelOrder?orderId={id}`. The resource model stays consistent.

## Be Conservative with What You Accept, Liberal with What You Return

Strict on inputs, generous on outputs.

**Inputs**: validate aggressively. Reject unknown fields (or at least fail with a clear error). Return informative validation errors with field-level detail. An API that accepts garbage silently is hard to debug and impossible to evolve safely.

**Outputs**: return more than the minimum. Additional fields in a response don't break existing consumers (in most serialisation frameworks). Removing fields does. Design responses with the assumption that future consumers will want fields you haven't thought of yet.

## Error Design Is Product Design

Error responses are as much part of your API contract as the happy path. The things that matter:

**Machine-readable error codes** distinct from HTTP status codes: `{ "code": "ORDER_NOT_FOUND", "message": "..." }`. Consumers can programmatically distinguish error types without parsing error strings.

**Consistent structure across all endpoints**: same error schema everywhere. This sounds obvious; it's violated constantly.

**Actionable messages for client errors**: "Invalid email address format" is actionable. "Bad Request" is not. Your error messages will end up in consumer logs, support tickets, and debugging sessions at 2am. Write them for that audience.

**Appropriate use of HTTP status codes**: 400 for client errors, 401/403 for auth, 404 for missing resources, 422 for validation failures, 500 for server errors. Not everything is a 200. Not everything is a 500. The status code is part of the contract.

## Pagination Design

Any collection endpoint that can return more than 100 items needs pagination. Two patterns with different trade-offs:

**Offset pagination** (`?page=2&limit=50`): simple to implement and understand, but breaks under concurrent modification — items can be skipped or duplicated if the collection changes between pages. Acceptable for low-write collections.

**Cursor pagination** (`?after=last_item_cursor&limit=50`): stable under concurrent modification. Required for real-time or high-write collections. Slightly more complex to implement, but produces consistent results.

Default to cursor pagination for anything that changes frequently. Include a `next` link in the response for discoverability — don't make consumers construct the next page URL themselves.

## The Documentation That Gets Read

API documentation gets read when something is broken. Design it for that context:

- Working code examples for every endpoint, in the languages your consumers actually use
- Error code reference with when each error occurs and how to recover
- Changelog with a clear record of breaking vs. non-breaking changes
- Deprecation notices with a timeline and migration guide before anything is removed

The documentation that doesn't get read: long descriptive paragraphs about what the API does. Developers skip directly to the example. Start with the example.

---

*Building an internal or external API and thinking through the design? [Happy to workshop it.](/contact)*
