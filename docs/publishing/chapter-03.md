# Chapter 03 publishing record

## Scope and source provenance

The author authorized the entire handwritten Chapter 03 and then requested useful interactive components, roughly one per important article. The twelve original sections remain the outline. Manuscripts are drafted in the author's continuing ChatGPT writing conversation; completed responses are retained unchanged, with approved publication adaptations in separate working copies. The established `작성자 검토 전` notice remains on every imported note. All twelve manuscripts, the selected PNG and four interactive components are now integrated and have passed source, mathematical, local build and desktop/mobile review. Author review remains pending. Publication and public-page verification are separate pending steps.

- Handwritten source: `Ch3.pdf`, 16 physical pages; SHA-256 `e990bd67437233c739f49239908aac4190039000f41527e7d1e45037f1db6fd1`. Pages 1 and 16 are blank; p15 recaps existing material and is not a new section.
- Primary lecture: Kyungwoo Song, Yonsei University, `week2_1_vi.pdf`, 80 physical pages; SHA-256 `4f891803f571d38296635b8643de9b892fe5596c6914d8783b132b3241af527a`. Additional lecture EM examples outside the handwritten outline are excluded.
- Internal source map: `work/ch03-source-map.md`; handwritten pp11–13 form the mathematical supplement within 3.10. Both handwritten formulas and corresponding rendered lecture pages were reviewed; source errors are corrected in the manuscript, not treated as instructions.
- [Writing conversation](https://chatgpt.com/c/6aea6c67-c6b8-83ee-b53e-0b29c2add537), continued from the author's [shared writing context](https://chatgpt.com/share/6aea6a9a-1f04-83ec-917e-de7dba704b78).
- Any selected static figures must be generated in the [designated ChatGPT image conversation](https://chatgpt.com/c/6aea6e49-e86c-83ee-bb10-5ef0f1a282c0), continuing the [shared image context](https://chatgpt.com/share/6aea6dc0-ee6c-83ee-8037-06ddd1e95476). Original downloaded bytes, prompts and hashes will be recorded when imported. The single selected shared-encoder image has now been imported unchanged and independently reviewed.
- Isolated implementation branch: `codex/ch03-chatgpt-20261104`, based on main `83cbc2dbe12f62e601489fcbb21535a7c5148ed4`. Existing chapters and unrelated worktrees are preserved.

## Section status

All page numbers are physical PDF pages. Source review is complete for the outline; each completed manuscript receives a separate source/math review before import.

| Section | Handwritten heading | Handwritten pages | Supporting lecture pages | Current state |
| --- | --- | --- | --- | --- |
| 3.1 | Why Does Inference Become Intractable? | 2 upper | 3–5, 8 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.2 | Latent marginal likelihood | 2 middle | 3–5 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.3 | Approximate Posterior q(z) | 2 lower | 8, 18–20, 23–27 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.4 | Convexity, Concavity, Jensen’s inequality | 3 upper | 9–15 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.5 | Deriving the Evidence Lower Bound | 3 lower | 15–17, 25–26, 30 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.6 | ELBO and the true Posterior | 4–5 | 18–24, 63–68 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.7 | The ELBO Gap as a KL Divergence | 6 | 21–24, 30–32; exact example handwritten | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.8 | Variational Families | 7 | 26–27, 31–33 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.9 | Mean-Field Variational Inference (MFVI) | 8 upper | 28–34 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.10 | Coordinate Ascent Variational Inference (CAVI) | 8 lower–13 | 33–51 | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.11 | Amortized Variational Inference | 14 upper | 26–27; encoder detail handwritten | Imported; source/math and desktop/mobile reviewed; publication pending |
| 3.12 | Monte Carlo Estimation of the ELBO | 14 lower | 7, 26, 29; detailed estimator handwritten | Imported; source/math and desktop/mobile reviewed; publication pending |

## Manuscript adaptations and integrity

Raw completed ChatGPT responses reside in `work/ch03-chatgpt-source/ch03-3N-original.md`; working copies use `-ready.md` only when needed. Import adds registered course/chapter/order metadata and the review notice, while preserving prose, equations and section headings.

- 3.1: clarify the opening phrase “데이터를 생성하는 확률은 쉽게 계산할 수 있어도” as “관측값과 잠재변수 값이 함께 주어졌을 때 결합분포의 값은 쉽게 계산할 수 있어도”, distinguishing evaluation of the joint density from marginalization. The authoring agent approved this mathematically necessary clarification; the original response is unchanged.
- 3.2–3.5: source/math review passed without prose changes. Section 3.4 retains its single `[demo:jensen-log]` marker.
- 3.5: a render-only adaptation splits the three terms inside the expectation brackets across two aligned rows. Its original 392.55 px width exceeded the 350 px mobile text area; every term and later equality is preserved.
- 3.7–3.8: source/math review passed without prose changes; no figures or demos are added. In 3.7 only, render-only aligned rows separate the mean/covariance definitions and the left side of the final optimum-KL substitution (initial 375.08 and385.45 px widths against 350 px available). All mathematical content is preserved.
- 3.6: remove “첫 번째 등식이 아니라” from the sentence about the final equality in the EM likelihood chain; its first relation is an inequality. Formulas and all other prose remain unchanged, and the raw response is retained.

- 3.9: replace the description of diagonal Gaussian contours as “parallel to the coordinate axes” with the precise statement that this example’s optimal diagonal Gaussian has equal variances and circular contours. This is the distribution actually shown by the demo; raw text is retained.

- 3.10: both source reviewers passed the entire CAVI derivation, Gaussian example and p11–13 functional/Euler–Lagrange supplement without corrections. Its length follows the source’s six-page section rather than expanding the outline. One CAVI demo is retained; no static figure is needed. Three later render-only aligned line breaks separate left and right sides in the KL substitution, Gaussian log density and first variation (initial 357.375,355.352,401.398 px against 350 px available); all terms and signs remain unchanged.

- 3.11: source/math review passed without prose changes. A figure link replaces the marker in a working copy for local math QA, retaining the original caption. The actual shared-encoder PNG was then imported unchanged and passed both visual reviewers and desktop/mobile rendered-page checks.

- 3.12: source/math review passed unchanged, including iid unbiasedness, variance scaling, the distinction from log-evidence estimation, and the approved Gaussian relative-ELBO demo. Section 3.11’s final response recapture matched the previously reviewed raw SHA-256.

SHA-256 values below distinguish untouched ChatGPT output, prepared manuscript body and metadata-bearing note. Working equals raw when there is no adaptation.

- **3.1** — raw `84b832823574e7746dc2769c3da0c4b1a37c204c103ef55e185696b0a1af2195`; working `f00e819bb4c8154df37b64a6da62605004302eacbb9f76fd089e80c012990677`; note `66fb7387aab9c8043478bb105cf3d102913d2712acc90fba58ed503b189b6524`.
- **3.2** — raw `43f35960c066e2580854f7777ab2d87f995eeace442ad8259c4b9bd1ae68b284`; working `43f35960c066e2580854f7777ab2d87f995eeace442ad8259c4b9bd1ae68b284`; note `e4bed7b6eaffc1c50202f2f1361bec67c950c52855320a4a6764376132d36635`.
- **3.3** — raw `5698f0fe12d33be0d78a7d181cf5350f12f9393e7fcbbdc8168775815e2f6f2f`; working `5698f0fe12d33be0d78a7d181cf5350f12f9393e7fcbbdc8168775815e2f6f2f`; note `04a00d4cb53fdcc276f57b836bb5fb609a6a604cfee4e0908b8c182923e8cac8`.
- **3.4** — raw `855a47d79e8a2f76d0db256e0bcf4dbbcf9678bf40d9d9eece58d51711481bf4`; working `855a47d79e8a2f76d0db256e0bcf4dbbcf9678bf40d9d9eece58d51711481bf4`; note `fcf76e00fbaa7a70ba1c9e05ff1eb9e79ac2bdb5abe4a1c98fac9591fd19b49f`.
- **3.5** — raw `bedea9e037f947ee37d227c0e7c9b55b868011a4dc0b73f1365a35e7374394ff`; working `598d7dcf45a4eca803aac6f91ec7a183add306074374b5a67a29bfb568cd10c1`; note `0a50f6029b1d5c0c8faa3658703d8d97e8adcb18c9993c0a0bfe480a8fef851b`.
- **3.6** — raw `a1d664c48dee19b0c4dab4625b65ce5dc1e5b0796bcfafe4452b5bb468520510`; working `f9fbbe4d3d81e4159e0f8cd1714d05f2d3e7bedfd4196a499dd195185eb92692`; note `37648b3f7d05ea546db664d440b2b3f49c1bf643ba970e5672074f59bf86e240`.
- **3.7** — raw `f18ad8d6ddaaec22cdc54df5b669f171dcad6b26806fa95289175294dce51d04`; working `a13aedf4566437051208067405a5ea98835f4a3d0cee5d0cf540d9df66b64074`; note `1e6674fcfdbcda41aac9fbb1761cd20342705c0b7211b607a7675c23b8e0a289`.
- **3.8** — raw `349c5240c972ee03d1452642158e8415b82ec7910d1706c9af77da0bd949b3d1`; working `349c5240c972ee03d1452642158e8415b82ec7910d1706c9af77da0bd949b3d1`; note `cab93028b2889d7a2e92c3f0787e11c23c0e82945fc3f26fc30883dded4284b4`.
- **3.9** — raw `86c3dd7678b70ca294e04f51605e0e7e2bd4dc36d2c095d534d388cabda011bd`; working `5e6e839bde11f58ed5f3b6e57c571e8ee4ee54949f9c63966d942ab2ea723fd6`; note `c8722d599fe916b5ed1f493ca341bc2e53b9283ca424b21f65fd9755b88355cc`.
- **3.10** — raw `a8f15ccd3499b07c79e5b2b5655512d267b9c0a5da1cc1e150630a73805d84bb`; working `6bd0d12fda9b31e70fffcf39b8fd29ec001fd08a397387f9e1779c8a8ad375a7`; note `470b71647d38e821f13b58df62015d1358048ca29adac319b72e42fcde5c2cf9`.
- **3.11** — raw `0faf47dcc309a0335d5f3401303259ccedc3f34738193990d0d8f9a5c8e5cab3`; working `4a45100ac15456b35ada8b2a1039e1a1656e89d8b4b137a8a00615e056491afb`; note `8a47a530dcaaf7e7e529209b0c9b347de6ba29ea7e2c3d47edd8f04e6a0dc5c6`.
- **3.12** — raw `d1e4ac5d16f4c7a0ed48c02b9459d7983b8037bb69df2ee6d0c9f67c51af6723`; working `d1e4ac5d16f4c7a0ed48c02b9459d7983b8037bb69df2ee6d0c9f67c51af6723`; note `47bdd7e1099f01a81aac81e8f94a91d659fa9047b7f7becc468348270edc12da`.

## Static figure: shared inference network

Section 3.11 uses the actual ChatGPT-generated PNG `공유 추론 네트워크 구조.png`, copied without resizing, redrawing or other byte changes to `content/notes/images/ch03-311-shared-encoder.png`. It is 1672 × 941 px, 1,291,378 bytes. Both the root and independent source reviewer confirmed all three `xᵢ→fφ→λᵢ→qᵢ(zᵢ)` row mappings, nine arrows, subscripts and the shared-φ grouping. The original ChatGPT caption is retained.

- Download and repository SHA-256, identical: `d6bc6ac10cfb70982128fcb82d86368a5f41cb7aa18610fa0a4390f7cadb3bff`.
- Actual writing-chat prompt: `work/ch03-chatgpt-source/figure-311-prompt.txt`; SHA-256 `933cbbdca9fe4161c5133416a98ca4d4793a78376ba523158a90032ba4bedd12`.
- Generation used the designated image conversation linked above, continuing the author's shared image context. The prompt was produced by the writing conversation, not independently substituted in the publishing workspace.

## Interactive decisions

The author's explicit interactive request authorizes these code components; it does not change the separate ChatGPT-only static-image pipeline. The four components serve different questions and are limited to one per selected article. Controls remain compact, with interpretation in the manuscript rather than extra tutorial panels.

- **3.4 `[demo:jensen-log]`**: positive values y₁,y₂ and first-point weight t; compare `log(t y₁+(1−t)y₂)` with `t log y₁+(1−t)log y₂`. The log curve lies above its chord; equal points and endpoint weights give equality.
- **3.9 `[demo:variational-gaussian]`**: reuse the handwritten 3.7 posterior `N(0, [[1,ρ],[ρ,1]])`. Compare the full-covariance family with the mean-field optimum `N(0,(1−ρ²)I)` and its minimum reverse KL `−½log(1−ρ²)`. Equal-Mahalanobis contours use the same spatial scale; conditional variance is not mistaken for marginal variance or standard deviation.
- **3.10 `[demo:cavi-gaussian]`**: sequentially update `m₁←ρm₂`, then `m₂←ρm₁` using the newest mean. Both factor variances are initialized and held at `1−ρ²`; the demo isolates mean updates. The source default ρ=0.8, means (1,1) yields (0.8,0.64) after two updates. Display KL, including the remaining family gap, rather than an unknown absolute ELBO.
- **3.12 `[demo:monte-carlo-elbo]`**: reuse that tractable Gaussian and q*, fixing ρ=0.8. Estimate the relative ELBO `L−log p(x)=−KL` by iid samples of `log p(z|x)−log q*(z)`. Exact mean is `½log(0.36)=−0.5108256238`, integrand variance 0.64, standard error 0.8/√L. The zero line is the shifted log-evidence reference; sample estimates are not constrained below it. Seeded nested prefixes isolate changes in sample size, and a fresh seed starts a new sample sequence. This is explicitly a tractable illustration, not a claim that general posterior density is available.

The Gaussian and Jensen kernels are dependency-free. The new demos use the existing lazy iframe, resize message and portable-preview architecture; existing demos remain registered. Static site build copies the modules and HTML without a new dependency.

## Local verification and publication state

- The repository's full check command passed all **64 tests**, including five new mathematical-kernel tests, and built **47 notes**. Exact output is retained in `work/ch03-chatgpt-source/full-check.log`. The 35 existing notes are preserved.
- All twelve Chapter 03 articles passed at **1280 px desktop and 390 px mobile**: 586 math containers at each width, zero MathJax errors, zero overwide display equations and zero page overflow. Every article retains its author-review notice. Evidence: `desktop-qa.json`, `early-mobile-qa.json`, `middle-mobile-qa.json`, `cavi-mobile-qa.json`, `last-mobile-qa.json` in the task's `work/ch03-chatgpt-source/` directory, with final rechecks superseding earlier width findings.
- All four interactive controls passed. Jensen endpoint weights give zero gap. The family selector changes between mean-field variance 0.36 / KL 0.5108 and full covariance variance 1 / KL 0 at ρ=0.8. Sequential CAVI gives means (0.8,1), then (0.8,0.64), with KL decreasing and the residual family gap preserved. MC seed 312 gives −0.3379 at L=30, −0.5105 at L=10000 with SE=0.0080; returning to L=30 reproduces the same prefix, and seed 313 changes the sequence.
- Embedded mobile frames fit 350 px without internal overflow. Desktop frames are 782 px wide with plots capped at 480 px: Jensen height 562 px, Gaussian family and CAVI 696 px, MC 609 px. The image is 1672 × 941 px and renders at 782 px desktop and 350 × 197 px mobile; shared-φ label, row labels, arrows and caption were visually legible.
- An independent source reviewer passed the Gaussian/Jensen kernels, CAVI/MC interpretation and app/portable-preview integration (`work/ch03-source/interactive-math-review.md`). Shortcodes load lazily and remain literal in code fences. All four packed modules parse without unresolved imports. The final portable preview also passed actual browser checks at 390 px viewport/350 px frames: all four srcdoc demos rendered with correct headings/default statistics, no internal overflow, and the MC sample-size control updated correctly (`portable-browser-qa.json`).
- Final independent content-integrity review passed for all twelve raw/note hash pairs and direct diffs: only three approved wording clarifications, formula wraps in three sections and the single PNG binding differ. Four demo markers, one image and no unresolved figure markers are present; PNG bytes match the download (`work/ch03-source/final-content-integrity-review.md`).
- Ten implementation files (app, preview script, kernel test and seven demo files) were uploaded to review branch head `7096f03b81b17401851ba8f0e972758e501b88ec`; all ten remote blobs matched local bytes (`remote-code-check.json`). The final 24-file source comparison, PR/merge, deployment and public-page checks remain pending. Branch uploads are not public deployment evidence; author review will remain pending after technical publication.
