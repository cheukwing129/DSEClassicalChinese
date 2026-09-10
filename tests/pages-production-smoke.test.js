const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Pages smoke uses real Firebase auth but never submits a valid answer',()=>{
  const source=read('scripts/smoke_pages_api.mjs');
  assert.match(source,/accounts:signUp/);
  assert.match(source,/accounts:delete/);
  assert.match(source,/\/api\/health/);
  assert.match(source,/\/api\/daily-plan/);
  assert.match(source,/\/api\/due-knowledge-points/);
  assert.match(source,/\/api\/submit-answer/);
  assert.match(source,/body: '\{\}'/);
  assert.match(source,/expected HTTP 400/);
  assert.doesNotMatch(source,/isCorrect:\s*(true|false)/);
});

test('production smoke workflow is gated and carries no Firebase server secrets',()=>{
  const workflow=read('.github/workflows/pages-production-smoke.yml');
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/ENABLE_PAGES_SMOKE == 'true'/);
  assert.match(workflow,/npm run smoke:pages/);
  assert.match(workflow,/MANJINGO_BASE_URL/);
  assert.doesNotMatch(workflow,/FIREBASE_PRIVATE_KEY/);
  assert.doesNotMatch(workflow,/FIREBASE_CLIENT_EMAIL/);
});

test('package exposes the production smoke command',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['smoke:pages'],'node scripts/smoke_pages_api.mjs');
});
