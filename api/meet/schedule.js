const MeetDetails = require("../models/meetModel");
const mongoose = require("mongoose");
const User = mongoose.models.User || require("../models/userModel");
const InterviewSlot = require("../models/interviewModel");
const Submission = require("../models/submissionModel");
const nodemailer = require("nodemailer");
const { emailTemplate, ATTACHMENTS } = require("./emailTemplate");
const { getCalendar } = require("./calendar");
const { assignPanel, releasePanel } = require("./panel");
const LEGACY_INTERVIEWERS = require("./legacyInterviewers");

// Number of Bookings Allowed Per Slots
const MAX_BOOKINGS = 3;
// Interviewers per panel when the interviewers collection is configured.
const PANEL_SIZE = Number(process.env.PANEL_SIZE) || 2;
// Candidates can't book or move into a slot that starts within this window.
const BOOKING_CUTOFF_MS = 2 * 60 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MFC_EMAIL,
    pass: process.env.MFC_EMAIL_PASSWORD,
  },
});

const releaseSeat = (slotId) =>
  InterviewSlot.updateOne(
    { _id: slotId, bookedCount: { $gt: 0 } },
    { $inc: { bookedCount: -1 }, $set: { status: "free" } },
  );

// Reserve a seat atomically: the filter and $inc run as one operation, so two
// candidates racing for the last seat cannot both get it.
const reserveSeat = async (startTime) => {
  const slot = await InterviewSlot.findOneAndUpdate(
    { startTime, bookedCount: { $lt: MAX_BOOKINGS } },
    { $inc: { bookedCount: 1 } },
    { new: true },
  );
  if (!slot) {
    const exists = await InterviewSlot.exists({ startTime });
    return { error: exists ? [409, "This slot is fully booked."] : [404, "No interview slot found for this time."] };
  }
  if (slot.bookedCount >= MAX_BOOKINGS) {
    await InterviewSlot.updateOne({ _id: slot._id }, { status: "full" });
  }
  return { slot };
};

const interviewDomainsOf = (candidate) =>
  ["tech", "design", "management"].filter(
    (d) => (candidate.domain || []).includes(d) && candidate[d] === 1,
  );

const istParts = (start, end) => ({
  date: start.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
  start: start.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
  end: end.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
});

const sendInterviewMail = ({ candidate, panel, start, end, meetLink, subject }) => {
  const t = istParts(start, end);
  return transporter.sendMail({
    from: process.env.MFC_EMAIL,
    to: [candidate.email, ...panel],
    subject,
    text: `${subject}\n\nCandidate: ${candidate.username}\nDate: ${t.date}\nTime: ${t.start} - ${t.end}\nGoogle Meet Link: ${meetLink}`,
    html: emailTemplate({ candidateName: candidate.username, date: t.date, start: t.start, end: t.end, meetLink }),
    attachments: ATTACHMENTS,
  });
};

