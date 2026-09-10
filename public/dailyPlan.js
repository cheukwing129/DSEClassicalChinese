import { getDailyLearningPlan } from './firebase-config.js';

const EMPTY_PLAN = () => ({ targetCount: 10, items: [], review: [], weak: [], newKnowledgePoints: [], totalRecommended: 0 });

export async function loadDailyPlan(allQuestions = []) {
  try {
    const remote = await getDailyLearningPlan();
    if (remote?.items?.length) return remote;
  } catch (error) {
    console.warn('取得今日學習計劃失敗，改用本地題目安排', error);
  }

  // Firebase Functions 暫時不可用時，不應讓首頁卡住；先用現有題目建立可學習隊列。
  const questions = Array.isArray(allQuestions) ? allQuestions.filter(q => q?.id) : [];
  const seenKp = new Set();
  const items = [];
  for (const q of questions) {
    if (!q.kpId || seenKp.has(q.kpId)) continue;
    seenKp.add(q.kpId);
    items.push({ kpId: q.kpId, category: 'mixed', priority: 40 });
    if (items.length >= 10) break;
  }

  // 連題庫讀取也暫時失敗時，配合首頁的內建 fallbackQuestions。
  if (!items.length) {
    ['kp_yueyang_001', 'kp_virtual_zhi', 'sx_001', 'sx_006', 'kp_yueyang_004'].forEach(kpId => {
      items.push({ kpId, category: 'mixed', priority: 40 });
    });
  }

  return {
    targetCount: Math.min(10, items.length),
    items,
    review: [],
    weak: [],
    newKnowledgePoints: items.map(x => x.kpId),
    totalRecommended: items.length
  };
}

export function buildDailyQueue(plan, allQuestions) {
  const questions = Array.isArray(allQuestions) ? allQuestions : [];
  const byKp = new Map();
  questions.forEach((q) => {
    if (!q?.kpId) return;
    if (!byKp.has(q.kpId)) byKp.set(q.kpId, []);
    byKp.get(q.kpId).push(q);
  });

  const usedQuestions = new Set();
  const queue = [];
  const items = Array.isArray(plan?.items) ? plan.items : [];

  items.forEach((item) => {
    const candidates = byKp.get(item.kpId) || [];
    const available = candidates.filter((q) => !usedQuestions.has(q.id));
    if (!available.length) return;
    const q = available[Math.floor(Math.random() * available.length)];
    usedQuestions.add(q.id);
    queue.push({ ...q, planCategory: item.category, planPriority: item.priority });
  });

  if (queue.length < (plan?.targetCount || 10)) {
    const fallback = questions.filter((q) => !usedQuestions.has(q.id));
    fallback.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    fallback.slice(0, (plan?.targetCount || 10) - queue.length).forEach((q) => {
      usedQuestions.add(q.id);
      queue.push({ ...q, planCategory: 'mixed', planPriority: 40 });
    });
  }

  return queue.slice(0, plan?.targetCount || 10);
}

export function renderDailyPlanCard(container, plan, onStart) {
  if (!container) return;
  const review = plan?.review?.length || 0;
  const weak = plan?.weak?.length || 0;
  const fresh = plan?.newKnowledgePoints?.length || 0;
  const total = plan?.totalRecommended || 0;
  const available = Array.isArray(plan?.items) && plan.items.length > 0;
  container.innerHTML = `
    <div class="daily-plan-title">今日學習</div>
    <div class="daily-plan-subtitle">${available ? `為你安排 ${total} 個學習任務` : '暫時使用題庫安排學習內容'}</div>
    <div class="daily-plan-stats">
      <div class="daily-plan-stat review"><strong>🔄 ${review}</strong><span>複習</span></div>
      <div class="daily-plan-stat weak"><strong>⚠️ ${weak}</strong><span>弱項</span></div>
      <div class="daily-plan-stat fresh"><strong>🆕 ${fresh}</strong><span>新知識</span></div>
    </div>
    <button class="action daily-start" id="dailyStartBtn">${total ? '開始今日學習' : '暫無可用題目'}</button>
  `;
  const button = container.querySelector('#dailyStartBtn');
  button.disabled = total === 0;
  button.onclick = () => onStart?.();
}
