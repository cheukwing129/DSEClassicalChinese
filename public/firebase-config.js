// firebase-config.js
// 從 Firebase Console > 專案設定 > 一般 > 你的應用程式 取得以下設定值

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

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

let currentUserId = null;

export function ensureLogin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUserId = user.uid;
        resolve(user.uid);
      } else {
        signInAnonymously(auth).catch((e) => {
          console.warn("匿名登入失敗，將使用離線模式", e);
          resolve(null);
        });
      }
    });
  });
}

export function getCurrentUserId() {
  return currentUserId;
}

export async function fetchAllQuestions() {
  const snap = await getDocs(collection(db, "questions"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchUserProgress(userId) {
  if (!userId) return null;
  const ref = doc(db, "userProgress", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProgress(userId, state) {
  if (!userId) return;
  const ref = doc(db, "userProgress", userId);
  await setDoc(ref, { ...state, updatedAt: serverTimestamp() }, { merge: true });
}

export async function logAnswerEvent(userId, { questionId, kpId, isCorrect, xpGained }) {
  if (!userId) return;
  const ref = doc(db, "userProgress", userId, "answerLog", `${Date.now()}`);
  await setDoc(ref, {
    questionId, kpId, isCorrect, xpGained,
    answeredAt: serverTimestamp()
  });
}
