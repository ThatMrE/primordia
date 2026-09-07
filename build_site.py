# -*- coding: utf-8 -*-
import io
OUT = "./"

# --- FUNDING CYCLE ---------------------------------------------------
# Single source of truth for cycle status. Cohort 01 closed on
# 31 March 2026 and has been delivered; the next call is not announced.
# To reopen applications: set CYCLE_OPEN = True and fill CYCLE_DEADLINE
# (e.g. "31 March 2027") and CYCLE_NAME, then re-run this script.
CYCLE_OPEN     = False
CYCLE_NAME     = "Cohort 02"
CYCLE_DEADLINE = ""                       # e.g. "31 March 2027"
PREV_DEADLINE  = "31 March 2026"          # Cohort 01, closed
CONTACT        = "hi@primordiagrants.com"

CYCLE_PLATE = (("Deadline &mdash; " + CYCLE_DEADLINE) if (CYCLE_OPEN and CYCLE_DEADLINE)
               else "Next call &mdash; dates to be announced")
CYCLE_NOTE  = (("Applications for " + CYCLE_NAME + " are open.")
               if CYCLE_OPEN else
               ("Cohort 01 closed " + PREV_DEADLINE + " and is now complete. "
                "Email <a href=\"mailto:" + CONTACT + "\">" + CONTACT + "</a> "
                "to be notified when the next call opens."))

MARK = ('<svg class="mk" viewBox="0 0 100 100" width="%d" height="%d" aria-hidden="true">'
        '<g style="isolation:isolate">'
        '<circle cx="40" cy="43" r="27" fill="#FF2D2D" style="mix-blend-mode:screen"/>'
        '<circle cx="60" cy="43" r="27" fill="#00E5A0" style="mix-blend-mode:screen"/>'
        '<circle cx="50" cy="60" r="27" fill="#2E6BFF" style="mix-blend-mode:screen"/>'
        '</g></svg>')

def head(title, desc):
    return ('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>'+title+'</title><meta name="description" content="'+desc+'">'
        '<meta name="theme-color" content="#07080A">'
        '<script>(function(){try{if(localStorage.getItem("pg-theme")==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();</script>'
        '<link rel="icon" href="assets/marks/favicon.svg" type="image/svg+xml">'
        '<link rel="stylesheet" href="assets/primordia.css?v=3">'
        '</head><body>')

def nav(active):
    def c(n): return ' is-active' if n==active else ''
    return ('<nav class="nav">'
        '<a class="brand" href="index.html">'+(MARK % (28,28))+
        '<span class="word">Primordia</span><span class="sub">// Grants</span></a>'
        '<div class="nav__links" id="navlinks">'
        '<a class="'+('is-active' if active=='about' else '')+'" href="about.html">About</a>'
        '<a class="'+('is-active' if active=='grantees' else '')+'" href="grantees.html">Program</a>'
        '<a class="'+('is-active' if active=='cohort' else '')+'" href="cohort-1.html">Cohort 01</a>'
        '<a class="'+('is-active' if active=='message' else '')+'" href="message.html">Message</a>'
        '</div>'
        '<div class="nav__cta">'
        '<a class="btn btn--ghost btn--sm" href="fund-experiments.html">Fund</a>'
        '<a class="btn btn--signal btn--sm" href="apply.html">Apply</a>'
        '<button class="theme-btn" id="themeBtn" type="button" aria-label="Toggle light or dark theme" title="Toggle theme"><span class="ti" aria-hidden="true"></span></button>'
        '<button class="menu-btn" id="menuBtn" aria-label="Menu">//</button>'
        '</div></nav>')

FOOTER = ('<footer class="footer"><div class="wrap"><div class="footer__grid">'
    '<div><div style="display:flex;align-items:center;gap:11px">'+(MARK % (30,30))+
    '<span class="word">Primordia</span></div>'
    '<p class="footer__collab">A cross-collaboration between <b>ValleyDAO</b> &amp; <b>Biopunk Lab</b>.<br>Make the work visible.<br>hi@primordiagrants.com</p></div>'
    '<div class="footer__col"><h4>// Program</h4><ul>'
    '<li><a href="about.html">About</a></li><li><a href="grantees.html">Program</a></li>'
    '<li><a href="cohort-1.html">Cohort 01</a></li><li><a href="message.html">Message</a></li></ul></div>'
    '<div class="footer__col"><h4>// Take part</h4><ul>'
    '<li><a href="apply.html">Apply</a></li><li><a href="fund-experiments.html">Fund experiments</a></li>'
    '<li><a href="mailto:hi@primordiagrants.com">Contact</a></li></ul></div>'
    '</div><div class="footer__bottom"><span>&copy; 2026 Primordia Grants</span>'
    '<span>ValleyDAO &times; Biopunk Lab &middot; primordiagrants.com</span></div>'
    '</div></footer>')

SCRIPT = ("<script>"
    "var mb=document.getElementById('menuBtn'),nl=document.getElementById('navlinks');"
    "if(mb)mb.addEventListener('click',function(){nl.classList.toggle('open')});"
    "document.querySelectorAll('.copy').forEach(function(b){b.addEventListener('click',function(){"
    "var t=document.getElementById(b.getAttribute('data-target')).textContent.trim();"
    "navigator.clipboard&&navigator.clipboard.writeText(t).then(function(){var o=b.textContent;b.textContent='Copied';setTimeout(function(){b.textContent=o},1200)})})});"
    "var tb=document.getElementById('themeBtn');"
    "function pgMeta(){var d=document.documentElement.getAttribute('data-theme')==='light';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',d?'#F3F0E7':'#07080A');}"
    "pgMeta();"
    "if(tb)tb.addEventListener('click',function(){var l=document.documentElement.getAttribute('data-theme')==='light';if(l){document.documentElement.removeAttribute('data-theme');}else{document.documentElement.setAttribute('data-theme','light');}try{localStorage.setItem('pg-theme',l?'dark':'light');}catch(e){}pgMeta();});"
    "</script>")

def page(title, desc, active, body):
    return head(title, desc)+nav(active)+'<main>'+body+'</main>'+FOOTER+SCRIPT+'</body></html>'

def kicker(label, section=''):
    s = '<span class="sec">'+section+'</span>' if section else ''
    return '<div class="kicker"><span class="tritick"><i></i><i></i><i></i></span>'+s+'<span>'+label+'</span></div>'

def faq_html(items):
    out=''
    for qi,q,a in items:
        out+=('<details class="faq__item"><summary class="faq__q"><span class="qi">'+qi+'</span>'+q+'<span class="plus"></span></summary>'
              '<div class="faq__a">'+a+'</div></details>')
    return out

