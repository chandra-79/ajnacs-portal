---
title: "Linux Network Configuration: Interfaces, Routing, DNS, and the ip Command"
description: "How Linux network configuration works — the ip command, network interfaces, routing tables, DNS resolution, NetworkManager vs systemd-networkd, and persistent configuration."
date: 2027-04-19
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 13
format: article
---

Network configuration on Linux has evolved significantly. The `ifconfig` and `route` commands from the 1990s remain available in some distributions, while iproute2 is generally preferred for modern Linux networking. The modern tool is `ip`, part of the `iproute2` package. This lesson covers the `ip` command, interface configuration, routing tables, DNS, and how to make changes persistent. Run mutating examples in an isolated lab with the documented interface names substituted. Changing a host route, interface state or active network manager can sever the administrative connection; select one configuration owner and establish recovery access first.

## The ip Command

`ip` has a consistent structure: `ip [object] [command]`

Objects: `link` (interfaces), `addr` (addresses), `route` (routing), `neigh` (IPv4 ARP and IPv6 neighbour table), `rule` (routing rules)

```bash
## Network interfaces
ip link show                     # all interfaces with state
ip link show eth0                # specific interface
ip link set eth0 up              # bring interface up
ip link set eth0 down            # bring interface down
ip link set eth0 promisc on      # accept additional frames delivered to this interface
ip link set eth0 mtu 9000        # set MTU (jumbo frames)

## IP addresses
ip addr show                     # all addresses
ip addr show eth0                # addresses on eth0
ip addr add 192.168.1.100/24 dev eth0      # add address
ip addr del 192.168.1.100/24 dev eth0      # remove address
ip addr add 10.0.0.1/24 broadcast + dev eth0  # with auto-calculated broadcast

## Routing
ip route show                    # routing table
ip route show table all          # all routing tables
ip route add default via 192.168.1.1         # default gateway
ip route add 10.0.0.0/8 via 10.0.0.1        # static route
ip route del 10.0.0.0/8                      # remove route
ip route get 8.8.8.8                         # which route would be used?

## ARP cache
ip neigh show                    # IPv4 ARP and IPv6 neighbour entries
ip neigh show nud failed         # inspect failed neighbour resolution

## Statistics
ip -s link show eth0             # packet/byte/error counts per interface
ip -s -s link show eth0          # more detailed stats
```

## Network Interface Names

Many distributions use predictable interface naming; policy and platform determine the actual names. Examples include:

- **enpXsY**: PCIe ethernet — `enp3s0` (PCI bus 3, slot 0)
- **ensX**: firmware-provided slot naming — `ens3`
- **ethX**: older naming still used in containers and some VMs
- **wlan0**: wireless
- **lo**: loopback (commonly 127.0.0.1 for IPv4 and ::1 for IPv6)
- **br-X**: bridge interface (Docker, KVM)
- **vethX**: virtual ethernet pair (containers)
- **tunX, tapX**: tunnel and TAP interfaces (VPN)
- **bondX**: bonded interfaces (link aggregation)

```bash
## See all interfaces including virtual
ip link show
ls /sys/class/net/               # list all network interfaces in the kernel

## Interface details
ethtool eth0                     # speed, duplex, driver, link status
ethtool -i eth0                  # driver information
ethtool -S eth0                  # driver statistics

## Check if interface is physically connected
cat /sys/class/net/eth0/carrier  # 1=connected, 0=disconnected
```

## Persistent Network Configuration

Changes made with `ip` are temporary — lost on reboot. Persistence depends on the network manager in use.

### Netplan (Ubuntu 20.04+)

```yaml
## /etc/netplan/01-network.yaml
network:
  version: 2
  renderer: networkd    # or: NetworkManager

  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
        search: [internal.company.com]

    # Second interface with DHCP
    eth1:
      dhcp4: true
```

```bash
sudo netplan try          # trial with confirmation timeout; verify rollback limitations
sudo netplan apply        # apply the persisted configuration to the running system
netplan get               # show current configuration
```

