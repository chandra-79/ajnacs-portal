---
title: "Evaluating Astro for an Editorial Website"
description: "Compare rendering, content validation, accessible interactions and publishing workflows using a reproducible site prototype."
date: 2028-07-24
tags: ["Programming", "Software Engineering", "Developer Tools"]
format: article
---

Choosing a framework for an editorial website starts with its publishing and reading requirements. This article evaluates Astro as an option; it is not a claim that the Ajna portal uses Astro or a report of a customer migration.

The useful comparison is between complete implementations of the required workflow, including content validation, navigation, rendering and deployment.

## What Astro Actually Is

Astro renders components to HTML without requiring client hydration for every component. Static output can be generated at build time, and supported on-demand rendering is another option. Hydration directives, ordinary scripts, integrations and routing features can still add JavaScript, so inspect the actual delivered page rather than treating a framework slogan as a performance guarantee.

When you need client-side behavior, Astro uses the **islands architecture**: supported framework components opt into client hydration explicitly. Unhydrated components can contribute HTML without their framework runtime, while ordinary scripts and other configured features may still ship JavaScript. This is the right mental model for content sites — the interactivity is the exception, not the rule, and the framework reflects that.

No framework guarantees a one-second load. Images, fonts, scripts, server response and network conditions need measurement.

## Content Collections

One useful feature is **content collections**. Astro's content collection API gives you a typed, schema-validated interface for Markdown and MDX files:

```typescript
// Historical collection API illustration; consult the installed-version docs.
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

MDX is supported through the Astro MDX integration, which must be installed and configured. Drop a `.mdx` file in your content collection, import components at the top, and use them inline:

```mdx
import Chart from '../../components/Chart.astro';

## Results

<Chart data={benchmarkData} />

