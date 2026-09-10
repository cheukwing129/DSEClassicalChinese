const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Cloudflare answer API persists concept mastery transactionally',()=>{
 const worker=read('public/_worker.js');
 assert.match(worker,/beginTransaction/);
 assert.match(worker,/users\/\$\{uid\}\/concepts\/\$\{conceptKey\}/);
 assert.match(worker,/selectedAnswer: answer\.selectedAnswer/);
 assert.match(worker,/correctAnswer: answer\.correctAnswer/);
 assert.match(worker,/conceptMastery: conceptResult/);
 assert.match(worker,/if \(logDoc\)/);
 assert.match(worker,/duplicate: true/);
});

test('Cloudflare daily plan schedules weak concepts with question targeting metadata',()=>{
 const worker=read('public/_worker.js');
 assert.match(worker,/users\/\$\{uid\}\/concepts/);
 assert.match(worker,/conceptReview: true/);
 assert.match(worker,/conceptQuestionIds/);
 assert.match(worker,/conceptMastery: Number\(c\.mastery \|\| 0\)/);
 assert.match(worker,/conceptReview: selected\.filter/);
});

test('firebase client downloads concept state and sends learning writes to same-origin Pages API',()=>{
 const firebase=read('public/firebase-config.js');
 assert.match(firebase,/fetchUserConceptState/);
 assert.match(firebase,/collection\(db, "users", userId, "concepts"\)/);
 assert.match(firebase,/function enrichConcept\(answer\)/);
 assert.match(firebase,/conceptKey: String\(concept\.key\)/);
 assert.match(firebase,/function authorizedApi\(path, options = \{\}\)/);
 assert.match(firebase,/auth\.currentUser\.getIdToken\(\)/);
 assert.match(firebase,/authorizedApi\('\/api\/submit-answer'/);
 assert.match(firebase,/authorizedApi\('\/api\/daily-plan'/);
 assert.doesNotMatch(firebase,/httpsCallable\(functions/);
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
