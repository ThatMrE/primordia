// Daily import of gifts to the two public crypto addresses into the Airtable
// Donations table. Reads chain data only: no keys, no wallet access.
//
// What it reads:
//   Ethereum: USDC, USDT and DAI transfers and plain ETH, from the Blockscout
//   explorer API (the free public node serves only about one day of logs).
//   Base: USDC and USDbC transfers, from node logs. Plain ETH on Base is not
//   read: no free source was reachable. Record those by hand.
// Only transfers on or after CRYPTO_IMPORT_FROM are imported, so the older
// history of the Ethereum address never enters the ledger.
import { CRYPTO_ADDRESSES } from './site-data.mjs';
import { existingReferences } from './donorbox.mjs';

const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const r2 = (v) => Math.round(v * 100) / 100;

export const CHAINS = {
  ethereum: {
    source: 'Ethereum',
    rpc: 'https://ethereum-rpc.publicnode.com',
    rpcEnv: 'ETH_RPC_URL',
    blockSeconds: 12,
    explorer: 'https://eth.blockscout.com/api',
    tokens: {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
      '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },
    },
  },
  base: {
    source: 'Base',
    rpc: 'https://base-rpc.publicnode.com',
    rpcEnv: 'BASE_RPC_URL',
    blockSeconds: 2,
    chunk: 10000,
    explorer: null,
    tokens: {
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
      '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': { symbol: 'USDbC', decimals: 6 },
    },
  },
};

/** Integer token units to a decimal number, without floating-point loss on large values. */
export function units(raw, decimals) {
  const v = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  return Number(v / base) + Number(v % base) / Number(base);
}

const topicFor = (address) => '0x' + '0'.repeat(24) + address.toLowerCase().slice(2);
const isoDate = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

async function rpc(url, method, params, fetchImpl) {
  const res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  if (!res.ok) throw new Error(`${method}: node answered ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message || 'node error'}`);
  return body.result;
}

/** First block at or after `sinceSec`, estimated from the head block and the block time. */
async function startBlock(chainKey, { sinceSec, rpcUrl, fetchImpl }) {
  const chain = CHAINS[chainKey];
  const url = rpcUrl || chain.rpc;
  const head = parseInt(await rpc(url, 'eth_blockNumber', [], fetchImpl), 16);
  const headTs = parseInt((await rpc(url, 'eth_getBlockByNumber', ['0x' + head.toString(16), false], fetchImpl)).timestamp, 16);
  const span = Math.ceil(((headTs - sinceSec) / chain.blockSeconds) * 1.2) + 10;
  return { head, from: Math.max(0, head - span), url };
}

/** Base: stablecoin transfers into the Base address since `sinceSec`, from node logs. */
export async function baseTransfers({ sinceSec, rpcUrl, fetchImpl = fetch }) {
  const chain = CHAINS.base;
  const { head, from, url } = await startBlock('base', { sinceSec, rpcUrl, fetchImpl });
  const logs = [];
  for (let start = from; start <= head; start += chain.chunk) {
    const end = Math.min(head, start + chain.chunk - 1);
    logs.push(...await rpc(url, 'eth_getLogs', [{
      fromBlock: '0x' + start.toString(16), toBlock: '0x' + end.toString(16),
      address: Object.keys(chain.tokens), topics: [TRANSFER, null, topicFor(CRYPTO_ADDRESSES.base)],
    }], fetchImpl));
  }
  const times = new Map();
  const out = [];
  for (const log of logs) {
    const token = chain.tokens[String(log.address).toLowerCase()];
    if (!token) continue;
    if (!times.has(log.blockNumber)) times.set(log.blockNumber, parseInt((await rpc(url, 'eth_getBlockByNumber', [log.blockNumber, false], fetchImpl)).timestamp, 16));
    const ts = times.get(log.blockNumber);
    if (ts < sinceSec) continue;
    const amount = units(log.data, token.decimals);
    out.push({ reference: `base:${log.transactionHash}:${parseInt(log.logIndex, 16)}`, date: isoDate(ts), source: 'Base', currency: token.symbol, amount, usd: amount });
  }
  return out;
}

async function blockscoutAll(params, fetchImpl) {
  const rows = [];
  for (let page = 1; page <= 20; page++) {
    const q = new URLSearchParams({ ...params, sort: 'asc', page: String(page), offset: '100' });
    const res = await fetchImpl(`${CHAINS.ethereum.explorer}?${q}`);
    if (!res.ok) throw new Error(`Blockscout answered ${res.status}`);
    const body = await res.json();
    const batch = Array.isArray(body.result) ? body.result : [];
    rows.push(...batch);
    if (batch.length < 100) break;
  }
  return rows;
}

