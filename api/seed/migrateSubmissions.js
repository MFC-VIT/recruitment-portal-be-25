// Copies the legacy techtasks / designtasks / managementtasks documents into
// the submissions collection. Read-only on the legacy collections.
//   node api/seed/migrateSubmissions.js              (dry run, prints a report)
//   node api/seed/migrateSubmissions.js --apply      (writes, skips existing)
//   node api/seed/migrateSubmissions.js --apply --overwrite
// Run seedQuestions.js --apply first: field -> key mapping comes from questions.
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Question = require("../models/questionModel");
const Submission = require("../models/submissionModel");
const User = require("../models/userModel");
const { legacyToSubmission } = require("./legacy");

const apply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");

const SOURCES = [
  ["tech", "techtasks"],
  ["design", "designtasks"],
  ["management", "managementtasks"],
];

(async () => {
  await mongoose.connect(process.env.CONNECT_STRING);
  const db = mongoose.connection.db;
  const questions = await Question.find({}).lean();
  if (questions.length === 0) throw new Error("No questions found. Run seedQuestions.js --apply first.");

  const report = { migrated: 0, skippedExisting: 0, empty: 0, unmapped: {} };
  for (const [domain, collection] of SOURCES) {
    const docs = await db.collection(collection).find({}).toArray();
    const userIds = docs.map((d) => d.user_id);
    const users = new Map(
      (await User.find({ _id: { $in: userIds } }).select("isSC").lean()).map((u) => [String(u._id), u])
    );

    for (const doc of docs) {
      const user = users.get(String(doc.user_id));
      const { submission, unmapped } = legacyToSubmission(doc, domain, questions, user);
      for (const f of unmapped) report.unmapped[`${domain}.${f}`] = (report.unmapped[`${domain}.${f}`] || 0) + 1;
      if (Object.keys(submission.answers).length === 0 && submission.subdomain.length === 0) {
        report.empty++;
        continue;
      }
      const exists = await Submission.exists({ user_id: doc.user_id, domain });
      if (exists && !overwrite) {
        report.skippedExisting++;
        continue;
      }
      report.migrated++;
      if (apply) {
        await Submission.updateOne({ user_id: doc.user_id, domain }, { $set: submission }, { upsert: true });
      }
    }
  }
  console.log(apply ? "Applied." : "[dry run] nothing written.");
  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
