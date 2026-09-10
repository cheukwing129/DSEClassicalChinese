// firebase-config.js
// Firebase client initialization for authentication + Firestore reads.
// Server-authoritative learning writes now go through same-origin Cloudflare Pages API.

const firebaseConfig = {
  apiKey: "AIzaSyCGhpSFHy3MDf75fhAJtrHTQJoa18SjqAM",
  authDomain: "manjingo-95d9a.firebaseapp.com",
  projectId: "manjingo-95d9a",
  storageBucket: "manjingo-95d9a.firebasestorage.app",
  messagingSenderId: "653860419855",
  appId: "1:653860419855:web:bd584b431a71a0ca70267a"
};

let db = null;
let auth = null;
let firebaseReadyPromise = null;
let currentUserId = null;

async function getFirebase() {
  if (firebaseReadyPromise) return firebaseReadyPromise;
  firebaseReadyPromise = (async () => {
    const [appModule, firestoreModule, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js")
    ]);
    const app = appModule.initializeApp(firebaseConfig);
    db = firestoreModule.getFirestore(app);
    auth = authModule.getAuth(app);
    return { firestoreModule, authModule };
  })().catch(error => { firebaseReadyPromise = null; throw error; });
  return firebaseReadyPromise;
}

export { getFirebase };
export { db, auth };

function withTimeout(promise, ms, label) {
  return Promise.race([promise,new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms))]);
}
function isoTimestamp(value) {
  if (!value) return null;
  try {
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value === 'string') return value;
    if (Number.isFinite(Number(value._seconds))) return new Date(Number(value._seconds) * 1000).toISOString();
    if (Number.isFinite(Number(value.seconds))) return new Date(Number(value.seconds) * 1000).toISOString();
    const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d.toISOString();
  } catch (_) { return null; }
}

export async function ensureLogin() {
  try {
    const { authModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(new Promise((resolve) => {
      let settled = false;
      let unsubscribe = null;
      const finish = (value) => { if (settled) return; settled = true; try { unsubscribe?.(); } catch (_) {} resolve(value); };
      unsubscribe = authModule.onAuthStateChanged(auth, (user) => {
        if (user) { currentUserId = user.uid; finish(user.uid); return; }
        authModule.signInAnonymously(auth).catch((e) => { console.warn("匿名登入失敗，將使用離線模式", e); finish(null); });
      });
    }), 8000, 'Firebase authentication');
  } catch (error) {
    console.warn('Firebase authentication unavailable:', error);
    return null;
  }
}

export function getCurrentUserId() { return currentUserId; }

async function authorizedApi(path, options = {}) {
  const uid = await ensureLogin();
  if (!uid || !auth || !auth.currentUser) throw new Error('Firebase authentication unavailable');
  const idToken = await withTimeout(auth.currentUser.getIdToken(), 8000, 'Firebase ID token');
  const response = await withTimeout(fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
      authorization: `Bearer ${idToken}`
    }
  }), 12000, 'learning API');
  let data = null;
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data && data.error ? data.error : `learning API ${response.status}`);
  return data;
}

export async function fetchAllQuestions() {
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(firestoreModule.getDocs(firestoreModule.collection(db, "questions")).then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),8000,'questions read');
  } catch (error) { console.warn('questions read unavailable:', error); return []; }
}

export async function fetchAllKnowledgePoints() {
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(firestoreModule.getDocs(firestoreModule.collection(db, "knowledgePoints")).then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),8000,'knowledge points read');
  } catch (error) { console.warn('knowledge points read unavailable:', error); return []; }
}

export async function fetchUserKnowledgeState(userId) {
  if (!userId) return {};
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(firestoreModule.getDocs(firestoreModule.collection(db, "users", userId, "knowledge")).then((snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),8000,'user knowledge read');
  } catch (error) { console.warn('user knowledge read unavailable:', error); return {}; }
}

export async function fetchUserConceptState(userId) {
  if (!userId) return {};
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(
      firestoreModule.getDocs(firestoreModule.collection(db, "users", userId, "concepts")).then((snap) => Object.fromEntries(snap.docs.map((d) => {
        const data = d.data();
        return [d.id, { ...data, conceptKey: d.id, lastAnsweredAt: isoTimestamp(data.lastAnsweredAt), updatedAt: isoTimestamp(data.updatedAt) }];
      }))),
      8000,
      'concept mastery read'
    );
  } catch (error) { console.warn('concept mastery read unavailable:', error); return {}; }
}

function enrichConcept(answer) {
  if (!answer || answer.conceptKey) return answer;
  try {
    const content = window.ManjingoContent;
    const q = content && Array.isArray(content.questions) ? content.questions.find((x) => String(x.id) === String(answer.questionId) && String(x.kpId) === String(answer.kpId)) : null;
    const concept = q && q.misconceptionKey ? { key: q.misconceptionKey, label: q.misconceptionLabel } : content && typeof content.misconceptionConcept === 'function' ? content.misconceptionConcept(q || answer) : null;
    return concept ? { ...answer, conceptKey: String(concept.key), conceptLabel: String(concept.label || concept.key) } : answer;
  } catch (_) { return answer; }
}

export async function submitAnswer(answer) {
  const payload = enrichConcept(answer);
  return authorizedApi('/api/submit-answer', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getDueKnowledgePoints() {
  return authorizedApi('/api/due-knowledge-points');
}

export async function getDailyLearningPlan() {
  return authorizedApi('/api/daily-plan');
}

export async function fetchUserGamification(userId) {
  if (!userId) return null;
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    const snap = await withTimeout(firestoreModule.getDoc(firestoreModule.doc(db, "users", userId, "gamification", "state")),8000,'gamification read');
    return snap.exists() ? snap.data() : null;
  } catch (error) { console.warn('gamification read unavailable:', error); return null; }
}

export async function fetchUserKnowledge(userId, kpId) {
  if (!userId || !kpId) return null;
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    const snap = await withTimeout(firestoreModule.getDoc(firestoreModule.doc(db, "users", userId, "knowledge", kpId)),8000,'knowledge read');
    return snap.exists() ? snap.data() : null;
  } catch (error) { console.warn('knowledge read unavailable:', error); return null; }
}
