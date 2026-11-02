# Academic blog design

## Reference and independent implementation

Inspected https://kimjy99.github.io/ and its LATTICE paper review on desktop and at a 390 px mobile width. The useful principles were a modest author column, direct post lists, system sans-serif typography, date/tag metadata, whitespace, and thin rules. On small screens the profile moves above the content and navigation is collapsible. No reference source, images, author details, or branding were copied.

This site uses its existing study-space photo, a 208 px author column and a reading column of approximately 780 px inside a 1120 px shell. The body is 16 px with a 1.95 line height; headings use a restrained scale. Text is neutral gray/black. Green is limited to links, focus indicators, and small accents. Below 760 px the layout becomes one column. Post TOCs are beside the article on desktop and collapsed above it on mobile.

## Content and navigation

- Keep Home / Notes / Articles / Projects / About and the existing Pages CMS Write link.
- Home lists actual recent Notes and Articles together; Featured Articles and Selected Projects appear only when populated. Do not create featured flags or author credentials to fill space.
- The author name and affiliation are optional CMS fields. Until supplied, use the existing public GitHub username; no real name, degree, or institution is inferred.
- Notes support optional Course → Chapter → Note grouping and a newest-first view. Course falls back to the existing category; Chapter is never inferred from prose. Chapter names sort naturally and order controls notes within a chapter. Missing or invalid ordering metadata cannot block publishing.
- Articles provide text search, tags, and year filters when articles exist. Projects retain existing data and links, with access to the existing experiments.
- Existing note URLs, note content, project data, course archive files, images, local editing storage, and deployment workflows remain intact.

## Reading and interactive content

- Display math remains part of prose: no CSS frame, shadow, or background. An author's explicit TeX `\boxed` is part of the content and is preserved.
- Equations, tables, and code scroll inside their own containers. Code is highlighted with a local Prism 1.30.0 bundle (MIT); unsupported languages remain readable plain text. MathJax uses the existing CDN.
- Headings supply the automatic TOC, including inline math in heading labels. Notes provide previous/next links within the same course.
- Keep `[demo:metropolis-hastings]` and `[demo:normal-kl]`. MH creates its iframe source only when it reaches the viewport. The kernel, controls, statistics, resize messaging, and old Experiments URL are preserved.
- New interactive experiments contain plots, legends, parameter controls, and essential measurements. Do not add slogans, promotional copy, tutorials, or redundant explanatory panels inside the widget. Explanations belong in the surrounding note.
- Respect keyboard focus and reduced-motion preferences. Keep visible navigation on mobile; do not hide primary destinations behind decorative interactions.

## Verification

`npm run check` covers empty/missing collections, content preservation, draft exclusion, legacy metadata, course/chapter ordering, safe syntax highlighting, MH statistical behavior, and the portable preview. Browser QA covers actual notes, inline and display math, TOC navigation, responsive layout, MH loading and controls, Articles filters, and chapter order. Browser review also found pre-existing MH-note formatting errors: the missing detailed-balance delimiters/line break, blank lines inside tables, and malformed nested reference links were repaired without changing the explanation or sampler. Test-only articles and metadata belong in a separate local fixture, never in the published content collection.

The design is submitted for review through a pull request. Do not merge or deploy this redesign before the owner approves the screenshots.
