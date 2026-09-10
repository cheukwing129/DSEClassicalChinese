// Knowledge map: prerequisites, unlocks and mastery states.
import { fetchAllKnowledgePoints, fetchUserKnowledgeState, ensureLogin } from './firebase-config.js';

export const MASTERY_UNLOCK = 70;

export function getMasteryStatus(mastery = 0) {
  const n = Number(mastery || 0);
  if (n >= 90) return 'mastered';
  if (n >= 70) return 'familiar';
  if (n > 0) return 'learning';
  return 'new';
}

function prerequisitesOf(kp) {
  const value = kp.prerequisiteIds ?? kp.prerequisites ?? kp.requires ?? [];
  if (Array.isArray(value)) return value;
  return value ? String(value).split('|').map(x => x.trim()).filter(Boolean) : [];
}

export function buildKnowledgeMap(points, progress = {}) {
  const byId = new Map(points.map(kp => [kp.id, kp]));
  return points.map((kp, index) => {
    const mastery = Number(progress[kp.id]?.mastery || 0);
    const prerequisites = prerequisitesOf(kp);
    const missing = prerequisites.filter(id => !byId.has(id) || Number(progress[id]?.mastery || 0) < MASTERY_UNLOCK);
    const available = missing.length === 0;
    return {
      ...kp,
      order: Number(kp.order ?? index),
      mastery,
      status: getMasteryStatus(mastery),
      prerequisites,
      missingPrerequisites: missing,
      locked: !available && mastery < MASTERY_UNLOCK,
    };
  }).sort((a, b) => a.order - b.order);
}

export function groupKnowledgeMap(items) {
  const groups = new Map();
  items.forEach(item => {
    const key = item.unit || item.category || '文言文基礎';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()].map(([title, items]) => ({ title, items }));
}

export async function loadKnowledgeMap() {
  const uid = await ensureLogin();
  const [points, progress] = await Promise.all([
    fetchAllKnowledgePoints(),
    uid ? fetchUserKnowledgeState(uid) : Promise.resolve({}),
  ]);
  return groupKnowledgeMap(buildKnowledgeMap(points, progress));
}

export function renderKnowledgeMap(container, groups, onSelect) {
  if (!container) return;
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  const mastered = groups.reduce((sum, g) => sum + g.items.filter(x => x.mastery >= MASTERY_UNLOCK).length, 0);
  container.innerHTML = `<div class="map-summary"><strong>學習地圖</strong><span>${mastered} / ${total} 個知識點已掌握</span></div>${groups.map(group => `<section class="map-unit"><h3>${escapeHtml(group.title)}</h3><div class="map-path">${group.items.map(item => `<button class="map-node ${item.status} ${item.locked ? 'locked' : ''}" data-kp="${escapeHtml(item.id)}" ${item.locked ? 'disabled' : ''}><span class="map-node-icon">${item.locked ? '🔒' : item.status === 'mastered' ? '✓' : item.status === 'familiar' ? '★' : item.status === 'learning' ? '•' : '▶'}</span><span class="map-node-text"><b>${escapeHtml(item.title || item.name || item.label || item.id)}</b><small>${item.locked ? `先完成 ${item.missingPrerequisites.length} 個前置知識` : `${item.mastery}% 掌握度`}</small></span></button>`).join('')}</div></section>`).join('')}`;
  container.querySelectorAll('.map-node:not(:disabled)').forEach(node => node.onclick = () => onSelect?.(node.dataset.kp));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
