---
title: "Why I Built This Portfolio in Astro — and Why I'd Choose It Again"
description: "After rebuilding this site in Gatsby, then Next.js, then deciding both were overkill for a content site, I landed on Astro. Eighteen months later I understand why it was the right call — and where it genuinely struggles."
date: 2028-07-24
tags: ["Programming", "Software Engineering", "Developer Tools"]
format: article
---

I've rebuilt this site more times than I'd like to admit. Gatsby first, because that was the sensible SSG choice in 2021. Then Next.js, because the App Router promised something cleaner. Each time I ended up with a framework that was doing significant work I didn't need, adding complexity I hadn't asked for, and making me think about JavaScript bundle sizes for a site that is, fundamentally, a content site with a dark mode toggle.

Astro was the answer I arrived at by elimination. Eighteen months of daily use later — this site is built on it, maintained actively, and I would make the same decision again.

## What Astro Actually Is

Astro's core proposition is **zero JavaScript by default**. Components render to HTML at build time. No hydration, no client-side routing, no virtual DOM. A page that doesn't need interactivity ships no JavaScript — just HTML and CSS.

When you need client-side behavior, Astro uses the **islands architecture**: individual components opt into hydration explicitly, and only those components ship JavaScript to the browser. Everything else stays static. This is the right mental model for content sites — the interactivity is the exception, not the rule, and the framework reflects that.

The build output for this site with 50+ pages of content loads in under 1 second on a mid-range mobile connection. That's not an optimization story — it's the default.

## Content Collections

The feature that genuinely changed my workflow is **content collections**. Astro's content collection API gives you a typed, schema-validated interface for Markdown and MDX files:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});
```

The schema validation runs at build time. If I add a new post with a missing field or a wrong type, the build fails with a clear error message rather than silently producing a broken page. For a site with multiple content types — blog posts, thoughts, PhD notes, personal essays — this constraint is a feature, not a nuisance.

The `getCollection` API is clean and composable:

```typescript
const posts = await getCollection('blog', ({ data }) => !data.draft);
const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
```

TypeScript infers the return types from the schema, so you get autocomplete on `post.data.title`, `post.data.tags`, and all other fields without any manual type declarations. The developer experience here is genuinely good.

## MDX Without Friction

MDX works in Astro without configuration. Drop a `.mdx` file in your content collection, import components at the top, and use them inline:

```mdx
import Chart from '../../components/Chart.astro';

## Results

<Chart data={benchmarkData} />

The numbers above show what happens when...
```

This works for occasional interactive elements in an otherwise static post. The component renders at build time if it's an Astro component, or hydrates on the client if you mark it with a `client:` directive. The granularity is right — you don't have to make the whole page dynamic to have one dynamic element.

## What Took Adjustment

The **component hydration model** is not what React developers expect. In React, state flows down and everything re-renders when it changes. In Astro, each island is isolated — islands don't share state, and passing data between client-side components requires either a shared store (nanostores is the community-recommended choice) or rethinking whether you actually need that coupling.

For this site, I don't need cross-component state. The dark mode toggle is a simple `localStorage` preference; the command palette is a self-contained widget; the copy-to-clipboard buttons are isolated. The island model fits cleanly. On a more application-like site — dashboards, authenticated interfaces, complex form flows — the friction would be higher and Next.js would likely be the right call.

**No incremental static regeneration** is a real limitation for content that updates frequently. Astro is rebuild-the-whole-site for updates, which means your build pipeline needs to be fast. At 50–100 pages, Astro builds in under 2 seconds. At 10,000 pages, you'd be managing a different problem. Vercel's ISR or Next.js's partial revalidation solves this; Astro currently doesn't.

## When to Choose Astro

Choose Astro when:
- Your site is primarily content: blog, docs, portfolio, marketing pages
- You want the best possible default performance without optimization work
- You value typed, schema-validated content management at the file system level
- Your interactive requirements are isolated and don't need shared state across components
- Build times matter and you want the simplest possible mental model

Choose Next.js when:
- You're building a web application with authenticated routes, client-side data fetching, and complex state
- You need ISR or on-demand revalidation
- Your team is already comfortable with the React ecosystem and rearchitecting would be costly

The framing I find useful: Astro is optimized for the site that has pages. Next.js is optimized for the application that has routes. Both can do the other's job; neither does it as cleanly.

The website you're reading right now is the argument for Astro. It builds in 1.5 seconds, ships minimal JavaScript, and its content system is typed and validated end-to-end. For a content-first site, I haven't found anything that competes.

*Building something with Astro, or evaluating it for a docs or content project? I'm happy to share specifics about this setup — [get in touch](/contact).*
