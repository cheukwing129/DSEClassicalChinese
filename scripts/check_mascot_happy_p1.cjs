const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{console.error('✖ mascot happy P1: '+message);process.exitCode=1};
const ok=message=>console.log('✔ mascot happy P1: '+message);

const manifest=JSON.parse(read('public/mascot/manifest.json'));
const state=id=>manifest.states.find(item=>item.id===id);
const happy=state('happy');
const neutral=state('neutral');

if(!happy)fail('manifest is missing the happy state');
if(!neutral)fail('manifest is missing the neutral state');
if(process.exitCode)process.exit(process.exitCode);

if(happy.asset!=='./mascot/moling-happy.svg')fail('happy asset path changed');
if(happy.productionPriority!==1)fail('happy must remain P1');
if(neutral.artStatus!=='baseline-approved'&&neutral.artStatus!=='production')fail('neutral must remain the approved character anchor');

const happySvg=read('public/mascot/moling-happy.svg');
const neutralSvg=read('public/mascot/moling-neutral.svg');

if(!/viewBox="0 0 215 320"/.test(happySvg))fail('happy must keep the 215×320 viewBox');
if(/<text\b/i.test(happySvg))fail('happy SVG must not embed text');
if(!/<title\b[^>]*>[^<]*開心|<title\b[^>]*>[^<]*happy/i.test(happySvg))fail('happy SVG should retain an accessible happy title');
if(!/<desc\b/i.test(happySvg))fail('happy SVG should retain an accessible description');

const referencesBaseline=/mascot-moling\.svg/.test(happySvg);
const embedded=happySvg.match(/data:image\/webp;base64,([^"']+)/i);
const webp=embedded?Buffer.from(embedded[1],'base64'):null;
const validWebp=webp&&webp.subarray(0,4).toString('ascii')==='RIFF'&&webp.subarray(8,12).toString('ascii')==='WEBP';
const hasAlpha=validWebp&&((webp.subarray(12,16).toString('ascii')==='VP8X'&&(webp[20]&0x10)!==0)||webp.includes(Buffer.from('ALPH')));
const overlayLanguage=/沿用正式角色 artwork|點綴|baseline\s*\+\s*overlay/i.test(happySvg);

if(happy.artStatus==='placeholder-treatment'){
  if(!referencesBaseline)fail('placeholder-treatment should still reference the approved baseline until a real candidate is installed');
  ok('placeholder treatment is still explicitly baseline-derived');
}else if(happy.artStatus==='candidate'){
  if(referencesBaseline)fail('candidate happy must already be independent from mascot-moling.svg');
  if(overlayLanguage)fail('candidate description must not describe a baseline/overlay treatment');
  if(happySvg===neutralSvg)fail('candidate happy cannot be identical to neutral');
  if(happySvg.length<900)fail('candidate happy SVG is suspiciously small for a distinct pose');
  if(!/(ellipse|circle|path)/i.test(happySvg))fail('candidate happy should contain independent vector artwork');
  ok('candidate artwork is independent and ready for visual review');
  ok('production promotion remains blocked until A–E visual QA passes');
}else if(happy.artStatus==='production'){
  if(referencesBaseline)fail('production happy must not reference mascot-moling.svg');
  if(overlayLanguage)fail('production happy description must not describe a baseline/overlay treatment');
  if(happySvg===neutralSvg)fail('production happy cannot be identical to neutral');
  if(happySvg.length<30000||!/<image\b/i.test(happySvg)||!embedded)fail('production happy embedded artwork missing');
  if(!validWebp)fail('production happy must embed a valid WebP');
  if(!hasAlpha)fail('production happy WebP must contain real alpha');
  if(!/單節圓頭墨臂/.test(happySvg))fail('production happy must preserve one-piece rounded limb language');
  ok('production happy is independent from the legacy baseline');
  ok('production happy remains structurally distinct from neutral');
}else{
  fail('unexpected happy artStatus: '+happy.artStatus);
}

if(process.exitCode)process.exit(process.exitCode);
ok('P1 structural gate passed');
