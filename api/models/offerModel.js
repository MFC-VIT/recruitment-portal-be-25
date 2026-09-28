const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Created by the admin portal when a candidate is selected (round 2) in a
// domain; the candidate accepts or declines it in the portal.
const OfferSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true, enum: ["tech", "design", "management"] },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "revoked"],
      default: "pending",
    },
    sentAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    onboarding: {
      github: {
        status: {
          type: String,
          enum: ["not-started", "needs-github", "invited", "already-member", "failed", "disabled"],
          default: "not-started",
        },
        detail: { type: String, default: "" },
        at: { type: Date, default: null },
      },
    },
  },
  { timestamps: true }
);

OfferSchema.index({ user_id: 1, domain: 1 }, { unique: true });

module.exports = mongoose.model("Offer", OfferSchema);
