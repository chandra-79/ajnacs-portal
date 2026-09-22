---
title: "Network Performance Tools on Linux"
description: "Using ss, tcpdump, iperf3, and nethogs to diagnose TCP connection states, capture packets, measure bandwidth, and find which process is consuming the network."
date: 2026-08-24
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 18
format: article
---

Network performance problems in production fall into a small number of categories: bandwidth saturation, connection proliferation, packet loss, high retransmission rates, and latency. Each has a different tool and a different fix. Trying to diagnose them without understanding TCP state machines and the Linux networking stack leads to guesswork.

## ss — the socket statistics tool

`ss` replaced `netstat`. It is faster (reads directly from kernel memory), more detailed, and capable of filtering.

```bash
## All listening sockets
ss -lntp
## -l: listening, -n: numeric (no DNS), -t: TCP, -p: show process

## All established connections
ss -tnp state established

## All sockets with summary counts
ss -s

## Connections to/from a specific IP
ss -tnp dst 10.0.1.50
ss -tnp src 10.0.1.50

## Connections on a specific port
ss -tnp sport = 443
ss -tnp dport = 5432

## Full output with timers (retransmission timers, keep-alive timers)
ss -tnp -o

## Count connections by state
ss -tan | awk 'NR>1{counts[$1]++} END{for(s in counts) print counts[s], s}' | sort -rn
```

**TCP states to watch**:
- `ESTABLISHED` — active connections
- `TIME_WAIT` — connection closed, waiting for delayed packets (normal, but high counts = connection churn)
- `CLOSE_WAIT` — remote side closed, local side has not yet (often a code bug — the application is not calling close())
- `SYN_SENT` / `SYN_RECV` — connection being established (high counts = SYN flood or slow server)
- `FIN_WAIT1` / `FIN_WAIT2` — local side initiated close

High `TIME_WAIT` count: expected for short-lived connections (HTTP/1.1 without keep-alive). Tune with:
```bash
## /etc/sysctl.conf
net.ipv4.tcp_tw_reuse = 1       # reuse TIME_WAIT sockets for outbound (safe)
net.ipv4.tcp_fin_timeout = 15   # reduce from 60 seconds default
```

## tcpdump — packet capture

```bash
## Capture all traffic on an interface
sudo tcpdump -i eth0

## Capture with full packet content (not just headers)
sudo tcpdump -i eth0 -XX

## Capture to a file for analysis in Wireshark
sudo tcpdump -i eth0 -w /tmp/capture.pcap

## Filter by host
sudo tcpdump -i eth0 host 10.0.1.50

## Filter by port
sudo tcpdump -i eth0 port 5432
sudo tcpdump -i eth0 port not 22   # exclude SSH noise

## HTTP traffic (both directions)
sudo tcpdump -i eth0 -A tcp port 80 or port 443

## Capture TCP RST packets (connection resets — indicates errors)
sudo tcpdump -i eth0 'tcp[13] & 4 != 0'

## Capture SYN packets only (new connections)
sudo tcpdump -i eth0 'tcp[13] & 2 != 0 and tcp[13] & 1 = 0'

## ICMP (ping) packets
sudo tcpdump -i eth0 icmp

## Save 1000 packets, then analyse
sudo tcpdump -i eth0 -c 1000 -w /tmp/capture.pcap
tcpdump -r /tmp/capture.pcap 'tcp[13] & 4 != 0'   # read and filter RSTs
```

**Reading tcpdump output**:
```
14:32:01.234567 IP 10.0.0.5.54321 > 10.0.1.50.5432: Flags [S], seq 123456, win 65535, length 0
14:32:01.234900 IP 10.0.1.50.5432 > 10.0.0.5.54321: Flags [S.], seq 789012, ack 123457, win 65535, length 0
14:32:01.235001 IP 10.0.0.5.54321 > 10.0.1.50.5432: Flags [.], ack 1, win 229, length 0
```

Flags: `[S]` = SYN, `[S.]` = SYN-ACK, `[.]` = ACK, `[F]` = FIN, `[R]` = RST, `[P]` = PSH (data).

The three-way handshake above is normal. If you see `[S]` followed by `[R]` (RST), the server is refusing the connection.

## iperf3 — bandwidth testing

