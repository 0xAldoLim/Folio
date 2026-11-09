# Third-party notices

Runtime dependencies are bundled locally. No packages are fetched at extension runtime.

- **@mozilla/readability 0.6.0** — Apache-2.0. https://github.com/mozilla/readability
- **dompurify 3.4.17** — (MPL-2.0 OR Apache-2.0). git://github.com/cure53/DOMPurify.git
- **react 19.3.1** — MIT. https://github.com/react/react.git
- **react-dom 19.3.1** — MIT. https://github.com/react/react.git
- **scheduler 0.28.0** — MIT. https://github.com/react/react.git

Full runtime licenses are included in dist/licenses/. Development tools are not shipped in the extension. The lockfile pins the audited dependency graph. Run pnpm audit --prod for a current registry advisory check.
