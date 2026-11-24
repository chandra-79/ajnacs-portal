---
title: "Network Performance Tools on Linux"
description: "Using ss, tcpdump, iperf3, and nethogs to diagnose TCP connection states, capture packets, measure bandwidth, and find which process is consuming the network."
date: 2027-08-11
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 18
format: article
---

Network performance investigations can begin with symptoms such as throughput limits, connection growth, packet loss, retransmissions and latency. These categories overlap and do not identify a unique cause or remedy without measurements along the application path. Trying to diagnose them without understanding TCP state machines and the Linux networking stack leads to guesswork.

## ss — the socket statistics tool

`ss` replaced `netstat`. It provides detailed socket state and filtering through kernel interfaces.

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
- `SYN_SENT` / `SYN_RECV` — connection establishment states; growth can reflect traffic, packet loss, unreachable peers, backlog pressure or abuse
- `FIN_WAIT1` / `FIN_WAIT2` — local side initiated close

High `TIME_WAIT` counts can be normal after short-lived connections. Investigate actual failures and connection reuse before changing kernel settings. `tcp_fin_timeout` controls orphaned FIN_WAIT_2 behavior, not TIME_WAIT duration; `tcp_tw_reuse` is not a universally safe tuning prescription.

## tcpdump — packet capture

```bash
## Capture all traffic on an interface
sudo tcpdump -i eth0

## Request the tool’s maximum snapshot length and print packet bytes
sudo tcpdump -i eth0 -s 0 -XX

## Capture to a file for analysis in Wireshark
sudo tcpdump -i eth0 -w /tmp/capture.pcap

## Filter by host
sudo tcpdump -i eth0 host 10.0.1.50

## Filter by port
sudo tcpdump -i eth0 port 5432
sudo tcpdump -i eth0 port not 22   # exclude SSH noise

## TCP traffic on common HTTP and HTTPS ports (TLS payload stays encrypted)
sudo tcpdump -i eth0 -A 'tcp port 80 or tcp port 443'

## Capture TCP RST packets; resets require context and are not all application failures
sudo tcpdump -i eth0 'tcp[13] & 4 != 0'

## Capture SYN-bearing packets without FIN, including SYN-ACK handshake replies
sudo tcpdump -i eth0 'tcp[13] & 2 != 0 and tcp[13] & 1 = 0'

## IPv4 ICMP packets, including echo and control/error messages
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

The three-way handshake above is normal. A reset following a SYN can indicate refusal, but a firewall or another intermediary can also generate it; inspect addresses and captures from the relevant endpoints before assigning the cause.

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

`Retr` = TCP retransmissions. Retransmissions warrant investigation; they do not by themselves identify loss location or exclude spurious recovery. A result near 946 Mbits/sec can be plausible on a 1Gbps path, depending on framing and test conditions. If you are seeing 200 Mbits/sec on a path rated for 1Gbps, the bottleneck is elsewhere: TCP window size, CPU on one end, or intermediate network congestion.

## nethogs — per-process bandwidth

```bash
apt install nethogs

## Show per-process bandwidth on all interfaces
sudo nethogs

## Specific interface
sudo nethogs eth0

## Non-interactive (for scripting)
sudo nethogs -t eth0   # tracing-mode output

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
## RetransSegs — cumulative retransmissions; examine deltas and workload context
## TCP loss counters are kernel-specific; inspect the installed kernel’s documented semantics
## TCPTimeouts — TCP retransmission timeout events, not unique failed connections

## Watch cumulative retransmission counters; compute deltas over measured intervals separately
watch -n 5 'netstat -s | grep -i retransmit'

## Per-connection retransmit info
ss -tinp | grep retrans
```

## TCP tuning requires an observed constraint

Inspect the current kernel documentation and effective values before changing buffers, backlogs, TCP Fast Open, or congestion control. Available algorithms and defaults depend on the kernel and distribution. There is no universal sysctl bundle that improves every workload; the worksheet below turns each change into a measurable experiment.

## Diagnosing Connection Timeouts and Drops

```bash
## Are connections being dropped by the kernel backlog?
netstat -s | grep "SYNs to LISTEN"
## Examine deltas and related listen counters; this is not a complete diagnosis

## Is iptables/nftables dropping packets?
sudo iptables -L -v -n | grep -v "0     0"   # show rules with nonzero counters
sudo nft list ruleset | grep counter

## Interface errors
ip -s link show eth0
## Inspect RX/TX errors and drops; causes depend on driver and counter meaning

## Check NIC ring buffer drops
ethtool -S eth0 | grep -i "drop\|error\|miss"

