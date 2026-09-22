---
title: "Azure Landing Zone Design: What the Microsoft Docs Don't Tell You"
description: "The Cloud Adoption Framework gives you a solid pattern for Azure landing zones. Here's what the implementation actually looks like — and where the framework falls short in practice."
date: 2027-08-25
tags: ["Cloud Architecture", "Governance", "DevSecOps"]
format: article
---

Microsoft's Cloud Adoption Framework (CAF) landing zone guidance is genuinely good. It gives you a well-reasoned pattern for organising Azure subscriptions, management groups, and governance policies. The organizations I've seen that follow it are in substantially better shape than those that don't.

What the documentation doesn't cover is the organizational friction, the implementation sequencing, and the decisions the framework deliberately leaves open that you need to close before you can ship.

## The Core Pattern (and Why It Holds Up)

The CAF landing zone uses a management group hierarchy to separate governance concerns:

- **Platform** management group — connectivity, identity, management subscriptions
- **Landing zones** management group — workload subscriptions, split by environment or business unit
- **Sandboxes** — isolated subscriptions for experimentation, disconnected from the corporate network

This separation matters because Azure Policy assignments and RBAC roles scope to management groups. Policies applying to all production workloads (encryption requirements, allowed regions, mandatory tags) live at the landing zones level. Connectivity and identity governance lives at the platform level. Nothing from sandboxes can contaminate production.

The hierarchy forces an organizational question most teams haven't answered: who owns the platform subscriptions? In practice this is the platform engineering team, the cloud centre of excellence, or a dedicated cloud operations function. If the answer is "nobody, we'll figure it out," the landing zone will degrade into an ungoverned sprawl within 18 months.

## The Hub-and-Spoke Networking Decision

The most consequential early decision in an Azure landing zone isn't governance — it's networking. The two patterns:

**Hub-and-spoke**: a centralised hub VNet (in the connectivity subscription) hosting shared services (Azure Firewall, VPN/ExpressRoute gateway, DNS), with workload VNets peered to it. All internet egress routes through the hub firewall.

**Azure Virtual WAN**: Microsoft-managed backbone routing, with branches and VNets connecting to a virtual WAN hub. Simpler to operate at scale, less flexibility for custom routing.

For most enterprise patterns, hub-and-spoke with Azure Firewall gives you the control and inspection capability that compliance requirements typically demand. Virtual WAN makes sense at genuinely large scale or where you have significant branch office connectivity requirements.

The decision has long-term consequences: changing your network topology after workloads are deployed is painful. Get this right in the design phase.

## Azure Policy: The Implementation Gap

Landing zone design always includes "implement governance with Azure Policy." What it glosses over: building, testing, and operating a policy set that covers your compliance requirements without breaking the engineering teams trying to deploy workloads.

The failure mode I see repeatedly: a central team deploys Azure Policy in Deny mode, engineering teams immediately start getting blocked by policies that weren't calibrated against actual workloads, and the response is either a growing list of exemptions (undermining the governance) or a CTO mandate to remove the blocking policies (losing the governance entirely).

The right approach: deploy policies in Audit mode first, run for 60–90 days, review the findings, tune before switching to Deny. This gives engineering teams visibility into what's coming and time to remediate before it blocks them.

The policies worth putting in Deny mode early — before the audit period — are the ones with no legitimate exceptions: no resources outside approved regions, no storage accounts with public blob access enabled, no VMs without disk encryption. These are safe to enforce immediately.

## Identity and Access: Don't Underestimate This

Landing zone designs sometimes treat identity and access as a checkbox. It isn't — it's the surface area that most security incidents exploit.

The decisions that need to be explicit:

**Break-glass accounts**: at least two emergency access accounts not dependent on the usual Azure AD/Entra ID conditional access policies. Audited, rotated, and tested regularly. Not a nice-to-have; a requirement.

**Privileged Identity Management (PIM)**: just-in-time elevation for subscription owner, contributor, and user access administrator roles. Permanent standing access at these levels is a risk that most compliance frameworks flag.

**Service principal governance**: every automation workload should use a managed identity or a service principal with a documented owner, minimum-necessary permissions, and a credential rotation policy. Unowned service principals with Owner-level access are a persistent finding in landing zone reviews.

## The Sequencing That Works

From multiple landing zone implementations, the sequence that works:

1. Management group hierarchy and subscription structure — before anything else
2. Azure Policy in Audit mode — establish the governance baseline
3. Hub-and-spoke networking — connectivity and DNS before workload VNets
4. Identity governance — PIM, conditional access, emergency accounts
5. First workload landing zone — a pilot workload to validate the pattern
6. Refined policies based on pilot findings — then Deny mode for high-confidence policies
7. Additional workload landing zones — templated from the pilot

Step 5 is where most implementations learn the most, fastest. The pilot workload surfaces all the gaps in the design that weren't apparent on paper.

---

*Designing or implementing an Azure landing zone for enterprise? [Happy to compare notes.](/contact)*
