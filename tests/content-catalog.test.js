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
const transferPackSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'question-pack-transfer-01.js'), 'utf8');

function loadContext() {
  const context = { window: {}, Map, Set, Array, Object, Number, String, Math };
  vm.createContext(context);
  vm.runInContext(pack02Source, context);
  vm.runInContext(pack03Source, context);
  vm.runInContext(lessonPackSource, context);
  vm.runInContext(capacityPackSource, context);
  vm.runInContext(transferPackSource, context);
  vm.runInContext(catalogSource, context);
  return context;
}

function loadCatalog() {
  return loadContext().window.ManjingoContent;
}

test('reviewed local catalog contains 268 questions across the 59 teachable knowledge points', () => {
  const catalog = loadCatalog();
  const kpIds = catalog.getKnowledgePointIds({ teachableOnly: true });
  assert.equal(catalog.catalogVersion, 'reviewed-v1');
  assert.equal(catalog.questions.length, 268);
  assert.equal(kpIds.length, 59);
  assert.ok(kpIds.includes('sx_006'));
  assert.ok(kpIds.includes('kp_caogui_strategy'));
  assert.ok(kpIds.includes('kp_p3_translation'));
});

test('capacity pack keeps only validated explained questions', () => {
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

test('transfer packs contain 46 source-aware unseen-context questions', () => {
  const context = loadContext();
  const pack = context.window.ManjingoQuestionPackTransfer01;
  const allowedKps = new Set(['kp_virtual_zhi','kp_virtual_er','kp_virtual_yi','kp_virtual_yu','kp_virtual_qi','kp_virtual_ze','kp_p3_translation','cy_006','kp_p3_ellipsis']);
  assert.equal(pack.kind, 'transfer-core');
  assert.equal(pack.questions.length, 46);
  assert.equal(pack.questions.filter(q => /^tr1q\d{3}$/.test(q.id)).length, 20);
  assert.equal(pack.questions.filter(q => /^tr2q\d{3}$/.test(q.id)).length, 26);
  assert.equal(new Set(pack.questions.map(q => q.id)).size, 46);
  for (const q of pack.questions) {
    assert.match(q.id, /^tr[12]q\d{3}$/);
    assert.ok(allowedKps.has(q.kpId), `${q.id}: transfer pack must attach to a compatible core KP`);
    assert.equal(q.textId, 'CROSS');
    assert.ok(Array.isArray(q.skillIds) && q.skillIds.length > 0, `${q.id}: explicit skillIds required`);
    assert.ok(String(q.sourceTextId || '').trim(), `${q.id}: real source required`);
    assert.notEqual(q.sourceTextId, 'CROSS', `${q.id}: source must not hide behind CROSS`);
    assert.ok(String(q.sourceSentenceId || '').startsWith('sentence:'), `${q.id}: stable sentence id required`);
    assert.equal(q.sourceKind, 'classical-canon');
    assert.ok(q.transferLevel >= 2, `${q.id}: must exercise unseen-context transfer`);
    assert.ok(q.explanation.length >= 12, `${q.id}: explanation required`);
    assert.ok(Array.isArray(q.o) && q.o.includes(q.a), `${q.id}: answer must be one option`);
  }
});

test('foundation pack uses stable ids and no retired temporary filler ids', () => {
  const context = loadContext();
  const pack = context.window.ManjingoQuestionPackLesson;
  const retired = new Set([
    'lpq001','lpq002','lpq003','lpq004','lpq019',
    'lpq022','lpq023','lpq024','lpq025','lpq026','lpq027','lpq028','lpq029','lpq030','lpq031','lpq032','lpq033','lpq034','lpq035',
    'lpq049','lpq050','lpq051'
  ]);
  assert.equal(pack.kind, 'foundation');
  assert.equal(pack.questions.length, 44);
  assert.equal(pack.questions.some(q => retired.has(String(q.id))), false);
  assert.ok(pack.questions.some(q => q.id === 'lpq064'));
  assert.ok(pack.questions.some(q => q.id === 'lpq065'));
  assert.ok(pack.questions.some(q => q.id === 'lpq066'));
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

test('every teachable knowledge point retains at least three curated practice questions', () => {
  const catalog = loadCatalog();
  const counts = new Map();
  catalog.questions.forEach(q => counts.set(q.kpId, (counts.get(q.kpId) || 0) + 1));
  const underfilled = catalog.knowledgePoints.filter(kp => kp.teachable && (counts.get(kp.kpId) || 0) < 3);
  assert.deepEqual(Array.from(underfilled), []);
});

test('base translation questions are attached to translation rather than sentence-pattern mastery', () => {
  const catalog = loadCatalog();
  assert.equal(catalog.questions.find(q => q.id === 'q006').kpId, 'kp_translation_001');
  assert.equal(catalog.questions.find(q => q.id === 'q010').kpId, 'kp_translation_001');
});

test('legacy duplicate-looking p3 knowledge points are presented as transfer or synthesis practice', () => {
  const catalog = loadCatalog();
  const labels = new Map(catalog.knowledgePoints.map(kp => [kp.kpId, kp.content]));
  assert.equal(labels.get('kp_p3_zhi'), '之：跨語境辨析');
  assert.equal(labels.get('kp_p3_yi'), '以：跨語境辨析');
  assert.equal(labels.get('kp_p3_judgment'), '判斷句：跨句辨析');
  assert.equal(labels.get('kp_p3_translation'), '文言翻譯：綜合策略');
});

test('reviewed corrections distinguish the two 其 uses and Cao Gui reasoning', () => {
  const catalog = loadCatalog();
  const q18 = catalog.questions.find(q => q.id === 'p3q018');
  const q19 = catalog.questions.find(q => q.id === 'p3q019');
  const cao = catalog.questions.find(q => q.id === 'p2q044');
  assert.equal(q18.a, '反問語氣（難道）');
  assert.equal(q19.a, '推測語氣（大概／恐怕）');
  assert.match(cao.a, /小惠未遍/);
  assert.match(cao.a, /小信未孚/);
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

test('multiple questions remain available for runtime rotation when there is no misconception target', () => {
  const catalog = loadCatalog();
  const candidates = catalog.questions.filter(q => q.kpId === 'kp_caogui_strategy');
  const plan = { targetCount: 1, items: [{ kpId: 'kp_caogui_strategy', category: 'review', priority: 1 }] };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 1);
  assert.ok(candidates.length > 1);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].kpId, 'kp_caogui_strategy');
  assert.match(catalogSource, /rotation\.rank\(pool\)/);
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
