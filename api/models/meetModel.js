const { analyticsdata_v1alpha } = require("googleapis");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MeetSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    intervieweremail: {
      type: [String],
      default: [
        "adithyanachiyappan.2024@vitstudent.ac.in",
        "adith.manikonda2024@vitstudent.ac.in",
      ],
    },
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
      enum: ["scheduled", "underway", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MeetDetails", MeetSchema);
