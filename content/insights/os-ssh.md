---
title: "SSH: Key Management, Configuration, Tunneling, and Hardening"
description: "How SSH works, generating and managing keys, the SSH config file, port forwarding and tunneling, jump hosts, and the hardening configuration that every production server should have."
date: 2027-10-15
tags: ["Programming", "Fundamentals"]
series: "Linux: A Complete Practical Course"
seriesOrder: 15
format: article
---

SSH (Secure Shell) is the primary protocol for remote Linux system management. Most engineers know `ssh user@host` and nothing else. Understanding SSH keys, the client config file, tunneling, and server hardening turns SSH from a login tool into a powerful, secure infrastructure primitive.

## How SSH Authentication Works

SSH supports several authentication methods. The two you care about for production systems:

**Password authentication**: the client sends the password encrypted. The server checks it against `/etc/shadow`. Simple but vulnerable to brute force.

**Public key authentication** (preferred for production):
1. The user generates a key pair: a private key (kept secret, never leaves your machine) and a public key (can be shared freely)
2. The public key is placed in `~/.ssh/authorized_keys` on the server
3. On connection, the server sends a challenge encrypted with the public key
4. Only the holder of the private key can decrypt the challenge and respond
5. No password is transmitted; no brute force is possible

## Generating and Managing Keys

```bash
## Generate a key pair — Ed25519 is the current recommended algorithm
ssh-keygen -t ed25519 -C "chandra@workstation-$(date +%Y)"
## Creates: ~/.ssh/id_ed25519 (private) and ~/.ssh/id_ed25519.pub (public)

## RSA is still widely compatible (use when Ed25519 isn't supported)
ssh-keygen -t rsa -b 4096 -C "chandra@workstation"

## Always use a passphrase on private keys
## The passphrase encrypts the key file at rest — without it, stealing the file = full access

## Generate a key for a specific purpose (service account, deploy key)
ssh-keygen -t ed25519 -f ~/.ssh/id_deploy_prod -C "deploy@production-$(date +%Y)" -N ""
## -N "" = empty passphrase (for automated use)

## Show key fingerprint (to verify you're using the right key)
ssh-keygen -l -f ~/.ssh/id_ed25519
ssh-keygen -lv -f ~/.ssh/id_ed25519.pub   # visual fingerprint

## Copy public key to a server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
## Manually if ssh-copy-id unavailable:
cat ~/.ssh/id_ed25519.pub | ssh user@server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

## Required permissions (SSH will refuse to work without these)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519          # private key: owner read only
chmod 644 ~/.ssh/id_ed25519.pub      # public key: world readable is fine
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/config
```

## The SSH Agent

The agent holds decrypted private keys in memory, so you enter the passphrase once per session rather than once per connection.

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

## Production web servers — accessed via jump host
Host prod-web-*
    User deploy
    IdentityFile ~/.ssh/id_deploy_prod
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

## Legacy server requiring old algorithms
Host legacy-server
    HostName 192.168.10.5
    User admin
    HostKeyAlgorithms +ssh-rsa
    PubkeyAcceptedAlgorithms +ssh-rsa

## Development environment
Host dev
    HostName dev.company.internal
    User chandra
    ForwardAgent yes                 # forward agent to dev (to pull from git etc.)
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
ssh -L 5432:db-internal:5432 bastion.company.com -N -f
## -N: don't execute a command (tunnel only)
## -f: go to background after authentication

## Now on your laptop:
psql -h localhost -p 5432 -U postgres mydb
## This connects via the encrypted tunnel to db-internal:5432

## REMOTE port forwarding: expose a local port on the remote server
## "Make my laptop's port 3000 accessible on the remote server's port 8080"
ssh -R 8080:localhost:3000 server.company.com -N
## Useful for demos: share a local dev server with someone on the server

## DYNAMIC port forwarding: SOCKS5 proxy
## Route all browser traffic through the remote server
ssh -D 1080 bastion.company.com -N -f
## Configure browser to use SOCKS5 proxy: localhost:1080
## All traffic now appears to originate from bastion.company.com

## Jump host (ProxyJump): connect to a host via an intermediate
ssh -J bastion.company.com internal-server.company.com
## Or with the config file (ProxyJump bastion.company.com)
```

## SSH Server Hardening

The default SSH server configuration is not production-ready. Every public-facing server should have these settings:

```bash
## /etc/ssh/sshd_config — production hardening

## Disable root login
PermitRootLogin no

## Disable password authentication — keys only
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey

## Disable unused authentication methods
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

## Restrict who can log in
AllowUsers deploy chandra
## Or by group:
AllowGroups sshusers

## Use modern ciphers only
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org

## Limit connection attempts
MaxAuthTries 3
MaxSessions 10
LoginGraceTime 30

## Timeout idle connections
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
Port 2222

## Restrict to IPv4 if IPv6 is not needed
AddressFamily inet
```

```bash
## Validate sshd config before restarting (prevents lockout)
sudo sshd -t
echo $?     # 0 = valid config

## Restart SSH (in a way that doesn't close your current session)
sudo systemctl reload sshd    # reload config, keep existing sessions
## Only restart if reload isn't sufficient and you have console access
sudo systemctl restart sshd

## Monitor failed auth attempts
journalctl -u ssh -f | grep "Failed"
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn
```

## SSH Certificate Authority

For organisations with many servers, managing `authorized_keys` files individually is fragile. SSH certificates allow a central CA to sign user keys, and servers trust any key signed by the CA.

```bash
## Generate a CA key pair (store offline, use carefully)
ssh-keygen -t ed25519 -f /secure-offline-storage/ssh_ca -C "SSH Certificate Authority 2026"

## Sign a user's public key with the CA
ssh-keygen -s /secure-offline-storage/ssh_ca \
    -I "chandra-workstation-2026" \
    -n "chandra,deploy" \                  # principals (valid usernames)
    -V +52w \                              # valid for 52 weeks
    ~/.ssh/id_ed25519.pub
## Creates: ~/.ssh/id_ed25519-cert.pub

## Configure server to trust the CA
## /etc/ssh/sshd_config:
TrustedUserCAKeys /etc/ssh/ssh_ca.pub
## Now any key signed by the CA is accepted — no authorized_keys management needed

## Show certificate details
ssh-keygen -L -f ~/.ssh/id_ed25519-cert.pub
```

SSH certificates are the correct solution for infrastructure with more than a handful of engineers. They enable immediate revocation (by removing the CA key from the server) and time-limited access without distributing individual authorized_keys entries across every server.
