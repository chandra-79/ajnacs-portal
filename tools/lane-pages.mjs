import { esc, fmtDate, readingTime } from "./lib.mjs";
import { lanes as portalLanes, lanePath } from "./lanes.mjs";
import { laneArt } from "./lane-art.mjs";

const articlePath = article => "/" + article.section + "/" + article.slug + "/";

const laneResources = {
  reliability: [
    { kind: "Worksheet", title: "Build a toil baseline", description: "Estimate the time lost to recurring work and the payback for automating it.", url: "/insights/sre-toil-reduction/#measurement-worksheet" },
    { kind: "Deep dive", title: "Calculate an error budget", description: "Work out how much failure a service can absorb before it needs a different operating decision.", url: "/deep-dives/reliability/error-budget-accounting/" },
    { kind: "Case study", title: "Measure on-call toil", description: "See how repeat requests and interruptions were turned into a defensible baseline.", url: "/case-studies/architecture-audit/on-call-toil-baseline/" },
  ],
  "platform-delivery": [
    { kind: "Worksheet", title: "Measure platform onboarding", description: "Track the wait states on the path to a qualifying first deployment.", url: "/insights/platform-engineering-idp-2026/#measurement-worksheet" },
    { kind: "Deep dive", title: "Compare first deployment cohorts", description: "Decide which signals show whether a new path is working for different groups.", url: "/deep-dives/platform/first-deploy-cohorts/" },
    { kind: "Case study", title: "Design a delivery pipeline lab", description: "See how a team practiced pipeline execution and recovery before a release.", url: "/case-studies/team-enablement/delivery-pipeline-lab/" },
  ],
  "cloud-finops": [
    { kind: "Worksheet", title: "Calculate cloud cost per unit", description: "Assign spend to the work it supports and choose a useful denominator.", url: "/insights/cloud-unit-economics/#measurement-worksheet" },
    { kind: "Deep dive", title: "Model cost per successful order", description: "Work through a cloud cost model and test how outcomes change the unit cost.", url: "/deep-dives/finops/cost-per-successful-order/" },
    { kind: "Case study", title: "Audit the cost of an order", description: "Follow the decision to reconcile infrastructure spend with successful orders.", url: "/case-studies/architecture-audit/order-unit-cost-audit/" },
  ],
  "systems-architecture": [
    { kind: "Deep dive", title: "Model a cutover replay window", description: "Evaluate how far a migration can fall behind and which replay window you can cover.", url: "/deep-dives/migration/cutover-replay-window/" },
    { kind: "Case study", title: "Replace an order-status system in slices", description: "See how a team used the strangler pattern to migrate a customer-facing workflow.", url: "/case-studies/legacy-modernisation/order-status-strangler/" },
    { kind: "Case study", title: "Practice an architecture decision", description: "Walk through evidence, alternatives, and trade-offs in an architecture workshop.", url: "/case-studies/team-enablement/architecture-decision-workshop/" },
  ],
  "ai-data": [
    { kind: "Deep dive", title: "Evaluate claim-level grounding", description: "Score a sample of answers against their evidence and decide what is safe to release.", url: "/deep-dives/ai-evaluation/claim-level-grounding/" },
    { kind: "Case study", title: "Build a grounded policy assistant", description: "Follow the evidence and review checks for an internal retrieval workflow.", url: "/case-studies/ai-into-production/grounded-policy-assistant/" },
    { kind: "Case study", title: "Canary a model release", description: "Follow the signals that guided promotion and rollback at the model registry.", url: "/case-studies/ai-into-production/model-registry-canary/" },
  ],
  "security-identity": [
    { kind: "Deep dive", title: "Verify network policy", description: "Work through which traffic should pass and how to observe the policy result.", url: "/deep-dives/networks/network-policy-verification/" },
    { kind: "Case study", title: "Audit cloud permissions", description: "Compare policy intent with the access a workload can actually use.", url: "/case-studies/architecture-audit/cloud-permission-audit/" },
    { kind: "Case study", title: "Refresh retrieval permissions", description: "Examine how a team validated access changes between an identity source and search results.", url: "/case-studies/ai-into-production/retrieval-permission-refresh/" },
  ],
  "software-engineering": [
    { kind: "Deep dive", title: "Practice feedback with a rubric", description: "Design criteria that make a reviewer’s feedback observable and useful.", url: "/deep-dives/learning/observable-feedback-rubric/" },
    { kind: "Case study", title: "Practice tracing across service boundaries", description: "See how a team used a guided lab to follow request context across components.", url: "/case-studies/team-enablement/trace-context-lab/" },
    { kind: "Deep dive", title: "Measure a team practice experiment", description: "Choose an observable change and compare outcomes before and after the practice.", url: "/deep-dives/learning/team-practice-experiment/" },
  ],
};


