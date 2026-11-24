---
title: "Diagnosing DNS Failures Without Guessing the Root Cause"
description: "Investigate DNS from the affected workload, distinguish cache and transport behavior, and calculate a simple positive-cache expiry example."
date: 2029-07-20
tags: ["Systems", "Infrastructure", "Observability"]
format: note
derived: true
---

DNS failures are underrepresented in post-mortems because DNS failures often don't look like DNS failures. They look like intermittent application errors, connection timeouts, or "it worked and then it stopped working for some users but not others."

Patterns worth testing during a DNS investigation:

**TTL problems**: a deployment changes an IP address, but the DNS TTL was set to 3600 seconds. For the next hour, half your clients are connecting to the old address. The application logs show errors; the monitoring shows a subset of requests failing; nobody immediately checks DNS because the deployment "succeeded."

**Split-horizon DNS**: internal clients resolve a hostname to an internal IP, external clients resolve the same hostname to a public IP. A change made in one zone isn't reflected in the other. Traffic routing becomes dependent on where the client is, in ways that aren't immediately obvious.

**Round-robin DNS for load balancing**: works until one backend becomes unhealthy. DNS has no knowledge of health. Clients continue to receive the unhealthy backend's address in rotation.

**CNAME chains**: three levels of indirection, each with different TTLs and different owners. One update in the middle of the chain breaks everything downstream.

The fix isn't avoiding DNS complexity — some of that complexity serves real purposes. The fix is including DNS resolution in your observability stack: latency, failure rate, TTL values, and cache behavior. And testing DNS behavior explicitly during change management, not just connectivity.

When something intermittently breaks in a distributed system, check DNS before assuming it's the application.

## Follow one failed lookup end to end

Treat DNS as one hypothesis, not the default answer to every intermittent failure. A service can resolve the correct address and still fail during TCP establishment, TLS negotiation, authorization, or application processing. Put a timestamp beside each stage so an incident timeline distinguishes name resolution from what happens after it.

Consider a fictional service migration from address A to B. The old positive answer has a 300-second TTL. At migration time, three clients have cached it for 40, 180, and 290 seconds. Under ordinary TTL expiry, their remaining cache lifetimes are 260, 120, and 10 seconds. Those are the values in the figure. The migration should keep A able to serve compatible requests during the overlap. Lowering the authoritative TTL at the instant of migration does not shorten positive answers already cached elsewhere.

## A small diagnostic worksheet

Record the exact queried name, query type, resolver address, response code, returned addresses, answer TTL, and client network. Test from the affected runtime. A laptop using a different resolver may see a different private zone, search suffix, or cached answer. Compare the recursive result with the authoritative zone only when the query is safe to expose. Do not send private service names to a public resolver as a routine test.

Next, distinguish NXDOMAIN from a timeout and from a successful answer containing the wrong address. A negative cached answer can persist after a missing record is created; its lifetime follows negative caching rules rather than the TTL of the newly created positive record. Inspect the authority section and the resolver's behavior before repeatedly restarting application processes.

Finally, connect the observations to a change decision. If all affected clients receive B but connection establishment fails, investigate routing and listeners. If only one resolver returns A past the expected cache window, investigate that resolver and any application cache above it. Preserve the failed response in the incident record. The useful outcome is a demonstrated failure boundary, not a memorable statement that DNS was to blame.

### Figure methodology

Synthetic positive-cache example. Remaining lifetime equals 300 seconds minus the answer age. It excludes serve-stale policies, application caching and negative answers; it is not a universal cutover duration.

| Worked observation | seconds |
| --- | ---: |
| Client 1 | 260 |
| Client 2 | 120 |
| Client 3 | 10 |

## Primary references and further study

- [DNS message and TTL specification](https://www.rfc-editor.org/rfc/rfc1035.html)
- [Negative caching semantics](https://www.rfc-editor.org/rfc/rfc2308.html)
