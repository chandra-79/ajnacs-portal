---
title: "NGINX as a Reverse Proxy and Load Balancer: A Practical Introduction"
description: "What NGINX actually does, why it's everywhere, and how to configure it as a reverse proxy and load balancer — with practical config examples you can use."
date: 2026-04-13
tags: ["Programming", "Infrastructure", "Systems", "Fundamentals"]
format: article
---

NGINX is one of those tools that shows up in almost every production system but often isn't well understood by the teams using it. It gets added to the stack, it works, and nobody looks at it again until something breaks.

This is a practical walkthrough of what NGINX actually does and how to configure it for the two most common use cases: reverse proxy and load balancing.

---

## What NGINX is doing

At its core, NGINX is a web server with a non-blocking, event-driven architecture. Unlike older web servers that spawned a new thread or process per connection, NGINX handles thousands of concurrent connections with a small, fixed number of worker processes.

That architecture is why NGINX is ubiquitous — it's efficient enough to handle high-traffic scenarios without requiring large amounts of memory or a fleet of servers.

The two roles it plays most often:

![NGINX as a Reverse Proxy](/images/nginx-reverse-proxy.png)

**Reverse proxy** — sits between clients and your application servers. Clients talk to NGINX; NGINX forwards requests to your backend and returns the response. The client never directly connects to your application.

**Load balancer** — when you have multiple backend servers, NGINX distributes incoming requests across them, preventing any single server from being overwhelmed.

![NGINX Load Balancing Architecture](/images/nginx-load-balancing.png)

---

## Setting up NGINX as a reverse proxy

The basic configuration is straightforward. Here's a minimal reverse proxy that forwards HTTP requests to an application running on port 3000:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Forward client information to the backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

A few things worth understanding in this config:

`proxy_http_version 1.1` — necessary for WebSocket support and keep-alive connections. Default is HTTP/1.0 which closes the connection after each request.

`X-Real-IP` and `X-Forwarded-For` — your backend application will see NGINX's IP as the client IP without these headers. These headers pass along the actual client IP so your app can log it correctly, do rate limiting, or geo-restrict.

`X-Forwarded-Proto` — tells your backend whether the original client connection was HTTP or HTTPS, so it can generate correct redirect URLs.

---

## Adding SSL termination

Almost every production NGINX setup terminates TLS at the proxy layer. Your backend services can then communicate over plain HTTP internally (within a trusted network), while external traffic is encrypted.

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    
    # Modern TLS config
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

## Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

In practice, most teams use Certbot with Let's Encrypt to manage certificates. Certbot can write this config for you — but understanding what it generates helps when things break.

---

## Load balancing configuration

![NGINX Architecture: Reverse Proxy & Load Balancing](/images/nginx-architecture.png)

When you have multiple backend servers, define an `upstream` block:

```nginx
upstream backend_servers {
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

By default, NGINX uses round-robin — each request goes to the next server in the list in order.

---

## Load balancing algorithms

NGINX supports several algorithms via the `upstream` block:

**Round-robin (default)** — requests distributed evenly in sequence. Simple, works well when backends are identical.

**Least connections** — routes to the server with the fewest active connections. Better when requests have variable processing time.

```nginx
upstream backend_servers {
    least_conn;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}
```

**IP hash** — same client IP always routes to the same backend. Useful for stateful applications where session data is stored locally rather than in a shared store.

```nginx
upstream backend_servers {
    ip_hash;
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}
```

**Weighted** — send more traffic to more capable servers.

```nginx
upstream backend_servers {
    server 10.0.1.10:3000 weight=3;  # Gets 3x the traffic
    server 10.0.1.11:3000 weight=1;
}
```

---

## Health checks and failover

NGINX Open Source does passive health checking — it marks a server as down when requests to it fail, and stops sending traffic there. The parameters:

```nginx
upstream backend_servers {
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 backup;  # Only used when others are down
}
```

`max_fails=3` — mark server as unavailable after 3 consecutive failures  
`fail_timeout=30s` — how long to wait before retrying the failed server  
`backup` — standby server, only receives traffic when all primary servers are down

Active health checks (proactively hitting a `/health` endpoint) require NGINX Plus (the commercial version). For open source NGINX, passive checking is what you have.

---

## Rate limiting

One of NGINX's more useful features for protecting backends:

```nginx
## Define a rate limit zone: 10 requests/second per IP, 10MB memory for tracking
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend_servers;
    }
}
```

`burst=20` — allows a burst of up to 20 requests above the rate limit before returning 429  
`nodelay` — processes burst requests immediately rather than queuing them

---

## Things that trip people up

**Timeouts.** The default NGINX timeouts are often too short for applications with slow operations. If you're seeing intermittent 504s, check these:

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

**Buffer sizes.** NGINX buffers responses from backends before sending to clients. For APIs returning large JSON payloads, the defaults may be too small and you'll see partial responses:

```nginx
proxy_buffer_size 16k;
proxy_buffers 4 16k;
proxy_busy_buffers_size 32k;
```

**The trailing slash problem.** `proxy_pass http://backend/` with a trailing slash strips the location prefix. `proxy_pass http://backend` without one doesn't. This causes subtle routing bugs that take time to diagnose.

```nginx
## These behave differently:
location /api/ { proxy_pass http://backend/; }   # /api/users → /users
location /api/ { proxy_pass http://backend; }     # /api/users → /api/users
```

---

NGINX rewards investment in understanding it. The configuration is declarative and logical once you have the mental model, and a well-configured NGINX is remarkably stable — it's one of those tools where you set it up correctly once and it quietly keeps working.

*Running into a specific NGINX configuration issue? [Reach out](/about) — happy to help think through it.*
