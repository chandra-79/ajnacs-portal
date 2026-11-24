---
title: "SSH: Key Management, Configuration, Tunneling, and Hardening"
description: "How SSH works, generating and managing keys, the SSH config file, port forwarding and tunneling, jump hosts, and the hardening configuration that every production server should have."
date: 2027-06-11
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 15
format: article
---

SSH (Secure Shell) is the primary protocol for remote Linux system management. A basic SSH login is only one part of operating remote access well. Understanding SSH keys, the client config file, tunneling, and server hardening turns SSH from a login tool into a powerful, secure infrastructure primitive.

## How SSH Authentication Works

SSH supports several authentication methods. The two you care about for production systems:

**Password authentication**: the client sends the password encrypted. The server validates it through its configured authentication backend, which may include PAM. Password authentication needs protection against guessing and credential theft.

**Public key authentication** (preferred for production):
1. The user generates a key pair: a private key (kept secret in its approved signing environment) and a public key (can be shared freely)
2. The public key is placed in `~/.ssh/authorized_keys` on the server
3. The client signs session-bound authentication data using the private key
4. The server verifies that signature and checks whether the public key is authorized
5. The private key is not transmitted; stolen credentials and weak account controls remain risks

## Generating and Managing Keys

```bash
## Generate an Ed25519 key where supported by platform and policy
ssh-keygen -t ed25519 -C "chandra@workstation-$(date +%Y)"
## Creates: ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)

## RSA is still widely compatible (use when Ed25519 isn't supported)
ssh-keygen -t rsa -b 4096 -C "chandra@workstation"

## Use a passphrase for an interactive user key; protect automated signing separately
## A passphrase protects the stored key; access still depends on server authorization and other controls

## Generate a key for a specific purpose (service account, deploy key)
ssh-keygen -t ed25519 -f ~/.ssh/id_deploy_prod -C "deploy@production-$(date +%Y)"
## This prompts for a passphrase. Prefer controlled agents or workload-specific signing for automation.

## Show key fingerprint (to verify you're using the right key)
ssh-keygen -l -f ~/.ssh/id_ed25519
ssh-keygen -lv -f ~/.ssh/id_ed25519.pub   # visual fingerprint

## Copy public key to a server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
## Manually if ssh-copy-id unavailable:
cat ~/.ssh/id_ed25519.pub | ssh user@server "umask 077; mkdir -p ~/.ssh; chmod 700 ~/.ssh; cat >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys"

## Restrictive example permissions; ownership and parent-directory checks also matter
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519          # private key: owner read/write
chmod 644 ~/.ssh/id_ed25519.pub      # public key: world readable is fine
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/config
```

## The SSH Agent

An SSH agent provides signing operations for loaded keys or supported hardware-backed identities. Software keys may remain unlocked until removal, expiry, or agent termination; this is not necessarily the same as one login session.

```bash
## Start the agent (usually auto-started by desktop environments)
eval "$(ssh-agent -s)"

## Add a key (prompts for passphrase)
ssh-add ~/.ssh/id_ed25519
ssh-add ~/.ssh/id_deploy_prod

## List keys loaded in the agent
ssh-add -l

## Remove all keys from agent
ssh-add -D

## Remove a specific key
ssh-add -d ~/.ssh/id_ed25519

## Add a key with a timeout (auto-removed after 4 hours)
ssh-add -t 14400 ~/.ssh/id_ed25519
```

## The SSH Client Config File

`~/.ssh/config` lets you define per-host options and aliases, eliminating the need to remember hostnames, usernames, ports, and key files.

