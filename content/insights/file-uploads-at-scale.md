---
title: "File Uploads at Scale: Transfer, Quarantine, and Safe Release"
description: "Design resumable transfers, immutable validation boundaries, controlled serving, quotas, and deletion for user-supplied files."
date: 2028-01-28
tags: ["Programming", "Security", "Cloud Architecture", "Storage", "API Design"]
format: article
---

File upload is the feature with the widest gap between how casually it's added ("just accept a multipart POST") and how much surface it actually opens: it's the one place your system ingests *arbitrary attacker-controlled bytes by design*, it couples your request path to the slowest clients on the worst networks, and its outputs get served back to other users' browsers — which makes a naive upload feature simultaneously a DoS vector, a malware distribution channel, and a stored-XSS factory. The mature architecture is well-converged and worth having in your head *before* the sprint that adds it.

## The transfer architecture: get out of the data path

The foundational move: **application servers should broker uploads, not carry them.** The proxied-upload pattern (client → your API → storage) puts every large transfer on your request path — worker threads/connections held for the duration of slow mobile uploads (the queueing math says a few hundred slow uploaders can starve an interactive fleet), memory/disk staging pressure, and your ingress bandwidth as the ceiling. The standard answer is **direct-to-storage with presigned URLs**: the client asks your API for permission; the API authorizes (the business-level checks — quota, entitlement, content-type intent), records a pending-upload row, and returns a short-lived, tightly-scoped presigned URL (specific key, suitable API-specific constraints, short expiry — the time-boxed capability pattern from object-storage practice); the client uploads straight to the bucket; completion is signaled by client callback *and verified server-side* (never trust the callback alone — a verified object identity, version and stored metadata establish what arrived; notifications can be duplicated or delayed; the client that says "done" for an object that doesn't exist is routine). The interactive API can handle metadata while dedicated workers process payloads — the thin-control-plane/fat-data-plane split that every scalable transfer system converges on.

**Resumability** is the second-order requirement mobile reality imposes: multi-hundred-MB uploads over flaky networks need chunked, restartable transfer — multipart upload APIs (per-part presigning, parts retried independently and in parallel — which also raises throughput per the parallel-ranged-transfer physics) or the tus-class resumable protocols where you control both ends. The operational footnote from storage practice applies doubly here: **incomplete multipart uploads accrue invisibly** — the abandoned-upload lifecycle rule is mandatory hygiene, not optional cleanup.

## The gauntlet: no file is trusted until processed

Everything that arrives goes through a validation-and-processing pipeline *before* it's referenced as real, and each stage exists because of a specific attack: **verify the actual type** (magic-bytes/content sniffing, never the client's Content-Type or extension — the polyglot file that's simultaneously a valid image and valid HTML/script is a classic serving-layer exploit; allowlist types, reject ambiguity), **enforce limits early** (size caps at the presigned-policy layer and dimension/complexity caps at processing — decompression bombs, gigapixel images, and deeply-nested archives are resource-exhaustion attacks wearing file extensions; parsers get sandboxed, resource-limited workers, because image/document parsing libraries have the CVE history to earn container isolation), **scan for malware** (the async-scanning tier for anything re-downloadable by other users — quarantine-then-release semantics: the object is unavailable until scanned, per the pending→clean state machine), **strip and re-encode where the product allows** (careful image re-encoding can remove unsupported content and configured EXIF metadata that users didn't know they were sharing, per the data-minimization instincts; the transform is one control whose parser and output need validation), and **process asynchronously** (the pipeline — scan, thumbnail, transcode, index — runs on queues per the batch-and-messaging disciplines: idempotent per file, dead-lettering the poison files, with the upload's user-visible status tracking pipeline state honestly).

## Serving: the half everyone forgets

Stored files come back out, and the serving layer has its own attack surface: **isolate untrusted active content from the application origin** (the polyglot-file XSS above executes in *your* origin's context if served there — the dedicated user-content domain, a separate origin entirely, is a useful isolation pattern that still requires correct cookie and cross-origin configuration; origin separation limits page authority when cookies and cross-origin policies are configured appropriately), **force the safe headers** (`Content-Disposition: attachment` for anything not explicitly safe-to-inline, `X-Content-Type-Options: nosniff`, and Content-Type set from your *verified* type, not stored client claims), **authorize per fetch** (private files behind short-lived presigned GET URLs or an authorizing proxy — the public-bucket incident genre from storage practice is disproportionately user-upload buckets; access control at share-link granularity is a product feature with a security implementation), and **CDN with the private-origin discipline** (cached delivery for the public tier, per the caching rules — with cache keys and authorization designed together, because a CDN-cached private file is the caching-layer breach from HTTP practice).

The lifecycle rim completes it: ownership and retention per file class (the privacy-engineering deletion rails reach into upload storage — user deletion means object deletion plus CDN purge plus thumbnail-and-derivative cleanup, which is only tractable if derivatives were keyed traceably to sources), storage tiering by access pattern (the object-lifecycle economics — user uploads are textbook hot-then-cold data), and per-tenant quota metering (the usage-metering machinery, pointed at bytes). The design-review checklist compresses to five questions: does payload bypass your servers, is type verified from bytes, what happens to a malicious file at each stage, from what origin with what headers does it come back out, and who deletes it when. The feature ships in a sprint either way — the difference is whether those answers were designed or will be discovered, and thorough tests should expose these failures before a security report does.

## An upload is a state machine, not a URL

A useful upload record has an owner, tenant, intended purpose, storage key, maximum accepted size, expiration, and processing state. Separate “transfer completed” from “approved for use.” A possible lifecycle is requested, uploaded, validating, available, rejected, and expired. A database row linking an object to an invoice should only become active when the required validation state is satisfied.

Do not use a user-supplied filename as an authorization decision or as an unrestricted storage path. Generate a storage identifier and preserve a sanitized display name separately. The permission to upload one attachment must not imply permission to overwrite another tenant's object. A presigned URL is a bearer capability: anyone holding it can perform the permitted operation while it remains valid under the signing credentials and applicable policy. Avoid logging it or sending it to analytics services.

Storage API details matter. An S3 presigned PUT URL is not a general POST policy with a content-length-range condition. Select the mechanism that enforces the limits you need, sign relevant headers where supported, and verify the resulting object before release. Expiration is not one-time consumption. A still-valid URL can be reused, and uploading to an existing key can overwrite an object unless the design prevents that behavior.

This creates a subtle validation race. If a scanner approves one version and another upload replaces the same key before serving, the user may receive bytes that were never scanned. Bind the approval to an immutable object version or content digest and make the available record refer to that exact artifact. Treat callbacks and storage notifications as triggers for verification, not as proof that an arbitrary key belongs to the requesting user.

## A hypothetical interrupted-transfer calculation

Consider a fictional 500 MiB file split into ten parts of 50 MiB. The first nine parts arrive successfully, but the connection fails before the tenth part transfers. Restarting the complete upload would transfer 450 MiB already sent plus another 500 MiB, for 950 MiB total. A resumable implementation that retains the nine verified parts transfers another 50 MiB, for 500 MiB total.

The chart therefore compares 950 MiB and 500 MiB. It assumes the failed part transferred zero useful bytes and ignores request overhead, retransmissions below the application layer, checksums, and server-side copies. If part of the last chunk was sent before failure, actual traffic would be higher. The example illustrates why resuming helps; it does not promise a bandwidth reduction for every network or upload size.

Parallel parts can improve throughput when one connection is the limiting factor, but unlimited parallelism can overwhelm the client, exhaust connection pools, or trigger service limits. Bound concurrency and measure completion time, retry bytes, and memory use on representative devices. The best part size balances retry waste, request overhead, storage constraints, and the minimum practical recovery unit.

## A quarantine and validation exercise

Use an isolated development bucket with no public access and a test tenant with a small quota. Create upload intents for a valid image, a text file renamed with an image extension, an empty object, an oversized file, and a malformed image fixture. The purpose is to test control flow safely, not to collect live malware. Use approved harmless scanner test fixtures only if the scanning tool documents them.

For each upload, verify that the pending object cannot be fetched through the public application route. Complete the upload, enqueue validation, and record the exact object identity. Check declared type, allowed extension where relevant, parser behavior, dimensions, decoded resource requirements, and checksum according to the product's policy. A magic-byte match is one signal, not proof that a file is harmless or fully conforms to its format.

Kill the worker between processing and database acknowledgement. Retry the event and verify that it does not create duplicate derivatives or release a partially processed object. Then delay the scanner until the processing deadline passes. The user should see a comprehensible pending or failed state with a recovery option, not an indefinite spinner or a false success message.

Exercise duplicate completion events and an event for a nonexistent or unauthorized key. Validate the event source, then compare it with the stored intent and tenant. Test an expired upload intent whose object arrives late. Define whether it is discarded or reauthorized; do not silently attach it to a different request because the filenames happen to match.

## Processing changes the threat model

Re-encoding an image can remove unwanted metadata and constrain output, but it is not a universal sanitizer. The decoder must first process the original bytes and can itself contain vulnerabilities. Keep the decoder patched, restrict available resources and privileges, and limit outbound access where the processing task does not need it. Container isolation alone does not establish that a malicious parser input cannot affect the host.

Document transformations as part of product behavior. Removing metadata can be appropriate for profile photos but unacceptable for a workflow that preserves original evidence. Keep originals only when their purpose, access controls, and retention are explicit. If both original and derivative exist, make their permissions and lineage visible to deletion and audit workflows.

Serving content from a separate origin reduces exposure to the application's origin privileges, but cookie domain configuration and cross-origin policies still matter. Avoid broad cookies that include the user-content host. Choose download or inline behavior intentionally and verify actual response headers at the CDN edge. A private origin with an incorrectly public cache policy remains a disclosure risk.

## Account for abandoned and derived bytes

Reserve quota when an upload intent is created if concurrent uploads could otherwise exceed a tenant's allowance. Reconcile reservations against completed and expired uploads. Track original objects, multipart fragments, thumbnails, previews, and transcodes separately; counting only the original object understates storage and cleanup work. Define retention for failed and quarantined objects as well as successful ones.

A deletion exercise should begin from the business record and enumerate all derivative keys, active links, cached copies, and retained backups governed by the storage policy. Record completion or an explicit deferred state. Deleting a database reference is not the same as removing the bytes. The final acceptance evidence is a file lifecycle that remains correct under retries, replacement attempts, failed processing, and deletion.

## Further reading and source boundaries

- [Amazon S3: presigned URL semantics](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Amazon S3: multipart upload overview](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [OWASP: file upload controls](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [tus: resumable upload protocol](https://tus.io/protocols/resumable-upload)