# ===================================================================== INDEX
index_body = (
'<section class="hero"><div class="wrap">'
+kicker('Microgrants &middot; Community biology')+
"""
  <h1 class="disp" style="font-size:var(--t-hero)">Fund the first<br>decisive experiment</h1>
  <p class="lede">Primordia is a fast, trust-based microgrant layer below traditional grants. We fund the $1,000&ndash;$3,000 killer experiment a builder runs on a community-lab bench. The one that shows whether an idea is real.</p>
  <div class="hero__cta">
    <a class="btn btn--signal" href="apply.html">Apply for a grant</a>
    <a class="btn btn--ghost" href="fund-experiments.html">Fund experiments</a>
  </div>
  <div class="hero__media">
    <img src="assets/imagery/haeckel-embryo-plate.jpg" alt="Specimen plate" loading="lazy">
    <span class="plate">PL.001 &middot; REG 1690</span>
  </div>
</div></section>

<section class="section section--paper"><div class="wrap">
"""
+kicker('What is Primordia','&sect; 01')+
"""
  <div class="grid grid-2" style="gap:32px;align-items:start;margin-top:14px">
    <div class="panel--bone" style="border:1px solid var(--line-ink-2);padding:24px">
      <div class="mono" style="color:var(--rgb-red)">FIG.01 &middot; Definition</div>
      <div class="disp" style="font-size:34px;margin-top:8px">Primordium</div>
      <div class="mono" style="color:var(--fg3-inv);margin-top:4px">/ pri&middot;mor&middot;di&middot;um / &middot; noun</div>
      <p class="p" style="color:var(--void);margin-top:16px">An organ or tissue in its earliest recognizable stage of development.</p>
      <p class="p" style="color:var(--fg2-inv);margin-top:12px">Primordia is a collection of those beginnings. Many small, early experiments that can grow into something bigger.</p>
    </div>
    <div>
      <h2 class="h2">Move ideas out of notebooks and onto the bench</h2>
      <p class="lede" style="margin-top:16px">Primordia funds focused biology experiments in community labs and other compliant spaces. Small, fast grants. A simple structure for sharing lab notes, results, and the story behind them.</p>
      <p class="lede" style="margin-top:14px">We lower the activation energy of starting. Enough money for reagents and bench time. Enough structure to turn a loose idea into a documented result.</p>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('How it works','&sect; 02')+
"""
  <h2 class="h2" style="margin-top:14px">Five stages, one cycle</h2>
  <p class="lede" style="margin:16px 0 8px">Built for experiments that fit inside a few months and a micro-budget.</p>
  <div class="stage"><div class="num">01</div><div><h3>Apply with a concrete experiment</h3><p>Propose a focused experiment you can run in a community lab or other compliant space within a few months.</p></div><div class="chk">// Notebook</div></div>
  <div class="stage"><div class="num">02</div><div><h3>Review &amp; selection</h3><p>Applications are read by a panel of community-lab leaders and practitioners who know the realities of bench work.</p></div><div class="chk">// Panel</div></div>
  <div class="stage"><div class="num">03</div><div><h3>Microgrant &amp; lab access</h3><p>Selected teams receive a flexible microgrant for reagents, consumables, equipment, and lab membership or bench fees.</p></div><div class="chk">// Up to $3K</div></div>
  <div class="stage"><div class="num">04</div><div><h3>Lab notes &amp; updates</h3><p>Grantees share short public updates during the grant period, building an open portfolio of progress in real time.</p></div><div class="chk">// Monthly</div></div>
  <div class="stage"><div class="num">05</div><div><h3>Showcase &amp; next steps</h3><p>At the end of the cycle, projects share results in a public session and a written summary. The start of what comes next.</p></div><div class="chk">// Output</div></div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('The mission','&sect; 03')+
"""
  <h2 class="h2" style="margin-top:14px">Seeding the next wave of community biotech</h2>
  <p class="lede" style="margin:16px 0 24px">Each of these started as an early experiment on a community bench. Proof of what small beginnings become.</p>
  <div class="grid grid-4">
    <div class="pcard"><div class="pcard__name" style="font-size:16px">Real Vegan Cheese</div><div class="pcard__desc">Engineered yeast to produce milk proteins for animal-free cheese.</div><div class="pcard__meta">BioCurious &middot; SF</div></div>
    <div class="pcard"><div class="pcard__name" style="font-size:16px">Bento Bio</div><div class="pcard__desc">A portable DNA lab. PCR, thermocycler, power, and gel box in one.</div><div class="pcard__meta">Biohackspace &middot; London</div></div>
    <div class="pcard"><div class="pcard__name" style="font-size:16px">Opentrons</div><div class="pcard__desc">A low-cost liquid-handling robot to automate basic biology workflows.</div><div class="pcard__meta">Genspace &middot; NYC</div></div>
    <div class="pcard"><div class="pcard__name" style="font-size:16px">Open Insulin</div><div class="pcard__desc">A small-scale, community model for producing insulin.</div><div class="pcard__meta">Counter Culture &middot; Oakland</div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Cohort 01 &middot; complete','&sect; 04')+
"""
  <h2 class="h2" style="margin-top:14px">Our first cohort, selected from 169 applications</h2>
  <p class="lede" style="margin:16px 0 24px">Seven projects across six countries. Climate biotech, wound healing, DNA synthesis, mitochondrial therapy, protein design, single-cell platforms, and histology automation.</p>
  <div class="grid grid-4" style="margin-bottom:28px">
    <div class="stat"><div class="n n--green">$13,200</div><div class="l">Total funded</div></div>
    <div class="stat"><div class="n">7</div><div class="l">Projects &middot; 11 builders</div></div>
    <div class="stat"><div class="n n--red">169</div><div class="l">Applications</div></div>
    <div class="stat"><div class="n n--blue">22+</div><div class="l">Countries</div></div>
  </div>
  <a class="btn btn--ghost" href="cohort-1.html">Read the Cohort 01 report</a>
</div></section>

<section class="apply-strip">
  <div><h2 class="h2">Bring an experiment</h2>
  <p>The grant is the starting point. Bring a concrete first experiment, or help fund one for someone who has it.</p></div>
  <a class="btn" href="apply.html">Apply now</a>
</section>

<section class="section"><div class="wrap">
"""
+kicker('Questions','&sect; 05')+
'<h2 class="h2" style="margin:14px 0 28px">Frequently asked</h2>'
)

_faq = [
 ("Q1","Who can apply to Primordia?","Anyone with a clear biology experiment they can run in a compliant lab setting within a few months. Primordia is especially supportive of students, early-career researchers, community-bio members, and independent builders &mdash; you don\u2019t need institutional affiliation or formal credentials. What matters is a concrete plan and the ability to carry out the work safely."),
 ("Q2","Do I need to be part of a community lab to apply?","Not when you apply, but you do need a realistic plan for where the work will be done by the time the project starts. Primordia supports projects run in appropriate lab environments, and can sometimes help applicants find lab space."),
 ("Q3","When is the application deadline?","The first funding call closed on "+PREV_DEADLINE+" and Cohort 01 is now complete. Dates for the next call have not been announced yet \u2014 email <a href=\"mailto:"+CONTACT+"\">"+CONTACT+"</a> to be notified when applications reopen."),
 ("Q4","What can grant funds be used for?","Running the proposed experiment: reagents, consumables, basic materials, and lab-related fees such as community-lab membership or bench fees. If you\u2019re unsure whether a cost fits, include it in your budget notes and explain how it supports the experiment."),
 ("Q5","How large are the microgrants?","Up to $3,000 per project. Some awards may be smaller depending on scope, budget, and the size of the funding pool for that cohort."),
 ("Q6","How long are projects expected to run?","Most projects produce an initial proof of concept and clear learnings in about three to four months. A slightly longer timeline is possible if the project stays tightly scoped."),
 ("Q7","Can donors remain anonymous?","Yes. Donors can choose to be publicly named, listed without an amount, or remain fully anonymous."),
 ("Q8","How is safety and compliance handled across countries?","Primordia supports projects that can be carried out safely and legally in the applicant\u2019s jurisdiction and within the host lab\u2019s policies. Applicants describe where the work happens and how they\u2019ll handle safety, sourcing, and disposal. Local laws and host-lab safety rules always apply."),
]
index_body = index_body + faq_html(_faq) + '</div></section>'

# ===================================================================== ABOUT
about_body = (
'<section class="hero"><div class="wrap">'
+kicker('About Primordia')+
"""
  <h1 class="disp" style="font-size:var(--t-display)">A funding layer below<br>traditional grants</h1>
  <p class="lede">Primordia gives builder-led biotech the smallest credible path from idea to experiment: fast, lightweight, trust-based microgrants paired with community-lab infrastructure and serious scientific review.</p>
  <div class="grid grid-3" style="margin-top:40px">
    <div class="stat"><div class="n n--green">$1M+</div><div class="l">Crowdfunded research enabled</div></div>
    <div class="stat"><div class="n">5,000+</div><div class="l">Community members built</div></div>
    <div class="stat"><div class="n n--blue">Global</div><div class="l">Network of community biolabs</div></div>
  </div>
</div></section>

<section class="section section--paper"><div class="wrap">
"""
+kicker('The case for community biotech','&sect; 01')+
"""
  <div class="grid grid-2" style="gap:32px;align-items:start;margin-top:14px">
    <div>
      <h2 class="h2">Early research results are stories</h2>
      <p class="lede" style="margin-top:16px">Community labs, DIY-bio clubs, and biohacker spaces let people do real biology. No supervisor, no university position, no big grant. Curiosity becomes a concrete experiment in months, not years.</p>
      <p class="lede" style="margin-top:14px">Beyond access to equipment, they help builders create a proof of concept and a public narrative for their work.</p>
      <p class="note" style="margin-top:20px;color:var(--void)">That story is what makes funders and stakeholders listen closely, and gives builders a chance at future support.</p>
    </div>
    <div class="figure"><img src="assets/imagery/cyanotype-anatomy.jpg" alt="Cyanotype specimen" loading="lazy"><span class="plate">PL.014 &middot; REG 2208</span></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Track record','&sect; 02')+
"""
  <h2 class="h2" style="margin-top:14px">Community bio can breed success at venture scale</h2>
  <p class="lede" style="margin:16px 0 24px">A community space gives a small team room to run, that work attracts capital, and the founders end up follow-on funded, hired, or published.</p>
  <div class="grid grid-3">
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">Case 01</div><h3 style="margin-top:8px">Muse Bio</h3><p class="p" style="margin-top:8px">Started during a hackathon co-hosted by a community lab. Now commercialising menstrual stem cells with a venture round behind it.</p><div class="stat" style="margin-top:16px"><div class="n n--green" style="font-size:34px">$1.1M</div><div class="l">Raised to commercialise</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">Case 02</div><h3 style="margin-top:8px">Zeon Systems</h3><p class="p" style="margin-top:8px">Filmed their YC launch video at the Biopunk Lab, leading directly into a Y Combinator batch and a follow-on round.</p><div class="stat" style="margin-top:16px"><div class="n n--green" style="font-size:34px">$6M</div><div class="l">Follow-on raise post-YC</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">Case 03</div><h3 style="margin-top:8px">Opentrons</h3><p class="p" style="margin-top:8px">Made lab automation accessible by turning liquid-handling robots into an affordable, open-source benchtop platform. After YC, scaled into a unicorn.</p><div class="stat" style="margin-top:16px"><div class="n n--green" style="font-size:34px">$200M</div><div class="l">Raised to date</div></div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('The funding model','&sect; 03')+
"""
  <h2 class="h2" style="margin-top:14px">Primordia funds many small beginnings</h2>
  <div class="grid grid-4" style="margin-top:24px">
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Grant ceiling</div><div class="disp" style="font-size:40px;margin-top:8px">$3,000</div><p class="p" style="margin-top:8px">Per microgrant. Covers months of membership, reagents, and materials. Enough for a minimal viable experiment.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Conditions</div><div class="disp" style="font-size:40px;margin-top:8px">No strings</div><p class="p" style="margin-top:8px">No strings attached. The work and its learnings belong to the builder.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Overhead</div><div class="disp" style="font-size:40px;margin-top:8px">5%</div><p class="p" style="margin-top:8px">Primordia keeps only 5% as overhead, covering digital service fees.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Scope</div><div class="disp" style="font-size:40px;margin-top:8px">One MVE</div><p class="p" style="margin-top:8px">A focused, minimal viable biology experiment. The first decisive test.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Roadmap','&sect; 04')+
"""
  <h2 class="h2" style="margin-top:14px">Where Primordia is going</h2>
  <div style="margin-top:24px">
    <div class="stage"><div class="num" style="font-size:26px">2026</div><div style="display:flex;flex-direction:column;gap:12px">
      <div><div class="databar" style="border-top:0;padding:6px 0"><div class="lbl">Ship the backbone: donation infra, website, reviewer system</div><div class="track green"><i style="width:100%"></i></div><div class="val">100%</div></div></div>
      <div class="databar" style="border-top:0;padding:6px 0"><div class="lbl">Fund 15 microgrants</div><div class="track"><i style="width:50%"></i></div><div class="val">50%</div></div>
      <div class="databar" style="border-top:0;padding:6px 0"><div class="lbl">Onboard $30,000 in donations</div><div class="track"><i style="width:43%"></i></div><div class="val">43%</div></div>
      <div class="databar" style="border-top:0;padding:6px 0"><div class="lbl">Run 3 cohorts</div><div class="track"><i style="width:33%"></i></div><div class="val">33%</div></div>
    </div><div class="chk">// In progress</div></div>
    <div class="stage"><div class="num" style="font-size:26px">2027</div><div><p>Run 6+ cohorts, fund 20&ndash;30 microgrants &middot; launch community-lab partner &amp; alumni programs &middot; reach $5,000+ monthly recurring with 200+ donors.</p></div><div class="chk">// Next</div></div>
    <div class="stage"><div class="num" style="font-size:26px">2028+</div><div><p>Target 8+ cohorts, funding 26&ndash;40 microgrants annually &middot; establish Primordia as the primary community-bio experiment funder &middot; reach $10,000+ monthly recurring with 400+ donors.</p></div><div class="chk">// Horizon</div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Founding members','&sect; 05')+
"""
  <h2 class="h2" style="margin-top:14px">A cross-collab between ValleyDAO &amp; Biopunk Lab</h2>
  <div class="grid grid-2" style="margin-top:24px">
    <div class="panel"><div class="mono" style="color:var(--rgb-blue)">ValleyDAO</div><h3 style="margin-top:8px">Albert Anis</h3><p class="p" style="margin-top:8px">Co-lead on Primordia. Coordinates donor onboarding, banking, and program operations.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-blue)">ValleyDAO</div><h3 style="margin-top:8px">Morgan Richards</h3><p class="p" style="margin-top:8px">Leads program design and reviewer coordination across cohorts and grant cycles.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">Biopunk Lab</div><h3 style="margin-top:8px">Elliot Roth</h3><p class="p" style="margin-top:8px">Founder of Biopunk. Brings the community-lab network and technical mentorship layer.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">Biopunk Lab</div><h3 style="margin-top:8px">Zoe Isabel Sen&oacute;n</h3><p class="p" style="margin-top:8px">Program lead for grantee experience, onboarding, office hours, and visibility.</p></div>
  </div>
  <p class="note" style="margin-top:28px">We are grateful to everyone who supported Primordia before it had a track record. In particular, we thank the <span class="em">Kris Rockwell Foundation</span> for its early support. <a href="message.html">Read the full message from the team.</a></p>
