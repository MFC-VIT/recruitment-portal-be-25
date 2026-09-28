const Question = require("../models/questionModel");
const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");

const audienceOf = (user) => (user && user.isSC ? "senior" : "junior");

// Active questions for a domain that this user should see. Rubrics and the
// legacy field mapping are admin-only and never leave the server.
const questionsFor = (domain, user) =>
  Question.find({
    domain,
    active: true,
    audience: { $in: ["all", audienceOf(user)] },
  })
    .sort({ order: 1 })
    .select("-rubric -legacyField -__v -createdAt -updatedAt")
    .lean();

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
    const user = await UserModel.findById(req.userId).select("isSC");
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

module.exports = { getQuestions, questionsFor, subdomainsOf };
