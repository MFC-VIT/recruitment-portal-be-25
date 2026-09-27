const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Append-only log of every change to a candidate's round in a domain.
// Round values: -1 rejected, 0 under review, 1 interview round, 2 selected,
// 3 core (only shown when the user is also isCore).
const StatusEventSchema = new Schema(
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
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    // Email of the admin who made the change, or "system".
    actor: { type: String, default: "system" },
    // Internal note; never sent to the candidate.
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StatusEventSchema.index({ user_id: 1, createdAt: 1 });

module.exports = mongoose.model("StatusEvent", StatusEventSchema);
