const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// A browser push endpoint a candidate opted into. One user can have several
// (phone + laptop). Written here, read by both backends.
const PushSubscriptionSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

PushSubscriptionSchema.index({ user_id: 1 });

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
