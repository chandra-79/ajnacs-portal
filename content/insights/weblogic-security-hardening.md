---
title: "WebLogic Security Hardening: The Checklist That Survives an Audit"
description: "Locking down WebLogic Server in production — admin channel isolation, T3 exposure, security realms, TLS configuration, patching cadence, and the exploit history that explains why each control exists."
date: 2027-03-19
tags: ["Java", "WebLogic", "Security", "Middleware", "Compliance"]
format: article
---

WebLogic has appeared in CISA's known-exploited-vulnerabilities catalog often enough that "is our WebLogic exposed?" is a question every enterprise security team has asked at least once. The uncomfortable truth: most exploited WebLogic instances weren't running exotic zero-days. They were running default configurations — admin consoles on the internet, T3 open to the world, patches eighteen months behind.

This is the hardening baseline I hold estates to, with the reasoning attached, because checklists without reasoning don't survive contact with exception requests.

## Know why: the exploit history in one paragraph

The recurring WebLogic vulnerability classes are deserialization attacks over **T3/IIOP** (Java's native remoting protocols), and authentication bypasses in the **administration console** paths. The pattern repeats across years of CVEs. That history dictates the two highest-value controls: get T3 off untrusted networks, and get the console off any network users can reach. Everything else is defense in depth behind those two.

## Network posture: the controls that matter most

**Enable the domain-wide administration port.** This moves all administrative traffic — console, WLST, deployment — to a dedicated SSL port, separated from application traffic. Combined with network policy, it means "reachable by users" and "administrable" are different network paths. It also unlocks admin-mode application testing as a release tool.

**Restrict T3.** Application clients rarely need T3 from outside the data center. Use network channels to bind T3/T3S to internal interfaces only, and set connection filters (`weblogic.security.net.ConnectionFilterImpl`) to allowlist which source networks may speak which protocols. If nothing external legitimately uses T3, the internet-facing answer should be: HTTP(S) only, everything else filtered.

**Disable IIOP** unless something genuinely uses it. Most estates enabled it by default and never noticed.

**Front everything with a proxy tier.** Users terminate at a load balancer or web tier; WebLogic listen addresses bind to internal interfaces. No managed server should have a routable public address. This sounds elementary; internet scans say otherwise.

**Block the well-known paths at the proxy** regardless of internal settings: the console context path, management REST endpoints, and any legacy paths from prior CVEs. Defense in depth means the proxy blocks what the network policy should already prevent.

## The admin console: reduce, then protect

Set the console to a **non-default context path**, or disable it entirely in production and administer via WLST/REST over the admin port — mature estates increasingly do exactly this, because automation-only administration is both a security and a change-control win.

Protect what remains: console session timeout tightened, login lockout policy verified (on by default, but audits ask), and console access logged and shipped to the SIEM. Every console login in production should correspond to a change ticket, and the correlation should be someone's job to check.

## Accounts, realms, and least privilege

**Break the shared-admin habit.** One `weblogic` account whose password is in a wiki is the single most common finding. Individual accounts, each with the least role that works: `Deployer` for pipelines, `Monitor` for dashboards and scrapers, `Operator` for start/stop runbooks, and `Admin` for a small named set. The default security realm's role model handles this without custom providers.

**Integrate the corporate directory** (LDAP/AD authenticator, or SAML/OIDC for console SSO where applicable) so joiners-movers-leavers applies to middleware. Keep exactly one break-glass local account, vaulted, rotated, and alarmed on use.

**Credential hygiene in the domain:** boot identity files present so scripts don't embed passwords; the domain encryption salt (`SerializedSystemIni.dat`) treated as a secret — anyone with it plus `config.xml` can decrypt every embedded credential; filesystem permissions on the domain directory restricted to the WebLogic OS user, which itself is non-root and non-login.

## TLS: kill the demo certs, then raise the floor

Every WebLogic hardening review finds at least one server still running **demo identity and trust keystores**. Their private keys ship with every WebLogic installation on earth; they authenticate nothing. Replace them everywhere — including "internal-only" servers, including dev, because dev configs get promoted.

Then the floor: TLS 1.2 minimum (1.3 where the version supports it) via `weblogic.security.SSL.minimumProtocolVersion`, weak ciphers out, **hostname verification on** (turning it off "temporarily" is how it stays off for six years), JSSE SSL (the default and only sane option on current versions), and secure flags on cookies. Internal traffic gets TLS too — t3s and HTTPS between tiers — because "internal" networks stopped being trustworthy the day the first phishing email landed.

## Patching: the control that actually correlates with breaches

Oracle ships Critical Patch Updates **quarterly** (January, April, July, October), and WebLogic CVEs with public exploits reliably appear in them. The estates that get breached are the ones treating CPUs as annual events.

What a defensible cadence looks like: CPU released → assess applicability within days → non-prod within two weeks → production within thirty days, with an emergency lane for actively-exploited CVEs that compresses to days. This is only achievable if patching is *rehearsed and boring* — which loops back to deployment automation: estates that can rolling-restart without fear patch on time, and estates that fear restarts run exploitable versions. Patch velocity is an architecture property, not a diligence property.

Track the JDK too. WebLogic runs on a JVM with its own CVE stream, and "we patched WebLogic" while running a two-year-old JDK is half a patch.

## Auditing and detection

Turn on what auditors will ask for and attackers hope you didn't: the **default auditing provider** (or WLDF watches) capturing authentication events, authorization failures, and configuration changes; logs shipped off-host to the SIEM in near-real-time — on-host logs vanish with the host; and configuration drift detection, comparing running config against the version-controlled source of truth, because an unexplained new deployment or changed connection filter is exactly what post-exploitation looks like on this platform.

Alert on the cheap, high-signal events: authentication failure bursts, break-glass account use, T3 connection attempts from unexpected sources, console access outside change windows, and new applications appearing in the deployment list.

## The one-page version

Admin port on, console renamed or off, T3/IIOP filtered to trusted networks, everything behind a proxy that also blocks management paths. Individual least-privilege accounts from the corporate directory, one alarmed break-glass. Demo certs dead, TLS 1.2+, hostname verification on. Quarterly CPUs on a thirty-day SLA with an emergency lane, JDK included. Audit events to the SIEM, drift detection against git, alerts on the five events above.

None of this requires a product purchase. It requires deciding that the middleware layer deserves the same rigor as the perimeter — which, given where the CVEs are, it demonstrably does.
