const { google } = require("googleapis");
const MeetDetails = require("../models/meetModel");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

// STATIC INTERVIEWER LIST (expand)
const INTERVIEWERS = [
  "adith.manikonda2024@vitstudent.ac.in",
  "adithyanachiyappan.2024@vitstudent.ac.in",
];

// EMAIL TRANSPORTER
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
    <img src="https://yourclub-banner-link.com/banner.png" style="width:100%; max-width:500px;" />

    <h2>MFC Interview Confirmation</h2>

    <p>Hello,</p>
    <p>An interview has been scheduled.</p>

    <p><b>Candidate:</b> ${candidateName}</p>
    <p><b>Date:</b> ${date}</p>
    <p><b>Time:</b> ${start} - ${end}</p>

    <p><b>Google Meet Link:</b> <a href="${meetLink}">${meetLink}</a></p>

    <br/>
    <p>Regards,<br/>MFC VIT Recruitment Team</p>
  </div>
  `;
}

const scheduleMeeting = async (req, res) => {
  try {
    const { candidateId, domains, scheduledTime } = req.body;

    if (!candidateId || !scheduledTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch candidate details, invite title ke liye
    const candidate = await User.findById(candidateId);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    // Select interviewers from upar waala list
    const interviewerEmails = INTERVIEWERS;

    // Get admin (calendar owner)
    const adminUser = await User.findOne({ admin: true });

    if (!adminUser || !adminUser.googleRefreshToken) {
      return res
        .status(400)
        .json({ error: "Admin must connect Google Calendar first." });
    }
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });
    const calendar = google.calendar({ version: "v3", auth: oauth });

    // END TIME = start + 1 hour
    const startDate = new Date(scheduledTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `${candidate.username} - MFC Interview`,
      description: "Candidate interview for MFC recruitment.",
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      attendees: [
        { email: candidate.email },
        ...interviewerEmails.map((email) => ({ email })),
      ],
      conferenceData: {
        createRequest: {
          requestId: "mfc-" + Date.now(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    // Create Google Calendar Event
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;
    const eventId = response.data.id;

    // Store in DB
    const entry = await MeetDetails.create({
      user_id: candidateId,
      intervieweremail: interviewerEmails,
      scheduledTime: startDate,
      endTime: endDate,
      gmeetLink: meetLink,
      googleEventId: eventId,
    });

    // ---------------- EMAIL SECTION ----------------

    const formattedDate = startDate.toDateString();
    const startTime = startDate.toLocaleTimeString();
    const endTime = endDate.toLocaleTimeString();

    const html = emailTemplate({
      candidateName: candidate.username,
      date: formattedDate,
      start: startTime,
      end: endTime,
      meetLink,
    });

    const allRecipients = [candidate.email, ...interviewerEmails];

    await transporter.sendMail({
      from: process.env.MFC_EMAIL,
      to: allRecipients,
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

// const { google } = require("googleapis");
// const MeetDetails = require("../models/meetModel");
// const User = require("../models/userModel");
// // endTime;
// const scheduleMeeting = async (req, res) => {
//   try {
//     const { user_id, intervieweremail, scheduledTime, endTime } = req.body;

//     const adminUser = await User.findOne({ admin: true });

//     if (!adminUser || !adminUser.googleRefreshToken) {
//       return res.status(400).json({
//         error: "Admin must connect Google Calendar first.",
//       });
//     }

//     const oauth = new google.auth.OAuth2(
//       process.env.GOOGLE_CLIENT_ID,
//       process.env.GOOGLE_CLIENT_SECRET,
//       process.env.GOOGLE_REDIRECT_URI
//     );

//     oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });

//     const calendar = google.calendar({ version: "v3", auth: oauth });

//     const event = {
//       summary: "//PERSON NAME - MFC INTERVIEW ",
//       description: "Your interview has been scheduled.",
//       start: { dateTime: scheduledTime },
//       end: { dateTime: endTime },
//       attendees: [{ email: intervieweremail }],
//       conferenceData: {
//         createRequest: {
//           requestId: "meet-" + Date.now(), //check the format
//           conferenceSolutionKey: { type: "hangoutsMeet" },
//         },
//       },
//     };

//     const response = await calendar.events.insert({
//       calendarId: "primary",
//       requestBody: event,
//       conferenceDataVersion: 1,
//     });

//     const meetLink = response.data.hangoutLink;
//     const eventId = response.data.id;

//     const meetEntry = await MeetDetails.create({
//       user_id,
//       intervieweremail,
//       scheduledTime,
//       endTime, //update end time as scheduled time + 1 hr
//       gmeetLink: meetLink,
//       googleEventId: eventId,
//     });

//     res.json({
//       success: true,
//       message: "Interview scheduled!",
//       data: meetEntry,
//     });
//   } catch (err) {
//     console.error("Error scheduling meeting:", err);
//     res.status(500).json({ error: "Failed to schedule meeting" });
//   }
// };

// module.exports = { scheduleMeeting };
