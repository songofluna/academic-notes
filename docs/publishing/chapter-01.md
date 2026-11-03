# Chapter 01 publishing record

- Source: user-provided handwritten `Ch1 3.pdf`, 14 pages (PDF page numbers, not printed labels).
- SHA-256: `8be87a5939c17ee2cad0013db2ad532ed2b2b49a314750ad4c22ead6af84410a`
- Inspected: all 14 rendered pages on 2026-11-04.
- Current pass: §§1.9–1.10, publishing the author-supplied manuscripts as separate notes. Earlier notes remain unchanged.
- Existing §§1.1–1.2: `content/notes/newnote1.md`; preserve without rewriting.
- Editorial workflow: follow [the publishing guide](README.md). Keep prose proportionate to the handwritten source; include only necessary explanations. Published edited drafts remain author-review-pending. The concision revision below supersedes the initial expanded prose.

## Chapter plan

| Sections | PDF pages | Proposed note scope | Status |
| --- | --- | --- | --- |
| 1.1–1.2 | 1 | Introduction, data/model distributions, notation | Existing published note; unchanged |
| 1.3 | 2, upper half | Finite samples, empirical distribution, resampling | Published; author review pending |
| 1.4 | 2, lower half | Density evaluation, sampling, Gaussian pushforward | Published; author review pending |
| 1.5 | 3 | MLE, empirical NLL, Gaussian example and degenerate case | Published; author review pending |
| 1.6 | 4 | Forward KL and population/empirical likelihood | Published; author review pending |
| 1.7 | 5–6 | Reverse KL, mode covering/seeking, support example | Published; author review pending |
| 1.8 | 7–8 | Data-space score, Fisher divergence, Gaussian/mixture examples | Published author-supplied manuscript; review notice retained |
| 1.9 | 9–10 | f-divergence, JS, total variation, Wasserstein comparison | Published author-supplied manuscript; review notice retained |
| 1.10 | 11 | Explicit/implicit models and density existence | Published author-supplied manuscript; review notice retained |
| 1.11 | 12–13 | Latent variables, changes of variables, Jacobian examples | Planned |
| 1.12 | 14 | Taxonomy of major generative-model families | Planned |

The author paused the earlier batch drafting request, then supplied §§1.8, 1.9 and 1.10 for publication. §§1.11–1.12 remain unstarted pending further instruction.

## Source review for future passes

These observations are review flags, not silent corrections to published notes.

- p. 4, §1.6: resolved in the section 1.6 record below. The original line mixed a finite sum and a population expectation; the note defines them separately and uses approximation rather than equality.
- p. 5, §1.7: resolved in the section 1.7 record below. The Reverse KL figure describes Mode Seeking; its “Mode Covering” caption was inconsistent with both the diagram and surrounding prose.
- p. 6, §1.7.4: resolved in the section 1.7 record below. The first probability ratio is 1, so the term is log 1 = 0, not log 0.
- pp. 7–8, §1.8: log-score definitions need positive density on the domain; verify assumptions in the zero-divergence argument.
- p. 9, §1.9: the reverse-KL substitution line has a suspicious extra factor; verify before publishing.
- p. 10: “Total Variance distance” should be checked against the standard term “total variation distance.”
- p. 13, §1.11 exercise: verify the density arguments and the direction of the Jacobian before transcribing.

## Initial publication — superseded prose

### Notes and provenance

- §1.3: `content/notes/gm-ch01-13.md` — [유한한 표본에서 분포를 학습하기](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-13).
- §1.4: `content/notes/gm-ch01-14.md` — [밀도 계산과 샘플 생성](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-14).
- Both retain a concise **작성자 검토 전** notice. Automated mathematical/rendering checks do not constitute author approval.
- §1.3 source coverage: finite i.i.d. data, sample-mean approximation, empirical point masses, uniform-index sampling, and learning beyond observed points. Added: LLN assumptions, variance derivation, duplicate observations `[-1, 0, 0, 2]`, and distinction between original sample size N and resampling count M.
- §1.4 source coverage: density evaluation versus sampling, Gaussian affine sampling, and pushforward distributions. Added: density estimation terminology, numerical example, CDF/Jacobian derivation, and a constant-generator example showing that an ordinary density need not exist.
- Source comparisons are linked at the end of each note: ProbabilityCourse §§7.1.1, 4.1.3 and 4.2.3. No external figures are reproduced.