</div></section>
"""
)

# ===================================================================== COHORT
def grantee(code, name, title, amt, hl=False):
    cls = 'pcard is-highlight' if hl else 'pcard'
    return ('<div class="'+cls+'"><div class="pcard__top"><div class="pcard__name">'+name+'</div>'
            '<div class="pcard__amt">'+amt+'</div></div>'
            '<div class="pcard__desc">'+title+'</div>'
            '<div class="pcard__meta">'+code+'</div></div>')

cohort_body = (
'<section class="hero"><div class="wrap">'
+kicker('Q1 2026 Report &middot; Cohort 01 outcomes')+
"""
  <h1 class="disp" style="font-size:var(--t-display)">A snapshot of where<br>community biotech is heading</h1>
  <p class="lede">The first Primordia call was not just an application process. It gave us a picture of the field: tools, accessible methods, local problems, and globally distributed builders.</p>
  <div class="grid grid-4" style="margin-top:40px">
    <div class="stat"><div class="n n--red">169</div><div class="l">Submissions analysed</div></div>
    <div class="stat"><div class="n">8</div><div class="l">Primary categories</div></div>
    <div class="stat"><div class="n n--blue">22+</div><div class="l">Countries represented</div></div>
    <div class="stat"><div class="n n--green">52.7%</div><div class="l">Builder-led pool</div></div>
  </div>
