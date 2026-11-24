---
title: "Cloudflare WARP and Zero Trust: Routing, DNS, Policy and Verification"
description: "Configure the managed Cloudflare One client by traffic mode, routing and policy, then test DNS, tunnel and inspection boundaries."
date: 2027-08-02
tags: ["Systems", "Security", "DevSecOps"]
format: article
---



Cloudflare's managed device client uses encrypted tunneling and can provide VPN-like connectivity. Calling it “not a VPN” obscures the useful questions: which traffic enters the tunnel, where it exits, which identity and device signals apply, and how private applications are reached. A tunnel to a cloud security service differs operationally from a tunnel to a company gateway, but both can carry protected network traffic.

As checked against Cloudflare's documentation in November 2026, the managed product is called the Cloudflare One Client, formerly WARP. Consumer WARP and an organization-enrolled client have different configuration and policy contexts. Product names and supported modes can change, so the deployment record should identify the client version, operating system, organization enrollment and effective profile. A connected icon alone does not establish policy coverage.

## Separate DNS, network routing and application authorization

DNS resolution decides how a name becomes an address. Network routing decides which path carries packets to that address. Application authorization decides whether the user or device may perform an operation. These controls interact but are not interchangeable. Successful private DNS resolution does not prove a working route, and a working route does not prove the user has permission to use the application.

An organization can use DNS filtering to block selected domain lookups without tunneling all application traffic. It can route network traffic through Gateway while retaining an existing DNS arrangement in a supported mode. It can also protect an application through an identity-aware access policy. Write down which layer enforces each requirement so troubleshooting does not collapse every failure into “the VPN is broken.”

Encrypted DNS protects the resolver connection under its protocol and trust model. It does not make browsing anonymous or prevent the resolver from observing queries. Likewise, tunnel encryption protects a particular path to the tunnel endpoint; the service and destination still have visibility appropriate to their roles. Keep end-to-end application TLS and ordinary endpoint security in the design.

## Choose a client mode from the required coverage

The documented Traffic and DNS mode routes eligible device traffic and uses the client DNS resolver, subject to profile and split-tunnel settings. DNS-only mode forwards DNS resolution but does not route ordinary device traffic through the tunnel. Traffic-only mode routes traffic while leaving DNS to the operating system, with feature limitations that need review. Local-proxy mode applies to explicitly directed application traffic rather than acting as a blanket device-wide control.

These mode differences matter when evaluating a policy. A successful DNS block test in DNS-only mode says nothing about HTTP body inspection. A local proxy cannot inspect an application that never uses it. Confirm the effective setting on the device, because management configuration can override dashboard expectations. Include IPv4 and IPv6, supported platforms and client-version prerequisites in the test matrix.

Do not hard-code the assumption that the tunnel is always WireGuard. Current client capabilities include protocol choices such as MASQUE in supported configurations. Use the deployed documentation and diagnostic output to establish the actual transport. Protocol selection can affect compatibility with local firewalls, other VPN software and application traffic.

## Split tunnels define visibility boundaries

In exclude mode, configured destinations bypass the tunnel while other eligible traffic uses it. In include mode, only configured destinations enter the tunnel. The latter can be useful for a narrow private-access deployment, but traffic outside the list does not receive the same network and HTTP policy coverage. Record exceptions with an owner and reason rather than allowing the list to become unexplained accumulated state.

Cloudflare documents that split tunneling controls IP traffic, while DNS behavior is separately affected by resolver configuration and local-domain fallback. Excluding an IP route does not automatically send its domain query to a local resolver. Test both the lookup and the resulting connection. Domain-based routing can also depend on how resolution occurs; an application using its own resolver or cached answers can complicate the expected behavior.

Private address ranges often overlap between home networks and corporate resources. A broad route can capture local printers or another VPN's destinations. Use precise scopes and verify the intended precedence on representative networks. Test a device on a corporate network, a home network and a restricted guest network. The correct profile is the one that implements the required access and exclusions across those contexts.

## Private connectivity needs both ends and a policy

A device client is only one part of private access. The private network needs a supported connector or network attachment, advertised routes and a working return path. Cloudflare Tunnel is one option; other supported connectivity arrangements have their own requirements. A `cloudflared` process merely running somewhere is not proof that the intended subnet and application are reachable.

