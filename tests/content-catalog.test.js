const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'content-catalog.js'), 'utf8');

function loadCatalog(random = 0) {
  const math = Object.create(Math);
  math.random = () => random;
  const context = { window: {}, Map, Set, Array, Object, Number, String, Math: math };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.ManjingoContent;
}

test('teachable knowledge point universe is explicit and independent of question count', () => {
  const catalog = loadCatalog();
  const kpIds = catalog.getKnowledgePointIds({ teachableOnly: true });
  assert.equal(kpIds.length, 23);
  assert.equal(catalog.questions.length, 54);
  assert.ok(kpIds.includes('sx_006'));
  assert.ok(kpIds.includes('kp_virtual_er'));
  assert.ok(kpIds.includes('kp_argument_003'));
});

test('question selection follows plan order and selects at most one question per knowledge point task', () => {
  const catalog = loadCatalog();
  const plan = {
    targetCount: 3,
    items: [
      { kpId: 'sx_006', category: 'review', priority: 1 },
      { kpId: 'kp_yueyang_001', category: 'weak', priority: 2 },
      { kpId: 'kp_virtual_zhi', category: 'new', priority: 3 }
    ]
  };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 10);
  assert.equal(queue.length, 3);
  assert.deepEqual(Array.from(queue, q => q.kpId), ['sx_006', 'kp_yueyang_001', 'kp_virtual_zhi']);
  assert.deepEqual(Array.from(queue, q => q.category), ['review', 'weak', 'new']);
});

test('multiple questions for the same knowledge point can rotate', () => {
  const plan = { targetCount: 1, items: [{ kpId: 'kp_virtual_zhi', category: 'review', priority: 1 }] };
  const firstCatalog = loadCatalog(0);
  const lastCatalog = loadCatalog(0.999999);
  const first = firstCatalog.selectQuestionsForPlan(plan, firstCatalog.questions, 1)[0];
  const last = lastCatalog.selectQuestionsForPlan(plan, lastCatalog.questions, 1)[0];
  assert.equal(first.kpId, 'kp_virtual_zhi');
  assert.equal(last.kpId, 'kp_virtual_zhi');
  assert.notEqual(first.id, last.id);
});

test('planned knowledge points without a question are skipped instead of injecting unrelated questions', () => {
  const catalog = loadCatalog();
  const plan = {
    targetCount: 2,
    items: [
      { kpId: 'kp_yueyang_002', category: 'new', priority: 3 },
      { kpId: 'sx_001', category: 'review', priority: 1 }
    ]
  };
  const queue = catalog.selectQuestionsForPlan(plan, catalog.questions, 10);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].kpId, 'sx_001');
});
