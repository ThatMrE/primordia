// Review deck client. Talks to /.netlify/functions/review-api when deployed and
// falls back to the bundled sample applications on a static preview.
import { heuristicScore, rankApplications, normaliseRecord, verdictFor, DECISIONS } from './review-core.mjs';

const API = '/.netlify/functions/review-api';
const STORE = 'primordia-review-v1';
const el = (id) => document.getElementById(id);
const nodes = {
  progress: el('progress'), mode: el('mode'), gate: el('gate'), gateForm: el('gate-form'), gateKey: el('gate-key'), gateError: el('gate-error'),
  toolbar: el('toolbar'), stage: el('stage'), stack: el('stack'), pile: el('pile'), pileList: el('pile-list'), pileEmpty: el('pile-empty'),
  error: el('error'), scoreAll: el('score-all'), undo: el('undo'), scoringNote: el('scoring-note'), decisionBar: el('decision-bar'),
  template: el('card-template'),
};

const state = {
  status: { mode: 'demo', ai: 'heuristic', needsKey: false, offline: false },
  apps: [],
  view: 'deck',
  history: [],
  local: loadLocal(),
  scoring: false,
};

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORE)) || { decisions: {}, notes: {}, ai: {} }; } catch { return { decisions: {}, notes: {}, ai: {} }; }
}
function saveLocal() { try { localStorage.setItem(STORE, JSON.stringify(state.local)); } catch { /* private mode */ } }
function reviewerKey() { try { return sessionStorage.getItem(`${STORE}-key`) || ''; } catch { return ''; } }

