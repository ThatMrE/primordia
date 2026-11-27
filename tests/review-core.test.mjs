import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  normaliseRecord, rankApplications, heuristicScore, assessmentFields, decisionFields,
  applicationText, firstSentence, verdictFor, toAssessment, SCORE_SCHEMA,
} from '../scripts/review-core.mjs';

const demo = JSON.parse(await readFile(new URL('../content/review-demo.json', import.meta.url), 'utf8'));

test('sample applications normalise with header fields hoisted and answers kept', () => {
  const app = normaliseRecord(demo.records[0]);
  assert.equal(app.name, 'Amara Oyelaran');
  assert.equal(app.amount, '$2,650');
  assert.match(app.lab, /Ibadan Open Bio/);
  assert.match(app.title, /cassava/i);
  assert.ok(app.answers.some((a) => a.label === 'Experimental plan'));
  assert.ok(!app.answers.some((a) => /email/i.test(a.key)), 'email is not an answer');
  assert.equal(app.decision, null);
});

test('stored AI and decision fields are read back from Airtable records', () => {
  const app = normaliseRecord({ id: 'rec1', fields: {
    Name: 'Someone', 'Project title': 'Thing', 'AI Score': 81, 'AI Summary': 'Good.', 'AI Strengths': 'A\nB', Decision: 'Approve', 'Review Note': 'yes',
  } });
  assert.equal(app.title, 'Thing');
  assert.equal(app.ai.score, 81);
  assert.equal(app.ai.verdict, 'Strong');
  assert.deepEqual(app.ai.strengths, ['A', 'B']);
  assert.equal(app.decision, 'Approve');
  assert.equal(app.note, 'yes');
  assert.ok(!app.answers.some((a) => /^AI |Decision|Review Note/.test(a.key)), 'internal fields stay out of answers');
});

test('ranking puts unreviewed first, highest score first, unscored last', () => {
  const apps = [
    { id: 'a', ai: { score: 40 }, decision: null, createdTime: '2026-01-01' },
    { id: 'b', ai: { score: 90 }, decision: 'Approve', createdTime: '2026-01-02' },
    { id: 'c', ai: null, decision: null, createdTime: '2026-01-03' },
    { id: 'd', ai: { score: 70 }, decision: null, createdTime: '2026-01-04' },
  ];
  assert.deepEqual(rankApplications(apps).map((a) => a.id), ['d', 'a', 'c', 'b']);
});

test('heuristic scorer separates a complete application from a thin one', () => {
  const strong = heuristicScore(normaliseRecord(demo.records[0]));
  const thin = heuristicScore(normaliseRecord(demo.records[6]));
  const oversized = heuristicScore(normaliseRecord(demo.records[3]));
  assert.ok(strong.score > thin.score + 20, `${strong.score} vs ${thin.score}`);
  assert.equal(strong.source, 'heuristic');
  assert.ok(oversized.concerns.some((c) => /above the \$3,000 ceiling/.test(c)));
  assert.ok(oversized.concerns.some((c) => /home/.test(c)));
});

test('write-back only touches columns the table has', () => {
  const assessment = toAssessment({ score: 88, one_line: 'Clear.', strengths: ['x'], concerns: [], questions_for_panel: [], criteria: null }, 'claude');
  const fields = assessmentFields(assessment, ['Name', 'AI Score', 'AI Summary']);
  assert.deepEqual(Object.keys(fields), ['AI Score', 'AI Summary']);
  assert.equal(fields['AI Score'], 88);
  const decision = decisionFields('Reject', 'no lab', ['Decision']);
  assert.deepEqual(decision, { Decision: 'Reject' });
  assert.throws(() => decisionFields('Maybe', '', ['Decision']));
});

test('prompt text and helpers', () => {
  const app = normaliseRecord(demo.records[1]);
  const text = applicationText(app);
  assert.match(text, /^Title: /);
  assert.match(text, /## Experimental plan/);
  assert.equal(firstSentence('We test whether cheap LAMP primers find the virus. Then we scale.'), 'We test whether cheap LAMP primers find the virus');
  assert.ok(firstSentence('word '.repeat(60)).length <= 110);
  assert.equal(verdictFor(80), 'Strong');
  assert.equal(verdictFor(10), 'Out of scope');
  assert.equal(SCORE_SCHEMA.additionalProperties, false);
});
