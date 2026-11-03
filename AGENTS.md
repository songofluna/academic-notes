# Academic notes authoring

For a request such as “5.10절 작성”, read `.agents/skills/academic-note-author/SKILL.md` and follow the source-grounded workflow. Section numbers are identifiers, never evidence for a guessed topic or page range.

Keep existing notes, slugs, author-supplied figures, site design and deployment intact. Work on a separate branch and submit a PR. Do not merge, enable auto-merge, push to main, or publish through Pages CMS. The author approves and merges; the existing main-only Pages workflow deploys.

`docs/publishing/README.md` remains the editorial foundation. For this automated workflow, the author's newer requirements take priority: research references and prefer accurate SVG/code figures; plan 1–3 useful interactives across the entire chapter. They have already authorized implementation of appropriate components; do not ask again as a routine step. Preserve existing components and embeds even when a chapter already exceeds that budget.

Run `npm run check`. Use the real renderer for desktop/mobile QA. Keep original PDFs, extracted pages and work packets in gitignored `.note-sources/` and `.note-work/`; publish only reviewed prose, intended figures/components and a concise provenance receipt. Review receipts attest to an actual review; never fill them merely to satisfy a validator.
