---
title: "Every team gets one cloud egress surprise invoice. The good ones only get one."
description: "Cloud egress pricing works differently from most cloud cost categories. Compute and storage costs scale roughly linearly with usage in ways that are easy to estimate."
date: 2026-01-26
tags: ["FinOps", "Cloud Architecture"]
format: article
derived: true
---

Cloud egress pricing works differently from most cloud cost categories. Compute and storage costs scale roughly linearly with usage in ways that are easy to estimate. Egress costs are invisible until they are not, because the pricing model creates dramatic differences based on where data goes, not just how much of it moves.

The architecture decision that creates the surprise is usually reasonable in isolation. An analytics system that reads from a data lake in one region and processes it in another. A microservices deployment that makes inter-region API calls for data that could be cached. An application that serves assets directly from object storage rather than through a CDN. Each of these is an architectural choice that has egress implications that may not be obvious until production traffic volumes make them visible.

The organisational fix has two parts. The first is adding data transfer analysis to architecture reviews — specifically, documenting the expected data flows between regions, between services, and to the internet, and calculating the cost at projected production volumes before the design is finalised. This is a five-minute calculation that prevents a five-figure monthly cost.

The second is routing. CDN egress is cheaper than direct object storage egress on every major cloud provider. Regional API endpoints reduce cross-region transfer for services that don't require global reach. Read replicas in the region where read traffic originates eliminate cross-region database reads. These routing decisions are available at design time and expensive to retrofit after adoption.

The teams that only get one egress surprise are the ones who build the calculation into their design process before the invoice teaches them to.
