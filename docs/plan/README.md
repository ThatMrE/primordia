# Primordia 2027 plan: monthly grants, open operations, many contributors

This folder is the plan. Each numbered file is one workstream. Agents and people critique the plan first, then execute it. The review deck (`/review`, PR #12) is the first piece and is already built.

## The goal in one paragraph

Primordia gives away money every month, not once a year. Applications stay open all year. Decisions take days, not months. Every grant, every update from a grantee, and every dollar in and out is public on the website without anyone editing HTML. Several people and several agents can change the software safely, because the GitHub organization enforces review and tests.

## Workstreams

| File | Workstream | Owner role | Estimate |
|---|---|---|---|
| `00-research.md` | What effective science funders do, and the principles Primordia adopts | Research agent (done, needs critique) | Done |
| `01-github-org.md` | GitHub organization, branch rules, CI, deploy pipeline, contributor roles | DevOps agent + Elliot (org owner) | 2 days |
| `02-grants-on-website.md` | Selected grants read from Airtable and shown on the site automatically | Integration agent | 3 days |
| `03-monthly-updates.md` | Airtable form for grantee updates that updates the grant pages | Integration agent | 2 days |
| `04-monthly-giving.md` | Monthly grant cycle with fast decisions and continuous donations | Program agent + panel lead | 5 days design, then monthly |
| `05-transparency.md` | Public ledger, pipeline numbers, decision times, overhead | Integration agent | 3 days |

## How to critique (72 hours)

1. Read `00-research.md` first. The principles there drive the other files.
2. Open one GitHub issue per workstream using `CRITIQUE-TEMPLATE.md`. Title it `Critique: 0N <workstream>`.
3. Quote the line you disagree with. Give the evidence. Give the smaller or cheaper alternative if there is one.
4. An agent that critiques does not execute the same workstream.
5. Elliot resolves each critique with one of: accept, reject with reason, or defer. The resolution is written into the workstream file under "Decisions".

## How to execute

1. One workstream is one GitHub milestone. Each deliverable in the file becomes one issue.
2. An agent or person claims an issue, works on a branch, and opens a draft PR to `main`.
3. CI must pass: build, unit tests, syntax check, browser smoke test, Netlify deploy preview.
4. One human maintainer approves website changes. Two approve changes to money flows or Airtable automations.
5. The PR links the issue. The issue closes on merge. The workstream file gets a "Status" line.

## Order of execution

1. `01` first: nothing else merges safely without it.
2. `02` and `03` together: they share one Airtable base and one sync script.
3. `05` next: it reuses the same sync.
4. `04` runs in parallel as a process design. Its software needs are small and land in `02`, `03` and `05`.

## Non-goals for 2027

- No custom database. Airtable is the system of record. PR #5 (PostgreSQL intake) stays a draft until Airtable proves insufficient.
- No token, no DAO vote for grant decisions. The panel decides. Crypto is a payment rail and a donation rail only.
- No new CMS. The site stays static HTML built from JSON.
