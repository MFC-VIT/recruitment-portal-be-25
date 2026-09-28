const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One document per question. The candidate form, the admin portal and the AI
// reviewer all read from here, so next year's questions are a data change.
const QuestionSchema = new Schema(
  {
    // Stable id stored in answers, e.g. "tech-frontend-1". No dots: it is used
    // as a Map key on submissions.
    key: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-z0-9-]+$/,
    },
    domain: {
      type: String,
      required: true,
      enum: ["tech", "design", "management"],
    },
    // null means the question is shown whatever subdomains are picked.
    subdomain: { type: String, default: null },
    subdomainLabel: { type: String, default: null },
    // "junior" = first years (isJC), "senior" = everyone else (isSC).
    audience: {
      type: String,
      enum: ["all", "junior", "senior"],
      default: "all",
    },
    kind: { type: String, enum: ["long", "portfolio"], default: "long" },
    prompt: { type: String, required: true },
    helper: { type: String, default: "" },
    order: { type: Number, default: 0 },
    maxWords: { type: Number, default: 2000 },
    // What a strong answer looks like. Admin-only; feeds the AI reviewer.
    rubric: { type: String, default: "" },
    active: { type: Boolean, default: true },
    // questionN field this replaced in the old per-domain task collections.
    legacyField: { type: String, default: null },
  },
  { timestamps: true }
);

QuestionSchema.index({ domain: 1, active: 1, order: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