For a specific private service, verify its name resolution, route advertisement, client split-tunnel inclusion, network policy, connector health and destination firewall. Test by hostname and, where appropriate, by address to separate DNS from routing. Keep application authentication in the flow. Network access to a subnet should not silently grant every user access to every service in it.

Plan redundancy for the connector and its dependencies. A highly available cloud edge does not prevent an on-premises connector, local DNS server or origin application from failing. Measure the full path and rehearse connector loss. Record who owns each segment so an incident can be routed to the right team without guessing.

## HTTP inspection requires an explicit trust arrangement

HTTPS inspection requires the supported proxy configuration and a trusted inspection certificate on the relevant client/application trust stores. It changes the TLS trust path and must be deployed with a clear purpose, access controls and appropriate handling of inspected data. Installing a device client alone does not establish that every HTTPS flow is inspected.

Certificate-pinned applications and some mutual-TLS arrangements may not work with interception. Use documented exceptions or an alternative control rather than disabling certificate verification in the application. A Do Not Inspect policy changes visibility; it should be reviewed as an intentional exception. Test browser traffic and native applications separately because their trust stores and proxy behavior can differ.

Device posture is another input to policy, not a replacement for mobile-device management or endpoint detection. A disk-encryption or version check has a supported platform scope and refresh behavior. Define how stale or unavailable posture signals are handled. A remediation message should explain the failed requirement without revealing sensitive internal policy details.

## A hypothetical route-performance comparison

Suppose a fixed test endpoint has a median application response time of 80 milliseconds over a direct path, 70 through the managed tunnel on one network and 95 through the tunnel on another network. The chart shows these invented values. The first tunneled path is 12.5 percent lower than the direct baseline; the second is 18.75 percent higher. Neither result proves a general performance advantage or disadvantage for WARP.

For a real experiment, use the same endpoint, payload, application protocol and client, collect enough samples and report the distribution rather than one ping. Separate DNS, connection establishment, TLS and application response where possible. Record location, access network, test time and client mode. Avoid comparing a cached response with a cold response or changing several routing variables at once.

Packet loss, jitter, path MTU and application behavior can matter more than median latency. Include a sustained transfer and a representative interactive operation if both are important. A route can improve one destination and worsen another, so use the actual application portfolio rather than a single public speed-test result.

## A deployment and troubleshooting worksheet

Start with a small authorized pilot group and a versioned profile. List required public and private applications, intended DNS behavior, tunnel inclusion, inspection policy and posture condition for each. Add explicit negative tests: an unauthorized identity, a noncompliant device and an excluded destination should each behave as documented. Verify the enforcement point through logs and client diagnostics, not only a visible block page.

Rehearse a failed connector, expired session, unavailable posture source and conflicting VPN. Confirm that help-desk staff can collect the effective profile and relevant diagnostics without asking users to disclose secrets. Define a controlled rollback that restores required connectivity while documenting which security coverage is temporarily absent. Avoid a permanent broad bypass created during an urgent support call.

For each support case, preserve the time, destination, client version and observed failure stage. Compare the intended dashboard profile with the effective device profile before changing policies. If DNS returns the expected address but the connection times out, inspect routing and destination reachability; if TLS fails, inspect certificate trust and inspection compatibility; if the application returns an authorization error, investigate its identity policy. This sequence avoids broad security exceptions that do not address the actual fault. Keep diagnostic retention bounded and redact tokens or personal information before sharing logs.

A completed rollout includes monitoring for enrollment failures, profile drift, policy denials, connector availability and application performance. Review exceptions after the pilot and periodically afterward. The goal is understandable, least-privilege connectivity with evidence of what is routed and enforced. A product label or tunnel icon is only the beginning of that evidence.

### Figure methodology

Synthetic medians are 80,70,95 ms for one fixed endpoint and payload. Relative to 80 ms,70 is 12.5% lower and 95 is 18.75% higher. These are explanatory values, not measured Cloudflare performance or a promise across networks.

| Worked observation | milliseconds |
| --- | ---: |
| Direct baseline | 80 |
| Tunnel on network A | 70 |
| Tunnel on network B | 95 |

## Primary references and further study

- [Cloudflare One Client modes](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/modes/)
- [Cloudflare split-tunnel routing](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/route-traffic/split-tunnels/)
- [Cloudflare HTTP filtering setup](https://developers.cloudflare.com/cloudflare-one/traffic-controls/get-started/http/)
- [Cloudflare private CIDR connectivity](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/private-net/cloudflared/connect-cidr/)
