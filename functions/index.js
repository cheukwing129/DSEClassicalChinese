const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { calculateLearningUpdate } = require("./learningEngine");

admin.initializeApp();
const db = admin.firestore();

function assertAnswerData(data) {
  if (!data || !data.kpId) throw new functions.https.HttpsError("invalid-argument", "缺少 kpId");
  if (typeof data.isCorrect !== "boolean") throw new functions.https.HttpsError("invalid-argument", "isCorrect 必須是 boolean");
  const attemptCount = Number(data.attemptCount ?? 1);
  if (!Number.isInteger(attemptCount) || attemptCount < 1 || attemptCount > 10) throw new functions.https.HttpsError("invalid-argument", "attemptCount 必須是 1–10");
  const responseTimeMs = data.responseTimeMs == null ? null : Number(data.responseTimeMs);
  if (responseTimeMs != null && (!Number.isFinite(responseTimeMs) || responseTimeMs < 0 || responseTimeMs > 10 * 60 * 1000)) throw new functions.https.HttpsError("invalid-argument", "responseTimeMs 無效");
  const localDate = data.localDate ? String(data.localDate) : new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new functions.https.HttpsError("invalid-argument", "localDate 必須為 YYYY-MM-DD");
  return { kpId: String(data.kpId), questionId: data.questionId ? String(data.questionId) : null, textId: data.textId ? String(data.textId) : null, isCorrect: data.isCorrect, usedHint: Boolean(data.usedHint), attemptCount, responseTimeMs, localDate };
}

function calculateLevel(totalXp) {
  let level = 1; let cumulative = 0;
  while (level < 99) {
    const needed = level === 1 ? 50 : 50 + (level - 1) * 30;
    if (cumulative + needed > totalXp) break;
    cumulative += needed; level += 1;
  }
  return level;
}

exports.submitAnswer = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "請先登入");
  const userId = context.auth.uid;
  const answer = assertAnswerData(data);
  const userRef = db.collection("users").doc(userId);
  const kpRef = userRef.collection("knowledge").doc(answer.kpId);
  const logRef = userRef.collection("answerLogs").doc();
  const gamificationRef = userRef.collection("gamification").doc("state");

  const result = await db.runTransaction(async (transaction) => {
    const kpSnap = await transaction.get(kpRef);
    const gameSnap = await transaction.get(gamificationRef);
    let baseXp = 8;
    if (answer.questionId) {
      const questionSnap = await transaction.get(db.collection("questions").doc(answer.questionId));
      if (questionSnap.exists && Number.isFinite(Number(questionSnap.data().baseXp ?? questionSnap.data().xp))) baseXp = Math.max(1, Math.min(50, Number(questionSnap.data().baseXp ?? questionSnap.data().xp)));
    }
    const prev = kpSnap.exists ? kpSnap.data() : {};
    const rawGame = gameSnap.exists ? gameSnap.data() : {};
    const gameDate = rawGame.todayXpDate || answer.localDate;
    const game = gameDate === answer.localDate ? rawGame : { ...rawGame, todayXp: 0, todayXpDate: answer.localDate };
    const update = calculateLearningUpdate({ prev, ...answer, baseXp });
    const totalXp = Number(game.totalXp ?? 0) + update.xpEarned;
    const todayXp = Number(game.todayXp ?? 0) + update.xpEarned;
    const dailyGoalXp = Number(game.dailyGoalXp ?? 20);
    const previousActiveDate = game.lastActiveDate || null;
    let streak = Number(game.streak ?? 0);
    let streakFreezes = Number(game.streakFreezes ?? 2);
    let streakIncreased = false;
    if (todayXp >= dailyGoalXp && previousActiveDate !== answer.localDate) {
      const previousDate = previousActiveDate ? new Date(`${previousActiveDate}T00:00:00Z`) : null;
      const currentDate = new Date(`${answer.localDate}T00:00:00Z`);
      const gap = previousDate ? Math.round((currentDate - previousDate) / 86400000) : null;
      if (gap === 1) streak += 1;
      else if (gap == null || gap > 1) {
        const missedDays = gap == null ? 0 : gap - 1;
        if (missedDays > 0 && streakFreezes >= missedDays) { streakFreezes -= missedDays; streak += 1; }
        else { streak = 1; streakFreezes = missedDays > 0 ? 0 : streakFreezes; }
      }
      streakIncreased = true;
    }
    const level = calculateLevel(totalXp);
    transaction.set(kpRef, { ...update, lastAnsweredAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(gamificationRef, { totalXp, todayXp, todayXpDate: answer.localDate, dailyGoalXp, streak, streakFreezes, lastActiveDate: todayXp >= dailyGoalXp ? answer.localDate : previousActiveDate, level, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(logRef, { questionId: answer.questionId, kpIds: [answer.kpId], textId: answer.textId, isCorrect: answer.isCorrect, usedHint: answer.usedHint, attemptCount: answer.attemptCount, responseTimeMs: answer.responseTimeMs, localDate: answer.localDate, quality: update.quality, xpEarned: update.xpEarned, answeredAt: admin.firestore.FieldValue.serverTimestamp() });
    return { quality: update.quality, xpEarned: update.xpEarned, mastery: update.mastery, status: update.status, nextReviewAt: update.nextReviewAt, totalXp, todayXp, streak, streakFreezes, streakIncreased, level };
  });
  return { success: true, ...result };
});

exports.getDueKnowledgePoints = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "請先登入");
  const snap = await db.collection("users").doc(context.auth.uid).collection("knowledge").where("nextReviewAt", "<=", admin.firestore.Timestamp.now()).orderBy("nextReviewAt").limit(50).get();
  return { dueKpIds: snap.docs.map((doc) => doc.id), count: snap.size };
});

