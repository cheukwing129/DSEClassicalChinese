const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'local-learning.js'), 'utf8');

function makeDateClass(nowIso) {
  const RealDate = Date;
  const fixed = new RealDate(nowIso).getTime();
  return class FakeDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [fixed]));
    }
    static now() { return fixed; }
  };
}

function createEngine({ now = '2026-09-10T12:00:00', initial = {} } = {}) {
  const store = new Map(Object.entries(initial));
  const context = {
    window: {},
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    Date: makeDateClass(now),
    console,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    Map,
    Set
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { engine: context.window.ManjingoLocalLearning, store };
}

function progressState(store) {
  return JSON.parse(store.get('manjingo_progress_cache') || '{}');
}

test('correct local answer awards exactly 8 XP; wrong answer awards 0', () => {
  const { engine } = createEngine();
  const correct = engine.submit('kp_test', true);
  assert.equal(correct.xpEarned, 8);
  assert.equal(correct.totalXp, 8);
  assert.equal(correct.todayXp, 8);

  const wrong = engine.submit('kp_test', false);
  assert.equal(wrong.xpEarned, 0);
  assert.equal(wrong.totalXp, 8);
  assert.equal(wrong.todayXp, 8);
});

test('wrong answers record selected misconception and increment repeats', () => {
  const { engine, store } = createEngine();
  engine.submit('kp_p3_yi', false, {
    questionId: 'p3q009',
    selectedAnswer: '用',
    correctAnswer: '因為'
  });
  engine.submit('kp_p3_yi', false, {
    questionId: 'p3q009',
    selectedAnswer: '用',
    correctAnswer: '因為'
  });
  const record = engine.getKnowledge('kp_p3_yi');
  const key = 'p3q009::用';
  assert.equal(record.misconceptions[key].questionId, 'p3q009');
  assert.equal(record.misconceptions[key].selectedAnswer, '用');
  assert.equal(record.misconceptions[key].correctAnswer, '因為');
  assert.equal(record.misconceptions[key].count, 2);
  assert.equal(record.misconceptions[key].lastAt, '2026-09-10T12:00:00.000Z');
  assert.equal(progressState(store).knowledge.kp_p3_yi.misconceptions[key].count, 2);
});

test('correct misconception review decays weight until the pattern retires', () => {
  const { engine } = createEngine();
  const detail = { questionId: 'p3q009', selectedAnswer: '用', correctAnswer: '因為' };
  engine.submit('kp_p3_yi', false, detail);
  engine.submit('kp_p3_yi', false, detail);

  const firstRepair = engine.submit('kp_p3_yi', true, { questionId: 'p3q009', selectedAnswer: '因為', correctAnswer: '因為' });
  assert.equal(firstRepair.resolvedMisconceptions, 1);
  assert.equal(firstRepair.remainingMisconceptionWeight, 1);
  assert.equal(engine.getKnowledge('kp_p3_yi').misconceptions['p3q009::用'].count, 1);
  assert.deepEqual(Array.from(engine.buildDailyPlan(['kp_p3_yi'], 1).items[0].misconceptionQuestionIds), ['p3q009']);

  const secondRepair = engine.submit('kp_p3_yi', true, { questionId: 'p3q009', selectedAnswer: '因為', correctAnswer: '因為' });
  assert.equal(secondRepair.resolvedMisconceptions, 1);
  assert.equal(secondRepair.remainingMisconceptionWeight, 0);
  assert.equal(engine.getKnowledge('kp_p3_yi').misconceptions['p3q009::用'], undefined);
  assert.deepEqual(Array.from(engine.buildDailyPlan(['kp_p3_yi'], 1).items[0].misconceptionQuestionIds), []);
});

test('synced correct answer can repair misconception without local XP duplication', () => {
  const { engine } = createEngine();
  engine.submit('kp_p3_yi', false, { questionId: 'p3q009', selectedAnswer: '用', correctAnswer: '因為' });
  const before = engine.getProgress();
  const repair = engine.resolveQuestionMisconceptions('kp_p3_yi', 'p3q009');
  const after = engine.getProgress();
  assert.equal(repair.resolvedMisconceptions, 1);
  assert.equal(repair.remainingMisconceptionWeight, 0);
  assert.equal(after.totalXp, before.totalXp);
  assert.equal(after.todayXp, before.todayXp);
});

test('correct answers do not create misconception records', () => {
  const { engine } = createEngine();
  engine.submit('kp_test', true, {
    questionId: 'q1',
    selectedAnswer: 'A',
    correctAnswer: 'A'
  });
  assert.deepEqual(Object.keys(engine.getKnowledge('kp_test').misconceptions), []);
});

test('daily plan orders misconception question ids by repeated error count', () => {
  const initial = {
    totalXp: 0,
    todayXp: 0,
    streak: 0,
    todayDate: '2026-09-10',
    lastGoalDate: null,
    knowledge: {
      kp_p3_yi: {
        mastery: 20,
        repetition: 0,
        easeFactor: 2.3,
        interval: 1,
        nextReviewAt: '2026-09-10T10:00:00.000Z',
        attempts: 5,
        correctCount: 1,
        lastCorrect: false,
        lastAnsweredAt: '2026-09-10T10:00:00.000Z',
        misconceptions: {
          'p3q009::用': { questionId: 'p3q009', selectedAnswer: '用', correctAnswer: '因為', count: 3 },
          'p3q010::因為': { questionId: 'p3q010', selectedAnswer: '因為', correctAnswer: '把／將', count: 1 },
          'p3q009::按照': { questionId: 'p3q009', selectedAnswer: '按照', correctAnswer: '因為', count: 2 }
        }
      }
    }
  };
  const { engine } = createEngine({ initial: { manjingo_progress_cache: JSON.stringify(initial) } });
  const plan = engine.buildDailyPlan(['kp_p3_yi'], 1);
  assert.deepEqual(Array.from(plan.items[0].misconceptionQuestionIds), ['p3q009', 'p3q010']);
});

test('daily goal increments streak once, not on every answer after goal', () => {
  const { engine } = createEngine();
  engine.submit('a', true); // 8
  engine.submit('b', true); // 16
  const goal = engine.submit('c', true); // 24 => goal reached
  assert.equal(goal.streak, 1);
  const extra = engine.submit('d', true); // still same day
  assert.equal(extra.streak, 1);
});

test('consecutive-day goal increments streak', () => {
  const yesterdayState = {
    totalXp: 40,
    todayXp: 24,
    streak: 2,
    todayDate: '2026-09-09',
    lastGoalDate: '2026-09-09',
    knowledge: {}
  };
  const { engine } = createEngine({
    now: '2026-09-10T12:00:00',
    initial: { manjingo_progress_cache: JSON.stringify(yesterdayState) }
  });
  engine.submit('a', true);
  engine.submit('b', true);
  const result = engine.submit('c', true);
  assert.equal(result.streak, 3);
});

test('missing a day resets streak to 1 when goal is reached again', () => {
  const oldState = {
    totalXp: 80,
    todayXp: 24,
    streak: 4,
    todayDate: '2026-09-08',
    lastGoalDate: '2026-09-08',
    knowledge: {}
  };
  const { engine } = createEngine({
    now: '2026-09-10T12:00:00',
    initial: { manjingo_progress_cache: JSON.stringify(oldState) }
  });
  engine.submit('a', true);
  engine.submit('b', true);
  const result = engine.submit('c', true);
  assert.equal(result.streak, 1);
});

test('legacy knowledge state migrates without losing mastery', () => {
  const legacy = {
    kp_old: {
      mastery: 72,
      repetition: 3,
      easeFactor: 2.4,
      interval: 12,
      nextReviewAt: '2026-09-15T12:00:00.000Z',
      attempts: 7,
      correctCount: 5,
      lastCorrect: true,
      lastAnsweredAt: '2026-09-09T12:00:00.000Z'
    }
  };
  const { engine, store } = createEngine({
    initial: { manjingo_learning_state_v1: JSON.stringify(legacy) }
  });
  assert.equal(engine.getKnowledge('kp_old').mastery, 72);
  assert.deepEqual(Object.keys(engine.getKnowledge('kp_old').misconceptions), []);
  assert.equal(progressState(store).knowledge.kp_old.mastery, 72);
});

test('remote gamification sync becomes the rendered local progress source', () => {
  const { engine } = createEngine();
  engine.syncGamification({ totalXp: 120, todayXp: 16, streak: 5 });
  const progress = engine.getProgress();
  assert.equal(progress.totalXp, 120);
  assert.equal(progress.todayXp, 16);
  assert.equal(progress.streak, 5);
  assert.equal(progress.todayDate, '2026-09-10');
  assert.equal(progress.lastGoalDate, null);
});
