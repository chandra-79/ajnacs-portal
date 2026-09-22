---
title: "Linux Networking from the Ground Up: TCP/IP, Sockets, and Production Diagnostics"
description: "How the Linux network stack works, what happens between your application making a network call and bytes leaving the NIC, and the diagnostic tools that reveal what is actually happening on the wire."
date: 2026-06-19
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

## Connect (TCP three-way handshake happens here)
sock.connect(("httpbin.org", 80))

## Send data (kernel handles fragmentation into TCP segments)
sock.sendall(b"GET /get HTTP/1.1\r\nHost: httpbin.org\r\n\r\n")

## Receive data (kernel reassembles TCP segments)
response = sock.recv(4096)

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
- `TIME_WAIT`: connection closed, waiting to ensure the other side received the FIN (normal, but excessive TIME_WAIT indicates high connection turnover)
- `CLOSE_WAIT`: the remote side closed the connection but your application has not called `close()` yet (often a bug — leaked socket)

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
ss -tupna state time-wait | wc -l   # how many TIME_WAIT
ss -tupna state close-wait | wc -l  # how many CLOSE_WAIT (should be near zero)
```

## DNS: Before the Connection

Most connection problems start with DNS. The DNS resolution happens before the TCP connection — your application resolves the hostname to an IP address, then connects to the IP.

```bash
## Diagnose DNS resolution
dig api.service.internal
nslookup api.service.internal

## Test with a specific DNS server
dig @8.8.8.8 api.service.internal

## Time the resolution
time dig api.service.internal

## What DNS server is this machine using?
cat /etc/resolv.conf

## Trace the full resolution path
dig +trace api.service.internal
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

**Connection timeouts that do not match application config**: the application timeout is at the socket level. If the network drops packets silently (no RST, no FIN), the kernel's TCP retransmission timer fires — with a default that can be 90+ seconds on Linux, regardless of the application-level timeout. Fix: set `TCP_KEEPALIVE` or use application-level heartbeats.

**High TIME_WAIT counts**: each closed TCP connection enters TIME_WAIT for 2×MSL (typically 120 seconds on Linux). A service making thousands of short-lived outbound connections to the same endpoint will accumulate TIME_WAIT entries. Fix: enable connection pooling in your HTTP client, or enable `SO_REUSEPORT`.

**DNS negative caching**: a failed DNS lookup is cached as a negative result. If a service is temporarily unavailable and the client receives NXDOMAIN, it may cache that failure for the TTL and continue failing after the service recovers. Fix: set appropriate TTLs, use exponential backoff with jitter on retry.

The engineer who knows these patterns and these tools can diagnose most network issues from within the affected system without needing a network engineer in the conversation.
