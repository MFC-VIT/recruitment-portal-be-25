const Submission = require("../models/submissionModel");
const UserModel = require("../models/userModel");
const Response = require("../utils/responseModel");
const { questionsFor, subdomainsOf } = require("./questionController");

const DONE_FLAG = {
  tech: "isTechDone",
  design: "isDesignDone",
  management: "isManagementDone",
};
const MAX_CHARS = 20000;

const send = (res, statusCode, data, message) => {
  const response = new Response(statusCode, data, message, statusCode < 400);
  return res.status(response.statusCode).json(response);
};

const wordCount = (text) => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

const serialise = (submission) =>
  submission
    ? {
        domain: submission.domain,
        subdomain: submission.subdomain,
        answers: Object.fromEntries(submission.answers || []),
        isDone: submission.isDone,
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt,
      }
    : null;

const getSubmission = async (req, res) => {
  try {
    const { domain, id } = req.params;
    const submission = await Submission.findOne({ user_id: id, domain });
    return send(res, 200, serialise(submission), "Submission fetched");
  } catch (error) {
    return send(res, 500, null, error.message);
  }
};

// Works out which answers are acceptable for the picked subdomains and, on
// submit, what is still missing. Pure so it can be unit tested.
const validateAnswers = (questions, body, isSubmission) => {
  const validSubdomains = new Set(subdomainsOf(questions).map((s) => s.value));
  const subdomain = [
    ...new Set((Array.isArray(body.subdomain) ? body.subdomain : []).map(String)),
  ].filter((s) => validSubdomains.has(s));

  const visible = questions.filter(
    (q) => q.subdomain === null || subdomain.includes(q.subdomain)
  );
  const rawAnswers =
    body.answers && typeof body.answers === "object" ? body.answers : {};

  const answers = {};
  const errors = [];
  for (const q of visible) {
    const value = rawAnswers[q.key];
    if (typeof value !== "string") continue;
    if (value.length > MAX_CHARS || wordCount(value) > q.maxWords) {
      errors.push({ key: q.key, error: `Maximum word limit exceeded (${q.maxWords} words).` });
      continue;
    }
    if (value.trim()) answers[q.key] = value;
  }

  if (isSubmission) {
    if (subdomain.length === 0) errors.push({ key: "subdomain", error: "Pick at least one subdomain." });
    for (const q of visible) {
      if (!answers[q.key] && !errors.some((e) => e.key === q.key)) {
        errors.push({ key: q.key, error: "This question needs an answer." });
      }
    }
  }
  return { subdomain, answers, errors };
};

// PATCH saves a draft, POST submits. A submitted task is final.
const saveSubmission = async (req, res) => {
  const { domain, id } = req.params;
  const isSubmission = req.method === "POST";
  try {
    const existing = await Submission.findOne({ user_id: id, domain }).select("isDone");
    if (existing && existing.isDone) {
      return send(res, 409, null, "This task has already been submitted");
    }

    const user = await UserModel.findById(id).select("isSC");
    const questions = await questionsFor(domain, user);
    const { subdomain, answers, errors } = validateAnswers(questions, req.body || {}, isSubmission);

    if (isSubmission && errors.length > 0) {
      return send(res, 400, { errors }, "Some answers are missing or too long");
    }

    // isDone in the filter makes "only if not yet submitted" atomic: if another
    // request submitted meanwhile, the upsert hits the unique index instead.
    const submission = await Submission.findOneAndUpdate(
      { user_id: id, domain, isDone: { $ne: true } },
      {
        $set: {
          subdomain,
          answers,
          isDone: isSubmission,
          submittedAt: isSubmission ? new Date() : null,
        },
      },
      { upsert: true, new: true }
    );

    if (isSubmission) {
      await UserModel.findByIdAndUpdate(id, { [DONE_FLAG[domain]]: true });
    }

    return send(
      res,
      200,
      { ...serialise(submission), errors },
      isSubmission ? "Task submitted successfully" : "Draft saved"
    );
  } catch (error) {
    if (error && error.code === 11000) {
      return send(res, 409, null, "This task has already been submitted");
    }
    return send(res, 500, null, error.message);
  }
};

module.exports = { getSubmission, saveSubmission, validateAnswers };
