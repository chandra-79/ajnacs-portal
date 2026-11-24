---
title: "API Design for Enterprise Systems: The Decisions That Age Well"
description: "An API that's easy to build against is easy to build wrong. The decisions around versioning, error models, pagination, idempotency, and authentication compound over time — here's how to make the ones that don't cause regret."
date: 2026-11-06
tags: ["Programming", "Architecture", "Cloud Architecture"]
format: article
---

APIs are commitments. Unlike internal code that you can refactor freely, a published API has consumers who depend on its stability. A breaking change in an API affects every consumer simultaneously, and the larger the consumer base, the more expensive it is to make.

The decisions worth getting right at design time are the ones you'll be living with for years.

## What to measure

**Retry safety for mutating requests.** Send 100 duplicate requests with the same idempotency key through the normal timeout and retry path. Count additional writes and mismatched responses separately. A pass for this test means zero extra writes and a consistent response for a given payload; a reused key with a different payload is a separate case.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

*Designing a new API or auditing an existing one for consistency and longevity? [Happy to compare approaches.](/contact/)*

## Test compatibility from both sides of the contract

Build a compatibility suite with a previously published client and one new client. Exercise the response as a real consumer sees it, including wire types, missing values, headers, ordering and assumptions about maps or enums. A newly added enum value can break a generated client even when the JSON field still has its documented type. Run the old client against the new service and test failures as carefully as the happy path. For the public schema, document which fields and enumerations are open to future extension. [OpenAPI Specification 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)

When a change requires moving clients to a new contract, make the migration measurable. Inventory active consumers by supported version and put the proposed replacement against their saved integration tests. Agree on a retirement criterion that accounts for traffic and contractual obligations. Consider a hypothetical retirement dashboard where 98% of endpoint requests use the new version, but one monthly settlement consumer has yet to move. That consumer could be invisible during a normal week, so the team needs a successful parallel settlement or an explicitly agreed exception before choosing a removal date.

## Make a retried mutation an observable state machine

For an order-creation endpoint, scope a key to the authenticated tenant and operation. Persist a fingerprint of the inputs that determine the action. Define what happens while work is in progress, after success and after an error. A key reused with a different request is an input conflict even when the original request has finished. Responses must be scoped to the same actor or owner authorised to retrieve the result. Avoid storing secrets in a fingerprint diagnostic, and document how clients can recover when the original result is no longer retained.

The key claim and the local write need a clear atomic boundary. In a single relational store, a unique key and transaction can let one request establish the operation before performing a write. For work involving an external system, a committed order and a pending message can be recorded together, with the downstream operation correlated using its own idempotency or reconciliation contract. Keep a stable lookup resource or status so a lost response does not require creating another order. Pick a retention period long enough to cover real retry and recovery windows. If an operation can be retried after it expires, consider a durable business identifier that survives the deduplication record.

Test concurrent duplicates, a disconnect after commit, a crash after an external action, different bodies under the same key and a retry after expiry. Suppose an illustrative exercise issues 12 concurrent duplicate requests for one order. The useful result is one order, one allowed side effect and 12 observations tied to the same operation, with intermediate responses consistent with the published status contract. A uniform status code across responses tells you little about those invariants. HTTP defines a method as idempotent based on the intended effect, and a POST operation’s retry behaviour depends on the contract you implement. [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)

## Write the cursor contract around real update behaviour

Order rows by a stable, deterministic tuple such as creation time and record ID. Use the entire tuple, including the tie-breaker, to resume where the page ended. Treat cursors as opaque externally and validate their scope, compatible filters and expiration on arrival. An encoded cursor alone does not provide integrity or authorisation. Check the permissions at each request, including after a user's access changes between pages.

A live cursor gives a stable position relative to its sort key. It is different from a snapshot. If a user changes a sort key such as priority during a scan, the record can move to either side of the boundary. If the consumer is exporting a settlement batch, use a stable high-water mark, a snapshot capability or a separately materialised export with a stated revision. Then document how corrections after the cutoff become visible. For an activity feed, a live view can be sufficient if its behaviour around inserts and deletions is explicit.

Create a pagination fixture with multiple rows having the same timestamp and a small page size. Test navigating across the tie, deleting an already returned row and inserting a new record at each side of the boundary. Show whether each test expects a stable snapshot, a live position or an intentionally expired cursor. Test the documented maximum page size as part of resource budgeting.

## Make failures consistent from the gateway to the application

Use the HTTP status for the broad interaction and a stable problem identifier for consumer logic. RFC 9457 specifies the `application/problem+json` representation with a problem `type` and fields such as `status` and `detail`. Consumers should be able to decide whether to correct input, refresh credentials, retry or escalate without interpreting human prose. Publish test responses for malformed inputs and transient failures. Avoid echoing internal stack traces or sensitive request data, and keep a correlation identifier that support can use. [Problem Details for HTTP APIs, RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)

If a partner is rate limited, make the quota dimensions and retry behaviour clear. When applicable, use `Retry-After` and demonstrate how callers should cap and spread their retries so recovery does not create a second burst. Include error formats emitted by the gateway as part of the contract and test the result when a request is rejected before it reaches the service. When credentials rotate, test how callers observe the change and how long it takes for the new credential to work. OAuth access tokens can be opaque or structured. Apply the validation required by the chosen issuer and token profile, and centralise decisions such as audience and permission verification. [OAuth 2.0 security best current practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)

## Measure use after shipping the contract

Track the proportion of requests clients reject locally, the fraction of mutations retried and recovered, and the incidence of expired cursors by consumer type. A high retry-recovery rate paired with rising timeouts can point to reliability work even while deduplication is functioning. Keep sample sizes, time windows and exclusions on those charts. Review the data after the first partner rollout. Update the examples when observed integration questions reveal incomplete contractual details, and hold future changes against these examples in continuous integration.

Review the evidence with the support team that handles consumer incidents. For a hypothetical release, a team sees 10,000 attempted operations and 350 retries. Thirty retries return the existing result after a client timeout, while six produce a contract conflict. Those are different observations about the service. Investigate whether conflicts came from the same client submitting different payloads or from confusing guidance about when to generate a key. Fold the answer into a test case and improve the documentation if it would let readers distinguish when a new logical operation begins.

Track each resulting documentation change.
