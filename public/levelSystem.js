/**
 * levelSystem.js
 * XP、等級、Streak（含Streak Freeze）核心邏輯
 * 純前端 localStorage 版本，之後可換成從 Firestore userProgress 讀寫
 */

function getXpNeededForLevel(level) {
  if (level <= 1) return 0;
  return 50 + (level - 2) * 30;
}

function getLevelFromTotalXp(totalXp) {
  let level = 1;
  let cumulative = 0;
  while (true) {
    const needed = getXpNeededForLevel(level + 1);
    if (cumulative + needed > totalXp) break;
    cumulative += needed;
    level += 1;
    if (level > 99) break;
  }
  const currentLevelXp = totalXp - cumulative;
  const nextLevelNeeded = getXpNeededForLevel(level + 1);
  return {
    level,
    currentLevelXp,
    nextLevelNeeded,
    progressPercent: nextLevelNeeded ? Math.round((currentLevelXp / nextLevelNeeded) * 100) : 100
  };
}

const STORAGE_KEY = "dse_wenyan_progress";

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return {
    totalXp: 0,
    streak: 0,
    streakFreezes: 2,
    lastActiveDate: null,
    todayXp: 0,
    dailyGoalXp: 20,
    badges: []
  };
}

function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function checkDailyStreak(state) {
  const today = todayStr();
  if (state.lastActiveDate === today) {
    return state;
  }

  if (state.lastActiveDate) {
    const gap = daysBetween(state.lastActiveDate, today);
    if (gap === 1) {
      // 正常延續，不做事，答題時才會+1
    } else if (gap > 1) {
      const missedDays = gap - 1;
      if (state.streakFreezes >= missedDays) {
        state.streakFreezes -= missedDays;
      } else {
        state.streak = 0;
        state.streakFreezes = 0;
      }
    }
  }

  state.todayXp = 0;
  return state;
}

function recordXpGain(xpGained) {
  const state = checkDailyStreak(loadProgress());
  const today = todayStr();

  const wasGoalMetBefore = state.todayXp >= state.dailyGoalXp;
  state.todayXp += xpGained;
  state.totalXp += xpGained;

  const isGoalMetNow = state.todayXp >= state.dailyGoalXp;
  let streakIncreased = false;

  if (!wasGoalMetBefore && isGoalMetNow && state.lastActiveDate !== today) {
    state.streak += 1;
    state.lastActiveDate = today;
    streakIncreased = true;
  } else if (state.lastActiveDate !== today && isGoalMetNow) {
    state.lastActiveDate = today;
  }

  const levelInfo = getLevelFromTotalXp(state.totalXp);
  const prevLevelInfo = getLevelFromTotalXp(state.totalXp - xpGained);
  const leveledUp = levelInfo.level > prevLevelInfo.level;

  saveProgress(state);

  return {
    state,
    levelInfo,
    leveledUp,
    streakIncreased,
    goalMetNow: isGoalMetNow
  };
}

function getStreakMilestoneBadge(streak) {
  const milestones = [
    { days: 7, badge: "一週堅持" },
    { days: 14, badge: "兩週恆心" },
    { days: 30, badge: "月度堅持者" },
    { days: 100, badge: "百日筑基" },
    { days: 365, badge: "一年之約" }
  ];
  return milestones.find(m => m.days === streak) || null;
}

export {
  loadProgress, saveProgress, checkDailyStreak, recordXpGain,
  getLevelFromTotalXp, getXpNeededForLevel, getStreakMilestoneBadge, todayStr
};
