const Question = require("../models/questionModel");
const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");

const fallbackAudience = (user) => (user && user.isSC ? "senior" : "junior");

// Tech tasks follow the registration year: 26 = junior only, 25 = senior only,
// 23 and 24 = both. Anything else (and other domains) uses the isSC flag.
const TECH_AUDIENCE_BY_YEAR = {
  26: ["junior"],
  25: ["senior"],
  24: ["junior", "senior"],
  23: ["junior", "senior"],
};

const audiencesOf = (domain, user) => {
  if (domain === "tech") {
    const year = Number(String(user?.regno || "").trim().slice(0, 2));
    if (TECH_AUDIENCE_BY_YEAR[year]) return TECH_AUDIENCE_BY_YEAR[year];
  }
  return [fallbackAudience(user)];
};

// Every draft save and page load needs the question list, and it only changes
// when an admin edits it, so keep it for a minute instead of querying each time.
const CACHE_MS = 60 * 1000;
const cache = new Map();

const allQuestions = async (domain) => {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
  const rows = await Question.find({ domain })
    .sort({ order: 1 })
    .select("-rubric -legacyField -__v -createdAt -updatedAt")
    .lean();
  cache.set(domain, { at: Date.now(), rows });
  return rows;
};

// The domain-wide portfolio box was replaced by per-task boxes. Treated as
// retired here so it stays hidden whatever the database says; answers already
// stored under its key are kept and still shown in the admin portal.
const isLive = (q) => q.active && q.kind !== "portfolio";

// Active questions for a domain that this user should see. Rubrics and the
// legacy field mapping are admin-only and never leave the server.
const questionsFor = async (domain, user) => {
  const audiences = ["all", ...audiencesOf(domain, user)];
  return (await allQuestions(domain)).filter((q) => isLive(q) && audiences.includes(q.audience));
};

// Keys of questions switched off since a draft was started.
const retiredKeys = async (domain) =>
  new Set((await allQuestions(domain)).filter((q) => !isLive(q)).map((q) => q.key));

const subdomainsOf = (questions) => {
  const seen = new Map();
  for (const q of questions) {
    if (q.subdomain && !seen.has(q.subdomain)) {
      seen.set(q.subdomain, { value: q.subdomain, label: q.subdomainLabel || q.subdomain });
    }
  }
  return [...seen.values()];
};

const getQuestions = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId).select("isSC regno");
    const questions = await questionsFor(req.params.domain, user);
    const response = new Response(
      200,
      { domain: req.params.domain, subdomains: subdomainsOf(questions), questions },
      "Questions fetched",
      true
    );
    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = new Response(500, null, error.message, false);
    res.status(response.statusCode).json(response);
  }
};

module.exports = { getQuestions, questionsFor, retiredKeys, subdomainsOf, audiencesOf };
