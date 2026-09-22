---
title: "Container Networking: How Containers Talk to Each Other and to the Outside World"
description: "Bridge networks, overlay networks, DNS-based service discovery, port publishing, and the iptables rules that make container networking work — and fail."
date: 2026-06-26
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 3
format: article
---

Container networking is the source of a disproportionate fraction of production incidents. Containers cannot reach each other, external traffic cannot reach a container, DNS resolution fails inside the container, or a connection that works on localhost fails in a deployed environment. These failures are diagnosable once you understand how the network is actually constructed.

## The Bridge Network: Single-Host Networking

When Docker starts, it creates a default bridge network (`docker0`). Every container attached to this bridge gets a private IP address and can communicate with other containers on the same bridge.

```bash
## Show Docker networks
docker network ls

## Inspect the default bridge
docker network inspect bridge

## Create a named bridge network (recommended over the default)
docker network create --driver bridge my-app-network

## Run containers on the same network
docker run -d --name postgres --network my-app-network postgres:16
docker run -d --name api --network my-app-network my-api:latest
```

Containers on the same named bridge network can reach each other by container name — Docker's embedded DNS resolver handles the name-to-IP translation. `postgres` resolves to the Postgres container's IP. This is service discovery for single-host deployments.

```bash
## Verify from inside a container
docker exec -it api ping postgres
docker exec -it api nslookup postgres
```

## Port Publishing: Letting Traffic In

Containers are isolated in their own network namespace. To receive traffic from the host or the outside world, ports must be published:

```bash
docker run -d \
  -p 8080:3000 \    # host_port:container_port
  --name api \
  my-api:latest

## Multiple ports
docker run -d \
  -p 80:8080 \
  -p 443:8443 \
  my-service:latest

## Bind to specific host interface only
docker run -d \
  -p 127.0.0.1:5432:5432 \   # only localhost, not external interfaces
  postgres:16
```

Under the hood, Docker uses iptables rules to implement port publishing. When a packet arrives at the host on port 8080, iptables rewrites the destination IP and port to the container's internal address and port 3000.

```bash
## See the iptables rules Docker created
sudo iptables -t nat -L -n -v | grep DOCKER
```

## DNS Resolution Inside Containers

By default, containers use the host's DNS configuration (`/etc/resolv.conf`). In production environments, this creates a common failure mode: the host is configured to use an internal DNS server that resolves private hostnames, but containers cannot reach that DNS server because of network namespace isolation or security group rules.

```bash
## Inspect DNS configuration inside a container
docker exec -it my-container cat /etc/resolv.conf

## Override DNS server for a container
docker run --dns 1.1.1.1 my-image:latest

## Set custom DNS search domains
docker run --dns-search internal.company.com my-image:latest
```

In Kubernetes, the kube-dns or CoreDNS service handles DNS for all pods. Pods are configured with `nameserver <kube-dns-cluster-ip>` in `/etc/resolv.conf`. The DNS service resolves Kubernetes service names (`my-service.my-namespace.svc.cluster.local`) to cluster IP addresses.

## Overlay Networks: Multi-Host Networking

A bridge network works on one host. Containers on different hosts need an overlay network — a virtual network that spans multiple hosts.

Docker Swarm uses overlay networks natively. Kubernetes uses a CNI (Container Network Interface) plugin — Flannel, Calico, Cilium, or WeaveNet — to implement overlay networking across nodes.

All overlay implementations face the same challenge: they must route traffic between containers on different hosts, which have different physical network addresses. The approaches differ:

- **VXLAN** (used by Flannel, Calico in some modes): encapsulates container packets in UDP packets addressed to the destination host. The destination host decapsulates and delivers to the container.
- **BGP** (used by Calico in BGP mode): distributes pod routes to all hosts via the Border Gateway Protocol. No encapsulation overhead; requires a BGP-capable network.
- **eBPF** (used by Cilium): uses Linux eBPF programs to handle packet routing at the kernel level, without iptables. Lower overhead, better observability.

## Diagnosing Container Network Issues

```bash
## Is the container running?
docker ps

## What IP does the container have?
docker inspect my-container | grep IPAddress

## Can the container reach the network?
docker exec -it my-container ping 8.8.8.8

## Can the container resolve DNS?
docker exec -it my-container nslookup google.com
docker exec -it my-container dig postgres  # resolve another container

## Is the service inside the container listening?
docker exec -it my-container ss -tulnp
docker exec -it my-container netstat -tulnp

## Can one container reach another?
docker exec -it api curl -v http://postgres:5432

## Port publishing working? From the host:
curl -v http://localhost:8080/health

## Capture traffic between containers (requires host-level access)
sudo tcpdump -i docker0 -n host <container-ip>
```

The most common root causes of container networking failures:
1. **Missing network**: two containers on different networks (cannot reach by name)
2. **Wrong port**: application listens on 3000, container published 8080 mapping to 3000, but the health check is hitting 8080 on the container directly (before port mapping)
3. **Binding to 127.0.0.1**: application inside the container binds to loopback only — other containers and the host cannot reach it. Bind to `0.0.0.0` inside the container.
4. **DNS not resolving**: container using a DNS server it cannot reach
5. **iptables rules**: security software on the host modified iptables rules Docker depends on