`iperf3` measures the actual TCP/UDP bandwidth between two endpoints. Use it to verify network capacity between servers, diagnose slow inter-region transfers, or baseline a new network path before deploying a workload.

```bash
## On the server (receiving end)
iperf3 -s
## Default port: 5201

## On the client (sending end)
iperf3 -c server-ip

## Extended test: 30 seconds, 8 parallel streams, report every 5 seconds
iperf3 -c server-ip -t 30 -P 8 -i 5

## Reverse test (server sends to client)
iperf3 -c server-ip -R

## UDP test with specific bandwidth target (useful for packet loss measurement)
iperf3 -c server-ip -u -b 1G -t 30

## Test with specific TCP buffer size
iperf3 -c server-ip -w 256K

## JSON output for monitoring
iperf3 -c server-ip -J > /tmp/iperf-results.json
```

**Reading iperf3 output**:
```
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-30.00  sec  3.30 GBytes   946 Mbits/sec    2   sender
[  5]   0.00-30.00  sec  3.30 GBytes   946 Mbits/sec        receiver
```

`Retr` = TCP retransmissions. Any retransmissions indicate packet loss on the path. On a 1Gbps link, 946 Mbits/sec is normal. If you are seeing 200 Mbits/sec on a path rated for 1Gbps, the bottleneck is elsewhere: TCP window size, CPU on one end, or intermediate network congestion.

## nethogs — per-process bandwidth

```bash
apt install nethogs

## Show per-process bandwidth on all interfaces
sudo nethogs

## Specific interface
sudo nethogs eth0

## Non-interactive (for scripting)
sudo nethogs -t eth0   # troff/machine-readable output

## Keys in interactive mode:
## m — switch between KB/s, KB, and B
## r — sort by received
## s — sort by sent
```

nethogs answers "which process is using the most bandwidth right now." Use it alongside `iotop` when you have unexplained network load.

## Diagnosing Retransmissions and Packet Loss

```bash
## Kernel TCP statistics — comprehensive counters
netstat -s | grep -E "retransmit|reorder|out-of-order|failed|reset"
ss -s

## Detailed TCP counters via /proc
cat /proc/net/snmp | grep Tcp

## Relevant counters:
## RetransSegs — cumulative retransmissions (should be near zero, rate of increase matters)
## TCPLostRetransmit — retransmissions that were never acknowledged
## TCPTimeouts — connections that timed out

## Watch retransmission rate (delta over time)
watch -n 5 'netstat -s | grep -i retransmit'

## Per-connection retransmit info
ss -tinp | grep retrans
```

## TCP Tuning for High-Throughput Workloads

Linux defaults are tuned for general use. High-throughput or high-connection-count applications need tuning.

```bash
## /etc/sysctl.conf additions for high-throughput servers

## Increase socket buffers (enables higher BDP — bandwidth-delay product)
net.core.rmem_max = 134217728        # 128MB receive buffer max
net.core.wmem_max = 134217728        # 128MB send buffer max
net.ipv4.tcp_rmem = 4096 65536 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728

## Increase connection backlog
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000

## Enable TCP Fast Open (reduces latency for repeat connections)
net.ipv4.tcp_fastopen = 3

## Reduce TIME_WAIT churn
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

## Congestion control — BBR is better for high-BDP paths (cloud, WAN)
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq          # required for BBR

sysctl -p
## Verify BBR loaded
sysctl net.ipv4.tcp_congestion_control
```

## Diagnosing Connection Timeouts and Drops

```bash
## Are connections being dropped by the kernel backlog?
netstat -s | grep "SYNs to LISTEN"
## Any value here means the accept queue is overflowing

## Is iptables/nftables dropping packets?
sudo iptables -L -v -n | grep -v "0     0"   # show rules with nonzero counters
sudo nft list ruleset | grep counter

## Interface errors
ip -s link show eth0
## Errors in RX/TX lines indicate hardware or driver problems

## Check NIC ring buffer drops
ethtool -S eth0 | grep -i "drop\|error\|miss"

## Are UDP packets being dropped?
cat /proc/net/snmp | grep Udp
netstat -suna | grep error
```

High `SYNs to LISTEN sockets dropped` means the application cannot accept connections fast enough. The fix is to increase `net.core.somaxconn` and increase the application's listen backlog in the socket call.
