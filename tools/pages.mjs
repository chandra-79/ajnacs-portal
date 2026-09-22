/* Static pages. Service copy is carried over from the existing site — it is
   the client's own wording, and rewriting it would only add noise. */
import { SITE, esc, icon, fmtDate, readingTime, primaryTopic, seriesSlug } from "./lib.mjs";
import { page } from "./shell.mjs";
import { artwork } from "./visuals.mjs";

const SERVICES = [
  {
    id: "architecture", topic: "Architecture", eyebrow: "Enterprise Architecture",
    title: "Strategic IT execution and infrastructure modernisation",
    lede: "Technical direction that reduces architectural debt, aligns capital expenditure with performance requirements, and improves application reliability.",
    items: [
      ["Cloud modernisation", "Multi-regional transformation. Decoupling monolithic legacy assets into scalable, event-driven microservices so release cycles shorten."],
      ["Resilient IT operations", "Observability control planes on OpenTelemetry and Prometheus, with predictive incident detection behind strict uptime SLAs."],
      ["FinOps and cost governance", "Unchecked cloud allocation is unnecessary expense. We institutionalise FinOps so engineering spend tracks business value."],
      ["DevOps and automation", "The lifecycle from repository to production cluster, automated with infrastructure-as-code and full auditability."],
    ],
  },
  {
    id: "ai", topic: "Enterprise AI", eyebrow: "AI & MLOps Architecture",
    title: "Scalable enterprise AI integration",
    lede: "Moving AI from experimentation to production deployment: resilient MLOps pipelines and data-driven agents integrated securely inside corporate networks.",
    items: [
      ["Agentic AI workflows", "Autonomous agents that handle decision-routing and secure task execution across internal APIs."],
      ["MLOps data pipelines", "Version control, automated model testing and continuous deployment tracking across the model lifecycle."],
      ["Predictive analytics", "Large datasets processed on Spark and modern data platforms to produce decisions people actually use."],
      ["AI security and IAM", "Zero-trust policy and data classification applied to every AI interaction, protecting corporate IP."],
    ],
  },
  {
    id: "training", topic: "Engineering Leadership", eyebrow: "Corporate IT Enablement",
    title: "Technical training built on delivery experience",
    lede: "Customised, lab-intensive curriculum. Instruction rooted in real deployment work rather than slideware.",
    items: [
      ["Enterprise middleware", "Integration methodology, high-availability clustering and legacy Oracle stacks — WebLogic, SOA and OSB, Exalogic."],
      ["Cloud native infrastructure", "Distributed networking, platform security and container orchestration across AWS, Azure and GCP; Kubernetes administration."],
      ["Software engineering", "Application development principles, RESTful API design and resilient backend microservices."],
      ["Hands-on lab environments", "Every module is exercised in a working environment, not demonstrated on a slide."],
    ],
  },
];

const METHOD = [
  ["Assess & audit", "Technical audits of existing middleware, cloud expenditure and systemic bottlenecks."],
  ["Architect & modernise", "Resilient, decoupled cloud-native architecture on Kubernetes and serverless frameworks."],
  ["Automate & govern", "CI/CD, MLOps and FinOps pipelines that keep operational excellence self-sustaining."],
  ["Educate & empower", "Upskilling internal teams so the capability stays after we leave."],
];

const STATS = [
  ["35%", "Faster releases"], ["45%", "MTTR reduction"],
  ["25%", "OpEx savings"], ["99.9%", "Availability target"],
];

const STACK = ["Kubernetes","Terraform","AWS","Azure","Google Cloud","Apache Kafka","OpenTelemetry","PostgreSQL","Snowflake","Apache Spark","PyTorch","WebLogic","Oracle FMW","Spring Boot","Docker","Ansible","Redis","Zero-Trust IAM"];

