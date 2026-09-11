const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const curriculum = require(path.join(root, 'public', 'curriculum-v1.js'));
const metadata = require(path.join(root, 'public', 'question-metadata-v1.js'));

function source(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function loadCatalog() {
  const context = { window: {}, Map, Set, Array, Object, Number, String, Math };
  vm.createContext(context);
  for (const file of [
    'public/question-pack-02.js',
    'public/question-pack-03.js',
    'public/question-pack-lesson.js',
    'public/question-pack-capacity-01.js',
    'public/content-catalog.js'
  ]) vm.runInContext(source(file), context, { filename:file });
  return context.window.ManjingoContent;
}

function byId(questions, id) {
  const found = questions.find(q => q.id === id);
  assert.ok(found, `missing question ${id}`);
  return found;
}

test('all 222 reviewed questions receive a curriculum mode', () => {
  const catalog = loadCatalog();
  const questions = metadata.annotateAll(catalog.questions);
  assert.equal(questions.length, 222);
  assert.equal(questions.some(q => q.curriculumMode === 'unmapped'), false);

  const validSkills = new Set(curriculum.skills.map(x => x.id));
  for (const q of questions) {
    assert.ok(['core','set-text','advanced'].includes(q.curriculumMode), `${q.id}: bad curriculum mode`);
    assert.equal(Array.isArray(q.skillIds), true, `${q.id}: skillIds missing`);
    if (q.curriculumMode === 'core') assert.ok(q.skillIds.length > 0, `${q.id}: core question has no skill`);
    for (const skillId of q.skillIds) assert.ok(validSkills.has(skillId), `${q.id}: unknown skill ${skillId}`);
  }
});

test('pure set-text recall leaves normal core while transferable questions are salvaged', () => {
  const questions = metadata.annotateAll(loadCatalog().questions);

  assert.equal(byId(questions, 'q008').curriculumMode, 'set-text');
  assert.equal(byId(questions, 'lpq052').curriculumMode, 'set-text');
  assert.equal(byId(questions, 'p2q042').curriculumMode, 'set-text');

  assert.deepEqual(Array.from(byId(questions, 'p2q041').skillIds), ['lex.ancient-modern']);
  assert.deepEqual(Array.from(byId(questions, 'p2q057').skillIds), ['lex.context-inference']);
  assert.deepEqual(Array.from(byId(questions, 'p2q071').skillIds), ['syn.object-fronting']);
  assert.deepEqual(Array.from(byId(questions, 'p2q034').skillIds), ['lex.causative']);
  assert.deepEqual(Array.from(byId(questions, 'cap1q025').skillIds), ['fw.nai']);
  assert.equal(byId(questions, 'cap1q025').normalCore, true);
});

test('advanced argumentation remains available but does not compete in the normal language core', () => {
  const questions = metadata.annotateAll(loadCatalog().questions);
  for (const id of ['lpq055','lpq058','lpq061','p3q045']) {
    const q = byId(questions, id);
    assert.equal(q.curriculumMode, 'advanced');
    assert.equal(q.normalCore, false);
    assert.deepEqual(Array.from(q.skillIds), ['read.argumentation']);
  }
});

test('sentence-level identity catches repeated wording across different question ids and packs', () => {
  const questions = metadata.annotateAll(loadCatalog().questions);

  const yueyang = ['q006','q010','cap1q013','cap1q014','cap1q015','p3q029','p3q041']
    .map(id => byId(questions, id).sourceSentenceId);
  assert.equal(new Set(yueyang).size, 1);

  const loushi = ['p2q071','p2q072','lpq045','p3q030']
    .map(id => byId(questions, id).sourceSentenceId);
  assert.equal(new Set(loushi).size, 1);

  assert.equal(yueyang[0], 'sentence:yueyanglou:wei-siren-wushuiyugui');
  assert.equal(loushi[0], 'sentence:loushiming:helouzhiyou');
});

test('normal core filter excludes set-text recall without deleting the original catalog', () => {
  const catalog = loadCatalog();
  const core = metadata.normalCoreQuestions(catalog.questions);
  const coreIds = new Set(core.map(q => q.id));

  assert.equal(catalog.questions.length, 222);
  assert.ok(core.length > 0 && core.length < catalog.questions.length);
  assert.equal(coreIds.has('q008'), false);
  assert.equal(coreIds.has('lpq053'), false);
  assert.equal(coreIds.has('p2q042'), false);
  assert.equal(coreIds.has('p2q041'), true);
  assert.equal(coreIds.has('p2q071'), true);
  assert.equal(coreIds.has('p3q029'), true);
});

test('audit exposes the content imbalance for later planner work', () => {
  const audit = metadata.audit(loadCatalog().questions);
  assert.equal(audit.total, 222);
  assert.equal(Object.values(audit.byMode).reduce((a,b) => a + b, 0), 222);
  assert.equal(audit.bySourceText.yueyanglou, 33);
  assert.equal(audit.bySourceText.CROSS, 97);
  assert.ok(audit.byMode['set-text'] > 0);
  assert.ok(audit.byMode.core > 0);
});
