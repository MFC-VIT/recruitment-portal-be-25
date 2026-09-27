const { google } = require("googleapis");
const MeetDetails = require("../models/meetModel");
const mongoose = require("mongoose");
const User = mongoose.models.User || require("../models/userModel");
const InterviewSlot = require("../models/interviewModel");
const nodemailer = require("nodemailer");
const { emailTemplate, ATTACHMENTS } = require("./emailTemplate");
const path = require("path");

// Number of Bookings Allowed Per Slots
const MAX_BOOKINGS = 3;

// Interviewer List , Update Before Deployment, UPDATED hehe
const INTERVIEWERS = [
  "adith.manikonda2024@vitstudent.ac.in",
  "yuvraj.bansal2024@vitstudent.ac.in",
  "adithyanachiyappan.2024@vitstudent.ac.in",
  "pranjal.sahay2024@vitstudent.ac.in",
  "dakshata.abhyankar2024@vitstudent.ac.in",
  "arshia.ghosh2024@vitstudent.ac.in",
  // "sarthak.jain2024@vitstudent.ac.in",
  // "anurag.thakur2024@vitstudent.ac.in",
  "aadya.agarwal2024b@vitstudent.ac.in",
  // "ritwin.as2024@vitstudent.ac.in",
  "traya.jawahar2024@vitstudent.ac.in",
  "neha.damani2024@vitstudent.ac.in",
  // "shubham.mishra2024@vitstudent.ac.in",
  "pooja.goel2023@vitstudent.ac.in",
  "riyan.johnson2024@vitstudent.ac.in",
  // "anuraag.chakraborty2024@vitstudent.ac.in",
  "aayush.keshwani2024@vitstudent.ac.in",
  // "shreya.yadav2024@vitstudent.ac.in",
  // "jaanya.bagdi2024@vitstudent.ac.in",
  "manya.praveensingh2024@vitstudent.ac.in",
  "rishita.khetan2024@vitstudent.ac.in",
];
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

const scheduleMeeting = async (req, res) => {
  let reservedSlotId = null;
  let booked = false;
  try {
    // The candidate is always the logged-in user; any candidateId in the body is ignored.
    const candidateId = req.userId;
    const { domains, scheduletime } = req.body;

    if (!scheduletime) {
      return res.status(400).json({
        error: "Missing required field: scheduletime",
      });
    }

    // Convert string to Date object for accurate comparison
    const requestedTime = new Date(scheduletime);
    const currentTime = new Date();
    const limitTime = 2 * 60 * 60 * 1000;
    const bookingDeadline = new Date(requestedTime.getTime() - limitTime);
    if (currentTime > bookingDeadline) {
      return res.status(400).json({error: "Time limit to schedule this slot is over. Book another slot." });}

    // Check for Existing Slot for the Same Candidate
    const existingBooking = await MeetDetails.findOne({
      user_id: candidateId,
    });

    if (existingBooking) {
      return res.status(400).json({ error: "You have already booked a slot" });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    // Only candidates moved to the interview round (status 1) in a domain they applied to may book.
    const interviewDomains = ["tech", "design", "management"].filter(
      (d) => (candidate.domain || []).includes(d) && candidate[d] === 1,
    );
    if (interviewDomains.length === 0) {
      return res
        .status(403)
        .json({ error: "You have not been shortlisted for an interview yet." });
    }

    // Reserve a seat atomically: the filter and $inc run as one operation, so two
    // candidates racing for the last seat cannot both get it.
    const slotDoc = await InterviewSlot.findOneAndUpdate(
      { startTime: requestedTime, bookedCount: { $lt: MAX_BOOKINGS } },
      { $inc: { bookedCount: 1 } },
      { new: true },
    );

    if (!slotDoc) {
      const exists = await InterviewSlot.exists({ startTime: requestedTime });
      return exists
        ? res.status(409).json({ error: "This slot is fully booked." })
        : res.status(404).json({ error: "No interview slot found for this time." });
    }
    if (slotDoc.bookedCount >= MAX_BOOKINGS) {
      await InterviewSlot.updateOne({ _id: slotDoc._id }, { status: "full" });
    }
    reservedSlotId = slotDoc._id;

    const adminUser = await User.findOne({
      admin: true,
      googleRefreshToken: { $ne: null },
    });
    if (!adminUser || !adminUser.googleRefreshToken) {
      await releaseSeat(reservedSlotId);
      return res
        .status(400)
        .json({ error: "Admin must connect Google Calendar first." });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });
    const calendar = google.calendar({ version: "v3", auth: oauth });
    const startDate = new Date(slotDoc.startTime);
    const endDate = new Date(slotDoc.endTime);

    const event = {
      summary: `${candidate.username} - MFC Interview`,
      description: `Candidate interview for MFC recruitment. Domains: ${domains}`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      attendees: [
        { email: candidate.email },
        ...INTERVIEWERS.map((email) => ({ email })),
      ],
      conferenceData: {
        createRequest: {
          requestId: "mfc-" + Date.now(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;
    const eventId = response.data.id;

    const entry = await MeetDetails.create({
      user_id: candidateId,
      intervieweremail: INTERVIEWERS,
      scheduledTime: startDate,
      endTime: endDate,
      gmeetLink: meetLink,
      googleEventId: eventId,
    });
    booked = true;

    // Send Email
    const formattedDate = startDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const startTimeStr = startDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = endDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = emailTemplate({
      candidateName: candidate.username,
      date: formattedDate,
      start: startTimeStr,
      end: endTimeStr,
      meetLink,
    });

    await transporter.sendMail({
      from: process.env.MFC_EMAIL,
      to: [candidate.email, ...INTERVIEWERS],
      subject: "MFC Interview Scheduled",
      text: `MFC Interview Confirmation\n\nCandidate: ${candidate.username}\nDate: ${formattedDate}\nTime: ${startTimeStr} - ${endTimeStr}\nGoogle Meet Link: ${meetLink}`,
      html,
      attachments: ATTACHMENTS,
    });

    // Include the generated Google Meet link explicitly so frontend sees it immediately
    return res.json({
      success: true,
      message: "Interview scheduled!",
      data: entry,
      gmeetLink: meetLink,
      meetingStartTime: startDate,
    });
  } catch (err) {
    console.error("Error scheduling meeting:", err);
    if (reservedSlotId && !booked) await releaseSeat(reservedSlotId).catch(() => {});
    if (res.headersSent) return;
    return res.status(500).json({ error: "Failed to schedule meeting" });
  }
};

const cancelMeeting = async (req, res) => {
  try {
    const candidateId = req.userId;

    const booking = await MeetDetails.findOne({ user_id: candidateId });
    if (!booking) {
      return res
        .status(404)
        .json({ error: "No booking found for this candidate" });
    }

    const adminUser = await User.findOne({
      admin: true,
      googleRefreshToken: { $ne: null },
    });
    if (!adminUser || !adminUser.googleRefreshToken) {
      return res.status(400).json({ error: "Admin Google Token missing" });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });
    const calendar = google.calendar({ version: "v3", auth: oauth });

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: booking.googleEventId,
      });
    } catch (googleError) {
      console.warn(
        "Google Event not found or already deleted:",
        googleError.message,
      );
    }

    const slotDoc = await InterviewSlot.findOne({
      startTime: booking.scheduledTime,
    }).select("_id");
    if (slotDoc) await releaseSeat(slotDoc._id);

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

module.exports = { scheduleMeeting, cancelMeeting };
