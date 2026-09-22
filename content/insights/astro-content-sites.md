---
title: "Reaching for Next.js for a content site is like hiring a software architect to write a blog post"
description: "js is a well-designed framework for building web applications."
date: 2029-07-23
tags: ["Programming", "Software Engineering", "Developer Tools"]
format: article
derived: true
---

Next.js is a well-designed framework for building web applications. Reaching for it to build a content site is the equivalent of hiring a full software architecture team to publish a blog — the capability is there, but the problem doesn't require it.

Content sites — blogs, documentation, portfolios, marketing pages — have a specific shape. Most pages are static. Interactivity is the exception, not the rule. Performance is determined by how little JavaScript gets shipped to the browser, not by how efficiently the React reconciler batches state updates.

Next.js applied to this shape produces: a build pipeline that processes JavaScript bundle splitting for pages that don't need JavaScript, a hydration model that activates React on pages that are fundamentally static, and a mental model overhead — server components, client components, the router's caching behavior — that doesn't pay for itself when the pages have no client-side data fetching.

Astro was designed for this problem shape. Zero JavaScript by default, with islands of interactivity where you explicitly add them. Content collections with TypeScript-native schema validation for Markdown and MDX. Build times that scale with content count, not with application complexity.

This site is built in Astro. The build takes 1.5 seconds for 60+ pages. The JavaScript shipped to browsers is minimal. The content system gives me typed, validated content without configuration friction.

The tool should match the problem. For content-first sites, Astro matches the problem. For applications with dynamic data, complex state, and authenticated routes — Next.js is the right tool. Don't use either for the wrong job.
