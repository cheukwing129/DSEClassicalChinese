// firebase-config.js
// Firebase client initialization and server-side learning API.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGhpSFHy3MDf75fhAJtrHTQJoa18SjqAM",
  authDomain: "manjingo-95d9a.firebaseapp.com",
  projectId: "manjingo-95d9a",
  storageBucket: "manjingo-95d9a.firebasestorage.app",
  messagingSenderId: "653860419855",
  appId: "1:653860419855:web:bd584b431a71a0ca70267a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
let currentUserId = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), ms))
  ]);
}

export function ensureLogin() {
  return withTimeout(new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { unsubscribe?.(); } catch (_) {}
      resolve(value);
    };
    let unsubscribe = null;
    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUserId = user.uid;
        finish(user.uid);
        return;
      }
      signInAnonymously(auth).catch((e) => {
        console.warn("匿名登入失敗，將使用離線模式", e);
        finish(null);
      });
    });
  }), 8000, 'Firebase authentication');
}

export function getCurrentUserId() { return currentUserId; }

export async function fetchAllQuestions() {
  return withTimeout(
    getDocs(collection(db, "questions")).then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    8000,
    'questions read'
  );
}

export async function fetchAllKnowledgePoints() {
  return withTimeout(
    getDocs(collection(db, "knowledgePoints")).then((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    8000,
    'knowledge points read'
  );
}

export async function fetchUserKnowledgeState(userId) {
  if (!userId) return {};
  return withTimeout(
    getDocs(collection(db, "users", userId, "knowledge")).then((snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
    8000,
    'user knowledge read'
  );
}

export async function submitAnswer(answer) {
  const result = await withTimeout(httpsCallable(functions, "submitAnswer")(answer), 10000, 'submit answer');
  return result.data;
}

export async function getDueKnowledgePoints() {
  const result = await withTimeout(httpsCallable(functions, "getDueKnowledgePoints")({}), 10000, 'due knowledge points');
  return result.data;
}

export async function getDailyLearningPlan() {
  const result = await withTimeout(httpsCallable(functions, "getDailyLearningPlan")({}), 10000, 'daily learning plan');
  return result.data;
}

export async function fetchUserGamification(userId) {
  if (!userId) return null;
  const snap = await withTimeout(getDoc(doc(db, "users", userId, "gamification", "state")), 8000, 'gamification read');
  return snap.exists() ? snap.data() : null;
}

export async function fetchUserKnowledge(userId, kpId) {
  if (!userId || !kpId) return null;
  const snap = await withTimeout(getDoc(doc(db, "users", userId, "knowledge", kpId)), 8000, 'knowledge read');
  return snap.exists() ? snap.data() : null;
}
