---
title: "Linux Networking from the Ground Up: TCP/IP, Sockets, and Production Diagnostics"
description: "How the Linux network stack works, what happens between your application making a network call and bytes leaving the NIC, and the diagnostic tools that reveal what is actually happening on the wire."
date: 2028-05-05
tags: ["Programming", "Fundamentals"]
series: "Operating Systems for Engineers"
seriesOrder: 5
format: article
---

Network issues are among the most common and most frustrating production problems. Latency spikes with no obvious cause, connection timeouts that do not match the application timeout configuration, packet loss that only appears under load. The engineers who diagnose these quickly are the ones who understand what happens between your application making a network call and bytes leaving the network interface. This lesson covers that path.

## The Network Stack: Four Layers in Practice

The OSI model has seven layers. In practice, Linux networking operates across four:

| Layer | What It Does | Linux Implementation |
|---|---|---|
| Application | HTTP, gRPC, DNS, SSH | Your program, plus libraries |
| Transport | TCP/UDP — reliability, ports, flow control | Linux kernel TCP/UDP stack |
| Network | IP addressing and routing | Linux kernel IP stack |
| Link | Ethernet frames, MAC addresses, physical transmission | NIC driver |

When your program calls `socket.connect(("api.service.internal", 443))`, all four layers are involved in getting that connection established.

## Sockets: The Kernel's Network API

A socket is a file descriptor — an integer your program uses to refer to a network connection. The kernel manages the actual connection state.

```python
import socket

## Create a TCP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(5)  # bounded teaching example

## Connect (TCP three-way handshake happens here)
sock.connect(("httpbin.org", 80))

## Send data (kernel handles fragmentation into TCP segments)
sock.sendall(b"GET /get HTTP/1.1\r\nHost: httpbin.org\r\n\r\n")

## Receive data (kernel reassembles TCP segments)
response = sock.recv(4096)  # demonstration only: may be a partial response

sock.close()   # TCP FIN sequence
```

The kernel, not your program, manages:
- TCP three-way handshake (SYN → SYN-ACK → ACK)
- Segment ordering and reassembly
- Retransmission of lost packets
- Flow control (not overwhelming the receiver)
- Congestion control (not overwhelming the network)

## TCP Connection States

A TCP connection progresses through states. Understanding these states is essential for diagnosing connection problems:

```
CLOSED → SYN_SENT → ESTABLISHED → FIN_WAIT_1 → FIN_WAIT_2 → TIME_WAIT → CLOSED
                 ↑ Server side:
           LISTEN → SYN_RECEIVED → ESTABLISHED → CLOSE_WAIT → LAST_ACK → CLOSED
```

**Key states to know**:
- `LISTEN`: server socket waiting for connections (normal)
- `ESTABLISHED`: active connection in progress (normal)
- `TIME_WAIT`: a closing endpoint retains state to handle retransmitted termination segments and prevent delayed old segments being mistaken for a new connection; duration and prevalence need workload context
- `CLOSE_WAIT`: the peer has finished sending and the local endpoint has not finished its close sequence. Brief instances can be normal; persistent accumulation merits investigation

```bash
## Count connections by state
ss -s
netstat -s | grep -E "active|passive|failed"

## Show all TCP connections with process information
ss -tupna
## or
netstat -tupna   # older but widely available

## Filter by state
ss -tupna state established
ss -Htan state time-wait | wc -l   # TCP rows, omitting the header
ss -Htan state close-wait | wc -l  # inspect persistence and ownership
```

## DNS: Before the Connection

DNS resolution is one possible failure stage to investigate. The DNS resolution happens before the TCP connection — your application resolves the hostname to an IP address, then connects to the IP.

```bash
## Diagnose DNS resolution
dig api.service.internal
nslookup api.service.internal

## Test with a specific DNS server
dig @<approved-resolver-address> api.service.internal

## Time the resolution
time dig api.service.internal

## What DNS server is this machine using?
cat /etc/resolv.conf

## Trace the full resolution path
dig +trace example.com  # public DNS exercise, not internal split-horizon DNS
```

## Production Diagnostic Toolkit

```bash
## Is the remote port open and accepting connections?
nc -zv hostname 443
telnet hostname 443   # older; works without netcat

## Measure round-trip time (ICMP — may be blocked by firewalls)
ping -c 10 hostname

## Trace the network path, showing each hop's latency
traceroute hostname
mtr hostname          # continuous traceroute — much more useful

## Capture actual packets (requires root or CAP_NET_RAW)
tcpdump -i eth0 host hostname
tcpdump -i eth0 port 443
tcpdump -i eth0 -w capture.pcap   # save for Wireshark analysis

## Show current bandwidth usage per connection
nethogs
iftop

## Show socket buffer statistics, retransmits, errors
ss -memni
cat /proc/net/dev   # per-interface packet/error counts
```

## Common Network Patterns in Cloud Environments

**Timeouts that do not match expectations**: a client library may have separate connection, pool, read and total-operation limits. Kernel retransmission behaviour does not replace those limits. Verify which stage the configured timeout covers and test cancellation and cleanup.

