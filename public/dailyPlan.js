import { getDailyLearningPlan } from './firebase-config.js';

export async function loadDailyPlan() {
  try {
    return await getDailyLearningPlan();
  } catch (error) {
    console.warn('取得今日學習計劃失敗', error);
    return { targetCount: 10, items: [], review: [], weak: [], newKnowledgePoints: [], totalRecommended: 0 };
  }
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
    if (!candidates.length) return;
    const available = candidates.filter((q) => !usedQuestions.has(q.id));
    if (!available.length) return;
    const q = available[Math.floor(Math.random() * available.length)];
    usedQuestions.add(q.id);
    queue.push({ ...q, planCategory: item.category, planPriority: item.priority });
  });

  // 若部分 KP 沒有題目，才以其他題目補位；避免首頁出現空白學習日。
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
  container.innerHTML = `
    <div class="daily-plan-title">今日學習</div>
    <div class="daily-plan-subtitle">為你安排 ${total || 0} 個學習任務</div>
    <div class="daily-plan-stats">
      <div class="daily-plan-stat review"><strong>🔄 ${review}</strong><span>複習</span></div>
      <div class="daily-plan-stat weak"><strong>⚠️ ${weak}</strong><span>弱項</span></div>
      <div class="daily-plan-stat fresh"><strong>🆕 ${fresh}</strong><span>新知識</span></div>
    </div>
    <button class="action daily-start" id="dailyStartBtn">開始今日學習</button>
  `;
  const button = container.querySelector('#dailyStartBtn');
  button.disabled = total === 0;
  button.onclick = () => onStart?.();
}
