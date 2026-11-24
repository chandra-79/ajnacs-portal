---
title: "Generative AI in the Enterprise: Patterns That Deliver Value vs. Patterns That Sound Good in Demos"
description: "Enterprise GenAI patterns need task-specific evaluation that includes review effort, errors and operating cost. Here's how to tell the difference early."
date: 2027-05-24
tags: ["AI & MLOps", "Enterprise AI", "Governance"]
format: article
---

GenAI project proposals tend to fall into two categories. Ones where you can articulate the before-and-after in a sentence ("currently this task takes an analyst 4 hours; with this tool it takes 20 minutes and the analyst reviews the output") and ones where the value is vague ("it will surface insights and help teams move faster").

The first category tends to succeed. The second tends to produce demos that don't make it to production, or projects that ship but don't get adopted.

## Patterns with concrete evaluation opportunities

**Document processing and extraction.** Taking unstructured documents — contracts, reports, invoices, emails — and extracting structured information offers a concrete opportunity to measure value. The task is well-defined, the output is verifiable, and the alternative (manual extraction) is slow and error-prone. This pattern works: a human still reviews the output, but the volume they can handle in a day increases significantly.

**First-draft generation with human review.** Using an LLM to generate a first draft of reports, summaries, emails, or documentation — with a human reviewing, editing, and approving before it goes anywhere. The key phrase is "first draft." This pattern works because it removes the blank-page problem and the repetitive formatting work, while keeping a human responsible for accuracy. It fails when the review step is removed or treated as a formality.

**Code assistance for specific, well-scoped tasks.** Generating boilerplate, explaining code, suggesting test cases, writing documentation for existing code. These have clear success criteria and fast feedback loops. Developers can test some properties quickly, but subtle correctness, security and maintenance failures still require review.

**Search and retrieval over internal knowledge.** RAG-based systems that let people ask questions about internal documents, policies, and knowledge bases. The value is real — finding the right document in a large repository is genuinely hard, and LLM-assisted search can complement lexical and structured search, with effectiveness depending on the task. The prerequisites: the documents need to be in the system, the system needs to cite sources, and "I don't know" needs to work reliably.

**Classification and routing.** Using LLMs to classify incoming content (support tickets, emails, feedback) and route it to the right team or workflow. Well-defined categories, measurable accuracy, clear fallback when confidence is low. This pattern works at scale and is easy to evaluate.

## The patterns that struggle

**Open-ended insight generation.** "Ask the AI what insights we should take from this data." The problem: insights require context, judgment, and knowledge of what's already known that an LLM doesn't have. You get plausible-sounding outputs that require significant domain expertise to evaluate — which means the people doing the evaluation are doing most of the actual work.

**Autonomous agents for complex multi-step tasks.** The demos are genuinely impressive. The production reality: autonomous agents for complex, multi-step workflows fail in unpredictable ways when they encounter situations outside their training distribution, and recovering from agent failures is often harder than just doing the task manually. The useful framing: treat agents as tools that assist humans in multi-step tasks, not autonomous systems that replace human judgment.

**Generating content that goes directly to external audiences.** Marketing copy, legal responses, customer emails — generated and sent without human review. The accuracy, tone, and appropriateness requirements are high. The failure modes (hallucinated facts, inappropriate tone, legally problematic claims) are expensive. The productivity gain from removing the review step doesn't justify the risk.

**Replacing complex knowledge worker judgment.** "Use AI to evaluate vendor contracts and make recommendations." Vendor contract evaluation involves regulatory context, organizational priorities, negotiation history, and risk tolerance — knowledge that isn't in the document. LLMs can assist in reading and summarizing contracts (document processing pattern — it works). Replacing the evaluation is different.

## The evaluation question that cuts through proposals

When someone presents a GenAI project proposal, a useful question:

*"How will you know in 90 days whether this is working?"*

If the answer involves specific, measurable changes to how long something takes, what the error rate is, or what volume a person can handle — that's a project worth evaluating seriously. If the answer involves general statements about productivity, satisfaction, or insight quality that can't be measured — that's a signal to probe further before committing.

GenAI projects that succeed have defined success criteria before they start. This sounds obvious. In practice, teams more often start building before defining how they'll evaluate.

## Governance isn't what slows you down

A practical enablement program answers governance questions early — not by building a bureaucracy, but by answering five practical questions before the first production deployment:

What data can touch which tools? Who owns the approved tool list? What gets validated before leaving the organization? What gets logged for audit? Who do you call when something goes wrong?

Teams that have answers to those five questions can approve new AI projects faster, not slower. They don't spend six weeks on a compliance review for each one because the framework already exists.

The teams that skipped governance to move fast tend to have the incident that forces the retroactive governance conversation anyway — under worse conditions, with a broken thing in production.

*What GenAI pattern is your team currently evaluating? [Discuss a measurable pilot.](/about)*

## Define the unit of value before the prototype

