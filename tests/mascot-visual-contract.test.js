const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const runtime=require('../public/mascot-runtime.js');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const manifest=JSON.parse(read('public/mascot/manifest.json'));

const stateIds=['neutral','happy','celebrate','encouraging','thinking','determined'];
const sizes=[32,48,64,96,160];
const expectedPriority=['happy','encouraging','thinking','determined','celebrate'];

test('mascot manifest is the complete six-state v1 contract',()=>{
  assert.equal(manifest.version,1);
  assert.deepEqual(manifest.recommendedSizes,sizes);
  assert.deepEqual(manifest.states.map(state=>state.id),stateIds);
  assert.equal(manifest.compactAsset,'./mascot/moling-head.svg');
  manifest.states.forEach(state=>{
    assert.ok(state.label);
    assert.ok(state.intent);
    assert.ok(state.artStatus);
    assert.equal(Number.isFinite(state.productionPriority),true);
    assert.match(state.asset,new RegExp('^\\.\\/mascot\\/moling-'+state.id+'\\.svg$'));
  });
});

test('runtime and manifest stay in exact parity including artwork readiness',()=>{
  assert.deepEqual(runtime.recommendedSizes,manifest.recommendedSizes);
  assert.equal(runtime.compactAsset,manifest.compactAsset);
  manifest.states.forEach(state=>{
    const descriptor=runtime.descriptor(state.id);
    ['id','label','asset','intent','motion','artStatus','productionPriority'].forEach(key=>assert.equal(descriptor[key],state[key],state.id+' '+key));
  });
  assert.equal(runtime.isProductionArt('neutral'),true);
  assert.equal(runtime.isProductionArt('happy'),false);
  assert.deepEqual(runtime.productionQueue().map(state=>state.id),expectedPriority);
});

test('every manifest asset exists and preserves the approved baseline artwork until production replacement',()=>{
  manifest.states.forEach(state=>{
    const file='public/'+state.asset.replace(/^\.\//,'');
    assert.equal(exists(file),true,file+' should exist');
    const svg=read(file);
    assert.match(svg,/viewBox="0 0 215 320"/);
    if(state.artStatus!=='production')assert.match(svg,/\.\.\/mascot-moling\.svg/);
  });
});

test('32px uses a dedicated compact head crop instead of shrinking the full body',()=>{
  const compact='public/'+manifest.compactAsset.replace(/^\.\//,'');
  assert.equal(exists(compact),true);
  const svg=read(compact);
  assert.match(svg,/viewBox="0 0 215 190"/);
  assert.match(svg,/\.\.\/mascot-moling\.svg/);
  assert.match(svg,/32px/);
});

test('visual QA character sheet exposes production readiness and priority',()=>{
  const sheet=read('public/mascot-sheet.html');
  assert.match(sheet,/script src="\.\/mascot-runtime\.js"/);
  assert.match(sheet,/runtime\.recommendedSizes/);
  assert.match(sheet,/runtime\.asset\(state\.id,\{size\}\)/);
  assert.match(sheet,/runtime\.productionQueue/);
  assert.match(sheet,/data-art-status/);
  assert.match(sheet,/art-status/);
  assert.match(sheet,/placeholder-treatment/);
  assert.match(sheet,/productionPriority/);
  sizes.forEach(size=>assert.match(sheet,new RegExp(String(size))));
  assert.match(sheet,/prefers-reduced-motion:reduce/);
});

test('production placements use canonical state assets instead of the legacy baseline directly',()=>{
  const css=read('public/app-ui.css');
  assert.match(css,/mascot\/moling-neutral\.svg/);
  assert.match(css,/mascot\/moling-determined\.svg/);
  assert.match(css,/mascot\/moling-thinking\.svg/);
  assert.doesNotMatch(css,/background:url\('\.\/mascot-moling\.svg'\)/);
});

test('production art brief protects character DNA and defines four priority poses',()=>{
  const brief=read('docs/mascot-production-art-brief.md');
  assert.match(brief,/不可改動的角色 DNA/);
  expectedPriority.slice(0,4).forEach(state=>assert.match(brief,new RegExp('`'+state+'`')));
  assert.match(brief,/不再只是 baseline artwork 加外掛符號/);
  assert.match(brief,/48 \/ 64 \/ 96 \/ 160px/);
  assert.match(brief,/Definition of Done/);
});

test('visual QA documentation records current limitations and production art priorities',()=>{
  const docs=read('docs/mascot-visual-qa.md');
  assert.match(docs,/mascot-sheet\.html/);
  assert.match(docs,/manifest\.json/);
  assert.match(docs,/v1 已知限制/);
  assert.match(docs,/happy/);
  assert.match(docs,/encouraging/);
});
