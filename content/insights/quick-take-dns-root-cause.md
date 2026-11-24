---
title: "Diagnose DNS by Response Type and Resolver Path"
description: "Compare DNS answers from the intended resolver path, preserve incident evidence, and calculate cache age before changing records."
date: 2028-09-01
tags: ["Systems", "Infrastructure", "Observability"]
format: article
---

There is a category of production incident that presents as: service is down, requests are failing with connection errors, the application looks broken. The team investigates application logs, checks CPU and memory, reviews recent deployments. Everything looks fine.

Eventually, someone checks DNS. The record is wrong, or the resolver is failing, or a TTL that was set to 5 minutes is preventing a recently updated record from propagating.

It was DNS all along. It is surprisingly often DNS.

## Why DNS failures are hard to diagnose

DNS problems present as the symptoms of the systems that depend on DNS. A service discovery failure looks like a microservice being unavailable. A misconfigured CDN origin record looks like a CDN outage. A stale DNS cache after a failover looks like the new endpoint is unreachable.

Because the failure is indistinguishable from the downstream system's failure at the symptom level, the investigation starts there. The DNS layer is checked last, if at all.

## The common failure patterns

**Stale records after failover.** A database fails over to a new IP address. The DNS record is updated. But the application's DNS resolver has cached the old IP with a TTL of 3600 seconds. For the next hour, the application continues attempting to connect to the old (now unreachable) IP address. The fix — restart the application, flush the resolver cache — is not obvious if the investigator does not know the failover happened and does not know to check DNS TTLs.

**Resolver failure.** The internal DNS resolver — a corporate DNS server or a cloud VPC resolver — fails or becomes overloaded. Every DNS lookup times out or fails. Every service-to-service call fails because service discovery is DNS-based. Kubernetes environments are particularly exposed to this: CoreDNS failure takes down service discovery across the cluster.

**Split-horizon DNS inconsistency.** An internal hostname resolves to a private IP from inside the network and a public IP from outside. A misconfiguration or replication failure between internal and external DNS zones produces inconsistent resolution depending on where the query originates. Intermittent failures that appear to be network-dependent are often split-horizon DNS inconsistencies.

**TTL set too high before a planned change.** A record with a 24-hour TTL requires 24 hours to fully propagate after a change. If a team changes a hostname record without first reducing the TTL to a short value (60–300 seconds) in advance of the change, they are committed to a slow propagation window regardless of how quickly they update the record.

## The diagnostic reflex

When a service is unreachable and the cause is not immediately obvious: check DNS before checking the service. `dig`, `nslookup`, or `host` from the affected runtime and the intended resolver path can narrow the fault; use external resolvers only when the name and comparison are appropriate.

DNS is not interesting until it breaks. When it breaks, nothing else is interesting.

## Distinguish three different incidents

A DNS timeout, a negative answer and a positive answer pointing to an unavailable service require different responses. Restarting an application may temporarily change a cache but does not identify which of those failures occurred. Capture the query and response from the affected runtime before changing the system.

For a fictional diagnostic sample of 200 lookups, 170 return the expected address, 20 return NXDOMAIN and 10 time out. The chart records those disjoint results. A successful-lookup share of 85% says nothing about whether the application could connect to the returned address. Keep connection, TLS and application outcomes in separate stages of the trace so a resolver improvement is not confused with an end-to-end recovery.

## Reproduce the relevant resolver path

Start with the exact hostname the application uses, including any search-domain behavior. Record whether it requests IPv4, IPv6 or both. Identify the configured recursive resolver and any local cache or proxy. Test from the same network context and namespace as the affected process; a host shell and a container can have different resolution paths.

Compare the observed answer with the authoritative zone when that is appropriate and authorized. Public resolvers are not a universal ground truth for private names or split-horizon zones. Sending an internal hostname to an external service can expose information and still produce an irrelevant negative answer. Use the organization's known resolver path and its intended private-zone configuration.

If the answer is negative, inspect how that negative result is cached. Creating the missing record does not necessarily make every client retry immediately. If it is positive, inspect the answer TTL and the age of relevant caches. Lowering a TTL after clients have cached an older answer does not retroactively shorten that answer's lifetime. For timeouts, inspect reachability and resolver capacity rather than treating the absence of a response as proof that the name does not exist.

## Test the cutover before relying on it

Construct a nonproduction name with a short, recorded TTL and two controlled endpoints. Observe the result before and after changing the authoritative record. Include a client that established a long-lived connection before the change; that connection may continue using the old endpoint independently of new lookups. Include a missing-name test to demonstrate negative caching as a separate mechanism.

Record the actual adoption distribution across clients instead of reporting one instant of global propagation. DNS is a distributed system with caches and implementation policies. A migration plan should keep the old endpoint safe for the observed overlap and have a route to restore service if the new endpoint is unhealthy. The rehearsal turns a vague propagation assumption into a concrete dependency and rollback window.

### Figure methodology

Synthetic sample of 200 lookups. Response categories sum to 200; 170/200 = 85% expected positive answers. No inference about subsequent TCP, TLS or application success is included.

| Worked observation | lookups |
| --- | ---: |
| Expected positive answer | 170 |
| NXDOMAIN | 20 |
| Timeout | 10 |

## Primary references and further study

- [DNS messages and TTLs](https://www.rfc-editor.org/rfc/rfc1035.html)
- [DNS negative caching](https://www.rfc-editor.org/rfc/rfc2308.html)
