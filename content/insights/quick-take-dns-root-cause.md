---
title: "DNS: Why It Causes More Production Incidents Than It Gets Credit For"
description: "DNS failures are responsible for a surprising proportion of production incidents — but they are often misdiagnosed because the symptoms look like application or network failures, not DNS failures."
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

When a service is unreachable and the cause is not immediately obvious: check DNS before checking the service. `dig`, `nslookup`, or `host` against both the default resolver and a known-good external resolver (8.8.8.8) within 30 seconds of starting an investigation eliminates or confirms DNS as a cause.

DNS is not interesting until it breaks. When it breaks, nothing else is interesting.
