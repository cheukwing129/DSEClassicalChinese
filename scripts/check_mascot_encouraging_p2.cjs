const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{console.error('✖ mascot encouraging P2: '+message);process.exitCode=1};
const ok=message=>console.log('✔ mascot encouraging P2: '+message);

const manifest=JSON.parse(read('public/mascot/manifest.json'));
const state=id=>manifest.states.find(item=>item.id===id);
const encouraging=state('encouraging');
const neutral=state('neutral');
const happy=state('happy');

if(!encouraging)fail('manifest is missing the encouraging state');
if(!neutral)fail('manifest is missing the neutral state');
if(!happy)fail('manifest is missing the happy state');
if(process.exitCode)process.exit(process.exitCode);

if(encouraging.asset!=='./mascot/moling-encouraging.svg')fail('encouraging asset path changed');
if(encouraging.productionPriority!==2)fail('encouraging must remain P2');
if(neutral.artStatus!=='baseline-approved'&&neutral.artStatus!=='production')fail('neutral must remain the approved character anchor');
if(happy.artStatus!=='production')fail('P2 assumes happy P1 is already production');

const svg=read('public/mascot/moling-encouraging.svg');
const neutralSvg=read('public/mascot/moling-neutral.svg');

if(!/viewBox="0 0 215 320"/.test(svg))fail('encouraging must keep the 215×320 viewBox');
if(/<text\b/i.test(svg))fail('encouraging SVG must not embed text');
if(!/<title\b[^>]*>[^<]*鼓勵|<title\b[^>]*>[^<]*encouraging/i.test(svg))fail('encouraging SVG should retain an accessible encouraging title');
if(!/<desc\b/i.test(svg))fail('encouraging SVG should retain an accessible description');

const referencesBaseline=/mascot-moling\.svg/.test(svg);
const punitiveMarkup=/(id|class)=["'][^"']*(tear|sweat|frown|downcast|red[-_ ]?cross|head[-_ ]?shake|shrug|angry|punish|shame)[^"']*["']/i.test(svg)||/#[fF][0-4][0-4][0-4][0-4][0-4]/.test(svg);
const supportiveLanguage=/(支持|陪伴|溫和|專注|support|attentive|gentle)/i.test(svg);

if(encouraging.artStatus==='placeholder-treatment'){
  if(!referencesBaseline)fail('placeholder-treatment should still reference the approved baseline');
  ok('placeholder treatment remains baseline-derived');
}else if(encouraging.artStatus==='candidate'){
  if(referencesBaseline)fail('candidate encouraging must be independent from mascot-moling.svg');
  if(svg===neutralSvg)fail('candidate encouraging cannot be identical to neutral');
  if(svg.length<1100)fail('candidate encouraging SVG is suspiciously small for a distinct pose');
  if(!/(ellipse|circle|path)/i.test(svg))fail('candidate encouraging should contain independent vector artwork');
  if(punitiveMarkup)fail('candidate encouraging contains punitive/shaming visual markup');
  if(!supportiveLanguage)fail('candidate description should explicitly preserve supportive intent');
  ok('candidate artwork is independent and structurally reviewable');
  ok('no punitive/shaming visual markup detected');
  ok('production promotion remains blocked until A–E visual QA passes');
}else if(encouraging.artStatus==='production'){
  if(referencesBaseline)fail('production encouraging must not reference mascot-moling.svg');
  if(svg===neutralSvg)fail('production encouraging cannot be identical to neutral');
  if(punitiveMarkup)fail('production encouraging contains punitive/shaming visual markup');
  if(!supportiveLanguage)fail('production encouraging description should preserve supportive intent');
  ok('production encouraging is independent and non-punitive');
}else{
  fail('unexpected encouraging artStatus: '+encouraging.artStatus);
}

if(process.exitCode)process.exit(process.exitCode);
ok('P2 structural and emotional-safety gate passed');
