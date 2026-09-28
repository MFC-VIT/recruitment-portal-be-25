const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One submission per (user, domain), replacing techtasks/designtasks/
// managementtasks and their question1..questionN columns.
const SubmissionSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    domain: {
      type: String,
      required: true,
      enum: ["tech", "design", "management"],
    },
    subdomain: { type: [String], default: [] },
    // question key -> answer text
    answers: { type: Map, of: String, default: {} },
    isDone: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SubmissionSchema.index({ user_id: 1, domain: 1 }, { unique: true });
SubmissionSchema.index({ domain: 1, isDone: 1 });

module.exports = mongoose.model("Submission", SubmissionSchema);
