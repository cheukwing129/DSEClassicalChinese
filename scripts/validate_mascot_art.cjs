const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const manifestPath=path.join(root,'public','mascot','manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const allowedStatuses=new Set(['baseline-approved','placeholder-treatment','candidate','provisional','production']);
const failures=[];

function fail(message){failures.push(message)}
function assetFile(asset){return path.join(root,'public',String(asset||'').replace(/^\.\//,''))}

if(manifest.version!==1)fail('manifest.version must remain 1 for the v1 contract');
if(!Array.isArray(manifest.states)||manifest.states.length!==6)fail('manifest must contain exactly six canonical states');
if(!Array.isArray(manifest.recommendedSizes)||manifest.recommendedSizes.join(',')!=='32,48,64,96,160')fail('recommendedSizes must stay 32,48,64,96,160');

const ids=new Set();
const priorities=new Set();
for(const state of manifest.states||[]){
  if(!state||!state.id){fail('every state needs an id');continue}
  if(ids.has(state.id))fail(`duplicate state id: ${state.id}`);else ids.add(state.id);
  if(!allowedStatuses.has(state.artStatus))fail(`${state.id}: invalid artStatus ${state.artStatus}`);
  if(!Number.isInteger(state.productionPriority)||state.productionPriority<0)fail(`${state.id}: productionPriority must be a non-negative integer`);
  if(priorities.has(state.productionPriority))fail(`${state.id}: duplicate productionPriority ${state.productionPriority}`);else priorities.add(state.productionPriority);

  const file=assetFile(state.asset);
  if(!fs.existsSync(file)){fail(`${state.id}: missing asset ${state.asset}`);continue}
  const svg=fs.readFileSync(file,'utf8');
  if(!/viewBox=["']0 0 215 320["']/.test(svg))fail(`${state.id}: asset must use viewBox 0 0 215 320`);
  if(/<text\b/i.test(svg))fail(`${state.id}: production mascot assets must not embed text`);

  const referencesBaseline=/\.\.\/mascot-moling\.svg/.test(svg);
  if(state.artStatus==='production'&&referencesBaseline)fail(`${state.id}: artStatus=production cannot still reference mascot-moling.svg baseline artwork`);
  if(state.artStatus==='candidate'&&referencesBaseline)fail(`${state.id}: candidate artwork must already be independent from mascot-moling.svg before visual review`);
  if(state.artStatus==='placeholder-treatment'&&!referencesBaseline)fail(`${state.id}: placeholder-treatment should still be an explicit baseline-derived treatment until a real candidate is installed`);
}

const neutral=(manifest.states||[]).find(state=>state.id==='neutral');
if(!neutral||neutral.artStatus!=='baseline-approved'||neutral.productionPriority!==0)fail('neutral must remain baseline-approved at productionPriority 0');

const queue=(manifest.states||[])
  .filter(state=>!['baseline-approved','production'].includes(state.artStatus))
  .sort((a,b)=>a.productionPriority-b.productionPriority);
for(let i=1;i<queue.length;i++)if(queue[i-1].productionPriority>=queue[i].productionPriority)fail('production artwork queue must have strictly increasing priority');

const compact=assetFile(manifest.compactAsset);
if(!fs.existsSync(compact))fail('compact mascot asset is missing');
else if(!/viewBox=["']0 0 215 190["']/.test(fs.readFileSync(compact,'utf8')))fail('compact mascot asset must use viewBox 0 0 215 190');

if(failures.length){
  console.error('Mascot artwork validation failed:');
  failures.forEach(item=>console.error(' - '+item));
  process.exit(1);
}

console.log('Mascot artwork contract OK.');
console.log('Production queue:',queue.length?queue.map(state=>`P${state.productionPriority} ${state.id} [${state.artStatus}]`).join(' -> '):'complete');
