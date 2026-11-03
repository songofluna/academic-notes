# Handwritten notes publishing guide

Apply this guide to future handwritten-PDF note editing. It supersedes the expansion-heavy approach used for the initial Chapter 01 §§1.3–1.4 drafts. The user's later, task-specific instructions take precedence.

## Scope and source fidelity

- Inspect the whole supplied chapter, including handwritten equations and diagrams, and record its section/page plan. Complete only one or two sections per task.
- Edit the author's existing study material rather than writing a new textbook. Preserve original section numbers, titles, important formulas, examples and logical order.
- Use `content/notes/newnote1.md` as the prose/style reference. Do not copy the length or breadth of the original expanded `gm-ch01-13.md` draft.
- Add only definitions, connecting sentences or intermediate steps needed to understand the current source. Do not introduce unrelated examples, new proofs, advanced theory or a catalogue of exceptions.
- Compare the finished draft against the source again and remove additions whose necessity is unclear. Record illegible or inconsistent source material in the chapter management file; do not silently resolve a mathematical contradiction.

## Proportionate length and structure

Approximate prose upper bounds, excluding formulas, code, figures and metadata:

| Handwritten source | Prose guide |
| --- | --- |
| Half a page | 800–1,500 Korean-text characters |
| One page | 1,500–3,000 characters |
| Two pages | 3,000–5,000 characters |
| Three or more pages | Assess the actual information density |

These are limits to prevent expansion, not targets to fill. Shorter is appropriate when the source is simple; explain any necessary excess for dense derivations in the management record. For reproducible comparisons, report the counting convention (including/excluding whitespace, headings and inline math).

Write natural Korean explanatory paragraphs at an accessible first-year statistics level. Introduce symbols in context, connect equations to their meanings, and use English technical terms when helpful. Avoid reassurance, rhetorical announcements, contrast slogans, repeated bold text and bullet-point summaries. A short section generally needs no more than two or three meaningful subheadings. Do not append routine “key takeaways” or conclusions.

## Korean and English terminology

- Match the terminology in `content/notes/newnote1.md` (§§1.1–1.2), not just its paragraph style. Keep explanations in Korean.
- Retain established Korean statistical terms such as 확률분포, 기댓값, 모수 and 정규분포. When introducing an English equivalent, use the same capitalization as the reference, e.g. 경험분포(Empirical Distribution), 표본평균(Sample Average), 점질량(Point Mass).
- Use English for field-specific names and operations: Density Evaluation, Sampling, Pushforward, Jacobian Determinant and Normalizing Flow. Do not introduce literal or redundant translations such as 정규화 흐름(normalizing flow) or 푸시포워드(pushforward).
- Use the chosen term consistently across headings and prose. Natural Korean explanations such as “밀도를 계산한다” remain appropriate; do not replace every ordinary Korean phrase with English. Check terminology against preceding notes before publication, without changing formulas or adding explanations.

## Figures and experiments

Default to **zero figures and zero interactive components**. Add one only when it materially helps understanding that prose and equations cannot provide as well. Do not create extra topics or lengthy instructions to justify a widget.

When a figure is needed, first search papers and the web for an appropriate existing diagram. Prefer a relevant reusable source figure over an original illustration; record source/licensing evidence, since attribution alone does not grant reuse rights. Omit figures that do not materially help.

Finish the prose before proposing an interactive component, then ask the author whether to add the specific experiment. Do not implement one before that approval. Keep approved experiment controls concise, responsive and lazy-loaded. Preserve existing simulator files and shortcode support when removing an embed from a particular note.

## Public prose and internal records

Public posts contain learning material. Do not include PDF page ranges, lists of AI additions, validation reports, diagram production notes or sections such as “자료와 보완 범위.” Put necessary scholarly sources in concise references or captions only.

Keep a short `작성자 검토 전` status until the author explicitly approves the text. Source provenance, AI assistance, page ranges, editorial decisions, verification evidence and next-section status belong in `docs/publishing/chapter-XX.md` and the completion report. Automated checks do not imply author approval.

## Verification and publication

1. Check source coverage, mathematical notation/conditions and proportionate length.
2. Preserve existing slugs, unrelated posts, site design, CMS configuration and rendering behavior.
3. Run `npm run check` and inspect the actual desktop/mobile Markdown and LaTeX rendering, headings and links.
4. Commit only the necessary changes, use a PR where appropriate, and publish under the user's authorized workflow.
5. Verify the deployment result and the actual public pages separately. Do not equate a commit or CMS save with publication.
6. Update the chapter record with completed sections, source pages, figure/experiment decisions, publication evidence, review status and the next section. Report those results briefly.
