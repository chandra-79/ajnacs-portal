---
title: "Azure Networking Architecture: VNets, Peering, and Private Endpoints at Enterprise Scale"
description: "Azure's networking model is powerful and complex. Virtual networks, peering, Private Endpoints, and hybrid connectivity each have specific behaviors that matter when designing for security and reliability."
date: 2027-02-17
tags: ["Cloud Architecture"]
format: article
---

Azure networking is one of the areas where "I'll figure it out as I go" produces expensive rework. The decisions made at the beginning — how VNets are structured, whether peering is hub-and-spoke or full mesh, which services use Private Endpoints — are difficult to change without downtime once workloads are running on top of them.

This article covers the design decisions that matter most for enterprise Azure networking architectures.

## Virtual network design

A VNet is an isolated network within Azure. Resources within a VNet can communicate with each other; communication between VNets requires explicit peering or transit. Each VNet has an address space (a CIDR block) that cannot overlap with peered VNets.

**Address space planning**: most organizations regret under-allocating address space. Choose VNet and subnet sizes from workload growth, service requirements and connected address space. A /16 contains 65,536 IPv4 addresses but is not a universal recommendation for each VNet. If you are connecting Azure to on-premises networks, coordinate address spaces to avoid overlap — overlapping CIDRs prevent straightforward peering and unambiguous routing; selected translation designs can address some hybrid cases with additional constraints.

**Subnet structure**: subnets within a VNet partition resources by function, security zone, or team. A common enterprise pattern:

| Segment | Illustrative range | Purpose |
| --- | --- | --- |
| Gateway | 10.0.0.0/24 | Dedicated gateway subnet |
| Bastion | 10.0.1.0/24 | Dedicated access service subnet |
| Application | 10.0.2.0/23 | Application addresses |
| Data | 10.0.4.0/23 | Data services and endpoints |
| Integration | 10.0.6.0/23 | Integration workload addresses |

These ranges are illustrative; validate each service's current dedicated-subnet requirements and sizing.

Network Security Groups (NSGs) on subnets enforce traffic rules. Azure NSG defaults include virtual-network allowances. Implement explicit rules with appropriate priorities for the intended segmentation, then test allowed and denied paths; network rules alone do not eliminate all lateral-movement paths.

## Hub-and-spoke topology

For organizations with multiple workload VNets, hub-and-spoke is the standard enterprise topology:

**Hub VNet**: shared services — VPN/ExpressRoute gateway, Azure Firewall, Bastion, centralized DNS. The hub is the single network entry and exit point.

**Spoke VNets**: individual workload VNets (one per application, team, or environment). Spokes peer to the hub; spokes do not peer to each other.

Traffic can be routed through a hub appliance for inspection when user-defined routes, forwarding and the return path are configured appropriately. Hub peering alone does not create that transit behavior.

The intended inspected path is on-premises connectivity to the hub, then an explicitly configured firewall or appliance route to the destination spoke. Peering alone does not establish that path.

VNet peering is non-transitive: if Spoke A peers with Hub, and Hub peers with Spoke B, Spoke A does not gain a route to Spoke B merely because both peer with the hub. Transit requires a separately configured gateway, appliance or routing design; inspection is not automatic.

## Private Endpoints: the shift to private connectivity

Azure services (Storage, SQL Database, Key Vault, Service Bus, etc.) have public endpoints by default. A public service endpoint is publicly addressed, but that does not mean Azure-to-Azure traffic necessarily traverses the public internet. Distinguish addressing, backbone routing and access policy.

Private Endpoints create a network interface inside your VNet with a private IP, connected to a specific Azure service instance. Traffic to that endpoint stays entirely within the Azure network.

For example, a private endpoint at `10.0.4.5` can provide a private connection to a particular storage-service resource when DNS and access settings are configured correctly.

After creating a Private Endpoint:
1. Configure appropriate DNS integration so intended clients resolve the service name to the private endpoint address
2. Traffic never leaves the Azure backbone
3. The service's public endpoint can be disabled, denying all public access

Evaluate Private Endpoints against the service threat model and connectivity requirements. They provide a private path, while public access settings, authentication, DNS and operational complexity require separate decisions; the feature alone does not establish compliance.

**Private DNS zones**: Private Endpoints require DNS to resolve FQDNs to private IPs within your network. Azure Private DNS zones (e.g., `privatelink.blob.core.windows.net`) integrate with your VNet to provide this resolution. In a hub-and-spoke model, DNS zones are deployed in the hub and linked to all spoke VNets.

## Hybrid connectivity options

**VPN Gateway**: encrypted tunnel over the public internet between on-premises and Azure. Throughput and features depend on the selected gateway SKU and configuration; latency depends on the network path. Validate the actual workload and redundancy requirements.

**ExpressRoute**: dedicated private circuit between on-premises and Azure, typically provisioned through a connectivity provider. Available bandwidth and redundancy depend on the circuit and connectivity design. Assess measured latency, resilience, provider connectivity and obligations; ExpressRoute is not a universal regulatory requirement or application-latency guarantee.

