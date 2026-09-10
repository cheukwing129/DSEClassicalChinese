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

export function ensureLogin() { return new Promise((resolve) => { const unsubscribe = onAuthStateChanged(auth, (user) => { if (user) { currentUserId = user.uid; unsubscribe(); resolve(user.uid); return; } signInAnonymously(auth).catch((e) => { console.warn("匿名登入失敗，將使用離線模式", e); unsubscribe(); resolve(null); }); }); }); }
export function getCurrentUserId() { return currentUserId; }
export async function fetchAllQuestions() { const snap = await getDocs(collection(db, "questions")); return snap.docs.map((d) => ({ id: d.id, ...d.data() })); }
export async function fetchAllKnowledgePoints() { const snap = await getDocs(collection(db, "knowledgePoints")); return snap.docs.map((d) => ({ id: d.id, ...d.data() })); }
export async function fetchUserKnowledgeState(userId) { if (!userId) return {}; const snap = await getDocs(collection(db, "users", userId, "knowledge")); return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])); }
export async function submitAnswer(answer) { const result = await httpsCallable(functions, "submitAnswer")(answer); return result.data; }
export async function getDueKnowledgePoints() { const result = await httpsCallable(functions, "getDueKnowledgePoints")({}); return result.data; }
export async function getDailyLearningPlan() { const result = await httpsCallable(functions, "getDailyLearningPlan")({}); return result.data; }
export async function fetchUserGamification(userId) { if (!userId) return null; const snap = await getDoc(doc(db, "users", userId, "gamification", "state")); return snap.exists() ? snap.data() : null; }
export async function fetchUserKnowledge(userId, kpId) { if (!userId || !kpId) return null; const snap = await getDoc(doc(db, "users", userId, "knowledge", kpId)); return snap.exists() ? snap.data() : null; }
