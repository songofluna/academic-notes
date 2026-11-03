# Chapter 01 publishing record

- Source: user-provided handwritten `Ch1 3.pdf`, 14 pages (PDF page numbers, not printed labels).
- SHA-256: `8be87a5939c17ee2cad0013db2ad532ed2b2b49a314750ad4c22ead6af84410a`
- Inspected: all 14 rendered pages on 2026-11-04.
- Scope this pass: §§1.3–1.4, both on PDF p. 2, as two separate notes.
- Existing §§1.1–1.2: `content/notes/newnote1.md`; preserve without rewriting.
- Editorial workflow: follow [the publishing guide](README.md). Keep prose proportionate to the handwritten source; include only necessary explanations. Published edited drafts remain author-review-pending. The concision revision below supersedes the initial expanded prose.

## Chapter plan

| Sections | PDF pages | Proposed note scope | Status |
| --- | --- | --- | --- |
| 1.1–1.2 | 1 | Introduction, data/model distributions, notation | Existing published note; unchanged |
| 1.3 | 2, upper half | Finite samples, empirical distribution, resampling | Published; author review pending |
| 1.4 | 2, lower half | Density evaluation, sampling, Gaussian pushforward | Published; author review pending |
| 1.5 | 3 | MLE, empirical NLL, Gaussian example and degenerate case | Next |
| 1.6 | 4 | Forward KL and population/empirical likelihood | Planned |
| 1.7 | 5–6 | Reverse KL, mode covering/seeking, support example | Planned |
| 1.8 | 7–8 | Data-space score, Fisher divergence, Gaussian/mixture examples | Planned |
| 1.9 | 9–10 | f-divergence, JS, total variation, Wasserstein comparison | Planned |
| 1.10 | 11 | Explicit/implicit models and density existence | Planned |
| 1.11 | 12–13 | Latent variables, changes of variables, Jacobian examples | Planned |
| 1.12 | 14 | Taxonomy of major generative-model families | Planned |

Keep each future pass to one or two sections. For §1.8 and §1.11, one section is already substantial; reassess reading length before splitting. Do not start them in this pass.

## Source review for future passes

These observations are review flags, not silent corrections to published notes.

- p. 4, §1.6: the population NLL line mixes a finite sum and an expectation. Separate population and empirical definitions when drafting.
- p. 5, §1.7: the reverse-KL figure is captioned “Mode Covering” although the discussion describes mode seeking. Reconcile explicitly with the author/source.
- p. 6, §1.7.4: the first term appears as log 0 although the shown ratio is 1; recompute from the displayed distributions.
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
