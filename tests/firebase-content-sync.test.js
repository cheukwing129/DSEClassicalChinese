const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Firestore content sync defaults to read-only review and supports ADC',()=>{
  const source=read('scripts/import_to_firestore.js');
  assert.match(source,/applicationDefault/);
  assert.match(source,/FIREBASE_SERVICE_ACCOUNT_PATH/);
  assert.match(source,/args\.has\('--verify'\) \? 'verify' : 'check'/);
  assert.match(source,/Reviewed catalog:/);
  assert.match(source,/contentMeta/);
  assert.match(source,/catalogVersion/);
  assert.doesNotMatch(source,/questions_v2_template\.csv/);
  assert.doesNotMatch(source,/csv-parser/);
});

test('prune only removes stale question and knowledge-point documents',()=>{
  const source=read('scripts/import_to_firestore.js');
  assert.match(source,/mode === 'prune'/);
  assert.match(source,/report\.collectionName !== 'texts'/);
  assert.match(source,/deleteStale/);
  assert.match(source,/Firestore catalog still differs after synchronization/);
});

test('production catalog workflow requires tests preview explicit confirmation and final verification',()=>{
  const workflow=read('.github/workflows/firebase-content-sync.yml');
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/\npush:/);
  assert.match(workflow,/sync-and-prune/);
  assert.match(workflow,/PRUNE_REVIEWED_CONTENT/);
  assert.match(workflow,/FIREBASE_SERVICE_ACCOUNT_MANJINGO/);
  assert.match(workflow,/google-github-actions\/auth@v3/);
  const testIndex=workflow.indexOf('npm test');
  const checkIndex=workflow.indexOf('import_to_firestore.js --check');
  const pruneIndex=workflow.indexOf('import_to_firestore.js --prune');
  const verifyIndex=workflow.indexOf('import_to_firestore.js --verify');
  assert.ok(testIndex>=0 && checkIndex>testIndex);
  assert.ok(pruneIndex>checkIndex);
  assert.ok(verifyIndex>pruneIndex);
});
