# Grant review deck

`/review` is a card deck for the review panel. One application shows at a time. Swipe right, press the right arrow, or tap Approve to approve. Swipe left or press the left arrow to decline. Swipe down or press the down arrow to set an application aside for later. Press U to undo. The deck is ranked by an AI score, highest first, and re-ranks as scores arrive.

The page is excluded from search engines and is never cached. It reads applicant data only through the Netlify function `netlify/functions/review-api.mjs`, so no Airtable token or Claude key reaches the browser.

## Modes

| Configured | What the deck does |
|---|---|
| Nothing | Shows the fictional sample applications in `content/review-demo.json`. Decisions and scores stay in the reviewer's browser. |
| `ANTHROPIC_API_KEY` only | Scores the sample applications with Claude. |
| Airtable variables and `REVIEW_ACCESS_KEY` | Reads live applications, writes decisions and scores back to Airtable. Reviewers must enter the access key once per browser tab. |

Without a Claude key the deck runs a completeness check instead of an assessment. The card says so in the score badge.

## Set up the live deck

1. In Netlify, open Site configuration, Environment variables, and add:
   - `REVIEW_ACCESS_KEY`: a long passphrase shared with the panel. Required. Without it the function refuses to read Airtable.
   - `AIRTABLE_TOKEN`: a personal access token with `data.records:read`, `data.records:write` and `schema.bases:read` on the applications base only.
   - `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID`: the applications table. Use IDs, not names.
   - `AIRTABLE_VIEW_ID`: optional. Limit the deck to one view, for example the current cohort.
   - `ANTHROPIC_API_KEY`: enables Claude scoring.
   - `REVIEW_MODEL`: optional. Defaults to `claude-opus-5-5`.
2. Add these columns to the applications table. The function writes only the columns that exist, so add the ones you want to keep:
   - `Decision` (single select: Approve, Reject, Later), `Review Note` (long text), `Decided At` (date with time).
   - `AI Score` (number), `AI Verdict` (single line text), `AI Summary` (long text), `AI Strengths` (long text), `AI Concerns` (long text), `AI Scored At` (date with time).
3. Redeploy. Open `/review`, enter the access key, and press "Score and rank with AI".

## How fields are read

Every non-empty field in the table becomes part of the card. Fields whose names look like a name, email, amount, location or lab are shown in the card header. Everything else appears under "Read the full application", in table order, and all of it is sent to the model. Fields that start with `AI ` and the decision columns are hidden from the answers. No field mapping is needed when the table mirrors the ten public application questions.

## How scoring works

Each application is scored in its own request so a slow answer cannot block the others. The browser keeps three requests in flight. The model receives the Primordia funding criteria as a system prompt and returns a fixed JSON shape: an overall score from 0 to 100, a one-line summary, up to four strengths, up to four concerns, up to three questions for the applicant, and a 1 to 5 score for clarity, feasibility, lab access, capability, openness, budget fit and impact. Scores are stored in Airtable once, so re-opening the deck does not spend tokens again.

The score is a sort order for a busy panel, not a decision. The full application is one tap away on every card.

## Costs and limits

- Netlify synchronous functions stop after 10 seconds on the free plan. Scoring runs at low effort to stay inside that limit. If scoring times out, set `REVIEW_MODEL` to `claude-sonnet-5-5` or ask Netlify support to raise the function timeout.
- One application costs well under one cent to score with the default model at these lengths.
- The deck reads the whole table on every load. Use `AIRTABLE_VIEW_ID` for cohorts above a few hundred applications.

## Local check

```bash
npm run build && npm test && npm run smoke
```

The smoke test opens `/review` at phone and desktop widths, checks that three cards stack, that no text is smaller than 14px, and that the right arrow key approves the top card.

## Community review

Former applicants score assigned applications at `/review/community`. They see no name, email, location, lab or AI score. They give seven scores from 1 to 5 and two sentences. They cannot approve or decline.

The panel lead presses "Assign community reviewers" in the deck when a cycle opens. Each application gets three reviewers. Conflicts by email, institution domain, city and declared names are excluded. A reviewer who applied in the same cycle reviews nothing.

During the pilot the panel does not see community scores. Set `COMMUNITY_SCORES_VISIBLE=true` after the go decision to show "Community 72 from 4 reviews" on each card. Setup is in `docs/OPERATIONS.md`.
