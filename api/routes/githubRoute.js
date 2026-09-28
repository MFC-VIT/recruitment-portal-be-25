const express = require("express");
const UserModel = require("../models/userModel");
const validateUser = require("../middleware/validateUser");
const { rateLimiter_10min_100req } = require("../middleware/ratelimiter");
const { gh, exchangeCode } = require("../utils/github");
const { seal, open } = require("../utils/secretBox");

const router = express.Router();
const enabled = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

router.get("/config", (req, res) =>
  res.json({ enabled: enabled(), clientId: process.env.GITHUB_CLIENT_ID || null })
);

router.get("/me", validateUser, async (req, res) => {
  const user = await UserModel.findById(req.userId).select("github").lean();
  const g = user?.github;
  res.json({ connected: Boolean(g?.id), login: g?.login || null, avatarUrl: g?.avatarUrl || null });
});

// Finishes "Sign in with GitHub": the frontend passes the ?code GitHub gave it
// (after checking its own state parameter).
router.post("/connect", rateLimiter_10min_100req, validateUser, async (req, res) => {
  if (!enabled()) return res.status(503).json({ message: "GitHub sign-in is not configured" });
  const code = String(req.body?.code || "");
  if (!code) return res.status(400).json({ message: "code is required" });

  const token = await exchangeCode(code);
  if (!token) return res.status(400).json({ message: "GitHub rejected the sign-in, try again" });

  const me = await gh("/user", { token });
  if (!me.ok) return res.status(502).json({ message: "Could not read your GitHub profile" });

  // One GitHub account per applicant keeps org invites and repo checks honest.
  const clash = await UserModel.exists({ "github.id": me.data.id, _id: { $ne: req.userId } });
  if (clash) return res.status(409).json({ message: "That GitHub account is linked to another applicant" });

  await UserModel.updateOne(
    { _id: req.userId },
    {
      $set: {
        github: {
          id: me.data.id,
          login: me.data.login,
          avatarUrl: me.data.avatar_url,
          token: seal(token),
          connectedAt: new Date(),
        },
      },
    }
  );
  res.json({ connected: true, login: me.data.login, avatarUrl: me.data.avatar_url });
});

router.delete("/", validateUser, async (req, res) => {
  await UserModel.updateOne({ _id: req.userId }, { $set: { github: {} } });
  res.json({ connected: false });
});

// The applicant's own public repos, newest activity first, for the repo picker.
router.get("/repos", rateLimiter_10min_100req, validateUser, async (req, res) => {
  const user = await UserModel.findById(req.userId).select("+github.token").lean();
  if (!user?.github?.id) return res.status(400).json({ message: "Connect GitHub first" });

  const token = open(user.github.token);
  const result = await gh(
    `/users/${encodeURIComponent(user.github.login)}/repos?per_page=100&sort=pushed&type=owner`,
    { token }
  );
  if (!result.ok) return res.status(502).json({ message: "Could not list your repositories" });

  res.json({
    data: result.data.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      homepage: r.homepage || null,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      fork: r.fork,
      pushedAt: r.pushed_at,
    })),
  });
});

module.exports = router;
