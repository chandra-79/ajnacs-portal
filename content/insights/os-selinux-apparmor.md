---
title: "SELinux and AppArmor: Mandatory Access Control on Linux"
description: "How mandatory access control works, the difference between SELinux and AppArmor, writing and debugging policies, and how maintained MAC policies add a defense layer alongside patching, capabilities, and isolation."
date: 2027-10-13
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 21
format: article
---

Discretionary access control — the standard Unix permission model — lets the owner of a file or process decide who can access it. Mandatory access control (MAC) removes that discretion. The kernel enforces a policy that applies regardless of what the owner wants. A confined root process can still be restricted by policy, but privileged policy administration, unconfined domains, and kernel compromise affect the boundary. MAC can reduce a compromised process's permitted actions; it is not a universal escape prevention guarantee.

## Why MAC Matters

Consider a web server process that gets exploited. With discretionary controls only:
- The exploit runs as `www-data`
- `www-data` can read `/etc/passwd` (world-readable)
- `www-data` can write to `/tmp` and use it to stage further attacks
- A local privilege escalation bug can get the attacker to root
- Root privileges can expand access, subject to namespaces, capabilities, MAC, and other controls

With a MAC policy (SELinux or AppArmor) confining the web server:
- The exploit runs with the web server's MAC context/profile
- The actual policy defines the files and operations allowed
- Access to other paths depends on the installed policy; do not assume these paths are universally denied
- Even if the attacker reaches root user-space, the MAC kernel enforcement still applies
- A maintained, enforced policy can restrict permitted actions; privileged policy changes and kernel vulnerabilities remain relevant

## SELinux

SELinux (Security-Enhanced Linux) was developed by the NSA and is the default MAC system on RHEL, Fedora, and their derivatives. It uses **labels** (security contexts) on every process and file. Access is determined by policy rules that specify which process labels can perform which operations on which file labels.

```bash
## Check SELinux status
getenforce        # Enforcing, Permissive, or Disabled
sestatus          # detailed status

## Modes:
## Enforcing — policy denials are enforced; dontaudit and logging configuration affect records
## Permissive — SELinux generally permits denied accesses while recording eligible denials
## Disabled   — SELinux is inactive (kernel parameter + restart required)

## Avoid disabling enforcement globally to fix one service.
## Investigate the denial and use a scoped test environment.

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
## Capture only the relevant reviewed denials before generating candidate policy.
## Do not install all observed denials as a new permission set.
semodule -l | grep myapp       # verify installed

## Example workflow: new service gets denied
## 1. Reproduce the failure in an isolated environment and inspect its denial
## 2. Check labels, existing booleans, and expected application behavior first
## 3. Review the generated .te file (do not blindly apply)
## 4. Install only a reviewed minimal policy module in the test environment
## 5. Switch back to enforcing

## File context management — when you move files outside their expected location
semanage fcontext -a -t httpd_sys_content_t "/opt/mywebsite(/.*)?"
restorecon -Rv /opt/mywebsite    # apply the context

## Inspect current port labels first; 8443 may already be an http_port_t port.
semanage port -l | grep http
## Use an approved add or modify only when the existing mapping requires it.
# semanage port -a -t http_port_t -p tcp 8443
semanage port -l | grep http    # verify

## Boolean switches — toggle common behaviour without writing policy
getsebool -a | grep httpd
## Enable only the required, reviewed permission; the general network boolean is broader.
setsebool -P httpd_can_network_connect_db on  # persistent database-connect permission
```

## AppArmor

AppArmor is commonly enabled on Ubuntu and supported on other distributions; defaults vary by release, including within the SUSE family. Inspect the active Linux security modules and installed profiles. Where SELinux uses labels on every object, AppArmor uses **profiles** — per-application text files that list what the application is allowed to do. Its path-oriented policy differs from SELinux labels; maintainability depends on application behavior and team experience.

```bash
## Check AppArmor status
sudo aa-status
## Shows: loaded profiles, processes in enforce/complain/unconfined mode

## Profile modes:
## enforce  — policy is enforced, violations are blocked and logged
## complain — most would-be denials are logged and allowed; explicit deny rules can remain enforced

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

  # Read and map the executable; this rule does not itself grant execution
  /usr/sbin/nginx mr,
}
```

