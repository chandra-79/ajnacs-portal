---
title: "Certificate Management at Scale: Ending the Expiry-Outage Genre"
description: "TLS certificates cause a uniquely preventable class of outage, and shortening browser-mandated lifetimes are forcing the issue. Automation with ACME, internal PKI design, the inventory problem, and mTLS certificate hygiene for service fleets."
date: 2027-07-07
tags: ["Security", "TLS", "Platform Engineering", "Reliability", "Architecture"]
format: article
---

The expired-certificate outage is the industry's most embarrassing recurring incident: predictable in timing but still dependent on discovery, renewal, deployment, and trust distribution, and yet it keeps taking down major services — because certificate management at enterprise scale is an *inventory and automation* problem being solved with calendars and heroics. The era of tolerating that is ending on a schedule: browser-mandated maximum certificate lifetimes are contracting stepwise toward **47 days by 2029**, which converts "renew annually, carefully" into "renew constantly, automatically" — covered public TLS deployments face increasingly frequent renewal requirements. Here's the discipline that replaces them.

## The model: certificates are short-lived credentials, not installed artifacts

The mental shift that everything else follows from: stop treating a certificate as a *thing you install* and start treating it as a *credential that rotates* — like the short-lived tokens of modern IAM practice, just at the transport layer. A certificate is a signed binding of a key to a name, valid briefly, renewed mechanically, deployed without human hands. Systems designed around that assumption (automated issuance, hot-reload of certs, no deploy required to rotate) reduce expiry risk but still require monitoring and recovery; systems where a renewal means a change ticket and a maintenance window are accumulating scheduled incidents.

**ACME is the protocol that industrialized this** — the Let's Encrypt-popularized issue/renew automation supported by many public and private certificate services. The architecture it enables: certificates requested and renewed by software (cert-manager in Kubernetes, ACME clients on hosts, the load balancer's or CDN's built-in managed certificates — the "certificate as a checkbox" tier that should carry as much of your public surface as possible), validated by DNS or HTTP challenges (DNS-01 via your IaC-managed zones for wildcards and non-web services), renewed on a schedule appropriate to the issued lifetime and recovery margin with alerting on *failure to renew* with enough margin for the documented recovery procedure.

## The inventory problem: you cannot rotate what you don't know exists

