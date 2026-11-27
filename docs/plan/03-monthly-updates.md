# 03. Monthly grantee updates through one Airtable form

Status: built. The Updates table, the update form (unpublished), the timeline on each grant page, and the request, reminder and stamp automations exist (drafts, off). Waiting on: publish the form, turn the automations on.

## Outcome

Each grantee gets one email a month with one link. They answer four questions and attach a photo. The update appears on their grant page and in the monthly report after the program lead ticks Publish.

## The form

An Airtable form on the Updates table, prefilled with the grant through a URL parameter so the grantee never picks from a list. Questions mirror the handbook's "Send a short update each month":

1. What did you do this month?
2. What did you see? A result, a photo, a failed run all count.
3. What changed in your plan?
4. Spend to date (number) and anything you need help with.
5. Photo or file (optional). Link to a preprint, protocol, or repository (optional).

## Automation

1. On the 1st of each month, an Airtable automation sends each grantee with Status "In progress" the prefilled form link. Reminder on the 10th if no row exists for that month.
2. A new Updates row notifies the program lead in email or WhatsApp with the text and the Publish checkbox link.
3. Publish checked calls the build hook (02). The update appears on `/grants/<slug>` as a dated entry, newest first.
4. The grant's Status moves to "Reported" when a final update is marked "Final report".

## Website

- The grant page shows a timeline: month, text, photo, spend to date as a simple bar against the grant amount.
- `/updates` lists the latest update from every active grant, which is the public monthly report.
- The public comms lead reuses the same JSON to draft posts. No copy and paste from Airtable.

## Deliverables

- [ ] Updates table and form, with prefill parameter documented.
- [ ] Two automations: monthly send and reminder. Tested with a staging grantee row.
- [ ] Timeline on grant pages and the `/updates` page.
- [ ] Handbook text updated to name the form and the dates.

## Risks

- Grantees ignore email. Mitigation: the WhatsApp cohort group gets the same link on the 1st.
- Photos may include people. The form states that the photo may be published. The lead checks before Publish.

## Decisions

(filled after critique)
