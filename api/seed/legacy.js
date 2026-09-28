// Pure mapping from a legacy per-domain task document to a submission.
// Kept separate from the script so it can be tested without a database.

const normaliseSubdomains = (raw) => {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return [
    ...new Set(
      list
        .flatMap((s) => String(s).split(","))
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        // The admin portal briefly renamed "events" to "editorial".
        .map((s) => (s === "editorial" ? "events" : s))
    ),
  ];
};

// Old forms stored ["answer"], a few early drafts stored ["question", "answer"].
const answerText = (value, prompt, field) => {
  const parts = (Array.isArray(value) ? value : [value])
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v && v !== field && v !== prompt);
  return parts.join("\n").trim();
};

const legacyToSubmission = (doc, domain, questions, user) => {
  const audience = user && user.isSC ? "senior" : "junior";
  const byField = new Map();
  for (const q of questions) {
    if (q.domain !== domain || !q.legacyField) continue;
    // Management juniors and seniors shared questionN fields.
    if (q.audience !== "all" && q.audience !== audience) continue;
    byField.set(q.legacyField, q);
  }

  const answers = {};
  const unmapped = [];
  for (const [field, value] of Object.entries(doc)) {
    if (!/^question\d+$/.test(field)) continue;
    const q = byField.get(field);
    const text = q ? answerText(value, q.prompt, field) : answerText(value, null, field);
    if (!text) continue;
    if (!q) {
      unmapped.push(field);
      continue;
    }
    answers[q.key] = text;
  }

  let subdomain = normaliseSubdomains(doc.subdomain);
  if (subdomain.length === 0) {
    // Infer from which subdomain-specific questions were answered.
    const keys = new Set(Object.keys(answers));
    subdomain = [
      ...new Set(questions.filter((q) => keys.has(q.key) && q.subdomain).map((q) => q.subdomain)),
    ];
  }

  return {
    submission: {
      user_id: doc.user_id,
      domain,
      subdomain,
      answers,
      isDone: !!doc.isDone,
      submittedAt: doc.isDone ? doc.updatedAt || doc.createdAt || null : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    unmapped,
  };
};

module.exports = { legacyToSubmission, normaliseSubdomains };