```
## ~/.ssh/config

## Production web servers — accessed via jump host
Host prod-web-*
    User deploy
    IdentityFile ~/.ssh/id_deploy_prod
    IdentitiesOnly yes
    ProxyJump bastion.company.com

Host bastion.company.com
    User chandra
    Port 22
    IdentityFile ~/.ssh/id_ed25519

## Specific server with alias
Host db-prod
    HostName 10.0.1.50
    User postgres
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent no                  # never forward agent to untrusted hosts

## Upgrade legacy servers instead of enabling obsolete signatures by default

## Development environment
Host dev
    HostName dev.company.internal
    User chandra
    ForwardAgent no                  # prefer destination-scoped credentials
## Global defaults
Host *
    AddKeysToAgent yes
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60          # send keepalive every 60 seconds
    ServerAliveCountMax 3           # disconnect after 3 missed keepalives
    Compression yes
    ControlMaster auto              # connection multiplexing
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m              # keep master connection 10 minutes


```

```bash
## With this config:
ssh prod-web-01           # connects as deploy via bastion
ssh db-prod               # connects as postgres to 10.0.1.50
ssh dev                   # connects to dev.company.internal
```

## SSH Tunneling and Port Forwarding

SSH tunnels route TCP connections through an encrypted SSH channel.

```bash
## LOCAL port forwarding: access a remote service as if it were local
## "Forward my local port 5432 to the postgres server's port 5432 via the bastion"
ssh -L 127.0.0.1:5432:db-internal:5432 bastion.company.com -N -f
## -N: don't execute a command (tunnel only)
## -f: go to background after authentication

## Now on your laptop:
psql -h localhost -p 5432 -U postgres mydb
## SSH encrypts the client-to-bastion segment; separately protect the bastion-to-database connection.

## REMOTE port forwarding: expose a local port on the remote server
## "Make my laptop's port 3000 accessible on the remote server's port 8080"
ssh -R 127.0.0.1:8080:localhost:3000 server.company.com -N
## Useful for demos: share a local dev server with someone on the server

## DYNAMIC port forwarding: SOCKS5 proxy
## Proxy eligible browser TCP connections through the remote server
ssh -D 127.0.0.1:1080 bastion.company.com -N -f
## Configure browser to use SOCKS5 proxy: localhost:1080
## Only proxied traffic uses the bastion; configure DNS behavior and test for bypasses.

## Jump host (ProxyJump): connect to a host via an intermediate
ssh -J bastion.company.com internal-server.company.com
## Or with the config file (ProxyJump bastion.company.com)
```

## SSH Server Hardening

Review the distribution defaults and your access requirements before changing the server. The following is an illustrative policy, not a universal production configuration:

```text
## /etc/ssh/sshd_config — illustrative hardening; review for the actual access model

## Disable root login
PermitRootLogin no

## Disable password authentication — keys only
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey

## Disable unused authentication methods
PermitEmptyPasswords no
KbdInteractiveAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

## Restrict who can log in
AllowUsers deploy chandra
## Alternative group restriction, after creating and validating membership:
# AllowGroups sshusers
## If both AllowUsers and AllowGroups are set, the account must satisfy both.

## Use modern ciphers only
# Retain maintained vendor algorithm defaults unless an approved policy requires changes.

## Limit connection attempts
MaxAuthTries 3
MaxSessions 10
LoginGraceTime 30

## Detect unresponsive clients; this is not a user-idle timeout
ClientAliveInterval 300
ClientAliveCountMax 2

## Disable X11 forwarding (unless needed)
X11Forwarding no

## Disable TCP forwarding if not needed (or restrict by user)
AllowTcpForwarding no    # set to yes if you need tunneling
AllowStreamLocalForwarding no

## Log level for audit purposes
LogLevel VERBOSE

## Custom port (obscures from automated scanners — not real security, but reduces noise)
# Port 2222  # optional; update clients and firewall together if changing it

## Restrict to IPv4 if IPv6 is not needed
# AddressFamily inet  # optional; assess IPv6 requirements before restricting
```

```bash
## Validate syntax before reloading; this alone does not prevent access lockout
sudo sshd -t
echo $?     # 0 = valid config

## Keep an existing session and independent console available; test a new login.
## Service unit names vary: ssh or sshd depending on distribution.
sudo systemctl reload sshd    # reload config, keep existing sessions
## Only restart in an approved change if reload is insufficient and console access works
sudo systemctl restart sshd

## Monitor failed auth attempts
journalctl -u ssh -f | grep "Failed"
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
```

