---
title: "Cloud Network Design: VPCs, IP Math, and the Topology Decisions You Can't Cheaply Undo"
description: "Network architecture is the cloud's least reversible layer — CIDR plans outlive re-orgs, and hub-and-spoke decisions shape a decade of connectivity. Address-space discipline, segmentation models, the private-connectivity toolkit, and the egress economics."
date: 2027-07-12
tags: ["Cloud Architecture", "Systems", "Architecture", "Security", "FinOps"]
format: article
---

Cloud made most infrastructure decisions reversible — instances resize, services swap, regions multiply — with one stubborn exception: **the network layer calcifies.** CIDR blocks assigned in year one constrain what can peer in year eight; the flat network that was fine at ten services is unsegmentable at four hundred; and the IP-range collision with the acquired company's estate becomes a two-year NAT-riddled workaround. Network design rewards the rare discipline of planning for a scale you can't yet justify — because unlike compute, you can't autoscale your way out of an addressing mistake.

## IP math: the decision that outlives everyone

Address planning is boring exactly once, and then it's archaeology. The disciplines: **allocate from a coordinated master plan** — one organization-wide RFC1918 scheme, carved hierarchically (per region → per environment → per VPC), tracked in an IPAM system rather than a wiki (the drift between "the spreadsheet" and reality is where collisions breed), with the acquired-company scenario *assumed* (leave uncarved reserve space; the merger's network integration is painful in proportion to how completely you spent 10.0.0.0/8). **Size VPCs generously and subnets deliberately** — VPC CIDRs are hard or impossible to shrink and painful to extend; the cost of over-allocating private space is zero, and the Kubernetes footnote is load-bearing: pod networking consumes IPs at rates that shock traditional planners (a modest cluster can burn thousands — secondary ranges and the overlay-vs-native routing choice are IP-plan decisions, not cluster afterthoughts). **And plan the non-overlap constraint globally** — peering, VPNs to partners, and hybrid links to on-prem all fail on overlapping ranges; every range you assign is a range you're asserting no future connection will collide with.

## Topology: hub-and-spoke won, the details still matter

