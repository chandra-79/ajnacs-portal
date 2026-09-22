---
title: "Linux Firewalls: iptables, nftables, ufw, and firewalld Explained"
description: "How Linux packet filtering works, iptables tables and chains, writing firewall rules, nftables as the modern successor, and ufw/firewalld as management layers for production systems."
date: 2026-08-13
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 14
format: article
---

Every Linux system that connects to a network needs firewall rules. Understanding how Linux packet filtering works at the netfilter level — not just which tool to run — lets you write correct rules, diagnose unexpected packet drops, and understand what Docker or Kubernetes is doing when they add rules automatically.

## netfilter: The Kernel Packet Filter

Linux packet filtering is implemented in the kernel by **netfilter**. It intercepts packets at specific hook points in the network stack:

```
Incoming packet
      ↓
PREROUTING (NAT: DNAT for port forwarding)
      ↓
Routing decision: local delivery or forwarding?
      ↓                           ↓
INPUT (to local process)    FORWARD (forwarded to another host)
      ↓                           ↓
Local process              POSTROUTING (NAT: SNAT/MASQUERADE)
      ↓
OUTPUT (from local process)
      ↓
POSTROUTING
```

`iptables` is the traditional tool to configure netfilter rules. `nftables` is the modern replacement. `ufw` and `firewalld` are management layers on top of both.

## iptables: Tables and Chains

iptables organizes rules into **tables** (what kind of action) and **chains** (at what hook point):

**Tables:**
- `filter`: allow or block packets (default table) — INPUT, OUTPUT, FORWARD chains
- `nat`: address translation — PREROUTING, POSTROUTING, OUTPUT chains
- `mangle`: packet modification — all chains
- `raw`: connection tracking bypass

```bash
## View rules
sudo iptables -L                          # filter table, all chains
sudo iptables -L INPUT -v -n              # INPUT chain, verbose, numeric IPs
sudo iptables -t nat -L -v -n            # NAT table
sudo iptables -L --line-numbers           # show rule numbers

## Save and restore rules
sudo iptables-save > /etc/iptables/rules.v4
sudo iptables-restore < /etc/iptables/rules.v4

## Persistent across reboots (Debian/Ubuntu)
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

### Writing iptables Rules

```bash
## Basic structure:
## iptables -[A/I/D] CHAIN [-i/-o interface] [-p protocol]
## [-s source] [-d destination] [--dport/--sport port]
## -j TARGET
## # Targets: ACCEPT, DROP, REJECT, LOG, DNAT, SNAT, MASQUERADE

## --- A minimal web server firewall ---

## 1. Flush existing rules
sudo iptables -F                          # flush all chains
sudo iptables -t nat -F                   # flush NAT table
sudo iptables -X                          # delete user-defined chains

## 2. Default policies: drop everything, then allow explicitly
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT           # outbound: allow all (can restrict later)

## 3. Allow established connections (stateful firewall — the most important rule)
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

## 4. Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

## 5. Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

## 6. Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

## 7. Allow ICMP (ping)
sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT

## 8. Log and drop everything else
sudo iptables -A INPUT -j LOG --log-prefix "iptables-DROP: " --log-level 4
sudo iptables -A INPUT -j DROP

## --- Port forwarding ---
## Forward port 80 on the host to port 8080 on 192.168.1.10
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.10:8080
sudo iptables -A FORWARD -p tcp -d 192.168.1.10 --dport 8080 -j ACCEPT

## --- NAT masquerade (outbound NAT for a LAN) ---
## Packets from 192.168.1.0/24 going out eth0 are NATted
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
sudo sysctl -w net.ipv4.ip_forward=1      # enable IP forwarding

## --- Rate limiting SSH ---
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW \
    -m recent --set --name SSH
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW \
    -m recent --update --seconds 60 --hitcount 4 --name SSH \
    -j DROP    # drop if more than 3 new connections in 60 seconds
```

## nftables: The Modern Replacement

`nftables` replaces iptables, ip6tables, arptables, and ebtables with a single, consistent framework.

```bash
## View current nftables rules
sudo nft list ruleset

## nftables syntax is cleaner and more expressive
## Tables contain chains; chains contain rules

