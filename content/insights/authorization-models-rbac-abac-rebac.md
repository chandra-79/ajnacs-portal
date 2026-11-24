---
title: "Authorization Models: RBAC, ABAC, and the Zanzibar Turn"
description: "Authentication got standards; authorization got fragmentation — every app reinventing permission checks until the audit or the enterprise deal arrives. The three models and their failure modes, relationship-based authorization's rise, policy engines, and the architecture of the check."
date: 2027-12-01
tags: ["Security", "Identity", "Architecture", "Programming", "API Design"]
format: article
---

Identity engineering has a solved half and a swamp. Authentication — who is this? — got protocols, providers, and this series' OAuth/OIDC chapter. Authorization — what may they do? — got fragmentation: permission checks scattered through handlers, role enums that grew by exception, an `is_admin` flag doing load-bearing work, and the moment of reckoning that arrives on schedule — the enterprise customer asking for custom roles, the auditor asking who can access what (answerable only by reading code), or the sharing feature whose permission model ("documents shared with groups, inherited through folders, unless restricted") laughs at the role enum. Authorization is a *modeling* problem before it's an enforcement problem, and the models are few enough to know cold.

## The three models, by the question they answer

**RBAC** — role-based — answers "what is your *job*?": users hold roles, roles bundle permissions. Its virtues are legibility and administration (the access review reads role assignments — the audit's favorite shape; the joiner-mover-leaver machinery from identity practice assigns by attribute), and it can be a useful initial model when access is genuinely role-shaped. Its documented failure mode is **role explosion**: reality's exceptions ("manager, but only for EU accounts, except billing") multiply roles combinatorially until `regional_manager_eu_no_billing_v2` and its four hundred siblings have reproduced the ungoverned-permission sprawl with extra ceremony — the tell that the requirement outgrew the model's expressiveness.

**ABAC** — attribute-based — answers "what is *true* right now?": policies evaluate attributes of the subject (department, clearance), resource (classification, owner, region), and context (time, device posture, network — the zero-trust signals) — `allow if user.region == resource.region and resource.classification <= user.clearance`. Expressiveness without enumeration, and the natural home for the *contextual* rules RBAC can't say. Its costs: policies are code needing governance (testing, review, versioning — below), the audit question inverts uncomfortably ("who can access X?" requires evaluating policies against the user population — computation, not lookup), and attribute *freshness* becomes a dependency (the stale department attribute is a stale permission — the identity-lifecycle disciplines feeding the policy engine).

**ReBAC** — relationship-based — answers "how are you *connected* to this thing?": permissions derive from graph relationships — owner-of, member-of, parent-folder-of — and the model is Google's **Zanzibar** lineage (the paper describing the system authorizing Drive/Docs/YouTube, now productized across the OpenFGA/SpiceDB-class ecosystem). This is *the* model for sharing-and-hierarchy domains — documents, folders, projects, organizational trees — where "viewers of the parent folder can view, unless restricted" is one relationship rule instead of a permissions-copying batch job (the graph-traversal workload from graph-database practice, specialized: authorization checks as bounded graph queries, with the caching-and-consistency engineering — Zanzibar's "zookies" — that keeps check latency in single-digit milliseconds at scale). Its costs: the relationship data is a new stateful system to feed (via the event/CDC rails) and operate, and modeling judgment matters (the same grain-declaration discipline as every data model).

The honest synthesis: mature systems *layer* them — RBAC for the administrative baseline (job-shaped access, review-friendly), ReBAC for the resource-sharing plane where hierarchies live, ABAC-style conditions as the contextual overlay (region, classification, device) — which is roughly what the modern policy platforms express natively.

## The architecture: externalize the decision, own the enforcement

The structural move that outlives any model choice: **separate policy decision from enforcement**. Enforcement stays in the application (every request path checks — the resource server's non-negotiable duty per OAuth practice), but the *decision* — evaluating the model — externalizes to a policy engine (OPA-class for policy-as-code ABAC, the FGA-class services for ReBAC, or the in-process SDK variants where latency demands it), which buys: **one answer per question across the estate** (the microservices reality where per-service permission logic drifts into contradiction — the same argument as centralized rate policy and schema governance), **testable policy** (policies in version control, unit-tested with the same rigor as code — "given this user, this resource, this context: allow?" as CI assertions, plus the golden-set regression suite for the rules that matter — the policy change that silently widened access is this domain's worst deploy, and it's catchable), **auditable decisions** (every allow/deny logged with the policy version and inputs — the correlation-ID answerability, applied to access; "who could access X and who *did*" both become queries, per the IAM-analysis disciplines), and **the latency engineering owned once** (decision caching with the invalidation-on-change discipline, local evaluation for the hot path — because authorization sits on *every* request, and the queueing math makes its p99 everyone's p99).

