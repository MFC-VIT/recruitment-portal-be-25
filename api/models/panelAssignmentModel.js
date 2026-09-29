const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One row per interviewer per slot start. The unique index is the lock that
// stops two concurrent bookings from putting the same person on two panels at
// the same time.
const PanelAssignmentSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, default: null },
  },
  { timestamps: true }
);

PanelAssignmentSchema.index({ email: 1, startTime: 1 }, { unique: true });
PanelAssignmentSchema.index({ user_id: 1 });

module.exports = mongoose.model("PanelAssignment", PanelAssignmentSchema);