**Writing a profile for a new application**:

```bash
## Step 1: generate an initial profile skeleton
sudo aa-genprof /opt/myapp/bin/myapp

## Step 2: run the application through its normal workload in another terminal
## Step 3: in aa-genprof, press 'S' to scan, review each access request
## Step 4: finish the tool, then inspect the resulting mode with aa-status

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
sudo journalctl -k --since "10 minutes ago"  # inspect AppArmor records

## Example denial:
## apparmor="DENIED" operation="file_perm" profile="/usr/sbin/nginx"
## name="/etc/ssl/private/server.key" pid=1234 comm="nginx"
## requested_mask="r" denied_mask="r" fsuid=33 ouid=0

## If the access is required and approved, add only the necessary permission to the profile
## /etc/apparmor.d/usr.sbin.nginx
/etc/ssl/private/server.key r,

sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx
```

## SELinux vs AppArmor

| Aspect | SELinux | AppArmor |
|---|---|---|
| Common deployments | RHEL and Fedora; verify release defaults | Ubuntu and other distributions; verify release defaults |
| Policy granularity | Very high — labels on every object | Profile per application |
| Policy maintenance | Requires label and domain understanding | Requires profile, path and transition understanding |
| Debugging tools | audit2allow, semanage, booleans | aa-logprof, aa-genprof |
| Container ecosystem | containerd/Docker/Kubernetes all support SELinux | Kubernetes supports the appArmorProfile security-context field |
| Effectiveness | Depends on policy coverage and enforcement | Depends on policy coverage and enforcement |

Both are effective. The question is not which is theoretically better; it is which you can actually maintain for your environment. An enforced AppArmor policy you understand is better than a permissive SELinux installation you do not.

## MAC in Kubernetes

AppArmor profiles can be applied to Kubernetes pods:

```yaml
spec:
  securityContext:
    appArmorProfile:
      type: Localhost
      localhostProfile: my-profile
```

SELinux contexts on Kubernetes:

```yaml
spec:
  securityContext:
    seLinuxOptions:
      level: "s0:c123,c456"
```

Kubernetes also supports Seccomp profiles (syscall filtering) as a complementary layer — covered in the namespaces and cgroups lesson.

## Start with the access decision that failed

A permission-denied error does not identify which control rejected the operation. Ordinary mode bits, ACLs, mount options, capabilities, namespaces, SELinux, and AppArmor can all contribute. Begin by recording the process identity, object path, requested operation, and relevant denial record. Check the ordinary permissions too. Making a MAC policy more permissive cannot repair every access failure, and it may unnecessarily widen authority.

For SELinux, inspect both the process domain and the object's label. A file copied into a custom path may have a label that does not match its intended role. Restoring an established file-context mapping may be the correct fix. For AppArmor, inspect the loaded profile and the path actually used by the process. A symlink, renamed path, or alternate executable location can affect how the policy applies.

Do not assume the package's example policy exactly matches a customized deployment. A web server writing uploads, reading certificates, and proxying to a backend needs different permissions from a static-file server. Document those functions before adding rules. The policy should express intended behavior, not simply accumulate everything the process happened to attempt during one observation window.

## Worked example: review denials before granting access

Imagine a hypothetical test produces twelve denial records. Eight concern a content directory with the wrong SELinux label, three concern an intended outbound database connection, and one concerns an unexpected attempt to read a private key. The chart shows 8,3, and 1 records by investigation category. The counts are synthetic and may include repeated events from the same underlying cause.

The right response is not to convert all twelve records into allow rules. Correct the content label using the persistent mapping, evaluate the narrow database-connect policy supported by the distribution, and investigate the unexpected key access. The final category might be a configuration error, unnecessary feature, or suspicious behavior. Its presence is a reason to understand the application, not automatically grant the request.

Counts alone do not measure risk. One denied sensitive operation may matter more than thousands of repeated harmless failures. Preserve the operation, source context, target context or path, and application behavior in the evidence. After a change, rerun the intended workflow and an explicit denied workflow to verify that the policy still enforces the boundary.

## SELinux labels and booleans are managed configuration

