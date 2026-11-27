// Pure data logic for /projects and /donate. Airtable records in, page data out.
// No network here, so tests cover every mapping and every total.

export const OVERHEAD_RATE = 0.05;
export const MIN_POOL = 3000;
export const DEFAULT_DONORBOX = 'https://donorbox.org/primordia-microgrants';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (v) => (v == null ? '' : Array.isArray(v) ? v.map(text).filter(Boolean).join(', ') : typeof v === 'object' ? String(v.name ?? '') : String(v).trim());
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const bool = (v) => v === true;

/** Airtable Grants row to public grant. Private fields never leave this function. */
export function grantFromRecord(record) {
  const f = record.fields || {};
  const slug = text(f.Slug).toLowerCase();
  if (!SLUG.test(slug)) return null;
  const attachment = Array.isArray(f.Image) && f.Image[0] ? f.Image[0] : null;
  return {
    slug,
    title: text(f.Title),
    grantee: text(f.Grantee),
    field: text(f.Field),
    location: text(f.Location),
    budget: num(f.Budget),
    budgetNote: text(f['Budget note']),
    summary: text(f.Summary),
    image: attachment ? { remote: attachment.url, filename: attachment.filename || '' } : (text(f['Image path']) || null),
    imageAlt: text(f['Image alt']),
    status: text(f.Status) || 'Funded',
    cycle: text(f.Cycle),
    fundedOn: text(f['Funded on']) || null,
    donateUrl: text(f['Donorbox URL']) || null,
  };
}

export function updateFromRecord(record) {
  const f = record.fields || {};
  const slug = text(f['Grant slug']).toLowerCase();
  if (!SLUG.test(slug) || !text(f.Month)) return null;
  const photo = Array.isArray(f.Photo) && f.Photo[0] ? { remote: f.Photo[0].url, filename: f.Photo[0].filename || '' } : null;
  return {
    id: record.id,
    slug,
    month: text(f.Month),
    headline: text(f.Headline),
    did: text(f['What did you do this month?']),
    saw: text(f['What did you see?']),
    changed: text(f['What changed in your plan?']),
    spendToDate: num(f['Spend to date']),
    link: text(f.Link) || null,
    photo,
    final: bool(f['Final report']),
  };
}

export function cycleFromRecord(record) {
  const f = record.fields || {};
  return {
    name: text(f.Cycle),
    opened: text(f.Opened) || null,
    closed: text(f.Closed) || null,
    decidedOn: text(f['Decided on']) || null,
    paidOn: text(f['Paid on']) || null,
    applications: num(f.Applications),
    funded: num(f.Funded),
    paidOut: num(f['Paid out']),
    pool: num(f.Pool),
    medianDays: num(f['Median days to decision']),
  };
}

export function donationFromRecord(record) {
  const f = record.fields || {};
  const gross = num(f.Gross);
  if (gross == null || !text(f.Date)) return null;
  const fees = num(f.Fees) ?? 0;
  return {
    date: text(f.Date),
    source: text(f.Source) || 'Other',
    campaign: text(f.Campaign),
    gross,
    fees,
    net: num(f.Net) ?? round2(gross - fees),
    recurring: bool(f.Recurring),
    slug: text(f['Grant slug']).toLowerCase() || null,
    supporter: text(f['Supporter name']) || null,
  };
}

export const round2 = (n) => Math.round(n * 100) / 100;

/** Totals for /donate. Every number is derived from the rows, never typed. */
export function ledgerSummary({ donations = [], cycles = [] }, today = new Date()) {
  const gross = round2(donations.reduce((a, d) => a + d.gross, 0));
  const fees = round2(donations.reduce((a, d) => a + d.fees, 0));
  const net = round2(donations.reduce((a, d) => a + d.net, 0));
  const overhead = round2(net * OVERHEAD_RATE);
  const paidOut = round2(cycles.reduce((a, c) => a + (c.paidOut || 0), 0));
  const applications = cycles.reduce((a, c) => a + (c.applications || 0), 0);
  const funded = cycles.reduce((a, c) => a + (c.funded || 0), 0);
  const thisMonth = monthKey(today);
  const lastMonth = monthKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)));
  // Gifts that back one grant go to that grant, not to the monthly pool.
  const inMonth = (key) => round2(donations.filter((d) => d.date.startsWith(key) && !d.slug).reduce((a, d) => a + d.net, 0));
  const nextPool = round2(inMonth(thisMonth) * (1 - OVERHEAD_RATE));
  const byMonth = {};
  for (const d of donations) {
    const key = d.date.slice(0, 7);
    byMonth[key] = byMonth[key] || { month: key, gross: 0, fees: 0, net: 0, gifts: 0, recurring: 0 };
    byMonth[key].gross = round2(byMonth[key].gross + d.gross);
    byMonth[key].fees = round2(byMonth[key].fees + d.fees);
    byMonth[key].net = round2(byMonth[key].net + d.net);
    byMonth[key].gifts += 1;
    if (d.recurring) byMonth[key].recurring += 1;
  }
  const decided = cycles.filter((c) => c.medianDays != null);
  return {
    gross, fees, net, overhead, paidOut, applications, funded,
    fundingRate: applications ? funded / applications : null,
    medianDays: decided.length ? decided.at(-1).medianDays : null,
    pool: { month: nextMonthLabel(today), collected: nextPool, target: MIN_POOL, lastMonthNet: inMonth(lastMonth) },
    months: Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month)),
    supporters: [...new Set(donations.map((d) => d.supporter).filter(Boolean))].sort(),
  };
}

export function backedByGrant(donations) {
  const out = {};
  for (const d of donations) if (d.slug) out[d.slug] = round2((out[d.slug] || 0) + d.net);
  return out;
}

const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
function nextMonthLabel(d) {
  const n = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return n.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function money(n, { cents = false } = {}) {
  if (n == null) return '';
  const whole = Number.isInteger(n) || !cents;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: whole && Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
}

export function budgetLabel(grant) {
  return grant.budgetNote || (grant.budget != null ? money(grant.budget) : '');
}

export function monthLabel(iso) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.valueOf()) ? iso : d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Group updates by grant, newest first. */
export function updatesBySlug(updates) {
  const out = {};
  for (const u of [...updates].sort((a, b) => b.month.localeCompare(a.month))) (out[u.slug] ||= []).push(u);
  return out;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Only http(s) links reach the page. */
export function safeUrl(u) {
  try { const url = new URL(u); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