function countLabel(count) {
  return `${count} ${count === 1 ? "article" : "articles"}`;
}

export function laneTiles(lanes, directory) {
  return `<div class="field-lane-tiles">
    ${lanes.map(lane => {
      const count = directory.liveByLane.get(lane.id).length;
      return `<a class="field-lane-tile" href="${lanePath(lane)}" style="--field-lane-accent:${esc(lane.accent)}">
      ${laneArt(lane.id)}
      <div class="field-lane-tile-copy">
        <h3 class="h3">${esc(lane.title)}</h3>
        <p>${esc(lane.description)}</p>
        <span class="field-lane-count">${countLabel(count)}</span>
      </div>
    </a>`;
    }).join("\n    ")}
  </div>`;
}

export function topicDirectory(lanes, directory) {
  return `<section class="section publication-wrap field-topic-directory">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Topics</span></nav>
    <header class="field-lane-heading">
      <div><h1 class="h-display">Engineering topics</h1><p class="lede">Start with a guide, follow a reading path, or find a worked example for your next production decision.</p></div>
      <div class="field-lane-actions">
        <a class="btn btn-ghost" href="/insights/#article-search">Search articles</a>
        <a class="btn btn-ghost" href="/topics/tags/">Browse all tags</a>
      </div>
    </header>
    ${laneTiles(lanes, directory)}
  </section>`;
}

function laneRows(articles, directory, showLanes) {
  return articles.map(article => {
    const lane = showLanes && directory?.laneBySlug.get(article.slug);
    const tags = lane ? ["lane:" + lane.id, ...article.tags] : article.tags;
    const search = [article.title, article.description, article.series, lane?.title, ...tags].filter(Boolean).join(" ").toLowerCase();
    return `<li class="field-index-row" data-card data-topics="|${esc(tags.join("|"))}|" data-search="${esc(search)}">
      <div class="field-index-title">
        <h3 class="card-title"><a class="card-destination" href="${articlePath(article)}">${esc(article.title)}</a></h3>
        ${article.description ? `<p>${esc(article.description)}</p>` : ""}
      </div>
      <div class="field-index-meta">
      ${lane ? `<a class="field-index-lane" href="${lanePath(lane)}">${esc(lane.short || lane.title)}</a>` : ""}
      <time datetime="${esc(article.date)}">${fmtDate(article.date)}</time>
      <span>${readingTime(article.words)} min</span>
      </div>
    </li>`;
  }).join("\n    ");
}