A persistent file-context rule describes how a path should be labeled; restorecon applies the expected label. A one-off label change can be lost during relabeling and may leave future operators confused. Record why a custom path is assigned a particular type and keep the mapping in configuration management. Verify files created later receive appropriate labels as well as the files that already exist.

Booleans expose supported policy variations, but their scope can be broader than one application action. Read the distribution documentation and inspect the current value before enabling one. A general network-connect boolean may authorize more than a database-specific requirement. Use the narrowest supported policy that matches the intended behavior and verify its effect under the actual domain.

Port labeling also needs inspection before modification. A port may already belong to a type, and changing it can affect another service. List the existing mapping and understand whether the service is binding locally or connecting outward; those are different operations. Do not treat a port-label command as a universal remedy for every network denial.

## AppArmor profiles need realistic positive tests

A profile built from a single happy-path run may miss log rotation, certificate renewal, error recovery, temporary-file handling, and graceful shutdown. Exercise those paths in a controlled environment. Review abstractions included by the profile because they contribute permissions beyond the visible local rules. The sample nginx profile above is a teaching sketch, not a complete deployable policy for every distribution build.

Complain mode can help observe behavior, but it is not the same as enforcing the intended boundary. Explicit deny rules can still have effects, and the exact logging behavior depends on policy and version. Inspect the actual mode after generating or loading a profile rather than relying on what a tutorial says a tool will do by default.

When a profile changes, verify that the running process is confined as expected. A profile loaded into the kernel does not prove every relevant process has entered it. Executable paths, profile attachment rules, and service startup behavior matter. Include process-state inspection in the rollout checklist and verify again after a restart or package update.

## Containers add another policy-distribution problem

A Kubernetes Localhost AppArmor profile must be available on the node where the workload runs. The manifest names the profile; it does not create and distribute the profile file automatically. Plan node provisioning, profile versioning, and scheduling behavior so a rescheduled workload receives the intended policy. Test the failure mode when a required profile is missing.

Use the supported appArmorProfile security-context field for current Kubernetes versions, and check compatibility with the cluster and runtime. Historical annotation examples should not be copied blindly. RuntimeDefault can provide a useful baseline where supported, while a custom profile needs maintenance and application testing. Verify the actual loaded behavior rather than assuming the manifest alone proves enforcement.

SELinux container labels and categories interact with the runtime's isolation model. Do not copy arbitrary category values from an example into a multi-tenant cluster. Follow the runtime and platform policy for allocating labels. A label that works in one test pod can weaken or break isolation when reused incorrectly elsewhere.

## A safe policy-debugging lab

Use a disposable VM or test node with a harmless sample service and synthetic files. Establish a known permitted read and a known denied read. Record the process domain or profile, file labels or paths, and the relevant audit evidence. Change only the configuration needed to permit the legitimate operation, then repeat both tests. The negative test is essential: successful application startup alone does not prove the boundary remains narrow.

Add one operational path, such as rotating a test log or restarting the service after a configuration update. Observe whether the policy permits the intended transition. If a new denial appears, classify it before changing the policy. Keep a record of each permission added and the workflow that requires it. This creates an explanation future maintainers can use when the application changes.

Avoid switching an entire production host to permissive mode as the first troubleshooting action. It changes the protection of unrelated workloads and can hide which policy adjustment was actually necessary. Use scoped testing and the distribution's supported debugging mechanisms. If an emergency exception is required, give it an owner, scope, expiry, and verification plan.

## Maintain policy as application behavior evolves

Package upgrades, new file paths, changed network dependencies, and runtime changes can all affect policy. Include confinement checks in release testing. Watch denial patterns for unexpected behavior without turning every denial into an urgent alert. Tune based on the service's expected operations and the consequence of a missed event.

The practical takeaway is to preserve the distinction between an application requirement and an observed access attempt. Mandatory access control is most valuable when the policy remains understandable and enforced. A policy that permits everything observed during a compromised or misconfigured run can look quiet while providing little containment.

## Sources and further reading

- [Red Hat · Using SELinux](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/index)
- [Ubuntu · AppArmor](https://documentation.ubuntu.com/server/how-to/security/apparmor/)
- [Kubernetes · AppArmor profiles](https://kubernetes.io/docs/tutorials/security/apparmor/)