exports.getDailyLearningPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "請先登入");
  const uid = context.auth.uid;
  const knowledgeRef = db.collection("users").doc(uid).collection("knowledge");
  const now = admin.firestore.Timestamp.now();
  const targetCount = 10;
  const [dueSnap, weakSnap, learnedSnap, kpSnap] = await Promise.all([
    knowledgeRef.where("nextReviewAt", "<=", now).orderBy("nextReviewAt").limit(30).get(),
    knowledgeRef.where("mastery", "<", 61).orderBy("mastery").limit(30).get(),
    knowledgeRef.limit(500).get(),
    db.collection("knowledgePoints").limit(500).get(),
  ]);

  const learned = new Set(learnedSnap.docs.map((d) => d.id));
  const due = dueSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
  const weak = weakSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
  const dueIds = new Set(due.map((x) => x.id));
  const weakOnly = weak.filter((x) => !dueIds.has(x.id));
  const fresh = kpSnap.docs.filter((d) => !learned.has(d.id)).map((d) => ({ id: d.id, data: d.data() }));

  // 優先級：到期複習 > 弱項 > 新知識；同類內按掌握度／到期時間優先。
  const selected = [];
  const push = (item, category, priority) => {
    if (selected.length >= targetCount || selected.some((x) => x.kpId === item.id)) return;
    selected.push({ kpId: item.id, category, priority });
  };
  due.slice(0, 5).forEach((x) => push(x, "review", 100));
  weakOnly.slice(0, 3).forEach((x) => push(x, "weak", 80));
  fresh.slice(0, 2).forEach((x) => push(x, "new", 60));
  [...due, ...weakOnly, ...fresh].forEach((x) => {
    if (selected.length >= targetCount) return;
    const category = dueIds.has(x.id) ? "review" : weakOnly.some((w) => w.id === x.id) ? "weak" : "new";
    push(x, category, category === "review" ? 100 : category === "weak" ? 80 : 60);
  });

  return {
    targetCount,
    items: selected,
    review: selected.filter((x) => x.category === "review").map((x) => x.kpId),
    weak: selected.filter((x) => x.category === "weak").map((x) => x.kpId),
    newKnowledgePoints: selected.filter((x) => x.category === "new").map((x) => x.kpId),
    totalRecommended: selected.length,
  };
});
