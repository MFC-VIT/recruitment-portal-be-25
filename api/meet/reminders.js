const MeetDetails = require("../models/meetModel");
const User = require("../models/userModel");

const LEAD_MS = 60 * 60 * 1000;

// Sends a one-hour reminder for each upcoming interview exactly once. The
// reminderSentAt claim is atomic, so running this from several instances (or
// from both the interval and an external cron) never double-sends.
const sendDueReminders = async ({ sendMail, notify } = {}) => {
  const now = new Date();
  const due = await MeetDetails.find({
    status: "scheduled",
    reminderSentAt: null,
    scheduledTime: { $gt: now, $lte: new Date(now.getTime() + LEAD_MS) },
  })
    .select("_id")
    .lean();

  let sent = 0;
  for (const { _id } of due) {
    const meet = await MeetDetails.findOneAndUpdate(
      { _id, reminderSentAt: null },
      { $set: { reminderSentAt: new Date() } },
      { new: true },
    );
    if (!meet) continue;
    const candidate = await User.findById(meet.user_id).select("username email");
    if (!candidate) continue;
    try {
      if (sendMail) {
        await sendMail({
          candidate,
          panel: meet.intervieweremail,
          start: meet.scheduledTime,
          end: meet.endTime,
          meetLink: meet.gmeetLink,
          subject: "Reminder: your MFC interview starts within the hour",
        });
      }
      if (notify) {
        await notify(meet.user_id, {
          title: "Interview in under an hour",
          body: "Your MFC interview is coming up. Join from the Meeting page.",
          url: "/meeting",
        });
      }
      sent++;
    } catch (err) {
      console.error("Reminder failed for", String(meet._id), err.message);
    }
  }
  return { due: due.length, sent };
};

module.exports = { sendDueReminders };
