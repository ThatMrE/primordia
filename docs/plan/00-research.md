# 00. What effective science funders do, and what Primordia adopts

Status: draft for critique. Research done 2026-11-27 from public sources. Each claim has a source. Claims from a funder about itself are marked "self-reported".

## Findings

### Fast Grants (Collison, Cowen, Schmidt; 2020 to 2021)
- Application form under 30 minutes. First round decided within 48 hours. Later rounds slipped to 14 days as volume grew. [Duke notice](https://researchfunding.duke.edu/emergent-ventures-fast-funding-covid-19-science), [Inside Philanthropy](https://www.insidephilanthropy.com/home/2020/6/10/fast-money-how-a-coronavirus-research-funder-moved-millions-in-a-matter-of-days)
- About 20 early-career reviewers. At least three read each application. A grant went out when one or two reviewers judged it very worthy. No consensus needed. [Inside Philanthropy](https://www.insidephilanthropy.com/home/2020/6/10/fast-money-how-a-coronavirus-research-funder-moved-millions-in-a-matter-of-days)
- Retrospective (self-reported): 57% of grantees spend over a quarter of their time on grant applications. 78% would change their research "a lot" with unconstrained money. 32% said the grant sped their work by a few months. [What we learned doing Fast Grants](https://future.com/what-we-learned-doing-fast-grants/)
- Lesson for Primordia: speed came from a small reviewer pool, a short form, and a low bar for a "yes" from a strong reviewer. Speed decays when volume grows and the process stays manual.

### Impetus Grants (longevity, 2021 to now)
- About three weeks from submission to decision, grants to $500k, 1.1% overhead (self-reported). Review asks "what is the potential for impact", not "what could go wrong". Applications under one page. [impetusgrants.org FAQ](https://impetusgrants.org/faq), [Longevity.Technology](https://longevity.technology/news/impetus-getting-the-longevity-party-started/)
- Lesson: a published decision time is itself a feature. Primordia should publish its median days to decision.

### Emergent Ventures (Mercatus, 2018 to now)
- One decision maker. 1,500-word application. No advertising, referrals from past winners. Median grant $10k to $25k. [Mercatus](https://mercatus.org/bridge/commentary/behind-scenes-look-emergent-ventures-so-far), [Chronicle of Philanthropy](https://www.philanthropy.com/article/tyler-cowens-free-market-think-tank-takes-innovative-approach-to-tech-grants/)
- Lesson: a single accountable decider is fast. It does not scale past one person's attention and is hard to make transparent. Primordia keeps a panel but gives each application a named lead reviewer.

### Experiment.com (crowdfunded science, 2012 to now)
- All-or-nothing campaigns. Backers charged only when a target is reached. Backers get the process, not rewards. About 941 projects and $9.2M by 2020. Under half of campaigns reach their goal. [NBER paper](https://www.nber.org/papers/w24402), [Wikipedia](https://en.wikipedia.com/wiki/Experiment.com)
- Lesson: donors fund what they can see. Public project pages with updates convert. Primordia should let a donor back a named grant or the general pool.

### Partial lotteries (Volkswagen Foundation, SNSF)
- Volkswagen's "Experiment!" scheme used peer review to shortlist, then drew lots among equally good proposals. Monitored evaluation reports more diverse grantees and more risk-taking proposals, and no complaints from applicants (self-reported). [Volkswagen Foundation](https://www.volkswagenstiftung.de/en/news/news/everyone-equal-lottery-drum), [DORA summary](https://sfdora.org/2025/03/27/insights-on-partial-randomization-in-research-funding-learnings-from-the-volkswagen-foundation/)
- SNSF uses partial randomization for some lines. No outcome evaluation found. [EMBO](https://www.embo.org/?p=18563)
- Lesson: when the panel cannot separate the middle band, a public draw is fairer and faster than more argument. Offer it as an experiment, not a default.

### NSF small fast grants (SGER)
- One in ten small grants led to transformative results, by the Good Science Project's reading of NSF's own evaluation. [Good Science Project](https://goodscienceproject.org/articles/small-fast-grants-at-the-national-science-foundation/)
- Lesson: small and fast is not a lesser product. It is the product.

### DeSci and crypto rails (Gitcoin, Giveth, VitaDAO)
- Gitcoin's DeSci rounds: $567k across 82 projects in 2022, $39k across 49 projects in 2024. Matching pools are no longer dependable. Quadratic funding rewards many small donors over few large ones. [Gitcoin case studies](https://gitcoin.co/case-studies), [Caper wiki](https://caper.network/wiki/desci/ecosystem/gitcoin-desci)
- Giveth: zero-fee donations, streaming recurring donations on Optimism and Base via Superfluid. About 1,890 recurring donors all time (self-reported). [Giveth docs](https://docs.giveth.io/quadraticfunding), [Giveth forum](https://forum.giveth.io/t/giveth-team-compensation-and-expenses-march-2026/2181)
- VitaDAO: claims of 31 to 37 funded projects vary by source. One source reports no active proposals since September 2025. Unverified. [Caper wiki](https://caper.network/wiki/desci/desci-daos)
- Lesson: crypto rails are useful for payouts and for a second donor community. They are not a dependable matching source. Do not build the program on them.

### New research organizations (Convergent, Astera, Arcadia)
- Focused Research Organizations are large, multi-year, and donor-funded. They are a different product from microgrants. [Future Blind](https://futureblind.com/p/the-new-wave-of-science-and-research-models)
- Lesson: Primordia's niche is the first $3,000, not the first $30M. Keep it.

## Principles Primordia adopts

1. **Rolling intake, monthly decisions.** The form is open all year. The month closes on the last day. Decisions ship by the 7th. Money moves by the 10th.
2. **Short form, short review.** The form stays at ten questions. Each application gets an AI triage, one lead reviewer, one second reviewer. A "strong yes" from two reviewers funds without a panel meeting.
3. **Publish the clock.** The site shows median days from submission to decision and to payout, updated monthly.
4. **Impact question first.** Reviewers answer "what could this become" before "what could go wrong". Biosafety and legal checks stay hard gates.
5. **Fund what people can see.** Every grant has a public page. Every grantee posts a monthly update through one form. Donors can back a named grant or the pool.
6. **Middle band by lot, as an experiment.** When two applications tie for the last slot, a recorded public draw decides. Review after six months.
7. **Transparent by construction.** Money in, money out, overhead, pipeline counts and decision times come from Airtable and land on the site at build time. No hand-edited numbers.
8. **Humans decide. Agents prepare.** AI scores and summarizes. People approve. The audit trail records both.

## Open questions for critique

- Is a $3,000 ceiling right for monthly cadence, or should the monthly pool be fixed and the count vary?
- Do grantees accept a public monthly update as a condition? Cohort 01 did monthly check-ins already.
- Should the partial lottery wait until the panel has run three monthly cycles?