</div></section>

<section class="section section--paper"><div class="wrap">
"""
+kicker('Category mix','&sect; 01')+
"""
  <h2 class="h2" style="margin-top:14px">What the first call revealed</h2>
  <div style="margin-top:24px">
    <div class="databar"><div class="lbl">Health &amp; Medicine</div><div class="track red"><i style="width:100%"></i></div><div class="val">28.4%</div></div>
    <div class="databar"><div class="lbl">Research Tools &amp; Infrastructure</div><div class="track"><i style="width:85%"></i></div><div class="val">24.3%</div></div>
    <div class="databar"><div class="lbl">Agriculture &amp; Food Systems</div><div class="track"><i style="width:48%"></i></div><div class="val">13.6%</div></div>
    <div class="databar"><div class="lbl">Environment &amp; Climate</div><div class="track"><i style="width:42%"></i></div><div class="val">11.8%</div></div>
    <div class="databar"><div class="lbl">Fundamental Biology</div><div class="track"><i style="width:35%"></i></div><div class="val">10.1%</div></div>
    <div class="databar"><div class="lbl">Biomaterials &amp; Biofabrication</div><div class="track"><i style="width:29%"></i></div><div class="val">8.3%</div></div>
    <div class="databar"><div class="lbl">Community, Education &amp; Social</div><div class="track"><i style="width:13%"></i></div><div class="val">3.6%</div></div>
  </div>
  <div class="mono" style="margin-top:20px;color:var(--fg3-inv)">Source: Primordia Grants Submissions Report &middot; April 2026</div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Five patterns','&sect; 02')+
"""
  <h2 class="h2" style="margin-top:14px">What the pool is really saying</h2>
  <div class="grid grid-3" style="margin-top:24px">
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">A // One</div><h3 style="margin-top:8px;font-size:18px">Builder-led biotech</h3><p class="p" style="margin-top:8px">Nearly equal weight between disease-targeted ideas and platform tech. The picks and shovels of biology.</p><div class="stat" style="margin-top:14px"><div class="n n--green" style="font-size:30px">89</div><div class="l">Health + research tools</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">B // Two</div><h3 style="margin-top:8px;font-size:18px">Climate &amp; food, a second wave</h3><p class="p" style="margin-top:8px">Crop stress, plant tools, waste valorisation, biogas, plastics, water quality, monitoring.</p><div class="stat" style="margin-top:14px"><div class="n n--green" style="font-size:30px">43</div><div class="l">Climate + food &middot; 25.4%</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">C // Three</div><h3 style="margin-top:8px;font-size:18px">Microbes are the default chassis</h3><p class="p" style="margin-top:8px">Bacteria, fungi, yeast, mycelium: fast, tractable, low-cost, suited to short loops.</p><div class="stat" style="margin-top:14px"><div class="n n--green" style="font-size:30px">56</div><div class="l">Microbial &middot; 33.1%</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">D // Four</div><h3 style="margin-top:8px;font-size:18px">AI in hybrid workflows</h3><p class="p" style="margin-top:8px">Most AI proposals pair wet-lab validation, diagnostics, or automation with the model.</p><div class="stat" style="margin-top:14px"><div class="n n--green" style="font-size:30px">17</div><div class="l">AI-foregrounded &middot; 10.1%</div></div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">E // Five</div><h3 style="margin-top:8px;font-size:18px">Distributed, not a side story</h3><p class="p" style="margin-top:8px">Explicit community, shared, open-access, or indie lab access across 22 countries.</p><div class="stat" style="margin-top:14px"><div class="n n--green" style="font-size:30px">53</div><div class="l">Community-lab anchored</div></div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Top three, up close','&sect; 03')+
"""
  <h2 class="h2" style="margin-top:14px">Where the pool is thickest</h2>
  <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px">
    <div class="panel" style="display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:start"><div class="num" style="font-family:var(--font-futura);font-weight:700;font-size:34px;color:var(--rgb-red)">01</div><div><h3>Health, Therapeutics &amp; Diagnostics</h3><p class="p" style="margin:8px 0">Heavier on accessibility and unmet need than well-funded commercial areas. Oncology (8), neurodegeneration (6), AMR (5), chronic/metabolic (4), and Lassa/malaria/monkeypox/HIV (4) skewed toward African applicants.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><span class="tag">Oncology</span><span class="tag">Neuro</span><span class="tag">AMR</span><span class="tag">Metabolic</span><span class="tag">Infectious</span></div></div><div style="text-align:right"><div class="stat"><div class="n n--red" style="font-size:34px">31.4%</div><div class="l">53 apps</div></div></div></div>
    <div class="panel" style="display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:start"><div class="num" style="font-family:var(--font-futura);font-weight:700;font-size:34px;color:var(--rgb-red)">02</div><div><h3>Lab Tools, Hardware &amp; Open Infrastructure</h3><p class="p" style="margin:8px 0">The signature community-biotech category: decentralising centralised infrastructure, radical cost reduction, open hardware, and methods that lower the barrier for the next experimenter.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><span class="tag">DNA synthesis</span><span class="tag">Open hardware</span><span class="tag">DIY reagents</span><span class="tag">Cost reduction</span></div></div><div style="text-align:right"><div class="stat"><div class="n" style="font-size:34px">18.3%</div><div class="l">31 apps</div></div></div></div>
    <div class="panel" style="display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:start"><div class="num" style="font-family:var(--font-futura);font-weight:700;font-size:34px;color:var(--rgb-red)">03</div><div><h3>Food, Agriculture &amp; Fermentation</h3><p class="p" style="margin:8px 0">From industrial fermentation (yeast, Yarrowia, Pichia) through solid-state food work to crop resilience and waste valorisation.</p><div style="display:flex;flex-wrap:wrap;gap:8px"><span class="tag">Fermentation</span><span class="tag">Crop resilience</span><span class="tag">Waste valorisation</span><span class="tag">Food upgrading</span></div></div><div style="text-align:right"><div class="stat"><div class="n" style="font-size:34px">13.6%</div><div class="l">23 apps</div></div></div></div>
  </div>
  <p class="note" style="margin-top:28px">The sharpest applications aren\u2019t trying to replicate industrial pharma in a garage. They\u2019re attacking the exact layer of biotech that keeps independent labs dependent on central suppliers.</p>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Geography','&sect; 04')+
