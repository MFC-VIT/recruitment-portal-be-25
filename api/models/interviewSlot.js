const mongoose = require("mongoose");

const interviewSlotSchema = new mongoose.Schema({
  interviewerIds: [mongoose.Schema.Types.ObjectId], // list of interviewers
  startTime: Date,
  endTime: Date,
  bookedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  status: { type: String, enum: ["free", "booked"], default: "free" },
});

module.exports = mongoose.model("InterviewSlot", interviewSlotSchema);
