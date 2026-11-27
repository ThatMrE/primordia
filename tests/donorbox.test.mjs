import assert from 'node:assert/strict';
import test from 'node:test';
import { donationFields, syncDonorbox, tokenMatches } from '../scripts/donorbox.mjs';

const gift = {
  id: 4242, status: 'paid', amount: '100.0', currency: 'USD', processing_fee: 3.2, donation_date: '2027-01-05T10:00:00.000Z',
  campaign: { id: 1, name: 'Monthly pool' }, recurring: true, amount_refunded: '0.0', designation: 'open-synth',
  donor: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.org' },
  questions: [{ question_type: 'check', question: 'List me as a supporter', answer: true }],
};

test('a paid Donorbox gift maps to Donations fields without email', () => {
  const f = donationFields(gift);
  assert.deepEqual(f, {
    Reference: 'donorbox-4242', Date: '2027-01-05', Source: 'Donorbox', Campaign: 'Monthly pool', Gross: 100, Fees: 3.2, Net: 96.8,
    Currency: 'USD', Recurring: true, 'Grant slug': 'open-synth', 'Supporter name': 'Ada L.',
  });
  assert.ok(!JSON.stringify(f).includes('ada@example.org'));
});

test('unpaid, refunded, anonymous and unlisted gifts are handled', () => {
  assert.equal(donationFields({ ...gift, status: 'refunded' }), null);
  assert.equal(donationFields({ ...gift, amount_refunded: '100.0' }), null);
  assert.equal(donationFields({ ...gift, anonymous_donation: true })['Supporter name'], undefined);
  assert.equal(donationFields({ ...gift, questions: [] })['Supporter name'], undefined);
  assert.equal(donationFields({ ...gift, designation: 'General fund' })['Grant slug'], undefined);
  const eur = donationFields({ ...gift, currency: 'eur', amount: '90', converted_amount: '98.5', converted_currency: 'usd' });
  assert.equal(eur.Gross, 98.5);
  assert.equal(eur.Currency, 'USD');
});

test('sync adds only gifts Airtable does not have, then calls the build hook once', async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push([String(url).split('?')[0], init.method || 'GET']);
    if (String(url).startsWith('https://donorbox.org/api/v1/donations')) return Response.json([gift, { ...gift, id: 4243 }]);
    if (String(url).includes('/Donations?')) return Response.json({ records: [{ id: 'r1', fields: { Reference: 'donorbox-4242' } }] });
    if (init.method === 'POST' && String(url).endsWith('/Donations')) {
      const body = JSON.parse(init.body);
      assert.deepEqual(body.records.map((r) => r.fields.Reference), ['donorbox-4243']);
      return Response.json({ records: [] });
    }
    if (String(url).startsWith('https://api.netlify.com/build_hooks/')) return new Response('', { status: 200 });
    throw new Error(`unexpected ${url}`);
  };
  const env = { DONORBOX_EMAIL: 'a@b.c', DONORBOX_API_KEY: 'k', GRANTS_BASE_ID: 'appX', GRANTS_AIRTABLE_WRITE_TOKEN: 't', NETLIFY_BUILD_HOOK_URL: 'https://api.netlify.com/build_hooks/abc' };
  const result = await syncDonorbox({ env, fetchImpl, log: { log() {} } });
  assert.deepEqual(result, { ok: true, checked: 2, added: 1 });
  assert.equal(calls.filter(([u]) => u.includes('build_hooks')).length, 1);
});

test('sync reports missing configuration instead of failing', async () => {
  const result = await syncDonorbox({ env: {}, fetchImpl: async () => { throw new Error('no network'); } });
  assert.equal(result.skipped, true);
  assert.ok(result.missing.includes('DONORBOX_API_KEY'));
});

test('webhook token comparison', () => {
  assert.ok(tokenMatches('abc123', 'abc123'));
  assert.ok(!tokenMatches('abc124', 'abc123'));
  assert.ok(!tokenMatches('abc', ''));
});
