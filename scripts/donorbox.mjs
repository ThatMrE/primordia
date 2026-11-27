// Donorbox to Airtable. The Donorbox API is the source of truth: the webhook
// only asks for a pull, so no payload from the internet is ever trusted.
// API: basic auth (organization email + API key), GET /api/v1/donations,
// date_from, page, per_page (max 100). Fields per the Donorbox API README.
const DONORBOX = 'https://donorbox.org/api/v1';
const AIRTABLE = 'https://api.airtable.com/v0';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LIST_ME = /list me|supporter list|show my name/i;

const n = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? 0 : Number(v));
const r2 = (v) => Math.round(v * 100) / 100;

/** One Donorbox donation to Airtable Donations fields. Returns null for unpaid or refunded gifts. */
export function donationFields(d) {
  if (!d || d.id == null) return null;
  if (d.status && String(d.status).toLowerCase() !== 'paid') return null;
  const usd = String(d.currency || '').toUpperCase() === 'USD';
  const convertedUsd = String(d.converted_currency || '').toUpperCase() === 'USD' && d.converted_amount != null;
  const gross = r2((usd || !convertedUsd ? n(d.amount) : n(d.converted_amount)) - n(d.amount_refunded));
  if (gross <= 0) return null;
  const fees = r2(n(d.processing_fee));
  const designation = String(d.designation || '').trim().toLowerCase();
  const listed = (d.questions || []).some((q) => LIST_ME.test(String(q.question || '')) && (q.answer === true || /^(yes|true|checked)$/i.test(String(q.answer))));
  const first = String(d.donor?.first_name || '').trim();
  const last = String(d.donor?.last_name || '').trim();
  const fields = {
    Reference: `donorbox-${d.id}`,
    Date: String(d.donation_date || '').slice(0, 10),
    Source: 'Donorbox',
    Campaign: String(d.campaign?.name || ''),
    Gross: gross,
    Fees: fees,
    Net: r2(gross - fees),
    Currency: usd || !convertedUsd ? String(d.currency || 'USD').toUpperCase() : 'USD',
    Recurring: Boolean(d.recurring),
  };
  if (SLUG.test(designation)) fields['Grant slug'] = designation;
  if (listed && first && !d.anonymous_donation) fields['Supporter name'] = last ? `${first} ${last[0]}.` : first;
  return fields;
}

export async function fetchDonations({ email, apiKey, since, fetchImpl = fetch }) {
  const auth = 'Basic ' + Buffer.from(`${email}:${apiKey}`).toString('base64');
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const params = new URLSearchParams({ date_from: since, per_page: '100', page: String(page), order: 'asc' });
    const res = await fetchImpl(`${DONORBOX}/donations?${params}`, { headers: { authorization: auth } });
    if (!res.ok) throw new Error(`Donorbox ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch)) throw new Error('Donorbox returned an unexpected shape.');
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function existingReferences({ base, token, fetchImpl }) {
  const refs = new Set();
  let offset = '';
  do {
    const params = new URLSearchParams({ pageSize: '100', 'fields[]': 'Reference' });
    if (offset) params.set('offset', offset);
    const res = await fetchImpl(`${AIRTABLE}/${base}/Donations?${params}`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const page = await res.json();
    for (const r of page.records) if (r.fields?.Reference) refs.add(r.fields.Reference);
    offset = page.offset || '';
  } while (offset);
  return refs;
}

/** Pull recent Donorbox gifts and add the ones Airtable does not have. */
export async function syncDonorbox({ env = process.env, days = 3, fetchImpl = fetch, log = console } = {}) {
  const need = ['DONORBOX_EMAIL', 'DONORBOX_API_KEY', 'GRANTS_BASE_ID', 'GRANTS_AIRTABLE_WRITE_TOKEN'];
  const missing = need.filter((k) => !(env[k] || '').trim());
  if (missing.length) return { ok: false, skipped: true, missing };
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const gifts = await fetchDonations({ email: env.DONORBOX_EMAIL, apiKey: env.DONORBOX_API_KEY, since, fetchImpl });
  const base = env.GRANTS_BASE_ID; const token = env.GRANTS_AIRTABLE_WRITE_TOKEN;
  const have = await existingReferences({ base, token, fetchImpl });
  const fresh = gifts.map(donationFields).filter((f) => f && !have.has(f.Reference));
  for (let i = 0; i < fresh.length; i += 10) {
    const res = await fetchImpl(`${AIRTABLE}/${base}/Donations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ records: fresh.slice(i, i + 10).map((fields) => ({ fields })), typecast: true }),
    });
    if (!res.ok) throw new Error(`Airtable write ${res.status}`);
  }
  for (const f of fresh) log.log(`Donation added: ${f.Reference} ${f.Date} ${f.Net}`);
  if (fresh.length && (env.NETLIFY_BUILD_HOOK_URL || '').startsWith('https://')) await fetchImpl(env.NETLIFY_BUILD_HOOK_URL, { method: 'POST' });
  return { ok: true, checked: gifts.length, added: fresh.length };
}

export function tokenMatches(given, expected) {
  if (!expected || typeof given !== 'string' || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
