const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Shared with the admin portal: same collection, told apart by `source`.
// Candidate rows expire on their own (expireAt); admin rows never set it.
const AuditLogSchema = new Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    source: { type: String, default: "admin", index: true },
    kind: { type: String, enum: ["login", "read", "write"], required: true, index: true },
    actorId: { type: String, default: null },
    actorEmail: { type: String, default: null, index: true },
    role: { type: String, default: null },
    method: { type: String },
    path: { type: String },
    status: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    body: { type: Schema.Types.Mixed, default: null },
    note: { type: String, default: "" },
    expireAt: { type: Date, default: undefined },
  },
  { versionKey: false }
);
AuditLogSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
