# Developing Folio

For installation and everyday use, start with the [README](README.md).

## Requirements and build

Use Node.js 22.12 or later and pnpm 11, or a compatible package manager. The committed `pnpm-lock.yaml` pins the dependency graph.

```sh
git clone https://github.com/0xAldoLim/Folio.git
cd Folio
pnpm install --frozen-lockfile
pnpm build
```

Load `dist/` through **Load unpacked** at `chrome://extensions`. The repository includes this compiled directory so users can install Folio without build tools. After code changes, rebuild it and reload both the extension and affected webpages.

`pnpm dev` previews the React popup and settings UI. Chrome APIs require an extension context, so use the compiled extension for integrated development. The production build does not use a development server.

## Checks

```sh
pnpm test
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:production
pnpm benchmark
pnpm audit --prod
pnpm audit:licenses
```

The browser suite uses an isolated Chrome profile and local fixtures. A test-only copy of the manifest grants the loopback fixture origin for repeatable navigation tests. Separate checks exercise the unmodified manifest, injection denial, and production action/activeTab activation without persistent host grants. Native optional-permission decline behavior is simulated at the UI API boundary; see [TESTING.md](TESTING.md) for the scope and remaining manual checks.

If Playwright's bundled browser cannot launch, set `FOLIO_CHROMIUM` to a Chromium or Chrome executable:

```powershell
$env:FOLIO_CHROMIUM = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm test:browser
pnpm test:production
pnpm benchmark
```

On Unix, use `FOLIO_CHROMIUM=/path/to/chrome pnpm test:browser`. The browser must support the DevTools extension-loading commands used by the harness.

The browser suite compares against committed screenshots. Update them intentionally with `pnpm test:visual:update`, review the images, then rerun `pnpm test:browser` without updating snapshots. Pixel comparisons depend on the browser, operating system, and installed fonts.

`pnpm capture` regenerates the product screenshots and the local synthetic video fixture. It launches a temporary browser profile and a local fixture server. Review any resulting media and snapshot changes before committing them.

## Project map

| Directory | Purpose |
| --- | --- |
| `src/content` | DOM classification, color calculations, batched observation, and reversible styles. |
| `src/reader` | Article extraction, sanitization, and the isolated modal reading surface. |
| `src/background` | Permissions, storage, commands, and schedule alarms. |
| `src/storage` | Settings schema, validation, migration, and serialized writes. |
| `src/themes` | Presets, palette resolution, and settings precedence. |
| `src/popup`, `src/options`, `src/ui` | React controls and shared components. |
| `tests` | Unit tests, integration tests, local fixtures, and visual baselines. |
| `dist` | Compiled extension, icons, privacy notice, and runtime licenses. |

The content script and reader are separate IIFE bundles. The reader's React, Mozilla Readability, and DOMPurify code is loaded only when requested. Popup/options and the module service worker are bundled with Vite. No runtime dependency is fetched from a CDN.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the lifecycle, security model, settings precedence, and compatibility decisions. [BENCHMARK.json](BENCHMARK.json) and [TESTING.md](TESTING.md) record the original validation run; they are dated evidence, not current performance guarantees.

## Before distributing a build

Run the applicable checks, rebuild `dist/`, review [PRIVACY.md](PRIVACY.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and follow [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). Package the contents of `dist/` with `manifest.json` at the archive root.

Dependency folders, temporary browser profiles, local test reports, environment files, and machine-specific validation output are excluded from version control. Never commit credentials, private webpage content, or form values.
