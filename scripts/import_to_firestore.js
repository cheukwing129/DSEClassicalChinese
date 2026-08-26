/**
 * import_to_firestore.js
 * 將 texts / knowledgePoints / questions 三份CSV匯入Firestore
 * 使用方式：node import_to_firestore.js
 * 需先安裝：npm install firebase-admin csv-parser
 */

const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});
const db = admin.firestore();

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function importTexts() {
  const rows = await readCSV("../data/texts_template.csv");
  const batch = db.batch();
  rows.forEach((row) => {
    const ref = db.collection("texts").doc(row.textId);
    batch.set(ref, {
      title: row.title,
      author: row.author,
      dynasty: row.dynasty,
      genre: row.genre,
      summary: row.summary,
    });
  });
  await batch.commit();
  console.log(`✅ texts: ${rows.length} 篇已匯入`);
}

async function importKnowledgePoints() {
  const rows = await readCSV("../data/knowledgePoints_template.csv");
  const batch = db.batch();
  rows.forEach((row) => {
    const isCross = row.textId === "CROSS";
    const targetCollection = isCross ? "crossTextVocab" : "knowledgePoints";
    const ref = db.collection(targetCollection).doc(row.kpId);
    batch.set(ref, {
      textId: isCross ? null : row.textId,
      sectionId: row.sectionId || null,
      type: row.type,
      content: row.content,
      explanation: row.explanation,
      difficulty: Number(row.difficulty) || 1,
      appearsIn: isCross ? [] : [row.textId],
    });
  });
  await batch.commit();
  console.log(`✅ knowledgePoints: ${rows.length} 條已匯入`);
}

async function importQuestions() {
  const rows = await readCSV("../data/questions_template.csv");
  const batch = db.batch();
  rows.forEach((row) => {
    const ref = db.collection("questions").doc(row.questionId);
    batch.set(ref, {
      textId: row.textId === "CROSS" ? null : row.textId,
      kpId: row.kpId,
      type: row.type,
      question: row.question,
      options: row.options ? row.options.split("|") : [],
      answer: row.answer,
      points: Number(row.points) || 1,
    });
  });
  await batch.commit();
  console.log(`✅ questions: ${rows.length} 題已匯入`);
}

(async () => {
  try {
    await importTexts();
    await importKnowledgePoints();
    await importQuestions();
    console.log("🎉 全部匯入完成");
    process.exit(0);
  } catch (err) {
    console.error("❌ 匯入失敗：", err);
    process.exit(1);
  }
})();
