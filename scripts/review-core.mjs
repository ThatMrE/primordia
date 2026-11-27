// Pure logic for the grant review deck. No network calls live here, so the
// node test runner can cover field mapping, normalisation and the fallback
// scorer without Airtable or Claude.

export const DECISIONS = ['Approve', 'Reject', 'Later'];

export const AI_FIELDS = {
  score: 'AI Score',
  verdict: 'AI Verdict',
  summary: 'AI Summary',
  strengths: 'AI Strengths',
  concerns: 'AI Concerns',
  scoredAt: 'AI Scored At',
};

export const DECISION_FIELDS = {
  decision: 'Decision',
  note: 'Review Note',
  decidedAt: 'Decided At',
};

// Header fields that get hoisted out of the answer list and onto the card header.
const HEADER_MATCHERS = {
  title: /^(project|title|project ?title|project ?name|experiment)$/i,
  name: /^(name|applicant|applicant ?name|full ?name|your ?name)$/i,
  email: /e-?mail/i,
  amount: /(amount|total ?requested|budget-?total|requested|grant ?size)/i,
  location: /(location|country|city|where)/i,
  lab: /(lab|infrastructure|facility)/i,
};

const FIELD_LABELS = {
  'project-summary': 'Project summary and hypothesis',
  'experimental-plan': 'Experimental plan',
  'success-criteria': 'Success criteria and next step',
  'prior-work': 'Prior work and evidence',
  'timeline-milestones': 'Timeline and milestones',
  'budget-total': 'Total amount requested',
  'budget-breakdown': 'Budget breakdown',
  'lab-access': 'Lab or infrastructure access',
  'community-impact': 'Community impact',
  'applicant-bio': 'Applicant bio and affiliation',
};

export function labelFor(fieldName) {
  if (FIELD_LABELS[fieldName]) return FIELD_LABELS[fieldName];
  return fieldName.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

function asText(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if ('name' in value) return String(value.name);
    if ('url' in value) return String(value.url);
    return '';
  }
  return String(value).trim();
}

const INTERNAL = new Set([
  ...Object.values(AI_FIELDS),
  ...Object.values(DECISION_FIELDS),
  'Created', 'Created time', 'Submitted', 'Submission reference', 'Reference',
]);

/**
 * Turn one Airtable record (or demo row) into the shape the deck renders.
 * Unknown fields are kept as answers so nothing an applicant wrote is hidden.
 */
export function normaliseRecord(record) {
  const fields = record.fields || {};
  const out = {
    id: record.id,
    title: '',
    name: '',
    email: '',
    amount: '',
    location: '',
    lab: '',
    answers: [],
    ai: null,
    decision: asText(fields[DECISION_FIELDS.decision]) || null,
    note: asText(fields[DECISION_FIELDS.note]) || '',
    createdTime: record.createdTime || null,
  };
  for (const [key, raw] of Object.entries(fields)) {
    if (INTERNAL.has(key)) continue;
    const text = asText(raw);
    if (!text) continue;
    const header = Object.entries(HEADER_MATCHERS).find(([slot, re]) => !out[slot] && re.test(key));
    if (header) { out[header[0]] = text; continue; }
    out.answers.push({ key, label: labelFor(key), text });
  }
  if (!out.title) {
    const summary = out.answers.find((a) => /summary|hypothesis|describe/i.test(a.key)) || out.answers[0];
    out.title = summary ? firstSentence(summary.text) : (out.name || 'Untitled application');
  }
  if (fields[AI_FIELDS.score] != null && fields[AI_FIELDS.score] !== '') {
    out.ai = {
      score: Number(fields[AI_FIELDS.score]),
      verdict: asText(fields[AI_FIELDS.verdict]) || verdictFor(Number(fields[AI_FIELDS.score])),
      summary: asText(fields[AI_FIELDS.summary]),
      strengths: splitLines(fields[AI_FIELDS.strengths]),
      concerns: splitLines(fields[AI_FIELDS.concerns]),
      source: 'stored',
    };
  }
  return out;
}

export function firstSentence(text, max = 110) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const stop = clean.search(/[.!?](\s|$)/);
  let out = stop > 20 ? clean.slice(0, stop) : clean;
  if (out.length > max) out = out.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return out;
}

