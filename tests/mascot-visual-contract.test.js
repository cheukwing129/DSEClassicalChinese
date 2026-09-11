const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const manifest=JSON.parse(read('public/mascot/manifest.json'));

const stateIds=['neutral','happy','celebrate','encouraging','thinking','determined'];
const sizes=[32,48,64,96,160];

test('mascot manifest is the complete six-state v1 contract',()=>{
  assert.equal(manifest.version,1);
  assert.deepEqual(manifest.recommendedSizes,sizes);
  assert.deepEqual(manifest.states.map(state=>state.id),stateIds);
  assert.equal(manifest.compactAsset,'./mascot/moling-head.svg');
  manifest.states.forEach(state=>{
    assert.ok(state.label);
    assert.ok(state.intent);
    assert.match(state.asset,new RegExp('^\\.\\/mascot\\/moling-'+state.id+'\\.svg$'));
  });
});

test('every manifest asset exists and preserves the approved baseline artwork',()=>{
  manifest.states.forEach(state=>{
    const file='public/'+state.asset.replace(/^\.\//,'');
    assert.equal(exists(file),true,file+' should exist');
    const svg=read(file);
    assert.match(svg,/viewBox="0 0 215 320"/);
    assert.match(svg,/\.\.\/mascot-moling\.svg/);
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

test('visual QA character sheet renders from the manifest across required sizes',()=>{
  const sheet=read('public/mascot-sheet.html');
  assert.match(sheet,/fetch\('\.\/mascot\/manifest\.json'/);
  assert.match(sheet,/manifest\.recommendedSizes/);
  assert.match(sheet,/size===32/);
  assert.match(sheet,/manifest\.compactAsset/);
  assert.match(sheet,/data-mascot-state/);
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

test('visual QA documentation records current limitations and production art priorities',()=>{
  const docs=read('docs/mascot-visual-qa.md');
  assert.match(docs,/mascot-sheet\.html/);
  assert.match(docs,/manifest\.json/);
  assert.match(docs,/v1 已知限制/);
  assert.match(docs,/happy/);
  assert.match(docs,/encouraging/);
});
