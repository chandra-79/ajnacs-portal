# Turn an MTU into a payload budget
@lesson mtu-payload-budget | Separate packet size from useful application bytes and account for the headers added at each layer.
@chart Maximum TCP payload in the example | bytes
@value IPv4 with 1,500 MTU | 1460
@value IPv6 with 1,500 MTU | 1440
@value IPv4 with 1,450 MTU | 1410
@match mtu | packet | ethernet | tunnel | encapsulation | tcp | overlay
@source RFC 894 · Transmission of IP datagrams over Ethernet | https://www.rfc-editor.org/rfc/rfc894
@source RFC 9293 · Transmission Control Protocol | https://www.rfc-editor.org/rfc/rfc9293
@source RFC 8200 · Internet Protocol Version 6 | https://www.rfc-editor.org/rfc/rfc8200

## Budget from the network layer

A 1,500-byte IP MTU includes the IP header. With a minimum 20-byte IPv4 header and a minimum 20-byte TCP header, 1,460 bytes remain. The 40-byte base IPv6 header leaves 1,440 bytes before extension headers. If an overlay allows a 1,450-byte effective IPv4 MTU, the corresponding budget is 1,410 bytes. These are TCP payload ceilings under the stated headers. Application bytes can be lower after TLS or another framing layer.

## Find the governing interface

Record both endpoints, the packet layer being counted, and the narrowest path MTU. Work from the effective MTU seen by the workload rather than subtracting the same tunnel overhead twice. TCP options, IPv6 extension headers, and encryption can change the resulting payload. Verify with an authorized test across the actual route and capture the size at the relevant interface. Offloads can make an OS capture look larger than the packets transmitted on the wire.

Keep a known small request and a representative large transfer in the same test. A healthy small exchange does not exclude a path-MTU problem. Look for repeated retransmissions and compare the observed packet sizes before changing the interface or workload defaults.

## Limits of the example

The example uses minimum headers, no TCP options, and assumed effective MTUs. It is not a throughput prediction. Confirm tunneling, fragmentation behavior, and negotiated segment sizes in the actual environment.

# Verify a workload isolation policy with a traffic matrix
@lesson network-policy-verification | Test allowed and denied connections from dedicated test workloads before promoting a Kubernetes policy.
@chart Outcomes in a 12-probe policy test | probes
@value Expected allows seen | 5
@value Expected denials seen | 6
@value Unexpected success | 1
@match network policy | networkpolicy | namespace | cni | isolation | ingress | egress
@source Kubernetes · Network Policies | https://kubernetes.io/docs/concepts/services-networking/network-policies/

## Convert policy into observable outcomes

List the expected source namespace, pod labels, destination, protocol, port, and direction. Create a small matrix for necessary application traffic, name resolution, metrics, and explicitly unwanted paths. Test only against workloads and endpoints you control. Run the same matrix before and after policy changes. Kubernetes NetworkPolicy behavior depends on the installed networking plugin implementing it.

## Investigate the unexpected success

In the example, five paths should allow traffic and seven should deny it. The test sees the five allows, six denials, and one unexpected success. A single positive smoke test would have missed the policy gap. Inspect both egress and ingress policies selecting the endpoints. Within each direction, matching policy permissions are additive. A broad allow in a separate policy can defeat a narrowly written intent. Select both namespace and pod in the same selector entry when both restrictions are intended.

Distinguish a transport failure from a genuine deny. An unready service can fail even without isolation. Confirm connectivity from an expected authorized test source before treating timeouts as policy results. After policy changes, use new connections and allow enforcement to converge.

## Limits of the example

The 12 probes are illustrative. Test representative protocols, service IP translation, DNS, and pod restart behavior for your plugin. Keep a rollback plan and record policy and plugin versions so another engineer can repeat the verification.

# Compare collective communication with the right bandwidth metric
@lesson allreduce-bandwidth-budget | Calculate algorithm and bus bandwidth for AllReduce and test whether it explains end-to-end training time.
@chart Two bandwidth views for the same run | GB/s
@value Algorithm bandwidth | 25
@value Bus bandwidth, 8 ranks | 43.75
@match allreduce | all reduce | collective | rdma | fabric | hpc | gpu
@source NVIDIA NCCL Tests · Performance calculations | https://github.com/NVIDIA/nccl-tests/blob/master/doc/PERFORMANCE.md

## Separate the reported rates

Suppose an AllReduce operates on a logical 2 GB tensor in 80 ms on eight ranks. Algorithm bandwidth is 2 ÷ 0.08 = 25 GB/s. NCCL Tests calculates AllReduce bus bandwidth by multiplying by 2 × (N − 1) ÷ N. With eight ranks that factor is 1.75, so the corresponding bus bandwidth is 43.75 GB/s. It represents a normalized view of the collective data movement. It is not a direct observation of bytes on a particular switch port.

## Test whether communication is the limiter

Run the same tensor sizes and rank counts across the same placement. Record end-to-end iteration time and the overlap between compute and communication. A faster collective may not speed up training if it was already hidden behind compute. Test small messages, where latency may dominate, and large messages, where throughput may dominate. Compare decimal GB/s and binary GiB/s only after conversion.

Validate which links carry traffic and how many directions or planes are in use before comparing normalized bus bandwidth to a link-rate ceiling. Investigate variation across ranks and time windows. A single fastest run conceals expensive pauses or unstable scheduling.

## Limits of the example

This example is arithmetic with assumed size and duration, not a vendor benchmark. Different collective operations use different normalization factors. A change in model parallelism or placement can change data movement independently of network capacity.
