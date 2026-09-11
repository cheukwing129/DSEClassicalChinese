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
const productionPriority=['happy','encouraging','thinking','determined','celebrate'];
const pendingPriority=['encouraging','thinking','determined','celebrate'];

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
  assert.equal(runtime.isProductionArt('happy'),true);
  assert.equal(runtime.isProductionArt('encouraging'),false);
  assert.equal(runtime.descriptor('happy').artStatus,'production');
  assert.equal(runtime.descriptor('encouraging').artStatus,'candidate');
  assert.deepEqual(runtime.productionQueue().map(state=>state.id),pendingPriority);
});

test('manifest artwork lifecycle distinguishes baseline-derived, candidate, and production assets',()=>{
  manifest.states.forEach(state=>{
    const file='public/'+state.asset.replace(/^\.\//,'');
    assert.equal(exists(file),true,file+' should exist');
    const svg=read(file);
    assert.match(svg,/viewBox="0 0 215 320"/);
    const referencesBaseline=/\.\.\/mascot-moling\.svg/.test(svg);
    if(state.artStatus==='placeholder-treatment'||state.artStatus==='provisional'||state.artStatus==='baseline-approved')assert.equal(referencesBaseline,true,state.id+' should still be baseline-derived');
    if(state.artStatus==='candidate'||state.artStatus==='production')assert.equal(referencesBaseline,false,state.id+' should be independent from the legacy baseline');
  });
  const happy=manifest.states.find(state=>state.id==='happy');
  const encouraging=manifest.states.find(state=>state.id==='encouraging');
  assert.equal(happy.artStatus,'production');
  assert.equal(encouraging.artStatus,'candidate');
  assert.match(read('public/mascot/moling-happy.svg'),/happy production artwork/);
  assert.match(read('public/mascot/moling-encouraging.svg'),/encouraging 候選 artwork v4/);
});

test('happy production v2 keeps the real smile primary at feedback sizes',()=>{
  const happy=read('public/mascot/moling-happy.svg');
  assert.match(happy,/清楚笑意/);
  assert.match(happy,/M78 167c8 11 18 16 30 16s22-5 30-16/);
  assert.match(happy,/stroke-width="6"/);
  assert.doesNotMatch(happy,/stroke="#d4a85b"/);
});

test('encouraging P2 candidate encodes supportive cues without blame cues',()=>{
  const encouraging=read('public/mascot/moling-encouraging.svg');
  assert.match(encouraging,/微歪小笑容/);
  assert.match(encouraging,/陪伴與支持/);
  assert.match(encouraging,/全墨色/);
  assert.match(encouraging,/金色雲紋/);
  assert.match(encouraging,/笨拙圓潤開掌/);
  assert.match(encouraging,/data:image\/webp;base64,/);
  assert.doesNotMatch(encouraging,/mascot-moling\.svg/);
  assert.doesNotMatch(encouraging,/(眼淚|紅叉|搖頭|皺眉|shame|punish)/i);
});

test('32px uses a dedicated compact head crop instead of shrinking the full body',()=>{
  const compact='public/'+manifest.compactAsset.replace(/^\.\//,'');
  assert.equal(exists(compact),true);
  const svg=read(compact);
  assert.match(svg,/viewBox="0 0 215 190"/);
  assert.match(svg,/\.\.\/mascot-moling\.svg/);
  assert.match(svg,/32px/);
});

test('visual QA character sheet retains happy production regression surfaces',()=>{
  const sheet=read('public/mascot-sheet.html');
  assert.match(sheet,/script src="\.\/mascot-runtime\.js"/);
  assert.match(sheet,/runtime\.recommendedSizes/);
  assert.match(sheet,/runtime\.productionQueue/);
  assert.match(sheet,/id="happyABGrid"/);
  assert.match(sheet,/neutral \/ production A\/B/);
  assert.match(sheet,/Desktop · 42×62px mascot/);
  assert.match(sheet,/Narrow mobile · 34×50px mascot/);
  assert.match(sheet,/prefers-reduced-motion:reduce/);
});

test('encouraging P2 QA page covers approved-reference A/B and real wrong-answer sizes',()=>{
  const qa=read('public/mascot-encouraging-p2-qa.html');
  assert.match(qa,/Encouraging P2 Visual QA/);
  assert.match(qa,/const sizes=\[34,42,48,64,96,160\]/);
  assert.match(qa,/moling-reference-approved\.svg/);
  assert.match(qa,/runtime\.asset\('encouraging'\)/);
  assert.match(qa,/這題答錯了/);
  assert.match(qa,/一起看清這一步。/);
  assert.match(qa,/Desktop · 42×62px/);
  assert.match(qa,/Narrow mobile · 34×50px/);
  assert.match(qa,/不低頭、不皺眉/);
  assert.match(qa,/prefers-reduced-motion:reduce/);
});

test('production placements use canonical state assets instead of the legacy baseline directly',()=>{
  const css=read('public/app-ui.css');
  assert.match(css,/mascot\/moling-neutral\.svg/);
  assert.match(css,/mascot\/moling-determined\.svg/);
  assert.match(css,/mascot\/moling-thinking\.svg/);
  assert.doesNotMatch(css,/background:url\('\.\/mascot-moling\.svg'\)/);
});

test('production art brief protects character DNA and defines the state priority order',()=>{
  const brief=read('docs/mascot-production-art-brief.md');
  assert.match(brief,/不可改動的角色 DNA/);
  productionPriority.slice(0,4).forEach(state=>assert.match(brief,new RegExp('`'+state+'`')));
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
