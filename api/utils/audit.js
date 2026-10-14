const AuditLog = require("../models/auditLogModel");
const UserModel = require("../models/userModel");

const RETENTION_DAYS = Number(process.env.AUDIT_RETENTION_DAYS) || 60;
const SECRET_KEY = /pass|token|secret|otp|code|authorization|cookie/i;
const MAX_TEXT = 80;
const MAX_BODY_CHARS = 3000;

// Things that would flood the log without telling the owner anything.
const SKIP = [
  { method: "PATCH", path: /^\/upload\// }, // draft autosaves; the final POST is logged
  { method: "POST", path: /^\/auth\/refresh/ },
  { method: "POST", path: /^\/push\// },
  { method: "POST", path: /^\/api\/meet\/reminders\/run/ },
];
const READ = new Set(["GET", "HEAD", "OPTIONS"]);

// Keeps field names and short values; long free text (task answers, bios) is
// reduced to its length so the log doesn't become a second copy of the answers.
const scrub = (value, depth = 0) => {
  if (value == null) return value;
  if (typeof value === "string") return value.length > MAX_TEXT ? `[text, ${value.length} chars]` : value;
  if (typeof value !== "object") return value;
  if (depth > 4) return "[nested]";
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => scrub(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEY.test(k) ? "[redacted]" : scrub(v, depth + 1);
  return out;
};

const safeBody = (body) => {
  if (!body || typeof body !== "object" || Object.keys(body).length === 0) return null;
  const cleaned = scrub(body);
  return JSON.stringify(cleaned).length > MAX_BODY_CHARS ? { truncated: true } : cleaned;
};

const clientIp = (req) => String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim();

const buildEntry = async (req, res) => {
  const path = `${req.baseUrl}${req.path}`;
  const isAuth = req.baseUrl === "/auth";
  let actorEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  if (!actorEmail && req.userId) {
    const u = await UserModel.findById(req.userId).select("email").lean();
    actorEmail = u?.email || null;
  }
  return {
    source: "candidate",
    kind: isAuth && /login/i.test(req.path) ? "login" : "write",
    actorId: req.userId ? String(req.userId) : null,
    actorEmail,
    role: "candidate",
    method: req.method,
    path,
    status: res.statusCode,
    ip: clientIp(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 200),
    body: safeBody(req.body),
    expireAt: new Date(Date.now() + RETENTION_DAYS * 24 * 3600 * 1000),
  };
};

// Writes the row before the reply is flushed so a serverless instance that
// freezes after responding can't lose it. Logging never fails a request.
const auditActions = (req, res, next) => {
  if (READ.has(req.method)) return next();
  const originalEnd = res.end;
  res.end = function patchedEnd(...args) {
    res.end = originalEnd;
    const finish = () => originalEnd.apply(res, args);
    const path = `${req.baseUrl}${req.path}`;
    if (SKIP.some((r) => r.method === req.method && r.path.test(path))) {
      finish();
      return res;
    }
    buildEntry(req, res)
      .then((entry) => AuditLog.create(entry))
      .catch((err) => console.error("Audit log write failed:", err.message))
      .finally(finish);
    return res;
  };
  next();
};

module.exports = { auditActions };