const contactForm = (id, compact = false) => `
<form ${compact ? "" : 'class="stack" style="--s:1.1rem"'} id="${id}" data-formspree novalidate action="${SITE.formspree}" method="POST"
      data-success="Thank you — your message reached us. An architect will reply shortly.">
  <input type="hidden" name="_subject" value="ajnacs.com — engagement enquiry">
  <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
  <div class="grid g-2" style="gap:1.1rem">
    <div class="field">
      <label for="${id}-name">Name</label>
      <input id="${id}-name" name="name" type="text" required autocomplete="name">
      <p class="field-error" data-error-for="name"></p>
    </div>
    <div class="field">
      <label for="${id}-email">Work email</label>
      <input id="${id}-email" name="email" type="email" required autocomplete="email">
      <p class="field-error" data-error-for="email"></p>
    </div>
  </div>
  <div class="grid g-2" style="gap:1.1rem">
    <div class="field">
      <label for="${id}-org">Organisation <span class="muted">(optional)</span></label>
      <input id="${id}-org" name="organisation" type="text" autocomplete="organization">
      <p class="field-error" data-error-for="organisation"></p>
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
    <textarea id="${id}-message" name="message" required placeholder="The system, the constraint, and what you need to be true in six months."></textarea>
    <p class="field-error" data-error-for="message"></p>
  </div>
  <div class="row" style="justify-content:space-between">
    <button class="btn btn-lg" type="submit">Send enquiry ${icon.arrow}</button>
    <p class="form-note" data-form-status role="status" aria-live="polite"></p>
  </div>
  <p class="form-note">We use what you send only to reply. No lists, no resale — see our <a href="/privacy/">privacy notice</a>.</p>
</form>`;

