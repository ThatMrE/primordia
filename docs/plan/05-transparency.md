# 05. Transparency by construction

Status: built. `/donate` shows the open ledger. The Donorbox hourly pull and webhook exist. Waiting on: Donorbox API add-on, keys in Netlify. Crypto import not built.

## Outcome

Anyone can see, without asking, how much came in, how much went out, to whom, how long decisions took, and what the overhead was. The numbers come from the same tables that run the program, so they are never stale and never hand-typed.

## What is public

| Page | Numbers | Source |
|---|---|---|
| `/transparency` | Money in by month and source. Money out by grant. Overhead at 5%. Balance carried into next cycle. | Donations table, Grants table |
| `/transparency` | Applications per cycle, funded per cycle, funding rate, median days to decision, median days to payout | Cycles table |
| `/grants/<slug>` | Amount, paid on, spend to date, update dates | Grants and Updates |
| `/updates` | Every published monthly update | Updates |
| Each cycle note | Who reviewed (names of panel members who opt in), how many "fund now" fast-lane grants, whether a draw happened | Cycles |

What stays private: applicant names and answers for declined applications, reviewer notes, AI scores, bank details, donor identities unless the donor opts in.

## Donorbox integration

Donorbox stays the card and bank rail. It has an API (Campaigns, Donations, Donors, Plans) and signed webhooks to a custom URL. Webhooks and the API need the "Zapier and API" add-on ($17 a month) or the Premium plan. [Donorbox API](https://github.com/donorbox/donorbox-api), [custom webhooks](https://donorbox.zendesk.com/hc/en-us/articles/4733681068820-Custom-Webhooks), [signature header](https://donorbox.zendesk.com/hc/en-us/articles/17982194843028)

1. **Webhook.** Donorbox posts each gift to `netlify/functions/donorbox-webhook.mjs`. The function checks the `Donorbox-Signature` header and the timestamp, then creates one Donations row: amount, currency, date, campaign, recurring or one-time, designated grant, fee, and the Donorbox donation id. The id is the dedupe key. A duplicate post changes nothing.
2. **Nightly reconciliation.** A Netlify scheduled function reads the Donations endpoint for the last 48 hours and adds any gift the webhook missed. It logs each gift it adds, so a missed webhook is visible.
3. **One campaign per purpose.** "Monthly pool" is the default campaign. Each themed round gets its own campaign. Each published grant gets a "Back this grant" campaign, created by hand at publish time until the API can create campaigns. The Grants table stores the campaign id and form URL.
4. **Pool meter.** `/fund-experiments` shows next month's pool from `ledger.json`, not from Donorbox. One number drives the site and the cycle.
5. **Donor privacy.** Donor name and email stay in Donorbox. The webhook stores neither. A donor who ticks "List me as a supporter" on the form appears on `/transparency` by first name and last initial.
6. **Recurring donors.** Add a "Fund one experiment a month" plan at $250. Donors change or cancel in the Donorbox donor portal. The ledger counts active plans each month from the Plans endpoint.

What each gift shows on `/transparency`: gross amount, Donorbox and Stripe fees, net to the pool, and its share of the 5% overhead. Each sits on its own line, so a donor can check the arithmetic.

Open fact to confirm with Donorbox support: can a form preselect a grant by URL parameter? If yes, one "Back a grant" campaign with a designation field replaces one campaign per grant.

## How the numbers arrive

1. The Donorbox webhook and nightly reconciliation above create the card and bank rows.
2. A daily automation reads the two public addresses through a block explorer API and creates Donations rows for new transfers, with the transaction hash as reference.
3. Payouts are entered by the finance lead with a reference, and the Grants row gets "Paid on".
4. `sync-airtable.mjs` (02) writes `ledger.json` and `cycles.json`. The build renders the pages and a small chart per table.
5. Each monthly tag `cycle-YYYY-MM` freezes the JSON in git, so the history of every number is auditable by anyone who can read a diff.

## Deliverables

- [ ] Donorbox "Zapier and API" add-on enabled. Webhook secret and API key stored in Netlify, production context only.
- [ ] `donorbox-webhook.mjs` with signature check, dedupe by donation id, and tests on recorded sample payloads.
- [ ] Nightly reconciliation function with a log line per recovered gift.
- [ ] "Monthly pool" campaign, "Fund one experiment a month" plan, and the "List me as a supporter" field on the form.
- [ ] Donations table with on-chain import for the two public addresses.
- [ ] `/transparency` page in the site's visual language, with plain tables and one bar chart per section. Text at 18px or larger.
- [ ] Cycle note template rendered from `cycles.json`.
- [ ] A short "How we count" section: overhead definition, what counts as paid, which currencies and the exchange rate rule.
- [ ] Privacy check: a test asserts that no field from Applications appears in any generated JSON.

## Risks

- Crypto price swings make dollar totals move. Rule: value at the day received, stated on the page.
- Publishing reviewer names may deter reviewers. Opt-in only.

## Decisions

(filled after critique)
