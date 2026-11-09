# Architecture

## Page transformation

The normal content bundle has no React, extraction library, or network client. Its singleton runtime lives in Chrome’s isolated content-script world. It requests validated effective settings from the worker and applies one extension-owned stylesheet. Six presets become CSS tokens; WCAG sRGB luminance and contrast calculations drive warmth/luminance/contrast/saturation transformations. Contrast protection moves ink toward the farther luminance endpoint using an 18-step binary search. Surface text and border colors are protected independently.

The classifier uses semantics first: article/main/body, paragraphs/headings, navigation, links, tables, code, controls, dialogs, and status regions. Computed background styles are sampled only for generic containers. SVG/canvas/video/iframes, editable regions, password fields, known code editors, photographic background regions, and explicit `data-folio-preserve` regions are excluded. Form values, cookies, authentication state, and storage belonging to the website are never inspected. Optional image dimming uses a CSS brightness filter limited to images. It never inverts a page or filters the entire viewport.

Candidate traversal is split into tasks of at most 600 candidates / roughly 12 ms of work, subject to browser scheduling. A single MutationObserver watches child additions/removals and class/style attributes. It ignores owned surfaces, coalesces roots for 90 ms, skips classified nodes, and prunes disconnected references. New SPA trees and infinite-scroll content inherit the current palette without polling or history-method monkeypatching. Syntax spans are grouped into warm/cool/green/neutral readable hues, retaining token distinctions across light/dark surfaces.

Only a bounded family of attribute-scoped rules uses `!important` to override author CSS. This may still yield to highly specific author declarations; compatibility takes precedence over a universal override. Original page inline styles and markup are not rewritten. Original values of reserved attributes are recorded before modification. Disable disconnects the observer, cancels work, removes the owned stylesheet, and restores recorded attributes. Website listeners, controls, forms, and media remain mounted. Singleton page listeners are installed once and are collected when the document goes away.

## Reader Mode

The worker loads the reader bundle only on first use in a document. Mozilla Readability processes a document clone, with forms and editable content removed. A single semantic article is retained when its title matches the document title, it contains sufficient text, and its link density is low; this prevents a dominant inner paragraph wrapper from discarding neighboring figures/tables. Otherwise Readability’s extracted content is used. Low-confidence output fails before creating a UI. No missing content is generated.

DOMPurify converts untrusted extracted HTML directly into a DocumentFragment using a narrow allowlist. Scripts, handlers, inline styles, forms, embedded frames, SVG/MathML, and unsafe protocols are excluded. Links/images are resolved against the source URL and checked again; external links use noopener/noreferrer. Relative intra-article fragment navigation scrolls within the reader. The fragment is appended to an isolated shadow tree, never passed unsanitized to a privileged extension page.

A native modal dialog inside the shadow host provides top-layer presentation, background inertness, focus containment, and Escape. The React reading interface controls fonts, width, grain, colors, and image brightness through local CSS variables; content and toolbar are separate scroll regions. Scroll/progress listeners and ResizeObserver are removed on unmount. Original focus, page scroll, media, form state, and DOM are retained. The current reader scroll position exists only in page memory.

## Settings and precedence

Schema v1 explicitly validates every imported value, palette color, range, enum, schedule, and origin. Unknown keys are stripped. Version 0 receives a small migration; invalid stored versions recover to safe defaults and produce a user-visible notice. JSON imports are capped at 150 kB; rules and custom presets have explicit limits. Worker writes are serialized to prevent lost updates between independent rule changes. The popup uses a partial appearance patch for quick controls. Options use optimistic local state and a 120 ms commit debounce, with an unload flush. Validated settings are stored in local Chrome storage, never sync/cloud storage.

Rules match exact normalized HTTP(S) origins including scheme and non-default port. No suffix/domain wildcard matching is performed. Temporary tab overrides are stored in storage.session, keyed by tab id and origin, and ignored if a tab moves to an unrelated origin. Rules override system/schedule behavior, which overrides the default palette. Content scripts report their own OS color preference; no worker in-memory preference is assumed to survive suspension. Media changes and visibility/pageshow events refresh state.

Only the next scheduled day/night transition has a Chrome alarm. Installation, browser startup, and configuration changes reconcile alarms and persistent dynamic content-script registration. No recurring idle timer or keepalive exists. Page activation works through activeTab; automatic navigation requires explicit optional host permission. Registration is derived from Chrome’s actual granted permissions, so importing a settings file cannot silently grant access. Permission changes reconcile registrations. Turning off a site or revoking host access does not mutate its saved page content.

## Messaging and security

The discriminated TypeScript message protocol is checked at runtime for type/size. Every setting mutation passes full schema validation before storage. Global mutations require a sender URL in Folio’s own extension origin. Page senders can request their resolved state and limited reader preferences, with origins derived from Chrome’s trusted sender metadata. There is no external message handler and no web-page script execution. Chrome API failures return structured errors to the popup/settings. The extension CSP permits only bundled scripts and disallows objects/base tags/ancestor embedding.

## Deliberate limits

The engine does not traverse iframe/shadow contents or reconstruct canvas graphics. Normal mode deliberately retains website typography and application layout. Reader Mode displays a sanitized article snapshot rather than a fully interactive reproduction of embedded widgets. No third-party site-specific selector hacks, remote config, remote fonts, AI model, screenshot analysis, or browsing database is used. These choices bound work and protect page functionality; the release documentation identifies the controlled scenarios actually tested.