function splitLines(value) {
  const text = asText(value);
  return text ? text.split(/\n+/).map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean) : [];
}

export function verdictFor(score) {
  if (score >= 75) return 'Strong';
  if (score >= 55) return 'Promising';
  if (score >= 35) return 'Weak';
  return 'Out of scope';
}

export function parseAmount(text) {
  const m = String(text || '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Plain text of an application for the model prompt. */
export function applicationText(app) {
  const lines = [];
  if (app.title) lines.push(`Title: ${app.title}`);
  if (app.name) lines.push(`Applicant: ${app.name}`);
  if (app.location) lines.push(`Location: ${app.location}`);
  if (app.amount) lines.push(`Amount requested: ${app.amount}`);
  if (app.lab) lines.push(`Lab access: ${app.lab}`);
  for (const a of app.answers) lines.push(`\n## ${a.label}\n${a.text}`);
  return lines.join('\n');
}

export const RUBRIC = `You are a reviewer for Primordia Grants, a community-biotech microgrant program.
Primordia funds the first decisive experiment: a tightly scoped biology experiment, run on a community-lab bench, with a budget of $1,000 to $3,000 over three to four months.

Funding criteria:
1. Within biology, with a clear experimental plan and an aspiration to solve a real-world problem over time.
2. Lab access: a local or community laboratory. Home labs are not funded.
3. Capable applicant. No degree required, but the person must be able to design and run the experiment.
4. Open by default: the applicant will share progress and results publicly.
5. Budget fit: at or under $3,000, spent on materials, equipment, services or compute for this experiment.
6. Scope: one decisive experiment with explicit success criteria, not a whole research program.

Score each criterion 1 to 5. Give an overall score from 0 to 100 that a busy panel can sort by.
Be concrete and fair. Quote or paraphrase the application rather than guessing. Flag safety, ethics or biosafety issues under concerns.
Write for a reviewer who has twenty seconds per card: short sentences, no jargon that the application itself does not use.`;

export const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    one_line: { type: 'string', description: 'One sentence a reviewer reads first.' },
    strengths: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    concerns: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    questions_for_panel: { type: 'array', items: { type: 'string' }, maxItems: 3 },
    criteria: {
      type: 'object',
      properties: {
        clarity: { type: 'integer', minimum: 1, maximum: 5 },
        feasibility: { type: 'integer', minimum: 1, maximum: 5 },
        lab_access: { type: 'integer', minimum: 1, maximum: 5 },
        capability: { type: 'integer', minimum: 1, maximum: 5 },
        openness: { type: 'integer', minimum: 1, maximum: 5 },
        budget_fit: { type: 'integer', minimum: 1, maximum: 5 },
        impact: { type: 'integer', minimum: 1, maximum: 5 },
      },
      required: ['clarity', 'feasibility', 'lab_access', 'capability', 'openness', 'budget_fit', 'impact'],
      additionalProperties: false,
    },
  },
  required: ['score', 'one_line', 'strengths', 'concerns', 'questions_for_panel', 'criteria'],
  additionalProperties: false,
};

/** Shape a model result (or heuristic result) into what the card shows and Airtable stores. */
export function toAssessment(result, source) {
  const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
  return {
    score,
    verdict: verdictFor(score),
    summary: String(result.one_line || '').trim(),
    strengths: (result.strengths || []).map(String).filter(Boolean).slice(0, 4),
    concerns: (result.concerns || []).map(String).filter(Boolean).slice(0, 4),
    questions: (result.questions_for_panel || []).map(String).filter(Boolean).slice(0, 3),
    criteria: result.criteria || null,
    source,
    scoredAt: new Date().toISOString(),
  };
}

/**
 * Deterministic fallback used when no Claude key is configured. It is a
 * completeness check, not a judgement, and the UI labels it as such.
 */