async function api(action, body) {
  const init = body
    ? { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-key': reviewerKey() }, body: JSON.stringify({ action, ...body }) }
    : { headers: { 'x-review-key': reviewerKey() } };
  const res = await fetch(`${API}?action=${action}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || `Request failed (${res.status}).`); err.status = res.status; throw err; }
  return data;
}

// ---------- boot ----------
boot();
async function boot() {
  try {
    state.status = await api('status');
  } catch {
    state.status = { mode: 'demo', ai: 'heuristic', needsKey: false, offline: true };
  }
  if (state.status.needsKey && !reviewerKey()) { showGate(); return; }
  await loadApplications();
}

function showGate(message) {
  nodes.gate.hidden = false;
  nodes.progress.textContent = 'Locked';
  nodes.mode.textContent = 'Live applications from Airtable';
  nodes.gateError.hidden = !message; nodes.gateError.textContent = message || '';
  nodes.gateKey.focus();
}
nodes.gateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try { sessionStorage.setItem(`${STORE}-key`, nodes.gateKey.value.trim()); } catch { /* ignore */ }
  try {
    await loadApplications();
    nodes.gate.hidden = true;
  } catch (error) {
    if (error.status === 401) showGate('That key was not accepted. Check it with the panel lead.');
    else showError(error);
  }
});

async function loadApplications() {
  let apps;
  if (state.status.offline) {
    const res = await fetch('/content/review-demo.json');
    const data = await res.json();
    apps = data.records.map(normaliseRecord);
  } else {
    const data = await api('applications');
    apps = data.applications;
    Object.assign(state.status, { mode: data.mode, ai: data.ai, model: data.model });
  }
  // Merge locally kept decisions and scores (demo mode keeps everything in this browser).
  for (const app of apps) {
    if (!app.decision && state.local.decisions[app.id]) app.decision = state.local.decisions[app.id];
    if (state.local.notes[app.id]) app.note = state.local.notes[app.id];
    if (!app.ai && state.local.ai[app.id]) app.ai = state.local.ai[app.id];
  }
  state.apps = rankApplications(apps);
  nodes.toolbar.hidden = false;
  nodes.stage.hidden = false;
  const assign = document.getElementById('assign');
  if (assign) assign.hidden = !(state.status.mode === 'airtable' && state.status.community);
  render();
}

// ---------- rendering ----------
function unreviewed() { return state.apps.filter((a) => !a.decision); }
function pile(decision) { return state.apps.filter((a) => a.decision === decision); }

function render() {
  const total = state.apps.length;
  const done = total - unreviewed().length;
  nodes.progress.textContent = total ? `${done} of ${total} reviewed` : 'No applications yet';
  nodes.mode.textContent = modeText();
  nodes.undo.disabled = state.history.length === 0;
  el('count-deck').textContent = unreviewed().length;
  for (const d of DECISIONS) el(`count-${d}`).textContent = pile(d).length;
  for (const tab of document.querySelectorAll('.view-tab')) tab.setAttribute('aria-selected', String(tab.dataset.view === state.view));
  const unscored = unreviewed().filter((a) => !a.ai).length;
  nodes.scoreAll.disabled = state.scoring || unscored === 0;
  nodes.scoreAll.textContent = state.scoring ? 'Scoring…' : unscored ? `Score and rank ${unscored} with AI` : 'All scored';
  if (state.view === 'deck') { nodes.stage.hidden = false; nodes.pile.hidden = true; renderStack(); }
  else { nodes.stage.hidden = true; nodes.pile.hidden = false; renderPile(state.view); }
}

function modeText() {
  const source = state.status.mode === 'airtable' ? 'Live applications from Airtable' : 'Sample applications (fictional) until Airtable is connected';
  const ai = state.status.ai === 'claude' ? `Scored by ${state.status.model || 'Claude'}` : state.status.offline ? 'Ranking by completeness check only' : 'Completeness check only until a Claude key is set';
  return `${source}. ${ai}.`;
}

function renderStack() {
  const queue = unreviewed();
  nodes.stack.replaceChildren();
  if (!queue.length) {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    const approved = pile('Approve').length; const later = pile('Later').length; const declined = pile('Reject').length;
    empty.innerHTML = `<h2>Deck clear</h2><p>${approved} approved, ${later} set aside for later, ${declined} declined.</p><p>Open a pile above to revisit any decision.</p>`;
    nodes.stack.append(empty);
    for (const b of nodes.decisionBar.querySelectorAll('button')) b.disabled = true;
    return;
  }
  for (const b of nodes.decisionBar.querySelectorAll('button')) b.disabled = false;
  const show = queue.slice(0, 3).reverse();
  show.forEach((app, i) => {
    const depth = show.length - 1 - i;
    const card = buildCard(app, queue.indexOf(app) + 1, queue.length);
    if (depth) card.classList.add(`is-behind-${depth}`);
    nodes.stack.append(card);
  });
  const top = nodes.stack.lastElementChild;
  attachSwipe(top, queue[0]);
}

function buildCard(app, position, total) {
  const card = nodes.template.content.firstElementChild.cloneNode(true);
  const slot = (name) => card.querySelector(`[data-slot="${name}"]`);
  card.dataset.id = app.id;
  slot('title').textContent = app.title;
  slot('rank').textContent = `${position} of ${total} in the deck` + (app.community ? ` · Community ${app.community.score} from ${app.community.reviews} reviews` : '');
  const meta = [app.name, app.location, app.amount, app.lab].filter(Boolean);
  slot('meta').replaceChildren(...meta.map((m) => { const s = document.createElement('span'); s.textContent = m; return s; }));
  const score = slot('score');
  if (app.ai) {
    slot('score-number').textContent = app.ai.score;
    slot('verdict').textContent = app.ai.verdict || verdictFor(app.ai.score);
    score.classList.add(app.ai.score >= 75 ? 'is-strong' : app.ai.score < 35 ? 'is-out' : app.ai.score < 55 ? 'is-weak' : 'is-mid');
    if (app.ai.source === 'heuristic') score.classList.add('is-heuristic');
    slot('summary').textContent = app.ai.summary || '';
    fillList(slot('strengths'), app.ai.strengths, slot('strengths-wrap'));
    fillList(slot('concerns'), app.ai.concerns, slot('concerns-wrap'));
    const q = app.ai.questions || [];
    slot('questions-wrap').hidden = q.length === 0;
    fillList(slot('questions'), q);
  } else {
    score.classList.add('is-pending');
    slot('verdict').textContent = state.scoring ? 'Scoring…' : 'Not scored yet';
    slot('summary').textContent = '';
    slot('strengths-wrap').hidden = true; slot('concerns-wrap').hidden = true;
  }
  const dl = slot('answers');
  for (const a of app.answers) {
    const dt = document.createElement('dt'); dt.textContent = a.label;
    const dd = document.createElement('dd'); dd.textContent = a.text;
    dl.append(dt, dd);
  }
  if (app.email) { const dt = document.createElement('dt'); dt.textContent = 'Email'; const dd = document.createElement('dd'); dd.textContent = app.email; dl.append(dt, dd); }
  const note = slot('note');
  note.id = `note-${app.id}`; slot('note-label').setAttribute('for', note.id);
  note.value = app.note || '';
  note.addEventListener('input', () => { app.note = note.value; state.local.notes[app.id] = note.value; saveLocal(); });
  if (app.note) card.querySelector('.card-note').open = true;
  return card;
}

function fillList(ul, items, wrap) {
  ul.replaceChildren(...(items || []).map((t) => { const li = document.createElement('li'); li.textContent = t; return li; }));
  if (wrap) wrap.hidden = !(items && items.length);
}

function renderPile(decision) {
  const items = pile(decision);
  nodes.pileEmpty.hidden = items.length > 0;
  nodes.pileList.replaceChildren(...items.map((app) => {
    const li = document.createElement('li'); li.className = 'pile-item';
    const score = document.createElement('div'); score.className = 'pile-score'; score.textContent = app.ai ? app.ai.score : '–';
    const body = document.createElement('div');
    const title = document.createElement('p'); title.className = 'pile-title'; title.textContent = app.title;
    const meta = document.createElement('p'); meta.className = 'pile-meta'; meta.textContent = [app.name, app.location, app.amount].filter(Boolean).join(' · ');
    body.append(title, meta);
    if (app.ai?.summary) { const s = document.createElement('p'); s.className = 'pile-meta'; s.textContent = app.ai.summary; body.append(s); }
    if (app.note) { const n = document.createElement('p'); n.className = 'pile-note'; n.textContent = `Note: ${app.note}`; body.append(n); }
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Decision for ${app.title}`);
    for (const [value, label] of [['Approve', 'Approved'], ['Later', 'Later'], ['Reject', 'Declined'], ['', 'Back to deck']]) {
      const o = document.createElement('option'); o.value = value; o.textContent = label; o.selected = value === (app.decision || ''); select.append(o);
    }
    select.addEventListener('change', () => decide(app, select.value || null, { fromPile: true }));
    li.append(score, body, select);
    return li;
  }));
}

