import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  backedByGrant, budgetLabel, donationFromRecord, grantFromRecord, ledgerSummary, money, safeUrl, updateFromRecord, updatesBySlug,
} from '../scripts/site-data.mjs';
import { renderDonate, renderGrant, renderProjects } from '../scripts/render-pages.mjs';

const grants = JSON.parse(await readFile(new URL('../content/grants.json', import.meta.url), 'utf8')).grants;
const ledger = JSON.parse(await readFile(new URL('../content/ledger.json', import.meta.url), 'utf8'));

test('grant mapping keeps public fields and drops private ones', () => {
  const g = grantFromRecord({ id: 'rec1', fields: { Title: 'T', Slug: 'my-grant', Grantee: 'A', 'Grantee email': 'secret@example.org', Budget: 2500, Publish: true } });
  assert.equal(g.slug, 'my-grant');
  assert.equal(g.budget, 2500);
  assert.ok(!JSON.stringify(g).includes('secret@example.org'));
  assert.equal(grantFromRecord({ id: 'rec2', fields: { Slug: 'Bad Slug!' } }), null);
});

test('updates need a valid slug and a month, and sort newest first', () => {
  const a = updateFromRecord({ id: 'u1', fields: { 'Grant slug': 'x', Month: '2027-01-01', Headline: 'Jan' } });
  const b = updateFromRecord({ id: 'u2', fields: { 'Grant slug': 'x', Month: '2027-02-01', Headline: 'Feb' } });
  assert.equal(updateFromRecord({ id: 'u3', fields: { 'Grant slug': 'x' } }), null);
  assert.deepEqual(updatesBySlug([a, b]).x.map((u) => u.headline), ['Feb', 'Jan']);
});

test('ledger totals come from rows: fees, net, overhead, pool, backed grants', () => {
  const donations = [
    donationFromRecord({ fields: { Date: '2027-01-03', Gross: 100, Fees: 3.2, Source: 'Donorbox', Recurring: true } }),
    donationFromRecord({ fields: { Date: '2027-01-20', Gross: 50, Fees: 1.75, 'Grant slug': 'open-synth', 'Supporter name': 'Ada L.' } }),
    donationFromRecord({ fields: { Date: '2026-12-15', Gross: 200, Fees: 0, Source: 'Base' } }),
  ];
  const s = ledgerSummary({ donations, cycles: ledger.cycles }, new Date('2027-01-25T00:00:00Z'));
  assert.equal(s.gross, 350);
  assert.equal(s.fees, 4.95);
  assert.equal(s.net, 345.05);
  assert.equal(s.overhead, 17.25);
  assert.equal(s.pool.collected, 91.96);
  assert.equal(s.pool.month, 'February 2027');
  assert.equal(s.paidOut, 13000);
  assert.deepEqual(s.supporters, ['Ada L.']);
  assert.equal(s.months[0].month, '2027-01');
  assert.deepEqual(backedByGrant(donations), { 'open-synth': 48.25 });
});

test('formatting and link safety', () => {
  assert.equal(money(13000), '$13,000');
  assert.equal(money(2991.5), '$2,991.50');
  assert.equal(budgetLabel({ budget: null, budgetNote: '$1,200 vital' }), '$1,200 vital');
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('https://example.org/x'), 'https://example.org/x');
});

test('rendered pages escape text and show the seeded Cohort 01 data', () => {
  const projects = renderProjects({ grants, ledger });
  assert.match(projects, /Funded projects/);
  assert.match(projects, /\$13,000/);
  assert.equal((projects.match(/class="grant-card"/g) || []).length, 7);
  const evil = { ...grants[0], title: '<script>x</script>', donateUrl: 'javascript:alert(1)' };
  const page = renderGrant(evil, { updates: [], backed: 0 });
  assert.ok(!page.includes('<script>x</script>'));
  assert.ok(!page.includes('javascript:alert'));
  assert.match(page, /Monthly updates from the grantee appear here/);
  const donate = renderDonate({ grants, ledger }, new Date('2026-11-27T00:00:00Z'));
  assert.match(donate, /Open ledger/);
  assert.match(donate, /Cohort 01/);
  assert.match(donate, /0xD920E60b798A2F5a8332799d8a23075c9E77d5F8/);
});

test('no private Airtable field name or email appears in public content', async () => {
  for (const name of ['grants.json', 'updates.json', 'ledger.json']) {
    const text = await readFile(new URL(`../content/${name}`, import.meta.url), 'utf8');
    assert.ok(!/Grantee email|Anything you need help with|@[a-z0-9-]+\.[a-z]{2,}/i.test(text), name);
  }
});
