/**
 * import_to_firestore.js
 * 將 texts / questions（統一七種題型格式）匯入Firestore
 * 使用方式：node import_to_firestore.js
 * 需先安裝：npm install firebase-admin csv-parser
 *
 * 注意：firebase-admin v12+ 採用模組化匯入，不再用 admin.credential.cert()，
 * 改用 initializeApp({ credential: cert(...) }) 的寫法。
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const csv = require("csv-parser");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

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

async function importQuestionsV2() {
  const rows = await readCSV("../data/questions_v2_template.csv");
  const batch = db.batch();
  rows.forEach((row) => {
    const ref = db.collection("questions").doc(row.questionId);
    batch.set(ref, {
      type: row.type,
      kpId: row.kpId || null,
      textId: row.textId === "CROSS" ? null : (row.textId || null),
      question: row.question,
      options: row.options || "",
      answer: row.answer || "",
      xp: Number(row.xp) || 5,
    });
  });
  await batch.commit();
  console.log(`✅ questions: ${rows.length} 題已匯入`);
}

(async () => {
  try {
    await importTexts();
    await importQuestionsV2();
    console.log("🎉 全部匯入完成");
    process.exit(0);
  } catch (err) {
    console.error("❌ 匯入失敗：", err);
    process.exit(1);
  }
})();
