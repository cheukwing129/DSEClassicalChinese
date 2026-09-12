const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
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
  assert.match(css,/manyingo-logo-classic\.svg/);
  assert.match(css,/manyingo-logo-ink\.svg/);
  assert.doesNotMatch(css,/body\.app-nav-ready>\.title::after\{content:""/);
  const homepage=read('public/index.html');
  assert.match(homepage,/<h1 class="title">Manyingo<\/h1>/);
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

test('Manyingo theme logos remain native flat vectors without raster halos',()=>{
  const ink=read('public/brand/manyingo-logo-ink.svg');
  const classic=read('public/brand/manyingo-logo-classic.svg');
  [ink,classic].forEach(svg=>{
    assert.match(svg,/<svg\b/);
    assert.doesNotMatch(svg,/<image\b/);
    assert.doesNotMatch(svg,/data:image\//);
    assert.match(svg,/#d4a85b/i);
    assert.match(svg,/>Manyıngo<\/text>/);
  });
  assert.match(ink,/<text[^>]*fill="#12314f"/);
  assert.match(classic,/<text[^>]*fill="#58cc02"/);
});
