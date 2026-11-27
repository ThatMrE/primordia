import assert from 'node:assert/strict';
import test from 'node:test';
import { assignReviews, communityScore, hasConflict, redactForCommunity, reviewScore, validateScores } from '../scripts/community-core.mjs';

const app = (id, email, location, extra = '') => ({ id, email, location, name: `Applicant ${id}`, title: `Project ${id}`, answers: [{ key: 'plan', label: 'Plan', text: `cell culture assay ${extra}` }] });
const reviewer = (email, location, fields = '', conflicts = '') => ({ email, location, fields, conflicts, active: true });

test('conflicts: same email, same institution domain, same city, declared names', () => {
  assert.ok(hasConflict(reviewer('a@uni.edu', 'Lima'), app('1', 'b@uni.edu', 'Oslo')));
  assert.ok(!hasConflict(reviewer('a@gmail.com', 'Lima'), app('1', 'b@gmail.com', 'Oslo')));
  assert.ok(hasConflict(reviewer('a@x.org', 'Milan, Italy'), app('1', 'b@y.org', 'Milan')));
  assert.ok(hasConflict(reviewer('a@x.org', 'Lima', '', 'Biofab'), app('1', 'b@y.org', 'Oslo', 'at Mexico City Biofab')));
});

test('assignment: three reviewers each, load capped, applicants of this cycle excluded', () => {
  const apps = Array.from({ length: 6 }, (_, i) => app(String(i), `p${i}@lab${i}.org`, `City${i}`));
  const reviewers = Array.from({ length: 5 }, (_, i) => reviewer(`r${i}@rev${i}.org`, `Town${i}`));
  reviewers.push(reviewer('p0@lab0.org', 'Elsewhere'));
  const { pairs, short } = assignReviews(apps, reviewers, { perApp: 3, perReviewer: 4 });
  assert.equal(short.length, 0);
  assert.equal(pairs.length, 18);
  assert.ok(!pairs.some((p) => p.reviewerEmail === 'p0@lab0.org'));
  const load = {};
  for (const p of pairs) load[p.reviewerEmail] = (load[p.reviewerEmail] || 0) + 1;
  assert.ok(Object.values(load).every((n) => n <= 4));
  for (const a of apps) assert.equal(new Set(pairs.filter((p) => p.applicationId === a.id).map((p) => p.reviewerEmail)).size, 3);
});

test('assignment reports applications that cannot get enough reviewers', () => {
  const { short } = assignReviews([app('1', 'a@x.org', 'Oslo')], [reviewer('r@y.org', 'Lima')]);
  assert.deepEqual(short, [{ applicationId: '1', got: 1 }]);
});

test('redaction hides name, email, location and lab', () => {
  const r = redactForCommunity({ ...app('1', 'a@x.org', 'Oslo'), lab: 'Oslo Bio Commons', amount: '$1,900', ai: { score: 80 } });
  assert.deepEqual(Object.keys(r).sort(), ['amount', 'answers', 'id', 'title']);
});

test('scores: validation, 0 to 100 scale, trimmed community score', () => {
  const all = { clarity: 5, feasibility: 5, lab_access: 5, capability: 5, openness: 5, budget_fit: 5, impact: 5 };
  assert.equal(reviewScore(all), 100);
  assert.equal(reviewScore({ ...all, clarity: 1, feasibility: 1, lab_access: 1, capability: 1, openness: 1, budget_fit: 1, impact: 1 }), 0);
  assert.throws(() => validateScores({ ...all, impact: 6 }));
  assert.equal(communityScore([50, 60]), null);
  assert.deepEqual(communityScore([50, 60, 70]), { score: 60, reviews: 3 });
  assert.deepEqual(communityScore([0, 60, 60, 60, 100]), { score: 60, reviews: 5 });
});
