const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const readBuffer=file=>fs.readFileSync(path.join(root,file));
const theme=require('../public/theme-runtime.js');

test('theme runtime keeps Classic as safe default and exposes Ink Spirit',()=>{
  assert.equal(theme.storageKey,'manjingo.uiTheme');
  assert.equal(theme.normalizeTheme('classic'),'classic');
  assert.equal(theme.normalizeTheme('ink'),'ink');
  assert.equal(theme.normalizeTheme('unknown'),'classic');
  assert.equal(theme.themes.classic.label,'經典綠');
  assert.equal(theme.themes.ink.label,'墨靈');
});

test('homepage and lesson apply the saved theme before the UI foundation',()=>{
  ['public/index.html','public/lesson.html'].forEach(file=>{
    const html=read(file);
    const runtime=html.indexOf('theme-runtime.js');
    const foundation=html.indexOf('app-ui.css');
    assert.ok(runtime>=0,file+' loads theme runtime');
    assert.ok(foundation>runtime,file+' loads theme before shared CSS');
  });
});

test('Ink Spirit theme is token-driven, accessible, and keeps Classic intact',()=>{
  const css=read('public/app-ui.css');
  const source=read('public/theme-runtime.js');
  assert.match(css,/manyingo-logo-classic\.png/);
  assert.match(css,/manyingo-logo-classic\.webp/);
  assert.match(css,/manyingo-logo-ink\.png/);
  assert.match(css,/manyingo-logo-ink\.webp/);
  assert.doesNotMatch(css,/body\.app-nav-ready>\.title::after\{content:""/);
  const homepage=read('public/index.html');
  assert.match(homepage,/<h1 class="title">Manyingo 文言年糕<\/h1>/);
  assert.match(homepage,/body\.app-nav-ready>\.title::after\{content:'文言年糕'!important/);
  assert.match(homepage,/window\.ManjingoContent/);
  assert.match(css,/html\[data-ui-theme="ink"\]/);
  assert.match(css,/--ui-ink:#101b35/);
  assert.match(css,/--brand-warm-gold:#d4a85b/);
  assert.match(css,/\.ui-theme-choice:focus-visible/);
  assert.match(css,/body\.study-focus>\.ui-theme-switcher\{display:none\}/);
  assert.match(source,/aria-label','介面主題'/);
  assert.match(source,/aria-pressed/);
  assert.match(source,/localStorage/);
  assert.match(source,/manjingo:themechange/);
});

test('Manyingo theme logos use transparent raster masters with lossless WebP delivery',()=>{
  ['ink','classic'].forEach(theme=>{
    const png=readBuffer(`public/brand/manyingo-logo-${theme}.png`);
    const webp=readBuffer(`public/brand/manyingo-logo-${theme}.webp`);
    assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
    assert.equal(png.readUInt32BE(16),1981);
    assert.equal(png.readUInt32BE(20),554);
    assert.equal(png[25],6,'PNG must keep RGBA transparency');
    assert.equal(webp.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(webp.subarray(8,12).toString('ascii'),'WEBP');
    assert.ok(webp.length>100000,'logo must not collapse into a placeholder');
  });
  assert.notDeepEqual(
    readBuffer('public/brand/manyingo-logo-ink.png'),
    readBuffer('public/brand/manyingo-logo-classic.png'),
    'theme wordmarks must remain visually distinct'
  );
});