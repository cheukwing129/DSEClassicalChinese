/**
 * Import the reviewed Manjingo catalog into Firestore.
 *
 * Source of truth:
 *   public/question-pack-02.js
 *   public/question-pack-03.js
 *   public/question-pack-lesson.js
 *   public/question-pack-capacity-01.js
 *   public/content-catalog.js
 *
 * Usage:
 *   cd scripts
 *   node import_to_firestore.js
 *   node import_to_firestore.js --prune   # also delete stale question/KP docs
 *
 * Never commit serviceAccountKey.json.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const csv = require('csv-parser');

const root = path.join(__dirname, '..');
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Missing Firebase service account: ${serviceAccountPath}`);
}

initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();
const prune = process.argv.includes('--prune');

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function loadReviewedCatalog() {
  const context = { window: {}, Map, Set, Array, Object, Number, String, Math };
  vm.createContext(context);
  for (const file of [
    'question-pack-02.js',
    'question-pack-03.js',
    'question-pack-lesson.js',
    'question-pack-capacity-01.js',
    'content-catalog.js'
  ]) {
    const source = fs.readFileSync(path.join(root, 'public', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  const catalog = context.window.ManjingoContent;
  if (!catalog || !Array.isArray(catalog.questions) || !Array.isArray(catalog.knowledgePoints)) {
    throw new Error('Reviewed content catalog failed to load');
  }
  return catalog;
}

async function commitSets(collectionName, rows, idOf, dataOf) {
  for (let start = 0; start < rows.length; start += 400) {
    const batch = db.batch();
    rows.slice(start, start + 400).forEach(row => {
      batch.set(db.collection(collectionName).doc(String(idOf(row))), dataOf(row));
    });
    await batch.commit();
  }
}

async function pruneCollection(collectionName, keepIds) {
  const snap = await db.collection(collectionName).get();
  const stale = snap.docs.filter(doc => !keepIds.has(doc.id));
  for (let start = 0; start < stale.length; start += 400) {
    const batch = db.batch();
    stale.slice(start, start + 400).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  return stale.length;
}

async function importTexts() {
  const rows = await readCSV(path.join(root, 'data', 'texts_template.csv'));
  await commitSets('texts', rows, row => row.textId, row => ({
    title: row.title,
    author: row.author,
    dynasty: row.dynasty,
    genre: row.genre,
    summary: row.summary
  }));
  console.log(`✅ texts: ${rows.length}`);
}

async function importCatalog() {
  const catalog = loadReviewedCatalog();
  const version = String(catalog.catalogVersion || 'reviewed');

  await commitSets('knowledgePoints', catalog.knowledgePoints, kp => kp.kpId, kp => ({
    textId: kp.textId === 'CROSS' ? null : (kp.textId || null),
    type: kp.type || null,
    content: kp.content || kp.kpId,
    difficulty: Number(kp.difficulty || 1),
    teachable: kp.teachable !== false,
    catalogVersion: version
  }));

  await commitSets('questions', catalog.questions, question => question.id, question => ({
    type: question.type,
    kpId: question.kpId,
    textId: question.textId === 'CROSS' ? null : (question.textId || null),
    question: question.q,
    options: Array.isArray(question.o) ? question.o : [],
    answer: question.a || '',
    explanation: question.explanation || '',
    misconceptionKey: question.misconceptionKey || null,
    misconceptionLabel: question.misconceptionLabel || null,
    baseXp: Number(question.baseXp || question.xp || 8),
    catalogVersion: version
  }));

  console.log(`✅ knowledgePoints: ${catalog.knowledgePoints.length}`);
  console.log(`✅ questions: ${catalog.questions.length}`);
  console.log(`✅ catalog version: ${version}`);

  if (prune) {
    const [questionsDeleted, kpsDeleted] = await Promise.all([
      pruneCollection('questions', new Set(catalog.questions.map(q => String(q.id)))),
      pruneCollection('knowledgePoints', new Set(catalog.knowledgePoints.map(kp => String(kp.kpId))))
    ]);
    console.log(`🧹 pruned stale questions: ${questionsDeleted}`);
    console.log(`🧹 pruned stale knowledge points: ${kpsDeleted}`);
  } else {
    console.log('ℹ️ stale Firestore content was preserved; run with --prune after reviewing the diff.');
  }
}

(async () => {
  try {
    await importTexts();
    await importCatalog();
    console.log('🎉 Firestore content import complete');
  } catch (error) {
    console.error('❌ import failed:', error);
    process.exitCode = 1;
  }
})();
