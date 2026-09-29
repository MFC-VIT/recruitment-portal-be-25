const express = require("express");
const mongoose = require("mongoose");
const Offer = require("../models/offerModel");
const Setting = require("../models/settingModel");
const UserModel = require("../models/userModel");
const validateUser = require("../middleware/validateUser");
const { inviteToOrg } = require("../utils/github");

const router = express.Router();

// Links (WhatsApp group, Discord, Notion, ...) are only revealed once an offer
// for that domain is accepted.
const onboardingLinks = async (domain) => {
  const setting = await Setting.findOne({ key: "onboarding" }).lean();
  const value = setting?.value || {};
  return { ...(value.all || {}), ...(value[domain] || {}) };
};

const runGithubInvite = async (offer, user) => {
  if (!user.github?.id) {
    offer.onboarding.github = { status: "needs-github", detail: "Connect GitHub to get your org invite", at: new Date() };
  } else {
    const result = await inviteToOrg(user.github.id);
    offer.onboarding.github = { ...result, at: new Date() };
  }
  await offer.save();
};

const present = async (offer) => ({
  _id: offer._id,
  domain: offer.domain,
  status: offer.status,
  sentAt: offer.sentAt,
  respondedAt: offer.respondedAt,
  onboarding: offer.onboarding,
  links: offer.status === "accepted" ? await onboardingLinks(offer.domain) : null,
});

router.get("/mine", validateUser, async (req, res) => {
  const offers = await Offer.find({ user_id: req.userId, status: { $ne: "revoked" } }).sort({ sentAt: 1 });
  res.json({ data: await Promise.all(offers.map(present)) });
});

router.post("/:offerId/respond", validateUser, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.offerId)) return res.status(400).json({ message: "Invalid offer" });
  const accept = req.body?.accept === true;

  // Only a pending offer belonging to the caller can be answered, once.
  const offer = await Offer.findOneAndUpdate(
    { _id: req.params.offerId, user_id: req.userId, status: "pending" },
    { $set: { status: accept ? "accepted" : "declined", respondedAt: new Date() } },
    { new: true }
  );
  if (!offer) return res.status(409).json({ message: "This offer can no longer be answered" });

  if (accept) {
    const user = await UserModel.findById(req.userId).select("github");
    await runGithubInvite(offer, user);
  }
  res.json({ data: await present(offer) });
});

// Retry the org invite, e.g. after connecting GitHub.
router.post("/:offerId/github", validateUser, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.offerId)) return res.status(400).json({ message: "Invalid offer" });
  const offer = await Offer.findOne({ _id: req.params.offerId, user_id: req.userId, status: "accepted" });
  if (!offer) return res.status(404).json({ message: "No accepted offer found" });
  if (["invited", "already-member"].includes(offer.onboarding?.github?.status)) {
    return res.json({ data: await present(offer) });
  }
  const user = await UserModel.findById(req.userId).select("github");
  await runGithubInvite(offer, user);
  res.json({ data: await present(offer) });
});

module.exports = router;
