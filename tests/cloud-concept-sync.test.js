const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('cloud answer persists concept mastery and misconception summary transactionally',()=>{
 const fn=read('functions/index.js');
 assert.match(fn,/calculateConceptMasteryUpdate/);
 assert.match(fn,/collection\('concepts'\)\.doc\(conceptKey\)/);
 assert.match(fn,/selectedAnswer:answer\.selectedAnswer/);
 assert.match(fn,/correctAnswer:answer\.correctAnswer/);
 assert.match(fn,/conceptMastery:conceptResult/);
 assert.match(fn,/existing\.conceptMastery/);
});

test('cloud daily plan schedules weak concepts with question targeting metadata',()=>{
 const fn=read('functions/index.js');
 assert.match(fn,/userRef\.collection\('concepts'\)/);
 assert.match(fn,/conceptReview:true/);
 assert.match(fn,/conceptQuestionIds/);
 assert.match(fn,/conceptMastery:Number\(concept\.mastery\|\|0\)/);
 assert.match(fn,/conceptReview:selected\.filter/);
});

test('firebase client can download concept state and enrich cloud answer payloads',()=>{
 const firebase=read('public/firebase-config.js');
 assert.match(firebase,/fetchUserConceptState/);
 assert.match(firebase,/collection\(db, "users", userId, "concepts"\)/);
 assert.match(firebase,/function enrichConcept\(answer\)/);
 assert.match(firebase,/conceptKey: String\(concept\.key\)/);
 assert.match(firebase,/httpsCallable\(functions, "submitAnswer"\)\(enrichConcept\(answer\)\)/);
});

test('homepage syncs cloud concepts before selection and avoids double local concept increments',()=>{
 const html=read('public/index.html');
 assert.match(html,/fetchUserConceptState\(uid\)/);
 assert.match(html,/syncRemoteConceptState\(remoteConcepts\)/);
 assert.match(html,/selectedAnswer:value/);
 assert.match(html,/correctAnswer:q\.a/);
 assert.match(html,/conceptKey:q\.misconceptionKey\|\|q\.conceptKey\|\|null/);
 assert.match(html,/resolveQuestionMisconceptions\(q\.kpId,q\.id,\{skipConcept:true\}\)/);
});

test('local engine merges returned cloud concept mastery without overwriting newer offline progress',()=>{
 const local=read('public/local-learning.js');
 assert.match(local,/function mergeRemoteConcept\(data,key,remote\)/);
 assert.match(local,/remoteAttempts>localAttempts/);
 assert.match(local,/function syncRemoteConceptState\(remote\)/);
 assert.match(local,/result\.conceptMastery&&result\.conceptMastery\.conceptKey/);
 assert.match(local,/options&&options\.skipConcept\?null:updateConceptMastery/);
});

test('firestore rules let authenticated users read only their own concept mastery',()=>{
 const rules=read('firestore.rules');
 assert.match(rules,/match \/concepts\/\{conceptKey\}/);
 assert.match(rules,/allow read: if request\.auth != null && request\.auth\.uid == userId/);
 assert.match(rules,/allow write: if false/);
});
