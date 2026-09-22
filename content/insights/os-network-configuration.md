---
title: "Linux Network Configuration: Interfaces, Routing, DNS, and the ip Command"
description: "How Linux network configuration works — the ip command, network interfaces, routing tables, DNS resolution, NetworkManager vs systemd-networkd, and persistent configuration."
date: 2027-06-09
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 13
format: article
---

Network configuration on Linux has evolved significantly. The `ifconfig` and `route` commands from the 1990s are still present on many systems but are deprecated. The modern tool is `ip`, part of the `iproute2` package. This lesson covers the `ip` command, interface configuration, routing tables, DNS, and how to make changes persistent.

## The ip Command

`ip` has a consistent structure: `ip [object] [command]`

Objects: `link` (interfaces), `addr` (addresses), `route` (routing), `neigh` (ARP table), `rule` (routing rules)

```bash
## Network interfaces
ip link show                     # all interfaces with state
ip link show eth0                # specific interface
ip link set eth0 up              # bring interface up
ip link set eth0 down            # bring interface down
ip link set eth0 promisc on      # promiscuous mode (capture all traffic)
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
ip neigh show                    # ARP table
ip neigh flush all               # clear ARP cache

## Statistics
ip -s link show eth0             # packet/byte/error counts per interface
ip -s -s link show eth0          # more detailed stats
```

## Network Interface Names

Linux uses predictable interface names rather than `eth0`, `eth1` (which could change order at boot):

- **enpXsY**: PCIe ethernet — `enp3s0` (PCI bus 3, slot 0)
- **ensX**: PCIe with hotplug — `ens3`
- **ethX**: older naming still used in containers and some VMs
- **wlan0**: wireless
- **lo**: loopback (127.0.0.1)
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
sudo netplan try          # apply for 120s, then revert (safe)
sudo netplan apply        # apply permanently
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

DNS resolution on Linux goes through multiple layers:

```
Application
    ↓ glibc getaddrinfo()
/etc/nsswitch.conf   (controls resolution order)
    ↓
/etc/hosts           (check first — static entries)
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
## Linux has 255 routing tables. The main one is table 254.
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
      gateway4: 192.168.1.1
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
