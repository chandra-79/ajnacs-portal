---
title: "Designing Tools for AI Agents: API Design's Newest Consumer"
description: "Agents are becoming a primary consumer of enterprise APIs, and they fail differently than developers do — the tool-description contract, error messages as steering, the safety tiers for consequential actions, and why agent-legible design is just good API design under pressure."
date: 2028-03-15
tags: ["AI Adoption", "API Design", "LLM", "Architecture", "Security"]
format: article
---

A new consumer arrived at the enterprise API surface, and it reads differently than the last one: the AI agent — the LLM-driven system that selects and invokes tools to accomplish tasks — is becoming a first-class caller of internal and external APIs (through the MCP-style protocol layer and the function-calling interfaces the model vendors standardized), and it fails in ways human developers don't. A developer reads your docs once, builds a mental model, and encodes expected behavior in application code that still depends on changing systems; an agent re-reads your tool descriptions *every session*, reasons probabilistically about what to call, and improvises under ambiguity. Designing for this consumer is a discipline with emerging rules — most of which turn out to be classical API design principles, enforced with new severity, with renewed attention to authorization and consequential actions.

## The description is the interface

An agent selects tools by reading their names, descriptions, and parameter schemas — which promotes documentation from developer courtesy to *runtime control surface*: the description influences tool selection, while application code can impose additional routing constraints. The disciplines that follow: **names and descriptions written for disambiguation** (the agent choosing between `search_orders` and `list_orders` relies on descriptions, schemas and whatever examples or context the system supplies — describe *when to use this tool and when not to*, with the boundary cases explicit, because every ambiguity you leave is a misroute you'll observe at volume), **parameter schemas that constrain rather than suggest** (enums over free strings, formats declared, required-versus-optional honest — the schema-first validation disciplines, now doing double duty as the agent's guardrails: a parameter the schema permits is a parameter some session will send), **examples in the description** (few-shot steering embedded at the tool boundary — the highest-leverage documentation genre for this consumer), and **operation granularity tuned to task shape** (the classical REST-resource decomposition can be wrong for agents: forty fine-grained calls to accomplish "reschedule the meeting" burns context and multiplies error surface — the emerging pattern is *task-shaped composite tools* for the common workflows alongside the primitive operations, which is the BFF insight applied to a nonhuman frontend).

