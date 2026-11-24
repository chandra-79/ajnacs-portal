---
title: "SDK Design: The Client Library as the API's Real Interface"
description: "Most developers never touch your REST endpoints — they touch your SDK, and its quality decides integration success. Generation vs handcraft, the reliability behaviors clients deserve by default, the idiomatic-per-language bar, and the versioning contract."
date: 2028-02-28
tags: ["API Design", "Developer Experience", "Programming", "Engineering Practice", "Platform Engineering"]
format: article
---

API teams lavish design attention on their HTTP surface — resource modeling, error contracts, pagination semantics — and then ship the layer through which most consumers actually experience all of it as an afterthought: the SDK, generated on a Friday or hand-grown by whoever complained loudest. The inversion is costly because the SDK *is* the interface for the majority of integrations, and its quality compounds in both directions: a good client library can provide tested defaults for retries and pagination while requiring explicit caller input for business identity, deadlines and other application-specific decisions; a bad one converts your careful contract into per-customer folklore and your support queue into a distributed debugging service.

## The design bar: correct by default, idiomatic per language

The SDK's first job is encoding the behaviors your API's reliability model *depends on* consumers having — the ones the docs ask for and integrators skip: **retries with exponential backoff and jitter, honoring Retry-After, budget-capped** (the retry-storm physics say your SDK's defaults *are* your load profile during incidents — shipping the correct behavior is self-defense), **idempotency keys managed under the API contract, with caller-supplied identity supported** for the operations that need them (the double-charge prevention from idempotency practice shouldn't depend on the integrator reading that chapter — the SDK can mint and reuse a key across its own retries, while callers may need persistent keys across process restarts), **pagination as iteration** (the cursor mechanics wrapped in the language's native iterator/async-iterator idiom — consumers write `for order in client.orders.list()` and the SDK walks cursors, respects rate headers, and stops correctly; hand-rolled pagination loops are where the skip-and-duplicate bugs live), **timeouts with sane defaults and per-call overrides** (the timeout-hierarchy discipline, pre-wired), **auth lifecycle handled** (token refresh, credential rotation hooks — the OAuth machinery from identity practice, invisible), and **typed errors matching the API's taxonomy** (the problem-details contract surfaced as catchable, documented exception types with the retryability flag attached — so client code branches on `RateLimitError` versus `ValidationError` rather than parsing strings).

The second job is *feeling native* per language — the bar that pure generation struggles to clear: naming conventions, error idioms, async models (asyncio-native for Python per the async disciplines, promises in JS, contexts in Go), the packaging norms of each ecosystem (the lockfile-friendly, semver-honest publishing from dependency practice), and type definitions as first-class (the typed-boundary payoff: the SDK's types *are* the API contract in the consumer's IDE — autocomplete makes contract information available in the editor, and clear types can also help coding tools produce integrations that still require testing, which is quietly becoming a distribution channel: the SDK that models well prompts well).

## The production architecture: generate the skeleton, craft the muscle

A useful option is a hybrid design: **the OpenAPI/contract spec generates the mechanical tier** (models, serialization, endpoint bindings — improving coverage when the specification and generator support the required semantics, per the docs-from-truth principle: the spec is the source, and mechanical repetition is reduced, while specification accuracy, generator behaviour and runtime tests still determine fidelity), while **a handcrafted layer owns the experience tier** (the retry/idempotency/pagination behaviors above, the ergonomic entry points, the per-language idiom) — with modern SDK-generation platforms (the Fern/Stainless-class tooling that the major API companies converged on) productizing exactly this split. The operational corollaries: the spec becomes load-bearing beyond docs (its accuracy is now a release gate — the contract-testing disciplines apply), SDK releases ride CI from spec changes (new endpoint merged → SDKs regenerated, tested, published across languages — the multi-repo automation from polyrepo practice), and the language matrix is a *commitment*, chosen deliberately (each language is a permanent maintenance surface with its own ecosystem cadence — the tiering answer: first-class languages with full experience layers, generated-only tier for the long tail, and honesty in the docs about which is which).

## The contract: versioning, telemetry, and support reality

The SDK inherits every API-evolution discipline with extra surfaces: **semver honesty** (breaking the SDK's types or behavior is a major version even when the wire API didn't change — consumers pin your library, not your endpoints), **deprecation with runtime signals** (the deprecated method that warns with a migration pointer beats the changelog nobody reads — the usage-tracking dividend: privacy-appropriate version and feature telemetry can inform retirement, but incomplete coverage and offline clients mean it cannot establish that every consumer has migrated, per the deprecation-evidence practice), **a support-window policy published** (which majors get security patches, for how long — the enterprise procurement question that arrives with the first big customer), and **the transitive-dependency diet** (every dependency your SDK carries is a version-conflict lottery ticket in the consumer's build — the mature SDKs vendor or minimize aggressively, because being the library that broke someone's unrelated upgrade is how you get ripped out). And instrument the funnel like the product surface it is: time-to-first-successful-call *through the SDK* (the docs-metric from developer-experience practice, now measured at the layer most integrations actually use), error rates by SDK version (the client-side telemetry — with consent and privacy discipline — that turns "integrations are struggling" from support anecdote into dashboard), and the issues/discussions channel staffed as the developer-experience front line it is.

The closing reframe: an API without a serious SDK strategy is a specification hoping its consumers are diligent — and the whole arc of this series says systems that depend on distributed diligence lose to systems that encode the behavior. The SDK is where your platform's reliability disciplines — retries, idempotency, pagination, timeouts, typed errors — stop being documentation and become defaults, shipped to every integration, in every language, maintained like the product it actually is. The endpoints are the contract; the SDK is the handshake — and handshakes are what integrations remember.

## Treat the SDK as a stateful reliability participant

A client library does more than serialize JSON. It chooses connection reuse, retry timing, cancellation behaviour, and how uncertainty is exposed to the caller. Those choices can change the load seen by the service and the effects produced by an integration. Document them as part of the supported interface.

For a fictional report-creation operation, an SDK-generated idempotency key can protect retries made inside one method call. It does not automatically protect a new method call after the application process restarts. The application may need to supply and persist the key associated with the logical job. Give callers that control instead of hiding identity entirely inside the library.

Define the key's scope and lifetime according to the actual API. A provider can have different rules across operations or API versions. If a key expires while a job remains uncertain, the SDK should not imply that reusing it still guarantees duplicate suppression. Provide an explicit lookup or reconciliation path where the server contract supports one.

## A hypothetical layered-retry calculation

Suppose an SDK permits up to three attempts, while the application wraps the SDK call in another three-attempt loop. One logical operation can then trigger as many as nine HTTP attempts. For 100 operations during an outage, the ceiling is 900 attempts. With one coordinated three-attempt policy, the corresponding ceiling is 300.

The chart compares those synthetic upper bounds. It assumes every attempt reaches the next layer and fails in a retry-eligible way. It does not predict actual outage traffic or recovery success. The example shows why the SDK should expose retry settings and attempt metadata clearly enough that callers do not accidentally multiply policies.

Use a total deadline as well as an attempt count. Backoff, connection-pool wait, token refresh, and response reading all consume time. Respect server retry guidance within the remaining budget, and stop promptly when the caller cancels. A library that continues retrying after the application abandons the operation wastes resources and may create confusing late effects.

## Iteration should preserve the pagination contract

An automatic iterator needs to follow the server's continuation signal, including any permitted empty page with a next token. It should not infer completion solely from a short item list. Expose page-level access for callers who need durable checkpoints, diagnostics, or control over request scheduling.

Bound prefetch and memory use. A convenient iterator that eagerly downloads an entire collection can surprise callers with latency, memory growth, and rate-limit consumption. Explain whether the iterator fetches on demand, supports cancellation, and can resume from a stored cursor. Preserve the server's ordering and snapshot limitations in the documentation.

Test an expired cursor, a repeated token, a malformed response, and cancellation between pages. A repeated token should not create an infinite loop. If the SDK offers automatic restart, it must explain whether that can repeat items and what the caller should do about side effects. Convenience should not hide correctness-relevant behaviour.

## Preserve useful error information without leaking data

Typed errors should carry the stable problem identifier, HTTP status when available, retry guidance, and a non-sensitive request identifier. Network failures may have no HTTP response at all. Distinguish timeout, cancellation, invalid response, authentication failure, and business rejection so the caller can choose an appropriate action.

Do not require applications to parse a human message. Preserve the underlying cause for diagnostics where the language supports it, but avoid including secret headers or full request bodies in default logs. A debug mode should state what it captures and offer redaction hooks. An SDK is often embedded in environments whose logging policies the API team does not control.

Unknown fields and enum values need an evolution policy. Rejecting every additive response field can break clients unnecessarily; accepting an unknown status as success can be worse. Model an unknown case where appropriate and document whether callers must handle it. Generated types alone do not decide runtime compatibility.

## A language-specific contract lab

Create a controllable local HTTP server with fixtures for success, validation failure, rate limiting, delayed responses, connection interruption, and a response lost after server acceptance. Run the same behavioural scenarios through each first-class SDK. Assert request construction, attempt count, key reuse, deadline adherence, error mapping, and cancellation cleanup.

Add packaging tests in clean environments for supported runtime versions. Importing the library, resolving dependencies, and using the default transport are part of the product. Test both synchronous and asynchronous interfaces if both are promised. A generated package that compiles in its own repository can still fail when installed alongside common consumer dependencies.

Keep API version and SDK version explicit in compatibility tests. A patch release can change retry timing or default serialization in ways that affect consumers even if method signatures remain unchanged. Review behavioural changes under the published versioning policy and provide migration notes for meaningful differences.

## Make generation reproducible and reviewable

Pin the generator, templates, and input specification for a release. Regenerate in CI and inspect the resulting diff. A correct OpenAPI input can still encounter unsupported schema features, language-specific code-generation defects, or handwritten wrapper mistakes. Generation reduces repetition; it does not make drift or bugs impossible.

Choose supported languages according to actual user needs and maintenance capacity. Publish which interfaces receive full behavioural testing, which are experimental, and what the support window means. Avoid promising equal quality across a large matrix that the team cannot validate.

The release checklist should include a tested installation path, one meaningful end-to-end sandbox operation, failure fixtures, compatibility evidence, and clear defaults. The SDK succeeds when callers can reason about its effects and recover from failure without reading its source. Automation is valuable when it makes the contract easier to use while keeping its limits visible.

## Further reading and source boundaries

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Stripe: an example idempotency contract](https://docs.stripe.com/api/idempotent_requests)
- [RFC 9110: HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [Semantic Versioning specification](https://semver.org/)
