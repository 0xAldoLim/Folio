import { readFile, writeFile, copyFile } from 'node:fs/promises';
const packages=['@mozilla/readability','dompurify','react','react-dom','scheduler'];let out='# Third-party notices\n\nRuntime dependencies are bundled locally. No packages are fetched at extension runtime.\n\n';
for(const name of packages){const p=JSON.parse(await readFile(`node_modules/${name}/package.json`,'utf8'));out+=`- **${p.name} ${p.version}** — ${p.license}. ${typeof p.repository==='object'?p.repository.url:p.repository}\n`;}
out+='\nFull runtime licenses are included in dist/licenses/. Development tools are not shipped in the extension. The lockfile pins the audited dependency graph. Run pnpm audit --prod for a current registry advisory check.\n';await writeFile('THIRD_PARTY_NOTICES.md',out);console.log(out);
