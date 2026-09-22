---
title: "The Permanent Temporary API: How Quick Fixes Become Load-Bearing Infrastructure"
description: "Why temporary API integrations never get replaced, what makes them so sticky, and the four conditions that turn a weekend workaround into a five-year maintenance burden."
date: 2026-01-15
tags: ["Architecture", "Engineering Leadership"]
format: article
---

There is a specific flavor of technical debt that announces itself as temporary and then outlives the engineers who built it, the product it was built for, and occasionally the company that acquired the company that wrote it.

The temporary API.

## How it happens

The story is always the same. Two systems need to talk. The right solution is a proper integration with versioning, authentication, a schema, error handling, and documentation. The right solution takes three weeks.

The deadline is Friday. Someone writes an endpoint that does 80% of what is needed. It goes live. The integration works. The deadline is met. The ticket is closed.

The proper integration is backlogged. The backlog grows. The temporary API is now in two production systems instead of one because the second team found it in the codebase and assumed it was intentional. Then four. Nobody documented it because it was temporary. Nobody owns it because it was a workaround. Nobody wants to touch it because nothing is documented and it has implicit callers nobody is aware of.

## What makes temporary APIs permanent

**They work.** This is the trap. A temporary solution that works has zero urgency. Every prioritization conversation ends with "it's running, why disrupt it?"

**They accumulate callers.** An undocumented internal API that does something useful gets discovered and used. Removing it now requires coordination with teams who did not know they depended on it.

**The original context is gone.** The engineer who wrote it has moved on. The reasoning is lost. Modifying it now requires understanding what it does from first principles, which is expensive and scary.

**The replacement takes work.** The right solution still takes three weeks — or more now, because of backward compatibility requirements — and the priority queue has not shortened.

## The minimal intervention

You cannot always fix the architecture. You can document the thing that exists. A single internal page that says: this endpoint exists, this is what it does, these are its known callers, this is what it was supposed to be replaced by, this is the risk of it — costs two hours and saves the next engineer two weeks.

The temporary API that is documented is already better than the temporary API that is not. Temporary that is known is better than temporary that is invisible.