/** Ethereum: stablecoins and plain ETH into the Ethereum address since `sinceSec`, from Blockscout. */
export async function ethereumTransfers({ sinceSec, rpcUrl, fetchImpl = fetch }) {
  const address = CRYPTO_ADDRESSES.ethereum.toLowerCase();
  const { from } = await startBlock('ethereum', { sinceSec, rpcUrl, fetchImpl });
  const tokens = CHAINS.ethereum.tokens;
  const out = [];
  for (const t of await blockscoutAll({ module: 'account', action: 'tokentx', address, startblock: String(from) }, fetchImpl)) {
    const token = tokens[String(t.contractAddress).toLowerCase()];
    if (!token || String(t.to).toLowerCase() !== address || Number(t.timeStamp) < sinceSec) continue;
    const amount = units(t.value, token.decimals);
    out.push({ reference: `ethereum:${t.hash}:${t.logIndex ?? t.transactionIndex}`, date: isoDate(Number(t.timeStamp)), source: 'Ethereum', currency: token.symbol, amount, usd: amount });
  }
  for (const t of await blockscoutAll({ module: 'account', action: 'txlist', address, startblock: String(from) }, fetchImpl)) {
    if (String(t.to).toLowerCase() !== address || BigInt(t.value || '0') === 0n || t.isError !== '0' || Number(t.timeStamp) < sinceSec) continue;
    out.push({ reference: `ethereum:${t.hash}:native`, date: isoDate(Number(t.timeStamp)), source: 'Ethereum', currency: 'ETH', amount: units(t.value, 18), usd: null });
  }
  return out;
}

/** ETH price in US dollars on a given day, from CoinGecko. Cached per day. */
export async function ethPriceOn(date, cache, fetchImpl = fetch) {
  if (cache.has(date)) return cache.get(date);
  const [y, m, d] = date.split('-');
  const res = await fetchImpl(`https://api.coingecko.com/api/v3/coins/ethereum/history?date=${d}-${m}-${y}&localization=false`);
  const price = res.ok ? (await res.json())?.market_data?.current_price?.usd ?? null : null;
  cache.set(date, price);
  return price;
}

export const LARGE_TRANSFER_USD = 5000;

// The public addresses also receive treasury movements, so every imported
// transfer waits for a person to confirm it is a gift before the site counts it.
export function donationRow(t) {
  const large = t.usd >= LARGE_TRANSFER_USD;
  const amount = t.currency === 'ETH' ? `${t.amount.toFixed(6)} ETH` : `${t.amount} ${t.currency}`;
  return {
    Reference: t.reference, Date: t.date, Source: t.source, Campaign: 'Crypto',
    Gross: r2(t.usd), Fees: 0, Net: r2(t.usd), Currency: t.currency, Recurring: false,
    'Needs review': true,
    'Review note': `${large ? 'Large transfer. Check that this is a gift and not a treasury movement. ' : ''}Imported from chain: ${amount}. Confirm it is a gift to Primordia, then uncheck Needs review. Delete the row if it is not a gift.`,
  };
}

export async function importCrypto({ env = process.env, days = 3, now = Date.now(), fetchImpl = fetch, log = console } = {}) {
  const missing = ['GRANTS_BASE_ID', 'GRANTS_AIRTABLE_WRITE_TOKEN'].filter((k) => !(env[k] || '').trim());
  if (missing.length) return { ok: false, skipped: true, missing };
  const floor = Date.parse(`${(env.CRYPTO_IMPORT_FROM || '2027-01-01').trim()}T00:00:00Z`);
  const sinceSec = Math.floor(Math.max(now - days * 864e5, floor) / 1000);
  if (sinceSec * 1000 > now) return { ok: true, added: 0, note: 'Import starts on CRYPTO_IMPORT_FROM.' };
  const found = [];
  const problems = [];
  for (const [key, read] of [['ethereum', ethereumTransfers], ['base', baseTransfers]]) {
    try {
      found.push(...await read({ sinceSec, rpcUrl: env[CHAINS[key].rpcEnv], fetchImpl }));
    } catch (error) {
      problems.push(`${key}: ${error.message}`);
    }
  }
  const prices = new Map();
  for (const t of found) if (t.usd == null) {
    const price = await ethPriceOn(t.date, prices, fetchImpl);
    t.usd = price == null ? null : t.amount * price;
  }
  const valued = found.filter((t) => t.usd != null && t.usd >= 1);
  const unpriced = found.filter((t) => t.usd == null).length;
  const have = await existingReferences({ base: env.GRANTS_BASE_ID, token: env.GRANTS_AIRTABLE_WRITE_TOKEN, fetchImpl });
  const fresh = valued.filter((t) => !have.has(t.reference)).map(donationRow);
  for (let i = 0; i < fresh.length; i += 10) {
    const res = await fetchImpl(`https://api.airtable.com/v0/${env.GRANTS_BASE_ID}/Donations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.GRANTS_AIRTABLE_WRITE_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ records: fresh.slice(i, i + 10).map((fields) => ({ fields })), typecast: true }),
    });
    if (!res.ok) throw new Error(`Airtable write ${res.status}`);
  }
  for (const f of fresh) log.log(`Crypto gift added: ${f.Reference} ${f.Date} ${f.Currency} $${f.Net}`);
  if (unpriced) log.warn(`${unpriced} ETH gifts had no price. The next run retries them.`);
  for (const p of problems) log.warn(`Crypto import problem: ${p}`);
  if (fresh.length && (env.NETLIFY_BUILD_HOOK_URL || '').startsWith('https://')) await fetchImpl(env.NETLIFY_BUILD_HOOK_URL, { method: 'POST' });
  return { ok: problems.length === 0, found: found.length, added: fresh.length, unpriced, problems };
}
