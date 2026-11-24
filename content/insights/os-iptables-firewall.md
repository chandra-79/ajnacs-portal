---
title: "Linux Firewalls: iptables, nftables, ufw, and firewalld Explained"
description: "How Linux packet filtering works, iptables tables and chains, writing firewall rules, nftables as the modern successor, and ufw/firewalld as management layers for production systems."
date: 2027-06-09
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 14
format: article
---

A Linux host needs an explicit network trust boundary, implemented through the appropriate host, network, and platform controls. Understanding how Linux packet filtering works at the netfilter level — not just which tool to run — lets you write correct rules, diagnose unexpected packet drops, and understand what Docker or Kubernetes is doing when they add rules automatically.

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

`iptables` is the traditional tool to configure netfilter rules. `nftables` is the modern replacement. `ufw` and `firewalld` are management layers whose backends depend on the installed version and distribution configuration.

## iptables: Tables and Chains

iptables organizes rules into **tables** (what kind of action) and **chains** (at what hook point):

**Tables:**
- `filter`: allow or block packets (default table) — INPUT, OUTPUT, FORWARD chains
- `nat`: address translation — PREROUTING, INPUT, OUTPUT, POSTROUTING chains (supported hooks depend on kernel and backend)
- `mangle`: packet modification — all chains
- `raw`: connection tracking bypass

```bash
## View rules
sudo iptables -L                          # filter table, all chains
sudo iptables -L INPUT -v -n              # INPUT chain, verbose, numeric IPs
sudo iptables -t nat -L -v -n            # NAT table
sudo iptables -L --line-numbers           # show rule numbers

## Save and restore rules
sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null
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

## --- Illustrative IPv4 rules, not a complete host policy ---

## Learning syntax only: use an isolated network namespace.
## Do not flush a managed host or container platform ruleset.
## Load a reviewed complete policy with a tested recovery route.

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

## 8. Rate-limit diagnostic logging before the final drop
sudo iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-DROP: " --log-level 4
sudo iptables -A INPUT -j DROP

## --- Port forwarding ---
## Forward port 80 on the host to port 8080 on 192.168.1.10
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.10:8080
sudo iptables -A FORWARD -p tcp -d 192.168.1.10 --dport 8080 -j ACCEPT

## --- NAT masquerade (outbound NAT for a LAN) ---
## Packets from 192.168.1.0/24 going out eth0 are NATted
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
sudo sysctl -w net.ipv4.ip_forward=1      # enable IP forwarding

## --- Rate limiting SSH: place before a broad SSH ACCEPT rule ---
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

## Isolated-lab example; not a complete production web policy
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
        meta l4proto ipv6-icmp accept # exercise only; review required ICMPv6 policy

        # SSH (rate limited)
        tcp dport 22 ct state new limit rate 3/minute burst 5 packets accept
        tcp dport 22 drop

        # HTTP and HTTPS
        tcp dport { 80, 443 } accept

        # Log drops
        limit rate 5/minute log prefix "nftables-DROP: "
        drop
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
sudo nft list ruleset | sudo tee /etc/nftables.conf >/dev/null
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
sudo ufw limit ssh                # inspect the installed version’s rate-limit policy
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

## Isolated lab: log a bounded sample from the documentation test source
## This shows packets reaching this rule, not proof that they are later dropped.
sudo iptables -I INPUT 1 -s 192.0.2.10 -p tcp --dport 8080 -m limit --limit 2/second --limit-burst 4 -j LOG --log-prefix "DEBUG-INPUT: " --log-level 7
journalctl -f | grep "DEBUG-INPUT"
## Remove this exact owned rule rather than assuming its line number is unchanged
sudo iptables -D INPUT -s 192.0.2.10 -p tcp --dport 8080 -m limit --limit 2/second --limit-burst 4 -j LOG --log-prefix "DEBUG-INPUT: " --log-level 7

## Watch iptables counters update in real time
watch -n 1 'iptables -L INPUT -v -n'

## nftables tracing (more powerful)
sudo nft insert rule inet filter input tcp dport 22 meta nftrace set 1 # remove by recorded handle
sudo nft monitor trace

## Check if connection tracking is the issue
sudo conntrack -L                  # current connection tracking table
sudo conntrack -L | grep ESTABLISHED | wc -l
cat /proc/sys/net/netfilter/nf_conntrack_count   # current tracked connections
cat /proc/sys/net/netfilter/nf_conntrack_max     # maximum tracked connections
## Investigate allocation failures, timeout policy, and memory before tuning.
## Do not increase limits solely because usage is close to the current maximum.
```