export function heuristicScore(app) {
  const text = applicationText(app).toLowerCase();
  const words = text.split(/\s+/).length;
  const amount = parseAmount(app.amount);
  const has = (re) => re.test(text);
  const criteria = {
    clarity: clamp(1 + Math.round(Math.min(words, 900) / 225)),
    feasibility: clamp(2 + (has(/\b(assay|protocol|pcr|sequenc|culture|measure|sample|control)\w*/) ? 2 : 0) + (has(/milestone|week|month/) ? 1 : 0)),
    lab_access: has(/home lab|kitchen|garage|bedroom/) ? 1 : has(/community lab|biolab|makerspace|university|institute|shared lab|lab space|core facility/) ? 5 : 3,
    capability: clamp(2 + (has(/phd|msc|bsc|degree|years|published|experience|postdoc|technician|engineer/) ? 2 : 0) + (has(/previous|before|prior/) ? 1 : 0)),
    openness: has(/open[- ]source|preprint|protocols?\.io|public|share|github|open access|blog/) ? 5 : 3,
    budget_fit: amount == null ? 2 : amount > 3000 ? 1 : amount >= 500 ? 5 : 3,
    impact: clamp(2 + (has(/community|local|open|accessib|low[- ]cost|afford|global south|underserved/) ? 2 : 0) + (has(/patient|farmer|clinic|environment|diagnos/) ? 1 : 0)),
  };
  const total = Object.values(criteria).reduce((a, b) => a + b, 0);
  const score = Math.round((total / 35) * 100);
  const strengths = [];
  const concerns = [];
  if (criteria.lab_access >= 5) strengths.push('Names a lab or shared facility.');
  if (criteria.budget_fit >= 5) strengths.push(`Budget of ${app.amount} fits the $3,000 ceiling.`);
  if (criteria.openness >= 5) strengths.push('Commits to sharing results openly.');
  if (criteria.feasibility >= 4) strengths.push('Describes concrete methods and milestones.');
  if (criteria.lab_access <= 1) concerns.push('Mentions a home or kitchen setup. Primordia does not fund home labs.');
  if (amount != null && amount > 3000) concerns.push(`Requests ${app.amount}, above the $3,000 ceiling.`);
  if (amount == null) concerns.push('No clear amount requested.');
  if (criteria.clarity <= 2) concerns.push('Short answers. The panel may need to ask for detail.');
  if (criteria.openness <= 3) concerns.push('Does not say how results will be shared.');
  return toAssessment({
    score,
    one_line: 'Completeness check only. Add a Claude API key for a real assessment.',
    strengths,
    concerns,
    questions_for_panel: [],
    criteria,
  }, 'heuristic');
}

function clamp(n) { return Math.max(1, Math.min(5, n)); }

/** Sort: unreviewed first by AI score (unscored last), then the rest. */
export function rankApplications(apps) {
  return [...apps].sort((a, b) => {
    const da = a.decision ? 1 : 0;
    const db = b.decision ? 1 : 0;
    if (da !== db) return da - db;
    const sa = a.ai ? a.ai.score : -1;
    const sb = b.ai ? b.ai.score : -1;
    if (sa !== sb) return sb - sa;
    return String(a.createdTime || '').localeCompare(String(b.createdTime || ''));
  });
}

/** Fields to write back to Airtable, limited to the columns the table actually has. */
export function assessmentFields(assessment, existingFieldNames) {
  const want = {
    [AI_FIELDS.score]: assessment.score,
    [AI_FIELDS.verdict]: assessment.verdict,
    [AI_FIELDS.summary]: assessment.summary,
    [AI_FIELDS.strengths]: assessment.strengths.join('\n'),
    [AI_FIELDS.concerns]: assessment.concerns.join('\n'),
    [AI_FIELDS.scoredAt]: assessment.scoredAt,
  };
  return pickExisting(want, existingFieldNames);
}

export function decisionFields(decision, note, existingFieldNames) {
  if (!DECISIONS.includes(decision)) throw new Error(`Unknown decision: ${decision}`);
  const want = {
    [DECISION_FIELDS.decision]: decision,
    [DECISION_FIELDS.note]: note || '',
    [DECISION_FIELDS.decidedAt]: new Date().toISOString(),
  };
  return pickExisting(want, existingFieldNames);
}

function pickExisting(want, existing) {
  if (!existing) return want;
  const set = new Set(existing);
  return Object.fromEntries(Object.entries(want).filter(([k]) => set.has(k)));
}
