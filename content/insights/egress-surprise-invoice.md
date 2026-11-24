---
title: "Model Cloud Egress Before the Invoice Arrives"
description: "Explain transfer-route billing and duplicate bytes, then build an illustrative cost worksheet that can be reconciled with actual invoices."
date: 2028-12-22
tags: ["FinOps", "Cloud Architecture"]
format: article
derived: true
---

Cloud egress pricing works differently from most cloud cost categories. Compute and storage costs scale roughly linearly with usage in ways that are easy to estimate. Egress costs are invisible until they are not, because the pricing model creates dramatic differences based on where data goes, not just how much of it moves.

The architecture decision that creates the surprise is usually reasonable in isolation. An analytics system that reads from a data lake in one region and processes it in another. A microservices deployment that makes inter-region API calls for data that could be cached. An application that serves assets directly from object storage rather than through a CDN. Each of these is an architectural choice that has egress implications that may not be obvious until production traffic volumes make them visible.

The organisational fix has two parts. The first is adding data transfer analysis to architecture reviews — specifically, documenting the expected data flows between regions, between services, and to the internet, and calculating the cost at projected production volumes before the design is finalised. The review effort depends on the number of routes and the available telemetry. Documenting quantities and rates makes omitted transfer paths visible before the architecture is committed.

The second is routing. A CDN can reduce origin traffic, but compare its request, delivery and origin-fetch charges with the existing route and contract; lower total cost is not universal. Regional API endpoints can reduce cross-region calls when the application can route locally. Local read replicas can replace remote reads while adding replication traffic, storage and compute costs. These placement decisions also affect freshness and resilience, so assess the complete path at design time.

The teams that only get one egress surprise are the ones who build the calculation into their design process before the invoice teaches them to.

## Trace one byte across the billing boundaries

A data-transfer model needs origins, destinations and paths, not just a monthly volume. Internet transfer, cross-region transfer, inter-zone transfer, replication and processing through a network appliance can have different charging rules. Charges can also appear on different resources or accounts for the same application path. Consult the current price and contract for the exact route before estimating a bill.

For a fictional planning exercise, suppose an application sends 40,000 GB per month along a route priced at an assumed $0.05 per GB. The modeled transfer cost is $2,000. A proposed cache serves 60% of those bytes locally and therefore reduces traffic on that charged route to 16,000 GB, costing $800. If the cache adds $300 per month of other service cost, the modeled net reduction is $900. These rates are made-up teaching inputs, not a cloud provider quote.

## Check the architecture behind the saving

Measure cacheability by byte volume, not only request hit ratio. A cache that serves many tiny responses can have a high request hit ratio while large uncached objects still dominate transfer. Include fills, revalidations, invalidations and replication in the traffic model. A new cache tier may also introduce a second charged path, which belongs in the comparison.

Build a small worksheet with source region, destination, monthly bytes, chargeable direction, applied rate and additional processing charges. Reconcile a representative period against billing lines and traffic telemetry. Explain discrepancies such as sampling, compression, decimal versus binary units, late billing and retries before projecting the saving to a whole month.

Before changing placement, check freshness, access controls and failure behavior. Keeping data near its consumer can reduce transfer but may change resilience or recovery assumptions. A useful decision records cost, latency, freshness and operational work together. The invoice is the feedback signal; the traffic map is the explanation that makes the next design better.

### Figure methodology

Synthetic planning rates: 40,000 GB × $0.05 = $2,000; 16,000 GB × $0.05 = $800 after 60% byte avoidance. Add $300 cache cost for a $900 net modeled reduction. Excludes taxes, tiered rates and other transfer paths.

| Worked observation | USD/month |
| --- | ---: |
| Original route | 2000 |
| Cached route | 800 |
| Added cache cost | 300 |

## Primary references and further study

- [FinOps unit economics](https://www.finops.org/framework/capabilities/unit-economics/)
- [FinOps usage optimization](https://www.finops.org/framework/capabilities/usage-optimization/)
- [AWS EC2: route-specific data-transfer pricing](https://aws.amazon.com/ec2/pricing/on-demand/)