// ---------- decisions ----------
async function decide(app, decision, { fromPile = false } = {}) {
  const previous = app.decision;
  state.history.push({ id: app.id, previous });
  app.decision = decision;
  if (decision) state.local.decisions[app.id] = decision; else delete state.local.decisions[app.id];
  saveLocal();
  if (!fromPile) state.apps = rankApplications(state.apps);
  render();
  if (state.status.mode === 'airtable' && decision) {
    try { await api('decide', { id: app.id, decision, note: app.note || '' }); }
    catch (error) { showError(new Error(`Saved here but not in Airtable: ${error.message}`)); }
  }
}

nodes.undo.addEventListener('click', () => {
  const last = state.history.pop();
  if (!last) return;
  const app = state.apps.find((a) => a.id === last.id);
  if (!app) return;
  app.decision = last.previous || null;
  if (app.decision) state.local.decisions[app.id] = app.decision; else delete state.local.decisions[app.id];
  saveLocal();
  state.apps = rankApplications(state.apps);
  state.view = 'deck';
  render();
  if (state.status.mode === 'airtable' && app.decision) api('decide', { id: app.id, decision: app.decision, note: app.note || '' }).catch(showError);
});

nodes.decisionBar.addEventListener('click', (event) => {
  const button = event.target.closest('[data-decision]');
  if (!button || button.disabled) return;
  flyAway(button.dataset.decision);
});

document.addEventListener('keydown', (event) => {
  if (state.view !== 'deck' || event.target.matches('input, textarea, select')) return;
  const map = { ArrowLeft: 'Reject', ArrowRight: 'Approve', ArrowDown: 'Later' };
  if (map[event.key] && unreviewed().length) { event.preventDefault(); flyAway(map[event.key]); }
  if ((event.key === 'u' || event.key === 'U') && !nodes.undo.disabled) nodes.undo.click();
});

