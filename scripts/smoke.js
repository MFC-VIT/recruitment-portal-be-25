// Smoke test for the candidate backend against a throwaway local Mongo.
const path = require("path");
const BE = path.resolve(__dirname, "..");
process.chdir(BE);
// Never point this at a real database: it drops everything first.
process.env.CONNECT_STRING = process.env.SMOKE_MONGO || "mongodb://127.0.0.1:27099/mfc_smoke";
if (!/127\.0\.0\.1|localhost/.test(process.env.CONNECT_STRING)) throw new Error("smoke test only runs against a local Mongo");
process.env.ACCESS_TOKEN_SECERT = "smoke-secret";
process.env.PORT = "5099";
const mongoose = require(BE + "/node_modules/mongoose");
const jwt = require(BE + "/node_modules/jsonwebtoken");
const bcrypt = require(BE + "/node_modules/bcrypt");
require(BE + "/index.js");
const U = "http://127.0.0.1:5099";
const call = async (method, path, { token, body } = {}) => {
  const r = await fetch(U + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data; try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
};
let fails = 0;
const expect = (name, cond, extra) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`, cond ? "" : JSON.stringify(extra)); if (!cond) fails++; };
(async () => {
  await new Promise((r) => setTimeout(r, 1500));
  const db = mongoose.connection.db;
  await db.dropDatabase();
  const User = mongoose.model("User");
  const pw = await bcrypt.hash("pass1234", 4);
  const cand = await User.create({ username: "cand", email: "c@x.in", regno: "25BCE0001", password: pw, verified: true, domain: ["tech"], isProfileDone: true });
  const other = await User.create({ username: "other", email: "o@x.in", regno: "25BCE0002", password: pw, verified: true, domain: ["tech"] });
  const admin = await User.create({ username: "adm", email: "a@x.in", regno: "ADMIN", password: pw, verified: true, admin: true });
  // forged-ish token: signed correctly but claims admin; DB says not admin
  const candTok = jwt.sign({ id: cand._id, verified: true, admin: true }, "smoke-secret");
  const adminTok = jwt.sign({ id: admin._id, verified: true }, "smoke-secret");

  for (const p of ["/temp-make-admin", "/debug-admin", "/force-save-refresh-token"]) {
    const r = await call("GET", p); expect(`${p} gone`, r.status === 404, r);
  }
  let r = await call("GET", "/admin/responses"); expect("responses needs auth", r.status === 401, r);
  r = await call("POST", "/admin/response", { body: { regNo: "25BCE0001" } }); expect("response needs auth", r.status === 401, r);
  r = await call("GET", "/admin/responses", { token: candTok }); expect("candidate w/ admin claim blocked from responses", r.status === 403, r);
  r = await call("PUT", `/admin/updatestatus/${cand._id}`, { token: candTok, body: { regno: "25BCE0001", tech: 2 } });
  expect("candidate cannot self-promote", r.status === 403, r);
  expect("status unchanged", (await User.findById(cand._id)).tech === 0);
  r = await call("GET", "/admin/responses", { token: adminTok }); expect("admin can list responses", r.status === 200, r.status);
  r = await call("PUT", `/admin/updatestatus/${admin._id}`, { token: adminTok, body: { regno: "nope" } }); expect("unknown regno 404", r.status === 404, r);

  // questions + submissions
  await mongoose.model("Question").insertMany(require(BE + "/api/seed/questions.json"));
  r = await call("GET", "/questions/management", { token: candTok });
  expect("juniors get junior management questions", r.status === 200 && r.data.data.questions.every((q) => q.audience !== "senior"), r.status);
  expect("rubric never sent to candidates", r.data.data.questions.every((q) => !("rubric" in q) && !("legacyField" in q)));
  expect("finance (inactive) hidden", !r.data.data.subdomains.some((s) => s.value === "finance"), r.data.data.subdomains);
  r = await call("GET", "/questions/tech", { token: candTok });
  expect("tech lists cyber-sec and ml", ["cyber-sec", "ml"].every((v) => r.data.data.subdomains.some((s) => s.value === v)));

  // task ownership
  r = await call("PATCH", `/upload/tech/${other._id}`, { token: candTok, body: { subdomain: ["frontend"], answers: { "tech-portfolio": "x" } } });
  expect("cannot write another user's task", r.status === 403, r);
  r = await call("PATCH", `/upload/tech/${cand._id}`, { token: candTok, body: { subdomain: ["ml", "bogus"], answers: { "tech-portfolio": "draft", "tech-ml-1": "ml draft", "tech-cp-1": "not picked" } } });
  expect("own draft ok, unknown subdomain and unpicked answers dropped", r.status === 200 && r.data.data.subdomain.join() === "ml" && !r.data.data.answers["tech-cp-1"] && r.data.data.answers["tech-ml-1"] === "ml draft", r.data);
  r = await call("POST", `/upload/tech/${cand._id}`, { token: candTok, body: { subdomain: ["ml"], answers: { "tech-portfolio": "final" } } });
  expect("submit with a missing answer refused", r.status === 400 && r.data.data.errors.some((e) => e.key === "tech-ml-1"), r.data);
  r = await call("POST", `/upload/tech/${cand._id}`, { token: candTok, body: { subdomain: ["ml"], answers: { "tech-portfolio": "final", "tech-ml-1": "word ".repeat(2001) } } });
  expect("word limit enforced", r.status === 400, r.status);
  r = await call("POST", `/upload/tech/${cand._id}`, { token: candTok, body: { subdomain: ["ml"], answers: { "tech-portfolio": "final", "tech-ml-1": "supervised vs unsupervised" } } });
  expect("own submit ok (ML answer kept, was dropped before)", r.status === 200 && r.data.data.answers["tech-ml-1"], r.data);
  expect("isTechDone set", (await User.findById(cand._id)).isTechDone === true);
  r = await call("PATCH", `/upload/tech/${cand._id}`, { token: candTok, body: { subdomain: ["ml"], answers: { "tech-portfolio": "changed" } } });
  expect("edit after submit refused", r.status === 409, r);
  r = await call("POST", `/upload/design/${cand._id}`, { token: candTok, body: {} });
  expect("domain not on profile refused", r.status === 403, r.status);

  // status history
  r = await call("PUT", `/admin/updatestatus/${admin._id}`, { token: adminTok, body: { regno: "25BCE0002", tech: 1, note: "strong repo" } });
  const ev = await mongoose.model("StatusEvent").find({ user_id: other._id }).lean();
  expect("status change logged with actor", r.status === 200 && ev.length === 1 && ev[0].from === 0 && ev[0].to === 1 && ev[0].actor === "a@x.in", ev);
  r = await call("PUT", `/admin/updatestatus/${admin._id}`, { token: adminTok, body: { regno: "25BCE0002", tech: 7 } });
  expect("invalid round rejected", r.status === 400, r.status);
  r = await call("GET", "/admin/responses", { token: adminTok });
  expect("admin list includes submissions", r.data.data.find((u) => u.regno === "25BCE0001").techTasks.length === 1, r.status);

  // scheduling
  r = await call("POST", "/api/meet/schedule", { body: { candidateId: String(cand._id), scheduletime: new Date(Date.now() + 864e5) } });
  expect("schedule needs auth", r.status === 401, r);
  r = await call("POST", "/api/meet/cancel", { body: { candidateId: String(cand._id) } });
  expect("cancel needs auth", r.status === 401, r);
  const t = new Date(Date.now() + 864e5); t.setMilliseconds(0);
  await db.collection("interviewslots").insertOne({ slotNumber: 1, bookedCount: 0, startTime: t, endTime: new Date(+t + 12e5), status: "free" });
  r = await call("POST", "/api/meet/schedule", { token: candTok, body: { scheduletime: t } });
  expect("unshortlisted candidate cannot book", r.status === 403, r);
  await User.updateOne({ _id: cand._id }, { tech: 1 });
  r = await call("POST", "/api/meet/schedule", { token: candTok, body: { scheduletime: t } });
  expect("no calendar -> 400 and seat released", r.status === 400 && (await db.collection("interviewslots").findOne({ slotNumber: 1 })).bookedCount === 0, r);

  // atomic seat: 10 concurrent reservations on max 3
  const InterviewSlot = mongoose.model("interviewslots");
  const results = await Promise.all(Array.from({ length: 10 }, () => InterviewSlot.findOneAndUpdate({ slotNumber: 1, bookedCount: { $lt: 3 } }, { $inc: { bookedCount: 1 } }, { new: true })));
  expect("conditional $inc never overfills", results.filter(Boolean).length === 3, results.filter(Boolean).length);

  // oauth
  r = await fetch(U + "/api/meet/oauth/callback?code=abc", { redirect: "manual" }); expect("oauth callback rejects missing state", r.status === 403, r.status);
  r = await fetch(U + "/api/meet/auth", { redirect: "manual" }); expect("oauth init needs admin token", r.status === 401, r.status);
  r = await fetch(U + `/api/meet/auth?token=${candTok}`, { redirect: "manual" }); expect("oauth init rejects non-admin", r.status === 403, r.status);

  // auth tokens
  r = await call("POST", "/auth/login", { body: { email: "c@x.in", password: "pass1234" } });
  const dec = jwt.decode(r.data.token);
  expect("login access token expires in ~1d", dec.exp - dec.iat === 86400, dec);
  expect("refresh token not valid as access token", (await call("GET", `/user/user/${cand._id}`, { token: r.data.refreshToken })).status === 401);
  const rr = await call("POST", "/auth/refresh", { body: { refreshToken: r.data.refreshToken } });
  expect("refresh works without access header", rr.status === 200 && rr.data.accessToken, rr);
  let last;
  for (let i = 0; i < 11; i++) last = await call("POST", "/auth/login", { body: { email: "c@x.in", password: "wrong" } });
  expect("login limited per account", last.status === 429, last.status);
  r = await call("POST", "/auth/login", { body: { email: "o@x.in", password: "pass1234" } });
  expect("other account on same IP still fine", r.status === 200, r.status);

  console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
