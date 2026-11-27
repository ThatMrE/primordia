import assert from 'node:assert/strict';
import test from 'node:test';
import { CRYPTO_ADDRESSES, donationFromRecord } from '../scripts/site-data.mjs';
import { donationRow, importCrypto, units } from '../scripts/crypto.mjs';

const ETH = CRYPTO_ADDRESSES.ethereum.toLowerCase();
const BASE_TOPIC = '0x' + '0'.repeat(24) + CRYPTO_ADDRESSES.base.toLowerCase().slice(2);
const DAY = 86400;
const NOW = Date.parse('2027-02-10T12:00:00Z');
const ts = (iso) => String(Math.floor(Date.parse(iso) / 1000));

test('unit conversion keeps precision for 6 and 18 decimals', () => {
  assert.equal(units('75108478', 6), 75.108478);
  assert.equal(units('144020000000000000000', 18), 144.02);
  assert.equal(units('0x' + (250n * 10n ** 6n).toString(16), 6), 250);
});

test('imported rows wait for review and large transfers say so', () => {
  const small = donationRow({ reference: 'ethereum:0xa:1', date: '2027-02-09', source: 'Ethereum', currency: 'USDC', amount: 250, usd: 250 });
  assert.equal(small['Needs review'], true);
  assert.doesNotMatch(small['Review note'], /Large transfer/);
  const big = donationRow({ reference: 'ethereum:0xb:1', date: '2027-02-09', source: 'Ethereum', currency: 'USDC', amount: 50000, usd: 50000 });
  assert.match(big['Review note'], /^Large transfer/);
  assert.equal(donationFromRecord({ fields: { ...big } }), null, 'the site ignores rows that need review');
  assert.ok(donationFromRecord({ fields: { ...small, 'Needs review': false } }), 'a confirmed row counts');
});

function chainMock({ written }) {
  return async (url, init = {}) => {
    const u = String(url);
    if (u.startsWith('https://ethereum-rpc.publicnode.com') || u.startsWith('https://base-rpc.publicnode.com')) {
      const { method, params } = JSON.parse(init.body);
      const isBase = u.includes('base');
      const head = isBase ? 30_000_000 : 20_000_000;
      if (method === 'eth_blockNumber') return Response.json({ result: '0x' + head.toString(16) });
      if (method === 'eth_getBlockByNumber') {
        const n = parseInt(params[0], 16);
        const sec = n === head ? NOW / 1000 : Date.parse('2027-02-09T08:00:00Z') / 1000;
        return Response.json({ result: { timestamp: '0x' + Math.floor(sec).toString(16) } });
      }
      if (method === 'eth_getLogs') {
        assert.equal(params[0].topics[2], BASE_TOPIC);
        const last = parseInt(params[0].toBlock, 16) === head;
        return Response.json({ result: last ? [
          { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', data: '0x' + (40n * 10n ** 6n).toString(16), blockNumber: '0x1c9c37f', transactionHash: '0xbase1', logIndex: '0x3' },
          { address: '0x0000000000000000000000000000000000000bad', data: '0x' + (999n * 10n ** 6n).toString(16), blockNumber: '0x1c9c37f', transactionHash: '0xspam', logIndex: '0x4' },
        ] : [] });
      }
    }
    if (u.startsWith('https://eth.blockscout.com/api')) {
      const q = new URL(u).searchParams;
      if (q.get('action') === 'tokentx') return Response.json({ status: '1', result: [
        { hash: '0xusdc', logIndex: '7', to: ETH, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', value: '250000000', timeStamp: ts('2027-02-09T10:00:00Z') },
        { hash: '0xdust', logIndex: '8', to: ETH, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', value: '1000', timeStamp: ts('2027-02-09T10:00:00Z') },
        { hash: '0xout', logIndex: '9', to: '0x1111111111111111111111111111111111111111', contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', value: '9000000', timeStamp: ts('2027-02-09T10:00:00Z') },
        { hash: '0xfake', logIndex: '1', to: ETH, contractAddress: '0x6545b409acdd7e1be14c835b5c3b826c5d312d02', value: '845000000', timeStamp: ts('2027-02-09T10:00:00Z') },
        { hash: '0xold', logIndex: '2', to: ETH, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', value: '5000000', timeStamp: ts('2026-12-01T10:00:00Z') },
      ] });
      if (q.get('action') === 'txlist') return Response.json({ status: '1', result: [
        { hash: '0xeth', to: ETH, value: '500000000000000000', isError: '0', timeStamp: ts('2027-02-09T11:00:00Z') },
        { hash: '0xfail', to: ETH, value: '500000000000000000', isError: '1', timeStamp: ts('2027-02-09T11:00:00Z') },
      ] });
    }
    if (u.startsWith('https://api.coingecko.com/')) {
      assert.match(u, /date=09-02-2027/);
      return Response.json({ market_data: { current_price: { usd: 3000 } } });
    }
    if (u.includes('/Donations?')) return Response.json({ records: [{ id: 'r1', fields: { Reference: 'ethereum:0xusdc:7' } }] });
    if (u.endsWith('/Donations') && init.method === 'POST') { written.push(...JSON.parse(init.body).records.map((r) => r.fields)); return Response.json({ records: [] }); }
    if (u.startsWith('https://api.netlify.com/build_hooks/')) return new Response('', { status: 200 });
    throw new Error(`unexpected ${u}`);
  };
}

test('import keeps real gifts, skips dust, spam tokens, outgoing, failed and old transfers, and dedupes', async () => {
  const written = [];
  const env = { GRANTS_BASE_ID: 'appX', GRANTS_AIRTABLE_WRITE_TOKEN: 't', CRYPTO_IMPORT_FROM: '2027-01-01', NETLIFY_BUILD_HOOK_URL: 'https://api.netlify.com/build_hooks/x' };
  const result = await importCrypto({ env, now: NOW, fetchImpl: chainMock({ written }), log: { log() {}, warn() {} } });
  assert.deepEqual(result.problems, []);
  assert.deepEqual(written.map((w) => [w.Reference, w.Currency, w.Net]).sort(), [
    ['base:0xbase1:3', 'USDC', 40],
    ['ethereum:0xeth:native', 'ETH', 1500],
  ]);
  assert.ok(written.every((w) => w['Needs review'] === true));
});

test('import does nothing before the start date and without configuration', async () => {
  assert.equal((await importCrypto({ env: {} })).skipped, true);
  const r = await importCrypto({ env: { GRANTS_BASE_ID: 'a', GRANTS_AIRTABLE_WRITE_TOKEN: 't', CRYPTO_IMPORT_FROM: '2027-06-01' }, now: NOW, fetchImpl: async () => { throw new Error('no network'); } });
  assert.equal(r.added, 0);
});