The segmentation question — one big network or many small ones — was settled by the same blast-radius logic as the account-segmentation rules from IAM practice: **many VPCs (per team/environment/tier), connected deliberately**, because the network boundary is a security and failure boundary, and flat networks make every compromise a lateral-movement playground. The connectivity pattern that scales is **hub-and-spoke**: a central transit layer (Transit Gateway-class on AWS, and its equivalents elsewhere — the mesh of point-to-point peerings collapses combinatorially past a dozen VPCs) carrying inter-VPC, hybrid, and egress traffic through inspectable central points. The design decisions inside that pattern: **route-table discipline as policy** (which spokes can reach which — the segmentation is only as real as the routes; dev spokes that can route to prod databases have a diagram, not a boundary), **centralized egress** (internet-bound traffic from spokes through inspected, NAT'd hub exit points — the egress-control chokepoint that the security architecture wants and the per-VPC-NAT bill argues for anyway), and **shared-services placement** (DNS resolvers, directory services, artifact registries, the operational tooling from DR practice — in their own spoke, reachable by policy, so that "the thing everyone needs" isn't replicated per-VPC or, worse, embedded in one team's network).

**Hybrid connectivity** rides the same hub: VPN as the starting tier and the backup path, dedicated circuits (Direct Connect-class) when bandwidth, latency consistency, or egress economics demand them — with the routing design (BGP, route propagation, failover behavior) *rehearsed*, because the hybrid link is exactly the kind of dependency whose failure mode is discovered during the incident that needed it.

## The private-connectivity toolkit: killing the public internet inside your architecture

The modern posture is that **service-to-service exposure is deliberately designed**: private endpoints (PrivateLink-class) putting cloud provider services and third-party SaaS on your private network (the data-exfiltration control that makes "our database is only reachable privately" literal — and increasingly the partner-integration pattern: expose your API to a customer's VPC as an endpoint, no internet transit, no IP allowlists), VPC endpoints for the storage-and-API tier (with the routing-and-policy details that make them *enforced* — the S3 endpoint policy that pins which buckets, closing the "exfiltrate to attacker's bucket over the private path" hole), and DNS as the glue that makes it usable — split-horizon zones resolving service names to private addresses inside the estate (the DNS-architecture disciplines, doing their quiet load-bearing work; most "private endpoint doesn't work" tickets are DNS tickets in costume).

What this toolkit retires: the bastion-and-allowlist archaeology, the "temporarily public" database, and most of the classic perimeter — replaced by identity-plus-private-path (the zero-trust direction), with the network layer as the defense-in-depth substrate underneath the IAM controls rather than the primary boundary itself.

## The economics: traffic has a topology-shaped bill

Cloud networking is priced in ways that make architecture decisions into invoices: **cross-AZ traffic is metered** (the chatty microservices spanning zones pay a coupling tax per request — topology-aware routing and zonal affinity for high-volume east-west paths are real money; the replication traffic of every data system is a standing line item), **cross-region is metered harder** (the multi-region designs from DR practice carry perpetual replication bills — priced into the tier choice, per the RTO/RPO framework), **NAT gateways bill per GB processed** (the centralized-egress design is partly a cost consolidation; the workload pushing terabytes through NAT to reach S3 is the classic finding — a VPC endpoint deletes that bill), and **egress to internet is the famous one** (the CDN tier and the compression disciplines are egress-bill engineering as much as performance work). The FinOps habit: traffic-flow visibility (flow logs aggregated into "who talks to whom, how much, across which billing boundary") reviewed alongside the capacity numbers — because network spend is the bill that architecture changes move most directly, and it's invisible until someone draws the flows.

The closing calibration: network design's payoff curve is the inverse of most cloud work — the effort is front-loaded (the IP plan, the hub topology, the endpoint-and-DNS plumbing) and the dividend is decades of *not thinking about it*: teams ship, VPCs stamp out from the IPAM plan, connections land without collisions, and the security and cost postures are properties of the topology rather than per-project negotiations. The estates that skipped the planning phase pay the inverse annuity — every integration a routing negotiation, every audit a flow-log archaeology, and someday, inevitably, the meeting about renumbering. Nobody enjoys that meeting.

## Make the operating contract explicit

Address planning is capacity planning with a difficult migration path. Reserve ranges for environments, regions, shared services and expected growth, and check them against existing corporate and partner networks. A range that is unique inside one cloud account may overlap a future VPN partner or an acquired business. Record the allocation authority and the process for resolving overlap before teams independently select convenient private ranges.

Routing and permission are different questions. A route can make a destination reachable while a firewall or security rule prevents the application flow. Conversely, an allowed security rule does not create a route or make DNS resolve correctly. Test the complete path: name resolution, route selection, security controls, address translation and the return route. Many apparent firewall incidents are asymmetric routing or name-resolution problems.

Private connectivity also has dependencies. A private endpoint often relies on DNS mapping that differs between cloud and on-premises clients. A network appliance can require symmetric flow through the same stateful device. A shared egress path can become a cost or availability constraint. Document these behaviors using a small set of permitted application flows rather than a diagram containing every network object.

## Work a packet path in both directions

Start with a concrete flow, such as an application subnet reaching a database through a private endpoint. Record the hostname, resolved address, source address and destination port. Then inspect the effective route from the application and the return route from the database side. If a network virtual appliance performs stateful inspection, verify that the same flow uses a supported symmetric path. A successful ping to a different destination is not evidence that the application flow works.

Keep address translation visible. The identity seen by a downstream firewall may be the translated source rather than the application's original address. A rule written for the wrong source can appear correct in the design document while denying every real connection. Conversely, a broad translated source range can make several applications indistinguishable to a downstream control. Decide whether the enforcement point has enough identity to express the intended policy.

DNS changes can alter the effective path without an obvious route-table change. A private service name might resolve to a public endpoint from an on-premises resolver and a private address from a cloud resolver. Document the zones, conditional forwarding and client locations involved. Test resolution during recovery as well as normal operation, especially when the resolver itself depends on the region or network being recovered.

Plan capacity around interfaces and allocation behavior. A cluster may consume addresses for nodes, Pods, load balancers or private endpoints depending on its network implementation. A rolling update can temporarily require more addresses than steady state. Reserve capacity for that transition and for a failure that shifts workload into another zone. The subnet worksheet should therefore include peak planned allocations, not just the number of application replicas currently running.

Avoid assuming that connectivity is transitive. Peering relationships generally need to be understood according to the provider's routing model; connecting one network to a hub does not automatically establish every desired spoke-to-spoke or on-premises route. Check the effective route and the supported gateway-transit or routing-appliance design. Document which team owns each side of the connection and who can change an advertised route.

Before adding a new connected network, perform an overlap check against the complete allocation register. Include partner networks and reserved future ranges. If overlap is unavoidable, document the translation or renumbering plan and its effects on DNS, logs and access rules. The operational cost of that exception belongs in the architecture decision, because it will recur whenever the connection is investigated or expanded.

Keep a small connectivity acceptance matrix with permitted and denied flows. The denied cases prove that the network boundary has not become broader than intended while fixing reachability.

Give each network exception an owner and a reason. A temporary route or broad access rule introduced during troubleshooting should be reviewed after the incident, with its continued need established before it becomes an undocumented dependency for future deployments and recovery procedures.

Record the reviewer, test date and remaining uncertainty alongside the decision.

## Work through an illustrative scenario

A fictional AWS VPC subnet uses an ordinary /24 IPv4 range. It contains 256 addresses, of which five are reserved by AWS in this standard case, leaving 251. Planned workloads use 160 addresses and interfaces for supporting services use 30, leaving 61 available. The plan therefore has 190 allocated or planned addresses, not 160. Provider-specific exceptions and other cloud address rules must be checked separately.

| Observation | Value (IPv4 addresses) |
| --- | ---: |
| Workload interfaces | 160 |
| Supporting interfaces | 30 |
| AWS reserved | 5 |
| Unallocated addresses | 61 |

**Calculation and limits.** Synthetic ordinary AWS /24 subnet: 256 total minus five reserved minus 160 workload and thirty supporting interfaces = 61 remaining. This is an allocation example, not a universal reservation rule across providers or BYOIP configurations.

## Build the evidence worksheet

**Address allocation.** Record the CIDR, parent allocation, environment and expected growth without overlapping another connected network.

**Flow identity.** Specify source, destination, protocol and port for a real application dependency.

**DNS answer.** Record the expected name resolution from each client location and the resolver path used.

**Forward route.** Identify the effective next hop, including any inspection or translation device.

**Return route.** Verify the response path and stateful appliance requirements rather than testing only outbound reachability.

**Capacity reserve.** Include infrastructure interfaces, failover capacity and growth in the remaining-address calculation.

## Rehearse the failure boundary

1. **Resolve from on-premises.** Compare the answer and route with a cloud-hosted client using the same application name.

2. **Add a partner range.** Detect overlap before establishing connectivity or advertising routes.

3. **Fail an inspection node.** Verify the documented routing and session behavior for the remaining path.

4. **Consume the planned reserve.** Observe allocation failures in a sandbox and update growth triggers before production exhaustion.

## Sources for the mechanisms

- [AWS subnet CIDR rules](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html)
- [Azure virtual-network peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)