Understanding the netfilter architecture — hooks, tables, chains — means you can read and write firewall rules at the level where they actually work, diagnose unexpected drops, and understand the rules that Docker, Kubernetes, and cloud agents add automatically to your system.

## Establish ownership before editing the packet path

A host may have several components contributing rules: the operating-system firewall manager, a container runtime, a cluster network implementation, a VPN, or an administrator's script. Start by identifying those owners. A command that flushes the global ruleset can remove someone else's isolation, forwarding, or translation state even if the new input-chain rules look correct in isolation.

Inspect the active backend and the manager's configuration. The `iptables` command may use a legacy backend or an nftables compatibility backend. A familiar command name does not prove which rules are active. Read both the manager's view and the kernel ruleset when necessary, and document which interface is authoritative for changes. Mixing manual edits with a reconciler can produce changes that disappear at the next reload.

Use a disposable network namespace or virtual machine for the exercises below. A remote administration session is a poor place to discover that a new policy blocks its own connection. For a real change, retain an authorised recovery channel, save the relevant configuration, and define a rollback that does not depend on the connection being changed. A transaction can prevent partial updates; it cannot prevent a logically incorrect complete update.

## Follow the packet's direction and final verdict

First determine whether the packet is addressed to the local host, forwarded through it, or generated by it. An input-chain rule does not describe every packet that enters a physical interface. A container's published service may involve destination translation and forwarding, so a host input rule alone may not implement the intended boundary.

Within nftables, base-chain hooks and priorities determine where evaluation occurs. An `accept` verdict in one base chain does not necessarily bypass another base chain attached later to the same hook. A later applicable drop can still reject the packet. This is a reason to inspect the complete relevant path rather than stopping at the first rule that appears to allow traffic.

Connection tracking also changes interpretation. A rule admitting established traffic can preserve an existing session while a new connection with the same addresses and port is blocked. Testing only the session used to apply the change may therefore miss the new-connection failure. Test a fresh permitted connection as well as a deliberately denied one.

Address families matter. An IPv4-only test does not demonstrate that the IPv6 policy is correct. IPv6 depends on ICMPv6 functions beyond echo requests, including neighbour discovery and path-related signalling. A copied policy that admits ping but blocks required control traffic can create confusing partial connectivity. Use a reviewed policy appropriate to the actual role of the host rather than assuming one minimal snippet fits every deployment.

## Worked example: a policy test matrix, not a security score

Consider a fictional service with twelve defined connection tests. Four should allow the web endpoint from approved networks, three should allow the management path from its designated source, three should deny unexpected inbound ports, and two should verify the required IPv6 control path. These categories sum to twelve: 4 + 3 + 3 + 2.

The chart shows those test counts. It is a coverage plan, not evidence that the service is secure. Passing twelve tests establishes only that those twelve cases behaved as expected under the tested configuration. It does not cover every address, timing, protocol feature, container path, or future rule interaction.

For each row, record source namespace or host, destination address, protocol, port where relevant, connection state, expected verdict, observed result, and the matching counter or trace. Keep expected-deny cases separate from accidental timeouts caused by a missing listener. A refused connection may mean the packet reached a host with no listening application; it is not interchangeable with a firewall drop.

