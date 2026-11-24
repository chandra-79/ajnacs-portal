---
title: "gRPC vs REST: Choosing the Right API Protocol for Microservices"
description: "REST and gRPC serve different needs. REST's broad tooling and human-readability suit external APIs and browser clients. gRPC's efficiency and strong contracts suit high-throughput internal service communication."
date: 2026-12-16
tags: ["Architecture", "Cloud Architecture"]
format: article
---

REST is the default for APIs. Most developers understand it, browser clients support it natively, and the tooling ecosystem is extensive. gRPC offers generated contracts and streaming patterns; its performance depends on the workload, and browser use requires a compatible gRPC-Web or gateway path.

The question is not which is better — it is which fits the specific communication pattern.

## Where REST has a genuine advantage

**External APIs (developer-facing)**: when your API consumers are external developers building against your platform, REST's accessibility matters. Developers can explore a REST API with curl, Postman, or a browser's developer tools without any setup. JSON is readable by humans and machines. OpenAPI documentation is well-tooled and widely understood. gRPC requires a client library and a `.proto` file to do anything useful.

**Browser clients**: native browser support for HTTP/1.1 REST is universal. Native gRPC depends on transport features that browser networking APIs do not expose directly; gRPC-Web or a gateway adapts the interaction. For applications serving browser clients, REST eliminates a translation layer.

**Simple request-response with varied response shapes**: REST's flexibility in response shape (return exactly the fields needed for this endpoint) can be an advantage when response structures vary significantly across use cases. GraphQL addresses this more systematically; REST handles it reasonably for simpler cases.

## Where gRPC has a genuine advantage

**High-throughput internal service communication**: gRPC commonly uses Protocol Buffers, whose compact encoding can reduce payload size and serialization work for some schemas; measure the actual workload rather than assuming a fixed multiplier. At high request volumes, this difference matters. For services making millions of calls to each other daily, the serialization efficiency compounds.

**Strongly typed contracts**: `.proto` files define the service interface with explicit types. Client and server code is generated from the proto definition. Both sides must conform to the same contract. Generated types can catch interface mistakes earlier, while semantic validation and compatibility tests remain necessary.

**Streaming**: gRPC supports server streaming (server sends a stream of responses to one request), client streaming (client sends a stream of requests), and bidirectional streaming. These patterns are used for real-time data feeds, progress reporting on long-running operations, and high-frequency sensor data. REST's request-response model requires polling or WebSockets for equivalent patterns.

**Deadline propagation**: gRPC has built-in deadline (timeout) propagation. Propagation support and defaults vary by language implementation; verify and configure the behaviour explicitly. REST doesn't have this natively — you implement it explicitly in each service.

## A practical split

A common architecture pattern: gRPC for internal service-to-service communication; REST for the external API layer exposed to consumers and browsers. An API gateway (Envoy, AWS API Gateway, or similar) translates REST requests from external clients to gRPC for internal routing.

This gives you gRPC's efficiency where it matters most (high-volume internal traffic) while maintaining REST's accessibility where it matters most (external developer experience).

## Schema evolution

Protobuf has built-in backward and forward compatibility rules:
- New fields are optional by default; old clients that don't know about them can safely ignore them
- Field numbers must not be reused (even after a field is removed)
- Renaming a field can preserve binary wire compatibility, but can break generated source APIs or JSON mappings

REST with JSON has no built-in schema evolution mechanism. Backward compatibility depends on convention and testing. This is manageable but requires discipline.

The tradeoff: gRPC's schema evolution requires maintaining the `.proto` file and the generated code in sync. REST's evolution is more ad-hoc but requires more testing to catch breaking changes.

## Tooling maturity

REST tooling is more mature and more broadly available. API gateways, API management platforms, testing tools, and documentation generators all have excellent REST support. gRPC tooling is catching up but is not at parity everywhere.

For teams with limited experience with gRPC, the tooling learning curve is a real cost. For teams building high-throughput internal infrastructure, the efficiency benefits typically justify the investment.

