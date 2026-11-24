---
title: "Container Networking: How Containers Talk to Each Other and to the Outside World"
description: "Bridge networks, overlay networks, DNS-based service discovery, port publishing, and the iptables rules that make container networking work — and fail."
date: 2026-04-28
tags: ["DevSecOps", "Fundamentals"]
series: "Containerization from the Ground Up"
seriesOrder: 3
format: article
---

Container networking is the source of a disproportionate fraction of production incidents. Containers cannot reach each other, external traffic cannot reach a container, DNS resolution fails inside the container, or a connection that works on localhost fails in a deployed environment. These failures are diagnosable once you understand how the network is actually constructed.

## What to measure

**Latency and packet loss along the same path.** Compare identical same-node and cross-node requests at a controlled payload and load. If p99 goes from 4 ms to 12 ms, isolate DNS, service routing, encapsulation and policy handling before blaming container networking in general.

*Illustrative measurement. Any numbers in this example are hypothetical.*

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
  -p 8080:3000 \
  --name api \
  my-api:latest

## Multiple ports
docker run -d \
  -p 80:8080 \
  -p 443:8443 \
  my-service:latest

## Bind to specific host interface only
docker run -d \
  -p 127.0.0.1:5432:5432 \
  postgres:16
```

Under the hood, Docker uses iptables rules to implement port publishing. When a packet arrives at the host on port 8080, iptables rewrites the destination IP and port to the container's internal address and port 3000.

```bash
## See the iptables rules Docker created
sudo iptables -t nat -L -n -v | grep DOCKER
```

## DNS Resolution Inside Containers

Containers attached to Docker's default bridge receive a copy of the host's resolver configuration. Containers on custom networks use Docker's embedded DNS resolver, which forwards external lookups to the host's configured DNS servers. (`/etc/resolv.conf`). In production environments, this creates a common failure mode: the host is configured to use an internal DNS server that resolves private hostnames, but containers cannot reach that DNS server because of network namespace isolation or security group rules.

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

A bridge network works on one host. Containers on different hosts need a routable path between those hosts. Overlay encapsulation and direct routing are different ways to provide it.

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
docker exec -it api pg_isready -h postgres -p 5432

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

## Draw the path from the caller's point of view

Start with which process is making the request. A developer's browser, a reverse proxy container, and an application container each see a different loopback address. Write down the name the caller passes to its resolver and the socket address the server actually listens on. Record any address or port translation in between. This makes a request from the same context as the failing application more useful than a successful request from a host terminal. [Docker Engine networking overview](https://docs.docker.com/engine/network/)

In an illustrative single-host setup, the API listens on TCP 3000, joins an isolated bridge with a worker, and publishes its HTTP service as host port 8080 for local testing. The readme can document three separately testable paths.

| Caller | Address it should use | Evidence of success |
| --- | --- | --- |
| Host-side development test | Host loopback and port 8080 | HTTP status and version from the API |
| Worker on the same user-defined bridge | API container name and port 3000 | HTTP status from the worker's network context |
| API readiness check inside the API container | Loopback and port 3000, if the server listens there | Expected readiness response and payload |

If the first two fail and the third succeeds, check that the server listens on the container interface as well as loopback. If the worker works and the host fails, compare the actual published binding against the recorded host port. Record Docker Engine versus Docker Desktop and the platform version before comparing two machines. The Docker port publishing documentation describes reachability restrictions and version-dependent localhost publishing behavior. [Docker Engine port publishing](https://docs.docker.com/engine/network/port-publishing/)

## Distinguish a successful connection from a healthy request

Use a client that speaks the destination protocol. A TCP connection to PostgreSQL can establish while certificate checks, authentication, or a SQL transaction fail. An HTTP client against the database port does not test its protocol. A read-only synthetic query using a dedicated account provides a clearer result when the service owner authorizes it. Likewise, an ICMP reply establishes only that a path supports that ICMP exchange. It says little about what happens at a different protocol or port.

For HTTP, record resolution, connect, TLS, time to first byte, end-to-end time, response code, and the request sample count. Reuse the application hostname on paths where TLS and host routing depend on it. Record whether a client reused its connection. A sample with mixed fresh and reused connections includes different amounts of work. Correlate a short diagnostic run through a request ID that the service already emits. The server's application timing and edge timing can then refer to the same request.

Suppose 19 of 20 fresh connections return the expected body in 80 ms and one times out after 3 seconds. Report both 95% success and the timeout. Reporting only the successful latency turns the missing request into an invisible data point. A slow first byte with stable DNS and connect timings warrants checking the server or an intervening upstream first. An absent name or failed TLS check calls for a different owner and a different next test.

## Collect a small matrix before changing the network

For a test environment with one API and a controlled payload generator, use a known successful small response and a larger response with the same application behavior. Keep the image digest, client timeout, connection reuse, and request concurrency fixed across cells. Test from the same host, then from a second host on a documented permitted path. If a proxy is part of the route, record the proxy path as its own cell. Start with serial requests and repeat at the concurrency that actually produces the symptom.

A larger response failing only on the cross-host path suggests checking encapsulation and path MTU alongside application response limits and proxy timeouts. A slower request across all cells as concurrency rises suggests a shared bottleneck worth checking separately. Compare the full response body size and status at each hop before interpreting packet retransmission as the root cause. Use aggregates or debug logs cleared for collection. Raw captures can expose payloads and identifiers, so record only the minimum approved diagnostic evidence.

For an illustrative result, record 40 identical requests per cell, exact success counts, median successful request time, the configured timeout, and the measurement window. If 38 cross-host large requests complete and two time out, repeat the cell before accepting a fix. Then repeat all four cells after one change. Forty attempts exercise the symptom under the documented load. They provide little basis for a production tail-latency promise.

## Record where naming ends and routing starts

Treat DNS output as an observed input to the connection, especially when multiple addresses are returned. Take a read of the resolved addresses from the caller's network context and note whether failures prefer one address family. An application can use cached answers after a manual resolution succeeds. Compare logs at a common timestamp and verify the resolver path the workload actually uses. On a user-defined Docker network the embedded resolver handles container naming and forwards external lookups. [Docker Engine networking overview](https://docs.docker.com/engine/network/)

For an operational handoff, include the caller, expected and actual destination, protocol, deployed versions, last known working change, and first unsuccessful test. Do not reset every networking rule during diagnosis. A narrow, documented rollback of the last relevant configuration change gives a better comparison and preserves evidence about unrelated paths. Attach an example of one failed and one successful request with sensitive fields removed. An engineer taking over should be able to reproduce the two paths from that record and know what result would invalidate the current diagnosis.
