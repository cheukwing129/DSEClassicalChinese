const test=require('node:test');
const assert=require('node:assert/strict');
const practice=require('../public/server-practice-state.js');

function session(id,overrides={}){return{practiceId:id,skillId:'fw.zhi',routeKpId:'kp_virtual_zhi',kpId:'kp_virtual_zhi',beforeMastery:35,afterMastery:37,correctCount:2,questionCount:4,strategy:'targeted',completedAt:'2026-09-12T10:00:00Z',...overrides}}

test('server practice state turns repeated low-yield targeted work into remediation',()=>{
 const first=practice.buildIntervention({},session('practice_001'),new Date('2026-09-12T10:01:00Z'));
 const second=practice.buildIntervention(first,session('practice_002',{beforeMastery:37,afterMastery:39,completedAt:'2026-09-12T11:00:00Z'}),new Date('2026-09-12T11:01:00Z'));
 assert.equal(second.history.length,2);
 assert.equal(second.learningState.key,'remedial');
 assert.equal(second.learningState.actionable,true);
 assert.equal(second.learningState.targeted.totalDelta,4);
});

test('failed remedial verification becomes server-authoritative concept reteach',()=>{
 let state=practice.buildIntervention({},session('practice_011'),new Date('2026-09-12T10:01:00Z'));
 state=practice.buildIntervention(state,session('practice_012',{beforeMastery:37,afterMastery:39,completedAt:'2026-09-12T11:00:00Z'}),new Date('2026-09-12T11:01:00Z'));
 state=practice.buildIntervention(state,session('practice_013',{beforeMastery:39,afterMastery:39,correctCount:1,questionCount:2,strategy:'remedial',completedAt:'2026-09-12T12:00:00Z'}),new Date('2026-09-12T12:01:00Z'));
 assert.equal(state.learningState.key,'reteach');
 assert.equal(state.learningState.intervention.strategy,'remedial');
 assert.equal(state.learningState.intervention.effective,false);
});

test('per-skill server practice history stays bounded and newest-first',()=>{
 let state={};
 for(let i=0;i<25;i++)state=practice.buildIntervention(state,session('practice_'+String(i).padStart(3,'0'),{completedAt:new Date(Date.UTC(2026,8,1,0,i)).toISOString()}),new Date(Date.UTC(2026,8,1,1,i)));
 assert.equal(state.history.length,practice.MAX_HISTORY_PER_SKILL);
 assert.equal(state.history[0].practiceId,'practice_024');
 assert.equal(state.history.at(-1).practiceId,'practice_005');
});

test('flattened server state keeps skills distinct even when they share one route',()=>{
 const a=practice.buildIntervention({},session('practice_101'),new Date('2026-09-12T10:01:00Z'));
 const b=practice.buildIntervention({},session('practice_102',{skillId:'fw.er',practiceId:'practice_102'}),new Date('2026-09-12T10:02:00Z'));
 const flat=practice.flattenInterventions([{id:'fw.zhi',data:a},{id:'fw.er',data:b}]);
 assert.equal(flat.practiceHistory.length,2);
 assert.deepEqual(new Set(flat.practiceIds),new Set(['practice_101','practice_102']));
 assert.equal(flat.interventionState['fw.zhi'].skillId,'fw.zhi');
 assert.equal(flat.interventionState['fw.er'].skillId,'fw.er');
});