### systemd-networkd

```ini
## /etc/systemd/network/20-wired.network
[Match]
Name=eth0

[Network]
Address=192.168.1.100/24
Gateway=192.168.1.1
DNS=8.8.8.8
DNS=1.1.1.1
Domains=internal.company.com
```

```bash
sudo systemctl enable --now systemd-networkd
sudo networkctl status            # interface status
sudo networkctl status eth0
```

### NetworkManager (RHEL/CentOS/desktop)

```bash
## nmcli commands
nmcli device status               # interface status
nmcli connection show             # all connections
nmcli device show eth0

## Configure a static IP
nmcli connection modify "Wired connection 1" \
    ipv4.method manual \
    ipv4.addresses "192.168.1.100/24" \
    ipv4.gateway "192.168.1.1" \
    ipv4.dns "8.8.8.8,1.1.1.1"

nmcli connection up "Wired connection 1"

## Add a DNS search domain
nmcli connection modify "Wired connection 1" ipv4.dns-search "internal.company.com"
```

## DNS Resolution

A common glibc/NSS resolution path has several layers; the configured NSS order and application resolver determine the actual path:

```
Application
    ↓ glibc getaddrinfo()
/etc/nsswitch.conf   (controls resolution order)
    ↓
/etc/hosts           (static entries, when NSS selects files here)
    ↓
DNS resolver (systemd-resolved, or directly /etc/resolv.conf)
    ↓
DNS server (specified in /etc/resolv.conf or via resolved)
```

```bash
## /etc/nsswitch.conf — name resolution order
## hosts: files dns myhostname
## "files" = /etc/hosts  "dns" = query DNS  "myhostname" = resolve local hostname

## /etc/hosts — static name-to-IP mappings
cat /etc/hosts
## 127.0.0.1   localhost
## 192.168.1.10   database.internal  db

## /etc/resolv.conf — DNS configuration
cat /etc/resolv.conf
## nameserver 8.8.8.8
## nameserver 1.1.1.1
## search internal.company.com    # appended to single-label hostnames
## options timeout:2 attempts:3

## systemd-resolved (Ubuntu/modern systems)
resolvectl status              # resolver status per interface
resolvectl query google.com    # query via resolved
resolvectl statistics          # cache hit rates
resolvectl flush-caches        # clear DNS cache
```

## Routing and Policy Routing

```bash
## Show the main routing table
ip route show
## default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.100 metric 100
## 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100

## Multiple routing tables (for policy routing)
## Table identifiers can extend beyond 255; main is conventionally table 254.
ip route show table main
ip route show table local     # local and broadcast addresses
ip route show table all

## Policy routing: route traffic based on source IP
## Route traffic from 10.0.0.0/24 through a different gateway
ip rule add from 10.0.0.0/24 table 100
ip route add default via 10.0.0.1 table 100
ip rule show

## Useful diagnostic: trace the route a packet would take
ip route get 8.8.8.8
ip route get 8.8.8.8 from 192.168.1.100

## traceroute alternatives
traceroute 8.8.8.8
mtr --report 8.8.8.8          # continuous traceroute with statistics
tracepath 8.8.8.8             # no root required; shows MTU at each hop
```

## Network Bonding and Bridging

```bash
## Bonding (link aggregation): two physical interfaces as one logical interface
## Modes: active-backup, balance-rr, 802.3ad (LACP), etc.

## With netplan:
## /etc/netplan/01-bond.yaml
network:
  bonds:
    bond0:
      interfaces: [eth0, eth1]
      parameters:
        mode: active-backup
        primary: eth0
      dhcp4: true

## Bridging (required for KVM/VM networking)
## /etc/netplan/01-bridge.yaml
network:
  bridges:
    br0:
      interfaces: [eth0]
      addresses: [192.168.1.100/24]
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8]
      parameters:
        stp: false
```

## Network Diagnostics Quick Reference

