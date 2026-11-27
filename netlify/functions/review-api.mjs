// Grant review deck API. One function, four actions:
//   GET  ?action=status        what is configured (never returns secrets)
//   GET  ?action=applications  normalised applications, ranked
//   POST {action:"score", id}  assess one application with Claude, store the result
//   POST {action:"decide", id, decision, note}
//
// Configuration (Netlify environment variables, never in source):
//   REVIEW_ACCESS_KEY   shared reviewer passphrase; required when Airtable is configured
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID   the applications table
//   AIRTABLE_VIEW_ID    optional view to read from
//   ANTHROPIC_API_KEY   enables Claude scoring; without it a completeness heuristic runs
//   REVIEW_MODEL        optional model override (default claude-opus-5-5)
import Anthropic from '@anthropic-ai/sdk';
import {
  RUBRIC, SCORE_SCHEMA, applicationText, assessmentFields, decisionFields,
  heuristicScore, normaliseRecord, rankApplications, toAssessment,
} from '../../scripts/review-core.mjs';

const env = (k) => (process.env[k] || '').trim();
const airtableConfigured = () => Boolean(env('AIRTABLE_TOKEN') && env('AIRTABLE_BASE_ID') && env('AIRTABLE_TABLE_ID'));
const aiConfigured = () => Boolean(env('ANTHROPIC_API_KEY'));
const MODEL = env('REVIEW_MODEL') || 'claude-opus-5-5';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const action = url.searchParams.get('action') || body.action;
    if (action === 'status') return json(status());
    if (airtableConfigured() && !authorised(request)) return json({ error: 'A reviewer key is required.' }, 401);

    if (action === 'applications') return json(await listApplications());
    if (action === 'score' && request.method === 'POST') return json(await scoreOne(body));
    if (action === 'decide' && request.method === 'POST') return json(await decide(body));
    return json({ error: 'Unknown action.' }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: error.message || 'Unexpected error.' }, 500);
  }
}

function status() {
  return {
    mode: airtableConfigured() ? 'airtable' : 'demo',
    ai: aiConfigured() ? 'claude' : 'heuristic',
    model: aiConfigured() ? MODEL : null,
    needsKey: airtableConfigured(),
  };
}

function authorised(request) {
  const expected = env('REVIEW_ACCESS_KEY');
  if (!expected) return false; // Airtable without a key would expose applicants.
  const given = request.headers.get('x-review-key') || '';
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function timingSafeEqual(a, b) {
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// ---------- Airtable ----------
const AT = 'https://api.airtable.com/v0';
const atHeaders = () => ({ authorization: `Bearer ${env('AIRTABLE_TOKEN')}`, 'content-type': 'application/json' });

async function atFetch(path, init = {}) {
  const res = await fetch(`${AT}${path}`, { ...init, headers: { ...atHeaders(), ...(init.headers || {}) } });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function fetchRecords() {
  const records = [];
  let offset = '';
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (env('AIRTABLE_VIEW_ID')) params.set('view', env('AIRTABLE_VIEW_ID'));
    if (offset) params.set('offset', offset);
    const page = await atFetch(`/${env('AIRTABLE_BASE_ID')}/${env('AIRTABLE_TABLE_ID')}?${params}`);
    records.push(...page.records);
    offset = page.offset || '';
  } while (offset);
  return records;
}

async function fetchRecord(id) {
  return atFetch(`/${env('AIRTABLE_BASE_ID')}/${env('AIRTABLE_TABLE_ID')}/${id}`);
}

let fieldNamesCache = null;
async function tableFieldNames() {
  if (fieldNamesCache) return fieldNamesCache;
  const meta = await atFetch(`/meta/bases/${env('AIRTABLE_BASE_ID')}/tables`);
  const table = meta.tables.find((t) => t.id === env('AIRTABLE_TABLE_ID') || t.name === env('AIRTABLE_TABLE_ID'));
  if (!table) throw new Error('Applications table not found in the base.');
  fieldNamesCache = table.fields.map((f) => f.name);
  return fieldNamesCache;
}

async function updateRecord(id, fields) {
  if (!Object.keys(fields).length) return { skipped: true };
  await atFetch(`/${env('AIRTABLE_BASE_ID')}/${env('AIRTABLE_TABLE_ID')}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields, typecast: true }),
  });
  return { stored: Object.keys(fields) };
}

// ---------- demo data ----------
async function demoRecords() {
  const { readFile } = await import('node:fs/promises');
  const candidates = [
    new URL('../../content/review-demo.json', import.meta.url),
    new URL('../../static-dist/content/review-demo.json', import.meta.url),
  ];
  for (const file of candidates) {
    try { return JSON.parse(await readFile(file, 'utf8')).records; } catch { /* try next */ }
  }
  throw new Error('Sample applications are missing.');
}

// ---------- actions ----------
async function listApplications() {
  const records = airtableConfigured() ? await fetchRecords() : await demoRecords();
  const apps = rankApplications(records.map(normaliseRecord));
  return { ...status(), count: apps.length, applications: apps };
}

async function loadOne(id) {
  const record = airtableConfigured() ? await fetchRecord(id) : (await demoRecords()).find((r) => r.id === id);
  if (!record) throw new Error('Application not found.');
  return normaliseRecord(record);
}

async function scoreOne({ id, force }) {
  if (!id) throw new Error('Missing application id.');
  const app = await loadOne(id);
  if (app.ai && !force) return { id, assessment: app.ai, stored: [] };
  const assessment = aiConfigured() ? await assessWithClaude(app) : heuristicScore(app);
  let stored = [];
  if (airtableConfigured() && assessment.source === 'claude') {
    const result = await updateRecord(id, assessmentFields(assessment, await tableFieldNames()));
    stored = result.stored || [];
  }
  return { id, assessment, stored };
}

async function decide({ id, decision, note }) {
  if (!id) throw new Error('Missing application id.');
  if (!airtableConfigured()) return { id, decision, note: note || '', stored: [] , mode: 'demo' };
  const result = await updateRecord(id, decisionFields(decision, note, await tableFieldNames()));
  return { id, decision, note: note || '', stored: result.stored || [], mode: 'airtable' };
}

// ---------- Claude ----------
async function assessWithClaude(app) {
  const client = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY'), timeout: 25_000, maxRetries: 1 });
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2_000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCORE_SCHEMA } },
    system: [{ type: 'text', text: RUBRIC, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Assess this application.\n\n${applicationText(app)}` }],
  });
  if (response.stop_reason === 'refusal') {
    const why = response.stop_details?.explanation || 'The model declined to assess this application.';
    return toAssessment({ score: 0, one_line: `Not assessed: ${why}`, strengths: [], concerns: ['Review by hand.'], questions_for_panel: [], criteria: null }, 'refused');
  }
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return toAssessment(JSON.parse(text), 'claude');
}
