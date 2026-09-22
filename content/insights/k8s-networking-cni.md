---
title: "Kubernetes Networking: CNI Plugins, Network Policies, and Why It Matters for Security"
description: "Kubernetes networking is abstract by design, which means the security implications are often underappreciated. The CNI plugin, network policy implementation, and pod-to-pod communication model together determine what your cluster's security posture actually is."
date: 2026-01-07
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

Kubernetes networking has three layers that interact: the pod network (how pods communicate), service networking (how services are discovered and load-balanced), and the external network (how traffic enters and leaves the cluster). Understanding all three — and the CNI plugin that implements the pod network — is necessary for reasoning about cluster security.

## The default: no isolation

By default, every pod in a Kubernetes cluster can communicate with every other pod, across namespaces. There are no firewall rules between pods. A compromised pod in the `dev` namespace can reach pods in the `production` namespace on any port. This is the default, and it is not appropriate for most production environments.

Network Policies change this by defining allow-rules for pod-to-pod traffic. The default-deny-all policy, combined with explicit allow rules for required communication, is the correct posture for production clusters.

## Network Policies

Network Policies are Kubernetes resources that specify which traffic is allowed to or from a set of pods. They work at the IP and port level.

```yaml
## Default deny all ingress and egress for the production namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}  # Applies to all pods in the namespace
  policyTypes:
  - Ingress
  - Egress
---
## Allow the order service to receive traffic from the API gateway only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: order-service-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: order-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 8080
```

The critical detail: Network Policies are only enforced if the CNI plugin supports them. The default Kubernetes networking does not enforce Network Policies without a supporting CNI.

## CNI plugin selection

The Container Network Interface (CNI) plugin is the network implementation for your cluster. It provides pod networking (IP address assignment, routing) and, for some plugins, Network Policy enforcement.

**Flannel**: simple, widely used, only provides basic pod networking. Does not enforce Network Policies. Appropriate for development clusters where network segmentation is not required.

**Calico**: full-featured network plugin with Network Policy enforcement plus extended network policies (GlobalNetworkPolicy covering cluster-wide rules, policies that can reference hostnames and CIDR ranges). Strong performance. The default for many production Kubernetes deployments.

**Cilium**: eBPF-based networking. Instead of modifying iptables rules (as most CNIs do), Cilium uses eBPF programs loaded into the Linux kernel. Benefits: significantly better performance at scale, L7 policy (allow specific HTTP paths and methods, not just ports), identity-based policy (using Kubernetes labels, not just IPs). Increasingly common in large-scale production deployments.

**AWS VPC CNI** (for EKS): assigns VPC IP addresses directly to pods. Pods are on the VPC network, not an overlay network. Network policies require Calico or Cilium to be installed alongside the VPC CNI for enforcement.

For new clusters, Cilium is the forward-looking choice. For existing clusters with Calico, the upgrade is possible but non-trivial. The important thing is that whatever CNI you choose, verify it enforces Network Policies — this is not universally supported and is non-obvious from documentation.

## The east-west traffic concern

In a microservices cluster, most traffic is east-west: service-to-service within the cluster. This traffic is often unencrypted by default, even in production. A network-layer attacker (compromised node, misconfigured routing) can observe plain-text traffic between services.

Service meshes (Istio, Linkerd, Cilium's service mesh mode) address this with mutual TLS (mTLS): each service gets a cryptographic identity, and all service-to-service communication is encrypted and authenticated. The overhead is non-zero (latency, compute for TLS operations) but acceptable for most workloads and significant for security posture.

The alternative — application-level TLS on every service-to-service call — achieves the same security outcome but requires explicit TLS configuration in every service. Service meshes make this automatic.

## DNS-based communication and its security implications

Services in Kubernetes are reached by DNS names (`order-service.production.svc.cluster.local`). The cluster DNS resolver (CoreDNS) answers these queries. A compromised pod could attempt DNS poisoning or query internal service names to enumerate the cluster topology.

Network policies can restrict DNS egress to CoreDNS only:

```yaml
## Allow DNS to CoreDNS, nothing else, for production pods
egress:
- to:
  - namespaceSelector:
      matchLabels:
        kubernetes.io/metadata.name: kube-system
  ports:
  - protocol: UDP
    port: 53
```

This prevents pods from making arbitrary external DNS queries and limits DNS exposure to the cluster-internal resolver.

*Reviewing Kubernetes network security or selecting a CNI for a new cluster? The security requirements should drive the CNI selection. [Happy to compare options for your specific deployment environment.](/contact)*
