const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Stage 3 production smoke validates loader runtime rotation and summary',()=>{
  const source=read('scripts/smoke_stage3_ui.mjs');
  assert.match(source,/readTextAsset\('\/', 'homepage'\)/);
  assert.match(source,/readTextAsset\('\/home-shell\.js', 'home shell asset'\)/);
  assert.match(source,/readTextAsset\('\/stage3-reading\.js', 'Stage 3 reading asset'\)/);
  assert.match(source,/homeShellSource\.includes\("script\.src='\.\/stage3-reading\.js'"\)/);
  assert.match(source,/homeShellSource\.includes\('loadStage3Reading\(\);'\)/);
  assert.match(source,/vm\.runInContext\(stage3Source/);
  assert.match(source,/typeof stage3\.buildChallenge === 'function'/);
  assert.match(source,/typeof stage3\.summarizeResults === 'function'/);
  assert.match(source,/skillIds = \['read\.argumentation', 'transfer\.short-passage', 'transfer\.mixed'\]/);
  assert.match(source,/for \(let run = 0; run < 3; run \+= 1\)/);
  assert.match(source,/built\.questions\.length === 6/);
  assert.match(source,/counts\[id\] === 2/);
  assert.match(source,/seen\.size === 18/);
  assert.match(source,/summary\.total === 6 && summary\.correct === 4 && summary\.rows\.length === 3/);
});

test('Stage 3 smoke stays separate and runs before the existing Pages write smoke',()=>{
  const pkg=JSON.parse(read('package.json'));
  const workflow=read('.github/workflows/pages-production-smoke.yml');
  assert.equal(pkg.scripts['smoke:stage3'],'node scripts/smoke_stage3_ui.mjs');
  assert.equal(pkg.scripts['smoke:pages'],'node scripts/smoke_sync_guard.mjs && node scripts/smoke_answer_outbox.mjs && node scripts/smoke_practice_reliability.mjs && node scripts/smoke_pages_api.mjs');
  const stage3=workflow.indexOf('run: npm run smoke:stage3');
  const pages=workflow.indexOf('run: npm run smoke:pages');
  assert.ok(stage3>=0 && pages>stage3);
});

test('Pages deployment wait includes Stage 3 runtime and loader assets',()=>{
  const workflow=read('.github/workflows/pages-production-smoke.yml');
  assert.match(workflow,/stage3-reading\.js/);
  assert.match(workflow,/ManjingoStage3Reading/);
  assert.match(workflow,/home-shell\.js/);
  assert.match(workflow,/stage3-reading\.js/);
});
