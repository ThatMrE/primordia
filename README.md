# Primordia // Grants — website

Static marketing + application site for **Primordia Grants**, a community-biotech
microgrant program funding the first decisive experiment ($1,000–$3,000) on a
community-lab bench. A **ValleyDAO × Biopunk Lab** collaboration.

> Make the work visible. · Fund the first step.

No build step. Plain HTML, one CSS layer, a few lines of vanilla JS. Deploys
anywhere that serves static files; configured here for **Netlify** + **GitHub**.

---

## Pages

| File | URL | What |
|---|---|---|
| `index.html` | `/` | Hero, definition, how it works, mission, Cohort 01 stats, FAQ |
| `about.html` | `/about` | Case for community biotech, track record, funding model, roadmap, team |
| `grantees.html` | `/program` | Grantee handbook — four-month program, support, grant essentials |
| `cohort-1.html` | `/cohort-1` | Q1 2026 submissions report + the seven funded projects |
| `message.html` | `/message` | Letter from the team |
| `apply.html` | `/apply` | 10-question application (Netlify Forms) |
| `fund-experiments.html` | `/fund-experiments` | Donate (Donorbox) + crypto wallets |
| `thanks.html` | `/thanks` | Post-submission confirmation |
| `404.html` | — | Custom not-found |

## Design system

The site is built on the **Primordia Design System** (Futura/Jost + JetBrains
Mono, void/bone grounds, three equal RGB primaries, the Primordium ring mark).
The system is vendored under `assets/ds/` and every page links one stylesheet:

```
assets/
  primordia.css         ← every page links THIS (site/component layer)
    └ @imports assets/ds/styles.css
  ds/
    styles.css          ← DS entry: imports fonts → tokens → base
    fonts.css           ← Jost (Futura fallback) + JetBrains Mono (Google Fonts)
    tokens/colors.css, typography.css, spacing.css, base.css
  marks/                ← Primordium ring mark (glow on dark, outline on light)
  imagery/              ← specimen plates used in heroes/figures
```

**Brand rules honored in the CSS:** ≥80% of every surface is void `#07080A` or
bone `#F2EFE6`; the three primaries (Signal Red `#FF2D2D`, Bio Green `#00E5A0`,
Spectrum Blue `#2E6BFF`) are the system — red is the *signal*, used once or twice
per surface; radius 0 everywhere; hard 1–2px borders; no shadows; motion is a
100ms linear cut; no emoji (cohort countries are mono codes — IND/AUS/MEX/ITA/USA/ARG).

> **Fonts:** the brand specifies Futura, which is not a free webfont. The stack is
> `'Futura', 'Futura PT', 'Futura Std', 'Jost', system-ui` — real Futura renders
> for anyone who has it licensed; **Jost** (near-identical metrics) renders
> everywhere else. To wire a licensed Futura web kit, add `@font-face` rules to
> `assets/ds/fonts.css` and keep Futura first in `--font-futura`.

## Editing — regenerate, don't hand-edit

All nine pages are emitted by a single generator, **`build_site.py`** (kept
alongside this repo, not deployed). Edit content/markup there, then:

```bash
python3 build_site.py        # rewrites all *.html into this folder
```

Editing the `.html` directly works too, but changes will be overwritten the next
time the generator runs.

## Forms

`apply.html` posts via **Netlify Forms** (`data-netlify="true"`, honeypot
`bot-field`, redirect to `/thanks.html`). Submissions appear in the Netlify
dashboard once deployed; pipe them to the **Primordia Grants** Airtable base for
review. No server code required.

## Key facts (single source of truth)

- Grant ceiling **$3,000**; application deadline **31 March 2026**; ~3–4 month projects.
- **Overhead is 5%** (both About and Fund pages). This is the figure of record;
  it differs from the old Q1 deck (3%).
- Contact **hi@primordiagrants.com**. Donate **donorbox.org/primordia-microgrants**.
- Crypto: ETH/USDC/USDT on Mainnet Ethereum `0xD920E60b798A2F5a8332799d8a23075c9E77d5F8`
  and Base `0xe580BfFE2f427479483395fA6A563C07f7ad33Fc`.

See **DEPLOY.md** for GitHub + Netlify setup.
