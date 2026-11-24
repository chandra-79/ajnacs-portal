---
title: "Linux Security Hardening: A Production Server Checklist"
description: "The practical steps to harden a Linux server before production — from SSH configuration and user privilege reduction to kernel parameter tuning, audit logging, and fail2ban."
date: 2027-08-18
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 20
format: article
---

Security hardening is not a one-time event. It is a posture — a set of decisions made deliberately, documented, and maintained. This lesson covers a baseline review to adapt to the distribution, workload, and threat model. More specialised controls (SELinux, AppArmor, audit framework) are covered in subsequent lessons.

## Start with a Minimal Install

Removing unused software can reduce the maintenance and attack surface. Every package is a potential vulnerability surface.

```bash
## List installed packages and review
dpkg -l | grep "^ii" | wc -l     # Debian/Ubuntu
rpm -qa | wc -l                   # RHEL/Fedora

## Find packages not needed for your workload
apt list --installed | grep -v "automatic"

## Remove unnecessary packages
apt-get --simulate remove cups bluetooth avahi-daemon
# Review dependencies and workload requirements before an approved removal.
## cups = printing service; some server workloads legitimately need it
## bluetooth = obvious
## avahi-daemon = mDNS/Bonjour — usually not needed
```

## User and Privilege Management

```bash
## Inspect candidate accounts before changing their authentication or service use.
getent passwd games ftp lp mail news uucp
## Password locking alone does not revoke SSH keys or terminate existing sessions.
## Apply account retirement only after checking services and alternate authentication.

## Find accounts with empty passwords (security risk)
awk -F: '($2 == "" ) {print $1}' /etc/shadow

## Find UID-zero accounts other than the named root account
awk -F: '($3 == "0" && $1 != "root") {print $1}' /etc/passwd

## Inspect account aging under your approved identity policy
chage -l username
# Do not mandate arbitrary periodic password changes as a universal rule.

## Create a service account with no login shell
useradd --system --shell /sbin/nologin --home /opt/myapp myapp
## --system: UID in system range, no password, no home dir by default

## Restrict su access to wheel group members only
## /etc/pam.d/su
## Uncomment: auth required pam_wheel.so use_uid

## Ensure /etc/sudoers is valid before saving
visudo -c
```

## SSH Hardening (recap)

Already covered in L15, but critical enough to list here as a checklist:

```bash
## Illustrative sshd policy; retain tested console access and validate account names.
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
KbdInteractiveAuthentication no
MaxAuthTries 3
LoginGraceTime 30
AllowUsers your-username
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no

```

Syntax validation is necessary but does not establish that the intended account can log in. Keep a recovery session, inspect effective Match rules, and test a new connection. The service unit may be named ssh rather than sshd.

```bash
## Validate and reload in an approved change
sudo sshd -t && sudo systemctl reload sshd
```

## Firewall Configuration

Define host and network filtering according to the workload and threat model. Private addressing does not by itself establish a trusted boundary. Choose the firewall implementation used by the distribution rather than applying both examples.

```bash
## UFW (Ubuntu) — minimal web server firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment "SSH"
ufw allow 443/tcp comment "HTTPS"
ufw allow 80/tcp comment "HTTP"
## For a database server — only allow from app server subnet
ufw allow from 10.0.1.0/24 to any port 5432 proto tcp
ufw enable
ufw status verbose

## firewalld (RHEL/Fedora)
firewall-cmd --get-active-zones
# Configure the actual zone and interface; retain tested management access.
firewall-cmd --permanent --zone=public --add-service=ssh
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --permanent --zone=public --add-rich-rule='rule family="ipv4" source address="10.0.1.0/24" port port="5432" protocol="tcp" accept'
firewall-cmd --reload
```

## Kernel Parameter Hardening

```ini
## /etc/sysctl.d/99-security.conf

## ── Network hardening ──
## Disable forwarding only if the host does not route, bridge required container traffic, or provide NAT.
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

## Prevent source routing (attacker-controlled routing)
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

## Ignore ICMP redirects (prevent routing table poisoning)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

## Enable SYN cookies as a fallback defense; not complete DDoS protection
net.ipv4.tcp_syncookies = 1

## Ignore ICMP broadcast (smurf attack)
net.ipv4.icmp_echo_ignore_broadcasts = 1

## Log martian packets (packets with impossible source IPs)
net.ipv4.conf.all.log_martians = 1

## ── Kernel hardening ──
## Disable kernel core dumps for setuid programs
fs.suid_dumpable = 0

## Restrict ptrace according to Yama policy; verify debugger requirements
kernel.yama.ptrace_scope = 1

## Enable ASLR (address space layout randomisation)
kernel.randomize_va_space = 2

## Restrict kernel logs to root
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2

## Restrict /proc to own processes
## Evaluate the procfs hidepid mount option and monitoring requirements separately.

```

Apply the reviewed configuration from a shell in the approved environment:

```bash
sysctl -p /etc/sysctl.d/99-security.conf
```

## File System Hardening

