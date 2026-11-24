---
title: "Kubernetes Networking: CNI Plugins, Network Policies, and Why It Matters for Security"
description: "Kubernetes networking is abstract by design, which means the security implications are often underappreciated. The CNI plugin, network policy implementation, and pod-to-pod communication model together determine what your cluster's security posture actually is."
date: 2025-05-12
tags: ["DevSecOps", "Cloud Architecture"]
format: article
---

Kubernetes networking has three layers that interact: the pod network (how pods communicate), service networking (how services are discovered and load-balanced), and the external network (how traffic enters and leaves the cluster). Understanding all three — and the CNI plugin that implements the pod network — is necessary for reasoning about cluster security.

## What to measure

**Cross-node overhead at matched policy.** Run same-node and cross-node requests with identical payload, policies and offered rate. If cross-node p95 is 5 ms versus 3 ms locally, the observed difference is 2 ms. Repeat with policy changes one at a time and check packet drops and CPU cost.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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

**Calico** enforces Kubernetes NetworkPolicy and offers extended policy resources. Domain-based egress allow rules are a feature of Calico Enterprise and Cloud. Review the [selected product’s policy documentation](https://docs.tigera.io/calico-enterprise/latest/network-policy/domain-based-policy) and test the intended traffic matrix.

**Cilium**: eBPF-based networking. Instead of modifying iptables rules (as most CNIs do), Cilium uses eBPF programs loaded into the Linux kernel. Benefits: measure performance for the selected datapath, configuration, workload and cluster version, L7 policy (allow specific HTTP paths and methods, not just ports), identity-based policy (using Kubernetes labels, not just IPs). Increasingly common in large-scale production deployments.

**AWS VPC CNI** gives EKS Pods VPC addresses. Supported versions and configurations can enforce Kubernetes network policies natively. Confirm network policy is enabled for the nodes and workloads you are testing using the [EKS network policy guide](https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html).

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

This restricts direct egress to the matching resolver and allowed protocol when the implementation enforces the policy. The resolver may forward queries for external names. Match the actual resolver location and account for TCP DNS where the resolver and workload require it.

*Reviewing Kubernetes network security or selecting a CNI for a new cluster? The security requirements should drive the CNI selection. [Happy to compare options for your specific deployment environment.](/contact/)*

## Start with a flow inventory your application owner recognizes

Model actual requests instead of starting with pod addresses. For each caller and receiver, identify its workload labels, namespace, serving port, transport, and the user journey that needs the connection. Separate internal calls through a Service from incoming traffic through the gateway and outbound traffic to managed services. Include workload startup and background tasks. A service can answer a health probe while a queue worker remains unable to resolve its broker. Ask which parts of the workflow someone would notice if a connection stopped working and which team would restore it.

Pod policy is directional. Test both the sending workload's egress and the receiver's ingress when both are isolated. Standard policy allow rules are additive within a direction. A more narrowly written policy does not subtract permission that a different selected policy already allows. In a peer, a namespace selector and a pod selector in the same list entry select their intersection. If expressed as separate entries, they allow the union. The API gateway example above uses only the pod selector, so it selects source Pods in the policy's namespace. Use both selectors together when allowing a specific gateway in a separate namespace. Verify the labels rather than assuming the namespace name is automatically a label with your preferred key. See the [Kubernetes Network Policies reference](https://kubernetes.io/docs/concepts/services-networking/network-policies/).

## Validate positive and negative cases from controlled workloads

Build a small test matrix in an environment your team owns. An illustrative order service might require one inbound gateway path, two outbound dependency paths, and two name resolution checks for different transports. Add a denied path from a separate approved test identity, a denied destination port, and a denied direct dependency that is unnecessary. Record expected and observed results. In a five-required and three-denied exercise, six or seven correct results out of eight is still a failed policy verification. If a denial coincides with an unavailable endpoint, repeat the test against a healthy fixture to distinguish lack of reachability from lack of service.

Test name resolution through the resolver actually configured in the Pod. TCP can matter alongside UDP. An allow rule for UDP port 53 to any Pod in the system namespace neither identifies the resolver precisely nor limits which names that resolver answers. Some environments use a node-local resolver or other arrangements with distinct policy semantics. Inspect the runtime configuration before restricting DNS. If the requirement is to filter external domains, check for a supported control at the DNS layer or a provider-specific policy feature and test it independently. Standard NetworkPolicy selection by labels and addresses does not filter the DNS query content.

## Locate failure before changing the policy

If a request breaks, compare four observations under the same workload and timing. Establish whether the source resolves the target name, whether the Service maps to ready endpoints, whether the correct identities communicate at the expected port, and whether the application accepts the request. Distinguish a gateway rejection, a policy denial, and an application authentication failure. When service address translation is involved, verify behavior on the installed implementation. The NetworkPolicy specification does not guarantee the same results for all combinations of source or destination rewriting. Changing several policy rules before finding the failed boundary makes the result difficult to explain.

For latency tests, measure comparable same-node and cross-node calls across multiple node pairs. Preserve request size, concurrency, endpoint count, and whether encryption or a proxy added to the path. If a fictional test shows p95 of 2 ms inside a node and 5 ms across nodes, repeat the test while changing only the path feature you suspect. Compare throughput, packet loss, CPU, and connection setup. A three-millisecond difference measured at p95 across different request samples does not establish where the time was spent on any individual request.

## Verify an upgrade as a change to the runtime contract

Version the permitted flow inventory and keep a repeatable test namespace created by the same automation as application namespaces. Exercise bootstrap, DNS, rolling replacement, node changes, and egress to a managed service under the candidate implementation. Keep expected enforcement as a release gate. A packet path can remain usable while a policy becomes ineffective, so a health check that covers only success paths is not enough. Document the cleanup and recovery path if an upgrade affects both application traffic and the platform that installs network rules.

Confirm service-to-service encryption separately from the traffic allow matrix. Where a service mesh operates in permissive mode, some paths may still accept plaintext. Verify both the participating workloads and the listener policy using known test clients. If application TLS is in use, verify how callers authenticate peers and how the team rotates certificates. Apply the appropriate controls for names, reachability, and authentication, and capture separate evidence for each property.
