const { google } = require("googleapis");
const MeetDetails = require("../models/meetModel");
const mongoose = require("mongoose");
const User = mongoose.models.User || require("../models/userModel");
const InterviewSlot = require("../models/interviewModel");
const nodemailer = require("nodemailer");
const path = require("path");

// Number of Bookings Allowed Per Slots
const MAX_BOOKINGS = 3;

// Interviewer List , Update Before Deployment
const INTERVIEWERS = [
  "adith.manikonda2024@vitstudent.ac.in",
  // "adithyanachiyappan.2024@vitstudent.ac.in",
];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MFC_EMAIL,
    pass: process.env.MFC_EMAIL_PASSWORD,
  },
});

function emailTemplate({ candidateName, date, start, end, meetLink }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!--[if mso]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
    <style>
        /* Force Gmail to respect widths */
        .gmail-fix { min-width: 600px !important; }
        @media only screen and (max-width: 599px) {
            .mobile-container { width: 100% !important; min-width: 320px !important; }
            .mobile-font { font-size: 11px !important; line-height: 1.2 !important; }
            .mobile-title { font-size: 13px !important; }
            .mobile-padding { padding: 12px 14px !important; }
            .mobile-spacer-top { height: 180px !important; }
            .mobile-col-left { width: 45% !important; }
            .mobile-col-right { width: 55% !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#000000" style="border-collapse: collapse; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 0;">
                
                <!-- MAIN 600px CONTAINER -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="mobile-container gmail-fix" style="width:600px; border-collapse: collapse; table-layout: fixed; background-color: #000000;">
                    
                    <!-- HERO ROW (All Background Image) -->
                    <tr>
                        <td background="cid:background_img" bgcolor="#000000" align="center" valign="top" style="background-image: url('cid:background_img'); background-repeat: no-repeat; background-position: top center; background-size: cover; border: 0;">
                            
                            <!--[if gte mso 9]>
                            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:820px;">
                            <v:fill type="frame" src="cid:background_img" color="#000000" />
                            <v:textbox inset="0,0,0,0">
                            <![endif]-->
                            
                            <!-- Internal Layout Table (Slicing the content) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; table-layout: fixed;">
                                
                                <!-- TOP SECTION (Empty) -->
                                <tr>
                                    <td height="280" class="mobile-spacer-top" colspan="2" style="font-size:1px; line-height:1px;">&nbsp;</td>
                                </tr>

                                <!-- MIDDLE SECTION (The Side-by-Side Slice) -->
                                <tr>
                                    <!-- Left Column (The Building) -->
                                    <td width="280" class="mobile-col-left" style="width:280px; font-size:1px; line-height:1px;">&nbsp;</td>

                                    <!-- Right Column (The Overlay Area) -->
                                    <td width="320" class="mobile-col-right" align="left" valign="top" style="width:320px; padding-right: 25px;">
                                        
                                        <!-- The Candidate Info Box -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mobile-box" style="background-color: #000000; background-color: rgba(0,0,0,0.85); border-radius: 8px; border-collapse: separate;">
                                            <tr>
                                                <td class="mobile-padding" style="padding: 22px 25px; font-family: Arial, sans-serif;">
                                                    <p class="mobile-title" style="font-size: 18px; font-weight: bold; margin: 0 0 8px 0; color: #ffffff;">Dear candidate,</p>
                                                    <p class="mobile-font" style="font-size: 14px; margin: 0 0 15px 0; line-height: 1.5; color: #d8d8d8;">Please find the details for your scheduled meeting below:</p>
                                                    
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr><td class="mobile-font" style="padding: 2px 0; font-size: 13px; color: #ffffff;"><b>Candidate Name:</b> ${candidateName}</td></tr>
                                                        <tr><td class="mobile-font" style="padding: 2px 0; font-size: 13px; color: #ffffff;"><b>Date:</b> ${date}</td></tr>
                                                        <tr><td class="mobile-font" style="padding: 2px 0; font-size: 13px; color: #ffffff;"><b>Time:</b> ${start} - ${end}</td></tr>
                                                    </table>

                                                    <p class="mobile-font" style="font-size: 13px; font-weight: bold; margin: 15px 0 5px 0; color: #ffffff;">Google Meet Link:</p>
                                                    <p class="mobile-font" style="font-size: 12px; margin: 0; word-break: break-all;">
                                                        <a href="${meetLink}" style="color: #FF8C42; text-decoration: none; font-weight: bold;">${meetLink}</a>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- BOTTOM SECTION (The spacer to hold the image height) -->
                                <tr>
                                    <td height="280" colspan="2" style="font-size:1px; line-height:1px;">&nbsp;</td>
                                </tr>
                            </table>

                            <!--[if gte mso 9]>
                            </v:textbox>
                            </v:rect>
                            <![endif]-->
                        </td>
                    </tr>

                    <!-- FOOTER ROW (Solid Orange) -->
                    <tr>
                        <td bgcolor="#FF8C42" align="center" style="padding:12px 0;">

                            <a href="https://www.instagram.com/mfc_vit" style="display:inline-block;">
                                <img src="cid:insta_icon" width="24" style="margin:0 25px; border:0; outline:none;" />
                            </a>

                            <a href="https://www.linkedin.com/company/mfcvit" style="display:inline-block;">
                                <img src="cid:linkedin_icon" width="24" style="margin:0 25px; border:0; outline:none;" />
                            </a>

                            <a href="mailto:mozillafirefox@vit.ac.in" style="display:inline-block;">
                                <img src="cid:mail_icon" width="24" style="margin:0 25px; border:0; outline:none;" />
                            </a>

                        </td>
                    </tr>

                </table>
                <!-- END MAIN CONTAINER -->

            </td>
        </tr>
    </table>
</body>
</html>`;
}

const scheduleMeeting = async (req, res) => {
  try {
    // Request for these three from the Frontend - Switched Slot for scheduleTime
    const { candidateId, domains, scheduletime } = req.body;

    if (!candidateId || !scheduletime) {
      return res.status(400).json({
        error: "Missing required fields: candidateId or scheduletime",
      });
    }

    // Convert string to Date object for accurate comparison
    const requestedTime = new Date(scheduletime);

    //Find slot by matching the startTime in the DB
    const slotDoc = await InterviewSlot.findOne({ startTime: requestedTime });

    if (!slotDoc) {
      return res
        .status(404)
        .json({ error: "No interview slot found for this time." });
    }

    // Check if Slot is Booked Out
    if (slotDoc.status === "full" || slotDoc.bookedCount >= MAX_BOOKINGS) {
      return res.status(409).json({ error: "This slot is fully booked." });
    }

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

    // Update Slot Counts
    slotDoc.bookedCount += 1;
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
      attachments: [
        {
          filename: "background.png",
          path: path.join(__dirname, "background.png"),
          cid: "background_img",
        },
        {
          filename: "instagram.png",
          path: path.join(__dirname, "instagram.png"),
          cid: "insta_icon",
        },
        {
          filename: "linkedin.png",
          path: path.join(__dirname, "linkedin.png"),
          cid: "linkedin_icon",
        },
        {
          filename: "email.png",
          path: path.join(__dirname, "email.png"),
          cid: "mail_icon",
        },
      ],
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
    return res.status(500).json({ error: "Failed to schedule meeting" });
  }
};

const cancelMeeting = async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: "Missing candidateId" });
    }

    const booking = await MeetDetails.findOne({ user_id: candidateId });
    if (!booking) {
      return res
        .status(404)
        .json({ error: "No booking found for this candidate" });
    }

    const adminUser = await User.findOne({ admin: true });
    if (!adminUser || !adminUser.googleRefreshToken) {
      return res.status(400).json({ error: "Admin Google Token missing" });
    }

    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
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
        googleError.message
      );
    }

    const slotDoc = await InterviewSlot.findOne({
      startTime: booking.scheduledTime,
    });

    if (slotDoc) {
      slotDoc.bookedCount = Math.max(0, slotDoc.bookedCount - 1);

      if (slotDoc.status === "full" && slotDoc.bookedCount < MAX_BOOKINGS) {
        slotDoc.status = "free";
      }
      await slotDoc.save();
    }

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
