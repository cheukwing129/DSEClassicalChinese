import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = String(process.env.MANJINGO_BASE_URL || 'https://manjingo.pages.dev').replace(/\/$/, '');
const firebaseSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'firebase-config.js'), 'utf8');
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

console.log(`Smoke testing ${baseUrl}`);

const healthResponse = await api('/api/health');
const health = await readJson(healthResponse, 'health');
check(healthResponse.ok && health.ok === true, `health failed (${healthResponse.status})`);
check(health.configured === true, 'Pages Worker is deployed but Firebase server credentials are not configured');
check(health.service === 'manjingo-learning', 'unexpected health service');
console.log(`✓ health: ${health.service} / ${health.firestoreProject}`);

const signup = await firebaseIdentity('accounts:signUp', { returnSecureToken: true });
check(signup.idToken, 'anonymous Firebase sign-up did not return an ID token');
const idToken = signup.idToken;
let smokeError = null;

try {
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

  const invalidSubmitResponse = await api('/api/submit-answer', idToken, { method: 'POST', body: '{}' });
  const invalidSubmit = await readJson(invalidSubmitResponse, 'submit validation');
  check(invalidSubmitResponse.status === 400, `submit validation expected HTTP 400, got ${invalidSubmitResponse.status}`);
  check(/Invalid answer payload/i.test(String(invalidSubmit.error || '')), 'submit validation did not reject invalid payload');
  console.log('✓ submit route authenticated and rejected invalid payload without writing data');
} catch (error) {
  smokeError = error;
} finally {
  try {
    await firebaseIdentity('accounts:delete', { idToken });
    console.log('✓ temporary anonymous Firebase user deleted');
  } catch (cleanupError) {
    if (!smokeError) smokeError = cleanupError;
    else console.error('cleanup failed:', cleanupError.message);
  }
}

if (smokeError) throw smokeError;
console.log('Pages learning API smoke test passed');