for (const tab of document.querySelectorAll('.view-tab')) tab.addEventListener('click', () => { state.view = tab.dataset.view; render(); });

function flyAway(decision) {
  const app = unreviewed()[0];
  const card = nodes.stack.lastElementChild;
  if (!app || !card || card.classList.contains('is-leaving')) return;
  card.classList.add('is-leaving');
  const move = { Approve: 'translate(120%, -6%) rotate(12deg)', Reject: 'translate(-120%, -6%) rotate(-12deg)', Later: 'translate(0, 70%) scale(.9)' }[decision];
  card.style.transform = move; card.style.opacity = '0';
  card.querySelector(`.stamp--${decision.toLowerCase()}`).style.opacity = '1';
  const finish = () => decide(app, decision);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish(); else setTimeout(finish, 230);
}

// ---------- swipe ----------
function attachSwipe(card, app) {
  let start = null; let dx = 0; let dy = 0;
  const threshold = Math.min(140, card.offsetWidth * 0.35);
  card.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('summary, textarea, a, button, details[open]')) return;
    start = { x: event.clientX, y: event.clientY }; dx = 0; dy = 0;
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
  });
  card.addEventListener('pointermove', (event) => {
    if (!start) return;
    dx = event.clientX - start.x; dy = event.clientY - start.y;
    card.style.transform = `translate(${dx}px, ${dy * 0.6}px) rotate(${dx / 18}deg)`;
    const ratio = Math.min(1, Math.abs(dx) / threshold);
    card.querySelector('.stamp--approve').style.opacity = dx > 0 ? ratio : 0;
    card.querySelector('.stamp--reject').style.opacity = dx < 0 ? ratio : 0;
    card.querySelector('.stamp--later').style.opacity = dy > 80 && Math.abs(dx) < 60 ? Math.min(1, (dy - 80) / 80) : 0;
  });
  const end = () => {
    if (!start) return;
    start = null;
    card.classList.remove('is-dragging');
    if (dx > threshold) return flyAway('Approve');
    if (dx < -threshold) return flyAway('Reject');
    if (dy > 160 && Math.abs(dx) < 60) return flyAway('Later');
    card.style.transform = '';
    for (const s of card.querySelectorAll('.stamp')) s.style.opacity = 0;
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
  card.focus({ preventScroll: true });
  void app;
}

// ---------- scoring ----------
nodes.scoreAll.addEventListener('click', scoreAll);
const assignButton = document.getElementById('assign');
assignButton?.addEventListener('click', async () => {
  assignButton.disabled = true;
  try {
    const result = await api('assign', {});
    nodes.scoringNote.hidden = false;
    nodes.scoringNote.textContent = `Community reviews assigned for ${result.cycle}: ${result.created} new.` + (result.short.length ? ` ${result.short.length} applications have fewer than three reviewers.` : '');
  } catch (error) { showError(error); } finally { assignButton.disabled = false; }
});
async function scoreAll() {
  if (state.scoring) return;
  const queue = unreviewed().filter((a) => !a.ai);
  if (!queue.length) return;
  state.scoring = true;
  nodes.scoringNote.hidden = false;
  let done = 0;
  const update = () => { nodes.scoringNote.textContent = `Scoring ${done} of ${queue.length}. The deck re-ranks as scores arrive.`; };
  update(); render();
  const worker = async () => {
    while (queue.length) {
      const app = queue.shift();
      try {
        app.ai = state.status.offline ? heuristicScore(app) : (await api('score', { id: app.id })).assessment;
        if (state.status.mode !== 'airtable' || app.ai.source !== 'claude') { state.local.ai[app.id] = app.ai; saveLocal(); }
      } catch (error) {
        showError(error);
      }
      done += 1; update();
      state.apps = rankApplications(state.apps);
      render();
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  state.scoring = false;
  nodes.scoringNote.textContent = state.status.ai === 'claude' ? 'Scored. Highest-ranked applications are on top.' : 'Ranked by completeness. Set ANTHROPIC_API_KEY in Netlify for real assessments.';
  render();
}

function showError(error) {
  nodes.error.hidden = false;
  nodes.error.textContent = error.message || String(error);
  console.error(error);
}
