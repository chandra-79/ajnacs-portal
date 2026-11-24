---
title: "Azure Landing Zone Design: What the Microsoft Docs Don't Tell You"
description: "The Cloud Adoption Framework gives you a solid pattern for Azure landing zones. Here's what the implementation actually looks like — and where the framework falls short in practice."
date: 2027-08-25
tags: ["Cloud Architecture", "Governance", "DevSecOps"]
format: article
---

Microsoft's Cloud Adoption Framework (CAF) landing zone guidance is genuinely good. It gives you a well-reasoned pattern for organising Azure subscriptions, management groups, and governance policies. The organizations A possible failure pattern is that follow it are in substantially better shape than those that don't.

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

*Designing or implementing an Azure landing zone for enterprise? [Happy to compare notes.](/contact)*

## Make the operating contract explicit

A landing zone is an operating foundation for workloads, not just an initial network deployment. Its resource hierarchy, identity boundaries, connectivity, logging and policy choices affect how future teams create and run services. Distinguish shared platform responsibilities from workload responsibilities. A central team can provide the account or subscription and baseline controls while the workload team still owns data access, application behavior and recovery verification.

Policy inheritance needs careful scope. A control placed high in a hierarchy can affect many workloads, including future ones that do not exist at review time. Start with the smallest representative scope, inspect the affected resources and exercise an exception path. Some controls can be safely denied before creation; others require remediation or reporting because the desired state depends on runtime information. A useful policy states the risk it addresses and the evidence of its operation.

The onboarding experience tests whether the foundation works. Measure the path from an accepted request to a deployable environment with the required controls, not merely to creation of an empty account. Include access approval, address allocation, budget ownership, logging and a supported deployment route. A landing zone that requires several undocumented manual tickets has centralized infrastructure without completing the operating model.

## Prove inheritance and workload autonomy together

Create a fresh test workload scope through the intended onboarding process. Inspect the identity assignments, inherited policies, logging destinations, network allocation and budget owner. Then let a workload engineer deploy a small approved service using only the documented route. This reveals both missing controls and unnecessary central-team dependencies. A foundation that is secure only when a specialist manually finishes every request is difficult to scale reliably.

Test the exception path with a legitimate requirement. For example, a workload may need a different region or a connectivity pattern that the default policy denies. Record the reason, affected resources, approver and expiry. The exception should be narrow enough that unrelated workloads retain the baseline control. If the same exception recurs, revisit the platform's supported patterns rather than creating an ever-growing collection of permanent bypasses.

Separate inherited platform evidence from workload evidence. Central audit collection may be configured correctly while an application emits no useful events. A shared backup service may exist while a workload's data is outside its coverage. The onboarding acceptance check should prove the connection between the shared capability and the actual workload. This avoids a misleading conclusion that a platform service's presence means every application has adopted it.

Retain a versioned description of the foundation and the decisions that shaped it. Organizational hierarchy, naming and connectivity rules will change. A later team should be able to tell which assumptions were deliberate and which are historical accidents before modifying a policy with a large inheritance scope.

Measure completed onboarding, including usable access and a validated deployment.

## Work through an illustrative scenario

A fictional onboarding request needs two hours for approved identity assignment, four for network and DNS setup, one for logging and budget ownership, and three for a first controlled deployment. The sequential path is ten hours. Automation reduces network setup to one hour while the other stages remain, making the modeled path seven hours. The example makes no claim about typical landing-zone lead time and excludes queueing before the request is accepted.

| Observation | Value (elapsed hours) |
| --- | ---: |
| Identity assignment | 2 |
| Network and DNS | 4 |
| Logging and ownership | 1 |
| First deployment | 3 |

**Calculation and limits.** Synthetic accepted-request workflow with sequential stage times totaling ten hours. Reducing network setup from four to one changes the modeled total to seven. Real lead time includes waiting, rework and incomplete requests.

## Build the evidence worksheet

**Hierarchy boundary.** State the purpose of each account or subscription and the policies inherited from its parent.

**Identity ownership.** Separate platform operators, workload owners and emergency roles with a reviewable access path.

**Network allocation.** Reserve address space and DNS responsibilities before application teams deploy dependencies.

**Evidence collection.** Verify that required platform and workload events reach the intended logging boundary.

**Cost responsibility.** Assign billing ownership, allocation tags and alert routing before consumption grows.

**Supported deployment.** Prove that a workload team can deploy through the approved path with an understood exception process.

## Rehearse the failure boundary

1. **Create a fresh workload scope.** Check inherited controls and the actual access available to its owner.

2. **Request a legitimate exception.** Verify approval, expiry and compensating measures without permanent broad bypasses.

3. **Remove a platform dependency.** Observe which workload operations still work and which require recovery support.

4. **Rebuild the foundation in a sandbox.** Compare configuration and evidence against the declared design rather than the console appearance.

## Sources for the mechanisms

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
