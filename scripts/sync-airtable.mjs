// Build step: read the Primordia Grants base and write the public JSON the
// pages are built from. When Airtable is not configured or not reachable, the
// committed JSON stays as it is and the build continues. A grant never
// disappears from the site because of an outage.
//
// Environment (Netlify, build scope):
//   GRANTS_BASE_ID          the Primordia Grants base (appqAetz00yR7g8Do)
//   GRANTS_AIRTABLE_TOKEN   read-only token for that base (falls back to AIRTABLE_TOKEN)
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cycleFromRecord, donationFromRecord, grantFromRecord, updateFromRecord } from './site-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = path.join(root, 'content');
const API = 'https://api.airtable.com/v0';

export async function syncAirtable({ env = process.env, log = console } = {}) {
  const base = (env.GRANTS_BASE_ID || '').trim();
  const token = (env.GRANTS_AIRTABLE_TOKEN || env.AIRTABLE_TOKEN || '').trim();
  if (!base || !token) {
    log.log('Airtable sync skipped: GRANTS_BASE_ID or token not set. Using committed content JSON.');
    return { synced: false };
  }
  try {
    const read = (table, formula) => readAll(base, table, token, formula);
    const [grantRows, updateRows, cycleRows, donationRows] = await Promise.all([
      read('Grants', '{Publish}'), read('Updates', '{Publish}'), read('Cycles'), read('Donations'),
    ]);
    const grants = grantRows.map(grantFromRecord).filter(Boolean);
    const slugs = new Set(grants.map((g) => g.slug));
    const updates = updateRows.map(updateFromRecord).filter((u) => u && slugs.has(u.slug));
    for (const g of grants) if (g.image && typeof g.image === 'object') g.image = await saveImage(g.image, `grant-${g.slug}`);
    for (const u of updates) if (u.photo) u.photo = await saveImage(u.photo, `update-${u.slug}-${u.month}`);
    const syncedAt = new Date().toISOString();
    await writeJson('grants.json', { source: 'airtable', syncedAt, grants });
    await writeJson('updates.json', { source: 'airtable', syncedAt, updates });
    await writeJson('ledger.json', {
      source: 'airtable', syncedAt,
      cycles: cycleRows.map(cycleFromRecord).filter((c) => c.name),
      donations: donationRows.map(donationFromRecord).filter(Boolean),
    });
    log.log(`Airtable sync: ${grants.length} grants, ${updates.length} updates, ${cycleRows.length} cycles, ${donationRows.length} donations.`);
    return { synced: true, grants: grants.length };
  } catch (error) {
    log.warn(`Airtable sync failed, using committed content JSON: ${error.message}`);
    return { synced: false, error: error.message };
  }
}

async function readAll(base, table, token, formula) {
  const rows = [];
  let offset = '';
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (formula) params.set('filterByFormula', formula);
    if (offset) params.set('offset', offset);
    const res = await fetch(`${API}/${base}/${encodeURIComponent(table)}?${params}`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${table}: Airtable ${res.status}`);
    const page = await res.json();
    rows.push(...page.records);
    offset = page.offset || '';
  } while (offset);
  return rows;
}

// Airtable attachment URLs expire, so images are copied into the build.
async function saveImage({ remote, filename }, stem) {
  const res = await fetch(remote);
  if (!res.ok) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  const ext = (path.extname(filename || '').toLowerCase().match(/^\.(jpe?g|png|webp|gif)$/) || ['.jpg'])[0];
  const name = `${stem}-${createHash('sha256').update(bytes).digest('hex').slice(0, 10)}${ext}`;
  const dir = path.join(root, 'images', 'grants');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/images/grants/${name}`;
}

async function writeJson(name, data) {
  await writeFile(path.join(content, name), JSON.stringify(data, null, 2) + '\n');
}

export async function readContent() {
  const load = async (name, fallback) => { try { return JSON.parse(await readFile(path.join(content, name), 'utf8')); } catch { return fallback; } };
  return {
    grants: (await load('grants.json', { grants: [] })).grants,
    updates: (await load('updates.json', { updates: [] })).updates,
    ledger: await load('ledger.json', { cycles: [], donations: [] }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) await syncAirtable();
