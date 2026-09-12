const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('selected Little Ink Spirit asset is embedded as a valid webp-backed svg',()=>{
  const svg=read('public/mascot-moling.svg');
  assert.match(svg,/viewBox="0 0 215 320"/);
  assert.match(svg,/<title id="title">小墨靈<\/title>/);
  const match=svg.match(/data:image\/webp;base64,([^"']+)/);
  assert.ok(match,'mascot svg must embed the selected transparent artwork');
  const bytes=Buffer.from(match[1],'base64');
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
  assert.ok(bytes.length>10000,'mascot artwork should not collapse into a placeholder');
});

test('homepage brand renders theme-aware Manyingo logo without entering the focused study surface',()=>{
  const css=read('public/app-ui.css');
  const shell=read('public/home-shell.js');
  assert.match(css,/--brand-ink-teal:#0f5a5a/);
  assert.match(css,/body\.app-nav-ready>\.title[^}]*manyingo-logo-classic\.webp/);
  assert.match(css,/html\[data-ui-theme="ink"\] body\.app-nav-ready>\.title[^}]*manyingo-logo-ink\.webp/);
  assert.match(css,/@media\(max-width:430px\)[\s\S]*body\.app-nav-ready>\.title\{width:min\(100%,400px\);height:86px/);
  assert.match(shell,/body\.'\+STUDY_CLASS\+'>\.title/);
});

test('public web surfaces use the Manyingo 文言年糕 product name while technical namespaces stay stable',()=>{
  const index=read('public/index.html');
  const lesson=read('public/lesson.html');
  const map=read('public/knowledge-map.html');
  const theme=read('public/theme-runtime.js');
  assert.match(index,/<title>Manyingo 文言年糕｜文言自主學習<\/title>/);
  assert.match(index,/<h1 class="title">Manyingo 文言年糕<\/h1>/);
  assert.match(index,/content:'Manyingo 文言年糕'/);
  assert.match(index,/body\.app-nav-ready>\.title::after\{content:'文言年糕'!important/);
  assert.match(lesson,/<title>Manyingo 文言年糕｜微課堂<\/title>/);
  assert.match(map,/<title>Manyingo 文言年糕｜學習地圖<\/title>/);
  assert.match(theme,/root\.ManjingoTheme=api/);
  assert.match(theme,/const STORAGE_KEY='manjingo\.uiTheme'/);
});