## Create a minimal web server firewall in nftables
sudo nft -f - <<'NFTEOF'
table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;

        # Established connections
        ct state established,related accept

        # Loopback
        iif lo accept

        # ICMP (IPv4 and IPv6)
        ip protocol icmp icmp type echo-request accept
        ip6 nexthdr icmpv6 icmpv6 type echo-request accept

        # SSH (rate limited)
        tcp dport 22 ct state new limit rate 3/minute burst 5 packets accept
        tcp dport 22 drop

        # HTTP and HTTPS
        tcp dport { 80, 443 } accept

        # Log drops
        log prefix "nftables-DROP: " drop
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
    }
}
NFTEOF

## Port forwarding with nftables
sudo nft add table ip nat
sudo nft add chain ip nat prerouting { type nat hook prerouting priority -100\; }
sudo nft add chain ip nat postrouting { type nat hook postrouting priority 100\; }
sudo nft add rule ip nat prerouting tcp dport 80 dnat to 192.168.1.10:8080
sudo nft add rule ip nat postrouting ip saddr 192.168.1.0/24 oif eth0 masquerade

## Save nftables rules
sudo nft list ruleset > /etc/nftables.conf
sudo systemctl enable nftables
```

## ufw: Uncomplicated Firewall (Ubuntu)

ufw is a frontend for iptables with a simple interface, designed for straightforward firewall management.

```bash
## Check status
sudo ufw status verbose
sudo ufw status numbered          # with rule numbers

## Enable/disable
sudo ufw enable
sudo ufw disable
sudo ufw reset                    # reset to defaults

## Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

## Allow services
sudo ufw allow ssh                # by service name (looks up /etc/services)
sudo ufw allow 22/tcp             # explicit port/protocol
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'       # ufw app profile

## Allow from specific IP
sudo ufw allow from 192.168.1.0/24
sudo ufw allow from 192.168.1.100 to any port 5432

## Deny
sudo ufw deny 25/tcp

## Delete a rule
sudo ufw delete allow 80/tcp
sudo ufw delete 3                 # by rule number

## Rate limiting
sudo ufw limit ssh                # block after 6 connections in 30 seconds
```

## firewalld (RHEL/CentOS)

```bash
## Check status
sudo firewall-cmd --state
sudo firewall-cmd --list-all
sudo firewall-cmd --list-all --zone=public

## Zones (contexts that apply different rule sets)
firewall-cmd --get-zones
firewall-cmd --get-active-zones
firewall-cmd --get-default-zone

## Add rules (--permanent persists after reload)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=8080/tcp

## Remove rules
sudo firewall-cmd --permanent --remove-service=http

## Port forwarding
sudo firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.10

## Apply permanent changes
sudo firewall-cmd --reload

## Rich rules (complex rules)
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" service name="ssh" accept'
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/8" service name="https" accept'
```

## Diagnosing Firewall Issues

```bash
## Is a packet being dropped by iptables?
sudo iptables -L -v -n | grep -v "0     0"     # rules with non-zero counters

## Add a logging rule before a DROP to see what is being dropped
sudo iptables -I INPUT 1 -j LOG --log-prefix "DEBUG-INPUT: " --log-level 7
journalctl -f | grep "DEBUG-INPUT"
## Remove the debug rule when done
sudo iptables -D INPUT 1

## Watch iptables counters update in real time
watch -n 1 'iptables -L INPUT -v -n'

## nftables tracing (more powerful)
sudo nft add rule inet filter input tcp dport 22 meta nftrace set 1
sudo nft monitor trace

## Check if connection tracking is the issue
sudo conntrack -L                  # current connection tracking table
sudo conntrack -L | grep ESTABLISHED | wc -l
cat /proc/sys/net/netfilter/nf_conntrack_count   # current tracked connections
cat /proc/sys/net/netfilter/nf_conntrack_max     # maximum tracked connections
## If count ≈ max: increase max or the firewall will start dropping new connections
sudo sysctl -w net.netfilter.nf_conntrack_max=131072
```

Understanding the netfilter architecture — hooks, tables, chains — means you can read and write firewall rules at the level where they actually work, diagnose unexpected drops, and understand the rules that Docker, Kubernetes, and cloud agents add automatically to your system.
