---
title: "Choosing a Framework for a Content Site"
description: "Compare static rendering, interactive features, editorial workflows, and delivery budgets without framework guarantees."
date: 2029-07-23
tags: ["Programming", "Software Engineering", "Developer Tools"]
format: article
derived: true
---

## Choose rendering around the reader's work

A content site should deliver readable HTML, predictable navigation, accessible controls, and useful links before it asks the browser to run substantial application code. Astro's component and islands model is one way to achieve that. Next.js can also generate static routes, and a small dedicated generator can be appropriate when the content model is simple. The framework name alone does not determine performance.

Astro generally renders components to HTML and lets a project opt selected framework components into client-side hydration. That boundary is useful for a page whose article is static but whose search or calculator is interactive. Ordinary script elements, integrations, and third-party code can still add JavaScript, so “zero JavaScript by default” is a starting behaviour rather than a guarantee about a finished site.

This Ajna portal uses a dedicated static generator. The framework comparison here is a design exercise, not a claim that this portal was implemented in Astro or that it achieved a particular build-time benchmark.

## A small delivery-budget example

Assume a fictional article page transfers 40 KiB of compressed HTML, 20 KiB of CSS, 50 KiB of fonts, 90 KiB of images, and 30 KiB of JavaScript. The total is 230 KiB. Removing an unnecessary 20 KiB widget reduces that illustrative total to 210 KiB, about 8.7% less. This does not predict a matching reduction in load time. Request order, cache state, server response, image decoding, and main-thread work also affect what the reader experiences.

The chart groups the original resources by type. Use a browser's network and performance tools to replace the assumptions with actual measurements for a representative page. Measure a cold visit and a return visit separately. State whether values are transferred bytes or decoded resource sizes; mixing the two makes the comparison difficult to interpret.

## Test the workflow before choosing the stack

Build one article page and one interactive feature in the shortlisted implementation. Check that the article remains readable when the interactive code fails. Navigate by keyboard, follow a heading link, reload a search URL, and use the browser's Back button. Check that an image reserves its space before loading and that long code or table content does not force the entire page wider on a phone.

Then inspect editorial maintenance. Can an author preview a draft without publishing it? Are dates, descriptions, and images validated? Does an internal link checker catch a renamed route? A framework with a convenient component model can still require substantial publishing tooling. Conversely, a lightweight generator may become expensive if the team must rebuild features it now needs.

For frequently personalised application pages, evaluate server rendering, authentication, caching, and interactive state directly. Astro offers server-rendered options, and Next.js offers static export; neither should be rejected by a simplistic content-versus-application slogan. Select the supported path that matches the team's actual requirements and operating experience.

## Keep the performance claim bounded

A faster local build is useful to authors, while a lighter response is useful to readers. They are different measurements. Report hardware, content count, cold or incremental build state, and dependency versions for build comparisons. Report network conditions and page content for browser comparisons. One convenient benchmark cannot establish that a framework will be fastest for every site.

## Further reading and source boundaries

- [Astro: Islands architecture](https://docs.astro.build/en/concepts/islands/)
- [Next.js: Static exports](https://nextjs.org/docs/app/guides/static-exports)
