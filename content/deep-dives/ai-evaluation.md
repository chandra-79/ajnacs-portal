# Score grounded answers at the claim level
@lesson claim-level-grounding | Score answer support from the supplied evidence and keep abstention visible as a separate outcome.
@chart Scores on a worked evaluation set | %
@value Answers fully supported | 3/5
@value Claims supported | 8/10
@value Valid abstentions | 2/3
@match grounded | groundedness | citation | hallucination | retrieval augmented | rag | unsupported
@source NIST AI 600-1 · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1
@source Microsoft Learn · Groundedness evaluation | https://learn.microsoft.com/en-us/azure/ai-foundry/concepts/evaluation-evaluators/rag-evaluators

## Make support independently reviewable

Keep the user question, retrieval snapshot, answer, and rubric together. Split answers into independently checkable claims. Review whether each claim is supported by the evidence the system was given. An answer can be factually correct in the world and still be unsupported by the retrieved passages. A citation needs to support the claim attached to it. A link to a generally relevant document is insufficient.

## Keep the denominators visible

In this example five questions have an answer in the evidence. Three generated answers are fully supported. Eight of ten claims in those answers are supported. Report 60% fully supported at the answer level and 80% at the claim level. Separately, of three questions whose evidence is insufficient, the system appropriately abstains on two, or 66.7%. Avoid merging answer and claim denominators. A longer answer can generate more low-value claims and change the aggregate.

Have a second reviewer score a subset and resolve disagreements using explicit cases. Sample ambiguities and stale documents deliberately. Log retrieval failures separately from generation failures because each has a different owner and remediation.

## Limits of the example

The example set is too small for a deployment guarantee. Overall success can hide failures on important topics. Keep sensitive slices visible and avoid publishing raw prompts or evidence that contains restricted data.

# Compare model versions on the same examples
@lesson paired-model-evaluation | Use paired outcomes to account for what improved and what regressed at the same time.
@chart Paired outcomes on 100 cases | cases
@value Both passed | 68
@value Candidate only passed | 14
@value Baseline only passed | 6
@value Both failed | 12
@match regression | benchmark | paired | evaluation set | comparison | judge
@source NIST AI 600-1 · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1
@source statsmodels · McNemar test | https://www.statsmodels.org/stable/generated/statsmodels.stats.contingency_tables.mcnemar.html

## Preserve the pairing

Give both variants the same 100 cases. Freeze the retrieval corpus, system prompts, budget, and judge rubric. Record every outcome before aggregating. The worked table has 68 cases where both pass, 14 rescued by the candidate, six regressed, and 12 both fail. Baseline passes 74; candidate passes 82. The net gain of eight percentage points contains both the 14 improvements and the six regressions.

## Examine disagreements first

Look at the 20 cases on which the variants disagree. Decide whether failures are exchangeable within the paired design. An exact McNemar test uses the discordant counts under a null of equally likely improvement and regression, with independent evaluation pairs. Here 14 versus six gives a two-sided exact p-value of roughly 0.115. Treat evidence of improvement as inconclusive at a conventional 0.05 threshold. A single serious regression may matter even if an aggregate test reaches significance.

If the model emits different results for the same prompt across runs, pair by prompt and keep repeated calls nested inside that prompt. Treating repeated calls as independent cases can understate variability. Keep independent judgments and adjudicate reviewer disagreements.

## Limits of the example

The chart is a constructed pairing. A score comparison only covers the test distribution, rubric, and model settings shown. Review representative cases and a failure-focused slice before deployment.

# Set rollout gates for AI systems with rare failures
@lesson rare-failure-release-gates | Convert zero observed failures into an upper bound and combine it with an explicit staged release plan.
@chart Upper failure bound after zero failures | %
@value 100 independent trials | 2.9513
@value 300 independent trials | 0.9936
@value 1,000 independent trials | 0.2991
@match rollout gate | release gate | human approval | governance | canary | rare failures | safety
@source NIST · Confidence intervals for proportions | https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm
@source NIST AI 600-1 · Generative AI Profile | https://doi.org/10.6028/NIST.AI.600-1

## Define the failure

Before release, write an observable definition. For example, sending an unapproved model recommendation to a customer is one failure, regardless of how many tool calls occurred. Group observations by independent business request. Verify release guards with targeted cases separately from estimating a representative failure rate.

## Derive the bound

Under a binomial model with n independent, identically distributed trials and fixed failure probability p, the chance of no failures is (1 − p)ⁿ. Set that to 0.05 and solve for the one-sided 95% upper bound: p = 1 − 0.05^(1/n). With zero observed failures, 100 trials give about 2.95%, 300 give 0.99%, and 1,000 give 0.30%. Zero observed failures and a low underlying failure rate are different statements.

Predefine what happens when the gate fails. Start with shadow evaluation and compare the relevant workflow before giving the new variant production authority. Stage exposure, monitor separately by high-impact slice, and identify what can be rolled back. Keep human approval where the consequence is material.

## Limits of the example

Duplicate requests, shared inputs, and shifting traffic violate the binomial assumptions. The bound does not apply to deliberate red-team collections or a different deployment population. Maintain separate controls, incident review, and ongoing sampling.