```text
## /etc/fstab hardening — mount options for security-sensitive filesystems
## /tmp options must be tested; noexec is not a complete code-execution boundary
tmpfs /tmp tmpfs defaults,rw,nosuid,nodev,noexec,size=2G 0 0

## /var/tmp normally preserves temporary files across reboot.
## Do not replace it with volatile tmpfs without checking application semantics.

## /dev/shm
tmpfs /dev/shm tmpfs defaults,nosuid,nodev,noexec 0 0

```

The preceding lines are illustrative fstab entries, not shell commands. Avoid duplicate mounts and validate boot, application, and recovery behavior before changing them. The following read-only searches can be expensive on a large filesystem; scope them to an approved mount where practical.

```bash
## Check world-write mode bits; effective access also depends on directories, ACLs and MAC.
find / -path /proc -prune -o -path /sys -prune -o -type f -perm -0002 -print

## Check for SUID/SGID binaries (escalation risk)
find / -path /proc -prune -o \( -perm -4000 -o -perm -2000 \) -type f -print

## Review each privileged executable against package metadata and workload needs.
## Prefer an approved package or policy change; blanket bit removal can break supported behavior.
```

## fail2ban — automated intrusion prevention

```bash
apt install fail2ban
```

Example `/etc/fail2ban/jail.local` content; verify the packaged filter and backend support:

```ini
## /etc/fail2ban/jail.local (overrides jail.conf)
[DEFAULT]
# Ban for one hour
bantime = 3600
# Look back ten minutes
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port    = 22
# The systemd backend uses journal matching from the installed filter.
maxretry = 3

## Add only tested, narrowly scoped jails; shared source addresses can cause lockouts.

```

```bash
systemctl enable --now fail2ban
fail2ban-client status sshd       # view current bans and stats
fail2ban-client set sshd unbanip 192.0.2.10   # unban if you locked yourself out
```

## Package Updates and Patch Management

```bash
## Check for security updates
apt list --upgradable
# Verify security status through distribution advisories and package tooling.

## Apply security updates only (Debian/Ubuntu)
apt install unattended-upgrades
dpkg-reconfigure unattended-upgrades   # enable automatic security updates

```

Configuration fragment for `/etc/apt/apt.conf.d/50unattended-upgrades`:

```text
## /etc/apt/apt.conf.d/50unattended-upgrades
// Example: handle required reboots through a separate approved process.
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "ops@company.com";

```

```bash
## RHEL/Fedora: verify supported timer names and update_type in its configuration.
dnf install dnf-automatic
systemctl enable --now dnf-automatic-install.timer
```

## Security Scanning

```bash
## Lynis — comprehensive security audit tool
apt install lynis
sudo lynis audit system
## Produces a score and prioritised list of findings

## rkhunter — rootkit detection
apt install rkhunter
sudo rkhunter --update
sudo rkhunter --check
## Signature checks are incomplete detection; review findings and baseline integrity.

## Check for open ports (confirm against expected)
ss -lntp
nmap -sV -p- localhost   # full port scan of localhost
```

## Hardening Verification Checklist

Run this after any new server provisioning:

```bash
## 1. Root SSH disabled
sudo sshd -T | grep permitrootlogin

## 2. Password auth disabled
sudo sshd -T | grep passwordauthentication

## 3. Firewall active
ufw status          # Ubuntu
firewall-cmd --state  # RHEL

## 4. No empty passwords
awk -F: '($2 == "") {print $1}' /etc/shadow

## 5. ASLR enabled
cat /proc/sys/kernel/randomize_va_space   # should be 2

## 6. fail2ban running
systemctl is-active fail2ban

## 7. Auto security updates configured
systemctl list-timers --all | grep -E "apt-daily|dnf-automatic"
## Also inspect allowed origins/update type and actual execution logs.

## 8. Lynis score
sudo lynis audit system --quiet | grep "Hardening index"
```

A scanner score depends on tool version, profile, and workload. It is not a probability of compromise or proof of coverage. Verify selected controls, retain justified exceptions, and rehearse recovery; no checklist guarantees that every attack or unexpected change will be detected.

## Establish the workload and recovery boundary

A hardening baseline should begin with what the host does, what data it handles, and how it can be recovered. A database host, a container node, and a network router need different capabilities. Disabling IP forwarding may be appropriate for one server and break another's intended workload. A control is useful when it reduces a defined risk without silently invalidating the operating model.

Record the distribution release, support status, package sources, exposed services, privileged identities, and management path. Identify an independent recovery route before changing remote access, firewall rules, boot configuration, or mandatory access control. A tested console path is more useful than assuming a cloud recovery feature will work during an incident. Keep configuration backups and a record of the previous effective state.

Separate prevention, detection, and recovery. A firewall can restrict traffic; an audit rule can record selected events; a backup can support recovery. None substitutes completely for the others. A hardened image without a patch process decays, and a well-patched server without a restore capability still has an operational gap. Assign owners for maintaining each control after provisioning.

## Worked example: measure coverage without claiming security probability

Consider a hypothetical fleet of forty servers. Thirty have evidence that the approved baseline was checked within the review window, giving 75% coverage. After resolving ownership and scheduling gaps, thirty-eight have current evidence, giving 95%. The chart compares 75 and 95 percent. The difference is twenty percentage points, representing eight additional assessed servers.

