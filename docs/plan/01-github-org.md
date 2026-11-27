# 01. GitHub organization and delivery pipeline

Status: in progress. Done in the repository: CODEOWNERS, PR and issue templates, Dependabot, CONTRIBUTING. Waiting on Elliot: create the organization and name two more maintainers.

## Outcome

Several people and several agents change the website and the grant tooling without breaking production. Every change is reviewed, tested, previewed and recorded.

## Structure

| Piece | Decision |
|---|---|
| Organization | `primordia-grants` on GitHub. Elliot owns it. Two owners minimum (Elliot plus one Biopunk Lab or ValleyDAO maintainer). |
| Repositories | `website` (this repository, transferred so history and PRs survive). `grant-ops` (Airtable sync scripts, automations, agent skills, runbooks). `.github` (organization profile, shared workflows, issue and PR templates). |
| Teams | `maintainers` (merge rights), `reviewers` (review rights, no merge), `contributors` (write to branches, no merge), `agents` (machine accounts, write to branches only). |
| Agent accounts | One GitHub machine user per agent runtime with a fine-grained token scoped to one repository, contents and pull requests only. Agents never hold merge rights or secrets. |
| Default branch | `main` deploys to production. `staging` deploys to a staging site. Everything else is a short-lived branch. |

## Rules on `main` (GitHub rulesets)

1. Pull request required. No direct pushes, including for owners.
2. One approving review from `maintainers` for website changes. Two for anything under `netlify/functions/`, `scripts/sync-*` or `grant-ops` automations, because those touch applicant data and money.
3. CODEOWNERS routes reviews: `netlify/` and `scripts/review-*` to maintainers, `content/` to the program lead, `styles/` and `*.html` to the design reviewer.
4. Required checks: `build`, `test`, `check`, `smoke` from the existing workflow, plus the Netlify deploy preview.
5. Squash merge only. Linear history. Stale approvals dismissed on new commits.
6. Secrets never enter the repository. A secret-scanning push block is on.

## Pipeline

- Every PR gets a Netlify deploy preview. Reviewers click the preview, not a screenshot.
- `staging` branch deploys to `staging.primordiagrants.com` with the staging Airtable base.
- Merge to `main` deploys production. A monthly tag `cycle-YYYY-MM` marks the state at each grant cycle close.
- Netlify environment variables hold Airtable, Claude and reviewer keys, scoped per deploy context (production, deploy preview, branch deploy).
- Dependabot for npm, monthly. CodeQL on push.

## Contributor path

1. Open an issue with one of three templates: bug, content change, cycle task.
2. Branch from `main`, named `type/short-name`.
3. Run `npm run build && npm test && npm run check && npm run smoke` locally.
4. Open a draft PR using the template: what changed, how it was checked, screenshots for visual changes.
5. A maintainer reviews within two working days. Agents re-request review after each push.

## Deliverables

- [ ] Organization created, two owners, teams filled.
- [ ] `website` transferred. Netlify reconnected to the new remote. Production deploy unchanged.
- [ ] `.github` repository with CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue and PR templates, shared `verify.yml`.
- [ ] Ruleset on `main` as above. Branch `staging` and staging site live.
- [ ] CODEOWNERS and Dependabot in `website`.
- [ ] One agent machine user configured and documented in `grant-ops/docs/agents.md`.

## Risks

- Transferring the repository changes the remote URL. Netlify and any local clones need updating the same day.
- Two required reviews on money paths can stall when only one maintainer is awake. Mitigation: three maintainers across time zones.

## Decisions

(filled after critique)
