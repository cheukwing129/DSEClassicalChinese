const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const diversity = require(path.join(__dirname, '..', 'public', 'question-diversity-v1.js'));

function q(id, sourceTextId, sourceSentenceId) {
  return { id, sourceTextId, sourceSentenceId };
}

test('same named source is capped at two when alternatives exist', () => {
  const candidates = [
    q('y1','yueyanglou','yy:1'),
    q('y2','yueyanglou','yy:2'),
    q('y3','yueyanglou','yy:3'),
    q('y4','yueyanglou','yy:4'),
    q('c1','caogui','cg:1'),
    q('t1','taohuayuan','th:1'),
    q('l1','loushiming','ls:1'),
    q('m1','maqianlishuo','mq:1')
  ];
  const selected = diversity.select(candidates, 6);
  const measured = diversity.measure(selected);
  assert.equal(selected.length, 6);
  assert.equal(measured.sourceCounts.yueyanglou, 2);
  assert.deepEqual(selected.map(x => x.id), ['y1','y2','c1','t1','l1','m1']);
});

test('different question ids using the same sentence count as one exposure', () => {
  const candidates = [
    q('a1','yueyanglou','sentence:yueyanglou:wei'),
    q('a2','yueyanglou','sentence:yueyanglou:wei'),
    q('b1','caogui','sentence:caogui:yu'),
    q('c1','taohuayuan','sentence:taohua:qiong')
  ];
  const selected = diversity.select(candidates, 3);
  assert.deepEqual(selected.map(x => x.id), ['a1','b1','c1']);
});

test('recent sentence history is avoided when fresh alternatives exist', () => {
  const candidates = [
    q('old','caogui','sentence:caogui:old'),
    q('fresh1','taohuayuan','sentence:taohua:1'),
    q('fresh2','loushiming','sentence:loushi:1')
  ];
  const selected = diversity.select(candidates, 2, {
    avoidSentenceIds:['sentence:caogui:old']
  });
  assert.deepEqual(selected.map(x => x.id), ['fresh1','fresh2']);
});

test('CROSS and unresolved mixed items are not treated as one giant source bucket', () => {
  const candidates = [
    q('x1','CROSS','sentence:x:1'),
    q('x2','CROSS','sentence:x:2'),
    q('x3','CROSS','sentence:x:3'),
    q('x4','CROSS','sentence:x:4')
  ];
  const selected = diversity.select(candidates, 4);
  assert.equal(selected.length, 4);
});

test('last-resort fill reaches target when only one source is available', () => {
  const candidates = [
    q('y1','yueyanglou','yy:1'),
    q('y2','yueyanglou','yy:2'),
    q('y3','yueyanglou','yy:3'),
    q('y4','yueyanglou','yy:4')
  ];
  const selected = diversity.select(candidates, 4);
  assert.deepEqual(selected.map(x => x.id), ['y1','y2','y3','y4']);
});

test('duplicate question ids are never emitted even during fallback', () => {
  const candidates = [
    q('same','yueyanglou','yy:1'),
    q('same','caogui','cg:1'),
    q('other','taohuayuan','th:1')
  ];
  const selected = diversity.select(candidates, 3);
  assert.deepEqual(selected.map(x => x.id), ['same','other']);
});