*Choosing an API protocol for a new service or evaluating whether to migrate a REST service to gRPC? The right answer depends significantly on the traffic patterns and client types. [Happy to think through the specifics.](/contact)*

## Benchmark the contract you actually intend to run

Protocol choice is not a benchmark result. Payload shape, compression, client runtime, connection reuse, server work, and network conditions can all change the comparison. A small protobuf message can be more compact than an equivalent JSON representation, but a universal size or CPU multiplier is not defensible. Measure representative messages and the complete call path rather than repeating a ratio from a different workload.

For a synthetic planning example, assume one response encodes to 1,200 bytes as JSON and 700 bytes in protobuf. At 100,000 responses, that is 120,000,000 and 70,000,000 payload bytes respectively, a 50,000,000-byte difference. In decimal megabytes the totals are 120 MB and 70 MB. These assumptions exclude headers, TLS, compression, retransmissions, and request traffic. The chart is an arithmetic exercise, not a published performance measurement or a prediction for a particular API.

To replace those assumptions, build equivalent request and response models, encode the same dataset, and report both compressed and uncompressed sizes if compression is deployed. Measure serialization cost separately from end-to-end latency. Reuse connections in both clients and include a warm-up phase. Record concurrency, message sizes, CPU allocation, runtime versions, and whether the server performs realistic database work. A protocol advantage can disappear behind a slow query, while a small per-call saving can matter on a busy internal path.

## Treat browser access as an architecture decision

Browsers support HTTP/2, but their networking APIs do not expose every capability used by native gRPC. gRPC-Web provides a browser-oriented protocol and commonly uses a compatible proxy or gateway. The supported streaming modes depend on the chosen client and deployment path. Confirm them in the versioned documentation for the implementation being used.

A JSON HTTP API may be easier for a broad set of external consumers to inspect and call, but that benefit depends on the quality of its documentation and examples. A generated gRPC client may be easier for a controlled set of internal clients to use consistently. Both still need authentication, authorisation, quotas, observability, and an upgrade process. Generated code does not validate every business rule or prove that a caller has permission to perform an operation.

## Give deadlines and cancellation an explicit test

Set a realistic deadline on the outer call and check how the language implementation propagates remaining time. Some implementations propagate automatically, while others need configuration or code. A cancelled call does not automatically undo a side effect or stop every task the handler started. Application code must observe cancellation where appropriate and avoid doing expensive work whose result nobody can use.

Use a disposable service chain with an artificial downstream delay. Test a response before the deadline, after the deadline, and a connection failure after the server may have committed a write. For each result, document whether the client can retry, whether the operation is idempotent, and how an unknown outcome is resolved. Apply the same business rules to the HTTP alternative so the comparison is fair.

Do not turn a transport status into a blanket retry rule. A transient connection error can occur after a write succeeded. Conversely, a validation problem will not improve by sending identical input repeatedly. Bound attempts by the overall deadline and use the operation's contract to decide which failures permit another attempt.

## Test schema evolution at every representation boundary

Binary protobuf compatibility depends on field numbers and types. Keep removed field numbers reserved so later developers cannot reuse them accidentally. A field rename can preserve the binary wire identity while breaking generated source code, JSON mappings, or consumers that use the textual name. Review all deployed representations rather than labelling a rename universally safe.

Create old-client/new-server and new-client/old-server tests for the combinations the product supports. Include an unknown enum value, an absent field, and a stored message written by a previous release. Decide whether field presence matters; a numeric zero and a missing value may have different business meaning even if a particular schema configuration gives them the same default representation.

The final selection should include an operational rehearsal through the actual proxy, load balancer, and telemetry path. Confirm that errors, deadlines, streaming, and message-size limits remain visible. Choose the protocol whose supported tooling and semantics fit the communication pattern, and retain the measurement and compatibility evidence that made the choice reasonable.

## Further reading and source boundaries

- [gRPC: Deadlines](https://grpc.io/docs/guides/deadlines/)
- [Protocol Buffers: proto3 language guide](https://protobuf.dev/programming-guides/proto3/)
- [gRPC-Web basics](https://grpc.io/docs/platforms/web/basics/)