**Azure Virtual WAN**: Microsoft-managed hub-and-spoke networking for large-scale, multi-region deployments. Evaluate it when managed transit and branch connectivity fit the topology. There is no universal VNet or region count at which it becomes the right choice.

## Network security monitoring

Azure Network Watcher provides connectivity, capture and flow-visibility capabilities with feature-specific coverage. For new flow logging designs, use current virtual-network flow-log guidance; NSG flow logs have a published retirement path and no longer support new creation.

Design flow-log collection, storage and analysis using the currently supported virtual-network logging path and verify its scope and retention. Alerts on anomalous patterns (unusual egress volume, unexpected port scanning, unauthorized cross-environment traffic) are built from this data.

*Designing Azure networking architecture for a new environment or reviewing an existing topology for security and cost? [Happy to compare approaches for your specific scale and requirements.](/contact)*

## Separate DNS, routing and authorization evidence

A private address is only one part of a working connection. The client must resolve the intended service name, have a valid route, pass network controls, negotiate the protocol and present an authorized identity. Testing those layers separately prevents a DNS issue from being misdiagnosed as a permission problem or an application denial from being “fixed” by opening a subnet.

For a hypothetical connectivity inventory, define 20 required client-to-service paths. Twelve pass every check, four resolve to an unintended endpoint, three fail routing or network policy, and one reaches the service but lacks data-plane authorization. This produces an eight-path repair queue. It is a selected test inventory, not a sample from which production availability can be estimated.

Classify each path by its first failing layer. A path with incorrect DNS and missing permissions remains in the DNS category until resolution is corrected. Re-run all checks afterward, because repairing one layer may reveal another fault. Keep the source environment, resolver, identity and observation time with every result.

## Create a flow-specific worksheet

For each required connection, record source, destination FQDN, expected IP class, port, protocol, runtime identity, route and expected result. Include denied connections, such as a development identity attempting a production database operation. Successful paths alone do not prove segmentation.

Resolve the name from the actual client location, including on-premises resolvers where relevant. Inspect the CNAME chain and returned address. DNS resolution does not grant access, and creating a private endpoint does not guarantee every resolver returns its private address. Private zones, links and forwarding need to match the topology. Test a client intended to use the private path and an unauthorized public client separately.

Inspect effective routes and network-security rules. Azure's default NSG rules include virtual-network allowances; a deny-by-default segmentation design requires appropriate explicit rules and priorities. Rules may apply at both the subnet and interface. For traffic through an appliance, verify forwarding and the return route. An asymmetric path can fail even when the outbound route appears correct.

## Plan addresses around service requirements

An IPv4 /24 contains 256 addresses before platform reservations. Capacity planning must account for Azure's reserved addresses and the selected service's additional requirements. Managed services, upgrades and scale-out can consume more addresses than the initial deployment. Assigning a /16 to every workload by habit can waste space or make future hybrid connectivity difficult.

Create an allocation register that covers all connected networks, ownership and growth assumptions. For a disposable subnet, list each consumer and its expected maintenance and scaling needs before deploying. Check the current service-specific constraints, because some services require dedicated subnets or particular minimum sizes. Overlap prevents straightforward peering and routing; translation can support selected scenarios but is not an automatic remedy for every collision.

## Rehearse a private endpoint transition

Use a disposable service containing synthetic data. Establish its current connectivity behavior, create the private path using Microsoft's current procedure and configure DNS integration. Then test from each authorized network. Separately change public-network access and verify denial from an unauthorized source. Keep service authentication and authorization enabled throughout; private networking does not replace them.

Observe client DNS caching and existing connections during the change. Record how reconnects behave, and prepare rollback for records, links, routes and access settings. Do not delete a shared DNS zone to repair one workload without identifying its other consumers. A successful connection from one VM is insufficient evidence for a hybrid estate using different resolvers.

For operational visibility, use current virtual-network flow logging guidance. NSG flow logs have a published retirement path and no longer support new creation, so a new design should not adopt that legacy feature. Flow evidence, connectivity probes and application logs answer different questions. Correlate them to a specific symptom and configuration change instead of treating a flow record as proof that the business transaction completed correctly.

Select VPN, ExpressRoute or managed transit against measured bandwidth, latency, redundancy and cost requirements. A private circuit is not automatically a regulatory requirement or an application latency guarantee. Include provider connectivity and failover behavior in the design, and rehearse the loss of one path where the environment permits. The useful output is an explainable and testable connection contract for each workload.

Retain resolver configuration, effective routes and denied-path evidence with the design. A later network change should identify which previously verified connections need retesting and which workload owner approves the resulting access boundary.

| Observation | Value (paths) |
| --- | ---: |
| All checks pass | 12 |
| DNS mismatch | 4 |
| Route or policy | 3 |
| Authorization | 1 |

**Figure method.** Synthetic 20-path inventory: 12+4+3+1=20. Classification uses the first failing layer; retest after repair. This inventory does not estimate production availability.

## Further reading

- [Azure NSG behavior](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [Private endpoint DNS](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns)
- [VNet peering](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview)
- [NSG flow-log retirement](https://learn.microsoft.com/en-us/azure/network-watcher/nsg-flow-logs-overview)