This is synthetic arithmetic about assessment coverage, not a probability that a server is secure. A completed check can still miss a vulnerability, and a server outside the window may still have appropriate controls. Report failed controls and approved exceptions separately. A single coverage percentage should not conceal a critical finding on an important system.

Define the evidence window and the baseline version. A check from last year against an obsolete profile is not equivalent to a current assessment. Record whether the test inspected effective state or merely the presence of a configuration file. A disabled service, an overridden setting, or a failed agent can make a file-based check misleading.

## Identity changes need positive and negative tests

Locking a password does not necessarily disable every authentication method. SSH keys, certificates, directory-service credentials, scheduled jobs, and existing sessions can remain relevant. Account retirement should inventory those paths and remove authority through the appropriate systems. Test that a new unauthorized session fails and decide separately how existing sessions are handled.

Avoid universal password-age rules copied from old checklists. Current NIST digital identity guidance rejects arbitrary periodic password changes absent evidence of compromise within its scope. Organizations may have additional obligations, but those should be identified explicitly. Favor strong authentication, compromised-secret response, and a maintained credential lifecycle over a calendar ritual presented as universal security.

Sudo rules require examination of what a permitted command can do. An editor, interpreter, package manager, or script writable by the requesting user can provide much broader authority than its command name suggests. Inspect the executable, arguments, environment handling, and every writable configuration or script it uses. Syntax validation is necessary but does not establish a narrow privilege boundary.

## Firewall changes must match actual interfaces and zones

Inspect listening sockets and the intended traffic paths before writing rules. Include management access, monitoring, service dependencies, and both address families in scope. A host can be protected over IPv4 while unintentionally reachable over IPv6. Conversely, disabling IPv6 without understanding dependencies can break services. Verify the actual network design rather than treating one address family as inherently unnecessary.

With firewalld, rules belong to zones and interfaces or sources are associated with those zones. Adding a service to the public zone does not help if the interface is assigned to a different zone. Runtime and permanent configurations can also differ. Test the active configuration from an authorized external vantage point, preserve management access, and verify behavior after reload or reboot when the change requires persistence.

A local listening-port check and a remote reachability test answer different questions. Cloud security groups, host rules, routing, and application binding all affect the result. Document which layer denies or permits traffic. Do not interpret an unreachable port as proof that the application is securely configured; it may become reachable after a later network change.

## Kernel and filesystem settings require compatibility review

Apply sysctl changes from documented requirements and installed-kernel behavior. Some controls interact with routing, containers, debugging, or performance. Record the effective value and the expected effect, then test the workload. A value absent from a kernel or overridden by another configuration file should produce a visible exception rather than a silently green checklist.

Mount options can reduce certain risks, but noexec is not a complete barrier to executing code. An interpreter may read a script from a noexec filesystem. Similarly, making a temporary directory volatile can change application persistence expectations. In particular, /var/tmp is commonly expected to survive reboot. Review application semantics before replacing it with tmpfs.

Removing setuid bits or packages can break legitimate operations and may be undone by a package upgrade. Prefer an explicit package and privilege policy with tested alternatives. Inventory first, investigate why the capability exists, and make a controlled change. A broad cleanup command is not an appropriate substitute for understanding dependencies.

## Detection and patching need outcome checks

Fail2ban can reduce repeated matching attempts, but it depends on log parsing, backend behavior, and firewall integration. A shared source address can represent many legitimate users, so aggressive bans can cause collateral lockouts. Test a harmless matching event in a lab and verify both the ban and the recovery process. It is an additional control, not a replacement for strong authentication or a complete intrusion-prevention system.

An update timer being enabled does not prove that relevant security updates were installed or that a required reboot occurred. Inspect execution results, package versions, distribution advisories, and pending restart requirements. Use staged rollout and service verification appropriate to the workload. A policy against automatic reboot needs a corresponding owner and deadline for the reboot that security maintenance eventually requires.

Scanner findings are prompts for validation. A hardening score can help track a consistent profile over time, but changing tool versions or profiles changes its meaning. Confirm applicability and document exceptions. A clean rootkit scan does not establish that a host is uncompromised, and a signature match may require investigation before concluding that it is infected.

## A baseline verification worksheet

For each control, record the threat addressed, desired state, effective-state check, test result, exception, owner, and review trigger. Include a rollback procedure for changes that can interrupt service. Pilot the baseline on a representative non-production host, then verify the application and management workflows. Test recovery before rolling it across a fleet.

The durable result is a maintained, evidence-backed configuration with known exceptions. Hardening does not end at a scanner score or a long configuration file. It continues through patching, access review, detection tests, and recovery rehearsals, with the workload's actual requirements visible at every step.

## Sources and further reading

- [NIST · Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [NIST · Digital identity authentication guidance](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [Linux kernel · Network sysctl documentation](https://docs.kernel.org/admin-guide/sysctl/net.html)
- [OpenSSH · Server configuration](https://man.openbsd.org/sshd_config)