function countTags(articles) {
  const counts = new Map();
  for (const article of articles) {
    for (const tag of article.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function compactArticleIndex(articles, {
  title = "All articles",
  inputLabel = "Search articles",
  placeholder = "Search by title, topic or keyword",
  directory,
  filters = countTags(articles),
  showLanes = Boolean(directory),
} = {}) {
  const laneOpts = showLanes && directory ? portalLanes.map(lane => {
    const count = directory.liveByLane.get(lane.id).length;
    return count > 0 ? `<option value="lane:${esc(lane.id)}">${esc(lane.title)} (${count})</option>` : "";
  }).join("") : "";
  const tagOpts = filters.map(([tag, count]) => `<option value="${esc(tag)}">${esc(tag)} (${count})</option>`).join("");
  return `<section class="field-article-index" id="article-search" aria-labelledby="field-index-title">
    <h2 class="h2" id="field-index-title">${esc(title)}</h2>
    ${articles.length ? `<div class="field-index-controls">
      <label class="field-index-query">${esc(inputLabel)}
        <input type="search" id="postSearch" placeholder="${esc(placeholder)}" autocomplete="off" aria-controls="postList">
      </label>
      ${laneOpts || tagOpts ? `<div class="field-index-filter">
        <select id="postTopic" class="topic-select" aria-label="Filter articles by topic" aria-controls="postList" hidden>
          <option value="">All topics</option>
          ${laneOpts ? `<optgroup label="Main topics">${laneOpts}</optgroup>` : ""}
          ${tagOpts ? `<optgroup label="Tags">${tagOpts}</optgroup>` : ""}
        </select>
      </div>` : ""}
      <button type="button" class="btn btn-ghost btn-sm" id="postClear" hidden>Clear filters</button>
    </div>
    <p class="small muted field-index-count" id="postCount" role="status" aria-live="polite">${countLabel(articles.length)}</p>
    <ul class="field-index-list" id="postList">
      ${laneRows(articles, directory, showLanes)}
    </ul>
    <p id="postEmpty" hidden class="muted field-index-empty">No articles match. Try a different topic or search term.</p>
    <button class="btn btn-ghost" id="postMore" type="button" aria-controls="postList" hidden>Show more</button>` :
    `<p class="muted field-index-empty">The reading list will grow as related articles are published.</p>`}
  </section>`;
}

function startPath(lane, path) {
  return `<section class="field-lane-path" id="start-here" aria-labelledby="field-start-title">
    <h2 class="h2" id="field-start-title">Start here</h2>
    ${lane.pathTitle ? `<p class="muted field-path-title">${esc(lane.pathTitle)}</p>` : ""}
    <ol class="field-path-steps">
      ${path.map(({ article, reason }) => `<li>
        <a class="field-path-step" href="${articlePath(article)}">
          <strong>${esc(article.title)}</strong>
          ${reason ? `<p>${esc(reason)}</p>` : ""}
          <span>${readingTime(article.words)} min read</span>
        </a>
      </li>`).join("\n      ")}
    </ol>
  </section>`;
}

function resourcesForLane(lane) {
  const resources = laneResources[lane.id];
  return `<aside class="field-lane-resources" aria-labelledby="field-resource-title">
    <h2 class="h3" id="field-resource-title">Try it in practice</h2>
    <ul>
      ${resources.map(({ kind, title, description, url }) => `<li>
        <a class="field-lane-resource" href="${esc(url)}">
          <span class="field-resource-kind">${esc(kind)}</span>
          <strong>${esc(title)}</strong>
          <p>${esc(description)}</p>
        </a>
      </li>`).join("\n      ")}
    </ul>
  </aside>`;
}

export function laneHub(lane, directory) {
  const articles = directory.liveByLane.get(lane.id);
  const path = directory.pathsByLane.get(lane.id);
  return `<div class="publication-wrap field-lane-hub" style="--field-lane-accent:${esc(lane.accent)}">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/topics/">Topics</a><span aria-hidden="true">/</span><span aria-current="page">${esc(lane.title)}</span></nav>
    <section class="field-lane-hero" aria-labelledby="field-lane-title">
      <div class="field-lane-hero-copy">
        <h1 class="h-display" id="field-lane-title">${esc(lane.title)}</h1>
        <p class="lede">${esc(lane.description)}</p>
        ${lane.subtopics.length ? `<ul class="field-lane-subtopics" aria-label="Subtopics">${lane.subtopics.map(topic => `<li>${esc(topic)}</li>`).join("")}</ul>` : ""}
        <div class="field-lane-actions">
          ${path.length ? `<a class="btn" href="#start-here">Start reading</a>` : ""}
          ${articles.length ? `<a class="btn btn-ghost" href="#article-search">Browse ${countLabel(articles.length)}</a>` : ""}
        </div>
      </div>
      <div class="field-lane-hero-art">${laneArt(lane.id, { hero: true })}</div>
    </section>
    ${path.length ? `<div class="field-lane-curriculum">${startPath(lane, path)}${resourcesForLane(lane)}</div>` : resourcesForLane(lane)}
    ${compactArticleIndex(articles, {
      title: "All articles in this topic",
      inputLabel: "Search this topic",
      showLanes: false,
    })}
  </div>`;
}
