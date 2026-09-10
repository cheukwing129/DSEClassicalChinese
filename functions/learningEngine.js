/**
 * learningEngine.js
 * Manjingo v2 個人化學習核心。
 * 純函數：不直接存取 Firestore，方便測試及日後調整演算法。
 * Canonical rules mirror public/learning-policy.js.
 */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function masteryStatus(mastery) {
  const m = Number(mastery) || 0;
  if (m >= 90) return "mastered";
  if (m >= 75) return "stable";
  if (m >= 60) return "familiar";
  if (m >= 35) return "unstable";
  if (m > 0) return "learning";
  return "unlearned";
}

function toQuality({ isCorrect, usedHint = false, attemptCount = 1 }) {
  if (!isCorrect) return attemptCount > 1 ? 1 : 0;
  if (usedHint) return 3;
  if (attemptCount === 1) return 5;
  return 4;
}

function calculateSM2(quality, prev = {}) {
  const q = clamp(Math.round(Number(quality)), 0, 5);
  let easeFactor = Number(prev.easeFactor ?? 2.5);
  let repetition = Number(prev.repetition ?? 0);
  let interval = Number(prev.interval ?? 0);
  easeFactor = Number.isFinite(easeFactor) ? easeFactor : 2.5;
  repetition = Number.isFinite(repetition) && repetition >= 0 ? repetition : 0;
  interval = Number.isFinite(interval) && interval >= 0 ? interval : 0;
  if (q < 3) { repetition = 0; interval = 1; }
  else { repetition += 1; if (repetition === 1) interval = 1; else if (repetition === 2) interval = 6; else interval = Math.max(1, Math.round(interval * easeFactor)); }
  easeFactor += 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  easeFactor = clamp(easeFactor, 1.3, 3.0);
  return { easeFactor, repetition, interval, lastQuality: q };
}

function calculateNextReviewAt(interval, now = new Date()) {
  const base = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const timestamp = Number.isFinite(base) ? base : Date.now();
  const days = Math.max(1, Number(interval) || 1);
  return new Date(timestamp + days * 86400000);
}

function masteryRate({ usedHint = false, attemptCount = 1 }) {
  if (usedHint) return 0.12;
  if (Number(attemptCount) > 1) return 0.16;
  return 0.22;
}

function calculateMastery({ prevMastery = 0, isCorrect, usedHint = false, attemptCount = 1 }) {
  const previous = clamp(Math.round(Number(prevMastery) || 0), 0, 100);
  let mastery;
  if (!isCorrect) mastery = clamp(Math.round(previous * 0.7), 0, 100);
  else if (previous >= 100) mastery = 100;
  else {
    const gain = Math.max(1, Math.round((100 - previous) * masteryRate({ usedHint, attemptCount })));
    mastery = clamp(previous + gain, 0, 100);
  }
  return { mastery, status: masteryStatus(mastery) };
}

function calculateConceptMasteryUpdate({ prev = {}, conceptKey, conceptLabel, kpId, questionId, selectedAnswer, correctAnswer, isCorrect, usedHint = false, attemptCount = 1, now = new Date() }) {
  const mastery = calculateMastery({ prevMastery: prev.mastery ?? 0, isCorrect, usedHint, attemptCount }).mastery;
  const kpIds = Array.from(new Set([...(Array.isArray(prev.kpIds) ? prev.kpIds.map(String) : []), ...(kpId ? [String(kpId)] : [])]));
  const questionIds = Array.from(new Set([...(Array.isArray(prev.questionIds) ? prev.questionIds.map(String) : []), ...(questionId ? [String(questionId)] : [])]));
  const answeredAt = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  const result = {
    ...prev,
    conceptKey: String(conceptKey || prev.conceptKey || ""),
    conceptLabel: String(conceptLabel || prev.conceptLabel || conceptKey || ""),
    mastery,
    attempts: Number(prev.attempts || 0) + 1,
    correctCount: Number(prev.correctCount || 0) + (isCorrect ? 1 : 0),
    wrongCount: Number(prev.wrongCount || 0) + (isCorrect ? 0 : 1),
    lastCorrect: Boolean(isCorrect),
    lastAnsweredAt: Number.isNaN(answeredAt.getTime()) ? new Date() : answeredAt,
    kpIds,
    questionIds,
    lastWrongQuestionId: prev.lastWrongQuestionId || null,
    lastSelectedAnswer: prev.lastSelectedAnswer || null,
    lastCorrectAnswer: prev.lastCorrectAnswer || null
  };
  if (!isCorrect) {
    result.lastWrongQuestionId = questionId ? String(questionId) : result.lastWrongQuestionId;
    result.lastSelectedAnswer = selectedAnswer == null ? result.lastSelectedAnswer : String(selectedAnswer);
    result.lastCorrectAnswer = correctAnswer == null ? result.lastCorrectAnswer : String(correctAnswer);
  }
  return result;
}

function calculateXp({ baseXp = 8, isCorrect, usedHint = false, attemptCount = 1 }) {
  const xp = Math.max(1, Number(baseXp) || 8);
  if (!isCorrect) return 0;
  if (usedHint) return Math.max(1, Math.round(xp * 0.6));
  if (attemptCount === 1) return Math.round(xp);
  return Math.max(1, Math.round(xp * 0.8));
}

function calculateLearningUpdate({ prev = {}, isCorrect, usedHint = false, attemptCount = 1, baseXp = 8, now = new Date() }) {
  const quality = toQuality({ isCorrect, usedHint, attemptCount });
  const sm2 = calculateSM2(quality, prev);
  const mastery = calculateMastery({ prevMastery: prev.mastery ?? 0, isCorrect, usedHint, attemptCount });
  const xpEarned = calculateXp({ baseXp, isCorrect, usedHint, attemptCount });
  const answeredAt = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  return {
    quality,
    xpEarned,
    ...sm2,
    ...mastery,
    nextReviewAt: calculateNextReviewAt(sm2.interval, answeredAt),
    attempts: Number(prev.attempts ?? 0) + 1,
    correctCount: Number(prev.correctCount ?? 0) + (isCorrect ? 1 : 0),
    wrongCount: Number(prev.wrongCount ?? 0) + (isCorrect ? 0 : 1),
    hintCount: Number(prev.hintCount ?? 0) + (usedHint ? 1 : 0),
    lastCorrect: Boolean(isCorrect),
    lastAnsweredAt: Number.isNaN(answeredAt.getTime()) ? new Date() : answeredAt
  };
}

module.exports = {
  clamp,
  masteryStatus,
  toQuality,
  calculateSM2,
  calculateNextReviewAt,
  masteryRate,
  calculateMastery,
  calculateConceptMasteryUpdate,
  calculateXp,
  calculateLearningUpdate
};