```bash
## Connectivity
ping -c 4 8.8.8.8                    # basic reachability
ping -c 4 -I eth0 8.8.8.8            # via specific interface
curl -sv https://api.service.internal # test HTTPS with full handshake details

## Port and socket status
ss -tulnp                            # listening ports with process
ss -tupna                            # all connections with process
ss -s                                # summary statistics
ss -tn dst :443                      # connections to port 443

## DNS
dig google.com                       # DNS lookup
dig +short google.com                # just the answer
dig @8.8.8.8 google.com              # use specific DNS server
dig -x 8.8.8.8                       # reverse DNS lookup
nslookup google.com                  # interactive or one-shot lookup

## Bandwidth
iperf3 -s                            # server mode
iperf3 -c server-ip                  # client: test throughput to server
iperf3 -c server-ip -P 4             # 4 parallel streams

## Interface statistics
cat /proc/net/dev                    # packets/bytes/errors per interface
netstat -i                           # interface stats table
sar -n DEV 1 5                       # 1-second samples, 5 iterations
```

Network configuration on Linux is layered — the kernel handles routing and interface state, network managers (netplan, NetworkManager, networkd) handle persistence, and DNS resolution goes through its own stack. Understanding each layer means you can diagnose network issues correctly rather than trying configuration changes at random.

## Separate the desired configuration from the current state

The kernel's current addresses and routes are one view of the system. NetworkManager profiles, networkd files, Netplan input, cloud-init, and platform configuration may describe the state that will be applied later. A manual `ip` change can work temporarily while a manager restores a different configuration on reconnect or reboot.

Identify the authoritative manager for each interface before changing it. Several managers can exist on one machine without all owning the same interface. Inspect the active connection or matching configuration, its generated files where applicable, and any cloud provisioning that can rewrite it. Do not enable a second manager merely because an example uses it.

Record the current management path as part of the change. Which address is the administrative session using? Which route returns traffic to that source? Which DNS service resolves the control-plane endpoints? A network change can preserve ordinary internet access while breaking the path used to inspect and recover the machine.

For a real change, use an approved maintenance and recovery procedure. For the exercises here, use an isolated virtual machine or network namespace. A reversible trial feature is helpful, but it is not a substitute for an independent recovery route or a verified understanding of what will be restored.

## Work through route selection with concrete prefixes

Consider a fictional routing table with a default route, a route for `10.0.0.0/8`, and a more specific route for `10.20.0.0/16`. A destination such as `10.20.3.7` matches all three prefixes. Within the selected table, longest-prefix matching prefers the `/16` route over the `/8` and default route. Metrics help choose among otherwise comparable routes; a low metric on a less-specific prefix does not normally override a more-specific match.

Policy routing adds a prior question: which rule and table are selected for the packet? Source address, marks, input interface, and other selectors can change the lookup path. Inspect `ip rule show` and use `ip route get` with the relevant source or other context rather than assuming that the main table explains every flow.

The chart accompanying this lesson uses prefix lengths 0, 8, and 16 from that synthetic example. The values describe specificity in bits, not route speed or performance. A longer prefix narrows the matching destination set. The chart is a visual aid for the lookup rule; it is not a benchmark showing that one path is faster.

The return path matters too. A client may send a packet successfully while the server replies through a different interface or gateway. Stateful filtering, upstream policies, or reverse-path validation may then affect the connection. Diagnose both directions instead of treating an outbound route lookup as proof of end-to-end reachability.

## Build a namespace exercise around the lookup

Use two or three disposable namespaces with veth links and documentation or private address ranges chosen to avoid overlap with the host's existing networks. The host's production interfaces and default route should remain untouched. Record the namespace topology and the interface names created by the setup so cleanup can target only the exercise.

Start with read-only inspection inside a namespace: addresses, link state, routes, and rules. Add one directly connected network and verify neighbour discovery between the two endpoints. Then introduce a second destination prefix through an exercise router and predict the selected route before sending traffic.

Use `ip route get` to compare destinations that match different prefixes. Add a more-specific route and observe the lookup change. If testing policy routing, give the rule an explicit priority and create the table's required connected route as well as its default route. A gateway must be reachable in the relevant context; a default route that names an unreachable next hop does not establish a working path.

