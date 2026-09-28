const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Small key/value store for things admins edit from the portal, e.g.
// key "onboarding": { tech: { whatsapp, discord, notion, other }, ... }.
const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", SettingSchema);