"""
  <h2 class="h2" style="margin-top:14px">Applications came from every world region</h2>
  <p class="lede" style="margin:16px 0 24px">169 submissions, 22+ countries. Strongest in North America, but Africa emerged as the third-largest inferred geography.</p>
  <div>
    <div class="databar"><div class="lbl">North America</div><div class="track"><i style="width:100%"></i></div><div class="val">51.5%</div></div>
    <div class="databar"><div class="lbl">Europe</div><div class="track"><i style="width:36%"></i></div><div class="val">18.8%</div></div>
    <div class="databar"><div class="lbl">Africa</div><div class="track red"><i style="width:22%"></i></div><div class="val">11.5%</div></div>
    <div class="databar"><div class="lbl">Asia</div><div class="track"><i style="width:19%"></i></div><div class="val">9.7%</div></div>
    <div class="databar"><div class="lbl">South America</div><div class="track"><i style="width:9%"></i></div><div class="val">4.8%</div></div>
    <div class="databar"><div class="lbl">Australia / Oceania</div><div class="track"><i style="width:5%"></i></div><div class="val">2.4%</div></div>
    <div class="databar"><div class="lbl">Middle East</div><div class="track"><i style="width:3%"></i></div><div class="val">1.2%</div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Welcoming Cohort 01','&sect; 05')+
"""
  <h2 class="h2" style="margin-top:14px">Seven projects, six countries</h2>
  <p class="lede" style="margin:16px 0 24px">Spanning climate biotech, wound healing, DNA synthesis, mitochondrial therapy, protein design, single-cell platforms, and histology automation. Funded across India, Australia, Mexico, Italy, the United States, and Argentina.</p>
  <div class="grid grid-2" style="margin-bottom:24px">
    <div class="stat"><div class="n n--green">$13,200</div><div class="l">Total funded &middot; 7 projects &middot; 11 builders</div></div>
    <div class="stat"><div class="n">7 / 6</div><div class="l">Projects / countries</div></div>
  </div>
  <div class="grid grid-2">
"""
+grantee('IND &middot; Kishore Ramesh Kumar','Kishore Ramesh Kumar','Neonaar: plant-based cellulose for microplastic-free cosmetics','$1,000')
+grantee('AUS &middot; Khalia Primer','Khalia Primer','Reengineering productive inflammation for chronic diabetic wound healing','$3,000')
+grantee('MEX &middot; David J. Castillo','David J. Castillo','Open-Synth: decentralized enzymatic DNA synthesis','$3,000')
+grantee('ITA &middot; Giulia Sironi','Giulia Sironi','MiTHo: mitochondrial transfer to modulate granulocyte function','$1,200')
+grantee('USA &middot; Nathaniel R. Braffman','N. R. Braffman','Open-access albumin-binding domains for half-life-extended mini protein therapeutics','$2,000')
+grantee('USA &middot; Gaby / Taylor / Randall','Gaby / Taylor / Randall','Domesticating Valonia ventricosa: a giant single-celled lab workhorse','$2,000')
+grantee('ARG &middot; Sasaki / Perez / Hernandez','Sasaki / Perez / Hernandez','Carroucell: automated histological staining carousel','$1,000')
+"""
  </div>
  <p style="margin-top:28px"><a class="btn btn--signal" href="fund-experiments.html">Help enable the next cohort</a> <span class="mono" style="margin-left:10px">Next cohort &mdash; dates to be announced</span></p>
