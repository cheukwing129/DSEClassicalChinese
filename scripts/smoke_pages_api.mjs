import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const stateFile = process.env.MANJINGO_SMOKE_STATE_FILE || path.join(root, '.manjingo-smoke-user.json');
const baseUrl = String(process.env.MANJINGO_BASE_URL || 'https://manjingo.pages.dev').replace(/\/$/, '');
const firebaseSource = fs.readFileSync(path.join(root, 'public', 'firebase-config.js'), 'utf8');
const apiKeyMatch = firebaseSource.match(/apiKey:\s*["']([^"']+)["']/);
if (!apiKeyMatch) throw new Error('Firebase web apiKey not found in public/firebase-config.js');
const apiKey = apiKeyMatch[1];

function check(value, message) {
  if (!value) throw new Error(message);
}
async function readJson(response, label) {
  let data;
  try { data = await response.json(); }
  catch (_) { throw new Error(`${label} returned non-JSON (${response.status})`); }
  return data;
}
async function api(pathname, token, init = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
}
async function firebaseIdentity(endpoint, body) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await readJson(response, `Firebase ${endpoint}`);
  if (!response.ok) throw new Error(`Firebase ${endpoint} failed (${response.status}): ${data.error?.message || 'unknown error'}`);
  return data;
}
function fromFsValue(value) {
  if (!value) return null;
  if ('nullValue' in value) return null;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('stringValue' in value) return value.stringValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFsValue);
  if ('mapValue' in value) return fromFields(value.mapValue.fields || {});
  return null;
}
function fromFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, fromFsValue(value)]));
}
async function firestoreDocument(projectId, documentPath, token) {
  const encoded = documentPath.split('/').map(encodeURIComponent).join('/');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encoded}`;
  const response = await fetch(url, { headers: { accept: 'application/json', authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  const data = await readJson(response, `Firestore ${documentPath}`);
  if (!response.ok) throw new Error(`Firestore ${documentPath} failed (${response.status}): ${data.error?.message || 'unknown error'}`);
  return fromFields(data.fields || {});
}

console.log(`Smoke testing ${baseUrl}`);

const healthResponse = await api('/api/health');
const health = await readJson(healthResponse, 'health');
check(healthResponse.ok && health.ok === true, `health failed (${healthResponse.status})`);
check(health.configured === true, 'Pages Worker is deployed but Firebase server credentials are not configured');
check(health.service === 'manjingo-learning', 'unexpected health service');
console.log(`✓ health: ${health.service} / ${health.firestoreProject}`);

const signup = await firebaseIdentity('accounts:signUp', { returnSecureToken: true });
check(signup.idToken && signup.localId, 'anonymous Firebase sign-up did not return ID token and uid');
const idToken = signup.idToken;
const uid = String(signup.localId);
fs.writeFileSync(stateFile, JSON.stringify({ uid, createdAt: new Date().toISOString() }));

const planResponse = await api('/api/daily-plan', idToken);
const plan = await readJson(planResponse, 'daily plan');
check(planResponse.ok, `daily plan failed (${planResponse.status}): ${plan.error || 'unknown error'}`);
check(Array.isArray(plan.items), 'daily plan did not return items[]');
check(Number.isFinite(Number(plan.totalRecommended)), 'daily plan did not return totalRecommended');
console.log(`✓ authenticated Firestore daily plan: ${plan.items.length} item(s)`);

const dueResponse = await api('/api/due-knowledge-points', idToken);
const due = await readJson(dueResponse, 'due knowledge points');
check(dueResponse.ok, `due knowledge points failed (${dueResponse.status}): ${due.error || 'unknown error'}`);
check(Array.isArray(due.dueKpIds), 'due knowledge points did not return dueKpIds[]');
console.log(`✓ authenticated Firestore due lookup: ${due.dueKpIds.length} due`);

const answerId = `smokee2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const conceptKey = 'smoke_e2e_concept';
const localDate = new Date().toISOString().slice(0, 10);
const validPayload = {
  answerId,
  kpId: 'kp_yueyang_001',
  questionId: 'q001',
  textId: 'yueyanglou',
  conceptKey,
  conceptLabel: 'Production smoke concept',
  selectedAnswer: '貶官',
  correctAnswer: '貶官',
  isCorrect: true,
  usedHint: false,
  attemptCount: 1,
  responseTimeMs: 250,
  localDate
};
const submitResponse = await api('/api/submit-answer', idToken, { method: 'POST', body: JSON.stringify(validPayload) });
const submit = await readJson(submitResponse, 'valid answer submit');
check(submitResponse.ok && submit.success === true, `valid answer submit failed (${submitResponse.status}): ${submit.error || 'unknown error'}`);
check(Number(submit.xpEarned) === 8, `expected 8 XP from first correct answer, got ${submit.xpEarned}`);
check(Number(submit.mastery) > 0, 'valid answer did not increase mastery');
check(Number(submit.totalXp) === 8, `expected total XP 8 for temporary user, got ${submit.totalXp}`);
console.log(`✓ real reviewed answer committed: +${submit.xpEarned} XP, mastery ${submit.mastery}%`);

const [knowledge, game, concept, answerLog] = await Promise.all([
  firestoreDocument(health.firestoreProject, `users/${uid}/knowledge/${validPayload.kpId}`, idToken),
  firestoreDocument(health.firestoreProject, `users/${uid}/gamification/state`, idToken),
  firestoreDocument(health.firestoreProject, `users/${uid}/concepts/${conceptKey}`, idToken),
  firestoreDocument(health.firestoreProject, `users/${uid}/answerLogs/${answerId}`, idToken)
]);
check(knowledge && Number(knowledge.mastery) === Number(submit.mastery), 'knowledge mastery was not persisted exactly');
check(Number(knowledge.attempts) === 1 && knowledge.lastCorrect === true, 'knowledge attempt state was not persisted');
check(game && Number(game.totalXp) === 8 && Number(game.todayXp) === 8, 'gamification XP was not persisted');
check(concept && Number(concept.attempts) === 1 && Number(concept.mastery) > 0, 'concept mastery was not persisted');
check(answerLog && answerLog.questionId === 'q001' && answerLog.isCorrect === true && Number(answerLog.xpEarned) === 8, 'answer log was not persisted');
console.log('✓ Firestore verified knowledge, XP, concept mastery, and answerLog writes');

const invalidSubmitResponse = await api('/api/submit-answer', idToken, { method: 'POST', body: '{}' });
const invalidSubmit = await readJson(invalidSubmitResponse, 'submit validation');
check(invalidSubmitResponse.status === 400, `submit validation expected HTTP 400, got ${invalidSubmitResponse.status}`);
check(/Invalid answer payload/i.test(String(invalidSubmit.error || '')), 'submit validation did not reject invalid payload');
console.log('✓ submit route still rejects invalid payload without an additional write');

console.log('Pages learning API write smoke passed; cleanup will run in the workflow finalizer');