## SSH Certificate Authority

For organisations with many servers, managing `authorized_keys` files individually is fragile. SSH certificates allow a central CA to sign user keys, and servers validate certificates against the CA and applicable principals, validity, and policy.

```bash
## Generate a CA key pair (store offline, use carefully)
ssh-keygen -t ed25519 -f /secure-offline-storage/ssh_ca -C "SSH Certificate Authority 2026"

## Sign a user's public key with the CA
ssh-keygen -s /secure-offline-storage/ssh_ca \
    -I "chandra-workstation-2026" \
    -n "chandra" \
    -V +8h \
    ~/.ssh/id_ed25519.pub
## Creates: ~/.ssh/id_ed25519-cert.pub

## Show certificate details
ssh-keygen -L -f ~/.ssh/id_ed25519-cert.pub
```

Configure the server separately in `/etc/ssh/sshd_config`, after installing the CA public key through the approved configuration process:

```text
TrustedUserCAKeys /etc/ssh/ssh_ca.pub
```

Certificate authentication still requires matching principals and server policy. Validate the daemon configuration and test authorized and denied certificates before relying on the change. SSH certificates can simplify access at scale. Short validity limits future authentication; selective revocation requires a distributed revocation policy such as a key revocation list. Removing a trusted CA affects all certificates from that CA and does not terminate existing sessions.

## Verify the server before trusting the connection

Encryption does not establish that you connected to the intended server. SSH host-key verification binds the connection to a server identity. Obtain the expected fingerprint through a trusted channel, such as the infrastructure inventory or a verified console, before accepting a new host key. A key obtained from the same untrusted network path is useful for discovery but is not independent verification of identity.

A changed host key can be legitimate after a rebuild or rotation, or it can indicate a wrong destination or interception. Investigate the change before deleting the old entry from known_hosts. Record the expected change and update the trust record through the approved process. Disabling strict checking globally makes convenient automation at the cost of losing a meaningful identity check.

User keys and host keys have different purposes. A user key proves possession of an authorized credential to the server. A host key identifies the server to the client. A user certificate and a host certificate similarly belong to different trust decisions. Keep their certificate authorities and policies distinguishable so that trusting a user CA does not accidentally become a claim about server identity.

## Inspect effective configuration rather than guessing

OpenSSH configuration can include files and conditional blocks. Client settings commonly use the first obtained value, so place specific Host entries before broad defaults. Some directives, including identity-file handling, have additive behavior that deserves separate inspection. Use the client's configuration-expansion mode to see the result for a named destination before attempting a connection.

```bash
# Read-only inspection of the selected client configuration
ssh -G db-prod

# Inspect the client version and supported key types
ssh -V
ssh -Q key

# On an authorized server, inspect effective daemon settings
sudo sshd -T
```

Server Match rules can produce different effective settings for different users or source addresses. Use the daemon's documented test context options when evaluating such a rule. A successful syntax check does not prove the intended user can authenticate, nor that an unintended user is denied. Test both positive and negative cases from an appropriate source network.

The examples above are a starting point for a disposable host or a controlled change. Service names differ by distribution, often ssh or sshd. Package defaults and supported directives also vary by version. Read the installed manual and preserve an independent console or recovery route before changing remote access. Keep an existing session open while testing a new one; do not assume a reload alone proves the new policy works.

## Worked example: certificate lifetime and stale authorization

Suppose a hypothetical user certificate is valid for eight hours, and the organization disables issuance for a departing user two hours after the certificate was issued. Without a distributed revocation entry, the certificate may remain usable for new authentication for another six hours, subject to the server's other checks. A twenty-four-hour certificate issued under the same timing assumption could remain usable for twenty-two hours. The chart compares six and twenty-two hours of remaining validity.

