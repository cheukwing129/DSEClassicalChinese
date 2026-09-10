const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'content-catalog.js'), 'utf8');

function loadCatalog() {
  const context = { window: {}, Map, Set, Array, Object, Number, String };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.ManjingoContent;
}

test('teachable knowledge point universe is explicit and independent of question count', () => {
  const catalog = loadCatalog();
  const kpIds = catalog.getKnowledgePointIds({ teachableOnly: true });
  assert.equal(kpIds.length, 5);
  assert.equal(catalog.questions.length, 6);
  assert.ok(kpIds.includes('sx_006'));
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
