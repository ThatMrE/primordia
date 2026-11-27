// Community reviewer client. One application at a time, seven 1-to-5 scores,
// two sentences. No approve or decline: the panel decides.
import { CRITERIA } from './community-core.mjs';

const API = '/.netlify/functions/review-api';
const KEY = 'primordia-community-key';
const $ = (id) => document.getElementById(id);
const state = { assignments: [], index: 0, demo: false };

function key() { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } }

async function call(action, body) {
  const init = body
    ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-reviewer-key': key() }, body: JSON.stringify({ action, ...body }) }
    : { headers: { 'x-reviewer-key': key() } };
  const res = await fetch(`${API}?action=${action}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

async function staticDemo() {
  const { normaliseRecord } = await import('./review-core.mjs');
  const { redactForCommunity } = await import('./community-core.mjs');
  const data = await (await fetch('/content/review-demo.json')).json();
  return { demo: true, cycle: 'Sample cycle', assignments: data.records.slice(0, 4).map(normaliseRecord).map((a) => ({ application: redactForCommunity(a), done: false })) };
}

$('c-gate-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try { sessionStorage.setItem(KEY, $('c-key').value.trim()); } catch { /* ignore */ }
  await start();
});

async function start() {
  $('c-gate-error').hidden = true;
  let data;
  try {
    data = await call('community-applications');
  } catch (error) {
    if (key() === 'demo') data = await staticDemo();
    else { $('c-gate-error').hidden = false; $('c-gate-error').textContent = error.message; return; }
  }
  state.demo = data.demo;
  state.assignments = data.assignments;
  state.index = state.assignments.findIndex((a) => !a.done);
  $('c-gate').hidden = true;
  $('c-mode').textContent = data.demo ? 'Sample applications. Nothing you send is stored.' : `Cycle ${data.cycle}`;
  render();
}

function buildCriteria() {
  const fs = $('c-criteria');
  fs.replaceChildren();
  const legend = document.createElement('legend');
  legend.textContent = 'Score from 1 (weak) to 5 (strong)';
  fs.append(legend);
  for (const [k, label, hint] of CRITERIA) {
    const row = document.createElement('div'); row.className = 'criterion'; row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-labelledby', `c-${k}-label`);
    const name = document.createElement('p'); name.className = 'criterion-name'; name.id = `c-${k}-label`; name.innerHTML = `<strong></strong><span></span>`;
    name.querySelector('strong').textContent = label; name.querySelector('span').textContent = hint;
    const opts = document.createElement('div'); opts.className = 'criterion-options';
    for (let v = 1; v <= 5; v++) {
      const id = `c-${k}-${v}`;
      const input = document.createElement('input'); input.type = 'radio'; input.name = k; input.value = String(v); input.id = id; input.required = true;
      const lab = document.createElement('label'); lab.htmlFor = id; lab.textContent = String(v); lab.setAttribute('aria-label', `${label} ${v} of 5`);
      opts.append(input, lab);
    }
    row.append(name, opts);
    fs.append(row);
  }
}

function render() {
  const total = state.assignments.length;
  const done = state.assignments.filter((a) => a.done).length;
  $('c-progress').textContent = total ? `${done} of ${total} reviews sent` : 'No reviews assigned yet';
  if (state.index < 0 || !total) { $('c-stage').hidden = true; $('c-done').hidden = !total; if (!total) showFail('No applications are assigned to you this cycle. The panel lead sends assignments when a cycle closes.'); return; }
  const app = state.assignments[state.index].application;
  $('c-stage').hidden = false; $('c-done').hidden = true;
  $('c-position').textContent = `Application ${done + 1} of ${total}`;
  $('c-title').textContent = app.title;
  $('c-amount').textContent = app.amount ? `Requests ${app.amount}` : '';
  const dl = $('c-answers'); dl.replaceChildren();
  for (const a of app.answers) { const dt = document.createElement('dt'); dt.textContent = a.label; const dd = document.createElement('dd'); dd.textContent = a.text; dl.append(dt, dd); }
  buildCriteria();
  $('c-form').reset(); $('c-error').hidden = true;
  $('c-title').focus?.();
  window.scrollTo({ top: $('c-stage').offsetTop - 16, behavior: 'smooth' });
}

$('c-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const scores = {};
  for (const [k] of CRITERIA) { const v = form.querySelector(`input[name="${k}"]:checked`); if (v) scores[k] = Number(v.value); }
  const strongest = $('c-strongest').value.trim(); const risk = $('c-risk').value.trim();
  const missing = CRITERIA.filter(([k]) => !scores[k]).map(([, label]) => label);
  if (missing.length || !strongest || !risk) {
    $('c-error').hidden = false;
    $('c-error').textContent = missing.length ? `Score every criterion. Missing: ${missing.join(', ')}.` : 'Write one sentence for the strongest point and one for the biggest risk.';
    $('c-error').focus?.();
    return;
  }
  $('c-submit').disabled = true;
  try {
    const app = state.assignments[state.index].application;
    if (!(state.demo && key() === 'demo' && !(await reachable()))) await call('submit-review', { applicationId: app.id, scores, strongest, risk });
    state.assignments[state.index].done = true;
    state.index = state.assignments.findIndex((a) => !a.done);
    render();
  } catch (error) {
    $('c-error').hidden = false; $('c-error').textContent = error.message;
  } finally { $('c-submit').disabled = false; }
});

let reachableCache;
async function reachable() {
  if (reachableCache !== undefined) return reachableCache;
  try { reachableCache = (await fetch(`${API}?action=status`)).ok; } catch { reachableCache = false; }
  return reachableCache;
}

function showFail(text) { $('c-fail').hidden = false; $('c-fail').textContent = text; }

if (key()) start();
