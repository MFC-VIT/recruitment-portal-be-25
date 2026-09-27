const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MeetSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    intervieweremail: {
      type: [String],
      default: [],
    },
    // Domains this interview covers (those where the candidate is in round 1).
    domains: { type: [String], default: [] },
    // True when no free interviewer existed for at least one of the domains.
    panelIncomplete: { type: Boolean, default: false },
    reminderSentAt: { type: Date, default: null },
    rescheduleCount: { type: Number, default: 0 },
    scheduledTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    gmeetLink: {
      type: String,
    },
    googleEventId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["scheduled", "underway", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MeetDetails", MeetSchema);
