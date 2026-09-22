---
title: "Zero Trust Is an Architecture, Not a Product You Can Buy"
description: "Zero trust is a security philosophy based on 'never trust, always verify.' It requires architectural changes to identity, network design, and access control. No single product delivers it."
date: 2025-09-29
tags: ["DevSecOps", "Security", "Systems"]
format: article
---

Zero trust has become a marketing term. Every security vendor has a zero trust product. Some of them are genuinely useful components of a zero trust architecture. None of them are, by themselves, zero trust.

Zero trust is an architectural principle. It is a description of how a system is designed to handle identity and access, not a product category.

## What zero trust actually means

The traditional perimeter model assumes that traffic inside the network is trusted. Users and systems inside the corporate network are treated as trustworthy by default. Firewalls protect the perimeter; once inside, movement is relatively free.

Zero trust assumes the opposite: no user, device, or service is trusted by default, regardless of where they are in the network. Every request must be authenticated and authorized, explicitly, for the specific resource being accessed.

The four principles:

**Verify explicitly.** Every access request is authenticated against identity — user identity, device identity, service identity — for every request, not just at login.

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