Suppose eleven tests pass and the new IPv6 management connection fails. Reporting 91.7% success would hide the important fact that a required administration path is unavailable. The acceptance decision should depend on the failed case's meaning, not an averaged score. The count helps ensure the matrix was executed; the requirements determine whether the change is acceptable.

## A namespace lab that leaves the host policy alone

Prepare two disposable Linux network namespaces connected by a veth pair, or use an equivalent isolated virtual-machine network. Use documentation addresses and a local test service. Keep the namespace names unique to the exercise and confirm that no production interface or service is involved. Creating namespaces and filtering rules requires suitable privileges; use only an environment in which you are authorised to make those changes.

Inside the server namespace, inspect the empty or exercise-owned ruleset and create a dedicated table. Add an input base chain with the intended default, a loopback allowance, established-connection handling, and one explicit test-service allowance. Include the control traffic needed by the address families under test. Load the complete exercise table from one file rather than constructing a production policy through an unreviewed sequence of shell commands.

Before applying the file, use `nft -c -f exercise.nft` to check whether the proposed rules can be accepted. A successful check does not prove that the policy expresses the intended access. Apply the file inside the namespace, run the allowed and denied tests, and inspect counters. Give each diagnostic rule an identifiable comment so it can be found and removed by its own handle.

Then change one condition: the permitted source, destination port, or chain priority. Predict the result before running the connection test. Trace only the bounded test traffic. Avoid an unlimited logging rule on a busy host; logging itself can create load and expose connection metadata. Remove the namespace and its exercise artifacts when finished through the same owned setup procedure.

## Make a reload and a reboot part of the reasoning

Runtime behavior and persisted configuration can diverge. In firewalld, runtime and permanent settings are distinct. A change made only to one does not prove that the other contains it. Decide which state should be committed, apply it through the supported workflow, and verify what a reload will produce before relying on persistence.

The same principle applies to direct nftables configurations and other managers. Saving a kernel listing to a file is not enough unless the boot process actually loads that file and no later component overwrites the relevant rules. Confirm the service ownership and ordering in the environment being operated.

A rollback should restore the intended policy, not indiscriminately erase all filtering. Preserve the previous reviewed configuration and record which table or manager owns the change. If other components update their rules concurrently, a whole-system snapshot restore may overwrite legitimate changes. Narrow the ownership boundary where possible and coordinate when it cannot be narrowed.

In an isolated rehearsal, reload the manager and repeat the important connection tests. If reboot persistence is part of the requirement, test it in a safe environment. A rule that works only until the next restart is an incomplete operational change even when its initial packet behavior is correct.

## Diagnose with bounded evidence

Counters indicate that packets matched a rule, but they do not by themselves identify a complete connection's outcome. A counter may include retransmissions or unrelated traffic. Record counter differences during a controlled test and correlate them with the client result and server listener state.

A trace can show rule evaluation more precisely, but it needs a narrow selector and a cleanup plan. Verify that the trace-enabling rule is reached before the rule suspected of dropping the packet. Adding tracing after an earlier drop cannot reveal a packet that never reaches it. Use rule handles or a dedicated diagnostic chain rather than deleting a guessed line number after concurrent edits.

Connection-tracking pressure is another hypothesis, not an invitation to increase limits blindly. Check current usage, errors, traffic characteristics, timeout behavior, and the memory consequences of a larger table. A large number of legitimate long-lived connections and a burst of unwanted connections require different responses.

Finish the exercise with a short policy record: the trust boundary, rule owner, tested address families, matrix results, reload behavior, and recovery route. That record makes the firewall a maintained part of the service rather than a set of commands that happened to leave the current session connected.

## Primary references

- [Netfilter: configuring nftables chains](https://wiki.nftables.org/wiki-nftables/index.php/Configuring_chains)
- [Netfilter: atomic rule replacement](https://wiki.nftables.org/wiki-nftables/index.php/Atomic_rule_replacement)
- [firewalld: runtime and permanent configuration](https://firewalld.org/documentation/configuration/runtime-versus-permanent.html)
