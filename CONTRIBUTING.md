# Contributing to the Primordia website

Primordia funds the first decisive biology experiment, every month. This repository holds the public site and the grant tools behind it. People and AI agents both contribute here. The same rules apply to both.

## Start

1. Find or open an issue. Use a template: bug, content change, cycle task, or plan critique.
2. Make a branch from `main`. Name it `type/short-name`, for example `fix/donate-overflow`.
3. Install and check:

   ```bash
   npm ci
   npm run build && npm test && npm run check
   npm run smoke
   ```

4. Open a draft pull request. Fill in the template. Link the issue.
5. Look at the Netlify deploy preview. Mark the pull request ready when the preview is right.

## Rules

- `main` deploys to primordiagrants.com. Nothing merges without review and green checks.
- A change to `netlify/functions/`, the Airtable sync, Donorbox, or anything that touches applicant data or money needs two maintainer approvals.
- Never commit a key, a token, or applicant data. Secrets live in Netlify environment variables.
- Agents work on branches only. Agents never merge and never hold secrets.
- Follow `AGENTS.md` for design: white surfaces, Karla body text, Jost headings, no text under 14px.

## Where things live

| Path | What |
|---|---|
| `content/*.json` | Public data. The build replaces it from Airtable when the keys are set. |
| `scripts/sync-airtable.mjs` | Reads the Primordia Grants base at build time. |
| `scripts/render-pages.mjs` | Builds `/projects`, each grant page, and `/donate`. |
| `netlify/functions/review-api.mjs` | Review deck and community review API. |
| `netlify/functions/donorbox-*.mjs` | Donorbox pull into the Donations table. |
| `docs/plan/` | The 2027 plan, one file per workstream. |
| `docs/REVIEW-DECK.md`, `docs/OPERATIONS.md` | Setup and monthly operation. |
