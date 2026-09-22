---
title: "API Versioning: The Decisions That Haunt You and How to Make Them Well"
description: "URL versioning vs. header versioning vs. content negotiation — what each approach costs, when the decision locks you in, and the mistakes that are cheapest to avoid at the start."
date: 2028-11-15
tags: ["API Design", "Software Engineering", "Programming"]
format: article
---

API versioning is a decision that feels small at design time and becomes important in proportion to your API's success. A lightly used internal API can evolve freely. A public API with hundreds of integrations cannot.

The versioning strategy you choose on day one shapes your ability to evolve the API on day one thousand.

## The three common approaches

**URL versioning** (`/v1/users`, `/v2/users`) is the most visible and the most pragmatic. It is explicit — the version is right there in the URL. It is cache-friendly. It is easy for clients to understand. The cost is that it forces a URL change on every breaking change, and managing multiple active versions means running multiple codebases or routing layers.

**Header versioning** (`Accept: application/vnd.myapi.v2+json`) keeps URLs clean. It is technically more RESTful. The practical cost is that it is invisible in browser address bars, harder to test with curl, harder for less technical API consumers to understand, and requires more careful content negotiation logic.

**Date-based versioning** (`/2024-01-01/users`, or `API-Version: 2024-01-01` header) — used by Stripe, Cloudflare, and others — versions by date rather than integer. This is elegant for long-lived APIs because the client is pinned to a specific contract date, and you know exactly which clients are on which version of the behavior. It requires discipline in your changelog and careful sunset communication.

## The decisions that actually haunt you

**Not versioning at all on a public API.** The "we'll add versioning when we need it" approach works until the first breaking change, at which point the entire API has to be versioned retroactively — a painful, disruptive process.

**Inconsistent versioning.** Some endpoints on v1, some on v2, some not versioned. This is the result of growing an API without a strategy and is extremely difficult to clean up.

**Not defining what constitutes a breaking change.** Adding a required field is breaking. Renaming a field is breaking. Changing an enum is breaking. Changing error code semantics is breaking. If your team has not defined this in writing, you will discover disagreements about it in a release post-mortem.

**Not committing to a sunset timeline.** If you say v1 will be supported for 12 months, support it for 12 months and then remove it. If you never remove old versions, you support them forever, and the complexity of maintaining four active API versions eventually becomes more expensive than the breaking change would have been.

The best API versioning strategy is the one your team will actually follow consistently. Pick one. Document what a breaking change is. Commit to a support window. Then ship.
