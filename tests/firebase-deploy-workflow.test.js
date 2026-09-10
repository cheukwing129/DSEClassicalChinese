const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('firebase config pins Manjingo backend sources and predeploy lint',()=>{
  const config=JSON.parse(read('firebase.json'));
  assert.equal(config.functions.source,'functions');
  assert.equal(config.functions.runtime,'nodejs20');
  assert.deepEqual(config.functions.predeploy,['npm --prefix "$RESOURCE_DIR" run lint']);
  assert.equal(config.firestore.rules,'firestore.rules');
});

test('Firebase backend workflow deploys only after successful main tests or manual dispatch',()=>{
  const workflow=read('.github/workflows/firebase-backend-deploy.yml');
  assert.match(workflow,/workflow_run:/);
  assert.match(workflow,/workflows: \["Tests"\]/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow,/github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(workflow,/github\.event\.workflow_run\.head_sha/);
  assert.match(workflow,/vars\.ENABLE_FIREBASE_DEPLOY == 'true'/);
  assert.match(workflow,/cancel-in-progress: false/);
});

test('Firebase deploy uses ADC and keeps Functions behind a separate Blaze gate',()=>{
  const workflow=read('.github/workflows/firebase-backend-deploy.yml');
  assert.match(workflow,/FIREBASE_SERVICE_ACCOUNT_MANJINGO/);
  assert.match(workflow,/google-github-actions\/auth@v3/);
  assert.match(workflow,/credentials_json:/);
  assert.doesNotMatch(workflow,/FIREBASE_TOKEN/);
  assert.match(workflow,/ENABLE_FIREBASE_FUNCTIONS_DEPLOY/);
  assert.match(workflow,/firebase deploy --only firestore:rules --project/);
  assert.match(workflow,/firebase deploy --only firestore:rules,functions --project/);
  assert.match(workflow,/--non-interactive/);
});

test('generated Google auth credentials cannot be committed',()=>{
  assert.match(read('.gitignore'),/^gha-creds-\*\.json$/m);
});
