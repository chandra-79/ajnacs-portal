---
title: "WARP, Tunnels and Zero Trust: Check the Actual Policy"
description: "Clarify WARP traffic protection, resolver and tunnel behavior, and the limits of anonymity and managed policy enforcement."
date: 2029-07-13
tags: ["Systems", "Security", "DevSecOps"]
format: note
derived: true
---



## Separate an encrypted tunnel from an access policy

WARP uses VPN-like tunneling technology, so saying that it is simply not a VPN is misleading. The useful distinction is between the consumer privacy client and an organization-managed client combined with identity, routing and security policies. An encrypted connection by itself does not decide who may use an internal application. As of the documentation reviewed in November 2026, Cloudflare calls the managed endpoint application the Cloudflare One Client, formerly WARP.

The configured mode matters. DNS-only mode forwards DNS queries through the configured Cloudflare resolver but does not route all application traffic through the tunnel. Traffic routing modes carry selected network traffic, subject to configuration and exclusions. The deployed operating system, account settings and split-tunnel rules determine which flows use the managed path. Review the current documentation for the exact profile rather than inferring behavior from the presence of an icon in the menu bar.

## Test the traffic you intend to protect

Use a hypothetical rollout with 100 approved test flows. Eighty-five take the intended managed path; ten follow documented exclusions; five unexpectedly bypass it. The operational target is not to force every flow into one path. It is to explain all intended and excluded flows and investigate the five unexpected ones. These counts are a synthetic test design, not a measurement of the product's effectiveness.

Build the test inventory around destinations and protocols: an internal web application, a public site, a private database endpoint, DNS resolution and a deliberately excluded local service. For each, record the intended route, expected identity requirement and policy result. Verify with permitted endpoint diagnostics and the organization's relevant logs. Avoid treating a changed public IP address as proof that all traffic or all DNS is protected.

Next, test a denied identity and a device that does not satisfy the configured posture rule. Confirm the protected application refuses the request for the intended reason. Disconnect or disable the client in the controlled test and observe the documented failure behavior. A policy that only works when users voluntarily remain connected may not meet the organization's access requirement.

## Set realistic privacy expectations

An encrypted endpoint-to-provider tunnel protects a particular network segment. It does not make the user anonymous to every destination, remove application cookies or account identifiers, or prevent the organization and service provider from processing the data necessary for configured features. Explain the relevant data handling and inspection policy to users. The proper question is which threats and access decisions the deployment addresses, not whether the product fits a simplistic marketing category.

### Figure methodology

Synthetic 100-flow acceptance test. Categories are disjoint and sum to 100. Unexpected bypass is a configuration finding in this hypothetical test, not a product benchmark or a claim of security effectiveness.

| Worked observation | flows |
| --- | ---: |
| Intended managed path | 85 |
| Documented exclusions | 10 |
| Unexpected bypass | 5 |

## Primary references and further study

- [Cloudflare One Client architecture](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/)
- [Cloudflare client modes](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/configure/modes/)
