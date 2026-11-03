# Chapter 01 publishing record

- Source: user-provided handwritten `Ch1 3.pdf`, 14 pages (PDF page numbers, not printed labels).
- SHA-256: `8be87a5939c17ee2cad0013db2ad532ed2b2b49a314750ad4c22ead6af84410a`
- Inspected: all 14 rendered pages on 2026-11-04.
- Scope this pass: §§1.3–1.4, both on PDF p. 2, as two separate notes.
- Existing §§1.1–1.2: `content/notes/newnote1.md`; preserve without rewriting.
- Editorial workflow: source-led Korean explanations for first-year statistics students; add definitions/examples without changing the handwritten argument. Published AI-assisted drafts remain author-review-pending.

## Chapter plan

| Sections | PDF pages | Proposed note scope | Status |
| --- | --- | --- | --- |
| 1.1–1.2 | 1 | Introduction, data/model distributions, notation | Existing published note; unchanged |
| 1.3 | 2, upper half | Finite samples, empirical distribution, resampling | Ready for publication; author review pending |
| 1.4 | 2, lower half | Density evaluation, sampling, Gaussian pushforward | Ready for publication; author review pending |
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

## Current pass

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
- Deployment: pending the pull request merge and live-page verification; update this record after deployment.

### Next pass

Start §1.5 on PDF p. 3: maximum likelihood, empirical negative log-likelihood, the Gaussian example and degenerate variance. Do not rewrite §§1.1–1.4. Author review of the two new drafts remains outstanding.
