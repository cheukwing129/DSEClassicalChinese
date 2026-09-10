const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','public','learning-path-ui.js'),'utf8');

test('learning path presents a vertical journey with clear stage hierarchy',()=>{
  assert.match(source,/class=\"lp-route\"/);
  assert.match(source,/class=\"lp-stop /);
  assert.match(source,/class=\"lp-rail\"/);
  assert.match(source,/class=\"lp-orb\"/);
  assert.match(source,/class=\"lp-stage-card/);
  assert.match(source,/目前關卡/);
  assert.match(source,/下一關/);
  assert.match(source,/已完成/);
  assert.match(source,/未解鎖/);
});

test('current and completed stages remain actionable while future stages are previews',()=>{
  assert.match(source,/\(state==='complete'\|\|state==='current'\)\?nextLesson\(stage\):null/);
  assert.match(source,/重新複習/);
  assert.match(source,/繼續學習/);
  assert.match(source,/目前關卡達 70% 後解鎖/);
  assert.match(source,/完成前面的關卡後開放/);
});

test('journey preserves the existing 70 percent unlock semantics',()=>{
  assert.match(source,/達 70% 解鎖下一關/);
  assert.match(source,/stage\.complete/);
  assert.match(source,/stage\.unlocked/);
  assert.match(source,/path\.currentStage\(list\)/);
});
