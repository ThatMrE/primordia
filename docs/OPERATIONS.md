# Operations: grants, updates, donations and review

This guide covers the live setup and the monthly routine. The plan behind it is in `docs/plan/`.

## What is built

| Page or job | What it does | Data source |
|---|---|---|
| `/projects` | Lists every published grant with budget and status. | Grants table |
| `/projects/<slug>` | One grant: summary, facts, a donate button, and the monthly update timeline. | Grants and Updates tables |
| `/donate` | Donorbox form, pool meter, open ledger, back-a-project list, crypto addresses. | Cycles and Donations tables |
| `/review` | Panel deck: AI-ranked swipe review. Button to assign community reviewers. | Applications table |
| `/review/community` | Former applicants score assigned applications on seven criteria. | Reviewers and Reviews tables |
| `donorbox-sync` (hourly) | Pulls new Donorbox gifts into the Donations table. | Donorbox API |
| `donorbox-webhook` | Donorbox calls it after each gift. It starts the same pull at once. | Donorbox API |
| `crypto-import` (daily) | Adds new gifts to the two public addresses to the Donations table, marked Needs review. | Blockscout (Ethereum), public Base node, CoinGecko price |

## The Airtable base

Base: **Primordia Grants** (`appqAetz00yR7g8Do`), in your Airtable workspace. Tables: Grants, Updates, Cycles, Donations, Reviewers, Reviews, Settings. The seven Cohort 01 projects and the Cohort 01 cycle row are already in it.

Applications stay where they are today. The review deck reads them through `AIRTABLE_BASE_ID` and `AIRTABLE_TABLE_ID`.

## Netlify settings

Set these in Netlify, Site configuration, Environment variables. Never put a value in the repository or in chat.

| Variable | Scope | Value |
|---|---|---|
| `GRANTS_BASE_ID` | Builds, Functions | `appqAetz00yR7g8Do` |
| `GRANTS_AIRTABLE_TOKEN` | Builds | Airtable token with `data.records:read` on the Primordia Grants base only |
| `GRANTS_AIRTABLE_WRITE_TOKEN` | Functions | Airtable token with `data.records:read` and `data.records:write` on the Primordia Grants base only |
| `DONORBOX_EMAIL` | Functions | The Donorbox organization login email |
| `DONORBOX_API_KEY` | Functions | From Donorbox, API and Zapier add-on |
| `DONORBOX_WEBHOOK_TOKEN` | Functions | A long random string you make |
| `NETLIFY_BUILD_HOOK_URL` | Functions | A build hook for `main`, from Netlify, Build and deploy, Build hooks |
| `COMMUNITY_CYCLE` | Functions | The open cycle, for example `2027-01` |
| `CRYPTO_IMPORT_FROM` | Functions | First day the crypto import reads, for example `2027-01-01`. Default `2027-01-01`. |
| `ETH_RPC_URL`, `BASE_RPC_URL` | Functions | Optional. A private node URL if the free public nodes stop answering. |
| `COMMUNITY_SCORES_VISIBLE` | Functions | Leave unset during the pilot. Set to `true` after the go decision. |
| `REVIEW_ACCESS_KEY`, `AIRTABLE_*`, `ANTHROPIC_API_KEY` | Functions | As in `docs/REVIEW-DECK.md` |

## First-time setup, about 45 minutes

1. Create the two Airtable tokens above at airtable.com/create/tokens. Limit each to the Primordia Grants base.
2. In Donorbox, turn on the API and Zapier add-on. Copy the API key.
3. In Donorbox, add a custom webhook to this URL, with your token at the end:

   ```
   https://primordiagrants.com/.netlify/functions/donorbox-webhook?token=YOUR_DONORBOX_WEBHOOK_TOKEN
   ```

4. In Donorbox, add a checkbox question "List me as a supporter" to the form. Only donors who tick it appear by name.
5. In Netlify, create a build hook on `main`. Add all variables above. Redeploy.
6. Open the Primordia monthly update form in Airtable and publish it: https://airtable.com/appqAetz00yR7g8Do/pagBCpkHN9N4GYOx1/edit

## Airtable automations

Five automations exist in the base as drafts. Airtable keeps a new automation off until a person turns it on. Open each one, press Test, then turn it on.

| Automation | When | What it does |
|---|---|---|
| Monthly update request | The 1st, 15:00 UTC | Emails each grantee whose grant Status is In progress and who has a Grantee email. The email has their prefilled update form link. |
| Monthly update reminder | The 10th, 15:00 UTC | Emails the same grantees again if Updated this month is 0. |
| Stamp last update on the grant | A new Updates row | Sets Last update on the grant with the same Slug. The reminder uses it. |
| Rebuild site when a grant is published | Publish checked on Grants | Calls the build hook in the Settings table. |
| Rebuild site when an update is published | Publish checked on Updates | Calls the build hook in the Settings table. |

Before you turn them on:

1. Publish the update form. The emails link to it.
2. Paste the Netlify build hook URL into the Settings table, row "Netlify build hook URL".
3. Set Status to In progress and fill Grantee email on each active grant. Only those grantees get email.

Each grantee's link fills in their project and hides the field:

```
https://airtable.com/appqAetz00yR7g8Do/pagBCpkHN9N4GYOx1/form?prefill_Grant+slug=open-synth&hide_Grant+slug=true
```

## Crypto gifts

The daily import reads new transfers to the two public addresses from `CRYPTO_IMPORT_FROM` on.

| Chain | Read | Not read |
|---|---|---|
| Ethereum | USDC, USDT, DAI, plain ETH | Any other token |
| Base | USDC, USDbC | Plain ETH, any other token |

- Transfers under $1 are skipped. Unknown tokens are skipped, because spam airdrops use look-alike names.
- Plain ETH is valued at the CoinGecko price on the day received.
- Every imported row has **Needs review** checked. The website ignores it until a person confirms it is a gift and unchecks the box. Delete rows that are not gifts.
- Rows of $5,000 or more carry a "Large transfer" note.

**Important.** The Ethereum address also receives large transfers that are not gifts: $50,000 USDC on 2026-10-08 and $234,032 USDC on 2026-11-24. If the address is a shared treasury, give Primordia its own donation addresses. Change them in `scripts/site-data.mjs`, in `CRYPTO_ADDRESSES`.

## The monthly routine

| Day | Who | Task |
|---|---|---|
| Last day | Program lead | Set `COMMUNITY_CYCLE` to the next month. |
| 1 | Program lead | Add a Cycles row: Opened, Pool. Open `/review`, press "Score and rank with AI". |
| 1 | Program lead | Press "Assign community reviewers". Send each reviewer their key and the link `/review/community`. |
| 2 to 5 | Reviewers | Work the deck. Community reviewers score their assignments. |
| 6 | Panel | 45-minute call for the middle band only. |
| 7 | Program lead | Decisions out. Fill Decided on and Median days to decision on the Cycles row. |
| 7 to 10 | Finance | Payouts with two-person approval. Fill Paid on and Paid out. Add a Grants row per new grant, check Publish. |
| 10 | Comms | The site shows the new projects and the ledger. Post the cycle note. |

## Community reviewer keys

1. Make a random key per reviewer, at least 16 characters.
2. Store its SHA-256 hash in the Reviewers table, Key hash field. Never store the key itself.

   ```bash
   printf '%s' 'THE-KEY' | shasum -a 256
   ```

3. Check Active. Send the key to the reviewer by email, with the link `/review/community`.

## What is not built yet

- Plain ETH gifts on Base. Record them by hand in Donations, with the transaction hash as Reference.
- The GitHub organization. The code owners file, templates and Dependabot are ready to move with the repository.
