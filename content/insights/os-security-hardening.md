---
title: "Linux Security Hardening: A Production Server Checklist"
description: "The practical steps to harden a Linux server before production — from SSH configuration and user privilege reduction to kernel parameter tuning, audit logging, and fail2ban."
date: 2027-10-18
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 20
format: article
---

Security hardening is not a one-time event. It is a posture — a set of decisions made deliberately, documented, and maintained. This lesson covers the baseline hardening that every production Linux server should have, regardless of what workload it runs. More specialised controls (SELinux, AppArmor, audit framework) are covered in subsequent lessons.

## Start with a Minimal Install

The most effective security measure is not installing software you do not need. Every package is a potential vulnerability surface.

```bash
## List installed packages and review
dpkg -l | grep "^ii" | wc -l     # Debian/Ubuntu
rpm -qa | wc -l                   # RHEL/Fedora

## Find packages not needed for your workload
apt list --installed | grep -v "automatic"

## Remove unnecessary packages
apt autoremove --purge cups bluetooth avahi-daemon
## cups = printing daemon (never needed on a server)
## bluetooth = obvious
## avahi-daemon = mDNS/Bonjour — usually not needed
```

## User and Privilege Management

```bash
## Lock unused system accounts
for user in games ftp lp mail news uucp; do
    passwd -l $user 2>/dev/null && echo "Locked: $user"
done

## Find accounts with empty passwords (security risk)
awk -F: '($2 == "" ) {print $1}' /etc/shadow

## Find accounts with UID 0 (root) other than root itself
awk -F: '($3 == "0") {print $1}' /etc/passwd

## Set password aging policy
## /etc/login.defs
PASS_MAX_DAYS   90     # maximum password age
PASS_MIN_DAYS   1      # minimum between password changes
PASS_WARN_AGE   14     # warn 14 days before expiry

## Apply to existing users
chage -M 90 -m 1 -W 14 username

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
## /etc/ssh/sshd_config — minimum production settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers your-username
ClientAliveInterval 300
ClientAliveCountMax 2
X11Forwarding no

## Validate and reload
sudo sshd -t && sudo systemctl reload sshd
```

## Firewall Configuration

Every server should have a firewall even on a private network. Lateral movement attacks assume that internal servers are unprotected.

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
firewall-cmd --set-default-zone=drop
firewall-cmd --permanent --zone=public --add-service=ssh
firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --permanent --zone=public --add-rich-rule='rule family="ipv4" source address="10.0.1.0/24" port port="5432" protocol="tcp" accept'
firewall-cmd --reload
```

## Kernel Parameter Hardening

```bash
## /etc/sysctl.d/99-security.conf

## ── Network hardening ──
## Disable IP forwarding (unless this is a router)
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

## Prevent source routing (attacker-controlled routing)
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0

## Ignore ICMP redirects (prevent routing table poisoning)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

## Enable SYN cookies (prevent SYN flood)
net.ipv4.tcp_syncookies = 1

## Ignore ICMP broadcast (smurf attack)
net.ipv4.icmp_echo_ignore_broadcasts = 1

## Log martian packets (packets with impossible source IPs)
net.ipv4.conf.all.log_martians = 1

## ── Kernel hardening ──
## Disable kernel core dumps for setuid programs
fs.suid_dumpable = 0

## Restrict ptrace (prevents unprivileged process debugging)
kernel.yama.ptrace_scope = 1

## Enable ASLR (address space layout randomisation)
kernel.randomize_va_space = 2

## Restrict kernel logs to root
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2

## Restrict /proc to own processes
## (set proc-hidepid in /etc/fstab instead)

sysctl -p /etc/sysctl.d/99-security.conf
```

## File System Hardening

```bash
## /etc/fstab hardening — mount options for security-sensitive filesystems
## /tmp — executable code should not run from /tmp
tmpfs /tmp tmpfs defaults,rw,nosuid,nodev,noexec,size=2G 0 0

## /var/tmp
tmpfs /var/tmp tmpfs defaults,rw,nosuid,nodev,noexec,size=512M 0 0

## /dev/shm
tmpfs /dev/shm tmpfs defaults,nosuid,nodev,noexec 0 0

## Check for world-writable files (security risk — anyone can write them)
find / -path /proc -prune -o -path /sys -prune -o -type f -perm -0002 -print

## Check for SUID/SGID binaries (escalation risk)
find / -path /proc -prune -o \( -perm -4000 -o -perm -2000 \) -type f -print

## Remove unnecessary SUID bits
chmod -s /usr/bin/at      # only if at scheduler is not needed
chmod -s /usr/bin/wall    # only if wall messaging is not needed
```

## fail2ban — automated intrusion prevention

```bash
apt install fail2ban

## /etc/fail2ban/jail.local (overrides jail.conf)
[DEFAULT]
bantime  = 3600        # ban for 1 hour
findtime = 600         # look back 10 minutes
maxretry = 5           # 5 failures before ban
backend = systemd

[sshd]
enabled = true
port    = 22
logpath = %(sshd_log)s
maxretry = 3

## Optional: ban for longer on repeat offenders
[sshd-aggressive]
enabled = true
port    = ssh
filter  = sshd
bantime = 86400        # 24 hours
maxretry = 1
findtime = 3600

systemctl enable --now fail2ban
fail2ban-client status sshd       # view current bans and stats
fail2ban-client set sshd unbanip 1.2.3.4   # unban if you locked yourself out
```

## Package Updates and Patch Management

```bash
## Check for security updates
apt list --upgradable 2>/dev/null | grep -i security

## Apply security updates only (Debian/Ubuntu)
apt install unattended-upgrades
dpkg-reconfigure unattended-upgrades   # enable automatic security updates

## Configuration
## /etc/apt/apt.conf.d/50unattended-upgrades
Unattended-Upgrade::Automatic-Reboot "false";  # do NOT auto-reboot in production
Unattended-Upgrade::Mail "ops@company.com";

## RHEL/Fedora equivalent
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
## Run weekly via cron

## Check for open ports (confirm against expected)
ss -lntp
nmap -sV -p- localhost   # full port scan of localhost
```

## Hardening Verification Checklist

Run this after any new server provisioning:

```bash
## 1. Root SSH disabled
grep "PermitRootLogin" /etc/ssh/sshd_config | grep -v "#"

## 2. Password auth disabled
grep "PasswordAuthentication" /etc/ssh/sshd_config | grep -v "#"

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
systemctl is-enabled unattended-upgrades   # or dnf-automatic

## 8. Lynis score
sudo lynis audit system --quiet | grep "Hardening index"
```

A new Ubuntu 24.04 LTS server with this baseline applied scores around 75–80 on Lynis. That is not perfect. Perfect does not exist. What this achieves is: every common attack vector is addressed, every unexpected change generates a log entry, and recovery from compromise is faster because the blast radius is smaller.
