---
title: "Generative AI in the Enterprise: Patterns That Deliver Value vs. Patterns That Sound Good in Demos"
description: "After two years of enterprise GenAI projects, some patterns reliably produce measurable value and some look impressive until they hit production. Here's how to tell the difference early."
date: 2026-05-29
tags: ["AI & MLOps", "Enterprise AI", "Governance"]
format: article
---

GenAI project proposals tend to fall into two categories. Ones where you can articulate the before-and-after in a sentence ("currently this task takes an analyst 4 hours; with this tool it takes 20 minutes and the analyst reviews the output") and ones where the value is vague ("it will surface insights and help teams move faster").

The first category tends to succeed. The second tends to produce demos that don't make it to production, or projects that ship but don't get adopted.

---

## The patterns that reliably deliver

**Document processing and extraction.** Taking unstructured documents — contracts, reports, invoices, emails — and extracting structured information is where LLMs deliver the most consistent, measurable value. The task is well-defined, the output is verifiable, and the alternative (manual extraction) is slow and error-prone. This pattern works: a human still reviews the output, but the volume they can handle in a day increases significantly.

**First-draft generation with human review.** Using an LLM to generate a first draft of reports, summaries, emails, or documentation — with a human reviewing, editing, and approving before it goes anywhere. The key phrase is "first draft." This pattern works because it removes the blank-page problem and the repetitive formatting work, while keeping a human responsible for accuracy. It fails when the review step is removed or treated as a formality.

**Code assistance for specific, well-scoped tasks.** Generating boilerplate, explaining code, suggesting test cases, writing documentation for existing code. These have clear success criteria and fast feedback loops. The developer knows immediately if the generated code is useful. The ambiguous failure modes of general reasoning don't apply.

**Search and retrieval over internal knowledge.** RAG-based systems that let people ask questions about internal documents, policies, and knowledge bases. The value is real — finding the right document in a large repository is genuinely hard, and LLM-assisted search is better than keyword search for complex queries. The prerequisites: the documents need to be in the system, the system needs to cite sources, and "I don't know" needs to work reliably.

**Classification and routing.** Using LLMs to classify incoming content (support tickets, emails, feedback) and route it to the right team or workflow. Well-defined categories, measurable accuracy, clear fallback when confidence is low. This pattern works at scale and is easy to evaluate.

---

## The patterns that struggle

**Open-ended insight generation.** "Ask the AI what insights we should take from this data." The problem: insights require context, judgment, and knowledge of what's already known that an LLM doesn't have. You get plausible-sounding outputs that require significant domain expertise to evaluate — which means the people doing the evaluation are doing most of the actual work.

**Autonomous agents for complex multi-step tasks.** The demos are genuinely impressive. The production reality: autonomous agents for complex, multi-step workflows fail in unpredictable ways when they encounter situations outside their training distribution, and recovering from agent failures is often harder than just doing the task manually. The useful framing: treat agents as tools that assist humans in multi-step tasks, not autonomous systems that replace human judgment.

**Generating content that goes directly to external audiences.** Marketing copy, legal responses, customer emails — generated and sent without human review. The accuracy, tone, and appropriateness requirements are high. The failure modes (hallucinated facts, inappropriate tone, legally problematic claims) are expensive. The productivity gain from removing the review step doesn't justify the risk.

**Replacing complex knowledge worker judgment.** "Use AI to evaluate vendor contracts and make recommendations." Vendor contract evaluation involves regulatory context, organizational priorities, negotiation history, and risk tolerance — knowledge that isn't in the document. LLMs can assist in reading and summarizing contracts (document processing pattern — it works). Replacing the evaluation is different.

---

## The evaluation question that cuts through proposals

When someone presents a GenAI project proposal, the question I've found most useful:

*"How will you know in 90 days whether this is working?"*

If the answer involves specific, measurable changes to how long something takes, what the error rate is, or what volume a person can handle — that's a project worth evaluating seriously. If the answer involves general statements about productivity, satisfaction, or insight quality that can't be measured — that's a signal to probe further before committing.

GenAI projects that succeed have defined success criteria before they start. This sounds obvious. In practice, teams more often start building before defining how they'll evaluate.

---

## Governance isn't what slows you down

The organizations I've seen move fastest with GenAI are the ones that got governance right early — not by building a bureaucracy, but by answering five practical questions before the first production deployment:

What data can touch which tools? Who owns the approved tool list? What gets validated before leaving the organization? What gets logged for audit? Who do you call when something goes wrong?

Teams that have answers to those five questions can approve new AI projects faster, not slower. They don't spend six weeks on a compliance review for each one because the framework already exists.

The teams that skipped governance to move fast tend to have the incident that forces the retroactive governance conversation anyway — under worse conditions, with a broken thing in production.

*What GenAI pattern is your team currently evaluating? [Happy to share what I've seen work.](/about)*