A recurring failure is: "this certificate wasn't in the tracking system." The unglamorous core of the discipline is a **complete, continuously refreshed certificate inventory** — built not from what teams register (they won't) but from *discovery*: scanning your IP space and DNS zones for listening TLS endpoints, querying cloud APIs for provisioned certs (load balancers, CDNs, API gateways), and — the highest-leverage source most estates ignore — **Certificate Transparency logs**, which can reveal certificates logged under applicable public trust policies, including unexpected issuance. CT monitoring simultaneously feeds the inventory and functions as a security control (unexpected issuance warrants investigation and routing according to its assessed risk).

The inventory's schema is the operational payload: what's the cert, where does it terminate, who owns it, how does it renew (which automation, or the dreaded "manually"), and when does it expire — with the "manual" rows constituting the burn-down backlog and expiry-within-30-days-without-automation constituting the standing alarm. The long tail is where the outages live: the appliance UI, the partner HTTPS endpoint, the SaaS integration that pinned your cert, the internal tool on a VM from 2019 — none glamorous, all capable of a sev-2.

## Internal PKI: run it like a product or buy it

Service-to-service TLS (and especially mTLS) needs an internal certificate authority, and internal PKI is where good intentions produce five-year root certs on a laptop. The design that works: a **root CA kept offline** (or in an HSM/KMS) signing **intermediate CAs that do the daily work**, short-lived end-entity certs (days, not years — internal certs have no browser constraints, so run them *shorter* than public ones; rotation exercises your automation continuously and reduces some credential exposure windows without eliminating compromise risk), and issuance through a real platform — cert-manager against a private CA (the cloud providers all sell one), HashiCorp Vault's PKI engine, or — for mesh estates — the **service mesh's identity machinery** (SPIFFE/SPIRE-class workload identity, Istio's built-in CA), which issues per-workload certificates bound to platform-verified identity and rotates them according to the platform policy while protecting private-key access. That last tier is the destination: mTLS everywhere, certificates as invisible plumbing, identity anchored in the platform rather than in files.

The governance layer that must exist regardless: documented chain-of-trust (what signs what, and what would revoking each layer cost), tested **CA rotation runbooks** (intermediates *will* need replacing; estates that have never rotated an intermediate own a future incident with a countdown), constrained issuance (name constraints and policy on what each intermediate may sign — an unconstrained internal CA trusted by every workstation is a domain-wide compromise amplifier), and distribution discipline for trust stores (the *other* half of rotation: getting new roots *trusted* everywhere before old ones retire — the slow part, budgeted first).

## The operational rim

The remaining practices, compactly: **hot-reload as a requirement** — prefer reload without interruption where supported; otherwise design a tested rolling replacement or appropriate termination layer; **monitoring that watches the endpoint, not the file** — external synthetic checks validating the *served* chain and its expiry from the client's viewpoint (a renewed certificate that is not served remains an outage risk); **key hygiene** as code review policy — keys generated where they'll live, never emailed, never in git (secret scanning can detect some exposures but does not replace key handling and access controls), algorithm compatibility and security policy tracked estate-wide via the inventory; and **the post-quantum horizon** wired into planning rather than panic — track supported key-exchange and signature transitions separately, with standards, client compatibility, and CA support verified before adoption, and the estates that will absorb that transition cheaply are precisely the ones this article describes: full inventory, automated issuance, short lifetimes, rotation as routine. Crypto-agility, once again, is mostly the compounding interest on boring operational hygiene.

The end state to hold as the target: routine renewal does not depend on someone remembering a date, while owners can still inspect expiry and recovery status — issuance is platform machinery, rotation is continuous, the inventory refreshes itself, and alerts distinguish failed automation with recovery margin from active handshake failure. Shorter public TLS lifetimes increase the value of a tested rotation process, while private PKI requires its own policy and recovery design.

## Distinguish policy scope from the rotation design

The CA/Browser Forum's adopted schedule for publicly trusted TLS subscriber certificates reduces maximum validity to 200 days for issuance from 15 March 2026, 100 days from 15 March 2027, and 47 days from 15 March 2029. These are public trust requirements for the covered certificates, not a universal lifetime rule for every private certificate, SSH key, or code-signing credential. Check the applicable current requirements and CA offering when designing issuance.

The operational design should work at lifetimes shorter than its current certificate, without depending on one particular renewal date. A CA may issue a shorter duration than requested. Validation reuse rules, account limits, and supported challenge types also matter. Treat certificate issuance, domain validation, installation, application reload, and endpoint verification as distinct stages with their own evidence.

## Calculate the recovery margin

The chart uses a fictional 90-day certificate solely as a renewal-planning exercise. If renewal starts on day 60, nominal expiry margin is 30 days. Starting on day 75 leaves 15 days; starting on day 85 leaves five. These are arithmetic differences between the assumed expiry and renewal start, not recommendations for a particular CA or proof that 30 days is always sufficient. Issued validity, clock tolerance, deployment lag, and required validation can reduce the usable margin.

Suppose the normal renewal process takes ten minutes, but a failed DNS authorization requires a team with a one-business-day response time. A retry loop running every hour does not remove that human dependency. The margin should cover realistic failure recovery, including weekends, credential rotation, and unavailable providers. Alert on failed progress and shrinking margin, with severity that reflects the time still available to act.

For internal certificates lasting hours, a fixed alert at 30 days before expiry is meaningless. Use a policy tied to lifetime, renewal expectation, and service recovery time. A workload that cannot renew while disconnected may need a different identity lifecycle from a continuously connected service. Short lifetimes limit some exposure but can create availability risk if renewal infrastructure is not sufficiently resilient.

## Inventory the served identity and the issuing machinery

Each inventory record needs the endpoint name, port, protocol, SNI name where relevant, owning service, certificate identifier, issuing chain, expiry, key location, renewal mechanism, and deployment mechanism. Include the validation credentials and their owner without copying secrets into the inventory. A certificate can be valid while the DNS API credential needed for its next renewal has expired.

Discover from several sources: service registries, ingress and load-balancer configuration, CA records, DNS, authorized endpoint scans, and applicable public certificate logs. No single source proves completeness. Certificate Transparency can reveal public issuance but does not inventory private PKI or prove that a certificate is currently served. Deduplicate certificates reused on multiple endpoints without losing the endpoint relationships.

Inspect the chain actually presented to clients. A renewed leaf certificate paired with the wrong intermediate can fail validation. A file on disk may be new while a long-running process continues serving the old one. Test the relevant hostname and trust store, not only a TCP connection to the address. Different clients can have different roots and chain-building behavior, which matters during a CA transition.

## Rehearse a complete renewal in staging

Use a staging CA or a disposable private CA so repeated tests do not consume production issuance limits. Issue a certificate for a test endpoint, deploy it, and verify a successful handshake using the intended hostname. Record the certificate fingerprint and expiry observed over the network. Then request renewal, confirm the new material reaches the terminator, and verify that new connections present it.

Test a mismatched private key and certificate in the isolated environment. The deployment mechanism should reject the pair or preserve the last working configuration rather than replacing it with a broken one. Test incomplete chain installation and a reload failure. Decide whether the service retains existing connections and how new handshakes behave. A successful issuance event should not mark the whole rotation complete.

Break the challenge path deliberately. For HTTP validation, test routing and authorization middleware that might intercept the challenge. For DNS validation, test scoped update permissions and propagation from the relevant authoritative service. Restore the dependency and observe whether automation recovers without manual state surgery. Keep the challenge credentials narrow enough that certificate renewal does not require broad DNS administration.

Finally, stop the renewal controller and verify alerts arrive early enough for the documented responder to restore it. Monitor endpoint expiry independently of the controller so one failed component cannot both stop renewal and hide the failure. Include a clock-skew check in the environment, because certificate validity is evaluated against time and a healthy certificate may still fail on a badly configured client.

## Rotate trust before removing the old path

A root or intermediate transition is different from a routine leaf renewal. Clients must trust the new path before servers depend on it. Inventory trust distribution in browsers, operating systems, language runtimes, containers, appliances, and pinned integrations. A container image can carry an old trust store long after the host has been updated. Test representative clients rather than assuming one workstation's success proves compatibility.

Where an overlap is part of the plan, define when both trust paths are accepted, when new certificates begin using the new issuer, and when the old trust material is removed. Check how long old leaf certificates and offline clients can remain. Avoid an indefinite overlap that silently preserves a compromised or obsolete trust anchor. A transition is complete only when the intended old trust has been removed and the new path is verified.

For mTLS, both sides validate identity. Rotating the server certificate while forgetting client trust, or rotating client identities without updating authorization mappings, can break the service even when every certificate is cryptographically valid. Separate authentication of a certificate from permission to perform an application action. An internal CA signature alone should not grant every workload the same privileges.

## Keep compromise response separate from expiry renewal

Routine renewal assumes the old key was not exposed. A suspected key compromise may require replacement, revocation where supported and effective, session handling, investigation, and changes to the source of compromise. Do not merely issue another certificate using the same exposed key. Document what clients actually check and the delay before a revoked credential stops being accepted.

Managed certificate services reduce some issuance and deployment work, but the application still owns its DNS, routing, trust assumptions, and endpoint inventory. Review limits and failure notifications, and test a domain or account change before the real migration. Algorithm choice should reflect supported clients and security requirements; one fashionable algorithm is not a compatibility policy.

The release evidence for certificate automation should show a successful issuance, a failed challenge and recovery, a verified endpoint replacement, an alert when renewal stops, and a trust transition rehearsal. Keep the resulting runbook short enough to use during an incident and precise enough to distinguish the failed stage. Automation makes rotation routine only when the entire path is observed and recoverable.

## Primary references

- [CA/Browser Forum adopted validity schedule](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/)
- [ACME protocol, RFC 8555](https://www.rfc-editor.org/rfc/rfc8555.html)
- [cert-manager Certificate renewal and rotation](https://cert-manager.io/docs/usage/certificate/)
