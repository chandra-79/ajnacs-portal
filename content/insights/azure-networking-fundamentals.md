---
title: "Azure Networking Architecture: VNets, Peering, and Private Endpoints at Enterprise Scale"
description: "Azure's networking model is powerful and complex. Virtual networks, peering, Private Endpoints, and hybrid connectivity each have specific behaviors that matter when designing for security and reliability."
date: 2025-11-24
tags: ["Cloud Architecture"]
format: article
---

Azure networking is one of the areas where "I'll figure it out as I go" produces expensive rework. The decisions made at the beginning — how VNets are structured, whether peering is hub-and-spoke or full mesh, which services use Private Endpoints — are difficult to change without downtime once workloads are running on top of them.

This article covers the design decisions that matter most for enterprise Azure networking architectures.

## Virtual network design

A VNet is an isolated network within Azure. Resources within a VNet can communicate with each other; communication between VNets requires explicit peering or transit. Each VNet has an address space (a CIDR block) that cannot overlap with peered VNets.

**Address space planning**: most organizations regret under-allocating address space. A /16 (65,536 addresses) per VNet is generous for most use cases and avoids the future pain of running out of IPs. If you are connecting Azure to on-premises networks, coordinate address spaces to avoid overlap — overlapping CIDRs make routing impossible.

**Subnet structure**: subnets within a VNet partition resources by function, security zone, or team. A common enterprise pattern:

```
10.0.0.0/16 (VNet)
├── 10.0.0.0/24  — GatewaySubnet (for VPN/ExpressRoute gateways)
├── 10.0.1.0/24  — AzureBastionSubnet (for secure VM access)
├── 10.0.2.0/23  — Application tier
├── 10.0.4.0/23  — Data tier (databases, storage endpoints)
└── 10.0.6.0/23  — Integration tier (API management, service bus)
```

Network Security Groups (NSGs) on subnets enforce traffic rules. Default: deny all between subnets; explicit allow rules for required traffic. This prevents lateral movement if a resource in one subnet is compromised.

## Hub-and-spoke topology

For organizations with multiple workload VNets, hub-and-spoke is the standard enterprise topology:

**Hub VNet**: shared services — VPN/ExpressRoute gateway, Azure Firewall, Bastion, centralized DNS. The hub is the single network entry and exit point.

**Spoke VNets**: individual workload VNets (one per application, team, or environment). Spokes peer to the hub; spokes do not peer to each other.

Traffic between spokes routes through the hub (via Azure Firewall or a network virtual appliance), enabling centralized inspection and logging.

```
On-premises → VPN Gateway (hub) → Azure Firewall (hub)
                                          ↓
                            ┌─────────────────────────┐
                            │  Spoke A   |   Spoke B   │
                            │ (Workload) | (Workload)  │
                            └─────────────────────────┘
```

VNet peering is non-transitive: if Spoke A peers with Hub, and Hub peers with Spoke B, Spoke A cannot reach Spoke B directly — only through the hub. This is intentional; the hub is the inspection point.

## Private Endpoints: the shift to private connectivity

Azure services (Storage, SQL Database, Key Vault, Service Bus, etc.) have public endpoints by default. A resource in your VNet accessing Azure Blob Storage traverses the public internet (Microsoft's backbone, but still public).

Private Endpoints create a network interface inside your VNet with a private IP, connected to a specific Azure service instance. Traffic to that endpoint stays entirely within the Azure network.

```
VNet (10.0.0.0/16)
└── Private Endpoint: 10.0.4.5 → mystorageaccount.blob.core.windows.net
```

After creating a Private Endpoint:
1. DNS resolution for the service FQDN returns the private IP within your VNet
2. Traffic never leaves the Azure backbone
3. The service's public endpoint can be disabled, denying all public access

For most Azure PaaS services in enterprise environments, Private Endpoints should be the default connectivity model. The security benefit (no public exposure) and compliance improvement (data never traverses public internet) justify the additional setup.

**Private DNS zones**: Private Endpoints require DNS to resolve FQDNs to private IPs within your network. Azure Private DNS zones (e.g., `privatelink.blob.core.windows.net`) integrate with your VNet to provide this resolution. In a hub-and-spoke model, DNS zones are deployed in the hub and linked to all spoke VNets.

## Hybrid connectivity options

**VPN Gateway**: encrypted tunnel over the public internet between on-premises and Azure. Maximum ~10 Gbps, variable latency depending on internet path. Suitable for most workloads.

**ExpressRoute**: dedicated private circuit between on-premises and Azure, typically provisioned through a connectivity provider. Guaranteed bandwidth (1-100 Gbps), predictable latency, no internet exposure. Required for workloads with strict latency requirements or large data transfer volumes, and often required for regulated industries.

**Azure Virtual WAN**: Microsoft-managed hub-and-spoke networking for large-scale, multi-region deployments. If you have 15+ VNets across 5+ regions, Azure VWAN simplifies the topology but introduces its own complexity. Worth evaluating for large organizations; premature for smaller deployments.

## Network security monitoring

Azure Network Watcher provides traffic analysis tools: NSG flow logs capture every accepted and denied connection, Connection Monitor tests connectivity between resources, and Packet Capture records network traffic for investigation.

NSG flow logs → Log Analytics → Network analytics workbook is a common pattern for centralized visibility into network traffic across the environment. Alerts on anomalous patterns (unusual egress volume, unexpected port scanning, unauthorized cross-environment traffic) are built from this data.

*Designing Azure networking architecture for a new environment or reviewing an existing topology for security and cost? [Happy to compare approaches for your specific scale and requirements.](/contact)*
