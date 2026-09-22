---
title: "The API that was supposed to be temporary is now in four production systems."
description: "There is no such thing as a temporary API in production. There is only an API whose permanent status has not yet been acknowledged."
date: 2025-09-08
tags: ["Architecture", "Engineering Leadership"]
format: article
derived: true
---

There is no such thing as a temporary API in production. There is only an API whose permanent status has not yet been acknowledged.

The lifecycle is consistent. An engineer needs to expose some functionality quickly — for a prototype, a partner integration, or an internal tool that "won't be around long." They build the simplest possible endpoint: no versioning because it's temporary, minimal documentation because it's for internal use, authentication that's serviceable but not production-grade because it won't need to be. The endpoint works. Someone else on the team finds it useful. A second service starts calling it. A third.

Six months later, the engineer who built it has moved to another team. The endpoint is in four production paths. Nobody wants to deprecate it because they don't know all its consumers. Nobody wants to change its interface because they can't test all the impact. The endpoint that was supposed to be temporary has become the endpoint that will never be changed.

The engineering practice that interrupts this cycle: treat every API endpoint as permanent from the moment it has more than one consumer. Not because temporary APIs are bad, but because the definition of temporary changes the moment adoption occurs. A simple API registry — even a YAML file checked into the service repository — that records endpoint, owner, consumers, authentication model, and intended lifespan forces the conversation early. The deprecation date creates accountability. The ownership field creates a contact when consumers need to migrate.

This is not bureaucracy. It is the discipline that makes the "we'll clean it up later" conversation actually happen before the endpoint is load-bearing.
