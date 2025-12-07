const { google } = require("googleapis");
const MeetDetails = require("../models/meetModel");
const User = require("../models/userModel");
// endTime;
const scheduleMeeting = async (req, res) => {
  try {
    const { user_id, intervieweremail, scheduledTime, endTime } = req.body;

    const adminUser = await User.findOne({ admin: true });

    if (!adminUser || !adminUser.googleRefreshToken) {
      return res.status(400).json({
        error: "Admin must connect Google Calendar first.",
      });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth.setCredentials({ refresh_token: adminUser.googleRefreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth });

    const event = {
      summary: "//PERSON NAME - MFC INTERVIEW ",
      description: "Your interview has been scheduled.",
      start: { dateTime: scheduledTime },
      end: { dateTime: endTime },
      attendees: [{ email: intervieweremail }],
      conferenceData: {
        createRequest: {
          requestId: "meet-" + Date.now(), //check the format
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

    const meetEntry = await MeetDetails.create({
      user_id,
      intervieweremail,
      scheduledTime,
      endTime, //update end time as scheduled time + 1 hr
      gmeetLink: meetLink,
      googleEventId: eventId,
    });

    res.json({
      success: true,
      message: "Interview scheduled!",
      data: meetEntry,
    });
  } catch (err) {
    console.error("Error scheduling meeting:", err);
    res.status(500).json({ error: "Failed to schedule meeting" });
  }
};

module.exports = { scheduleMeeting };
