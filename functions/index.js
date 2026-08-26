/**
 * functions/index.js
 * SM-2間隔重複 Cloud Function
 * 觸發方式：前端提交答案時呼叫 HTTPS Callable Function "submitAnswer"
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

function calculateSM2(quality, prev) {
  let { easeFactor = 2.5, repetition = 0, interval = 0 } = prev;

  if (quality < 3) {
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + interval * 24 * 60 * 60 * 1000
  );

  return { easeFactor, repetition, interval, nextReviewAt, lastQuality: quality };
}

function toQuality({ isCorrect, usedHint, attemptCount }) {
  if (!isCorrect) return attemptCount > 1 ? 1 : 0;
  if (usedHint) return 3;
  if (attemptCount === 1) return 5;
  return 4;
}

exports.submitAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "請先登入");
  }
  const userId = context.auth.uid;
  const { kpId, isCorrect, usedHint = false, attemptCount = 1 } = data;

  if (!kpId) {
    throw new functions.https.HttpsError("invalid-argument", "缺少 kpId");
  }

  const quality = toQuality({ isCorrect, usedHint, attemptCount });

  const progressRef = db
    .collection("userProgress")
    .doc(userId)
    .collection("kpRecords")
    .doc(kpId);

  const snap = await progressRef.get();
  const prev = snap.exists ? snap.data() : {};

  const updated = calculateSM2(quality, prev);

  await progressRef.set(
    {
      ...updated,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { success: true, quality, ...updated };
});

exports.getDueKnowledgePoints = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "請先登入");
  }
  const userId = context.auth.uid;
  const now = admin.firestore.Timestamp.now();

  const snap = await db
    .collection("userProgress")
    .doc(userId)
    .collection("kpRecords")
    .where("nextReviewAt", "<=", now)
    .get();

  const dueKpIds = snap.docs.map((doc) => doc.id);
  return { dueKpIds, count: dueKpIds.length };
});
