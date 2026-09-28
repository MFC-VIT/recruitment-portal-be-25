const UserModel = require("../models/userModel");
const Submission = require("../models/submissionModel");
const StatusEvent = require("../models/statusEventModel");
const MeetDetails = require("../models/meetModel");
const Offer = require("../models/offerModel");

// done | current | upcoming | failed
const stage = (key, label, state, at = null, detail = null) => ({ key, label, state, at, detail });

// Last time the round moved to a value matching `test`.
const reachedAt = (events, test) => {
  const hit = [...events].reverse().find((e) => test(e.to));
  return hit ? hit.createdAt : null;
};

// Builds the parcel-tracker style progress for one domain. Never exposes who
// moved the candidate or any internal notes.
const domainTimeline = ({ domain, user, submission, events, meeting, offer }) => {
  const round = user[domain] || 0;
  const submitted = Boolean(submission?.isDone);
  const rejected = round === -1;
  const selected = round >= 2;
  const inInterview = round === 1;
  const interviewCovered = meeting && (meeting.domains || []).includes(domain);
  const rejectedAt = rejected ? reachedAt(events, (to) => to === -1) : null;
  // Did they get to the interview round before being rejected?
  const hadInterview = events.some((e) => e.to >= 1);

  const stages = [
    stage("applied", "Applied", "done", user.createdAt),
    stage(
      "submitted",
      "Task submitted",
      submitted ? "done" : "current",
      submission?.submittedAt || null
    ),
    stage(
      "review",
      "Task review",
      !submitted
        ? "upcoming"
        : rejected && !hadInterview
        ? "failed"
        : round === 0
        ? "current"
        : "done",
      rejected && !hadInterview ? rejectedAt : reachedAt(events, (to) => to >= 1)
    ),
    stage(
      "interview",
      "Interview",
      selected
        ? "done"
        : rejected && hadInterview
        ? "failed"
        : inInterview
        ? "current"
        : "upcoming",
      interviewCovered ? meeting.scheduledTime : null,
      inInterview ? (interviewCovered ? "booked" : "book-a-slot") : null
    ),
    stage(
      "result",
      "Result",
      selected ? "done" : rejected ? "failed" : "upcoming",
      selected ? reachedAt(events, (to) => to >= 2) : rejectedAt
    ),
  ];

  return {
    domain,
    round,
    result: selected ? "selected" : rejected ? "rejected" : null,
    stages,
    offer: offer ? { _id: offer._id, status: offer.status } : null,
  };
};

const getTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id)
      .select("domain tech design management createdAt isProfileDone")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [submissions, events, meeting, offers] = await Promise.all([
      Submission.find({ user_id: id }).select("domain isDone submittedAt").lean(),
      StatusEvent.find({ user_id: id }).select("domain to createdAt").sort({ createdAt: 1 }).lean(),
      MeetDetails.findOne({ user_id: id }).select("scheduledTime endTime gmeetLink domains status").lean(),
      Offer.find({ user_id: id, status: { $ne: "revoked" } }).select("domain status").lean(),
    ]);

    const domains = (user.domain || []).map((domain) =>
      domainTimeline({
        domain,
        user,
        submission: submissions.find((s) => s.domain === domain),
        events: events.filter((e) => e.domain === domain),
        meeting,
        offer: offers.find((o) => o.domain === domain),
      })
    );

    res.json({
      profileDone: Boolean(user.isProfileDone),
      domains,
      meeting: meeting && meeting.status !== "cancelled" ? meeting : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not build your timeline" });
  }
};

module.exports = { getTimeline, domainTimeline };
