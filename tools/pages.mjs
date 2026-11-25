/* Static entry points. Detailed service copy lives in content/services. */
import { SITE, esc, icon, fmtDate } from "./lib.mjs";
import { page } from "./shell.mjs";
import { artwork } from "./visuals.mjs";
import { portalArt } from "./lane-art.mjs";
import { lanes } from "./lanes.mjs";
import { laneTiles } from "./lane-pages.mjs";
import { topicScroller } from "./topic-scroller.mjs";
import { caseCoverArt } from "./case-covers.mjs";
import { caseCategories } from "./case-library.mjs";
import { SERVICE_IDS, serviceCard, servicePath } from "./service-library.mjs";
const thumbnail=(title,tags,slug='')=>`<div class="content-thumbnail">${artwork(slug||'content-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),tags,{title})}</div>`;

const SERVICES = [
  {
    id: "architecture", topic: "Architecture", eyebrow: "Enterprise Architecture",
    title: "Strategic IT execution and infrastructure modernisation",
    lede: "Assess dependencies and operating constraints, agree measurable service objectives, and execute changes with recovery and ownership in view.",
  },
  {
    id: "ai", topic: "Enterprise AI", eyebrow: "AI & MLOps Architecture",
    title: "Enterprise AI with explicit evaluation and controls",
    lede: "Define evaluation populations, permission boundaries and human review. Test model and workflow behavior before a staged production rollout.",
  },
  {
    id: "training", topic: "Engineering Leadership", eyebrow: "Corporate IT Enablement",
    title: "Technical enablement through practical exercises",
    lede: "Build role-specific learning paths with isolated labs, observable acceptance criteria and recovery exercises that participants can repeat unaided.",
  },
];

const METHOD = [
  ["Assess & Audit", "Technical audits of existing middleware, cloud expenditure and systemic bottlenecks."],
  ["Architect & Modernise", "Resilient, decoupled cloud-native architecture on Kubernetes and serverless frameworks."],
  ["Automate & Govern", "CI/CD, MLOps and FinOps pipelines that keep operational excellence self-sustaining."],
  ["Educate & Empower", "Upskilling internal teams so the capability stays after we leave."],
];

const contactForm = (id, compact = false) => `
<form ${compact ? "" : 'class="stack" style="--s:1.1rem"'} id="${id}" data-formspree novalidate action="${SITE.formspree}" method="POST"
      data-success="Thank you — your message reached us. An architect will reply shortly.">
  <input type="hidden" name="_subject" value="ajnacs.com — engagement enquiry">
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
  <div class="grid g-2" style="gap:1.1rem">
    <div class="field">
      <label for="${id}-name">Name</label>
      <input id="${id}-name" aria-describedby="${id}-name-error" name="name" type="text" required autocomplete="name">
      <p class="field-error" id="${id}-name-error" data-error-for="name"></p>
    </div>
    <div class="field">
      <label for="${id}-email">Work email</label>
      <input id="${id}-email" aria-describedby="${id}-email-error" name="email" type="email" required autocomplete="email">
      <p class="field-error" id="${id}-email-error" data-error-for="email"></p>
    </div>
  </div>
  <div class="grid g-2" style="gap:1.1rem">
    <div class="field">
      <label for="${id}-org">Organisation <span class="muted">(optional)</span></label>
      <input id="${id}-org" aria-describedby="${id}-org-error" name="organisation" type="text" autocomplete="organization">
      <p class="field-error" id="${id}-org-error" data-error-for="organisation"></p>
    </div>
    <div class="field">
      <label for="${id}-interest">Engagement area</label>
      <select id="${id}-interest" name="interest">
        <option>Enterprise architecture</option>
        <option>Cloud modernisation</option>
        <option>AI &amp; MLOps</option>
        <option>FinOps &amp; cost governance</option>
        <option>Corporate technical training</option>
        <option>Something else</option>
      </select>
    </div>
  </div>
  <div class="field">
    <label for="${id}-message">What are you working on?</label>
    <textarea id="${id}-message" aria-describedby="${id}-message-error" name="message" required placeholder="The system, the constraint, and what you need to be true in six months."></textarea>
    <p class="field-error" id="${id}-message-error" data-error-for="message"></p>
  </div>
  <div class="row" style="justify-content:space-between">
    <button class="btn btn-lg" type="submit">Send enquiry ${icon.arrow}</button>
    <p class="form-note" data-form-status role="status" aria-live="polite"></p>
  </div>
  <p class="form-note">We use what you send only to reply. No lists, no resale — see our <a href="/privacy/">privacy notice</a>.</p>
</form>`;