**Errors graduate from diagnostics to steering**: the agent reads error messages and *adjusts its next attempt*, which makes the error-contract disciplines load-bearing in a new way — errors should say what was wrong *and what to do* ("date must be ISO-8601; you sent '3rd of March'" produces self-correction; "400 Bad Request" produces flailing retries), retryability must be explicit (the agent's retry judgment is only as good as your taxonomy), and the response should resist the temptation to be terse: the caller needs a usable local recovery contract rather than relying on outside documentation.

## The safety tier: capability design for a credulous caller

The agent security chapter established the frame — the agent is a confused-deputy risk by construction (it reads untrusted content and holds your credentials) — and the tool layer is where mitigations become concrete: **scope tools to tasks, not products** (the least-privilege rule at tool granularity: the triage agent gets `create_draft`, not `send_email` — every exposed capability adds potential attack surface for whatever prompt-injection reaches the context), **consequential actions get structural friction** (the irreversibility ladder from automation practice: read tools free; mutating tools idempotent with dry-run modes — the agent that can preview "this will cancel 400 orders" before executing is an agent whose mistakes are catchable; destructive/external tools behind human confirmation with the *actual effect* displayed, per the approval-UI honesty rules), **server-side enforcement of everything** (the agent asserting "the user approved" is not authorization — the tool's backend checks the caller's actual entitlements per the authorization models, treats agent traffic as its own principal class in the audit stream, and rate-limits it like the retry-capable automation it is), and **idempotency keys as a default parameter** (agents retry ambiguously-failed calls as a matter of policy — the duplicate-effect protections stop being best practice and become the assumption).

The operational rim mirrors every new-consumer story: **observability per tool per session** (which tools get called, with what argument distributions, failing how — the tool-call telemetry is simultaneously your UX research for descriptions, your misroute detector, and your security monitoring; an unusual argument may indicate legitimate workload change, a description problem or an attack and requires investigation), **evaluation suites for the tool surface** (the eval-gate discipline: scripted task scenarios asserting the agent selects and sequences tools correctly, run against every description change — because tool descriptions are prompts, and prompt changes are behavior changes needing regression coverage), and **versioning with the deprecation machinery** (agents don't read changelogs; clients need an explicit compatibility or migration path; do not assume that an agent will discover and correctly adopt a changed tool contract without evaluation).

The closing observation is the reassuring one: almost everything above — unambiguous contracts, constrained inputs, actionable errors, idempotent mutations, least-privilege scoping, honest documentation — is what this series has argued APIs owed *human* consumers all along. The agent era doesn't introduce a new design philosophy; it removes the compensating layer (the patient developer who reads around your ambiguities and hardcodes the workarounds) that let mediocre API design survive. The APIs that agents use well are the APIs developers always wished for — which makes agent-readiness less a new requirement than an audit, conducted by your most literal-minded consumer, of promises your interface was already supposed to keep.

## Specify one consequential operation completely

Consider a hypothetical order-support assistant that can propose refunds. Separate three operations: inspect an order, prepare a refund proposal and execute an approved refund. The proposal includes the order identifier, amount, currency, reason and expiry time. Execution accepts a proposal identifier and a server-issued approval reference. It does not trust a free-text explanation that a user approved the action.

This design makes the object of approval stable. If the amount or destination changes after approval, the approval must no longer authorize the changed operation. Bind the approval to the exact effect, authenticated principal and expiration. Where the user already authorized a defined class of routine actions, enforce that scope in policy rather than repeatedly asking a model whether the authorization still counts.

A preview should be derived from the same validated request used for execution. Otherwise a harmless-looking preview can diverge from the actual operation. For concurrent systems, include a resource version or equivalent precondition: an order may already have been refunded, cancelled or changed between inspection and execution. A stale proposal should receive a typed conflict response that requests fresh inspection.

## Worked example: retry safety changes the outcome

A synthetic test submits 100 unique refund operations. Twenty client requests experience an ambiguous timeout after the server has committed the operation. The client retries those 20 requests, so the server receives 120 execution attempts. In a naive implementation that performs each attempt, 120 effects occur. In an implementation that atomically records and enforces an idempotency key, exactly 100 effects occur and 20 retries return the recorded result.

The chart compares 120 attempts, 120 naive effects and 100 idempotent effects. The extra 20 naive effects are a 20% overcount relative to the intended 100 operations. This is an illustrative failure injection, not a measured frequency of duplicate refunds. It assumes each retry repeats the same intended effect and that the idempotency record survives long enough to cover the retry window.

The difficult part is atomicity. Writing the refund and then writing its idempotency record in a separate transaction can still duplicate an effect if the process crashes between the writes. Use an appropriate transactional design or a downstream service with its own idempotency guarantee. Bind the key to a request fingerprint so reusing a key with a different amount returns a conflict instead of an unrelated cached success.

## Distinguish tool metadata from enforcement

A tool description saying "read only" is useful to the agent, but the server's permissions and implementation determine whether it can mutate state. Likewise, an annotation saying an operation is idempotent is a claim to evaluate, not a substitute for implementation. The MCP specification explicitly discusses the trustworthiness of tool annotations; a client should not treat arbitrary server metadata as authority.

Minimize ambient credentials. If the assistant works on one tenant's order, pass a narrowly scoped authorization context that the server verifies. Do not let a model choose a tenant identifier and assume that identifier proves access. Resource ownership checks belong at the authoritative service, including on search endpoints that might expose object existence through counts or error messages.

Return enough information for recovery without leaking secrets. A permission error can identify the required workflow or tell the user to request access, but should not reveal another customer's record. Distinguish invalid arguments, authorization denial, version conflict, rate limiting and temporary unavailability. Only the last categories generally justify retrying unchanged input, and even then the application needs a bounded policy.

## Build a tool-selection and execution lab

Create a fake order service with ten synthetic orders and no connection to payment systems. Define scenarios for lookup, draft refund, approved execution, expired approval, repeated execution and cross-tenant access. Include an ambiguous user request such as "fix the duplicate charge" that should first gather evidence instead of immediately issuing a refund.

The evaluation has two layers. At the agent layer, assess whether it selects the appropriate tool and supplies grounded arguments. At the service layer, call the tools directly with malicious or malformed arguments and verify that authorization holds even without an obedient model. Passing the first layer is a usability result; passing the second is evidence about enforcement. Neither replaces review of the actual payment integration.

Inject a timeout immediately after commitment and repeat the same call. Then repeat with the same key but a different amount. Expected outcomes are a replayed result for the identical operation and a conflict for the changed operation. Save server event identifiers to demonstrate that the correct number of effects occurred. A test that only checks the final model message cannot establish this property.

Use a worksheet with requested outcome, eligible tools, expected argument source, required authorization, allowed retries and observed effects. Include tool-description changes in regression review because a wording change can alter selection even when the server schema remains identical. Keep descriptions concise enough to inspect; adding more tools and examples can make overlapping responsibilities harder to distinguish.

## Decide what the operator needs to recover

An operator should be able to answer which user authorized an effect, which tool version executed it, which resource version was observed and whether a later retry was a replay. Keep correlation identifiers across agent and service traces. Avoid assuming a fluent generated explanation is a faithful account of the executed sequence; the authoritative event log is the evidence.

Finally, give a failed workflow a terminal state. An assistant that retries forever converts a clear service problem into an unpredictable workload. After the attempt or elapsed-time budget is exhausted, return the known outcome, including uncertainty about commitment where it remains. That honest state is more useful than a fabricated success message and allows a human or deterministic recovery process to continue safely.

## Sources and further study

- [Model Context Protocol — Tool specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [OWASP — Prompt injection risks](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
