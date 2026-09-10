/**
 * levelSystem.js
 * 前端只負責顯示 server 回傳的 XP、等級、Streak 狀態。
 * 學習結果及 XP 不再由前端自行計算或寫入雲端。
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
    progressPercent: nextLevelNeeded
      ? Math.min(100, Math.round((currentLevelXp / nextLevelNeeded) * 100))
      : 100
  };
}

const STORAGE_KEY = "manjingo_progress_cache";

function defaultState() {
  return {
    totalXp: 0,
    streak: 0,
    streakFreezes: 2,
    lastActiveDate: null,
    todayXp: 0,
    todayXpDate: null,
    dailyGoalXp: 20,
    level: 1,
    badges: []
  };
}

function loadLocalProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch (e) {
    console.warn("讀取離線進度失敗", e);
    return defaultState();
  }
}

function saveLocalProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("保存離線進度失敗", e);
  }
}

function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

class ProgressManager {
  constructor() {
    this.state = defaultState();
    this.userId = null;
  }

  async init(userId, cloudState) {
    this.userId = userId;
    this.state = cloudState
      ? { ...defaultState(), ...cloudState }
      : loadLocalProgress();

    // Server is authoritative. Local cache is only a fallback for offline UI.
    const today = todayStr();
    if (this.state.todayXpDate !== today) this.state.todayXp = 0;
    this.state.todayXpDate = today;
    saveLocalProgress(this.state);
    return this.state;
  }

  applyServerState(serverState) {
    if (!serverState) return this.state;
    this.state = { ...defaultState(), ...serverState };
    if (!this.state.todayXpDate) this.state.todayXpDate = todayStr();
    saveLocalProgress(this.state);
    return this.state;
  }

  getLevelInfo() {
    return getLevelFromTotalXp(Number(this.state.totalXp) || 0);
  }
}

const manager = new ProgressManager();

export {
  manager,
  getLevelFromTotalXp,
  getXpNeededForLevel,
  todayStr
};
