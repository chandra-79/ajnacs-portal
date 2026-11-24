---
title: "Zero trust is an architectural philosophy. You cannot buy it."
description: "Zero trust is a security architecture principle: assume no implicit trust based on network location, authenticate and authorise every access request regardless of origin, and verify…"
date: 2029-07-04
tags: ["DevSecOps", "Security", "Systems"]
format: note
derived: true
---

Zero trust is a security architecture principle: assume no implicit trust based on network location, authenticate and authorise every access request regardless of origin, and verify continuously rather than once at the perimeter.

It is not a product category.

Every major security vendor now sells a "zero trust" platform. Some of them are excellent tools for implementing zero trust principles. None of them, installed and configured, automatically give you a zero trust architecture. Because the architecture is about how you've designed access — not which tools you've purchased.

An organization can have identity-aware proxies, device posture checks, microsegmentation tooling, and a continuous monitoring platform, and still have a network where anything that reaches the internal LAN is implicitly trusted. The tools exist; the architecture hasn't changed.

Zero trust adoption fails most often at the point of actually changing the access model. It's technically straightforward to say "nothing is trusted by location." It's organisationally challenging to remove the implicit trust that legacy applications, on-premises resources, and operational workflows have been relying on for years.

The path that works: start from the principles. Define what access should look like if network location were not a trust signal. Identify the gaps between that model and your current state. Then choose tools that close specific gaps.

The vendor conversation comes after the architectural conversation, not before it.

## Find the access path that still relies on location

Start with one internal administrative endpoint and enumerate every route to it: the browser interface, API, background job and maintenance script. An identity-aware proxy protects only traffic that actually passes through it. A direct internal route can preserve implicit trust even after a new access product is installed.

In a hypothetical inventory of twelve administrative routes, nine enforce the intended identity and resource policy, two rely only on network location and one has not been verified. Coverage is 9/12 = 75% for this inventory. The unknown route must remain unknown until tested; counting it as protected would manufacture evidence.

For the exercise, send the same non-destructive request through the approved proxy and the direct internal endpoint using a disposable identity without the required role. Both paths should deny the action under the intended policy. Record enforcement location, session lifetime and audit evidence. Then test missing policy context and service unavailability to understand failure behavior. Zero trust is not a promise that every decision is refreshed instantaneously; cached decisions and token lifetimes need explicit limits appropriate to the protected resource.

| Observation | Value (routes) |
| --- | ---: |
| Verified enforcement | 9 |
| Location-only trust | 2 |
| Unverified | 1 |

**Figure method.** Synthetic twelve-route inventory: 9/12=75% verified. The unverified route is not assumed protected; counts depend on inventory completeness.

## Further reading

- [NIST Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final)
- [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
