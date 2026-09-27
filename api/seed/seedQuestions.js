// Upserts api/seed/questions.json into the questions collection by key.
// Existing questions keep any rubric an admin has written; nothing is deleted.
//   node api/seed/seedQuestions.js           (dry run)
//   node api/seed/seedQuestions.js --apply
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Question = require("../models/questionModel");
const questions = require("./questions.json");

const apply = process.argv.includes("--apply");

(async () => {
  await mongoose.connect(process.env.CONNECT_STRING);
  let created = 0;
  let updated = 0;
  for (const q of questions) {
    const existing = await Question.findOne({ key: q.key }).select("_id");
    existing ? updated++ : created++;
    if (!apply) continue;
    const { rubric, ...fields } = q;
    await Question.updateOne(
      { key: q.key },
      { $set: fields, $setOnInsert: { rubric: rubric || "" } },
      { upsert: true }
    );
  }
  console.log(`${apply ? "" : "[dry run] "}${created} new, ${updated} updated`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