The numbers above show what happens when...
```

This works for occasional interactive elements in an otherwise static post. An Astro component renders HTML during the selected build-time or server-rendering path. Supported UI-framework components can hydrate when given an appropriate `client:` directive; an Astro component itself is not hydrated with that directive. The granularity is right — you don't have to make the whole page dynamic to have one dynamic element.

## State and Rendering Trade-offs

The **component hydration model** is not what React developers expect. In React, state updates schedule rendering for affected components; reconciliation and memoisation determine which work is actually performed. In Astro, each island is isolated — islands do not automatically share framework state, and passing data between client-side components requires an explicit communication mechanism, such as a suitable shared store or browser events, or a redesign that removes unnecessary coupling.

For a simple editorial prototype, cross-component state may be limited. The dark mode toggle is a simple `localStorage` preference; the command palette is a self-contained widget; the copy-to-clipboard buttons are isolated. The island model fits cleanly. For dashboards, authenticated interfaces and complex form flows, prototype shared state, routing and authentication in the candidate frameworks. These requirements change the comparison; they do not automatically establish that one framework is the correct choice.

**Freshness and rendering strategy** require explicit design. Static pages need an update trigger, while on-demand routes and caching depend on adapters and hosting capabilities. Measure build and publication latency for the chosen deployment rather than assuming a fixed page-count threshold or build time.

## When to Choose Astro

Choose Astro when:
- Your site is primarily content: blog, docs, portfolio, marketing pages
- You want to control client-side JavaScript and measure the resulting page
- You value typed, schema-validated content management at the file system level
- Your interactive requirements are isolated and don't need shared state across components
- Build times matter and you want the simplest possible mental model

Choose Next.js when:
- You're building a web application with authenticated routes, client-side data fetching, and complex state
- You need ISR or on-demand revalidation
- Your team is already comfortable with the React ecosystem and rearchitecting would be costly

Both frameworks support pages and routes. Compare their rendering modes, state model, content tooling, adapter support and team maintenance costs against the actual requirements rather than treating an editorial-versus-application label as a strict boundary.

The decision should rest on a representative prototype and the operating requirements below, not an unverified claim about this website's implementation or build speed.

*Building something with Astro, or evaluating it for a docs or content project? the evaluation can begin with your publishing requirements — [get in touch](/contact).*

## Evaluate the editorial system, not just the framework

A publishing site has several contracts. The reader needs a stable URL, readable text, useful navigation, accessible interactions, and a fast initial response. The editor needs previews, validation, scheduled publication, image handling, and a safe correction workflow. The operator needs reproducible builds, deployable artifacts, observability, and a rollback path. Framework selection should account for all three perspectives.

Astro can support a content-focused implementation, but a framework does not guarantee that every link works or that an image explains the article. Those are content and interface responsibilities. A site can ship little JavaScript yet remain difficult to use because headings are unclear, tags lead nowhere, or the reading order is confusing. Establish acceptance checks before comparing build commands.

## A hypothetical asset budget

Consider two invented implementations of the same article. Both deliver 120 KiB of HTML and CSS, 180 KiB of optimised imagery, and 40 KiB of fonts. The first additionally sends 160 KiB of compressed JavaScript; the second sends 30 KiB for the required interactions. Total transferred assets in this simplified first-load model are 500 KiB and 370 KiB respectively. The chart compares those totals.

The difference is 130 KiB, or 26% of the first implementation's total. It is not an Astro-versus-Next.js benchmark and does not establish a corresponding load-time reduction. Cache state, compression, connection quality, execution cost, rendering work, and server response affect the user experience. The exercise illustrates why measuring the delivered page is more useful than attributing speed to a brand name.

Measure representative pages: a plain essay, a chart-heavy guide, a search result, and a form. Record cold and warm cache conditions separately. Include image dimensions and reserved layout space so a fast transfer does not become a visually unstable page. Test the actual mobile layout and a lower-powered device profile rather than relying only on a desktop development server.

## Content schemas need semantic checks too

A schema can require a title and a valid date, but it cannot decide whether a chart's numbers match the text or a source supports a claim. Add checks for duplicate slugs, missing image alternatives, broken internal destinations, unsupported publication states, and figures without methodology. Keep factual review as a distinct editorial responsibility.

Scheduled publication introduces a clock and deployment policy. A page excluded at build time will not appear automatically merely because its date passes unless a rebuild or request-time mechanism runs. Define the timezone, trigger, retry behaviour, and monitoring. Confirm that drafts do not leak through search indexes, feeds, sitemap entries, or related-content cards.

Preview should render the same components and content rules as production, with an explicit way to view unpublished material. A preview that bypasses validation can hide defects until release. A preview that uses production credentials or indexes private drafts creates a different problem. Use isolated access and test the complete route from content edit to published URL.

## Progressive enhancement keeps reading resilient

Make the article and ordinary links usable before client-side code runs. A copy-link control can enhance the page, but the canonical URL should remain available. Search can use a client index for a modest corpus, while larger or more dynamic collections may need a server-backed design. The choice should reflect index size, privacy, update frequency, and the expected query experience.

For a chart, provide an accessible title, a text explanation, units, and a data table or equivalent values when exact comparison matters. An interactive tooltip alone is not sufficient for keyboard users or readers who cannot perceive the graphic. Client-side visualisation should add exploration, while the essential claim remains understandable without it.

Shared state between islands is possible through deliberate mechanisms. The design question is whether those interactions belong in separate islands or in one coherent component. A theme preference, search dialog, and article chart may be independent. A multi-step authenticated workflow might benefit from a larger application boundary. Avoid forcing either architecture into a problem it does not simplify.

## Rendering and freshness are route decisions

Static rendering can provide a simple deployment model for stable editorial pages. On-demand rendering can serve routes that need request-specific data, using an appropriate adapter and runtime. Caching and revalidation capabilities depend on the framework version, adapter, hosting platform, and route design. Verify those combinations rather than repeating a blanket statement that Astro requires every page to rebuild for every change.

The same fairness applies to comparisons. Next.js supports static export for suitable applications, and Astro supports more than static HTML. Compare the required features and constraints of the specific project. A team already maintaining a reliable publishing system may gain more from improving its content and delivery pipeline than from migrating frameworks.

## A two-day prototype exercise

Choose a small, representative fixture set: one article with code, one with a table and chart, a topic archive, a series landing page, and a scheduled draft. Include a deliberately broken link and an invalid frontmatter field. The prototype should reject or clearly report both defects. Preserve the fixtures so another implementation can be evaluated against the same inputs.

Build the required interactions, test keyboard navigation, and inspect the production artifact. Record page weight, build duration on a named machine, route coverage, and the editor steps needed to correct an article. Do not compare a warmed incremental build in one framework with a clean production build in another. The methods must match before the numbers can support a decision.

Finish with a decision record naming the constraints, alternatives, evidence, and unresolved risks. Include the cost of migration, redirect preservation, feed continuity, and editorial retraining if replacing an existing system. A framework choice is successful when it supports sustained, trustworthy publishing. The prototype should demonstrate that workflow rather than merely produce an attractive home page.

## Further reading and source boundaries

- [Astro: islands architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro: content collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro: on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Next.js: static exports](https://nextjs.org/docs/app/guides/static-exports)
