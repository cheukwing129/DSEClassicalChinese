const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const fail=message=>{console.error('✖ mascot thinking P3: '+message);process.exitCode=1};
const ok=message=>console.log('✔ mascot thinking P3: '+message);

const manifest=JSON.parse(read('public/mascot/manifest.json'));
const state=id=>manifest.states.find(item=>item.id===id);
const thinking=state('thinking');
const neutral=state('neutral');
const encouraging=state('encouraging');

if(!thinking)fail('manifest is missing the thinking state');
if(!neutral)fail('manifest is missing the neutral state');
if(!encouraging)fail('manifest is missing the encouraging state');
if(process.exitCode)process.exit(process.exitCode);

if(thinking.asset!=='./mascot/moling-thinking.svg')fail('thinking asset path changed');
if(thinking.productionPriority!==3)fail('thinking must remain P3');
if(neutral.artStatus!=='baseline-approved'&&neutral.artStatus!=='production')fail('neutral must remain the approved runtime anchor');
if(encouraging.artStatus!=='production')fail('P3 assumes encouraging P2 is already production');

const svg=read('public/mascot/moling-thinking.svg');
const neutralSvg=read('public/mascot/moling-neutral.svg');
const encouragingSvg=read('public/mascot/moling-encouraging.svg');

if(!/viewBox="0 0 215 320"/.test(svg))fail('thinking must keep the 215×320 viewBox');
if(/<text\b/i.test(svg))fail('thinking SVG must not embed text');
if(!/<title\b[^>]*>[^<]*(思考|thinking)/i.test(svg))fail('thinking should retain an accessible title');
if(!/<desc\b/i.test(svg))fail('thinking should retain an accessible description');

const referencesBaseline=/mascot-moling\.svg/.test(svg);
const distressedMarkup=/(id|class)=["'][^"']*(confus|worry|sweat|frown|downcast|spiral|sleep|angry|frustrat|shrug|question)[^"']*["']/i.test(svg);
const thinkingLanguage=/(思考|好奇|專注|thinking|curious|attentive)/i.test(svg);
const embeddedWebp=svg.match(/data:image\/webp;base64,([^"']+)/i);
const webp=embeddedWebp?Buffer.from(embeddedWebp[1],'base64'):null;
const validWebp=webp&&webp.subarray(0,4).toString('ascii')==='RIFF'&&webp.subarray(8,12).toString('ascii')==='WEBP';
const vp8xAlpha=validWebp&&webp.subarray(12,16).toString('ascii')==='VP8X'&&(webp[20]&0x10)!==0;
const alphaChunk=validWebp&&webp.includes(Buffer.from('ALPH'));

if(thinking.artStatus==='placeholder-treatment'){
  if(!referencesBaseline)fail('placeholder-treatment should reference the approved baseline');
  ok('placeholder treatment remains baseline-derived');
}else if(thinking.artStatus==='candidate'||thinking.artStatus==='production'){
  if(referencesBaseline)fail(thinking.artStatus+' thinking must be independent from mascot-moling.svg');
  if(svg===neutralSvg||svg===encouragingSvg)fail('thinking artwork must be a genuinely distinct pose');
  if(svg.length<50000)fail('thinking SVG is suspiciously small for embedded 3D artwork');
  if(!/<image\b/i.test(svg)||!embeddedWebp)fail('thinking should contain embedded transparent 3D artwork');
  if(!validWebp)fail('thinking data URI must decode to a valid WebP');
  if(!vp8xAlpha&&!alphaChunk)fail('thinking WebP must contain a real alpha channel, not a flattened checkerboard');
  if(distressedMarkup)fail('thinking contains confused/distressed visual markup');
  if(!thinkingLanguage)fail('thinking description should preserve curious attentive intent');
  ok(thinking.artStatus+' thinking artwork is independent and structurally reviewable');
  ok('no confused/distressed visual markup detected');
}else{
  fail('unexpected thinking artStatus: '+thinking.artStatus);
}

if(process.exitCode)process.exit(process.exitCode);
ok('P3 structural and emotional-safety gate passed');