Two placement rules complete it: **coarse gates early, fine checks at the data** (the gateway enforces "authenticated, right audience, plausible role" cheaply; the service enforces the resource-level decision where the resource is known — the defense-in-depth layering, with the reminder that filtering *lists* by permission is the hard case: the check-per-item that becomes the N+1 of authorization, solved by the ReBAC engines' list-filtering APIs or by permission-aware query predicates, and worth designing before the first "search shows documents you can't open" ticket), and **deny by default, everywhere** (the absent policy is a denial; the new endpoint inherits nothing — the same posture as every guardrail discipline).

The closing calibration: authorization debt is invisible until it's existential — the enterprise deal blocked on custom roles, the breach post-mortem's "the flag was still true," the audit that can't be answered from data. Model it deliberately (RBAC first, ReBAC when sharing arrives, attributes for context), externalize the decision, test policies like code, log decisions like the evidence they are — and the question "what may they do?" gets what the other half of identity already has: an answer that's engineering, not archaeology.

## Make the operating contract explicit

The useful starting point for an authorization design is a set of questions that must have unambiguous answers. Can a former project member read an old export? Can a support operator see a customer's billing document while troubleshooting? Does removing a parent-folder grant remove inherited access immediately, after a bounded delay, or only after a session expires? These questions expose the required consistency and relationship semantics before a product or model is chosen.

Keep authentication facts separate from resource policy. A valid signed token establishes facts that the receiving service has agreed to trust; it does not establish permission to every object named in the request. The service still needs tenant boundaries, resource ownership and action-specific rules. Likewise, a gateway cannot safely supply an identity header unless direct access is blocked and untrusted client copies of that header are removed. The trust relationship must be enforceable at the receiving service.

Caching creates a revocation contract. A five-minute cached allow decision can remain usable for five minutes unless invalidation, version checking or a stronger consistency mechanism intervenes. That might be acceptable for a low-risk document preview and unacceptable for a revoked administrator. Document the permitted staleness by action. Distinguish a policy-service timeout from an explicit deny, even when both prevent access, because operations and the user need different recovery instructions.

## Test lists and background jobs, not just object reads

An object endpoint can correctly reject access while a search endpoint leaks the object's title, owner or existence. Establish the information boundary for lists, counts, suggestions and exports. Permission-aware filtering may need to occur inside the data query or through an authorization engine's supported listing operation. Fetching a page and then removing unauthorized rows can produce inconsistent pagination and reveal information through totals. Test the visible response, not only the final object-open operation.

Background workers need a deliberate authority model. A queued task may execute after the initiating user's role changes. Decide whether it runs under authority captured at acceptance, under a service identity with a constrained delegated action, or after checking current permission again. Each model can be valid for a particular workflow, but an undocumented mixture makes revocation and audit difficult to explain. Include the original subject, intended action and resource boundary in the task's trusted context.

For relationship-based access, distinguish a model change from a relationship-data change. A new rule can widen access even when no group membership changed. A stale relationship replica can preserve access after removal. Keep model-version regression fixtures and relationship-consistency cases separate so that the team can locate the cause of a changed decision. A published system's latency result is evidence about that system's deployment, not a performance guarantee for a new implementation.

The review artifact should include at least one denied case for every route that returns protected information. Test missing resource IDs, deleted resources and resources that exist in another tenant. Use error responses that support legitimate troubleshooting without unnecessarily confirming protected object existence. Finally, document who can edit the authorization model itself. Administrative access to the policy plane is a powerful capability and requires the same care as access to the business data.

Make policy changes reviewable with expected-denial fixtures. A green application test suite is insufficient when it never attempts the access that must be refused.

## Work through an illustrative scenario

A hypothetical document system tests forty authorization decisions. Sixteen should allow access and twenty-four should deny it. A new policy returns sixteen correct allows, twenty-three correct denials and one unexpected allow for a removed group member. Its overall accuracy is 39/40, or 97.5%, but the single unexpected allow is a release blocker for this exercise. A repaired policy returns all forty expected results. The chart intentionally separates allowed and denied cases instead of hiding a dangerous false allow behind a high average score.

| Observation | Value (test cases) |
| --- | ---: |
| Expected allowed cases | 16 |
| Expected denied cases | 24 |
| Initial correct denials | 23 |
| Repaired correct denials | 24 |

**Calculation and limits.** Synthetic forty-case fixture with manually reviewed expected results. Count each user-resource-action tuple once. These counts validate the fixture and do not estimate production breach likelihood or population-wide accuracy.

## Build the evidence worksheet

**Subject.** Identify the user or workload, tenant membership and source of the attributes used in the decision.

**Resource.** Record resource identity, tenant, owner and relevant parent relationships without relying on an untrusted request field.

**Action.** Separate read, update, share, export and administrative actions rather than treating them as one permission.

**Policy version.** Retain the exact policy and relationship-data version associated with the expected result.

**Freshness bound.** State how quickly revocations must take effect for this action and how stale cached decisions are detected.

**Expected denial.** Include reasons the request must fail, especially cross-tenant access and deleted or missing relationships.

## Rehearse the failure boundary

1. **Remove group membership.** Repeat the same request through each service replica and verify the documented revocation bound.

2. **Guess another tenant ID.** Ensure lookup and list endpoints apply the same resource authorization boundary.

3. **Stop the decision service.** Exercise the declared timeout behavior and confirm that an outage cannot turn a denial into an allow.

4. **Change policy mid-session.** Verify that an existing session does not bypass the policy version or relationship changes.

## Sources for the mechanisms

- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Zanzibar original paper](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/)
