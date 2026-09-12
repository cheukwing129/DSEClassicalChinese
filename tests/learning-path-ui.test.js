const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','public','learning-path-ui.js'),'utf8');

test('learning path presents a six-stage skill journey with clear hierarchy',()=>{
  assert.match(source,/核心技能路徑/);
  assert.match(source,/class=\"lp-route\"/);
  assert.match(source,/class=\"lp-stop /);
  assert.match(source,/class=\"lp-rail\"/);
  assert.match(source,/class=\"lp-orb\"/);
  assert.match(source,/class=\"lp-stage-card/);
  assert.match(source,/項核心技能/);
  assert.match(source,/lp-skill-preview/);
  assert.match(source,/目前關卡/);
  assert.match(source,/下一關/);
  assert.match(source,/已完成/);
  assert.match(source,/未解鎖/);
});

test('learning path mastery and lesson routing come from shared skill results',()=>{
  assert.match(source,/ManjingoSkillResultsV1/);
  assert.match(source,/results\.allItems\(\)/);
  assert.match(source,/path\.buildStages\(results\.coreSkills\(\)/);
  assert.match(source,/results\.kpIdsForSkill\(skillId\)/);
  assert.match(source,/item\.actionKpId/);
  assert.match(source,/lesson\.html\?kpId=/);
  assert.doesNotMatch(source,/allKnowledgePoints/);
  assert.doesNotMatch(source,/getKnowledge\(kpId\).*mastery/);
});

test('current and completed skill stages remain actionable while future stages are previews',()=>{
  assert.match(source,/\(state==='complete'\|\|state==='current'\)\?nextLesson\(stage\):null/);
  assert.match(source,/複習 '\+lesson\.label/);
  assert.match(source,/繼續 '\+lesson\.label/);
  assert.match(source,/目前關卡達 70% 後解鎖/);
  assert.match(source,/完成前面的技能階段後開放/);
});

test('journey preserves the 70 percent unlock semantics at skill level',()=>{
  assert.match(source,/技能平均掌握度/);
  assert.match(source,/達 70% 解鎖下一關/);
  assert.match(source,/stage\.complete/);
  assert.match(source,/stage\.unlocked/);
  assert.match(source,/path\.currentStage\(list\)/);
});

test('locked skills cannot leak into daily skill-first fill',()=>{
  assert.match(source,/function allowedSkillIds\(\)/);
  assert.match(source,/function questionAllowed\(question,skills\)/);
  assert.match(source,/ids\.every\(id=>skills\.has\(id\)\)/);
  assert.match(source,/sourceQuestions\)\?sourceQuestions:\[\]\)\.filter\(q=>questionAllowed\(q,skills\)\)/);
  assert.match(source,/item&&item\.skillId\?skills\.has\(String\(item\.skillId\)\)/);
});
