/**
 * levelSystem.js
 * XP、等級、Streak（含Streak Freeze）核心邏輯
 * 支援 Firebase 雲端同步 + localStorage 離線後備
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

function defaultState() {
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

function loadLocalProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return defaultState();
}

function saveLocalProgress(state) {
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
  if (state.lastActiveDate === today) return state;

  if (state.lastActiveDate) {
    const gap = daysBetween(state.lastActiveDate, today);
    if (gap > 1) {
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

class ProgressManager {
  constructor() {
    this.state = defaultState();
    this.userId = null;
    this.cloudSaveFn = null;
    this.cloudLogFn = null;
  }

  async init(userId, cloudState, cloudSaveFn, cloudLogFn) {
    this.userId = userId;
    this.cloudSaveFn = cloudSaveFn;
    this.cloudLogFn = cloudLogFn;

    if (cloudState) {
      this.state = { ...defaultState(), ...cloudState };
    } else {
      this.state = loadLocalProgress();
    }
    this.state = checkDailyStreak(this.state);
    this._persist();
    return this.state;
  }

  _persist() {
    saveLocalProgress(this.state);
    if (this.userId && this.cloudSaveFn) {
      this.cloudSaveFn(this.userId, this.state).catch(e => console.warn("雲端同步失敗", e));
    }
  }

  getLevelInfo() {
    return getLevelFromTotalXp(this.state.totalXp);
  }

  recordAnswer({ questionId, kpId, isCorrect, xpGained }) {
    this.state = checkDailyStreak(this.state);
    const today = todayStr();

    const wasGoalMetBefore = this.state.todayXp >= this.state.dailyGoalXp;
    const prevTotalXp = this.state.totalXp;

    this.state.todayXp += xpGained;
    this.state.totalXp += xpGained;

    const isGoalMetNow = this.state.todayXp >= this.state.dailyGoalXp;
    let streakIncreased = false;

    if (!wasGoalMetBefore && isGoalMetNow && this.state.lastActiveDate !== today) {
      this.state.streak += 1;
      this.state.lastActiveDate = today;
      streakIncreased = true;
    } else if (this.state.lastActiveDate !== today && isGoalMetNow) {
      this.state.lastActiveDate = today;
    }

    const levelInfo = getLevelFromTotalXp(this.state.totalXp);
    const prevLevelInfo = getLevelFromTotalXp(prevTotalXp);
    const leveledUp = levelInfo.level > prevLevelInfo.level;

    this._persist();

    if (this.userId && this.cloudLogFn) {
      this.cloudLogFn(this.userId, { questionId, kpId, isCorrect, xpGained }).catch(e => console.warn("答題紀錄寫入失敗", e));
    }

    return { state: this.state, levelInfo, leveledUp, streakIncreased, goalMetNow: isGoalMetNow };
  }
}

const manager = new ProgressManager();

export {
  manager, getLevelFromTotalXp, getXpNeededForLevel, todayStr
};
