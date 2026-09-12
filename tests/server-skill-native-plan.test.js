const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const curriculum=require('../public/curriculum-v1.js');
const planner=require('../public/server-skill-plan.js');

const root=path.join(__dirname,'..');
function source(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadCatalog(){
 const context={window:{},Map,Set,Array,Object,Number,String,Math};vm.createContext(context);
 for(const file of ['public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js','public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/question-pack-transfer-03.js','public/question-pack-transfer-04.js','public/question-pack-transfer-05.js','public/question-pack-transfer-06.js','public/content-catalog.js'])vm.runInContext(source(file),context,{filename:file});
 return context.window.ManjingoContent;
}
const catalog=loadCatalog();
const kpUniverse=catalog.knowledgePoints.map(kp=>({id:String(kp.kpId),data:{textId:kp.textId||null,type:kp.type||null}}));
const now=new Date('2026-09-12T08:00:00Z');
const future='2026-10-12T08:00:00Z';
function skillDoc(skillId,mastery=70,overrides={}){return{id:String(skillId),data:{skillId:String(skillId),mastery,attempts:3,correctCount:3,wrongCount:0,lastCorrect:true,lastAnsweredAt:'2026-09-12T07:00:00Z',nextReviewAt:future,source:'server-native-v1',...overrides}}}
function plan(options={}){return planner.buildPlan({kpUniverse,knowledge:[],skills:[],concepts:[],interventions:[],targetCount:10,now,...options})}

test('real reviewed KP universe gives every one of the 49 core skills a server practice route',()=>{
 const {routes}=planner.buildRoutes(kpUniverse),core=curriculum.coreSkills();
 assert.equal(core.length,49);
 for(const skill of core)assert.ok((routes.get(skill.id)||[]).length>0,`missing server route for ${skill.id}`);
 assert.equal(Object.keys(planner.NATIVE_KP_SKILLS).length,14);
 const compatibilitySkills=Array.from(new Set(Object.values(planner.QUESTION_EVIDENCE_KP_SKILLS).flat())).sort();
 assert.deepEqual(compatibilitySkills,['fw.nai','lex.causative','lex.polysemy','read.referent-tracking']);
});

test('fresh learner receives ten unique skills from only the first unlocked stage',()=>{
 const result=plan();
 assert.equal(result.planVersion,'server-skill-native-v1');
 assert.equal(result.skillFirst,true);
 assert.equal(result.items.length,10);
 assert.equal(new Set(result.skills).size,10);
 assert.deepEqual(Array.from(result.unlockedStages),['foundation']);
 assert.equal(result.availableSkillCount,14);
 assert.equal(result.skills.every(id=>planner.classifySkill(curriculum.skill(id))==='foundation'),true);
});

test('word-advanced unlocks only when foundation average reaches 70',()=>{
 const foundation=curriculum.coreSkills().filter(skill=>planner.classifySkill(skill)==='foundation');
 const skills=foundation.map(skill=>skillDoc(skill.id,70));
 const result=plan({skills});
 assert.deepEqual(Array.from(result.unlockedStages),['foundation','word-advanced']);
 assert.equal(result.availableSkillCount,22);
 assert.equal(result.unlockedStages.includes('syntax'),false);
});

test('server-native skill beats an equal-time legacy projection even with fewer attempts',()=>{
 const time='2026-09-12T07:00:00Z';
 const stored=new Map([['fw.zhi',{skillId:'fw.zhi',mastery:82,attempts:1,lastAnsweredAt:time,nextReviewAt:future,source:'server-native-v1'}]]);
 const knowledge=new Map([['kp_virtual_zhi',{mastery:25,attempts:12,lastAnsweredAt:time,nextReviewAt:future,lastCorrect:false}]]);
 const resolved=planner.resolveSkill('fw.zhi',['kp_virtual_zhi'],stored,knowledge);
 assert.equal(resolved.source,'server-native-v1');
 assert.equal(resolved.mastery,82);
 assert.equal(resolved.attempts,1);
});

test('genuinely newer legacy evidence can still supersede an older native skill during migration',()=>{
 const stored=new Map([['fw.zhi',{skillId:'fw.zhi',mastery:82,attempts:5,lastAnsweredAt:'2026-09-12T06:00:00Z',nextReviewAt:future,source:'server-native-v1'}]]);
 const knowledge=new Map([['kp_virtual_zhi',{mastery:35,attempts:6,lastAnsweredAt:'2026-09-12T07:00:00Z',nextReviewAt:future,lastCorrect:false}]]);
 const resolved=planner.resolveSkill('fw.zhi',['kp_virtual_zhi'],stored,knowledge);
 assert.equal(resolved.source,'legacy-projection');
 assert.equal(resolved.mastery,35);
});

test('weak misconception is lifted from its KP into a skill-first review target',()=>{
 const skills=[skillDoc('fw.zhi',80)];
 const concepts=[{id:'fw:zhi:pronoun',data:{conceptLabel:'「之」作代詞',mastery:30,attempts:2,lastCorrect:false,kpIds:['kp_virtual_zhi'],questionIds:['p3_zhi_01']}}];
 const result=plan({skills,concepts});
 const item=result.items.find(x=>x.skillId==='fw.zhi');
 assert.ok(item);
 assert.equal(item.conceptReview,true);
 assert.equal(item.conceptKey,'fw:zhi:pronoun');
 assert.equal(item.kpId,'kp_virtual_zhi');
 assert.equal(item.category,'weak');
});

test('server-authoritative reteach outranks ordinary review and keeps its stored route',()=>{
 const skills=[skillDoc('fw.zhi',80),skillDoc('fw.er',25,{lastCorrect:false,nextReviewAt:'2026-09-01T08:00:00Z'})];
 const interventions=[{id:'fw.zhi',data:{skillId:'fw.zhi',routeKpId:'kp_virtual_zhi',learningState:{key:'reteach',label:'需要概念重教',priority:4,actionable:true,tone:'danger'},updatedAt:'2026-09-12T07:30:00Z',source:'server-native-v1'}}];
 const result=plan({skills,interventions});
 assert.equal(result.interventionAdaptive,true);
 assert.equal(result.items[0].skillId,'fw.zhi');
 assert.equal(result.items[0].kpId,'kp_virtual_zhi');
 assert.equal(result.items[0].interventionState,'reteach');
 assert.equal(result.items[0].interventionActionable,true);
 assert.equal(result.interventions[0].skillId,'fw.zhi');
});

test('effective server intervention cools a weak skill instead of immediately re-escalating it',()=>{
 const skills=[skillDoc('fw.zhi',50,{lastCorrect:false})];
 const interventions=[{id:'fw.zhi',data:{skillId:'fw.zhi',routeKpId:'kp_virtual_zhi',learningState:{key:'remedial-effective',label:'補救後已穩定',priority:0,actionable:false,tone:'success'},updatedAt:'2026-09-12T07:30:00Z',source:'server-native-v1'}}];
 const result=plan({skills,interventions});
 const item=result.items.find(x=>x.skillId==='fw.zhi');
 assert.ok(item);
 assert.equal(item.interventionCooldown,true);
 assert.equal(item.interventionActionable,false);
 assert.notEqual(item.category,'weak');
});

test('fully unlocked ten-task plan reserves two to three tasks for unseen transfer skills',()=>{
 const skills=curriculum.coreSkills().map(skill=>skillDoc(skill.id,70));
 const result=plan({skills});
 assert.deepEqual(Array.from(result.unlockedStages),['foundation','word-advanced','syntax','reading','translation','transfer']);
 assert.equal(result.availableSkillCount,49);
 assert.equal(result.items.length,10);
 const transfer=result.items.filter(item=>curriculum.skill(item.skillId).domain==='transfer');
 assert.ok(transfer.length>=2&&transfer.length<=3,`transfer count ${transfer.length}`);
 assert.ok(result.items.length-transfer.length>=7&&result.items.length-transfer.length<=8);
 assert.equal(new Set(result.skills).size,result.skills.length);
});

test('worker daily plan reads native skills and server interventions before pure skill selection',()=>{
 const worker=source('public/_worker.js');
 assert.match(worker,/import '\.\/server-skill-plan\.js'/);
 assert.match(worker,/users\/\$\{uid\}\/skills/);
 assert.match(worker,/users\/\$\{uid\}\/interventions/);
 assert.match(worker,/timed\(trace,'skills_list'/);
 assert.match(worker,/timed\(trace,'interventions_list'/);
 assert.match(worker,/SERVER_SKILL_PLAN\.buildPlan\(\{knowledge,skills,concepts,interventions,kpUniverse:kpUniverseDocs/);
 assert.doesNotMatch(worker,/const dueIds = new Set\(due\.map/);
});

test('client adapter preserves an explicit server-selected skill instead of re-inferring it from KP aliases',()=>{
 const selector=source('public/skill-first-plan.js');
 assert.match(selector,/const explicit=String\(item&&item\.skillId\|\|''\)/);
 assert.match(selector,/if\(explicit&&poolsHasSkill\(kpSkills,questionsById,explicit\)&&!used\.has\(explicit\)\)return explicit/);
});

test('Firestore catalog importer now persists question-derived skill provenance on KP documents',()=>{
 const importer=source('scripts/import_to_firestore.js');
 assert.match(importer,/const skillIdsByKp = new Map\(\)/);
 assert.match(importer,/for \(const question of catalog\.questions\)/);
 assert.match(importer,/skillIds:Array\.from\(skillIdsByKp\.get\(String\(kp\.kpId\)\)\|\|\[\]\)/);
});