A proposal should identify an accepted task, not just an interaction with a model. For document extraction, acceptance may require every required field to match the source. For a draft, it may mean an editor approves the final text after checking factual claims. For code assistance, it may mean a reviewed change passes meaningful tests and meets the requirement. Each definition includes work beyond generation.

Measure the existing workflow with the same acceptance rule. An assistant should not receive credit for a fast first draft while the baseline is measured through final approval. Include preparation, review, correction and exception handling. Where tasks vary substantially, compare similar task classes and report the mix instead of averaging unrelated work into one productivity claim.

## Worked example: drafting speed versus completed work

Consider a hypothetical set of twenty reports. The manual workflow takes 60 minutes of drafting and 30 minutes of review per report, for 90 minutes each and 1,800 minutes total. An assisted workflow takes 20 minutes of drafting, 45 minutes of review and 15 minutes of correction per report, for 80 minutes each and 1,600 minutes total.

The chart compares the stage totals: manual drafting 1,200 minutes, manual review 600, assisted drafting 400, assisted review 900 and assisted correction 300. Assisted drafting is much faster, but total effort falls by only 200/1,800, approximately 11.1%. The 66.7% reduction in drafting time is not the same as the improvement in completed-report effort.

These are synthetic timings, not customer results. If the assisted workflow also needs 300 minutes of one-time setup during this small trial, its trial total becomes 1,900 minutes, exceeding the manual total by 100. At larger volume the fixed setup cost may be amortized, but that requires a stated horizon and stable quality. A useful evaluation shows both recurring effort and adoption cost.

Inspect why review grows. It may reflect unreliable facts, awkward structure or a reviewer learning a new interface. Those causes imply different next steps. A better source display could reduce review effort without changing the model, while a fundamentally unreliable task may need a narrower scope or a different method.

## Match patterns to evidence and consequences

Extraction is attractive when outputs can be checked, but a valid schema does not guarantee correct values. Drafting can save effort when reviewers have reliable source material and enough time to inspect claims. Classification works best with a clear taxonomy and a useful route for ambiguous cases. None of these patterns guarantees value merely because it is common.

Search assistance should be compared with a competent search baseline, including lexical and structured filters where relevant. A conversational answer can help readers synthesize evidence, but it can also hide missing context behind fluent prose. Measure successful information finding and source verification, not only whether users asked a question.

Agentic workflows need bounded authority. A multi-step assistant can be useful when each tool has a clear contract, state is recoverable and consequential effects are controlled. The risk depends on the actual capabilities and failure handling, not the word agent. Start with a scope where errors can be detected and recovered before expanding autonomy.

## A practical ninety-day experiment

Use the first phase to map the current workflow, agree on acceptance criteria and collect representative examples. Identify data permissions and the fallback before connecting a prototype to real work. A small synthetic fixture can validate the interface and failure paths while the team prepares a suitable evaluation dataset.

In the next phase, compare a simple baseline with one assisted configuration. Keep tasks, rubric and reviewers as comparable as practical. Randomize or counterbalance task order when learning effects could influence results. Record failed and abandoned attempts as well as completed tasks. A study that excludes the difficult cases can make almost any assistant look productive.

Use the final phase for a limited operational pilot and a decision. Measure accepted-task effort, error categories, user adoption, support burden and recurring cost. Decide whether to expand, narrow, revise or stop. Stopping a weak proposal with clear evidence is a useful outcome; the ninety-day period is a planning structure, not a promise that every enterprise system can be fully validated in three months.

## A worksheet for proposals that sound impressive

Ask the proposer to fill in the current task, user, evidence source, accepted outcome, existing effort, expected mechanism and main failure consequence. Then add the evaluation dataset, reviewer, rollback path and decision date. A vague statement such as "surface insights" should become a specific decision or investigative question before implementation starts.

For each claimed benefit, identify its denominator. Time saved per attempt differs from time saved per accepted task. Adoption among invited users differs from adoption among eligible users. Lower model spend differs from lower total operating cost. These distinctions make proposals comparable and prevent a favorable metric from substituting for the actual business objective.

Include one adverse scenario. A source is outdated, a user supplies incomplete information, or a tool becomes unavailable. Describe what the product should do and how the outcome will be checked. If the answer is simply that the model will be careful, the operating design is unfinished.

## Preserve a reader and operator feedback loop

Users need an easy way to correct a result, inspect sources and resume the ordinary workflow. Feedback should identify the task and error category without requiring users to write a technical incident report. Keep complaint-driven examples for diagnosis and a separate representative sample for estimating routine quality.

Operators need the configuration, source versions and final disposition. Product teams need evidence of repeated use and accepted outcomes. Bringing those views together helps distinguish a technically functioning feature from one that people find useful. A strong enterprise pattern is one whose value survives this full accounting, including the human work that remains after the model finishes generating.

## Sources and further study

- [Breck et al. — The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/)
- [Becker et al. — Early-2025 AI and experienced developer productivity](https://arxiv.org/abs/2507.09089)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
