const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const catalogSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'content-catalog.js'), 'utf8');
const pack02Source = fs.readFileSync(path.join(__dirname, '..', 'public', 'question-pack-02.js'), 'utf8');
const pack03Source = fs.readFileSync(path.join(__dirname, '..', 'public', 'question-pack-03.js'), 'utf8');
const lessonPackSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'question-pack-lesson.js'), 'utf8');
const capacityPackSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'question-pack-capacity-01.js'), 'utf8');

const EARLY_STAGE_KPS = [
  'kp_yueyang_001', 'kp_yueyang_004', 'gj_004', 'sx_001', 'kp_translation_001',
  'gj_005', 'cy_004', 'cy_006', 'kp_yueyang_context', 'kp_taohua_discovery'
];

function loadContext() {
  const context = { window: {}, Map, Set, Array, Object, Number, String, Math };
  vm.createContext(context);
  vm.runInContext(pack02Source, context);
  vm.runInContext(pack03Source, context);
  vm.runInContext(lessonPackSource, context);
  vm.runInContext(capacityPackSource, context);
  vm.runInContext(catalogSource, context);
  return context;
}

function loadCatalog() {
  return loadContext().window.ManjingoContent;
}

test('local catalog contains 241 questions and an explicit knowledge point universe', () => {
  const catalog = loadCatalog();
  const kpIds = catalog.getKnowledgePointIds({ teachableOnly: true });
  assert.equal(catalog.questions.length, 241);
  assert.equal(kpIds.length, 59);
  assert.ok(kpIds.includes('sx_006'));
  assert.ok(kpIds.includes('kp_caogui_strategy'));
  assert.ok(kpIds.includes('kp_p3_translation'));
});

test('capacity pack adds 28 valid explained questions with unique ids', () => {
  const context = loadContext();
  const pack = context.window.ManjingoQuestionPackCapacity01;
  assert.equal(pack.questions.length, 28);
  assert.equal(new Set(pack.questions.map(q => q.id)).size, 28);
  for (const q of pack.questions) {
    assert.ok(q.kpId);
    assert.ok(q.q);
    assert.ok(q.a);
    assert.ok(q.explanation);
    if (q.type === 'choice') {
      assert.ok(Array.isArray(q.o));
      assert.ok(q.o.includes(q.a), `${q.id} answer must appear in options`);
    }
  }
});

test('all local question ids remain unique', () => {
  const catalog = loadCatalog();
  const ids = catalog.questions.map(q => String(q.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('every local question points to a known teachable knowledge point', () => {
  const catalog = loadCatalog();
  const kpIds = new Set(catalog.getKnowledgePointIds({ teachableOnly: true }));
  const unknown = catalog.questions.filter(q => !kpIds.has(q.kpId));
  assert.deepEqual(Array.from(unknown), []);
});

test('every teachable knowledge point has at least three practice questions', () => {
  const catalog = loadCatalog();
  const counts = new Map();
  catalog.questions.forEach(q => counts.set(q.kpId, (counts.get(q.kpId) || 0) + 1));
  const underfilled = catalog.knowledgePoints.filter(kp => kp.teachable && (counts.get(kp.kpId) || 0) < 3);
  assert.deepEqual(Array.from(underfilled), []);
});

test('intro and words stages now have at least six questions per knowledge point', () => {
  const catalog = loadCatalog();
  const counts = new Map();
  catalog.questions.forEach(q => counts.set(q.kpId, (counts.get(q.kpId) || 0) + 1));
  const underfilled = EARLY_STAGE_KPS.filter(kpId => (counts.get(kpId) || 0) < 6);
  assert.deepEqual(underfilled, []);
  assert.deepEqual(
    EARLY_STAGE_KPS.map(kpId => [kpId, counts.get(kpId)]),
    [
      ['kp_yueyang_001', 6], ['kp_yueyang_004', 6], ['gj_004', 6], ['sx_001', 6], ['kp_translation_001', 6],
      ['gj_005', 6], ['cy_004', 6], ['cy_006', 6], ['kp_yueyang_context', 6], ['kp_taohua_discovery', 6]
    ]
  );
});

test('question selection follows plan order and selects at most one question per knowledge point task', () => {
  const catalog = loadCatalog();
  const plan = {
    targetCount: 3,
    items: [
      { kpId: 'kp_caogui_strategy', category: 'review', priority: 1 },
      { kpId: 'kp_yueyang_001', category: 'weak', priority: 2 },
      { kpId: 'kp_p3_translation', category: 'new', priority: 3 }
    ]
  };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 10);
  assert.equal(queue.length, 3);
  assert.deepEqual(Array.from(queue, q => q.kpId), ['kp_caogui_strategy', 'kp_yueyang_001', 'kp_p3_translation']);
  assert.deepEqual(Array.from(queue, q => q.category), ['review', 'weak', 'new']);
});

test('misconception review selects the highest-priority previously missed question', () => {
  const catalog = loadCatalog();
  const plan = {
    targetCount: 1,
    items: [{
      kpId: 'kp_p3_yi',
      category: 'review',
      priority: 1,
      misconceptionQuestionIds: ['p3q009', 'p3q010']
    }]
  };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 1);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, 'p3q009');
  assert.equal(queue[0].misconceptionReview, true);
});

test('multiple questions for one knowledge point can rotate when there is no misconception target', () => {
  const catalog = loadCatalog();
  const plan = { targetCount: 1, items: [{ kpId: 'kp_caogui_strategy', category: 'review', priority: 1 }] };
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 1);
    seen.add(queue[0].id);
  }
  assert.ok(seen.size > 1);
});

test('planned knowledge points without a question are skipped instead of injecting unrelated questions', () => {
  const catalog = loadCatalog();
  const plan = {
    targetCount: 2,
    items: [
      { kpId: 'missing_kp', category: 'new', priority: 3 },
      { kpId: 'sx_001', category: 'review', priority: 1 }
    ]
  };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 10);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].kpId, 'sx_001');
});
