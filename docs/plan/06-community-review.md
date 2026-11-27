# 06. Community review by former applicants

Status: built. `/review/community`, assignment, and hidden scoring exist. Waiting on: reviewer keys and the first cycle.

## Outcome

Former applicants score current applications with the panel's rubric. Their score is a third signal beside the AI score and the panel. It re-orders the middle band. It never approves or declines on its own.

## Evidence

- The model is called distributed peer review. Merrifield and Saari proposed it in 2009 for telescope time. [arXiv 0906.1943](https://arxiv.org/abs/0906.1943)
- ESO tested a version with applicants reviewing each other. The authors report rankings "statistically the same as a traditional panel". Reviewer seniority and expertise affected quality. ESO did not make it the default. [Physics Today](https://physicstoday.aip.org/news/distributed-peer-review-passes-test-for-allocating-telescope-slots), [arXiv 1806.08663](https://arxiv.org/abs/1806.08663v3)
- A 2016 trial at the US National Institute of Food and Agriculture found no significant ranking difference from its standard process. [Peer Review Congress](https://peerreviewcongress.org/abstract/comparison-of-distributed-peer-review-enhanced-by-machine-learning-and-natural-language-processing-and-with-traditional-panel-based-peer-review-of-astronomy-proposals/)
- The weak point is collusion. In the NSF pilot, bonus points did not stop simple coalitions, and reviewers avoided risky proposals they expected the group to reject. [arXiv 1307.6528](https://arxiv.org/pdf/1307.6528), [survey of peer mechanisms](https://arxiv.org/pdf/2210.01984)

## Design

1. **Pool.** Funded and declined applicants opt in after their cycle closes. Cohort 01 grantees are the first seven. A person never reviews in a cycle they applied in.
2. **Assignment.** Each reviewer gets three to five applications, matched by field from the AI triage. Same lab, same email domain, same city and self-declared conflicts are excluded. Applicant names and emails are hidden on the card.
3. **Review.** The panel rubric: seven criteria from 1 to 5, plus one sentence on the strongest point and one on the biggest risk. No approve or decline button. Each application gets at least three community reviews.
4. **Weighting.** Drop the highest and the lowest score when five or more exist. Average the rest. Track each reviewer's agreement with final panel decisions. Low agreement over two cycles lowers weight. No cash or point bonus, because bonuses invite coalitions.
5. **Use.** The deck shows the community score beside the AI score. The panel uses it to order the middle band. A random 10% of community reviews get a panel spot check each cycle.
6. **Thanks.** Reviewers are listed by name on the cycle note if they opt in. Active reviewers get first access to office hours.

## Build

- Airtable: a Reviewers table (person, fields of expertise, conflicts, active, agreement rate) and a Reviews table (reviewer, application, seven scores, two sentences, submitted).
- Deck: a community mode of `/review`. The same card with seven sliders and two text boxes in place of the swipe buttons. One access key per reviewer from the Reviewers table, not the shared panel key.
- Function: `review-api.mjs` gains `assignments` and `submitReview` actions. Assignment runs once when a cycle closes.
- Privacy: the community mode never shows name, email, location detail or the AI score.

## Pilot

1. Cycle 2: community scores are collected and hidden from the panel. After decisions, compare community ranking with panel ranking.
2. Cycle 3: same, with weighting on.
3. Go or no go: the community score becomes visible in the deck if its rank agreement with the panel is at least as high as the agreement between two panel members.

## Deliverables

- [ ] Reviewers and Reviews tables in the staging base.
- [ ] Opt-in email to Cohort 01 and to declined applicants of the first cycle.
- [ ] Community mode in the deck with per-reviewer keys. Smoke test at phone and desktop widths.
- [ ] Assignment with conflict exclusion, tested on fixture data.
- [ ] Agreement report at the end of cycles 2 and 3, published in the cycle note.

## Risks

- Former applicants may score their competitors low. Mitigation: field matching across cycles, never the same cycle, and the trim of extreme scores.
- Too few reviewers in small fields. Mitigation: AI triage covers the gap, and the panel still reads every middle-band application.

## Decisions

(filled after critique)
