---
title: "Cloud Egress Pricing: Why the Surprise Invoice Happens and How to Prevent It"
description: "Cloud egress costs are the most reliably surprising line item on a first-year cloud bill. Understanding how egress pricing works explains why — and how to architect to minimize it."
date: 2025-10-17
tags: ["FinOps", "Cloud Architecture"]
format: article
---

The invoice arrives. The line item that nobody budgeted for: data transfer out — $8,400.

Egress pricing is the cloud cost surprise that is almost universal for teams in their first year on a major cloud provider. The architecture diagram does not mention it. The migration cost model does not include it. The development environment does not generate it. And then production traffic runs for a month.

## How egress pricing works

The major cloud providers (AWS, Azure, GCP) charge for data leaving their networks. The specific structure:

- **Data transfer out to the internet**: charged per GB, typically $0.08–0.09 per GB on AWS, with volume discounts at higher tiers
- **Data transfer between regions**: charged per GB in both directions or in one direction, depending on the provider
- **Data transfer between availability zones**: typically $0.01/GB each way on AWS — this one surprises teams most because they assume traffic within one cloud region is free
- **Data transfer between VPCs**: varies; peered VPCs in the same region incur per-GB charges

Ingress (data coming in) is free on all major providers. It is only egress that costs.

## The architectures that generate surprise egress

**Cross-AZ microservices.** A service in AZ-a calls a service in AZ-b, which calls a database in AZ-a. Every cross-AZ call generates egress charges in both directions. At scale, this accumulates to significant cost. The fix: affinity routing, placing services in the same AZ as their primary dependencies.

**Content delivery without a CDN.** Serving large static assets (images, videos, downloads) directly from cloud storage or compute rather than through a CDN sends each byte from the cloud origin to the end user. A CDN caches content at edge nodes; subsequent requests serve from the edge, which has dramatically lower egress cost.

**Developer machines pulling large datasets.** Engineers pulling production datasets to local machines for analysis generate egress charges. Moving analysis to the cloud (notebooks, query interfaces) eliminates this category entirely.

**Cross-region replication.** Replicating data between regions for DR or geographic distribution generates per-GB charges for all replicated data. This is often necessary, but the cost should be projected before the replication is enabled.

## The planning step that prevents the surprise

Before any significant deployment: estimate the expected monthly data transfer volume by category. What leaves the cloud to the internet? What moves between regions? What crosses AZ boundaries? Multiply by the provider's pricing. Compare to the budget.

This takes 30 minutes and prevents the 8,400-dollar surprise.

You will only get one cloud egress surprise invoice. Make sure it is the lesson, not the pattern.
