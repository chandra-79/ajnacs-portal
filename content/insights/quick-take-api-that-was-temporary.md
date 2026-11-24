---
title: "The Permanent Temporary API: How Quick Fixes Become Load-Bearing Infrastructure"
description: "Why temporary API integrations can become long-lived, how undocumented dependencies accumulate, and how to plan a measurable migration without breaking callers."
date: 2027-12-15
tags: ["Architecture", "Engineering Leadership"]
format: article
---

There is a specific flavor of technical debt that announces itself as temporary and then outlives the engineers who built it, the product it was built for, and occasionally the company that acquired the company that wrote it.

The temporary API.

## How it happens

Consider this hypothetical failure pattern; its durations and completion estimate are illustrative, not customer measurements. Two systems need to talk. The right solution is a proper integration with versioning, authentication, a schema, error handling, and documentation. The right solution takes three weeks.

The deadline is Friday. Someone writes an endpoint that does 80% of what is needed. It goes live. The integration works. The deadline is met. The ticket is closed.

The proper integration is backlogged. The backlog grows. The temporary API is now in two production systems instead of one because the second team found it in the codebase and assumed it was intentional. Then four. Nobody documented it because it was temporary. Nobody owns it because it was a workaround. Nobody wants to touch it because nothing is documented and it has implicit callers nobody is aware of.

## What makes temporary APIs permanent

**They work.** This is the trap. A temporary solution that works has zero urgency. Every prioritization conversation ends with "it's running, why disrupt it?"

**They accumulate callers.** An undocumented internal API that does something useful gets discovered and used. Removing it now requires coordination with teams who did not know they depended on it.

**The original context is gone.** The engineer who wrote it has moved on. The reasoning is lost. Modifying it now requires understanding what it does from first principles, which is expensive and scary.

**The replacement takes work.** The right solution still takes three weeks — or more now, because of backward compatibility requirements — and the priority queue has not shortened.

## The minimal intervention

You cannot always fix the architecture. You can document the thing that exists. A single internal page that says: this endpoint exists, this is what it does, these are its known callers, this is what it was supposed to be replaced by, this is the risk of it — gives the next engineer a starting point and exposes questions that still need investigation.

The temporary API that is documented is already better than the temporary API that is not. Temporary that is known is better than temporary that is invisible.

## Inventory what the shortcut now promises

The safest first intervention is to identify the contract consumers already rely on. Record authentication, authorisation, input shape, response ordering, pagination, errors, and side effects. An endpoint with no formal schema still has observable behaviour. Changing that behaviour while calling the work “cleanup” can create a breaking change for an integration nobody has interviewed.

Use a fictional inventory of eight callers. Five are registered service accounts with named owners, two appear in logs but have no registry entry, and one is a batch job mentioned in an old runbook. The chart shows five accounted-for and three unresolved callers. Do not discard the batch job because it has not run this week; its business cycle may be longer than the observation window.

An API registry need not begin as a large platform. A versioned file can record route, purpose, owner, consumer identifiers, data classification, lifecycle status, and intended replacement. The file becomes useful when it is reviewed with changes to the endpoint and when unknown callers can be reconciled against it. A stale inventory is not a control simply because it exists.

## Decide whether to stabilise or retire

A useful temporary integration may deserve to become a supported API. Compare that option with replacing it. Stabilisation may require a clear error contract, bounded requests, proper authorisation, and compatibility tests. Retirement may require consumer migration, retained historical data, and removal of credentials. Both have costs; neither should be hidden behind a label.

For a replacement, pick one known consumer and exercise its full path in a test environment. Include a timeout after the service may have completed a write. Determine whether the client can retry safely, query the operation status, or needs an idempotency key. Equivalent success JSON is insufficient if error or retry behaviour differs.

Track consumer cutover by evidence. A completed migration has an identified owner, a tested replacement, and a verified removal of the old dependency. Traffic observations help, but they do not replace that evidence. Keep unresolved callers in the report until they are understood.

## Remove the operational residue

After retirement, check scheduled tasks, documentation, monitoring, API keys, and dashboard links. A removed handler can leave a credential or job trying to reach it indefinitely. Record the final status in the registry and retain the decision explaining why the route was removed. That record makes the next apparently temporary integration easier to assess before it acquires the same hidden obligations.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
