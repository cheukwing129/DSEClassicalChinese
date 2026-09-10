const test=require('node:test');
const assert=require('node:assert/strict');
const sync=require('../public/account-sync.js');

test('cross-device merge keeps the newer knowledge record on each KP',()=>{
 const local={totalXp:80,todayXp:10,todayDate:'2026-09-10',streak:4,knowledge:{a:{attempts:5,mastery:60,lastAnsweredAt:'2026-09-10T10:00:00Z'},b:{attempts:2,mastery:30,lastAnsweredAt:'2026-09-09T10:00:00Z'}},conceptMastery:{},practiceHistory:[]};
 const remote={totalXp:100,todayXp:16,todayDate:'2026-09-10',streak:3,knowledge:{a:{attempts:4,mastery:55,lastAnsweredAt:'2026-09-10T11:00:00Z'},b:{attempts:3,mastery:45,lastAnsweredAt:'2026-09-10T09:00:00Z'}},conceptMastery:{},practiceHistory:[]};
 const merged=sync.mergeLearningState(local,remote);
 assert.equal(merged.totalXp,100);
 assert.equal(merged.todayXp,16);
 assert.equal(merged.streak,4);
 assert.equal(merged.knowledge.a.mastery,60);
 assert.equal(merged.knowledge.b.mastery,45);
});

test('equal-attempt records use the most recent answer timestamp',()=>{
 const local={knowledge:{a:{attempts:3,mastery:40,lastAnsweredAt:'2026-09-10T09:00:00Z'}}};
 const remote={knowledge:{a:{attempts:3,mastery:52,lastAnsweredAt:'2026-09-10T10:00:00Z'}}};
 assert.equal(sync.mergeLearningState(local,remote).knowledge.a.mastery,52);
});

test('practice history is unioned, deduplicated, and ordered newest first',()=>{
 const first={kpId:'a',completedAt:'2026-09-10T10:00:00Z',strategy:'targeted',beforeMastery:40,afterMastery:50};
 const second={kpId:'a',completedAt:'2026-09-10T11:00:00Z',strategy:'remedial',beforeMastery:50,afterMastery:58};
 const merged=sync.mergePracticeHistory([first],[first,second]);
 assert.equal(merged.length,2);
 assert.equal(merged[0].strategy,'remedial');
 assert.equal(merged[1].strategy,'targeted');
});

test('question rotation merge keeps local recency then appends remote unique ids',()=>{
 const merged=sync.mergeRotation({kp:['q5','q4','q3']},{kp:['q4','q2','q1']});
 assert.deepEqual(Array.from(merged.kp),['q5','q4','q3','q2','q1']);
});

test('gamification merge never moves total XP or streak backwards',()=>{
 const merged=sync.mergeGame({totalXp:120,todayXp:12,todayDate:'2026-09-10',streak:6},{totalXp:100,todayXp:20,todayXpDate:'2026-09-10',streak:5});
 assert.equal(merged.totalXp,120);
 assert.equal(merged.todayXp,20);
 assert.equal(merged.streak,6);
});
