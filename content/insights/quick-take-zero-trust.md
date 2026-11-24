---
title: "Zero Trust Is an Architecture, Not a Product You Can Buy"
description: "Zero trust is a security philosophy based on 'never trust, always verify.' It requires architectural changes to identity, network design, and access control. No single product delivers it."
date: 2028-10-06
tags: ["DevSecOps", "Security", "Systems"]
format: article
---

Zero trust has become a marketing term. Every security vendor has a zero trust product. Some of them are genuinely useful components of a zero trust architecture. None of them are, by themselves, zero trust.

Zero trust is an architectural principle. It is a description of how a system is designed to handle identity and access, not a product category.

## What zero trust actually means

Some perimeter-oriented designs grant excessive implicit trust to internal locations. Many existing systems already combine perimeter controls with identity and resource authorization, so inventory the actual trust assumptions. Firewalls protect the perimeter; once inside, movement is relatively free.

Zero trust assumes the opposite: no user, device, or service is trusted by default, regardless of where they are in the network. Every request must be authenticated and authorized, explicitly, for the specific resource being accessed.

The four principles:

**Verify explicitly.** Protected access is evaluated using authenticated identity and relevant context under explicit session and policy lifetimes; this does not require interactive authentication for every packet.

**Use least-privilege access.** Access is granted for the minimum scope required for the task, time-limited where possible. A user accessing a specific database table is not granted access to the entire database.

**Assume breach.** Design the system as if the perimeter has already been compromised. Lateral movement is restricted. Monitoring is aggressive. Segmentation limits blast radius.

**Continuous validation.** Authorization is not a one-time event at login. It is continuous — based on current identity, current device state, current context.

## Why it cannot be bought

Implementing zero trust requires changes to:

- **Identity infrastructure:** all users and services authenticated through a central identity provider with MFA and continuous session validation
- **Network architecture:** microsegmentation, encrypted traffic between services, explicit network policies rather than implicit zone-based trust
- **Access control:** attribute-based or policy-based access control with least-privilege grants
- **Monitoring:** behavioral analytics, anomaly detection, logging of all access

A single product addresses one or two of these. Implementing zero trust requires architectural changes across all of them.

The products that are useful: identity providers (Okta, Azure AD), network access control (BeyondCorp/Google IAP, Cloudflare Access), policy engines (OPA). Each plays a role. Together, with the right architecture, they approach zero trust. None of them do it alone.

The vendor who tells you their product delivers zero trust is selling you a component, not the architecture. The architecture is the work.

## Choose one access decision and make it explicit

NIST's zero trust architecture describes policy decisions around resources and sessions, not an obligation to ask a human for MFA on every packet. Existing identity sessions and tokens can be used within explicit lifetimes and validation rules. The architecture needs a policy decision, an enforcement point and signals appropriate to the resource's sensitivity; a network location alone should not confer trust.

For a hypothetical support console, model four conditions: a recognized support identity, an active support role, an approved device state and authorization for the requested customer account. During a synthetic test set of 100 requests, 70 satisfy all conditions, 15 fail the role condition, ten fail device policy and five attempt the wrong account. Those categories are mutually exclusive in this constructed fixture. The 30 denied requests demonstrate expected policy behavior for these cases; they are not an attack detection rate.

Create a decision table with the input identity, device signal, resource identifier, expected outcome and reason code. Include missing and stale signals rather than only true and false values. Decide which resource operations must fail closed when the decision service is unavailable and whether any narrowly defined cached decision can remain valid. That choice must account for the risk of continued access as well as service interruption.

## Test revocation and the enforcement boundary

Start a test session, remove the role and measure how long the previously issued session can still perform the protected action. The result depends on token lifetime, introspection, cache invalidation and application behavior. “Continuous validation” is a design requirement to specify, not a guarantee that every grant disappears instantaneously.

Then bypass the user interface and call the protected API directly. The server must enforce the same boundary; hiding a button is not authorization. Repeat through a background worker if it can act on behalf of the user. Record the policy version and relevant non-secret context in an audit event so the outcome can be explained afterward.

A useful adoption plan begins with this one resource and expands when its identity inventory, failure handling and support process are understood. Microsegmentation, MFA and device posture may contribute, but none replaces application-level authorization. Publish which boundaries are covered and which remain dependent on network assumptions so the architecture's limits are visible.

| Observation | Value (requests) |
| --- | ---: |
| Allowed | 70 |
| Role denied | 15 |
| Device denied | 10 |
| Account denied | 5 |

**Figure method.** Synthetic mutually exclusive 100-request fixture: 70+15+10+5=100; 30 expected denials. Counts validate selected cases, not threat-detection effectiveness.

## Further reading

- [NIST Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
