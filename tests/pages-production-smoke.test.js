const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Pages smoke performs one real reviewed answer and verifies all learning writes',()=>{
  const source=read('scripts/smoke_pages_api.mjs');
  assert.match(source,/accounts:signUp/);
  assert.match(source,/\/api\/health/);
  assert.match(source,/\/api\/daily-plan/);
  assert.match(source,/\/api\/due-knowledge-points/);
  assert.match(source,/\/api\/submit-answer/);
  assert.match(source,/questionId:\s*'q001'/);
  assert.match(source,/kpId:\s*'kp_yueyang_001'/);
  assert.match(source,/isCorrect:\s*true/);
  assert.match(source,/expected 8 XP/);
  assert.match(source,/knowledge\/\$\{validPayload\.kpId\}/);
  assert.match(source,/gamification\/state/);
  assert.match(source,/concepts\/\$\{conceptKey\}/);
  assert.match(source,/answerLogs\/\$\{answerId\}/);
  assert.match(source,/body: '\{\}'/);
  assert.match(source,/expected HTTP 400/);
});

test('production smoke writes cleanup manifest immediately after creating temporary uid',()=>{
  const source=read('scripts/smoke_pages_api.mjs');
  const signup=source.indexOf("const signup = await firebaseIdentity('accounts:signUp'");
  const manifest=source.indexOf('fs.writeFileSync(stateFile');
  const plan=source.indexOf("api('/api/daily-plan'");
  assert.ok(signup>=0 && manifest>signup && plan>manifest);
  assert.doesNotMatch(source,/accounts:delete/);
});

test('cleanup recursively removes temporary Firestore data and Firebase Auth user',()=>{
  const source=read('scripts/cleanup_smoke_user.cjs');
  assert.match(source,/recursiveDelete\(db\.collection\('users'\)\.doc\(uid\)\)/);
  assert.match(source,/deleteUser\(uid\)/);
  assert.match(source,/Invalid smoke cleanup uid/);
  assert.match(source,/FIREBASE_SERVICE_ACCOUNT_MANJINGO cleanup credential/);
  assert.match(source,/unlinkSync\(stateFile\)/);
});

test('production smoke workflow gates execution and always runs credentialed cleanup',()=>{
  const workflow=read('.github/workflows/pages-production-smoke.yml');
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/ENABLE_PAGES_SMOKE == 'true'/);
  assert.match(workflow,/npm run smoke:pages/);
  assert.match(workflow,/MANJINGO_BASE_URL/);
  assert.match(workflow,/Install Firebase Admin cleanup runtime/);
  assert.match(workflow,/FIREBASE_SERVICE_ACCOUNT_MANJINGO/);
  assert.match(workflow,/if: always\(\)/);
  assert.match(workflow,/cleanup_smoke_user\.cjs/);
  const smokeStep=workflow.slice(workflow.indexOf('Smoke test production Pages learning API with a real write'),workflow.indexOf('Cleanup temporary smoke user and learning data'));
  assert.doesNotMatch(smokeStep,/FIREBASE_SERVICE_ACCOUNT/);
});

test('package exposes the production smoke command',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['smoke:pages'],'node scripts/smoke_pages_api.mjs');
});
