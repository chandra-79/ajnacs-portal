---
title: "Multipass: Instant Ubuntu VMs for Cloud Engineers Who Test Locally"
description: "Canonical's Multipass closes the gap between local development and cloud deployments — by giving you a real Ubuntu VM in under 30 seconds. Here's how I use it and why it belongs in every cloud engineer's toolkit."
date: 2026-09-21
tags: ["Developer Tools", "Infrastructure", "Cloud Architecture"]
format: article
---

The gap between your local machine and a cloud VM isn't just networking. It's the environment. You can write a cloud-init script, test it in a Docker container, and still get surprised when it behaves differently on a fresh Ubuntu 24.04 VM in Azure. The operating system, the systemd version, the network interface names — these things matter, and containers don't replicate them.

[Multipass](https://multipass.run) is Canonical's answer to this. It spins up a full Ubuntu VM in under 30 seconds, managed through a clean CLI, and costs you nothing. I've been using it for cloud-init validation, Kubernetes local clusters, and network topology testing. It has changed how I prototype.

## What Multipass Actually Is

Multipass is not a container runtime. It launches real virtual machines — using HyperKit on macOS, Hyper-V on Windows, and KVM on Linux — with the Ubuntu cloud image. That matters. You get a genuine Ubuntu instance with systemd, a real kernel, proper networking, and all the surface area a cloud VM would have.

The default instance launches with 1 CPU, 1 GB RAM, and 5 GB disk. You can override:

```bash
multipass launch --name dev-node --cpus 4 --memory 8G --disk 40G 24.04
```

Shell into it immediately:

```bash
multipass shell dev-node
```

Copy files in:

```bash
multipass transfer ./my-script.sh dev-node:/home/ubuntu/
```

The lifecycle is clean. Launch, use, stop, delete. No lingering state, no orphaned containers.

## The Cloud-Init Use Case

The reason I reach for Multipass most often is **cloud-init validation**. Every cloud provider uses cloud-init to configure VMs at first boot — installing packages, writing files, creating users, running scripts. Writing that YAML correctly the first time is harder than it looks.

With Multipass, you can inject a cloud-init file directly at launch:

```bash
multipass launch --cloud-init ./my-cloud-init.yaml --name test-vm 22.04
```

The VM boots, runs your config, and you can SSH in immediately to verify the result. Iterate locally until it's right, then deploy to Azure or AWS with confidence. I've caught a dozen cloud-init edge cases this way that would have burned 20 minutes each on a real cloud instance.

## Kubernetes Without the Overhead

MicroK8s and K3s both work cleanly inside Multipass VMs. The common pattern for a quick local cluster:

```bash
multipass launch --name k8s-master --cpus 2 --memory 4G 24.04
multipass shell k8s-master
sudo snap install microk8s --classic
microk8s enable dns storage ingress
```

This isn't replacing a proper Kubernetes dev setup for complex scenarios, but for validating Helm charts, testing RBAC policies, or checking resource quotas before a production deploy — it's fast and disposable.

## Networking That Mirrors Cloud Topology

One underused feature is Multipass's bridged networking. You can attach VMs to your host network adapter, giving each VM a real IP on your LAN. This lets you model multi-node topologies — a load balancer VM fronting two application VMs — without any extra tooling.

```bash
multipass launch --network en0 --name lb-node 24.04
multipass launch --network en0 --name app-node-1 24.04
multipass launch --network en0 --name app-node-2 24.04
```

For testing HAProxy configurations, service mesh concepts, or DNS resolution between nodes — this is more reliable than trying to wire up containers across bridge networks.

## What Multipass Doesn't Do

It's not Vagrant. There's no ecosystem of provider-agnostic provisioning, no Vagrantfile equivalent for sharing reproducible environments. If your team needs that contract, Vagrant or devcontainers serve better.

It also doesn't support non-Ubuntu images out of the box, though the community has workarounds. If you need CentOS or Debian specifically, Multipass will frustrate you.

## Where It Fits in a Cloud Engineer's Workflow

The way I use Multipass: anything I'm about to deploy to a cloud VM gets tested here first. Cloud-init configs, bootstrap scripts, Ansible playbooks, systemd service definitions. The 30-second launch time removes the friction from testing, and the clean teardown means I'm never guessing what state a test environment is in.

It's a simple tool that solves a real problem. In a landscape full of tools that solve imaginary ones, that's worth something.

*Using Multipass in an interesting way? I'd like to hear about it — [drop me a note](/contact).*
