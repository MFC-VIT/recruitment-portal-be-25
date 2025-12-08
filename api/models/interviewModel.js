const mongoose = require("mongoose");

const interviewSlotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true, unique: true },
  bookedCount: { type: Number, default: 0 }, 
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ["free", "full"], default: "free" }, 
});

module.exports = mongoose.model("interviewslots", interviewSlotSchema);