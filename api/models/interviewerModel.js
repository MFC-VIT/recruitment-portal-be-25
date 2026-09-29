const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// People who can sit on interview panels. Managed from the admin portal.
const InterviewerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    domains: {
      type: [String],
      enum: ["tech", "design", "management"],
      default: [],
    },
    // Optional expertise, e.g. ["frontend", "ml"]; preferred when it matches
    // what the candidate applied for.
    subdomains: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    maxPerDay: { type: Number, default: 8, min: 1 },
    // Blocks an interviewer marked themselves unavailable for.
    unavailable: {
      type: [{ start: Date, end: Date }],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interviewer", InterviewerSchema);
