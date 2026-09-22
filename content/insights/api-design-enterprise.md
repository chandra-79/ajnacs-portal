---
title: "API Design for Enterprise Systems: The Decisions That Age Well"
description: "An API that's easy to build against is easy to build wrong. The decisions around versioning, error models, pagination, idempotency, and authentication compound over time — here's how to make the ones that don't cause regret."
date: 2026-11-06
tags: ["Programming", "Architecture", "Cloud Architecture"]
format: article
---

APIs are commitments. Unlike internal code that you can refactor freely, a published API has consumers who depend on its stability. A breaking change in an API affects every consumer simultaneously, and the larger the consumer base, the more expensive it is to make.

The decisions worth getting right at design time are the ones you'll be living with for years.

## Versioning: have a strategy before you need it

The two common REST API versioning strategies:

**URL path versioning** (`/v1/orders`, `/v2/orders`): explicit, visible, easy to route, easy for consumers to understand which version they're using. The downside: versioning in URLs is considered not "pure REST" by some, and running multiple versions in production means maintaining multiple codebases or careful compatibility shims.

**Header versioning** (`Accept: application/vnd.company.v2+json` or `API-Version: 2`): keeps URLs clean, allows the same URL to serve different versions. Less discoverable — consumers have to read the documentation to understand how to request a version.

For internal APIs with a limited, known consumer base, header versioning is clean. For public APIs or APIs consumed by external partners, URL versioning is more practical — it's explicit, it shows in browser history, and it's harder to get wrong accidentally.

**What constitutes a breaking change** (requires a new version):
- Removing a field from a response
- Changing a field's type
- Making a previously-optional request field required
- Changing the semantics of an existing field

**What isn't a breaking change** (additive, backward-compatible):
- Adding new optional fields to a response
- Adding new optional request parameters
- Adding new endpoints
- Adding new enum values (though consumers should handle unknown enum values gracefully)

Build consumers to be tolerant of new fields in responses — if your JSON deserialisation fails on unknown fields, you'll have a harder time adding fields non-breakingly.

## Error models: structured, consistent, actionable

An error response that says `{"error": "Something went wrong"}` is unhelpful for debugging and useless for programmatic error handling.

A useful error model:

```json
{
  "error": {
    "code": "ORDER_ITEM_UNAVAILABLE",
    "message": "Item SKU-789 is no longer available for purchase",
    "detail": "The requested quantity (5) exceeds available stock (2)",
    "request_id": "req-a3b4c5d6",
    "documentation_url": "https://api.company.com/docs/errors/ORDER_ITEM_UNAVAILABLE"
  }
}
```

Components:
- **`code`**: a stable, machine-readable string. Consumers can programmatically handle `ORDER_ITEM_UNAVAILABLE` differently from `PAYMENT_DECLINED` without parsing human-readable messages. Don't use integers — strings are self-documenting in logs.
- **`message`**: a human-readable description of what went wrong.
- **`detail`**: optional, contextual information that helps diagnosis.
- **`request_id`**: the ID that ties the error to your internal logs. Tell consumers to include this when reporting issues — it eliminates a round trip of "what were you doing when this happened?"
- **`documentation_url`**: optional but genuinely useful for common errors.

Use HTTP status codes correctly: 400 for client errors (invalid input), 401 for unauthenticated, 403 for authenticated but unauthorised, 404 for not found, 409 for conflict (duplicate resource, optimistic locking failure), 422 for valid JSON but semantically invalid request, 429 for rate limiting, 503 for service unavailable.

## Idempotency: safe retries without duplicate operations

POST requests are not idempotent by default — if the client sends the same POST twice (due to a timeout or retry), the server creates two resources. For operations with real-world effects (creating an order, initiating a payment), duplicate execution has consequences.

The idempotency key pattern: the client generates a unique key for the operation and sends it as a header (`Idempotency-Key: uuid`). The server stores the result of the operation indexed by the key. If the same key is sent again, the server returns the stored result rather than re-executing the operation.

```
POST /orders
Idempotency-Key: 7f3b2a1c-4d5e-6f7a-8b9c-0d1e2f3a4b5c
Content-Type: application/json

{ "customer_id": "cust-123", "items": [...] }
```

The client retries on timeout or 5xx, sending the same `Idempotency-Key`. The second request either: arrives after the first completed (returns the original response), arrives while the first is still processing (returns 202 Accepted and the client polls), or the first request never reached the server (processes normally and stores the result).

Idempotency keys are stored with a TTL (typically 24 hours). After the TTL, a key can be reused.

## Pagination: cursor-based for anything that changes

Offset pagination (`?page=2&limit=20`, or `?offset=40&limit=20`) is easy to implement and familiar, but breaks when the underlying data changes between requests. If someone inserts a record between page 1 and page 2, page 2 repeats a record. If someone deletes a record, page 2 skips one.

Cursor-based pagination returns an opaque cursor pointing to the position in the result set:

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzNH0",
    "has_more": true
  }
}
```

The cursor encodes enough information to resume from the exact position (typically an encoded ID or timestamp). It's stable against inserts and deletes.

The trade-off: cursor pagination doesn't allow jumping to page 10 directly. For most APIs, this is fine — consumers are paginating through results sequentially. If random page access is required (display "page 10 of 47"), offset pagination with the dataset's instability documented is acceptable.

## Authentication: one pattern per API type

For public APIs and partner integrations: **API keys** for simple cases, **OAuth 2.0 / JWT** for anything involving user identity or fine-grained scopes.

OAuth 2.0 with short-lived access tokens (15-60 minutes) and long-lived refresh tokens. The access token is validated on every request (signature verification, expiry check); the refresh token is only used when the access token expires.

For service-to-service APIs within your infrastructure: **mutual TLS** (mTLS) or **JWT signed with service-specific keys**. The calling service proves its identity; the receiving service verifies the signature without a round-trip to an auth server.

What to avoid: long-lived API keys with no expiration, shared keys used by multiple services (no individual service audit trail), and custom authentication schemes. The OAuth 2.0 ecosystem is mature; don't reinvent it.

## Documentation as a first-class deliverable

An API that isn't documented is an API that requires its consumers to read your code or ask your team questions. For internal APIs, this is friction. For external APIs, it's a barrier to adoption.

OpenAPI (Swagger) specification as the source of truth, generated documentation published alongside the API, and runnable examples (Swagger UI or Redoc) are the minimum. An API changelog documenting what changed in each version — especially breaking changes — is worth maintaining even for internal APIs.

The documentation is the contract. When consumers build against the documentation, the documentation becomes the specification you're committed to maintaining.

*Designing a new API or auditing an existing one for consistency and longevity? [Happy to compare approaches.](/contact)*
