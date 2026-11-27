// Renders /projects, /projects/<slug> and /donate from the content JSON into
// the build output. Pages are plain HTML in the site's own visual language.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DONORBOX, MIN_POOL, OVERHEAD_RATE, backedByGrant, budgetLabel, escapeHtml as h,
  ledgerSummary, money, monthLabel, safeUrl, updatesBySlug,
} from './site-data.mjs';

const ETH = '0xD920E60b798A2F5a8332799d8a23075c9E77d5F8';
const BASE = '0xe580BfFE2f427479483395fA6A563C07f7ad33Fc';

function page({ title, description, body, styles = [], scripts = [] }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ffffff"><title>${h(title)}</title><meta name="description" content="${h(description)}">
<link rel="icon" href="https://cdn.prod.website-files.com/698f998071bb1cd15550c6e1/699ec9b6c2b6cab7571a2c21_favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600;700&family=Karla:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles/site-pages.css"><link rel="stylesheet" href="/styles/site-footer.css">${styles.map((s) => `<link rel="stylesheet" href="${s}">`).join('')}</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="site-wordmark" href="/" aria-label="Primordia home">PRIMORDIA</a><nav aria-label="Main navigation"><a href="/projects">Projects</a><a href="/grantees">Handbook</a><a href="/donate">Donate</a><a class="nav-apply" href="/apply">Apply</a></nav></header>
<main id="main">
${body}
</main>
<footer class="section footer">
  <div class="footer-wrapper"><div class="footer-flex">
    <div class="footer-column" aria-hidden="true"></div>
    <div class="footer-column _2nd">
      <p class="footer-text">Primordia is a cross collaboration between <a href="https://valleydao.bio">ValleyDAO</a> &amp; <a href="https://biopunklab.com">Biopunk Labs</a></p>
    </div>
  </div></div>
</footer>
${scripts.map((s) => `<script src="${s}" defer></script>`).join('')}
</body></html>
`;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function grantCard(g) {
  const img = g.image ? `<img class="grant-card-image" src="${h(g.image)}" alt="${h(g.imageAlt)}" loading="lazy" width="640" height="400">` : '<div class="grant-card-image grant-card-image--blank" aria-hidden="true"></div>';
  return `<li class="grant-card">
  <a class="grant-card-link" href="/projects/${h(g.slug)}">
    ${img}
    <div class="grant-card-body">
      <p class="grant-card-field">${h(g.field)}</p>
      <h3>${h(g.title)}</h3>
      <p class="grant-card-meta">${h(g.grantee)} · ${h(g.location)}</p>
      <p class="grant-card-summary">${h(g.summary)}</p>
      <p class="grant-card-foot"><span>${h(budgetLabel(g))}</span><span class="grant-status">${h(g.status)}</span></p>
    </div>
  </a>
</li>`;
}

export function renderProjects({ grants, ledger }) {
  const summary = ledgerSummary(ledger);
  const cycles = [...new Set(grants.map((g) => g.cycle || 'Other'))];
  const groups = cycles.map((c) => `<section class="grant-group" aria-labelledby="cycle-${h(slugify(c))}">
  <h2 id="cycle-${h(slugify(c))}">${h(c)}</h2>
  <ul class="grant-grid">${grants.filter((g) => (g.cycle || 'Other') === c).map(grantCard).join('\n')}</ul>
</section>`).join('\n');
  const body = `<section class="data-hero wrap" aria-labelledby="projects-title">
  <h1 id="projects-title">Funded projects</h1>
  <p class="lede">Every experiment Primordia funds, with its budget and its monthly progress. This page updates from the grant records each time the site builds.</p>
  <dl class="stat-row">
    <div><dt>Projects funded</dt><dd>${grants.length}</dd></div>
    <div><dt>Awarded to date</dt><dd>${money(summary.paidOut)}</dd></div>
    <div><dt>Funding rate</dt><dd>${summary.fundingRate == null ? '' : `${(summary.fundingRate * 100).toFixed(1)}%`}</dd></div>
    <div><dt>Applications reviewed</dt><dd>${summary.applications}</dd></div>
  </dl>
</section>
<div class="wrap">${groups}</div>
<section class="data-cta wrap" aria-labelledby="projects-next">
  <h2 id="projects-next">Fund the next one</h2>
  <p>Primordia decides grants every month. Gifts this month set next month's pool.</p>
  <p><a class="btn btn--signal" href="/donate">Donate to the monthly pool</a></p>
</section>`;
  return page({ title: 'Funded projects — Primordia Grants', description: `${plural(grants.length, 'experiment', 'experiments')} funded by Primordia, with budgets and monthly progress.`, body, styles: ['/styles/data-pages.css'] });
}

export function renderGrant(g, { updates, backed }) {
  const campaign = safeUrl(g.donateUrl);
  const donate = campaign || DEFAULT_DONORBOX;
  const latestSpend = updates.find((u) => u.spendToDate != null)?.spendToDate ?? null;
  const spendBar = latestSpend != null && g.budget ? `<div class="spend">
    <p><strong>${money(latestSpend)}</strong> spent of ${money(g.budget)} budget</p>
    <div class="spend-track" role="img" aria-label="${Math.round((latestSpend / g.budget) * 100)} percent of the budget spent"><div class="spend-fill" style="width:${Math.min(100, Math.round((latestSpend / g.budget) * 100))}%"></div></div>
  </div>` : '';
  const timeline = updates.length ? `<ol class="timeline">${updates.map((u) => {
    const link = safeUrl(u.link);
    return `<li class="timeline-item">
      <p class="timeline-month">${h(monthLabel(u.month))}${u.final ? ' · Final report' : ''}</p>
      <h3>${h(u.headline || 'Monthly update')}</h3>
      ${u.photo ? `<img class="timeline-photo" src="${h(u.photo)}" alt="Photo from the ${h(monthLabel(u.month))} update" loading="lazy">` : ''}
      ${u.did ? `<p><strong>What we did.</strong> ${h(u.did)}</p>` : ''}
      ${u.saw ? `<p><strong>What we saw.</strong> ${h(u.saw)}</p>` : ''}
      ${u.changed ? `<p><strong>What changed.</strong> ${h(u.changed)}</p>` : ''}
      ${link ? `<p><a href="${h(link)}" rel="noopener">Read the output</a></p>` : ''}
    </li>`;
  }).join('\n')}</ol>` : `<p class="empty-note">Monthly updates from the grantee appear here after the Primordia team reviews them.</p>`;
  const body = `<article class="grant-page wrap">
  <p class="crumb"><a href="/projects">All projects</a></p>
  <header class="grant-head">
    <div>
      <p class="grant-card-field">${h(g.field)}</p>
      <h1>${h(g.title)}</h1>
      <p class="lede">${h(g.summary)}</p>
      <p><a class="btn btn--signal" href="${h(donate)}" rel="noopener">${campaign ? 'Back this project' : 'Donate to the monthly pool'}</a></p>
      ${backed ? `<p class="note">${money(backed)} given to this project by donors so far.</p>` : ''}
    </div>
    ${g.image ? `<img class="grant-hero-image" src="${h(g.image)}" alt="${h(g.imageAlt)}" width="640" height="480">` : ''}
  </header>
  <dl class="fact-list">
    <div><dt>Grantee</dt><dd>${h(g.grantee)}</dd></div>
    <div><dt>Location</dt><dd>${h(g.location)}</dd></div>
    <div><dt>Budget</dt><dd>${h(budgetLabel(g))}</dd></div>
    <div><dt>Cycle</dt><dd>${h(g.cycle)}</dd></div>
    <div><dt>Status</dt><dd>${h(g.status)}</dd></div>
  </dl>
  ${spendBar}
  <section class="grant-updates" aria-labelledby="updates-title">
    <h2 id="updates-title">Progress</h2>
    ${timeline}
  </section>
</article>`;
  return page({ title: `${g.title} — Primordia Grants`, description: g.summary, body, styles: ['/styles/data-pages.css'] });
}

export function renderDonate({ grants, ledger }, today = new Date()) {
  const s = ledgerSummary(ledger, today);
  const hasGifts = ledger.donations.length > 0;
  const pct = Math.min(100, Math.round((s.pool.collected / MIN_POOL) * 100));
  const meter = hasGifts ? `<div class="pool">
    <p class="pool-label">Pool for ${h(s.pool.month)}</p>
    <p class="pool-amount"><strong>${money(s.pool.collected)}</strong> of the ${money(MIN_POOL)} needed to run the cycle</p>
    <div class="spend-track" role="img" aria-label="${pct} percent of the minimum pool"><div class="spend-fill" style="width:${pct}%"></div></div>
  </div>` : `<div class="pool">
    <p class="pool-label">Monthly pool</p>
    <p class="pool-amount">Live totals start with the first monthly cycle in January 2027.</p>
  </div>`;
  const cycleRows = ledger.cycles.map((c) => `<tr><th scope="row">${h(c.name)}</th><td>${c.applications ?? ''}</td><td>${c.funded ?? ''}</td><td>${money(c.paidOut)}</td><td>${c.medianDays ?? ''}</td></tr>`).join('');
  const monthRows = s.months.map((m) => `<tr><th scope="row">${h(monthLabel(m.month + '-01'))}</th><td>${m.gifts}</td><td>${money(m.gross, { cents: true })}</td><td>${money(m.fees, { cents: true })}</td><td>${money(m.net, { cents: true })}</td></tr>`).join('');
  const backed = backedByGrant(ledger.donations);
  const body = `<section class="data-hero wrap" aria-labelledby="donate-title">
  <h1 id="donate-title">Fund the next experiment</h1>
  <p class="lede">Primordia gives grants of up to $3,000 every month. Gifts this month set next month's pool. Every dollar in and out is on this page.</p>
  ${meter}
</section>
<section class="donate-main wrap" aria-labelledby="give-title">
  <div class="donate-form">
    <h2 id="give-title">Give by card or bank</h2>
    <p>A monthly gift keeps the cycle steady. $250 a month funds one experiment a year.</p>
    <iframe class="donorbox" src="https://donorbox.org/embed/primordia-microgrants" title="Donation form for Primordia microgrants" loading="lazy" allowpaymentrequest="allowpaymentrequest" seamless="seamless"></iframe>
    <p class="note">The form is run by Donorbox. If it does not load, <a href="${DEFAULT_DONORBOX}" rel="noopener">give on Donorbox directly</a>.</p>
  </div>
  <div class="donate-steps">
    <h2>Where your gift goes</h2>
    <ol class="steps">
      <li><strong>All month.</strong> Gifts collect in the pool. Applications stay open.</li>
      <li><strong>On the 1st.</strong> The pool is set: last month's gifts less the ${Math.round(OVERHEAD_RATE * 100)}% overhead.</li>
      <li><strong>By the 7th.</strong> Two reviewers and the panel decide. Every applicant hears back.</li>
      <li><strong>By the 10th.</strong> Grants are paid and each new project gets a public page.</li>
      <li><strong>Every month after.</strong> Grantees post progress on their page.</li>
    </ol>
  </div>
</section>
<section class="ledger wrap" aria-labelledby="ledger-title">
  <h2 id="ledger-title">Open ledger</h2>
  <p>These tables build from the same records that run the program. Nobody types the totals.</p>
  <h3>Money out, by cycle</h3>
  <div class="table-wrap"><table>
    <thead><tr><th scope="col">Cycle</th><th scope="col">Applications</th><th scope="col">Funded</th><th scope="col">Paid out</th><th scope="col">Median days to decision</th></tr></thead>
    <tbody>${cycleRows}</tbody>
  </table></div>
  <h3>Money in, by month</h3>
  ${monthRows ? `<div class="table-wrap"><table>
    <thead><tr><th scope="col">Month</th><th scope="col">Gifts</th><th scope="col">Given</th><th scope="col">Card fees</th><th scope="col">To the pool</th></tr></thead>
    <tbody>${monthRows}</tbody>
  </table></div>
  <p class="note">Overhead is ${Math.round(OVERHEAD_RATE * 100)}% of what reaches the pool: ${money(s.overhead, { cents: true })} to date.</p>` : '<p class="empty-note">Monthly totals of gifts start with the first monthly cycle in January 2027. Cohort 01 was funded before this ledger existed.</p>'}
  ${s.supporters.length ? `<h3>Supporters who asked to be listed</h3><p>${s.supporters.map(h).join(', ')}</p>` : ''}
</section>
<section class="back-grant wrap" aria-labelledby="back-title">
  <h2 id="back-title">Back one project</h2>
  <p>Open a project to read its plan and progress. A project with its own campaign takes gifts directly. Money above its budget flows to the monthly pool.</p>
  <ul class="back-list">${grants.map((g) => `<li><a href="/projects/${h(g.slug)}">${h(g.title)}</a><span>${h(g.grantee)}${backed[g.slug] ? ` · ${money(backed[g.slug])} backed` : ''}</span></li>`).join('')}</ul>
</section>
<section class="crypto wrap" aria-labelledby="crypto-title">
  <h2 id="crypto-title">Give in crypto</h2>
  <p>ETH, USDC and USDT, on Ethereum mainnet or Base.</p>
  <div class="chain"><p class="lbl">Ethereum mainnet</p><div class="addr"><span id="eth">${ETH}</span><button class="copy" data-target="eth" type="button">Copy</button></div></div>
  <div class="chain"><p class="lbl">Base</p><div class="addr"><span id="base">${BASE}</span><button class="copy" data-target="base" type="button">Copy</button></div></div>
</section>`;
  return page({ title: 'Donate — Primordia Grants', description: 'Fund early biology experiments every month. Open ledger of every dollar in and out.', body, styles: ['/styles/data-pages.css'], scripts: ['/scripts/site-pages.js'] });
}

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function renderSite(outDir, { grants, updates, ledger }) {
  const byGrant = updatesBySlug(updates);
  const backed = backedByGrant(ledger.donations || []);
  await mkdir(path.join(outDir, 'projects'), { recursive: true });
  await writeFile(path.join(outDir, 'projects.html'), renderProjects({ grants, ledger }));
  for (const g of grants) await writeFile(path.join(outDir, 'projects', `${g.slug}.html`), renderGrant(g, { updates: byGrant[g.slug] || [], backed: backed[g.slug] || 0 }));
  await writeFile(path.join(outDir, 'donate.html'), renderDonate({ grants, ledger }));
  return { pages: grants.length + 2 };
}
