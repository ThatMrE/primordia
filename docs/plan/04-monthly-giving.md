# 04. Monthly grants and continuous donations

Status: draft for critique. Estimate: 5 days of design and setup, then a monthly rhythm.

## Outcome

Primordia funds grants twelve times a year. An applicant waits at most five weeks for a decision. Donors can give any day and see where the money went.

## The monthly cycle

| Day | What happens | Who |
|---|---|---|
| All month | Applications open at `/apply`. Each submission gets an acknowledgement with the next decision date. | Form, automation |
| Last day | Cycle closes. The next cycle opens the same minute. | Automation |
| 1 to 2 | AI triage scores and ranks every application (review deck). Biosafety and legal flags go to a hard-gate list. | Review deck, program lead |
| 2 to 5 | Each application gets a lead reviewer and a second reviewer in the deck. Two "Approve" with notes funds it. One Approve and one Later goes to the panel call. Two Reject declines it with a short reason to the applicant. | Reviewers |
| 6 | Panel call, 45 minutes, only for the middle band. Ties for the last slot decided by a recorded draw if the panel agrees to the experiment. | Panel |
| 7 | Decisions sent. Declined applicants get the reason and may reapply next month. | Automation from Decision field |
| 7 to 10 | Signature and bank or USDC details collected. Payout sent. Grant page published. | Program lead, finance |
| 10 | Public cycle note: how many applied, how many funded, total paid, median days to decision. | Sync from Cycles table |

Capacity: 20 to 40 applications a month at Cohort 01 volume (169 in one quarter). Two reviewers times 40 applications is 80 reviews, about 20 minutes each with the deck, so about 27 reviewer hours a month across a pool of six to ten reviewers.

Fast lane, from Fast Grants: any time in the month, two reviewers may mark an application "fund now". The lead confirms and it is paid within seven days, outside the cycle. Cap: two per month.

## The pool

- The pool is set on the 1st from the Donations table: donations received in the previous month, less 5% overhead, plus any unallocated carry-over. Minimum pool to run a cycle: $3,000. Below that the cycle rolls into the next month and the site says so.
- Target: $9,000 to $15,000 a month, which funds three to five grants.

## Continuous donations

1. **Recurring by card**: Donorbox monthly plans already exist. Add a "Fund one experiment a month" plan at $250 and show recurring donors as the base of the pool.
2. **Crypto**: existing Ethereum and Base addresses. Add a Giveth project for streaming recurring donations and for quadratic funding rounds when a matching pool exists. Zero fee.
3. **Back a grant**: on each grant page, a donor can give to that grant. Money above the grant amount flows to the pool. The page shows the total backed.
4. **Themed rounds**: a partner funds a month with a theme (diagnostics, materials, open hardware). The theme is announced on the 1st and the partner is named on the cycle note.
5. **Donor update**: the monthly `/updates` page is the donor email. One email a month, same content, with the pool meter for next month.

## Deliverables

- [ ] Cycle calendar and reviewer roster for six months, in the Cycles table.
- [ ] Acknowledgement, decision and reminder emails as Airtable automations, with copy reviewed by the comms lead.
- [ ] Payout runbook: signature, banking or USDC, Wise or on-chain send, receipt in Donations, with two-person approval.
- [ ] Donorbox plan and Giveth project set up. Addresses verified and published.
- [ ] `/fund-experiments` shows the next pool meter and the backing option per grant.
- [ ] Fast lane and lottery rules written into the handbook, dated as experiments.

## Risks

- Reviewer burnout. Mitigation: pool of ten, four active per month on rotation, deck time per application tracked.
- Monthly cadence dilutes marketing attention. Mitigation: the 10th-of-month cycle note is the one recurring post.
- Payout compliance differs by country. Mitigation: keep the existing signature and banking flow, add USDC only where it already worked in Cohort 01.

## Decisions

(filled after critique)
