# Release readiness — Folio 1.0.0

This package is prepared for local developer installation. It is **not published**, signed for store distribution, or represented as certified for every website.

## Included

- [x] Manifest V3 production build with local React UI, content/reader bundles, and worker
- [x] Original PNG icons at 16, 32, 48, and 128 px, reproducible with `scripts/icons.mjs`
- [x] Six palettes, validated settings schema, reversible engine, reader, optional permissions
- [x] Unit and real extension browser tests, committed screenshot baselines, benchmark harness
- [x] Local privacy notice, permission explanations, source/dependency licenses
- [x] Draft store description and actual product screenshots
- [x] Install/build/troubleshooting documentation

## Before a Chrome Web Store submission

- [ ] Review `TESTING.md` and rerun build, tests, visual comparisons, benchmark, and current advisory audit on the exact submission commit.
- [ ] Manually test the Chrome toolbar popup, real native optional-permission accept/decline/revoke flows, first-run activeTab access, keyboard shortcuts/conflicts, worker idle suspension/restart, system sleep/resume, and timezone/DST changes on supported desktop OSes.
- [ ] Test a documented matrix of live blogs/news/documentation/Wikipedia/GitHub/forums and complex applications, with permission from their normal user interactions. Controlled fixtures do not establish live-site compatibility.
- [ ] Test screen readers, keyboard-only use, 200–400% zoom, OS high contrast, narrow displays, fullscreen video, and interaction with common dark-mode extensions. Automated axe checks are a useful subset of accessibility assessment.
- [ ] Check the latest Chrome Web Store policies and required listing assets/forms, which may change. Review single-purpose wording and optional-host justifications.
- [ ] Choose a publisher, support channel, and contact details; host the privacy notice at a stable publisher URL. No external account has been created on your behalf.
- [ ] Review branding/trademark availability and confirm the intended source-license choice before public distribution.
- [ ] Confirm screenshots are representative of this exact build, without private site/user data. Included screenshots use local fictional sample content.
- [ ] Zip the **contents** of `dist/` with manifest.json at the archive root. Exclude test harness manifests, profiles, node_modules, source maps, and development servers.
- [ ] Record a versioned release tag/changelog, upload only after approval, and complete store review. No repository push or publication has occurred.
