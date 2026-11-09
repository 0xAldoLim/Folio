# Testing report — Folio 1.0.0

Validation date: 19 October 2026 (Asia/Kuala_Lumpur). Browser: **Chrome 155.0.8059.80**, headless, Windows x64. Node.js v24.19.0. This report records commands actually run; no live-site or store-certification claims are implied.

## Results

| Check | Actual result |
|---|---|
| TypeScript strict check | Passed: tsc --noEmit |
| Production Vite/esbuild build | Passed; loadable Manifest V3 directory in dist/ |
| Vitest unit tests | **60 passed, 0 failed**, 3 test files |
| Playwright Chrome tests | **24 passed, 0 unexpected failures, 0 skipped**, final run without snapshot updates |
| Visual baselines | 26 PNGs compared, including all six palettes and lower-page controls |
| Automated accessibility | Popup, settings, and reader scans passed with no axe violations under selected WCAG 2/2.1/2.2 A/AA tags |
| Production manifest smoke | Passed: actual action popup + activeTab, zero persistent host grants |
| Runtime advisory audit | pnpm audit --prod returned zero advisories at the time checked |
| Runtime licenses | Readability Apache-2.0; DOMPurify Apache-2.0 or MPL-2.0; React/React DOM/Scheduler MIT; full texts shipped |

Unit coverage includes sRGB luminance, symmetric contrast, protected/customized palettes, monotonic contrast controls, extreme transformations, theme precedence, exact-origin isolation, migrations, corruption recovery, concurrent storage writes, invalid/oversized imports, schedule edges and overnight intervals, sender message guards, sanitizer URL handling, and low-confidence extraction.

Browser coverage includes popup-to-page selection, reload persistence, website overrides, emergency restore, native dark restoration, image preservation/dimming exceptions, functional forms/password preservation, status regions, code/tables, dynamic content/SPA navigation, singleton styles, idle classification, Reader entry/exit, extraction rejection, article images, typography, fullscreen, original form/scroll state, system appearance, forced colors, JSON import/custom palettes/live preview, a real day/night alarm boundary, restricted access, and real local WebM playback/fullscreen through theme changes. Colored paragraph/blockquote panels, form labels, captions, and table cells also have computed foreground/background contrast checks under every palette.

The final browser suite ran without --update-snapshots after review and intentional baseline creation. Earlier iterations discovered and fixed a native-dialog/shadow-host error, missing accessible button/select names, article media discarded by a dominant text wrapper, low-contrast small UI text, and authored light blockquote/form panels retaining light text in dark mode. Those resolved failures are not counted as passing tests.

## Reproduce

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:production
pnpm benchmark
pnpm audit --prod
pnpm audit:licenses
```

For this machine, FOLIO_CHROMIUM selected the installed C:\Program Files\Google\Chrome\Application\chrome.exe. The bundled Chromium executable could not launch (spawn UNKNOWN), so installed Chrome was loaded via its supported DevTools extension API. The restricted sandbox also prevented browser/server startup; these local tests were run with approved browser execution outside that sandbox. Each run used a dedicated temporary profile and local loopback fixtures. Profiles/browsers/fixture processes are closed by the harness.

The main integration harness grants only http://127.0.0.1/* to a **temporary copy of the manifest**, enabling repeatable automatic-navigation checks without a native consent dialog. All scripts/assets remain the actual compiled build. A separate case loads the **unmodified production manifest**, verifies no granted origins, and checks structured injection denial. Its optional-permission decline UI is simulated by returning false from Chrome's request API in that test page; this does not establish OS-native dialog acceptance/rejection behavior. The independent production smoke loads the unmodified dist/ and triggers the actual extension action on a Chrome tab target, proving first-use activeTab activation and subsequent dark-theme switching with an empty persistent host grant list.

## Performance measurements

| Synthetic containers (plus article fixture) | Sync initialization, ms | Activation fully classified, ms | Theme apply median / p95, ms | Added JS heap, MiB | Second 40-switch heap delta, B | Idle classification batches | 1,000 new paragraphs, ms | Scroll frame p95, ms |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 5.60 | 73.98 | 0.20 / 0.30 | 1.31 | 24 | 0 | 165.32 | 7.00 |
| 1500 | 9.60 | 146.42 | 0.20 / 0.30 | 1.64 | 72 | 0 | 168.15 | 7.10 |
| 6000 | 11.90 | 842.87 | 0.10 / 0.30 | 2.73 | 96 | 0 | 159.77 | 7.00 |

These are one-run observations, not product guarantees. Each configuration performed 80 theme changes and retained exactly one owned stylesheet. The first 40 changes retained roughly 31 kB after GC; the second 40 retained 24–96 bytes in this run, consistent with a stable lifecycle at this scale. Idle renderer TaskDuration over a one-second sample was 0.58–11.14 ms; it includes browser/instrumentation work and is not an isolated Folio CPU measurement. No Folio classification batch occurred while idle.

Sync initialization covers initial setup/first batch; full activation includes batched classification and browser automation round trips. Large pages intentionally settle across tasks. Theme apply timing measures stylesheet application inside the content script and excludes messaging and next paint. Mutation latency includes the 90 ms debounce and automation. Heap readings are renderer JavaScript heap after forced GC, **not total process RSS or native DOM memory**. Headless rAF scrolling is synthetic and does not establish real display FPS, battery impact, or all-site performance. Raw measurements and exact method are in BENCHMARK.json.

## Limits and remaining manual release checks

- Fixtures are fictional local content, not a compatibility certification for live news sites, Wikipedia, GitHub, forums, or complex authenticated apps. No private browsing content was used.
- Chrome toolbar behavior was triggered through DevTools; physical pointer/keyboard behavior across OSes, actual optional-host permission dialogs, shortcut conflicts, screen readers, high zoom, native video controls on real streams, sleep/resume, and timezone/DST transitions still warrant manual release testing. The included local video is a generated silent WebM, not an external streaming service.
- The service worker has no polling/keepalive code and uses event handlers plus one next-boundary alarm. Its alarm-driven transition was tested. Natural idle suspension/power use was not directly measured because DevTools instrumentation can affect worker lifetimes.
- Shadow trees, cross-origin iframe contents, canvas rendering, protected browser/store/PDF pages, competing extensions, highly specific author CSS, and unusually restrictive page CSPs remain documented compatibility limits.
- Automated axe checks cover detectable violations under selected rules. They do not certify complete WCAG conformance or the accessibility of arbitrary transformed websites.
- No Chrome Web Store upload, signing, external account, deployment, or repository push occurred. See RELEASE_CHECKLIST.md before public distribution.

Machine-readable evidence is in validation/unit-results.json, validation/browser-results.json, validation/production-smoke.json, and validation/dependency-audit.json.