Test an absent route, an unavailable neighbour, and a closed application port separately. Record the expected error or timeout and the layer each case exercises. A route lookup can succeed even when no process is listening at the destination. A ping can fail because ICMP is filtered while the required application connection still works. These observations answer different questions.

## Diagnose names through the resolver the application uses

A direct DNS query and an application name lookup are not necessarily equivalent. `dig` asks a DNS server; an application using the system resolver may also consult local files and other Name Service Switch modules. Applications may additionally use their own resolver or cache. Begin with the actual application's resolution path before declaring a disagreement to be a DNS-server failure.

Use `getent ahosts` where appropriate to inspect the system's configured host-resolution path, then compare it with the relevant DNS query. With systemd-resolved, inspect per-link DNS settings and routing domains. A split-DNS configuration can send an internal suffix to one resolver and other names elsewhere. Replacing it with a public resolver may break internal resolution or expose queries that should remain within the organisation's boundary.

Check both address families. A name can return IPv4 and IPv6 addresses with different reachability. Record which address the application actually attempted, the connection outcome, and any fallback behavior. Do not infer that DNS is correct merely because one address appears in a command's output, or that the network is broken because one family is unavailable in an environment that intentionally supports only the other.

Cache state can explain differences between clients, but flushing caches is an experiment, not a diagnosis. Record the original answer, its scope and lifetime where available, and the expected authoritative answer before changing local state. Otherwise the action may remove evidence without establishing why the old answer appeared.

## Preserve the management path during a persistent change

Prepare the intended configuration in the manager's supported format and validate it before applying. Confirm the interface match, address prefix, gateway, DNS scope, and route ownership. A typographical error in an interface name can leave a carefully written file unused, while an overly broad match can affect an unintended interface.

Netplan's trial mechanism can revert unconfirmed changes, but its documented limitations still require checking that rollback actually occurred. Virtual devices and particular renderer behaviors may need special attention. After a failed trial, inspect both runtime state and the configuration that would apply on the next boot rather than assuming that a timer proves the machine is fully restored.

For an accepted change, verify a new administrative connection, required application traffic, internal and external name resolution as applicable, and the return route. Keep the original session until the new path has been checked, but do not treat that established connection as the only test. Existing sessions can survive conditions that prevent new ones.

Reboot testing belongs in an appropriate rehearsal environment when persistence is required. The configuration may be syntactically valid and work immediately, yet conflict with a boot-time generator or another manager. Record the authoritative source and remove obsolete competing definitions through the approved process.

## Interpret link statistics as interval evidence

Interface counters usually accumulate over time and can reset when an interface is recreated or the machine restarts. Compare two snapshots over a known interval. A nonzero historical error counter does not show that the current incident is producing errors, while a rising counter can help identify where to investigate next.

Driver-specific counters require driver-specific interpretation. A drop at one layer may represent filtering, queue pressure, unsupported traffic, or another mechanism. Correlate it with the relevant application flow and with counters on the peer where available. Aggregate bytes on a shared interface do not directly establish the throughput available to one connection.

MTU changes deserve end-to-end testing. Setting a large MTU on one interface does not make every hop support it. Encapsulation can reduce the usable payload size, and blocked path-MTU signalling can cause failures that appear only for larger transfers. Test the actual application path rather than accepting a small successful packet as sufficient evidence.

Finish with a network worksheet: interface owner, desired addresses, selected routes for representative destinations, resolver path, allowed management sources, persistence mechanism, and recovery method. This connects commands to the service they support and makes the next change easier to review without repeating the entire investigation.

## Primary references

- [iproute2: route selection and table identifiers](https://www.man7.org/linux/man-pages/man8/ip-route.8.html)
- [systemd: network configuration matching and ownership](https://www.freedesktop.org/software/systemd/man/latest/systemd.network.html)
- [Netplan: trial configuration and rollback limitations](https://netplan.readthedocs.io/en/stable/netplan-try/)
