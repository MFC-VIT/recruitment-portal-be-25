const { google } = require("googleapis");
const MeetDetails = require("../models/meetModel");
const User = require("../models/userModel");
const InterviewSlot = require("../models/interviewModel");
const nodemailer = require("nodemailer");

// CONSTANTS
const MAX_BOOKINGS = 3; // Set whatever limit depending on the amount of interviewers we have

// Interviewer List , Update when necessary
const INTERVIEWERS = [
  "adith.manikonda2024@vitstudent.ac.in",
  "adithyanachiyappan.2024@vitstudent.ac.in",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MFC_EMAIL,
    pass: process.env.MFC_EMAIL_PASSWORD,
  },
});

function emailTemplate({ candidateName, date, start, end, meetLink }) {
  return `
  <div style="font-family: Arial; padding:20px;">
    <h2>MFC Interview Confirmation</h2>
    <p>Hello,</p>
    <p>An interview has been scheduled.</p>
    <p><b>Candidate:</b> ${candidateName}</p>
    <p><b>Date:</b> ${date}</p>
    <p><b>Time:</b> ${start} - ${end}</p>
    <p><b>Google Meet Link:</b> <a href="${meetLink}">${meetLink}</a></p>
    <br/>
    <p>Regards,<br/>MFC VIT Recruitment Team</p>
  </div>`;
}

const scheduleMeeting = async (req, res) => {
  try {
    const { candidateId, domains, slot } = req.body;
    if (!candidateId || !slot) {
      return res.status(400).json({ error: "Missing required fields: candidateId or slot" });
    }

    const slotDoc = await InterviewSlot.findOne({ slotNumber: slot });
    if (!slotDoc) {
      return res.status(404).json({ error: "Invalid slot number" });
    }

    // Check if Slot is Booked Out
    if (slotDoc.status === "full" || slotDoc.bookedCount >= MAX_BOOKINGS) {
      return res.status(409).json({ error: "This slot is fully booked." });
    }

    //Check for Existing Slot for the Same Candidate
    const existingBooking = await MeetDetails.findOne({ 
      user_id: candidateId, 
    });

    if (existingBooking) {
      return res.status(400).json({ error: "You have already booked a slot" });
    }

    const candidate = await User.findById(candidateId);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });

    const adminUser = await User.findOne({ admin: true });
    if (!adminUser || !adminUser.googleRefreshToken) {
      return res.status(400).json({ error: "Admin must connect Google Calendar first." });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });
    const calendar = google.calendar({ version: "v3", auth: oauth });

    // Use times from Interview Slots Table
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
    slotDoc.bookedCount += 1;
    
    // Check for Limit
    if (slotDoc.bookedCount >= MAX_BOOKINGS) {
      slotDoc.status = "full";
    }
    
    await slotDoc.save();

    const entry = await MeetDetails.create({
      user_id: candidateId,
      intervieweremail: INTERVIEWERS,
      scheduledTime: startDate,
      endTime: endDate,
      gmeetLink: meetLink,
      googleEventId: eventId,
    });

    // Send Email
    const formattedDate = startDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const startTimeStr = startDate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
    const endTimeStr = endDate.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

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
      html,
    });

    return res.json({
      success: true,
      message: "Interview scheduled!",
      data: entry,
    });

  } catch (err) {
    console.error("Error scheduling meeting:", err);
    return res.status(500).json({ error: "Failed to schedule meeting" });
  }
};

module.exports = { scheduleMeeting };