## Are UDP packets being dropped?
cat /proc/net/snmp | grep Udp
netstat -suna | grep error
```

Rising listen-drop counters require investigation of arrival bursts, backlog configuration, accept-loop progress, resource limits, and application latency. Increasing a queue is only one possible intervention and may merely delay failure.

## Begin with the application's path, not a faster benchmark

A slow download can involve DNS, connection establishment, TLS, server queueing, application processing, storage, and data transfer. A successful throughput test isolates only some of these stages. Write a timeline from the client's perspective and mark which intervals are measured. A server reporting ten milliseconds of handler time says nothing about two seconds spent before the request reached that handler. Use correlated request identifiers and synchronized observation windows without assuming perfectly synchronized clocks across machines.

Map the actual path: source namespace, interface, address family, route, destination, and any proxy or tunnel. A test between host addresses may bypass the container overlay used by the application. A test to an IP can bypass DNS and reach a different virtual host. A reverse iperf test changes the data direction, but it may also expose asymmetric policies or bottlenecks. Keep those distinctions in the experiment record rather than attributing every difference to the physical link.

## A bandwidth-delay worksheet with honest units

The chart uses fictional decimal units to illustrate a throughput ceiling, not a measured network. For a 1 gigabit-per-second path and a 40 millisecond round-trip time, the bandwidth-delay product is 1,000,000,000 × 0.040 / 8 = 5,000,000 bytes, or 5 decimal megabytes. Roughly that much data must be in flight to fill the path under idealized steady conditions. This is not a recommendation to assign every socket a five-megabyte buffer.

If the effective in-flight window were capped at one decimal megabyte, the simple window/RTT ceiling would be 1,000,000 × 8 / 0.040 = 200 megabits per second. At three megabytes it would be 600; at five, 1,000. These are the chart's three values. Real goodput can be lower because of headers, congestion behavior, loss recovery, endpoint limits, and application stalls. The relevant effective window can be constrained by congestion control as well as receive-window advertisement; a configured maximum buffer is not the same quantity.

Suppose eight parallel streams reach 900 megabits per second while one reaches 200. That observation does not prove the network is healthy for a single large application transfer. Parallel streams may overcome a per-flow constraint or compete differently for capacity. Record both results, the CPU load, and the application requirement. If the real client uses one stream, the single-stream result remains operationally relevant even when an impressive aggregate number is available.

## A bounded two-endpoint lab

Use endpoints you administer on a test network with permission to generate traffic. Record tool versions, host CPU limits, interface MTU, link rate if known, and whether traffic traverses a shared production path. Start with a short, modest offered load. An unrestricted UDP test can disrupt other traffic and does not become harmless because it is called a diagnostic. Bind the server to the intended test address, constrain network access, and stop it when the exercise ends.

Create a result directory with restricted access and collect an idle baseline of interface and TCP counters. Run a single-stream forward test, then a reverse test, then a small parallel-stream test. Repeat each a few times with the same duration and intervals. Save JSON output separately for each run rather than overwriting one file. The goal is to compare controlled cases, not to keep adjusting options until the largest number appears.

During each run, sample endpoint CPU utilization, relevant socket state with `ss -tin`, and interface counters. A receiver CPU becoming saturated supports a different hypothesis from increasing interface drops. An application-limited socket can underfill a healthy path. A large send queue indicates data waiting at that observation point, but interpreting it requires the socket state and application behavior; it is not automatically proof of network congestion.

Add one controlled impairment in an isolated namespace or disposable test environment: delay, limited bandwidth, or loss. Predict which observations should change before running the test. For example, increasing round-trip time with a fixed small window should lower the idealized ceiling. Remove the impairment and confirm the original behavior returns. Keep the commands, namespace names, and cleanup steps in the lab record so an accidental host-wide change is detectable.

## Read counters as changes over a known interval

A cumulative retransmission counter is not a current loss percentage. Take two snapshots, subtract them, and ensure both refer to the same host or namespace and interval. If the machine rebooted or a namespace was recreated, the subtraction may be meaningless. Dividing retransmitted segments by transmitted segments can be a useful descriptive ratio, but it is not a direct measurement of every packet lost in the network.

Retransmission can follow loss, reordering, delayed acknowledgments, or a spurious timeout. Packet capture may clarify the sequence, but the capture itself can drop packets. A sender-side capture may show segmentation offload artifacts that differ from frames on the wire. A bad-looking checksum in a local capture can reflect offload timing rather than corruption. Check capture statistics, location, and offload configuration before presenting a packet trace as definitive evidence.

Likewise, many TIME_WAIT sockets show recent connection churn, not necessarily exhaustion. Check actual connection failures, available ephemeral-port range, destination distribution, and reuse of application connections. CLOSE_WAIT means the local application has not completed its side of closure after receiving the peer's close; inspect the process and its lifecycle. Treat SYN-state accumulation as a symptom with several possible causes, including unreachable peers and slow completion, rather than declaring an attack from one count.

## Keep captures useful and controlled

Choose a narrow capture filter and bounded packet count or rotation policy. Packet files can contain credentials, customer data, and internal topology even when the application payload is encrypted. Save them in a restricted directory with an explicit retention period. A truncated capture can be sufficient for transport headers, while full payload capture requires a reason. Do not publish raw captures as a troubleshooting convenience.

TLS traffic on port 443 is not readable HTTP simply because tcpdump uses ASCII output. You can inspect timing, addresses, sizes, and transport behavior; application content normally requires authorized endpoint instrumentation or suitable decryption material. A reset indicates a connection was reset, but the origin and reason still need investigation: an endpoint, proxy, firewall, or stale connection may be involved.

## Turn tuning into a reversible hypothesis

A bigger listen backlog can absorb a temporary burst; it cannot make a persistently slow accept loop process requests faster. Larger buffers can improve a constrained flow and can also increase memory consumption or queued delay. Changing congestion control affects competition and recovery behavior, so evaluate it on the actual path and kernel rather than treating an algorithm name as a universal upgrade.

For each proposed change, record the current value, the predicted symptom improvement, a bounded test, and a rollback condition. Change one relevant variable at a time unless the change is explicitly a tested configuration bundle. Re-run the application transaction after the synthetic benchmark. The acceptance evidence should include successful completed work, tail latency, errors, and impact on neighboring workloads. A higher throughput number is a useful result only when it serves the workload without hiding a new failure elsewhere.

## Primary references

- [iperf3 invocation and measurement options](https://software.es.net/iperf/invoking.html)
- [Linux networking sysctl reference](https://docs.kernel.org/networking/ip-sysctl.html)
- [ss socket statistics manual](https://man7.org/linux/man-pages/man8/ss.8.html)
