const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const curriculum=require('../public/curriculum-v1.js');
const metadata=require('../public/question-metadata-v1.js');
const planner=require('../public/server-skill-plan.js');
const root=path.join(__dirname,'..');
function source(file){return fs.readFileSync(path.join(root,file),'utf8')}
function loadCatalog(){const context={window:{},Map,Set,Array,Object,Number,String,Math};vm.createContext(context);for(const file of ['public/question-pack-02.js','public/question-pack-03.js','public/question-pack-lesson.js','public/question-pack-capacity-01.js','public/question-pack-transfer-01.js','public/question-pack-transfer-03.js','public/question-pack-transfer-04.js','public/question-pack-transfer-05.js','public/question-pack-transfer-06.js','public/content-catalog.js'])vm.runInContext(source(file),context,{filename:file});return context.window.ManjingoContent;}
test('diagnose missing server routes',()=>{const catalog=loadCatalog(),annotated=metadata.annotateAll(catalog.questions),kpUniverse=catalog.knowledgePoints.map(kp=>({id:String(kp.kpId),data:{}})),routes=planner.buildRoutes(kpUniverse).routes,missing={};for(const skill of curriculum.coreSkills()){if((routes.get(skill.id)||[]).length)continue;missing[skill.id]=Array.from(new Set(annotated.filter(q=>q.normalCore&&Array.isArray(q.skillIds)&&q.skillIds.includes(skill.id)).map(q=>String(q.kpId))));}assert.deepEqual(missing,{},JSON.stringify(missing));});
