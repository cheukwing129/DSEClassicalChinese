const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Pages smoke verifies deployed learner difficulty guidance instant feedback and nonblocking next before exercising the learning API',()=>{
  const source=read('scripts/smoke_pages_api.mjs');
  assert.match(source,/from 'node:vm'/);
  assert.match(source,/readTextAsset\('\/difficulty-calibration\.js'/);
  assert.match(source,/readTextAsset\('\/question-rotation\.js'/);
  assert.match(source,/readTextAsset\('\/question-difficulty\.js'/);
  assert.match(source,/readTextAsset\('\/difficulty-observability\.js'/);
  assert.match(source,/readTextAsset\('\/feedback-ui\.js'/);
  assert.match(source,/readTextAsset\('\/', 'homepage'\)/);
  assert.match(source,/calibration\.tierForMastery\(68/);
  assert.match(source,/=== 'transfer'/);
  assert.match(source,/calibration\.tierForMastery\(82/);
  assert.match(source,/=== 'application'/);
  assert.match(source,/observability\.reasonLabel\('application-ready'\)/);
  assert.match(source,/observability\.selectionLabel\('misconception-target'\)/);
  assert.match(source,/observability\.studentSummary/);
  assert.match(source,/learnerGuidance\.tier === '跨篇遷移'/);
  assert.match(source,/近期同層 4 題 100%/);
  assert.match(source,/為甚麼系統安排這個難度？/);
  assert.match(source,/feedbackSource\.includes\('function instantAnswer\(event\)'\)/);
  assert.match(source,/feedbackSource\.includes\("document\.addEventListener\('click',instantAnswer,true\)"\)/);
  assert.match(source,/feedbackSource\.includes\('function unlockNextSoon\(scope\)'\)/);
  assert.match(source,/feedbackSource\.includes\('next\.disabled=false'\)/);
  assert.match(source,/homepageSource\.includes\('function answerIsCurrent\(box,answerId\)'\)/);
  assert.match(source,/homepageSource\.includes\('if\(nextButton\)nextButton\.disabled=false;showLearningFeedback/);
  assert.match(source,/!homepageSource\.includes\('nextButton\.disabled=true'\)/);
  assert.match(source,/homepageSource\.includes\('if\(answerIsCurrent\(box,answerId\)\)showLearningFeedback/);
  assert.match(source,/indexOf\('difficulty-calibration\.js'\) < rotationSource\.indexOf\('question-difficulty\.js'\)/);
  assert.match(source,/indexOf\('question-difficulty\.js'\) < rotationSource\.indexOf\('difficulty-observability\.js'\)/);
  const calibrationCheck=source.indexOf("readTextAsset('/difficulty-calibration.js'");
  const observabilityCheck=source.indexOf("readTextAsset('/difficulty-observability.js'");
  const feedbackCheck=source.indexOf("readTextAsset('/feedback-ui.js'");
  const homepageCheck=source.indexOf("readTextAsset('/', 'homepage')");
  const healthCheck=source.indexOf("api('/api/health'");
  assert.ok(calibrationCheck>=0 && observabilityCheck>=0 && feedbackCheck>=0 && homepageCheck>=0 && healthCheck>homepageCheck,'production browser policies and homepage flow must be checked before backend smoke');
});

test('production smoke verifies stale background responses cannot roll learning state backwards',()=>{
  const source=read('scripts/smoke_sync_guard.mjs');
  assert.match(source,/read\('\/remote-sync-guard\.js'/);
  assert.match(source,/read\('\/question-rotation\.js'/);
  assert.match(source,/remote-sync-guard\.js/);
  assert.match(source,/attempts:2,mastery:30/);
  assert.match(source,/stale\.mastery===undefined/);
  assert.match(source,/stale\.totalXp===24/);
  assert.match(source,/attempts:4,mastery:55/);
  assert.match(source,/newer\.mastery===55/);
});

test('production smoke verifies deployed answer outbox persistence retry and account isolation',()=>{
  const source=read('scripts/smoke_answer_outbox.mjs');
  assert.match(source,/read\('\/answer-outbox\.js'/);
  assert.match(source,/read\('\/firebase-config\.js'/);
  assert.match(source,/box\.enqueue|outbox\.enqueue/);
  assert.match(source,/outbox\.markFailure/);
  assert.match(source,/outbox\.bindUnowned/);
  assert.match(source,/includeUnowned:false/);
  assert.match(source,/window\.addEventListener\('online'/);
  assert.match(source,/learning\.syncRemoteResult/);
  assert.match(source,/production outbox crossed account boundary/);
});

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
  assert.equal(pkg.scripts['smoke:pages'],'node scripts/smoke_sync_guard.mjs && node scripts/smoke_answer_outbox.mjs && node scripts/smoke_pages_api.mjs');
});