</div></section>
"""
)

# ===================================================================== MESSAGE
_paras = [
 ('first',"Just six months ago, Primordia Grants was still only an idea. A thought experiment shared between the founders of ValleyDAO and Biopunk Community Lab."),
 ('',"ValleyDAO met Biopunk before they moved into Frontier Tower. Both groups were circling the same question from different directions: what would it take for more people to build in biotech?"),
 ('',"ValleyDAO is mostly Europe-centered, and we rarely met anything at this intensity. Biopunk is a self-organized biotech community. Not networking, education, or startup storytelling, but wet-lab access and real experiments. Most people talk about community biotech as a cultural movement. Biopunk made it operational."),
 ('em',"That made the partnership obvious."),
 ('',"Biopunk brought the tacit knowledge of community biotech. How to build a lab, gather people, teach responsible experiments, and put wet-lab work within reach of the people who want to learn it. ValleyDAO brought a track record in alternative biotech funding, scientific review, and running funding programs online. We also move fast on early research."),
 ('',"We reached the same conclusion. Community biotech builders are underserved, and far more capable than the traditional biotech ecosystem assumes."),
 ('',"The conditions around them have also changed. Used lab equipment is more available than it was during the first wave of DIY biology. Protocols, troubleshooting advice, design tools, and scientific literature are easier to access. AI reasoning models are beginning to help young scientists and independent builders frame hypotheses and design experiments. None of this makes biology easy. Biology still humbles everyone. But it does change the threshold for what a serious first experiment can look like."),
 ('',"The previous wave of community biotech was mostly about access: proving that biology did not have to live only inside universities, companies, and government labs. That work built the social and physical infrastructure that made the next wave possible."),
 ('em',"What Primordia has started to see is something different."),
 ('',"The new wave is more builder-led. It is less defined by the right to access biotechnology, and more by the will to use biotechnology to test real ideas. These builders are often young, technically fluent, impatient, and deeply practical. Some have PhDs. Many do not. What they share is not a credential. It is the urge to run the experiment."),
 ('',"Our first cohort was selected from 169 applications. Across those applications we saw a pattern. It still needs proving, but it matters: most builders do not need a full research grant to start. They need enough support to run the killer experiment. The first decisive experiment. The one that tells them whether the idea is real enough to keep going."),
 ('',"In the right environment, that experiment may cost $1,000 to $3,000. It may happen in a community lab, a university maker space, a friendly academic lab, or another compliant low-cost setting. If the result is strong, it can become the basis for follow-on funding from larger philanthropies, venture capital, translational grants, or more ambitious research programs."),
 ('em',"That is the gap Primordia was created to fill."),
 ('',"Software, AI, and digital infrastructure dominate. The next generation of biotech builders wants to work on physical reality again: health, food, manufacturing, materials, energy, climate, and the biology under all of them. They want the smallest credible path from idea to experiment."),
 ('',"We believe this first cohort is more than a collection of small grants. It tests whether a funding layer can sit below traditional grants, accelerators, and venture capital. Fast, light, and built on trust. For people ready to build, who the usual systems cannot yet read."),
 ('',"We are grateful to everyone who backed Primordia before it had a track record, a portfolio, or proof that the thesis would land. We thank the Kris Rockwell Foundation in particular. They gave early support and believed in the mission when we had no dealflow to point to."),
 ('',"Primordia began as a thought experiment. Six months later, it feels like a signal. Builder-led biotech is here. With the right support, the next era of biotechnology comes from far more places, and far more people, than the world expects."),
 ('em',"Primordia is now actively soliciting donations for its next cohort. If you\u2019d like to support, reach out through hi@primordiagrants.com."),
]
def letter_paras(ps):
    out=''
    for cls,t in ps:
        if cls=='first': out+='<p class="first">'+t+'</p>'
        elif cls=='em': out+='<p><span class="em">'+t+'</span></p>'
        else: out+='<p>'+t+'</p>'
    return out
message_body = (
'<div class="letter wrap">'
+kicker('A message from the team')+
'<h1 class="disp" style="font-size:var(--t-h1)">Primordia began as a thought experiment</h1>'
'<div class="by">Authored 25 May 2026 &middot; Albert Anis, Elliot Roth, Zoe Isabel Sen&oacute;n, Morgan Richards</div>'
+letter_paras(_paras)+
'<div class="sign">With gratitude,<br><b>Albert Anis</b> &middot; <b>Elliot Roth</b> &middot; <b>Zoe Isabel Sen&oacute;n</b> &middot; <b>Morgan Richards</b><br>ValleyDAO &times; Biopunk Lab</div>'
'<div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn--signal" href="fund-experiments.html">Support the next cohort</a><a class="btn btn--ghost" href="cohort-1.html">See Cohort 01 outcomes</a></div>'
'</div>'
)

# ===================================================================== GRANTEES
grantees_body = (
'<section class="hero"><div class="wrap">'
+kicker('Grantee handbook &middot; Cohort welcome')+
"""
  <h1 class="disp" style="font-size:var(--t-display)">What happens<br>after you\u2019re funded</h1>
  <p class="lede">The grant is the starting point. Over four months, Primordia helps you complete a meaningful experiment and make it visible enough that others can understand, use, fund, or build on it.</p>
  <div class="grid grid-4" style="margin-top:40px">
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">01</div><h3 style="margin-top:8px;font-size:17px">Fund the first step</h3></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">02</div><h3 style="margin-top:8px;font-size:17px">Make the work visible</h3></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">03</div><h3 style="margin-top:8px;font-size:17px">Connect the builder</h3></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">04</div><h3 style="margin-top:8px;font-size:17px">Help the next step happen</h3></div>
  </div>
  <p class="note" style="margin-top:28px">Small experiments can change the trajectory of a scientist, a tool, or an organism. Primordia exists to make those experiments possible, visible, and connected to people who can help them grow.</p>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('The next four months','&sect; 01')+
"""
  <h2 class="h2" style="margin-top:14px">Complete a meaningful experiment, and make it visible</h2>
  <div class="grid grid-4" style="margin-top:24px">
    <div class="panel"><div class="disp" style="font-size:30px;color:var(--rgb-red)">01</div><h3 style="margin-top:8px">Start</h3><p class="p" style="margin-top:8px">Agreement signed, banking details submitted, grant wired, project baseline clarified.</p><div class="mono" style="color:var(--rgb-green);margin-top:14px">// Welcome session</div></div>
    <div class="panel"><div class="disp" style="font-size:30px;color:var(--rgb-red)">02</div><h3 style="margin-top:8px">Build</h3><p class="p" style="margin-top:8px">Run the experiment, document decisions, track spend, and use office hours for blockers.</p><div class="mono" style="color:var(--rgb-green);margin-top:14px">// Monthly updates</div></div>
    <div class="panel"><div class="disp" style="font-size:30px;color:var(--rgb-red)">03</div><h3 style="margin-top:8px">Share</h3><p class="p" style="margin-top:8px">Post understandable public updates, send monthly check-ins, and let us amplify your work.</p><div class="mono" style="color:var(--rgb-green);margin-top:14px">// Office hours</div></div>
    <div class="panel"><div class="disp" style="font-size:30px;color:var(--rgb-red)">04</div><h3 style="margin-top:8px">Publish</h3><p class="p" style="margin-top:8px">Prepare a final technical/results report and public output. We can help explore DOI and indexing.</p><div class="mono" style="color:var(--rgb-green);margin-top:14px">// Final output</div></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('How we\u2019ll work together','&sect; 02')+
"""
  <h2 class="h2" style="margin-top:14px">A cohort, public momentum, and targeted support</h2>
  <p class="lede" style="margin:16px 0 24px">The program is designed to unblock the specific bottlenecks each project faces.</p>
  <div class="grid grid-3">
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">A // Welcome session</div><h3 style="margin-top:8px;font-size:18px">5-minute presentations</h3><p class="p" style="margin-top:8px">What you\u2019re testing, why it matters, your success metric, your biggest blocker, and what help you need.</p><div class="mono" style="margin-top:14px">// Today</div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">B // Channels</div><h3 style="margin-top:8px;font-size:18px">WhatsApp cohort group</h3><p class="p" style="margin-top:8px">Important updates, quick questions, peer exchange, and staying connected between calls.</p><div class="mono" style="margin-top:14px">// Always-on</div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">C // Office hours</div><h3 style="margin-top:8px;font-size:18px">Bi-weekly, two timezones</h3><p class="p" style="margin-top:8px">Europe + APAC at 10:00 CET, Americas at 18:30 CET. Built for consistency.</p><div class="mono" style="margin-top:14px">// Every other week</div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">D // Public comms</div><h3 style="margin-top:8px;font-size:18px">Elevate your project</h3><p class="p" style="margin-top:8px">Our public-comms lead, Tom Fraczak, will explain how we help amplify your work.</p><div class="mono" style="margin-top:14px">// Post-signature</div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">E // Monthly updates</div><h3 style="margin-top:8px;font-size:18px">Short, honest, public</h3><p class="p" style="margin-top:8px">What you did, what you saw, what changed, and what others should understand.</p><div class="mono" style="margin-top:14px">// Monthly</div></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-red)">F // Advisor matching</div><h3 style="margin-top:8px;font-size:18px">Tell us what you need</h3><p class="p" style="margin-top:8px">Technical support, troubleshooting, BD, scientific feedback, fundraising, partnerships, or publication help.</p><div class="mono" style="margin-top:14px">// On request</div></div>
  </div>
  <p class="note" style="margin-top:24px">Ambition: pair each project with at least one value-adding mentor, advisor, or network connection based on your needs.</p>
</div></section>

