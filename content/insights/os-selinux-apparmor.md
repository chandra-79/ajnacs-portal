---
title: "SELinux and AppArmor: Mandatory Access Control on Linux"
description: "How mandatory access control works, the difference between SELinux and AppArmor, writing and debugging policies, and why MAC is the single most effective defense against container escape and privilege escalation."
date: 2026-08-28
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 21
format: article
---

Discretionary access control — the standard Unix permission model — lets the owner of a file or process decide who can access it. Mandatory access control (MAC) removes that discretion. The kernel enforces a policy that applies regardless of what the owner wants. Even root cannot bypass a MAC policy. This is the layer that contains a compromised process and prevents lateral movement.

## Why MAC Matters

Consider a web server process that gets exploited. With discretionary controls only:
- The exploit runs as `www-data`
- `www-data` can read `/etc/passwd` (world-readable)
- `www-data` can write to `/tmp` and use it to stage further attacks
- A local privilege escalation bug can get the attacker to root
- At root, everything is accessible

With a MAC policy (SELinux or AppArmor) confining the web server:
- The exploit runs with the web server's MAC context/profile
- The MAC policy allows reading web content directories only
- `/etc/passwd`, `/home`, `/tmp` outside the web root are denied
- Even if the attacker reaches root user-space, the MAC kernel enforcement still applies
- The blast radius is contained to what the policy permits

## SELinux

SELinux (Security-Enhanced Linux) was developed by the NSA and is the default MAC system on RHEL, Fedora, and their derivatives. It uses **labels** (security contexts) on every process and file. Access is determined by policy rules that specify which process labels can perform which operations on which file labels.

```bash
## Check SELinux status
getenforce        # Enforcing, Permissive, or Disabled
sestatus          # detailed status

## Modes:
## Enforcing  — policy violations are blocked and logged
## Permissive — violations are logged but NOT blocked (use to audit what would be denied)
## Disabled   — SELinux is inactive (kernel parameter + restart required)

## Temporarily switch to permissive (useful when debugging a new service)
setenforce 0    # permissive
setenforce 1    # enforcing

## Persistent mode setting
## /etc/selinux/config
SELINUX=enforcing        # enforcing / permissive / disabled
SELINUXTYPE=targeted     # targeted (most workloads) / mls (multi-level security)
```

**Security contexts**: every process and file has a label in format `user:role:type:level`. The `type` is the key field for targeted policy.

```bash
## See process contexts
ps -eZ | grep nginx
## system_u:system_r:httpd_t:s0    1234 nginx: master process

## See file contexts
ls -Z /var/www/html
## system_u:object_r:httpd_sys_content_t:s0  index.html

## See the context of the current shell
id -Z
```

**Diagnosing and fixing SELinux denials**:

```bash
## View denials (most important tool)
ausearch -m avc -ts recent
audit2why < /var/log/audit/audit.log   # explains what policy is missing

## Generate a policy module from recent denials
audit2allow -a -M myapp_policy
semodule -i myapp_policy.pp    # install the policy module
semodule -l | grep myapp       # verify installed

## Example workflow: new service gets denied
## 1. Run in permissive, collect denials in audit.log
## 2. audit2allow -a -M myapp_policy
## 3. Review the generated .te file (do not blindly apply)
## 4. semodule -i myapp_policy.pp
## 5. Switch back to enforcing

## File context management — when you move files outside their expected location
semanage fcontext -a -t httpd_sys_content_t "/opt/mywebsite(/.*)?"
restorecon -Rv /opt/mywebsite    # apply the context

## Port context — allow httpd to bind to port 8443
semanage port -a -t http_port_t -p tcp 8443
semanage port -l | grep http    # verify

## Boolean switches — toggle common behaviour without writing policy
getsebool -a | grep httpd
setsebool -P httpd_can_network_connect on   # -P: persistent
setsebool -P httpd_can_connect_db on
```

## AppArmor