export function staticPages({ notes, laneDirectory, tickerItems, services }) {
  if (!Array.isArray(services) || services.length !== SERVICE_IDS.length || SERVICE_IDS.some(id => !services.some(service => service.id === id))) {
    throw new Error("Static service entry points require the complete service library");
  }
  const pages = {};

  /* ---------------- home ---------------- */
  pages["index.html"] = page({
    title: `${SITE.name} | Enterprise Architecture, AI & MLOps`,
    description: "Ajna Consulting Services is a specialised engineering partner for enterprise architecture, AI and MLOps, and corporate technical enablement.",
    path: "/",
    body: `
<section class="hero band band-deep portal-hero">
  <div class="grid-bg" aria-hidden="true"></div>
  <div class="wrap hero-inner portal-hero-layout">
    <div class="portal-hero-copy">
      <p class="eyebrow">Ajna Consulting Services</p>
      <h1 class="h-display">Architecture that survives contact with production.</h1>
      <p class="lede portal-hero-lead">Explore practical guides, worked examples, and case studies on building and running production systems.</p>
      <div class="row portal-hero-actions">
        <a class="btn btn-lg" href="#start-reading">Pick a topic</a>
        <a class="btn btn-ghost btn-lg" href="/insights/#article-search">Search articles</a>
      </div>
    </div>
    <div class="portal-hero-art">${portalArt()}</div>
  </div>
</section>

${topicScroller(tickerItems)}

<section class="section portal-lanes" id="start-reading" aria-labelledby="portal-lanes-title">
  <div class="wrap">
    <div class="between portal-section-heading">
      <h2 class="h1" id="portal-lanes-title">Explore topics</h2>
      <a class="link-arrow" href="/insights/">All articles</a>
    </div>
    ${laneTiles(lanes, laneDirectory)}
  </div>
</section>

<section class="section portal-notes band band-warm" aria-labelledby="portal-notes-title">
  <div class="wrap portal-notes-layout">
    <div>
      <h2 class="h1" id="portal-notes-title">Personal Notes</h2>
      <p class="lede">Chandra Lanka on learning, work, and judgment.</p>
      <a class="link-arrow" href="/notes/">Browse Personal Notes</a>
    </div>
    <ul class="portal-note-list">
      ${notes.slice(0, 3).map(note => `<li><a href="/notes/${note.slug}/">${esc(note.title)}</a><time datetime="${note.date}">${fmtDate(note.date)}</time></li>`).join("")}
    </ul>
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="between" style="align-items:flex-end">
      <div>
        <p class="eyebrow">What we do</p>
        <h2 class="h1" style="margin-top:.8rem;max-width:20ch">Architecture, AI and engineering training</h2>
      </div>
      <a class="link-arrow" href="/services/">All services ${icon.arrow}</a>
    </div>
    <div class="grid g-2" style="margin-top:2.6rem">
      ${SERVICES.map(s => `<article class="svc-card" data-topic="${esc(s.topic)}">
        ${thumbnail(s.eyebrow,[s.topic],'service-'+s.id)}
        <p class="eyebrow">${esc(s.eyebrow)}</p>
        <h3 class="h3" style="margin-top:.8rem">${esc(s.title)}</h3>
        <p class="muted" style="margin-top:.7rem;font-size:.95rem">${esc(s.lede)}</p>
        <ul class="tick-list service-links">${services.filter(service => service.category === s.id).map(service => `<li><a href="${servicePath(service.id)}">${esc(service.title)}</a></li>`).join("")}</ul>
        <a class="link-arrow card-destination" href="/services/#${s.id}" style="margin-top:1.2rem">Explore this service area ${icon.arrow}</a>
      </article>`).join("\n")}
    </div>
  </div>
</section>

<section class="section band band-deep">
  <div class="wrap">
    <p class="eyebrow">The Ajna methodology</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:22ch">How an engagement actually runs.</h2>
    <ol class="method">
      ${METHOD.map(([t, d], i) => `<li>${thumbnail(t,[['Architecture'],['Cloud Architecture'],['DevSecOps'],['Engineering Leadership']][i],'method-'+['audit','migration','automation','technical-learning'][i])}<span class="n">${String(i + 1).padStart(2, "0")}</span><strong><a href="/case-studies/${caseCategories[i].id}/">${esc(t)}</a></strong><p>${esc(d)}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>

<section class="section band band-deep">
  <div class="wrap">
    <div class="between">
      <div><h2 class="h1">See how the work runs</h2><p class="lede field-intro">Explore simulated engineering engagements with decisions, acceptance tests, and measured examples.</p></div>
      <a class="link-arrow" href="/case-studies/">Browse case studies ${icon.arrow}</a>
    </div>
    <div class="grid g-2 capability-grid case-home">
      ${caseCategories.map(({id, alt, title, topic, description}) => `<article class="case" data-topic="${esc(topic)}">
        <div class="case-art">${caseCoverArt(id, alt)}</div>
        <div class="case-body"><h3 class="h3"><a class="card-destination" href="/case-studies/${id}/">${esc(title)}</a></h3><p class="muted">${esc(description)}</p></div>
      </article>`).join("\n")}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap"><div class="cta-field">
    <div>
      <h2 class="h1" style="max-width:18ch">Tell us what is breaking.</h2>
      <p class="lede" style="margin-top:1rem;max-width:48ch">Architecture review, migration, AI in production, or training your team to run it. Start with the constraint you actually have.</p>
    </div>
    <a class="btn btn-lg" href="/contact/">Engage engineering ${icon.arrow}</a>
  </div></div>
</section>`,
    jsonld: [{
      "@context": "https://schema.org", "@type": "Organization",
      "@id": SITE.url + "/#org", name: SITE.name, url: SITE.url,
      email: SITE.email, logo: SITE.url + "/images/icon-512.png",
      description: "Specialised engineering partner for enterprise architecture, AI and MLOps, and corporate technical enablement.",
      sameAs: [SITE.youtube, SITE.blog],
      founder: { "@type": "Person", name: "Chandra Lanka" },
    }, {
      "@context": "https://schema.org", "@type": "WebSite",
      url: SITE.url, name: SITE.name,
      potentialAction: { "@type": "SearchAction", target: SITE.url + "/insights/?q={search_term_string}", "query-input": "required name=search_term_string" },
    }],
  });

  /* ---------------- services ---------------- */
  pages["services"] = page({
    title: "Services",
    description: "Explore twelve delivery methodologies and sixty hypothetical industry scenarios across architecture, operations, AI and engineering enablement.",
    path: "/services/",
    bodyClass: "services-frame",
    body: `
<section class="section mesh menu-intro"><div class="publication-wrap service-intro">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">Services</span></nav>
  <h1 class="h-display">From a clear scope to an operable outcome.</h1>
  <p class="lede field-intro">Explore how we plan, execute, measure and hand over engineering work. Each service includes a detailed methodology, five industry scenarios, explanatory charts and primary references.</p>
  <p class="case-notice">12 service methodologies · 60 hypothetical industry scenarios. Scenario organisations, delivery events and numbers are invented for explanation; they are not customer results.</p>
  <nav class="service-category-nav" aria-label="Service areas">${SERVICES.map(s => `<a class="chip" href="#${s.id}">${esc(s.eyebrow)}</a>`).join("")}</nav>
</div></section>

${SERVICES.map(s => `<section class="section ${s.id === "ai" ? "surface hair" : ""}" id="${s.id}" data-topic="${esc(s.topic)}">
  <div class="publication-wrap">
    <p class="eyebrow">${esc(s.eyebrow)}</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:22ch">${esc(s.title)}</h2>
    <p class="lede" style="margin-top:1rem;max-width:60ch">${esc(s.lede)}</p>
    <div class="grid g-2 capability-grid service-grid">
      ${services.filter(service => service.category === s.id).map(service => serviceCard(service)).join("\n      ")}
    </div>
    <a class="btn" href="/contact/" style="margin-top:2rem">Discuss ${esc(s.eyebrow.toLowerCase())} ${icon.arrow}</a>
  </div>
</section>`).join("\n")}

<section class="section"><div class="wrap cta-panel cta-wide">
  <div><h2 class="h1" style="max-width:20ch">Define the first useful step.</h2>
  <p class="lede" style="margin-top:1rem;max-width:46ch">Share the system, the constraint and the outcome you need. Agree the evidence, scope and acceptance criteria before deciding the engagement.</p></div>
  <a class="btn btn-lg" href="/contact/">Discuss your requirements ${icon.arrow}</a>
</div></section>`,
    jsonld: services.map(s => ({
      "@context": "https://schema.org", "@type": "Service",
      "@id": SITE.url + servicePath(s.id) + "#service",
      name: s.title, serviceType: s.title, description: s.description,
      url: SITE.url + servicePath(s.id), provider: { "@id": SITE.url + "/#org" },
    })),
  });

  /* ---------------- case studies ---------------- */
  pages["case-studies"] = page({
    title: "Engineering case studies",
    description: "Hypothetical engineering scenarios on architecture audits, legacy modernisation, production AI and team enablement.",
    path: "/case-studies/",
    body: `
<section class="section mesh menu-intro"><div class="publication-wrap">
  <h1 class="h-display">Engineering case studies</h1>
  <p class="lede field-intro">See how we would scope, execute, and hand over an engagement. Each scenario includes a delivery sequence, acceptance criteria, and measurements you can inspect.</p>
  <p class="case-notice">The public scenarios are hypothetical. Organisations, delivery events and results are simulated.</p>
</div></section>

<section class="publication-wrap case-library" aria-label="Engagement categories">
  <div class="grid g-2 capability-grid">
  ${caseCategories.map(({id, alt, title, topic, description}) => `<article class="case" data-topic="${esc(topic)}">
    <div class="case-art">${caseCoverArt(id, alt)}</div>
    <div class="case-body">
      <h2 class="h3"><a class="card-destination" href="/case-studies/${id}/">${esc(title)}</a></h2>
      <p class="muted">${esc(description)}</p>
      <a class="case-measure" href="/case-studies/${id}/">Explore ${esc(title.toLowerCase())} scenarios</a>
    </div>
  </article>`).join("\n")}
  </div>
</section>

<section class="section surface hair"><div class="wrap cta-panel cta-wide">
  <div><h2 class="h1">Bring a delivery problem.</h2>
  <p class="lede">We can discuss scope, evidence and acceptance criteria for your system. Real engagement details can be shared only where the parties involved have approved disclosure.</p></div>
  <a class="btn btn-lg" href="/contact/">Discuss an engagement ${icon.arrow}</a>
</div></section>`,
  });

  pages["projects/ziggle"] = page({
    title: "Ziggle project preview",
    description: "Ziggle is an upcoming place to play brain teasers. Read about the project and its launch status.",
    path: "/projects/ziggle/",
    body: `<section class="section mesh"><div class="publication-wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a></nav>
  <h1 class="h-display">Ziggle</h1>
  <p class="lede field-intro">An upcoming place to play brain teasers. Status: coming soon.</p>
</div></section>
<section class="wrap-narrow prose case-library">
  <h2>What Ziggle is for</h2>
  <p>Ziggle is being developed for people who enjoy working through a puzzle. It will have its own destination when it is ready to play. This page will carry the launch link when it becomes available.</p>
  <h2>Ajna's other project</h2>
  <p><a href="https://www.techknowen.com/" rel="noopener">TechKnowen</a> publishes practical writing on software, architecture, and engineering.</p>
</section>`,
  });

  pages["follow"] = page({
    title: "Follow Ajna writing",
    description: "Follow new Insights, updated field guides and personal notes in the feed reader you use.",
    path: "/follow/",
    body: `<section class="section mesh"><div class="publication-wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/insights/">Insights</a></nav>
  <h1 class="h-display">Follow Ajna writing</h1>
  <p class="lede field-intro">Choose engineering articles, guide revisions or personal notes. Add a feed to your reader to follow new writing.</p>
</div></section>
<section class="publication-wrap case-library" aria-label="Publication feeds">
  <div class="grid g-2">
    <article class="guide-tile"><h2 class="h3"><a class="card-destination" href="/updates.xml">Engineering updates (Atom)</a></h2><p>Start here for new writing and revised guides. The feed keeps one identity per article and includes publication and update dates.</p></article>
    <article class="guide-tile"><h2 class="h3"><a class="card-destination" href="/feed.xml">New Insights (RSS)</a></h2><p>Follow articles in publication order.</p></article>
    <article class="guide-tile"><h2 class="h3"><a class="card-destination" href="/notes/feed.xml">Personal notes (RSS)</a></h2><p>Follow reflections on learning, craft, career and everyday judgment.</p></article>
  </div>
  <div class="row follow-links"><a class="btn" href="/field-guides/">Start with a field guide</a><a class="btn btn-ghost" href="/case-studies/">Read case studies</a></div>
</section>`,
  });

  pages["field-guides/methods"] = page({
    title: "Methods and data",
    description: "How Ajna defines measures, publishes illustrative datasets and reports repeatable observations.",
    path: "/field-guides/methods/",
    body: `<section class="section mesh"><div class="publication-wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/field-guides/">Field guides</a></nav>
  <h1 class="h-display">Methods and data</h1>
  <p class="lede field-intro">Check the inputs, definitions and limits behind a chart before using its result.</p>
</div></section>
<section class="wrap-narrow prose case-library">
  <h2>Three starting points</h2>
  <ul>
    <li><a href="/insights/sre-toil-reduction/#methodology">SRE toil method</a> counts active work and ongoing upkeep in equal windows.</li>
    <li><a href="/insights/platform-engineering-idp-2026/#methodology">Platform onboarding method</a> includes unfinished attempts and shows time among completions.</li>
    <li><a href="/insights/cloud-unit-economics/#methodology">Cloud cost per unit method</a> matches effective costs and unique successful units by scope and period.</li>
  </ul>
  <h2>Data origin</h2>
  <p>Figures marked simulated or illustrative are worked examples. The case studies call out their context, acceptance criteria, handover and limits. Each one includes its own downloadable values. The article archive <a href="/field-guides/worked-examples.csv" download>worked examples CSV</a> records input strings, chart values and each method.</p>
  <p>The <a href="/insights/running-local-llm-lessons/#local-run">CPU-only inference run</a> is an Ajna lab observation. The article publishes the environment, raw observations, rerun script and scope of the comparison. Future measurements follow the same pattern.</p>
  <h2>References</h2>
  <ul>
    <li><a href="https://radar.cloudflare.com/about">Cloudflare Radar data sources</a></li>
    <li><a href="https://doi.org/10.1007/s10664-008-9102-8">Runeson and Höst, guidelines for case study research in software engineering</a></li>
  </ul>
</section>`,
  });

  /* ---------------- about ---------------- */
  pages["about"] = page({
    title: "About",
    description: "Ajna Consulting Services is a specialised engineering firm led by Chandra Lanka, working with Tier-1 financial, telecommunications and aviation organisations.",
    path: "/about/",
    body: `
<section class="section mesh menu-intro"><div class="publication-wrap">
  <p class="eyebrow">About</p>
  <h1 class="h-display">A dedicated engineering partner.</h1>
</div></section>
<section class="publication-wrap menu-content"><div class="prose menu-prose">
  <p>Ajna Consulting Services operates as a dedicated engineering partner. Our technical leadership has extensive experience designing, securing and recovering mission-critical infrastructure for Tier-1 financial, telecommunications and aviation organisations.</p>
  <p>We specialise in transitioning complex legacy architectures into highly distributed, event-driven microservices. We engage directly alongside client engineering teams to execute deployments, configure CI/CD pipelines and establish operational governance — the work itself, not a recommendation about the work.</p>
  <h2>Why the writing exists</h2>
  <p>The <a href="/insights/">Insights</a> section is not marketing. It is the working material: architecture decisions, production failures and the trade-offs behind them, written down so they can be argued with. If you disagree with something there, that is a reasonable way to start a conversation.</p>
  <h2 id="chandra-lanka">Who writes it</h2>
  <p>Chandra Lanka leads the practice — twenty-five years across enterprise middleware, cloud platforms and, more recently, putting AI systems somewhere they can be operated rather than demonstrated. Reflections on learning, craft and career appear in <a href="/notes/">Personal notes</a>.</p>
  <h2>Contact</h2>
  <p>Email <a href="mailto:${SITE.email}">${SITE.email}</a>, or use the <a href="/contact/">enquiry form</a>. We reply to specifics faster than to introductions.</p>
</div></section>`,
  });

  /* ---------------- contact ---------------- */
  pages["contact"] = page({
    title: "Contact",
    description: "Start an engagement with Ajna Consulting Services — architecture, cloud modernisation, AI and MLOps, or corporate technical training.",
    path: "/contact/",
    body: `
<section class="section mesh menu-intro"><div class="publication-wrap">
  <p class="eyebrow">Contact</p>
  <h1 class="h-display">Start with the problem.</h1>
  <p class="lede field-intro">Tell us the system, the constraint and what needs to be true in six months. That is enough for a useful first conversation.</p>
</div></section>
<section class="publication-wrap menu-content"><div class="menu-enquiry">
  <div class="form-panel">${contactForm("contact")}</div>
  <div class="grid g-2" style="margin-top:2.5rem">
    <div class="feature">${thumbnail('An engineering conversation',['Engineering Leadership'],'contact-feedback')}<h2 class="h3">Email</h2><p class="muted" style="margin-top:.5rem"><a href="mailto:${SITE.email}">${SITE.email}</a></p></div>
    <div class="feature">${thumbnail('Engineering writing',['Engineering Leadership'],'contact-technical-writing')}<h2 class="h3">Writing</h2><p class="muted" style="margin-top:.5rem"><a href="${SITE.blog}" rel="noopener">techknowen.com</a> · <a href="${SITE.youtube}" rel="noopener">YouTube</a> · <a href="/feed.xml">RSS</a></p></div>
  </div>
</div></section>`,
    jsonld: [{ "@context": "https://schema.org", "@type": "ContactPage", url: SITE.url + "/contact/", about: { "@id": SITE.url + "/#org" } }],
  });

  /* ---------------- privacy ---------------- */
  pages["privacy"] = page({
    title: "Privacy notice",
    description: "What Ajna Consulting Services collects through this website, why, and how to have it removed.",
    path: "/privacy/",
    body: `
<section class="section"><div class="wrap-narrow prose">
  <h1 class="h1">Privacy notice</h1>
  <p class="muted">Last updated ${fmtDate("2026-11-23")}.</p>

  <h2>What this site collects</h2>
  <p>This website has no analytics, no advertising tags and no third-party trackers. It sets no cookies.</p>
  <p>Your browser stores your reading preferences locally, including theme, text size, column width and typeface. The site uses those settings on later visits. It does not send them to us. Archive search terms and filters appear in the page URL so you can return to or share the same results.</p>

  <h2>When you contact us</h2>
  <p>The enquiry form collects your name, email address, optionally your organisation, the engagement area you select, and your message. Submissions are delivered to us through <a href="https://formspree.io/legal/privacy-policy/" rel="noopener">Formspree</a>, which processes the message in order to deliver it.</p>
  <p>We use what you send for one purpose: to reply and, if it goes further, to run the engagement. We do not add you to a mailing list, sell it, or share it with anyone outside the firm.</p>

  <h2>How long we keep it</h2>
  <p>Enquiries that do not lead to an engagement are deleted within twelve months. Engagement correspondence is retained for as long as the contract and our legal obligations require.</p>

  <h2>Your rights</h2>
  <p>You can ask what we hold about you, ask for it to be corrected, or ask for it to be deleted. Email <a href="mailto:${SITE.email}">${SITE.email}</a> and we will action it within thirty days.</p>

  <h2>External links</h2>
  <p>This site links to techknowen.com, YouTube and other third parties. Once you follow such a link, that service's own privacy terms apply, not ours.</p>

  <h2>Changes</h2>
  <p>If this notice changes materially, the date above changes with it.</p>
</div></section>`,
  });

  /* ---------------- terms ---------------- */
  pages["terms"] = page({
    title: "Terms of use",
    description: "Terms governing use of the ajnacs.com website and the material published on it.",
    path: "/terms/",
    body: `
<section class="section"><div class="wrap-narrow prose">
  <h1 class="h1">Terms of use</h1>
  <p class="muted">Last updated ${fmtDate(new Date().toISOString().slice(0, 10))}.</p>

  <h2>About these terms</h2>
  <p>These terms govern your use of ajnacs.com. Using the site means you accept them. They do not govern any consulting engagement — those are covered by a separate signed agreement.</p>

  <h2>The writing</h2>
  <p>Articles on this site describe approaches that worked in particular systems under particular constraints. They are published in good faith and are not engineering advice for your environment. Architecture decisions depend on context we do not have. Validate anything here against your own systems before acting on it.</p>

  <h2>Intellectual property</h2>
  <p>Text, diagrams and code samples on this site are the property of ${esc(SITE.name)} unless stated otherwise. You may quote and link to them with attribution. Republishing substantial extracts, or using them to train a model for commercial resale, requires written permission.</p>

  <h2>Trademarks</h2>
  <p>Product and company names referenced here — Kubernetes, AWS, Azure, Oracle, and others — belong to their respective owners. Mentioning them implies no endorsement in either direction.</p>

  <h2>Availability</h2>
  <p>The site is provided as it stands. We do not guarantee it is uninterrupted or error-free, and we are not liable for loss arising from reliance on its content.</p>

  <h2>Contact</h2>
  <p>Questions about these terms: <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
</div></section>`,
  });

  /* ---------------- 404 ---------------- */
  pages["404.html"] = page({
    title: "Page not found",
    description: "That page does not exist.",
    path: "/404.html",
    robots: "noindex, follow",
    body: `
<section class="section"><div class="wrap-narrow center" style="padding-block:4rem">
  <p class="eyebrow" style="justify-content:center">404</p>
  <h1 class="h1" style="margin-top:1rem">That page is not here.</h1>
  <p class="lede" style="margin-top:1rem">It may have moved, or the link may be wrong.</p>
  <div class="row" style="justify-content:center;margin-top:2rem">
    <a class="btn" href="/">Home</a>
    <a class="btn btn-ghost" href="/insights/">Browse insights</a>
  </div>
</div></section>`,
  });

  return pages;
}