// Picks the panel (auto-assigned, or everyone on the legacy list when no
// interviewers are configured) and creates the Calendar event with a Meet link.
const createInterview = async ({ calendar, candidate, domains, start, end }) => {
  const submissions = await Submission.find({ user_id: candidate._id, domain: { $in: domains } })
    .select("subdomain")
    .lean();
  const subdomains = submissions.flatMap((s) => s.subdomain || []);

  const assigned = await assignPanel({
    userId: candidate._id,
    domains,
    subdomains,
    start,
    end,
    size: PANEL_SIZE,
    calendar,
  });
  const panel = assigned ? assigned.emails : LEGACY_INTERVIEWERS;

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${candidate.username} - MFC Interview`,
        description: `Candidate interview for MFC recruitment. Domains: ${domains.join(", ")}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email: candidate.email }, ...panel.map((email) => ({ email }))],
        conferenceData: {
          createRequest: {
            requestId: `mfc-${candidate._id}-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });
    return {
      panel,
      missingDomains: assigned ? assigned.missingDomains : [],
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
    };
  } catch (err) {
    await releasePanel(candidate._id, start);
    throw err;
  }
};

const deleteEvent = async (calendar, eventId) => {
  if (!calendar || !eventId) return;
  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (googleError) {
    console.warn("Google Event not found or already deleted:", googleError.message);
  }
};

// Shared checks for booking and rescheduling. Returns [status, message] on failure.
const validateRequest = (candidate, requestedTime) => {
  if (Number.isNaN(requestedTime.getTime())) return [400, "Invalid scheduletime"];
  if (Date.now() > requestedTime.getTime() - BOOKING_CUTOFF_MS) {
    return [400, "Time limit to schedule this slot is over. Book another slot."];
  }
  if (!candidate) return [404, "Candidate not found"];
  if (interviewDomainsOf(candidate).length === 0) {
    return [403, "You have not been shortlisted for an interview yet."];
  }
  return null;
};

const scheduleMeeting = async (req, res) => {
  let slot = null;
  let booked = false;
  try {
    // The candidate is always the logged-in user; any candidateId in the body is ignored.
    const candidate = await User.findById(req.userId);
    const requestedTime = new Date(req.body.scheduletime);
    if (!req.body.scheduletime) {
      return res.status(400).json({ error: "Missing required field: scheduletime" });
    }
    const invalid = validateRequest(candidate, requestedTime);
    if (invalid) return res.status(invalid[0]).json({ error: invalid[1] });

    if (await MeetDetails.exists({ user_id: candidate._id })) {
      return res.status(400).json({ error: "You have already booked a slot" });
    }

    const calendar = await getCalendar();
    if (!calendar) {
      return res.status(400).json({ error: "Admin must connect Google Calendar first." });
    }

    const reserved = await reserveSeat(requestedTime);
    if (reserved.error) return res.status(reserved.error[0]).json({ error: reserved.error[1] });
    slot = reserved.slot;

    const domains = interviewDomainsOf(candidate);
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const interview = await createInterview({ calendar, candidate, domains, start, end });

    const entry = await MeetDetails.create({
      user_id: candidate._id,
      intervieweremail: interview.panel,
      domains,
      panelIncomplete: interview.missingDomains.length > 0,
      scheduledTime: start,
      endTime: end,
      gmeetLink: interview.meetLink,
      googleEventId: interview.eventId,
    });
    booked = true;

    await sendInterviewMail({
      candidate,
      panel: interview.panel,
      start,
      end,
      meetLink: interview.meetLink,
      subject: "MFC Interview Scheduled",
    }).catch((err) => console.error("Interview mail failed:", err.message));

    return res.json({
      success: true,
      message: "Interview scheduled!",
      data: entry,
      gmeetLink: interview.meetLink,
      meetingStartTime: start,
    });
  } catch (err) {
    console.error("Error scheduling meeting:", err);
    if (slot && !booked) await releaseSeat(slot._id).catch(() => {});
    if (res.headersSent) return;
    return res.status(500).json({ error: "Failed to schedule meeting" });
  }
};

const cancelMeeting = async (req, res) => {
  try {
    const booking = await MeetDetails.findOne({ user_id: req.userId });
    if (!booking) {
      return res.status(404).json({ error: "No booking found for this candidate" });
    }

    await deleteEvent(await getCalendar(), booking.googleEventId);

    const slot = await InterviewSlot.findOne({ startTime: booking.scheduledTime }).select("_id");
    if (slot) await releaseSeat(slot._id);
    await releasePanel(booking.user_id, booking.scheduledTime);
    await MeetDetails.deleteOne({ _id: booking._id });

    return res.json({
      success: true,
      message: "Booking cancelled and slot freed successfully",
    });
  } catch (err) {
    console.error("Error cancelling meeting:", err);
    return res.status(500).json({ error: "Failed to cancel meeting" });
  }
};

// Moves an existing booking to a new slot. The new seat, panel and event are
// secured first; the old ones are only released once that has succeeded, so a
// failed reschedule leaves the original booking intact.
const rescheduleMeeting = async (req, res) => {
  let slot = null;
  let moved = false;
  try {
    const candidate = await User.findById(req.userId);
    const booking = await MeetDetails.findOne({ user_id: req.userId });
    if (!booking) return res.status(404).json({ error: "No booking to reschedule" });

    const requestedTime = new Date(req.body.scheduletime);
    const invalid = validateRequest(candidate, requestedTime);
    if (invalid) return res.status(invalid[0]).json({ error: invalid[1] });
    if (requestedTime.getTime() === new Date(booking.scheduledTime).getTime()) {
      return res.status(400).json({ error: "That is already your slot." });
    }
    if (Date.now() > new Date(booking.scheduledTime).getTime() - BOOKING_CUTOFF_MS) {
      return res.status(400).json({ error: "Your interview is too close to reschedule. Contact the team." });
    }

    const calendar = await getCalendar();
    if (!calendar) return res.status(400).json({ error: "Admin must connect Google Calendar first." });

    const reserved = await reserveSeat(requestedTime);
    if (reserved.error) return res.status(reserved.error[0]).json({ error: reserved.error[1] });
    slot = reserved.slot;

    const domains = interviewDomainsOf(candidate);
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const interview = await createInterview({ calendar, candidate, domains, start, end });

    const oldStart = booking.scheduledTime;
    const oldEventId = booking.googleEventId;
    Object.assign(booking, {
      intervieweremail: interview.panel,
      domains,
      panelIncomplete: interview.missingDomains.length > 0,
      scheduledTime: start,
      endTime: end,
      gmeetLink: interview.meetLink,
      googleEventId: interview.eventId,
      status: "scheduled",
      reminderSentAt: null,
      rescheduleCount: (booking.rescheduleCount || 0) + 1,
    });
    await booking.save();
    moved = true;

    await deleteEvent(calendar, oldEventId);
    const oldSlot = await InterviewSlot.findOne({ startTime: oldStart }).select("_id");
    if (oldSlot) await releaseSeat(oldSlot._id);
    await releasePanel(candidate._id, oldStart);

    await sendInterviewMail({
      candidate,
      panel: interview.panel,
      start,
      end,
      meetLink: interview.meetLink,
      subject: "MFC Interview Rescheduled",
    }).catch((err) => console.error("Reschedule mail failed:", err.message));

    return res.json({
      success: true,
      message: "Interview rescheduled!",
      data: booking,
      gmeetLink: interview.meetLink,
      meetingStartTime: start,
    });
  } catch (err) {
    console.error("Error rescheduling meeting:", err);
    if (slot && !moved) await releaseSeat(slot._id).catch(() => {});
    if (res.headersSent) return;
    return res.status(500).json({ error: "Failed to reschedule meeting" });
  }
};

// Candidate's own booking, for the tracker and the meeting page.
const myMeeting = async (req, res) => {
  const booking = await MeetDetails.findOne({ user_id: req.userId })
    .select("scheduledTime endTime gmeetLink status domains rescheduleCount")
    .lean();
  return res.json({ success: true, data: booking });
};

module.exports = {
  scheduleMeeting,
  cancelMeeting,
  rescheduleMeeting,
  myMeeting,
  sendInterviewMail,
  MAX_BOOKINGS,
};