AppArmor (Application Armor) is the default MAC system on Ubuntu, Debian, and SUSE. Where SELinux uses labels on every object, AppArmor uses **profiles** — per-application text files that list what the application is allowed to do. Profiles are simpler to write and understand than SELinux policy modules.

```bash
## Check AppArmor status
sudo aa-status
## Shows: loaded profiles, processes in enforce/complain/unconfined mode

## Profile modes:
## enforce  — policy is enforced, violations are blocked and logged
## complain — violations are logged but not blocked (like SELinux permissive)

## Set a profile to complain mode
sudo aa-complain /etc/apparmor.d/usr.sbin.nginx

## Set a profile to enforce mode
sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx

## Reload profiles without restarting AppArmor
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx
sudo systemctl reload apparmor
```

**Profile structure**:

```
## /etc/apparmor.d/usr.sbin.nginx

#include <tunables/global>

/usr/sbin/nginx {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  # Capabilities
  capability net_bind_service,   # bind to ports < 1024
  capability setuid,
  capability setgid,

  # Network
  network tcp,

  # Read access to config and web content
  /etc/nginx/** r,
  /var/www/html/** r,

  # Write access to logs
  /var/log/nginx/*.log w,

  # Read/write to run directory (PID file)
  /run/nginx.pid rw,

  # Libraries
  /usr/lib/** mr,
  /lib/** mr,

  # Allow worker processes to be spawned
  /usr/sbin/nginx mr,
}
```

**Writing a profile for a new application**:

```bash
## Step 1: generate an initial profile skeleton
sudo aa-genprof /opt/myapp/bin/myapp

## Step 2: run the application through its normal workload in another terminal
## Step 3: in aa-genprof, press 'S' to scan, review each access request
## Step 4: press 'F' to finish — creates profile in complain mode

## Step 5: review the profile
cat /etc/apparmor.d/opt.myapp.bin.myapp

## Step 6: test in complain mode, review violations
sudo aa-logprof   # interactive tool to review new violations and add to profile

## Step 7: enforce when profile is complete
sudo aa-enforce /etc/apparmor.d/opt.myapp.bin.myapp
```

**Diagnosing AppArmor denials**:

```bash
## View denials
sudo journalctl -k | grep "apparmor.*DENIED"
grep "apparmor.*DENIED" /var/log/syslog

## Detailed audit
sudo ausearch -m apparmor_denied    # if auditd is installed

## Example denial:
## apparmor="DENIED" operation="file_perm" profile="/usr/sbin/nginx"
## name="/etc/ssl/private/server.key" pid=1234 comm="nginx"
## requested_mask="r" denied_mask="r" fsuid=33 ouid=0

## Fix: add the missing permission to the profile
## /etc/apparmor.d/usr.sbin.nginx
/etc/ssl/private/server.key r,

sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx
```

## SELinux vs AppArmor

| Aspect | SELinux | AppArmor |
|---|---|---|
| Default on | RHEL, Fedora, CentOS | Ubuntu, Debian, SUSE |
| Policy granularity | Very high — labels on every object | Profile per application |
| Learning curve | Steep | Moderate |
| Debugging tools | audit2allow, semanage, booleans | aa-logprof, aa-genprof |
| Container ecosystem | containerd/Docker/Kubernetes all support SELinux | Kubernetes supports AppArmor via annotations |
| Strength in practice | More comprehensive when configured correctly | Faster to write useful profiles |

Both are effective. The question is not which is theoretically better; it is which you can actually maintain for your environment. An enforced AppArmor policy you understand is better than a permissive SELinux installation you do not.

## MAC in Kubernetes

AppArmor profiles can be applied to Kubernetes pods:

```yaml
metadata:
  annotations:
    container.apparmor.security.beta.kubernetes.io/mycontainer: localhost/my-profile
```

SELinux contexts on Kubernetes:

```yaml
spec:
  securityContext:
    seLinuxOptions:
      level: "s0:c123,c456"
```

Kubernetes also supports Seccomp profiles (syscall filtering) as a complementary layer — covered in the namespaces and cgroups lesson.
