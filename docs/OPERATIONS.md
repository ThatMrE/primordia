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

## The Airtable base

Base: **Primordia Grants** (`appqAetz00yR7g8Do`), in your Airtable workspace. Tables: Grants, Updates, Cycles, Donations, Reviewers, Reviews. The seven Cohort 01 projects and the Cohort 01 cycle row are already in it.

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

## The monthly update link

Each grantee gets a link that fills in their project and hides the field:

```
https://airtable.com/appqAetz00yR7g8Do/pagBCpkHN9N4GYOx1/form?prefill_Grant+slug=open-synth&hide_Grant+slug=true
```

Change `open-synth` to the grant's Slug. The send on the 1st and the reminder on the 10th are Airtable automations. Build them from the Grants table: filter Status "In progress", send an email with the link above. The grantee email stays in the private Grantee email field.

## Publishing

- A grant appears on `/projects` when its Publish box is checked and the site builds.
- An update appears on its grant page when its Publish box is checked and the site builds.
- Add an Airtable automation "When Publish is checked" on Grants and on Updates. Its action: send a POST to the Netlify build hook. The site then updates within about two minutes.

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

- The daily import of crypto transfers to the two public addresses. Record them by hand in Donations until then, with the transaction hash as Reference.
- The Airtable automations for the monthly email, the reminder, and the build hook on Publish. They are configured in Airtable, not in this repository.
- The GitHub organization. The code owners file, templates and Dependabot are ready to move with the repository.