This is arithmetic about certificate expiry, not a measured breach window or a guarantee of access. Authorization rules, network access, key possession, and revocation may prevent use earlier. Existing sessions are a separate concern: certificate expiry does not automatically terminate a session that is already authenticated. The scenario makes the operational distinction explicit so that “short-lived credentials” is not mistaken for immediate revocation.

For real access design, record issuance policy, maximum validity, revocation distribution time, server refresh behavior, and session termination procedures. Test a revoked certificate on an isolated host. Also test loss of the issuer: short validity can improve access control while making issuer availability important for continued operations. Provide a controlled emergency access method with auditing and a recovery plan.

## Manage agents and automation credentials deliberately

An agent can perform authentication operations without sending the private key to the remote host. Forwarding the agent nevertheless exposes a capability that a compromised remote environment may misuse while the forwarded connection is available. Prefer ProxyJump for reaching an internal host when the goal is transport through a bastion, rather than forwarding a general-purpose agent to every intermediate machine.

A passphrase protects a private-key file at rest, but it does not protect every use after the key is unlocked. A compromised workstation or accessible agent socket can still be dangerous. Hardware-backed keys and confirmation requirements can provide additional controls where supported. Choose them according to the access model and recovery requirements, and test what happens when the device is lost.

An unencrypted automation key needs compensating controls: restricted filesystem access, a dedicated identity, minimal server-side authorization, rotation, and a clear owner. Do not use a personal administrative key for a deployment job. Restrict the allowed command or destination where the workflow supports it, and prevent forwarding capabilities the job does not need. A credential's comment is an inventory aid, not an enforcement mechanism.

## Tunnels have two network boundaries

For local forwarding, specify the local bind address explicitly when the listener should be private to the workstation. For example, binding to 127.0.0.1 avoids unintentionally exposing the forwarded service on other interfaces. The remote destination name is resolved and reached from the SSH server side. That distinction matters when diagnosing DNS or firewall failures.

```bash
# Example only: requires authorized access to the bastion and database
ssh -N -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:15432:db-internal:5432 bastion.company.com
```

The SSH channel protects traffic between client and SSH server. The onward connection from the server to db-internal is a separate segment and may require the database protocol's own TLS and authentication. A tunnel does not turn an unauthenticated database into an authenticated one. Remote forwarding also has server-side bind and GatewayPorts behavior; verify who can reach the listener rather than assuming it is private or public.

A SOCKS proxy covers traffic configured to use it. Applications can bypass the proxy, and DNS behavior depends on the client configuration. Do not describe a dynamic forward as automatically routing all workstation traffic. Verify the specific application path and avoid using a tunnel to bypass an organization's network access policy.

## A safe access-change lab

Use a disposable Linux VM with console access and a non-root test account. Create a dedicated key, verify the host fingerprint, and confirm a baseline login. Record the client and server versions. Apply one policy change, validate syntax, inspect effective configuration, and test a new connection. Include a denied case, such as an account outside the allowed group, to verify that the boundary is actually enforced.

Next, create a local forward to a harmless test service and inspect the listening address. Stop the service and observe the difference between establishing the SSH forward and successfully reaching its destination. ExitOnForwardFailure can detect failure to establish the forwarding listener, but it does not guarantee that every later target connection succeeds. This distinction is useful when troubleshooting an apparently healthy tunnel.

Finally remove the test key or certificate authorization, verify that a new login fails, and terminate the existing test session explicitly. Record the cleanup. The exercise should leave no permanent exception or forgotten credential. The durable lesson is that SSH security comes from identity verification, authorization, credential lifecycle, and tested recovery together, rather than from copying a large list of configuration directives.

## Sources and further reading

- [OpenSSH · Server configuration](https://man.openbsd.org/sshd_config)
- [OpenSSH · Client configuration](https://man.openbsd.org/ssh_config)
- [OpenSSH · Key and certificate utility](https://man.openbsd.org/ssh-keygen)
- [IETF · SSH authentication protocol](https://www.rfc-editor.org/rfc/rfc4252)
