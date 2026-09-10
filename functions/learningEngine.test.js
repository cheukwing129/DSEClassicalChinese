const test = require('node:test');
const assert = require('node:assert/strict');
const {
  toQuality,
  calculateSM2,
  calculateNextReviewAt,
  calculateMastery,
  calculateConceptMasteryUpdate,
  calculateXp,
  calculateLearningUpdate
} = require('./learningEngine');

test('first correct answer schedules review in 1 day', () => {
  const now = new Date('2026-09-10T12:00:00.000Z');
  const result = calculateLearningUpdate({ prev: {}, isCorrect: true, now });
  assert.equal(result.repetition, 1);
  assert.equal(result.interval, 1);
  assert.equal(result.xpEarned, 8);
  assert.equal(result.nextReviewAt.toISOString(), '2026-09-11T12:00:00.000Z');
});

test('second correct answer schedules review in 6 days', () => {
  const result = calculateSM2(5, { repetition: 1, interval: 1, easeFactor: 2.5 });
  assert.equal(result.repetition, 2);
  assert.equal(result.interval, 6);
});

test('later correct answers grow interval using previous ease factor', () => {
  const result = calculateSM2(5, { repetition: 2, interval: 6, easeFactor: 2.5 });
  assert.equal(result.repetition, 3);
  assert.equal(result.interval, 15);
});

test('wrong answer resets repetition and interval', () => {
  const result = calculateLearningUpdate({
    prev: { mastery: 50, repetition: 4, interval: 30, easeFactor: 2.4 },
    isCorrect: false,
    now: new Date('2026-09-10T12:00:00.000Z')
  });
  assert.equal(result.quality, 0);
  assert.equal(result.repetition, 0);
  assert.equal(result.interval, 1);
  assert.equal(result.mastery, 40);
  assert.equal(result.xpEarned, 0);
});

test('concept mastery mirrors local exponential update and keeps cross-KP coverage', () => {
  const first = calculateConceptMasteryUpdate({
    prev: {},
    conceptKey: 'yi_reason_vs_tool',
    conceptLabel: '「以」：原因義 vs 工具義',
    kpId: 'kp_p3_yi',
    questionId: 'p3q009',
    isCorrect: true,
    now: new Date('2026-09-10T12:00:00.000Z')
  });
  assert.equal(first.mastery, 22);
  assert.equal(first.attempts, 1);
  assert.equal(first.correctCount, 1);
  assert.equal(first.lastCorrect, true);
  assert.equal(first.lastAnsweredAt.toISOString(), '2026-09-10T12:00:00.000Z');

  const second = calculateConceptMasteryUpdate({
    prev: first,
    conceptKey: 'yi_reason_vs_tool',
    kpId: 'kp_virtual_yi',
    questionId: 'q_virtual_yi_reason',
    isCorrect: false,
    now: new Date('2026-09-10T13:00:00.000Z')
  });
  assert.equal(second.mastery, 15);
  assert.equal(second.attempts, 2);
  assert.equal(second.correctCount, 1);
  assert.equal(second.lastCorrect, false);
  assert.deepEqual(second.kpIds.sort(), ['kp_p3_yi', 'kp_virtual_yi']);
  assert.deepEqual(second.questionIds.sort(), ['p3q009', 'q_virtual_yi_reason']);
});

test('ease factor stays within 1.3–3.0', () => {
  assert.equal(calculateSM2(0, { easeFactor: 1.3 }).easeFactor, 1.3);
  assert.equal(calculateSM2(5, { easeFactor: 3.0 }).easeFactor, 3.0);
});

test('quality reflects correctness, hints, and retries', () => {
  assert.equal(toQuality({ isCorrect: false, attemptCount: 1 }), 0);
  assert.equal(toQuality({ isCorrect: false, attemptCount: 2 }), 1);
  assert.equal(toQuality({ isCorrect: true, usedHint: true }), 3);
  assert.equal(toQuality({ isCorrect: true, attemptCount: 2 }), 4);
  assert.equal(toQuality({ isCorrect: true, attemptCount: 1 }), 5);
});

test('mastery is clamped to 0–100', () => {
  assert.equal(calculateMastery({ prevMastery: 4, isCorrect: false }).mastery, 0);
  assert.equal(calculateMastery({ prevMastery: 98, isCorrect: true }).mastery, 100);
});

test('XP rules are stable for normal, hint, retry, and wrong answers', () => {
  assert.equal(calculateXp({ baseXp: 8, isCorrect: true }), 8);
  assert.equal(calculateXp({ baseXp: 8, isCorrect: true, usedHint: true }), 5);
  assert.equal(calculateXp({ baseXp: 8, isCorrect: true, attemptCount: 2 }), 6);
  assert.equal(calculateXp({ baseXp: 8, isCorrect: false }), 0);
});

test('nextReviewAt preserves exact time while adding interval days', () => {
  const next = calculateNextReviewAt(6, new Date('2026-09-10T07:45:30.000Z'));
  assert.equal(next.toISOString(), '2026-09-16T07:45:30.000Z');
});