### Figures and interactive component

- `content/notes/images/ch01-13-empirical.svg`: original plot of four observations and their empirical probability masses; numeric horizontal spacing reflects −1, 0 and 2.
- `content/notes/images/ch01-14-gaussian-transform.svg`: original normal-density plots using the same axes; shaded intervals map under X = 2 + 2Z and each have probability approximately 0.6827.
- §1.3 embeds `[demo:empirical-distribution]`, implemented in `demos/empirical-distribution.html` and `demos/empirical-kernel.mjs`. Uniform resampling is over observation indices with replacement, so duplicate values retain their combined mass. Seed and existing sample prefixes are preserved when draw counts change.
- Pages CMS can insert this shortcode on a line by itself in the existing Markdown source editor. Like the MH embed, the iframe loads only when it enters the viewport. §1.4 uses a static diagram; an extra interactive component is unnecessary.

### Verification before publication

- `npm run check`: 40 tests passed; built 6 notes, 0 articles and 2 projects.
- Seeded 100,000-draw regression test checks masses 0.25 / 0.50 / 0.25, mean 0.25, duplicate handling, stable prefixes, reseeding and invalid inputs.
- Browser, desktop and 390 × 844 mobile: §1.3 has 75 MathJax containers (15 display formulas), §1.4 has 78 (14 display formulas), with no MathJax error nodes or page-level horizontal overflow. Long formulas scroll inside their own containers.
- Mobile table of contents navigates correctly; figures render. Empirical controls/reset were exercised; at M = 10,000 the observed frequencies were 0.2478 / 0.4968 / 0.2554 (seed 1304), sample mean 0.2630. At the top of the article the experiment iframe had no source yet, confirming lazy loading.
- Existing MH embed: Next step records one rejected state; Banana tab and +100 reach 101 samples with 59.4% acceptance. No browser JavaScript errors observed.
- Existing posts, figures, CMS settings, project data, MH source files and deployment workflow are unchanged.
- Publication: [PR #12](https://github.com/songofluna/academic-notes/pull/12), merged as `27024c4f50a68a87fc606397ef5430989870047a`.
- [PR check](https://github.com/songofluna/academic-notes/actions/runs/41663501576) and [GitHub Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41663607081) both completed successfully.
- Public verification on 2026-11-04 KST: both note URLs above load; 75/78 MathJax containers and zero math error nodes; original SVG figures load from the `/academic-notes/images/` path. The live empirical iframe is unloaded until scrolled into view and reproduces the recorded 10,000-draw frequencies. Reset and +100 work at 390 px, with a 350 px iframe and no page-level overflow. The mobile §1.4 ToC, Gaussian plot and caption also render correctly.
- No blocking issue found in these two sections. Final author review is still pending; future source-review flags above belong to later sections.

### Next pass

Start §1.5 on PDF p. 3: maximum likelihood, empirical negative log-likelihood, the Gaussian example and degenerate variance. Do not rewrite §§1.1–1.4. Author review of the two new drafts remains outstanding.


## Concision revision — 2026-11-04

- User approved revising and republishing both §§1.3–1.4 under the new, source-proportionate guide. Re-read `newnote1.md` and compared both revised drafts directly with PDF p. 2.
- Restored the original section titles: **1.3 Learning a Distribution from Finite Samples** and **1.4 Density Estimation and Sample Generation**. Existing slugs and URLs are unchanged.
- §1.3 retains finite i.i.d. observations, the LLN sample-average approximation, the empirical-distribution formula and point-mass meaning, sampling by selecting a training observation, and the goal of learning beyond that finite sample. Removed the weather example, variance derivation, generalized-learning discussion, duplicate-value worked example, table, diagram and resampling embed.
- §1.4 retains density/log-density evaluation versus sampling, the original Gaussian affine transform and density formula, both computational procedures, pushforward meaning, and the brief general-generator/normalizing-flow connection. Removed extra numerical examples, log-density expansion, CDF derivation, preimage formalism, singular-generator example and diagram.
- Each revised note has three subheadings, zero images and zero interactive embeds. The existing figure files, empirical sampler and shortcode remain available; no unrelated content or site code was deleted or edited.
- Public prose no longer includes editorial/provenance reports. Both posts retain only the short `작성자 검토 전` notice. Provenance and review details remain here.
- Prose counts: §1.3 **973** characters (previously 3,365); §1.4 **914** (previously 3,401). Count includes spaces and English terms, collapses whitespace, and excludes frontmatter, headings, review notice, display/inline math, image syntax and shortcode markers. Figures/experiments are not used to increase length.
- Mathematical review: retained the i.i.d. and integrability conditions in one sentence, point-mass weights and duplicate handling, Gaussian scale restriction σ > 0 and variance σ², and the source's distinction between density evaluation and sampling. No unclear source item blocks these two sections.
- Verification before publication: `npm run check` passed all 40 tests and built 6 notes. At desktop 1280 × 900 and mobile 390 × 844, §1.3 renders 16 MathJax containers (3 display formulas) and §1.4 renders 32 (5 display formulas), with zero math errors or page overflow. Table-of-contents links work. Both article bodies contain zero images and zero iframes. No runtime, CMS or deployment code changed. The earlier math counts and screenshots above describe the superseded version.
- Publication of this revision: [PR #13](https://github.com/songofluna/academic-notes/pull/13), merged as `32ca2042204f5968c132f2203dff37531d1d6086`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41668425760) and [Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41668544015) completed successfully.
- Public verification on 2026-11-04 KST: both unchanged note URLs display the revised titles and concise text. Desktop at 1470 px and mobile at 390 × 844 render 16/32 MathJax containers (3/5 display formulas), with zero math error nodes or page overflow. All mobile display formulas fit their 350 px containers. Desktop ToC navigation works; mobile screenshots show the complete articles and no broken formulas. No browser JavaScript errors were observed. A hard refresh was needed for one browser's cached pre-revision site data; the deployed source and refreshed pages agree.
- Next section remains §1.5 (PDF p. 3). Final author review of §§1.3–1.4 remains pending.


## Terminology revision — 2026-11-04

- Compared §§1.3–1.4 against the author's §§1.1–1.2 reference. Standardized Density Evaluation and Sampling, retained Normalizing Flow and Pushforward in English, and aligned the capitalization of first-use statistical terms (Sample Average, Empirical Distribution, Point Mass).
- The change is limited to terminology and the corresponding publishing guide. Mathematical expressions, explanations, note URLs, the original §§1.1–1.2, and unrelated site content are preserved. Author review remains pending; the next section remains §1.5.
- Validation before publication: all 40 `npm run check` tests pass; all 16/32 mathematical expressions in §§1.3/1.4 are byte-for-byte unchanged.
- Browser preview: section 1.4 displays the revised terminology, 32 MathJax expressions without errors, and a working ToC; at 390 px the text and formulas remain within the page width.


## Section 1.5 — 2026-11-04

- Note: `content/notes/gm-ch01-15.md` — [1.5 Maximum Likelihood Estimation](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-15). Keeps `작성자 검토 전`; publication is not author approval.
- Re-inspected PDF p. 3 visually and confirmed the source PDF SHA-256 is unchanged. Preserved the order: Definition 1.5.1 (Likelihood, Log-Likelihood, Empirical NLL), identical-observation edge case, Example 1.5.2 (Gaussian MLE), then the author's question leading to §1.6.
- The prose follows §§1.1–1.2 and the updated terminology guide. Necessary clarification is limited to fixed observations versus varying parameters, density versus point probability, v as variance, and the N rather than N−1 denominator. No KL proof or new example is added.
- Prose: 1,215 characters including spaces and English terms, collapsing whitespace; excludes frontmatter, headings, review notice and all math. Three subheadings. Recompared the draft with the source and retained its core equations, derivative steps and observations −1, 0, 2.
- Mathematical verification: exact rational arithmetic gives mean 1/3 and variance 14/9. Analytic NLL derivatives agree with finite differences at the optimum and two other parameter points; identical observations increase log-likelihood as positive variance approaches zero. Gaussian MLE formulas were also cross-checked against [Stanford CS229 notes, Part X, pp. 1–2](https://cs229.stanford.edu/notes2021fall/cs229-notes9.pdf). This is a verification source, not a reproduced image or expanded lesson.
- Figures: none; equations and the original numerical example suffice. No external image was copied. Future necessary figures should be sought in papers/web sources first and checked for reuse permission.
- Interactive: after the prose was complete, proposed a mean/variance and NLL comparison. The author explicitly chose text-only publication on 2026-11-04; no new simulator or embed is created.
- Validation: `npm run check` passes all 40 tests and builds 7 notes. Desktop at 1280 px and mobile at 390 × 844 display 35 MathJax expressions (12 display formulas), with no math errors or page overflow; all mobile display formulas fit their 350 px containers. ToC navigation works and no browser JavaScript errors were observed. Long Gaussian NLL and variance arithmetic use explicit aligned line breaks.
- Existing notes, images, demos, CMS settings, site design and deployment code are unchanged. The new note follows §1.4 in reading order.
- Next: §1.6, PDF p. 4. Resolve the recorded population/empirical NLL notation issue when drafting that section; do not expand it into §1.5.
- Publication: [PR #15](https://github.com/songofluna/academic-notes/pull/15), merged as `c901fe84563f1c953440cbf3f7db96e407482d6e`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41673868369) and [Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41674076402) completed successfully.
- Public verification on 2026-11-04 KST: the new note URL renders its correct title and all 35 math expressions (12 display formulas), with no MathJax errors. At 390 px all display formulas fit their 350 px containers and the page has no horizontal overflow. The mobile ToC scrolls to Example 1.5.2, and the public §1.4 next-note link opens §1.5. Desktop/mobile screenshots were saved. No image or interactive embed was added.


## Section 1.6 — 2026-11-04

- Note: `content/notes/gm-ch01-16.md` — [1.6 Forward KL-Divergence and Its Connection to MLE](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-16). Retains `작성자 검토 전`; author approval remains pending.
- Re-read the rendered source PDF p. 4 and confirmed its SHA-256 is unchanged. Preserved Definition 1.6.1, Proposition 1.6.2 and Remark 1.6.3 in their original order, including the KL direction, entropy decomposition, population optimizer equivalence, empirical approximation and finite-sample caution.
- Explicit source correction (also reported to the author during drafting): the handwritten Population NLL line equated a finite negative sum with a population expectation. The note defines Population NLL as the expectation, Empirical NLL as the negative sample average, and relates them by approximation. This corrects notation without changing the source's argument.
- Clarifications needed for correctness: the zero-probability support condition concerns a set with positive P probability, not an isolated density value; the continuous entropy is Differential Entropy; decomposition assumes finite relevant expectations. The LLN statement is for fixed theta under i.i.d./integrability conditions, not a claim that finite-sample minimizers exactly optimize population KL. The empirical-KL caution is explained for a continuous-density model, where its probability of the finite observed-point set is zero but the empirical measure assigns probability one.
- Source fidelity review: prose is 1,480 characters including spaces and English terms after collapsing whitespace, excluding frontmatter, headings, review notice and all math. Three subheadings. No additional example, Reverse KL discussion or consistency proof was introduced. Terminology follows §§1.1–1.5.
- Verification sources: [Strimmer, likelihood lecture §7.2](https://strimmerlab.github.io/publications/lecture-notes/MATH27720-stats2/07-likelihood1.html) for the population/empirical distinction and entropy decomposition; [Chizat, maximum likelihood lecture §2.2](https://www.di.ens.fr/~fbach/mlclass/lecture5.pdf) for risk definitions and the absolute-continuity condition. These support mathematical review; no external figure or text is reproduced.
- Independent checks: Gaussian KL = Population NLL − Differential Entropy at 75 parameter pairs, maximum residual 1.78e−15; asymmetric KL checked separately on a two-point distribution. These checks are not extra examples in the public note.
- Validation: `npm run check` passes all 40 tests and builds 8 notes. Desktop and 390 × 844 mobile render 31 MathJax expressions (7 display formulas) without errors or page overflow; all mobile display formulas fit 350 px. The KL proof uses explicit line breaks. Mobile ToC and the §1.5 → §1.6 reading link work; no browser JavaScript errors observed.
- Figures and interactive components: none. The derivation is fully expressed by the text and equations; no new experiment was proposed or implemented. Existing notes, figures, demos, CMS and site code remain unchanged.
- Next: §1.7 on PDF pp. 5–6. Reconcile the recorded mode-covering caption and log-ratio issue before drafting; do not silently extend or rewrite §1.6.
- Publication: [PR #16](https://github.com/songofluna/academic-notes/pull/16), merged as `f7d1670961b337147b7148afb2d78c28a5ec52cc`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41675845179) and [Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41676065214) completed successfully.
- Public verification on 2026-11-04 KST: the note displays the correct title and all 31 MathJax expressions (7 display formulas), without math errors or page overflow. At 390 × 844 all display formulas fit their 350 px containers. The mobile ToC opens Proposition 1.6.2, and the public §1.5 next-note link opens §1.6. Desktop and mobile screenshots were saved. Existing note contents remain unchanged.

## Section 1.7 — 2026-11-04

- Note: `content/notes/gm-ch01-17.md` — [1.7 Reverse KL, Mode Covering and Mode Seeking](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-17). Retains `작성자 검토 전`; publication is not author approval.
- Visually re-read source PDF pp. 5–6 and confirmed the original PDF SHA-256 is unchanged. Preserved the order: Reverse KL definition, Remark 1.7.1 (zero-probability sets and the two directions), Example 1.7.2 (equal mixture of N(-3,1) and N(3,1), approximated by one Gaussian), Remark 1.7.3 (model capacity and global optimum caveat), Example 1.7.4 (P=(1/2,1/2,0), Q=(1/2,1/4,1/4)).
- The author clarified that the supplied prose is a tone reference, not an outline template. The draft preserves the source order, connects the meaning of each formula to the next paragraph, and avoids first-person anecdotes or emotional commentary. The publishing guide now records this preference. Statistical terminology remains consistent with earlier notes; no previous article was rewritten.
- Source corrections explicitly reported to the author during drafting: the right-hand diagram in Example 1.7.2 is Mode Seeking, not its handwritten Mode Covering caption; Example 1.7.4 starts with (1/2) log 1 = 0, not (1/2) log 0. The resulting forward discrete KL is (1/2) log 2; the reverse direction is infinite.
- Necessary clarification: P(A) denotes the probability of a set; P << Q is a necessary condition for finite KL, not asserted sufficient. Explained the averaging distribution in Reverse KL, Gaussian variance notation, the nonzero tails of Gaussian densities, and the distinction between tendencies under a restricted model and universal guarantees. No new example, optimization proof or advanced inference method was introduced.
- Prose: 2,767 characters including spaces and English after collapsing whitespace, excluding frontmatter, headings, review notice and all math. Three main subheadings; original remark/example numbering retained. Source comparison completed after drafting.
- Verification reference: [Goodfellow, Bengio and Courville, Deep Learning, §3.13 and Figure 3.6](https://www.deeplearningbook.org/contents/prob.html) corroborates the directional comparison, separated-mode qualification and zero-term convention. This is an internal mathematical check; no external text or figure is reproduced.
- Independent computation: exact rational ratios in Example 1.7.4 are 1 and 2; KL(P||Q)=0.3465735903 and Q(x3)>0 with P(x3)=0 implies KL(Q||P)=infinity. Gaussian quadrature gives Forward KL 0.4619946135 for N(0,10) versus 8.3107020670 for N(3,1); Reverse KL respectively 0.9379801910 versus 0.6892979330. Numerical searches from either mode give symmetric means ±2.984306 and standard deviation 1.023369 with Reverse KL 0.688768996. These validate the qualitative example, not a proof of global optimality; numerical results are not extra public content.
- Figures and interactive components: none. The original diagram's comparison is explained in words alongside its unchanged distribution; no stock illustration or new simulator was added.
- Validation: `npm run check` passes all 40 tests and builds 9 notes. Desktop at 1280 px and mobile at 390 × 844 render 49 MathJax expressions (7 display formulas), with zero math error nodes or page overflow. All mobile display formulas fit their 350 px containers. No browser JavaScript errors observed. Existing content, CMS, images, demo files, design and deployment code remain unchanged.
- Next: §1.8, source PDF pp. 7–8. Check the recorded positivity/domain assumptions for the data-space score before drafting; do not extend §1.7 into that material.
- Publication: [PR #17](https://github.com/songofluna/academic-notes/pull/17), merged as `6cea562e14a74aa1cf417b9fbcc2042fa2da389a`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41680544197) and [Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41680696290) succeeded. A concurrent Pages CMS update to §1.5 (`23c245d`) was preserved when merging; this task did not edit that note.
- Public verification on 2026-11-04 KST: correct title, 49 MathJax expressions including 7 display formulas, zero math errors and no horizontal page overflow at 1280 px and 390 × 844. All mobile display formulas fit the 350 px body. The mobile ToC scrolls to Example 1.7.4, and the public §1.6 Next note link opens §1.7. No browser JavaScript errors observed. Desktop/mobile screenshots saved; author review remains pending.


## Section 1.8 — author-supplied manuscript, 2026-11-04

- Note: `content/notes/gm-ch01-18.md` — [1.8 Fisher Divergence and Score Functions](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-18). The manuscript's `작성자 검토 전` notice is preserved.
- The author stopped the earlier drafting request and supplied the complete text. Replaced only its two figure instruction blocks with images, concise captions and source credits; added publishing metadata. All other body text and all 89 TeX expressions match the supplied manuscript exactly. The earlier assistant-written draft is not included.
- Manuscript SHA-256: `939f61ba668a0e186d2a6a810290d9f635f4d650581bb54a65a22f71b91a1c9b`.
- Figure 1: the author explicitly supplied and selected Eric J. Ma's PDF / Log PDF / Score image after the reuse-status discussion. Stored without alteration and credited to the linked Score Functions page. No public reuse license was verified, so no license is asserted for this image.
- Figure 2: the author-supplied Gaussian-mixture score image, stored without alteration; credited to Neuromatch Academy / Binxu Wang. [Course license](https://github.com/NeuromatchAcademy/course-content-dl/blob/main/LICENSE.md): CC BY 4.0. The caption links to the current DiffusionGenerativeModels tutorial path.
- `ch01-18-gaussian-score.jpg` SHA-256: `9cf48e2de7d146cc405e482ed44898e993953ba4fc2f458af1c27f1caac07013`.
- `ch01-18-mixture-score.jpg` SHA-256: `1867307dfb89fbfe4a539987424fb4bf24d6eccaf0baf8b7215f9d906680a809`.
- Validation: `npm run check` passes all 40 tests and builds 10 notes. Desktop 1280 × 900 and mobile 390 × 844 render 89 MathJax expressions, including 36 display formulas, without math errors or page-level horizontal overflow. Both local images load at their original dimensions; no browser JavaScript errors observed.
- Existing notes, images, CMS configuration, demos, design and deployment code are unchanged. No interactive component is added. §§1.9–1.12 remain unstarted pending the author's next instruction.
- Publication: [PR #18](https://github.com/songofluna/academic-notes/pull/18), merged as `8fa8bcf94ed4b29c2817ea61a97219b35e504d4c`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41693556852) and [GitHub Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41693752501) completed successfully. The uploaded branch tree was compared against the tested local tree and matched exactly, including both binary images.
- Public verification on 2026-11-04 KST: the note renders all 89 formulas (36 display) without math errors at 1280 px and 390 px. Both attached figures load from the site's `/academic-notes/images/` paths at natural widths 1514 and 1550 px and fit the 350 px mobile body; no page overflow. The mobile ToC opens Definition 1.8.6. Desktop and mobile screenshots were saved. Publication does not change the author's retained review notice.


## Sections 1.9–1.10 — author-supplied manuscripts, 2026-11-04

- Separate notes: `gm-ch01-19.md` (1.9 f-Divergence and Other Distribution Distances) and `gm-ch01-110.md` (1.10 Explicit and Implicit Generative Models), at reading orders 19 and 20 after §1.8. Both retain the author's `작성자 검토 전` notice.
- §1.9 uses the supplied text attachment. Only the two figure instruction blocks are replaced with the author's attached JPEGs, captions and source credits. The remaining body, both Markdown tables and all 134 TeX expressions are unchanged.
- §1.10 uses the text pasted directly in the request. Preserved its prose, headings, mathematical quantities and examples. Restored display/inline delimiters, removed transport escapes on underscores/equals/less-than signs and line endings, and restored the differential spacing in the VAE and EBM integrals (`\,\mathrm d`). This is formatting repair, not a new derivation. It contains 39 TeX expressions, including 7 display formulas.
- §1.9 Figure 1: the author's `1.9 figure1.jpeg`, visually matched against Lilian Weng's [From GAN to WGAN](https://lilianweng.github.io/posts/2017-08-20-gan/) four-panel KL/JS figure. The caption identifies the curves as integrands, not scalar divergence values.
- §1.9 Figure 2: the author's `1.9 figure2.jpeg`, visually matched against the image indexed with Sunil Yadav's [Necessary Probability Concepts for Deep Learning: Part 2](https://medium.com/@sunil7545/kl-divergence-js-divergence-and-wasserstein-metric-in-deep-learning-995560752a53). The caption maps g, h, theta to the manuscript's P, Q, a.
- Both uploaded JPEGs are copied byte-for-byte. Source credits are added; no open reuse license was verified or asserted. The figures are the files expressly provided by the author for this publication, not substituted web downloads.
- Validation: `npm run check` passes all 40 tests and builds 12 notes. Desktop 1280 px and mobile 390 px previews render §1.9's 134 body math expressions (37 display formulas), both tables and both figures, and §1.10's 39 expressions (7 display formulas), with no MathJax errors or page-level horizontal overflow. §1.9's three math-bearing ToC entries also typeset correctly. The Next note link opens §1.10 from §1.9.
- Existing posts, CMS, site runtime, demos, design and deployment code are unchanged. No interactive component is added, and §§1.11–1.12 are not started.
- Source checksum (붙여넣은 텍스트.txt): SHA-256 `b58b040fb274d6854b0697ecfb255391199e061d6eb7c8783b822ceda0ae613b`.
- Source checksum (ch01-19-js-divergence.jpeg): SHA-256 `48a69c9db2cf2b718417826a10911311a13f5f44109e387839aaec908e5956d0`.
- Source checksum (ch01-19-disjoint-distributions.jpeg): SHA-256 `b0231da82dd6a46ab76191b2bb080a0f7c04f899a919d130c746769958101d36`.
- Publication: [PR #19](https://github.com/songofluna/academic-notes/pull/19), merged as `74c8d9e1157b7c347fae6b69c96d15e9b51e20d0`. The [PR check](https://github.com/songofluna/academic-notes/actions/runs/41696831012) and [GitHub Pages deployment](https://github.com/songofluna/academic-notes/actions/runs/41696959650) succeeded. Both the uploaded branch and merged main tree matched the tested local tree exactly, including the two binary figures.
- Public verification on 2026-11-04 KST: [section 1.9](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-19) renders 134 body expressions (37 display), both tables and both attached figures; [section 1.10](https://songofluna.github.io/academic-notes/#/notes/gm-ch01-110) renders 39 expressions (7 display). Desktop 1280 px and mobile 390 px have zero math errors or horizontal page overflow. Both figures load from the site's `/academic-notes/images/` paths at original widths 1748/1400 px and fit the 350 px mobile body. Mobile ToC links reach the Wasserstein and EBM sections; the §1.9 Next note link opens §1.10. No browser JavaScript errors were observed. Public desktop/mobile screenshots were saved for each post. The author-review notices remain unchanged.