export function staticPages({ insights, notes, seriesMap, topicList, cardFor }) {
  const featured = insights.slice(0, 7);
  const pages = {};

  /* ---------------- home ---------------- */
  pages["index.html"] = page({
    title: `${SITE.name} | Enterprise Architecture, AI & MLOps`,
    description: "Ajna Consulting Services is a specialised engineering partner for enterprise architecture, AI and MLOps, and corporate technical enablement.",
    path: "/",
    body: `
<section class="hero band band-deep">
  <div class="grid-bg" aria-hidden="true"></div>
  <div class="wrap hero-inner">
    <p class="eyebrow">Specialised engineering partner</p>
    <h1 class="h-display">Architecture that survives<br>contact with production.</h1>
    <p class="lede" style="max-width:58ch;margin-top:1.4rem">
      We modernise legacy systems, put AI into production, and train the engineers who have to run it afterwards.
      We work alongside your team, in your codebase — not from a deck.
    </p>
    <div class="row" style="margin-top:2rem;gap:.8rem">
      <a class="btn btn-lg" href="/contact/">Engage engineering ${icon.arrow}</a>
      <a class="btn btn-ghost btn-lg" href="/insights/">Read our writing</a>
    </div>
    <div class="stat-strip" style="margin-top:3.4rem">
      ${STATS.map(([v, l]) => `<div class="stat"><div class="stat-val">${v}</div><div class="stat-lbl">${l}</div></div>`).join("")}
    </div>
    <p class="small center" style="margin-top:.9rem;color:#8fa0c4">Typical results across modernisation engagements.</p>
  </div>
</section>

<section class="marquee-wrap hair" aria-label="Technologies we work in">
  <div class="marquee">
    <div class="marquee-track">
      ${[...STACK, ...STACK].map(s => `<span>${esc(s)}</span>`).join("")}
    </div>
  </div>
</section>

<section class="section" id="services">
  <div class="wrap">
    <div class="between" style="align-items:flex-end">
      <div>
        <p class="eyebrow">What we do</p>
        <h2 class="h1" style="margin-top:.8rem;max-width:20ch">Three things, done properly.</h2>
      </div>
      <a class="link-arrow" href="/services/">All services ${icon.arrow}</a>
    </div>
    <div class="grid g-2" style="margin-top:2.6rem">
      ${SERVICES.map(s => `<article class="svc-card" data-topic="${esc(s.topic)}">
        <p class="eyebrow">${esc(s.eyebrow)}</p>
        <h3 class="h3" style="margin-top:.8rem">${esc(s.title)}</h3>
        <p class="muted" style="margin-top:.7rem;font-size:.95rem">${esc(s.lede)}</p>
        <ul class="tick-list">${s.items.slice(0, 3).map(([t]) => `<li>${esc(t)}</li>`).join("")}</ul>
        <a class="link-arrow" href="/services/#${s.id}" style="margin-top:1.2rem">Detail ${icon.arrow}</a>
      </article>`).join("\n")}
    </div>
  </div>
</section>

<section class="section band band-deep">
  <div class="wrap">
    <p class="eyebrow">The Ajna methodology</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:22ch">How an engagement actually runs.</h2>
    <ol class="method">
      ${METHOD.map(([t, d], i) => `<li><span class="n">${String(i + 1).padStart(2, "0")}</span><strong>${esc(t)}</strong><p>${esc(d)}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="between" style="align-items:flex-end">
      <div>
        <p class="eyebrow">Insights</p>
        <h2 class="h1" style="margin-top:.8rem;max-width:20ch">We write down what we learn.</h2>
      </div>
      <a class="link-arrow" href="/insights/">Further reading ${icon.arrow}</a>
    </div>
    ${featured.length ? `<a class="feature-post" data-topic="${esc(primaryTopic(featured[0].tags))}" href="/insights/${featured[0].slug}/" style="margin-top:2.6rem">
      <span class="art">${artwork(featured[0].slug, featured[0].tags, { w: 760, h: 560 })}</span>
      <span class="body">
        <span class="chip" style="align-self:flex-start">${esc(primaryTopic(featured[0].tags))}</span>
        <h3>${esc(featured[0].title)}</h3>
        <p>${esc(featured[0].description)}</p>
        <span class="link-arrow">Read it ${icon.arrow}</span>
      </span>
    </a>` : ""}
    <div class="grid g-3" style="margin-top:1.4rem">
      ${featured.slice(1).map(m => cardFor(m, "/insights")).join("\n")}
    </div>
  </div>
</section>

${seriesMap.size ? `<section class="section band band-warm">
  <div class="wrap">
    <p class="eyebrow">Series</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:22ch">Longer arcs, in order.</h2>
    <div class="grid g-3" style="margin-top:2.4rem">
      ${[...seriesMap].slice(0, 3).map(([name, items]) => `<a class="card" data-topic="${esc(primaryTopic(items[0].tags))}" href="/series/${seriesSlug(name)}/">
        <div class="card-art">${artwork(seriesSlug(name), items[0].tags)}</div>
        <div class="card-body"><span class="chip">${items.length} parts</span>
        <h3 class="card-title">${esc(name)}</h3></div></a>`).join("\n")}
    </div>
  </div>
</section>` : ""}

<section class="section band band-deep">
  <div class="wrap">
    <p class="eyebrow">Industry acclaim</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:24ch">What stakeholders say.</h2>
    <div class="grid g-3" style="margin-top:2.4rem">
      ${[
        ["Delivered high-impact architecture solutions and exceptional technical leadership, consistently exceeding enterprise operational targets.", "VP of Engineering", "Global operations"],
        ["Recognised for driving successful enterprise platform migrations, resolving complex technical challenges, and maintaining rigorous stakeholder confidence.", "Project Sponsor", "Financial institution"],
        ["Known for precise architectural documentation and scenario-based labs, significantly improving our engineering team's systemic understanding.", "Engineering Lead", "Logistics sector"],
      ].map(([q, who, org]) => `<figure class="quote">
        <blockquote>${esc(q)}</blockquote>
        <figcaption><strong>${esc(who)}</strong><span>${esc(org)}</span></figcaption>
      </figure>`).join("\n")}
    </div>
    <p class="small" style="margin-top:1.2rem;color:#8fa0c4">Feedback from engagement stakeholders. Names withheld under client confidentiality.</p>
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
      email: SITE.email, logo: SITE.url + "/images/ajna-logo.png",
      description: "Specialised engineering partner for enterprise architecture, AI and MLOps, and corporate technical enablement.",
      sameAs: [SITE.youtube, SITE.blog],
      founder: { "@type": "Person", name: "Chandra Lanka" },
    }, {
      "@context": "https://schema.org", "@type": "WebSite",
      url: SITE.url, name: SITE.name,
      potentialAction: { "@type": "SearchAction", target: SITE.url + "/insights/?topic={search_term_string}", "query-input": "required name=search_term_string" },
    }],
  });

  /* ---------------- services ---------------- */
  pages["services"] = page({
    title: "Services",
    description: "Enterprise architecture, AI and MLOps, and corporate technical enablement — delivered alongside your engineering team.",
    path: "/services/",
    body: `
<section class="section mesh"><div class="wrap">
  <p class="eyebrow">Services</p>
  <h1 class="h-display" style="margin-top:.8rem;max-width:17ch">Engineering, not advice.</h1>
  <p class="lede" style="margin-top:1.3rem;max-width:60ch">We engage directly alongside client engineering teams — executing deployments, configuring pipelines and establishing operational governance, rather than handing over a recommendation and leaving.</p>
</div></section>

${SERVICES.map(s => `<section class="section ${s.id === "ai" ? "surface hair" : ""}" id="${s.id}" data-topic="${esc(s.topic)}">
  <div class="wrap">
    <p class="eyebrow">${esc(s.eyebrow)}</p>
    <h2 class="h1" style="margin-top:.8rem;max-width:22ch">${esc(s.title)}</h2>
    <p class="lede" style="margin-top:1rem;max-width:60ch">${esc(s.lede)}</p>
    <div class="grid g-2" style="margin-top:2.4rem">
      ${s.items.map(([t, d]) => `<div class="feature"><h3 class="h3">${esc(t)}</h3><p class="muted" style="margin-top:.5rem;font-size:.95rem">${esc(d)}</p></div>`).join("\n      ")}
    </div>
    <a class="btn" href="/contact/" style="margin-top:2rem">Discuss ${esc(s.eyebrow.toLowerCase())} ${icon.arrow}</a>
  </div>
</section>`).join("\n")}

<section class="section"><div class="wrap cta-panel cta-wide">
  <div><h2 class="h1" style="max-width:20ch">Not sure which of these you need?</h2>
  <p class="lede" style="margin-top:1rem;max-width:46ch">Most engagements start with an audit, because the stated problem and the actual constraint are often different.</p></div>
  <a class="btn btn-lg" href="/contact/">Start with an audit ${icon.arrow}</a>
</div></section>`,
    jsonld: SERVICES.map(s => ({
      "@context": "https://schema.org", "@type": "Service",
      name: s.title, serviceType: s.eyebrow, description: s.lede,
      provider: { "@id": SITE.url + "/#org" }, areaServed: "Global",
    })),
  });

  /* ---------------- case studies ---------------- */
  pages["case-studies"] = page({
    title: "Engagements",
    description: "The shapes engagements take — audit, modernisation, AI in production, and enablement — and what each is measured on.",
    path: "/case-studies/",
    body: `
<section class="section mesh"><div class="wrap">
  <p class="eyebrow">Engagements</p>
  <h1 class="h-display" style="margin-top:.8rem;max-width:18ch">What the work looks like.</h1>
  <p class="lede" style="margin-top:1.3rem;max-width:60ch">Client engagements are covered by confidentiality, so these describe the shape of the work and what it is measured on, rather than naming organisations.</p>
</div></section>

<section class="wrap" style="padding-bottom:var(--section-y)">
  <div class="grid g-2">
  ${[
    ["Architecture audit", "Architecture", "A fixed-scope technical audit of middleware, cloud spend and systemic bottlenecks.",
      ["Where the architectural debt actually sits", "Which bottlenecks are structural and which are configuration", "A sequenced remediation plan with costs attached"],
      "Measured on: decisions the engineering team can act on immediately."],
    ["Legacy modernisation", "Cloud Architecture", "Decoupling monolithic assets into event-driven services across multi-region deployments.",
      ["Domain boundaries drawn against real call patterns", "Incremental strangler migration, not a rewrite", "CI/CD and IaC so deployment stops being an event"],
      "Measured on: release frequency and change failure rate."],
    ["AI into production", "Enterprise AI", "Taking a model or agent from a working prototype to something that can be operated.",
      ["Evaluation harness before launch, not after", "Versioning, rollback and drift detection", "Zero-trust boundaries around corporate data"],
      "Measured on: whether it still works in month six."],
    ["Team enablement", "Engineering Leadership", "Lab-based instruction on the stack the team actually runs.",
      ["Curriculum built against your architecture", "Hands-on environments, not slideware", "Runbooks the team wrote themselves"],
      "Measured on: operational independence after handover."],
  ].map(([t, topic, lede, bullets, measure]) => `<article class="case" data-topic="${esc(topic)}">
    <div class="case-art">${artwork(t.toLowerCase().replace(/\\s+/g, "-"), [topic])}</div>
    <div class="case-body">
      <span class="chip">${esc(topic)}</span>
      <h2 class="h3" style="margin-top:.7rem">${esc(t)}</h2>
      <p class="muted" style="margin-top:.6rem;font-size:.95rem">${esc(lede)}</p>
      <ul class="tick-list">${bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
      <p class="case-measure">${esc(measure)}</p>
    </div>
  </article>`).join("\n")}
  </div>
</section>

<section class="section surface hair"><div class="wrap cta-panel cta-wide">
  <div><h2 class="h1" style="max-width:20ch">Want the detail under NDA?</h2>
  <p class="lede" style="margin-top:1rem;max-width:46ch">We can walk through comparable engagements, including what went wrong and what it cost to fix.</p></div>
  <a class="btn btn-lg" href="/contact/">Request a walkthrough ${icon.arrow}</a>
</div></section>`,
  });

  /* ---------------- about ---------------- */
  pages["about"] = page({
    title: "About",
    description: "Ajna Consulting Services is a specialised engineering firm led by Chandra Lanka, working with Tier-1 financial, telecommunications and aviation organisations.",
    path: "/about/",
    body: `
<section class="section mesh"><div class="wrap-narrow">
  <p class="eyebrow">About</p>
  <h1 class="h-display" style="margin-top:.8rem">A dedicated engineering partner.</h1>
</div></section>
<section class="wrap-narrow prose" style="padding-bottom:var(--section-y)">
  <p>Ajna Consulting Services operates as a dedicated engineering partner. Our technical leadership has extensive experience designing, securing and recovering mission-critical infrastructure for Tier-1 financial, telecommunications and aviation organisations.</p>
  <p>We specialise in transitioning complex legacy architectures into highly distributed, event-driven microservices. We engage directly alongside client engineering teams to execute deployments, configure CI/CD pipelines and establish operational governance — the work itself, not a recommendation about the work.</p>
  <h2>Why the writing exists</h2>
  <p>The <a href="/insights/">Insights</a> section is not marketing. It is the working material: architecture decisions, production failures and the trade-offs behind them, written down so they can be argued with. If you disagree with something there, that is a reasonable way to start a conversation.</p>
  <h2>Who writes it</h2>
  <p>Chandra Lanka leads the practice — twenty-five years across enterprise middleware, cloud platforms and, more recently, putting AI systems somewhere they can be operated rather than demonstrated. Personal writing that does not belong on a company site lives under <a href="/notes/">Notes</a>.</p>
  <h2>Contact</h2>
  <p>Email <a href="mailto:${SITE.email}">${SITE.email}</a>, or use the <a href="/contact/">enquiry form</a>. We reply to specifics faster than to introductions.</p>
</section>`,
  });

  /* ---------------- contact ---------------- */
  pages["contact"] = page({
    title: "Contact",
    description: "Start an engagement with Ajna Consulting Services — architecture, cloud modernisation, AI and MLOps, or corporate technical training.",
    path: "/contact/",
    body: `
<section class="section mesh"><div class="wrap-narrow">
  <p class="eyebrow">Contact</p>
  <h1 class="h-display" style="margin-top:.8rem;max-width:15ch">Start with the problem.</h1>
  <p class="lede" style="margin-top:1.3rem">Tell us the system, the constraint and what needs to be true in six months. That is enough for a useful first conversation.</p>
</div></section>
<section class="wrap-narrow" style="padding-bottom:var(--section-y)">
  <div class="form-panel">${contactForm("contact")}</div>
  <div class="grid g-2" style="margin-top:2.5rem">
    <div class="feature"><h2 class="h3">Email</h2><p class="muted" style="margin-top:.5rem"><a href="mailto:${SITE.email}">${SITE.email}</a></p></div>
    <div class="feature"><h2 class="h3">Writing</h2><p class="muted" style="margin-top:.5rem"><a href="${SITE.blog}" rel="noopener">techknowen.com</a> · <a href="${SITE.youtube}" rel="noopener">YouTube</a> · <a href="/feed.xml">RSS</a></p></div>
  </div>
</section>`,
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
  <p class="muted">Last updated ${fmtDate(new Date().toISOString().slice(0, 10))}.</p>

  <h2>What this site collects</h2>
  <p>This website has no analytics, no advertising tags and no third-party trackers. It sets no cookies.</p>
  <p>Your browser stores one preference locally — whether you chose light or dark mode. It never leaves your device and we cannot read it.</p>

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
