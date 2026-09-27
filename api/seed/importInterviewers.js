// Imports the old hardcoded interviewer list into the interviewers collection
// with every domain ticked; refine domains/expertise in the admin portal after.
//   node api/seed/importInterviewers.js          (dry run)
//   node api/seed/importInterviewers.js --apply
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Interviewer = require("../models/interviewerModel");
const LEGACY = require("../meet/legacyInterviewers");

const apply = process.argv.includes("--apply");

// "aadya.agarwal2024b@vitstudent.ac.in" -> "Aadya Agarwal"
const nameFromEmail = (email) =>
  email
    .split("@")[0]
    .replace(/\d.*$/, "")
    .split(".")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");

(async () => {
  await mongoose.connect(process.env.CONNECT_STRING);
  let added = 0;
  for (const email of LEGACY) {
    const exists = await Interviewer.exists({ email });
    if (exists) continue;
    added++;
    if (apply) {
      await Interviewer.create({
        name: nameFromEmail(email),
        email,
        domains: ["tech", "design", "management"],
      });
    }
  }
  console.log(`${apply ? "" : "[dry run] "}${added} interviewers to add, ${LEGACY.length - added} already present`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