<section class="section section--paper"><div class="wrap">
"""
+kicker('Getting seen','&sect; 03')+
"""
  <h2 class="h2" style="margin-top:14px">The grant is the start. The goal is to make it visible</h2>
  <p class="lede" style="margin:16px 0 8px">You don\u2019t need to become a content creator. Share what\u2019s happening, and we\u2019ll handle the rest.</p>
  <div class="snum"><div class="i">01</div><div><h3>Post on LinkedIn and X</h3><p>Announce the grant, what you\u2019re working on, and why it matters. Tag @PrimordiaGrants so we can amplify immediately.</p></div></div>
  <div class="snum"><div class="i">02</div><div><h3>Add it to your LinkedIn profile</h3><p>Add &ldquo;Primordia Grant Recipient&rdquo; to your experience. It signals you\u2019re a funded researcher, not just talking about building.</p></div></div>
  <div class="snum"><div class="i">03</div><div><h3>Share updates once a month</h3><p>A lab photo, a quick result, something that didn\u2019t work. Honest and consistent beats polished.</p></div></div>
  <div class="snum"><div class="i">04</div><div><h3>Fill out the monthly check-in sheet</h3><p>A few minutes each month. We\u2019ll use it to highlight your progress across all Primordia channels.</p></div></div>
  <p class="note" style="margin-top:24px;color:var(--void)">It\u2019s about documenting real science so others can find it, fund it, and build on it. People in this space want honest, consistent updates from researchers in the field &mdash; that\u2019s what gets shared.</p>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Grant essentials','&sect; 04')+
"""
  <h2 class="h2" style="margin-top:14px">The contract matters. The principle is simple</h2>
  <p class="lede" style="margin:16px 0 24px">Use the funds for the approved project, communicate material changes, document the work, and share a substantial public output.</p>
  <div class="grid grid-3">
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">01 // Funds</div><h3 style="margin-top:8px;font-size:17px">Spend on the approved project</h3><p class="p" style="margin-top:8px">Use grant funds only for the approved project and budget. Keep expenses identifiable. Keep receipts.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">02 // Safety</div><h3 style="margin-top:8px;font-size:17px">Stay within scope</h3><p class="p" style="margin-top:8px">Stay within the approved research scope, location, biosafety level, and applicable legal or ethics requirements.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">03 // Changes</div><h3 style="margin-top:8px;font-size:17px">Tell us before major pivots</h3><p class="p" style="margin-top:8px">Flag major changes to scope, methods, team, location, or budget. We can usually work through reasonable pivots.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">04 // Reporting</div><h3 style="margin-top:8px;font-size:17px">Results + financials</h3><p class="p" style="margin-top:8px">Give technical and results reporting, plus final financial accounting. Make the work understandable and useful.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">05 // Open output</div><h3 style="margin-top:8px;font-size:17px">Make results public</h3><p class="p" style="margin-top:8px">Make all or a substantial portion of your results public. A report, preprint, dataset, protocol, or code.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">06 // Publicity</div><h3 style="margin-top:8px;font-size:17px">Acknowledge the program</h3><p class="p" style="margin-top:8px">Acknowledge Primordia, ValleyDAO, and Biopunk Lab where relevant. Primordia may publicize non-confidential award info.</p></div>
  </div>
  <div class="checklist" style="margin-top:32px">
"""
+kicker('Immediate next steps')+
"""
    <ul>
      <li>Complete your digital signature</li><li>Submit your banking details</li>
      <li>Join the WhatsApp cohort group</li><li>Prepare your 5-minute intro</li>
      <li>Send us your support asks</li><li>Block the office-hours sessions in your calendar</li>
    </ul>
  </div>
  <p style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn--signal" href="apply.html">Apply for a grant</a><a class="btn btn--ghost" href="cohort-1.html">See Cohort 01 outcomes</a></p>
</div></section>
"""
)

# ===================================================================== APPLY
def field(qn, fid, label, name, hint, ta=True, opt=False, ph=''):
    lab='<label for="'+fid+'"><span class="qn">'+qn+'</span> '+label+(' <span class="opt">optional</span>' if opt else '')+'</label>'
    h='<p class="hint">'+hint+'</p>' if hint else ''
    if ta: ctl='<textarea id="'+fid+'" name="'+name+'"'+('' if opt else ' required')+'></textarea>'
    else: ctl='<input id="'+fid+'" name="'+name+'" type="text"'+(' placeholder="'+ph+'"' if ph else '')+('' if opt else ' required')+'>'
    return '<div class="field">'+lab+h+ctl+'</div>'

apply_body = (
'<section class="hero"><div class="wrap">'
+kicker('Application')+
"""
  <h1 class="disp" style="font-size:var(--t-display)">Join the<br>primordial soup</h1>
  <p class="lede">Up to $3,000 in flexible microgrants for tightly scoped biology experiments run in community labs. We fund the first decisive experiment, fast.</p>
  """
+'<div style="margin-top:24px"><span class="plate" style="position:static;display:inline-block;background:transparent;color:var(--rgb-red);border:2px solid var(--rgb-red)">'+CYCLE_PLATE+'</span></div>'
+'<p class="note" style="margin-top:16px">'+CYCLE_NOTE+'</p>'
+"""
</div></section>

<section class="section"><div class="wrap narrow">
"""
+kicker('Funding criteria','&sect; 01')+
"""
  <div class="grid grid-2" style="margin-top:14px">
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Within biology</div><p class="p" style="margin-top:8px">A clear experimental plan with an aspiration to solve a real-world problem over time.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Lab access</div><p class="p" style="margin-top:8px">Access to a local or community laboratory. We do not fund projects conducted in home labs.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Capable, credentials optional</div><p class="p" style="margin-top:8px">No bio degree required, but you should be capable of designing and executing the experiment.</p></div>
    <div class="panel"><div class="mono" style="color:var(--rgb-green)">Open by default</div><p class="p" style="margin-top:8px">Grantees share progress through short public updates and lab notes.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap narrow">
"""
+kicker('Application','&sect; 02')+
'<p class="mono" style="margin:14px 0 8px;color:var(--fg2)">Funded teams join a four-month program. <a href="grantees.html" style="color:var(--rgb-blue)">See the grantee handbook.</a></p>'
"""
  <form class="form" name="grant-application" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html">
    <input type="hidden" name="form-name" value="grant-application">
    <p class="hp"><label>Skip: <input name="bot-field"></label></p>
    <div class="row2">
      <div class="field"><label for="name">Name</label><input id="name" name="name" type="text" required></div>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required></div>
    </div>
"""
+field('1.','q1','Project summary &amp; hypothesis','project-summary','In 5&ndash;7 sentences: what problem are you addressing? What are you testing?')
+field('2.','q2','Experimental plan','experimental-plan','What exactly will you do during the grant period? Methods, model system, assay, or computational approach.')
+field('3.','q3','Success criteria &amp; next step','success-criteria','How will you know if this worked, and what is the next experiment if it does?')
+field('4.','q4','Prior work &amp; evidence','prior-work','Key papers, preprints, data, or links that support this approach.',True,True)
+field('5.','q5','Timeline &amp; milestones','timeline-milestones','What are the main milestones over the grant period?')
+'<div class="row2">'
+field('6.','q6','Total amount requested','budget-total','',False,False,'Up to $3,000')
+field('8.','q8','Lab / infrastructure access','lab-access','',False,False,'Physical lab, shared space, cloud compute')
+'</div>'
+field('7.','q7','Budget breakdown','budget-breakdown','What will the funds be spent on? Materials, equipment, services, or compute.')
+field('9.','q9','Community impact','community-impact','How will this benefit the scientific, local, or open-research community?')
+field('10.','q10','Applicant bio &amp; affiliation','applicant-bio','Who are you, and what relevant experience do you bring?')
+"""
    <div><button type="submit" class="btn btn--signal btn--lg">Submit application</button>
    <p class="mono" style="margin-top:10px">Reviewed by a panel of community-lab leaders and practitioners.</p></div>
  </form>
</div></section>
"""
)

