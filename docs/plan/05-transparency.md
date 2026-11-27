# 05. Transparency by construction

Status: draft for critique. Estimate: 3 days. Depends on 02.

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

## How the numbers arrive

1. Donorbox webhook creates a Donations row per gift (amount, date, recurring or one-time, designated grant). Donor name stays in Donorbox.
2. A daily automation reads the two public addresses through a block explorer API and creates Donations rows for new transfers, with the transaction hash as reference.
3. Payouts are entered by the finance lead with a reference, and the Grants row gets "Paid on".
4. `sync-airtable.mjs` (02) writes `ledger.json` and `cycles.json`. The build renders the pages and a small chart per table.
5. Each monthly tag `cycle-YYYY-MM` freezes the JSON in git, so the history of every number is auditable by anyone who can read a diff.

## Deliverables

- [ ] Donations table with Donorbox webhook and on-chain import.
- [ ] `/transparency` page in the site's visual language, with plain tables and one bar chart per section. Text at 18px or larger.
- [ ] Cycle note template rendered from `cycles.json`.
- [ ] A short "How we count" section: overhead definition, what counts as paid, which currencies and the exchange rate rule.
- [ ] Privacy check: a test asserts that no field from Applications appears in any generated JSON.

## Risks

- Crypto price swings make dollar totals move. Rule: value at the day received, stated on the page.
- Publishing reviewer names may deter reviewers. Opt-in only.

## Decisions

(filled after critique)
