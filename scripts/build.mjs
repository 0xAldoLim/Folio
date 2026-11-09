import { build as viteBuild } from 'vite';
import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import './icons.mjs';
await viteBuild();
for (const [name, entry] of [['content', 'src/content/index.ts'], ['reader', 'src/reader/index.tsx']]) {
  await build({ entryPoints: [entry], outfile: `dist/${name}.js`, bundle: true, format: 'iife', target: 'chrome120', minify: true, legalComments: 'linked', define: { 'process.env.NODE_ENV': '"production"' } });
}
await copyFile('manifest.json', 'dist/manifest.json');
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('PRIVACY.md', 'dist/PRIVACY.md');
await mkdir('dist/licenses', { recursive: true });
for (const [path, file] of [['@mozilla/readability/LICENSE.md', 'Readability.md'], ['dompurify/LICENSE', 'DOMPurify.txt'], ['react/LICENSE', 'React.txt'], ['react-dom/LICENSE', 'React-DOM.txt'], ['scheduler/LICENSE', 'Scheduler.txt']]) await copyFile(`node_modules/${path}`, `dist/licenses/${file}`);
console.log('Unpacked extension ready in dist/');
