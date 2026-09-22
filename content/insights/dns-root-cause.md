---
title: "DNS is the root cause of more production incidents than teams give it credit for"
description: "DNS failures are underrepresented in post-mortems because DNS failures often don't look like DNS failures."
date: 2029-07-20
tags: ["Systems", "Infrastructure", "Observability"]
format: note
derived: true
---

DNS failures are underrepresented in post-mortems because DNS failures often don't look like DNS failures. They look like intermittent application errors, connection timeouts, or "it worked and then it stopped working for some users but not others."

The patterns I've seen repeatedly:

**TTL problems**: a deployment changes an IP address, but the DNS TTL was set to 3600 seconds. For the next hour, half your clients are connecting to the old address. The application logs show errors; the monitoring shows a subset of requests failing; nobody immediately checks DNS because the deployment "succeeded."

**Split-horizon DNS**: internal clients resolve a hostname to an internal IP, external clients resolve the same hostname to a public IP. A change made in one zone isn't reflected in the other. Traffic routing becomes dependent on where the client is, in ways that aren't immediately obvious.

**Round-robin DNS for load balancing**: works until one backend becomes unhealthy. DNS has no knowledge of health. Clients continue to receive the unhealthy backend's address in rotation.

**CNAME chains**: three levels of indirection, each with different TTLs and different owners. One update in the middle of the chain breaks everything downstream.

The fix isn't avoiding DNS complexity — some of that complexity serves real purposes. The fix is including DNS resolution in your observability stack: latency, failure rate, TTL values, and cache behavior. And testing DNS behavior explicitly during change management, not just connectivity.

When something intermittently breaks in a distributed system, check DNS before assuming it's the application.
