import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContent, syncAirtable } from './sync-airtable.mjs';
import { renderSite } from './render-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'static-dist');
await syncAirtable();
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of await readdir(root)) {
  if (/\.(html|png)$/.test(name)) await cp(path.join(root, name), path.join(output, name));
}
for (const name of ['assets', 'styles', 'scripts', 'images', 'content', 'review']) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
const { pages } = await renderSite(output, await readContent());
console.log(`Built homepage, preserved production routes, and rendered ${pages} data pages into static-dist/`);
