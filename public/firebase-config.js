// firebase-config.js
// Firebase client initialization and server-side learning API.
// Firebase SDK 改為 lazy load：即使 CDN / Firebase 暫時不可用，首頁仍可先載入本地題目。

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
let functions = null;
let firebaseReadyPromise = null;
let currentUserId = null;

async function getFirebase() {
  if (firebaseReadyPromise) return firebaseReadyPromise;

  firebaseReadyPromise = (async () => {
    const [appModule, firestoreModule, authModule, functionsModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js")
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    db = firestoreModule.getFirestore(app);
    auth = authModule.getAuth(app);
    functions = functionsModule.getFunctions(app);

    return { firestoreModule, authModule, functionsModule };
  })().catch(error => {
    firebaseReadyPromise = null;
    throw error;
  });

  return firebaseReadyPromise;
}

export { getFirebase };
export { db, auth, functions };

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms))
  ]);
}

export async function ensureLogin() {
  try {
    const { authModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(new Promise((resolve) => {
      let settled = false;
      let unsubscribe = null;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        try { unsubscribe?.(); } catch (_) {}
        resolve(value);
      };
      unsubscribe = authModule.onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId = user.uid;
          finish(user.uid);
          return;
        }
        authModule.signInAnonymously(auth).catch((e) => {
          console.warn("匿名登入失敗，將使用離線模式", e);
          finish(null);
        });
      });
    }), 8000, 'Firebase authentication');
  } catch (error) {
    console.warn('Firebase authentication unavailable:', error);
    return null;
  }
}

export function getCurrentUserId() { return currentUserId; }

export async function fetchAllQuestions() {
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(
      firestoreModule.getDocs(firestoreModule.collection(db, "questions"))
        .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      8000,
      'questions read'
    );
  } catch (error) {
    console.warn('questions read unavailable:', error);
    return [];
  }
}

export async function fetchAllKnowledgePoints() {
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(
      firestoreModule.getDocs(firestoreModule.collection(db, "knowledgePoints"))
        .then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      8000,
      'knowledge points read'
    );
  } catch (error) {
    console.warn('knowledge points read unavailable:', error);
    return [];
  }
}

export async function fetchUserKnowledgeState(userId) {
  if (!userId) return {};
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    return await withTimeout(
      firestoreModule.getDocs(firestoreModule.collection(db, "users", userId, "knowledge"))
        .then((snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      8000,
      'user knowledge read'
    );
  } catch (error) {
    console.warn('user knowledge read unavailable:', error);
    return {};
  }
}

export async function submitAnswer(answer) {
  const { functionsModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
  const result = await withTimeout(
    functionsModule.httpsCallable(functions, "submitAnswer")(answer),
    10000,
    'submit answer'
  );
  return result.data;
}

export async function getDueKnowledgePoints() {
  const { functionsModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
  const result = await withTimeout(
    functionsModule.httpsCallable(functions, "getDueKnowledgePoints")({}),
    10000,
    'due knowledge points'
  );
  return result.data;
}

export async function getDailyLearningPlan() {
  const { functionsModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
  const result = await withTimeout(
    functionsModule.httpsCallable(functions, "getDailyLearningPlan")({}),
    10000,
    'daily learning plan'
  );
  return result.data;
}

export async function fetchUserGamification(userId) {
  if (!userId) return null;
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    const snap = await withTimeout(
      firestoreModule.getDoc(firestoreModule.doc(db, "users", userId, "gamification", "state")),
      8000,
      'gamification read'
    );
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn('gamification read unavailable:', error);
    return null;
  }
}

export async function fetchUserKnowledge(userId, kpId) {
  if (!userId || !kpId) return null;
  try {
    const { firestoreModule } = await withTimeout(getFirebase(), 8000, 'Firebase SDK');
    const snap = await withTimeout(
      firestoreModule.getDoc(firestoreModule.doc(db, "users", userId, "knowledge", kpId)),
      8000,
      'knowledge read'
    );
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn('knowledge read unavailable:', error);
    return null;
  }
}
