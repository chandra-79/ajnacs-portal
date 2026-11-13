# Ajna rhombus motion study

Request: revisit the existing rhombus logo, its open/close cycle on reload and clicks, research the motion, and provide working variations before choosing a production direction. Chandra selected **B — Eight-petal bloom**. The production header now uses this direction; `/brand-lab/` retains the three working comparisons.

## What the earlier work intended

The September 22 implementation (`6c1b527`) retained an intact faceted diamond as a central bud and unfolded eight leaves around it. Earlier attempts had split the central facets apart, creating an unwanted mouth-like hole. The current mark source is `tools/mark.mjs`, the site lockup is `tools/shell.mjs`, and motion is near “the mark blooms” in `assets/css/site.css`.

The remaining implementation problems are concrete: a 3.2-second CSS arrival animation and independent hover/focus transitions drive the same transforms; whole-SVG perspective competes with flat SVG leaf folding; there is no click controller because the entire lockup is a home link. Focus can hold the mark open indefinitely. No single controller owns progress or interruption.

## Research and resulting decisions

- [IBM Carbon motion](https://carbondesignsystem.com/elements/motion/overview/) distinguishes restrained productive motion from occasional expressive moments. **Our design inference:** use one arrival flourish, then rest; keep interaction immediate and reversible. Its standard easing guidance supports continuity for objects which remain on screen.
- [Material motion](https://m3.material.io/styles/motion) uses spring physics with standard and expressive schemes. **Our design inference:** use a critically damped spring for a precise fold with no decorative bounce. This implementation is original JavaScript, not an implementation of Material’s motion library.
- [W3C animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) recommends respecting reduced motion. The study supports system reduced motion and a visible Still mode, including a live preference change.
- [MDN Web Animations guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API) documents cancellation and reversing as alternatives to stacking new animations. Here one requestAnimationFrame timeline drives a common scalar; user input changes the target while preserving position and velocity. All parts therefore reverse together without queued cycles or CSS precedence conflicts.

## Working directions

**A — Facet bloom (alternative).** Four angular petals with restrained facet shading unfold behind a solid central diamond. Strong at 40px; links the existing cut geometry to an opening flower.

**B — Eight-petal bloom (selected).** The nearest continuation of the original intention. Eight curved leaves unfold in one coordinated plane. No simulated 3D SVG transforms; a solid centre throughout.

**C — Prism expansion.** Three nested four-colour rhombus rings telescope around the solid diamond. More architectural and less botanical; compare carefully at actual header size before selecting.

All three reuse the exact source-generated resting mark and its four colours. Both large and 40px views share state. Arrival opens, holds briefly, and closes; click/tap/Enter/Space toggle and interrupt. Icon buttons control the motion separately from the wordmark’s ordinary home link. No hover-driven state, navigation delays, looping, tracking, external script or animation dependency is added.

Build the review page with `node tools/brand-lab.mjs`. The review page is excluded from search indexing. The selected B header separates the icon’s toggle button from the ordinary home link. The footer and favicons retain the exact closed source mark. Its existing icon hash verifies that the unchanged resting geometry remains consistent. `assets/js/brand-motion.mjs` now drives the production eight-leaf fold using the shared spring. The obsolete CSS animation is removed; the guard rejects its return.
