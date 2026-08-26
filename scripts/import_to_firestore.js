/**
 * import_to_firestore.js
 * 將 texts / questions（統一七種題型格式）匯入Firestore
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

/**
 * 匯入統一格式題庫（data/questions_v2_template.csv）
 * type: choice / reorder / match / fill / mark
 * options 依 type 有不同的字串編碼規則，直接原樣存入 Firestore，
 * 前端 index.html 的 normalizeQuestion() 會負責解析成陣列/物件
 */
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
