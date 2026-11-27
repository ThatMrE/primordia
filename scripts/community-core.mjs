// Community review by former applicants: assignment with conflict rules,
// redaction of identifying fields, and the trimmed community score.
export const CRITERIA = [
  ['clarity', 'Clarity', 'Is the question and the plan clear?'],
  ['feasibility', 'Feasibility', 'Can this experiment run in the time and budget?'],
  ['lab_access', 'Lab access', 'Does the applicant have a real lab, not a home lab?'],
  ['capability', 'Capability', 'Can this person design and run the experiment?'],
  ['openness', 'Openness', 'Will the results be shared publicly?'],
  ['budget_fit', 'Budget fit', 'Is the budget at or under $3,000 and spent on this experiment?'],
  ['impact', 'Impact', 'If it works, what could it become?'],
];
export const AIRTABLE_SCORE_FIELDS = {
  clarity: 'Clarity', feasibility: 'Feasibility', lab_access: 'Lab access', capability: 'Capability',
  openness: 'Openness', budget_fit: 'Budget fit', impact: 'Impact',
};

const domain = (email) => String(email || '').toLowerCase().split('@')[1] || '';
const words = (s) => new Set(String(s || '').toLowerCase().match(/[a-z]{4,}/g) || []);
const city = (loc) => String(loc || '').toLowerCase().split(',')[0].trim();
const PUBLIC_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com']);

/** True when this reviewer must not see this application. */
export function hasConflict(reviewer, app) {
  const rEmail = String(reviewer.email || '').toLowerCase();
  const aEmail = String(app.email || '').toLowerCase();
  if (rEmail && rEmail === aEmail) return true;
  const rd = domain(rEmail);
  if (rd && rd === domain(aEmail) && !PUBLIC_DOMAINS.has(rd)) return true;
  if (city(reviewer.location) && city(reviewer.location) === city(app.location)) return true;
  const declared = String(reviewer.conflicts || '').toLowerCase().split(/[\n,;]+/).map((s) => s.trim()).filter((s) => s.length > 2);
  const haystack = [app.name, app.email, app.lab, app.location, ...(app.answers || []).map((a) => a.text)].join(' ').toLowerCase();
  return declared.some((c) => haystack.includes(c));
}

/**
 * Give each application `perApp` reviewers, each reviewer at most `perReviewer`
 * applications. A reviewer who applied in this cycle reviews nothing. The
 * least-loaded eligible reviewer goes first; ties go to the best field match.
 */
export function assignReviews(apps, reviewers, { perApp = 3, perReviewer = 5 } = {}) {
  const applicants = new Set(apps.map((a) => String(a.email || '').toLowerCase()).filter(Boolean));
  const pool = reviewers.filter((r) => r.active !== false && !applicants.has(String(r.email || '').toLowerCase()));
  const load = new Map(pool.map((r) => [r.email, 0]));
  const eligible = new Map(apps.map((a) => [a.id, pool.filter((r) => !hasConflict(r, a))]));
  const order = [...apps].sort((a, b) => eligible.get(a.id).length - eligible.get(b.id).length);
  const pairs = [];
  const short = [];
  for (const app of order) {
    const text = words([app.title, ...(app.answers || []).map((x) => x.text)].join(' '));
    const ranked = eligible.get(app.id)
      .filter((r) => load.get(r.email) < perReviewer)
      .map((r) => ({ r, match: [...words(r.fields)].filter((w) => text.has(w)).length }))
      .sort((x, y) => load.get(x.r.email) - load.get(y.r.email) || y.match - x.match || String(x.r.email).localeCompare(String(y.r.email)));
    const chosen = ranked.slice(0, perApp).map((x) => x.r);
    for (const r of chosen) { load.set(r.email, load.get(r.email) + 1); pairs.push({ applicationId: app.id, reviewerEmail: r.email }); }
    if (chosen.length < perApp) short.push({ applicationId: app.id, got: chosen.length });
  }
  return { pairs, short };
}

/** What a community reviewer sees: no name, email, location, lab or AI score. */
export function redactForCommunity(app) {
  return { id: app.id, title: app.title, amount: app.amount, answers: (app.answers || []).map(({ key, label, text }) => ({ key, label, text })) };
}

export function validateScores(scores) {
  const out = {};
  for (const [key] of CRITERIA) {
    const v = Number(scores?.[key]);
    if (!Number.isInteger(v) || v < 1 || v > 5) throw new Error(`Score each criterion from 1 to 5 (${key}).`);
    out[key] = v;
  }
  return out;
}

/** Mean of the seven criteria, scaled to 0 to 100. */
export function reviewScore(scores) {
  const vals = CRITERIA.map(([k]) => Number(scores[k]));
  return Math.round(((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4) * 100);
}

/** Community score: drop the highest and lowest when five or more reviews exist. */
export function communityScore(reviewScores) {
  const s = [...reviewScores].filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (s.length < 3) return null;
  const kept = s.length >= 5 ? s.slice(1, -1) : s;
  return { score: Math.round(kept.reduce((a, b) => a + b, 0) / kept.length), reviews: s.length };
}
