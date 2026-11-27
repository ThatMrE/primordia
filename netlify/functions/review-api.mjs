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
// Community review (workstream 06) also needs:
//   GRANTS_BASE_ID, GRANTS_AIRTABLE_WRITE_TOKEN   Reviewers and Reviews tables
//   COMMUNITY_CYCLE         label for the open cycle, for example 2027-01
//   COMMUNITY_SCORES_VISIBLE  "true" shows community scores in the panel deck (after the pilot)
import { createHash } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import {
  AIRTABLE_SCORE_FIELDS, assignReviews, communityScore, redactForCommunity, reviewScore, validateScores,
} from '../../scripts/community-core.mjs';
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
    if (action === 'community-applications') return json(await communityApplications(request));
    if (action === 'submit-review' && request.method === 'POST') return json(await submitReview(request, body));
    if (airtableConfigured() && !authorised(request)) return json({ error: 'A reviewer key is required.' }, 401);
    if (action === 'assign' && request.method === 'POST') return json(await assignCycle());

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
    community: communityConfigured(),
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
  if (communityConfigured() && env('COMMUNITY_SCORES_VISIBLE') === 'true') {
    const scores = await communityScoresByApplication();
    for (const app of apps) app.community = scores[app.id] || null;
  }
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

// ---------- community review ----------
const communityConfigured = () => Boolean(env('GRANTS_BASE_ID') && env('GRANTS_AIRTABLE_WRITE_TOKEN'));
const cycleLabel = () => env('COMMUNITY_CYCLE') || new Date().toISOString().slice(0, 7);
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const httpError = (message, status) => Object.assign(new Error(message), { status });
const formulaString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

async function gFetch(pathAndQuery, init = {}) {
  const res = await fetch(`${AT}/${env('GRANTS_BASE_ID')}/${pathAndQuery}`, {
    ...init, headers: { authorization: `Bearer ${env('GRANTS_AIRTABLE_WRITE_TOKEN')}`, 'content-type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function gAll(table, formula) {
  const rows = [];
  let offset = '';
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (formula) params.set('filterByFormula', formula);
    if (offset) params.set('offset', offset);
    const page = await gFetch(`${encodeURIComponent(table)}?${params}`);
    rows.push(...page.records);
    offset = page.offset || '';
  } while (offset);
  return rows;
}

async function reviewerFor(request) {
  const key = (request.headers.get('x-reviewer-key') || '').trim();
  if (!communityConfigured()) {
    if (key !== 'demo') throw httpError('Community review is not open yet. Enter demo to try it with sample applications.', 401);
    return { email: 'demo@example.org', name: 'Sample reviewer', demo: true };
  }
  if (key.length < 8) throw httpError('Enter your personal review key.', 401);
  const rows = await gAll('Reviewers', `AND({Active}, {Key hash} = ${formulaString(sha256(key))})`);
  if (!rows.length) throw httpError('That review key was not recognised. Check the link in your invitation email.', 401);
  return { email: String(rows[0].fields.Email || '').toLowerCase(), name: rows[0].fields.Name || '' };
}

async function communityApplications(request) {
  const reviewer = await reviewerFor(request);
  if (reviewer.demo) {
    const apps = (await demoRecords()).slice(0, 4).map(normaliseRecord).map(redactForCommunity);
    return { demo: true, reviewer: reviewer.name, cycle: 'Sample cycle', assignments: apps.map((a) => ({ application: a, done: false })) };
  }
  const reviews = await gAll('Reviews', `AND(LOWER({Reviewer email}) = ${formulaString(reviewer.email)}, {Cycle} = ${formulaString(cycleLabel())})`);
  const assignments = [];
  for (const r of reviews) {
    const id = r.fields['Application ID'];
    if (!id) continue;
    const app = await loadOne(id);
    assignments.push({ application: redactForCommunity(app), done: Boolean(r.fields.Submitted) });
  }
  return { demo: false, reviewer: reviewer.name, cycle: cycleLabel(), assignments };
}

async function submitReview(request, { applicationId, scores, strongest, risk }) {
  const reviewer = await reviewerFor(request);
  const clean = validateScores(scores);
  const strong = String(strongest || '').trim().slice(0, 600);
  const weak = String(risk || '').trim().slice(0, 600);
  if (!strong || !weak) throw httpError('Write one sentence for the strongest point and one for the biggest risk.', 400);
  if (reviewer.demo) return { ok: true, stored: false, score: reviewScore(clean) };
  const rows = await gAll('Reviews', `AND(LOWER({Reviewer email}) = ${formulaString(reviewer.email)}, {Application ID} = ${formulaString(applicationId)}, {Cycle} = ${formulaString(cycleLabel())})`);
  if (!rows.length) throw httpError('This application is not assigned to you.', 403);
  if (rows[0].fields.Submitted) throw httpError('You already sent this review.', 409);
  const fields = { 'Strongest point': strong, 'Biggest risk': weak, Submitted: new Date().toISOString().slice(0, 10) };
  for (const [k, name] of Object.entries(AIRTABLE_SCORE_FIELDS)) fields[name] = clean[k];
  await gFetch(`Reviews/${rows[0].id}`, { method: 'PATCH', body: JSON.stringify({ fields }) });
  return { ok: true, stored: true, score: reviewScore(clean) };
}

async function assignCycle() {
  if (!communityConfigured()) throw httpError('Community review needs GRANTS_BASE_ID and GRANTS_AIRTABLE_WRITE_TOKEN.', 400);
  const apps = (airtableConfigured() ? await fetchRecords() : await demoRecords()).map(normaliseRecord).filter((a) => !a.decision);
  const reviewers = (await gAll('Reviewers', '{Active}')).map((r) => ({
    email: String(r.fields.Email || '').toLowerCase(), location: r.fields.Location || '', conflicts: r.fields.Conflicts || '', fields: r.fields['Fields of expertise'] || '', active: true,
  })).filter((r) => r.email);
  const existing = new Set((await gAll('Reviews', `{Cycle} = ${formulaString(cycleLabel())}`)).map((r) => `${r.fields['Application ID']}|${String(r.fields['Reviewer email'] || '').toLowerCase()}`));
  const { pairs, short } = assignReviews(apps, reviewers);
  const fresh = pairs.filter((p) => !existing.has(`${p.applicationId}|${p.reviewerEmail}`));
  for (let i = 0; i < fresh.length; i += 10) {
    const records = fresh.slice(i, i + 10).map((p) => ({ fields: { Review: `${cycleLabel()} ${p.applicationId}`, 'Reviewer email': p.reviewerEmail, 'Application ID': p.applicationId, Cycle: cycleLabel() } }));
    await gFetch('Reviews', { method: 'POST', body: JSON.stringify({ records }) });
  }
  return { cycle: cycleLabel(), created: fresh.length, short };
}

async function communityScoresByApplication() {
  const rows = await gAll('Reviews', `AND({Cycle} = ${formulaString(cycleLabel())}, {Submitted})`);
  const by = {};
  for (const r of rows) {
    const scores = Object.fromEntries(Object.entries(AIRTABLE_SCORE_FIELDS).map(([k, name]) => [k, r.fields[name]]));
    (by[r.fields['Application ID']] ||= []).push(reviewScore(scores));
  }
  return Object.fromEntries(Object.entries(by).map(([id, s]) => [id, communityScore(s)]));
}