# ===================================================================== FUND
fund_body = (
'<section class="hero"><div class="wrap">'
+kicker('Fund experiments')+
"""
  <h1 class="disp" style="font-size:var(--t-display)">Fund experiments</h1>
  <p class="lede">Primordia turns your donations into visible experiments and community capacity, not overhead and jargon.</p>
  <div class="hero__cta">
    <a class="btn btn--signal" href="https://donorbox.org/primordia-microgrants" target="_blank" rel="noopener">Become a donor</a>
    <a class="btn btn--ghost" href="mailto:hi@primordiagrants.com?subject=Themed%20Round%20Partnerships">Partner on a themed round</a>
  </div>
  <p class="mono" style="margin-top:14px">Card, bank, Apple/Google Pay &amp; PayPal via Donorbox</p>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('For donors &amp; partners','&sect; 01')+
"""
  <div class="grid grid-2" style="gap:32px;align-items:start;margin-top:14px">
    <div>
      <div class="snum"><div class="i">+</div><div><p>Pool your contribution with others to support concrete biology experiments in community labs.</p></div></div>
      <div class="snum"><div class="i">+</div><div><p>Pooled donations fund small experiments that would never fit traditional grants.</p></div></div>
      <div class="snum"><div class="i">+</div><div><p>Transparent reporting through public lab notes, summaries, and showcases.</p></div></div>
      <div class="snum"><div class="i">+</div><div><p>Minimal overhead of 5% to support digital service fees.</p></div></div>
      <div class="snum"><div class="i">+</div><div><p>Option for institutions to provide additional capital to match donations.</p></div></div>
    </div>
    <div class="grid" style="gap:16px">
      <div class="panel"><div class="mono" style="color:var(--rgb-green)">// Donations fund</div><h3 style="margin-top:8px">Experiment grants</h3></div>
      <div class="panel"><div class="mono" style="color:var(--rgb-green)">// Donations fund</div><h3 style="margin-top:8px">Lab access</h3></div>
      <div class="panel"><div class="mono" style="color:var(--rgb-green)">// Donations fund</div><h3 style="margin-top:8px">Small program operations</h3></div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Give in crypto','&sect; 02')+
"""
  <h2 class="h2" style="margin-top:14px">Give in crypto</h2>
  <p class="lede" style="margin-top:16px">We accept donations in ETH, USDC, and USDT. Send any of these assets on either network.</p>
  <div class="chain"><div class="lbl">Mainnet Ethereum</div>
    <div class="addr"><span id="eth">0xD920E60b798A2F5a8332799d8a23075c9E77d5F8</span><button class="copy" data-target="eth">Copy</button></div></div>
  <div class="chain"><div class="lbl">Base Network</div>
    <div class="addr"><span id="base">0xe580BfFE2f427479483395fA6A563C07f7ad33Fc</span><button class="copy" data-target="base">Copy</button></div></div>
</div></section>

<section class="section"><div class="wrap">
"""
+kicker('Donor FAQs','&sect; 03')+
'<h2 class="h2" style="margin:14px 0 28px">Questions</h2>'
+faq_html([
  ("D1","Do you accept donations in crypto?","Yes. ETH, USDC, and USDT, on Mainnet Ethereum and Base. The wallet addresses are listed above."),
  ("D2","Can donors remain anonymous?","Yes. Donors can choose to be publicly named, listed without an amount, or remain fully anonymous."),
  ("D3","What can grant funds be used for?","Helping applicants run their proposed experiment: reagents, consumables, basic materials, and lab-related fees such as community-lab membership or bench fees."),
  ("D4","How large are the microgrants?","Up to $3,000 per project. Some awards may be smaller depending on scope, budget, and the size of the funding pool for that cohort."),
])
+'</div></section>'
)

# ===================================================================== THANKS / 404
thanks_body = ('<section class="hero"><div class="wrap center" style="min-height:56vh;display:flex;flex-direction:column;justify-content:center;align-items:center">'
 +kicker('Application received')+
 '<h1 class="disp" style="font-size:var(--t-display);margin:18px 0">Received.</h1>'
 '<p class="lede" style="max-width:44ch">Your beginning is logged. We read every submission and will follow up by email.</p>'
 '<a class="btn btn--ghost mt-6" href="index.html">Back to Primordia</a>'
 '</div></section>')

notfound_body = ('<section class="hero"><div class="wrap center" style="min-height:56vh;display:flex;flex-direction:column;justify-content:center;align-items:center">'
 +kicker('Error')+
 '<h1 class="disp" style="font-size:clamp(72px,18vw,150px);color:var(--rgb-red);margin:10px 0">404</h1>'
 '<p class="lede">This primordium never differentiated. The page isn\u2019t here.</p>'
 '<a class="btn btn--ghost mt-6" href="index.html">Back to Primordia</a>'
 '</div></section>')

# ===================================================================== WRITE
pages = {
 "index.html": page("Primordia Grants — Microgrants for early biology experiments","Primordia funds the first decisive biology experiment — $1,000–$3,000 microgrants run in community labs. A ValleyDAO x Biopunk Lab collaboration.","home",index_body),
 "about.html": page("About — Primordia Grants","A fast, trust-based microgrant layer below traditional grants for builder-led community biotech.","about",about_body),
 "cohort-1.html": page("Cohort 01 Outcomes — Primordia Grants","Q1 2026 report: 169 applications across 22+ countries and Primordia's inaugural cohort of seven funded projects.","cohort",cohort_body),
 "message.html": page("A Message from the Team — Primordia Grants","A message from the Primordia Grants team on builder-led biotech and the gap Primordia was created to fill.","message",message_body),
 "grantees.html": page("Program & Grantee Handbook — Primordia Grants","What happens after a Primordia grant: the four-month program, cohort support, office hours, public comms, and grant essentials.","grantees",grantees_body),
 "apply.html": page("Apply — Primordia Grants","Apply for a Primordia microgrant. Up to $3,000 for an early-stage biology experiment in a community lab.","apply",apply_body),
 "fund-experiments.html": page("Fund Experiments — Primordia Grants","Fund early-stage community biology. Donate via Donorbox or crypto and help move experiments from notebook to bench.","fund",fund_body),
 "thanks.html": page("Thanks — Primordia Grants","Application received.","",thanks_body),
 "404.html": page("Not found — Primordia Grants","Page not found.","",notfound_body),
}
for name, html in pages.items():
    with io.open(OUT+name,"w",encoding="utf-8") as f: f.write(html)
    print(name, len(html))
print("done")