**High TIME_WAIT counts**: TIME_WAIT normally protects a closed connection from delayed segments and supports reliable termination. Which endpoint enters it depends on the close sequence. Investigate connection turnover and pool reuse; do not use `SO_REUSEPORT` as an outbound TIME_WAIT fix.

**DNS negative caching**: a failed DNS lookup is cached as a negative result. If a service is temporarily unavailable and the client receives NXDOMAIN, it may cache that failure for the TTL and continue failing after the service recovers. Fix: set appropriate TTLs, use exponential backoff with jitter on retry.

The engineer who knows these patterns and these tools can diagnose most network issues from within the affected system without needing a network engineer in the conversation.

## Measure the stages separately

A client operation can include name resolution, waiting for a connection-pool slot, TCP connection establishment, TLS negotiation, request transmission, server processing, and response reading. One aggregate timeout does not reveal which stage consumed the budget. Instrument stage boundaries where the client library supports them and retain the request's overall deadline.

For a hypothetical fresh HTTPS request, assume 8 milliseconds for DNS, 24 for TCP connection, 32 for TLS, 90 for waiting on the server response, and 6 for reading the body. These serial intervals total 160 milliseconds. The chart displays that invented breakdown. It is not a network benchmark, and it excludes overlap, retries, proxy stages, and connection-pool waiting.

Reusing a healthy connection may avoid some establishment work, but it does not eliminate server latency. Under the simplified model, the response wait is 90/160, or 56.25% of total time. An investigation focused only on DNS would miss the largest assumed component. Conversely, a real request with a long pool wait could be slow before it sends a packet at all.

## TCP gives a byte stream, not message boundaries

A call to send application bytes does not imply one network packet or one receive call at the peer. TCP can split and combine data while preserving stream ordering. A single `recv(4096)` may return part of a response, and an HTTP response may exceed 4,096 bytes. Production clients need protocol-aware framing and bounded reads, usually through a mature library.

Transport delivery also does not prove application completion. The peer's kernel can acknowledge bytes before the application commits a transaction. If the client loses the response after a payment-like operation, retrying without an idempotency contract can repeat the effect. Networking diagnostics and business recovery semantics must therefore be connected.

Half-closed connections deserve care. Receiving an end-of-stream means the peer has finished sending on that direction; it does not automatically mean every local operation should be abandoned. The protocol determines whether a response is still due. Persistent `CLOSE_WAIT` can indicate missing application cleanup, but inspect duration and ownership rather than treating every brief instance as a leak.

## Use deadlines and keepalives for different purposes

A deadline bounds how long the caller is willing to wait for an operation. TCP keepalive can help detect an otherwise idle broken connection under its configured timing. Application heartbeats can test a higher-level peer's responsiveness. These mechanisms answer different questions; enabling keepalive is not a substitute for a request deadline.

Set connection, pool-acquisition, and read/write limits according to the library's semantics, then enforce the total operation budget. Propagate cancellation where supported and make cleanup release connections. A sequence of individually acceptable stages can still exceed an end-to-end deadline. Retrying also consumes that deadline and can amplify load during an outage.

`SO_REUSEPORT` concerns binding multiple sockets to a local address and port under supported conditions. It is not a general solution to outbound connection churn or TIME_WAIT accumulation. Investigate connection reuse, pool limits, destination patterns, ephemeral-port usage, and proxy behaviour before altering kernel settings. A large TIME_WAIT count can be normal for the workload.

## A local diagnostic lab

Run a small test server on loopback or in an isolated network namespace. Use synthetic payloads and explicit timeouts. Measure a successful request, a refused connection to an unused local port, and a server that accepts a connection but deliberately delays its response. Compare the exception and elapsed time in each case. These scenarios separate connection establishment from application response delay without targeting a public service.

Inspect sockets during the delayed case and identify the owning process. Capture only the local test traffic if packet inspection is needed, with a narrow filter and short duration. Packet captures can contain credentials and personal data; use synthetic content and retain only the evidence necessary for the exercise. An encrypted capture can still reveal timing and connection metadata without exposing application plaintext.

For DNS, compare the resolver actually used by the application with a direct diagnostic query. Search domains, local caches, split-horizon configuration, and library behaviour can differ. Sending an internal hostname to a public resolver may both fail to reproduce the issue and disclose an internal name. Use the approved resolver for the environment.

Write the incident finding as a falsifiable statement: requests waited in the local connection pool, the peer accepted TCP but delayed the response, or resolution returned a cached negative result. Include timestamps, the affected address family, client configuration, and relevant limits. This is stronger evidence than describing the network as slow, and it gives application and network owners a shared starting point.

## Further reading and source boundaries

- [Linux manual: TCP](https://man7.org/linux/man-pages/man7/tcp.7.html)
- [Linux manual: socket options](https://man7.org/linux/man-pages/man7/socket.7.html)
- [RFC 9293: TCP specification](https://www.rfc-editor.org/rfc/rfc9293.html)
- [RFC 2308: negative DNS caching](https://www.rfc-editor.org/rfc/rfc2308.html)
