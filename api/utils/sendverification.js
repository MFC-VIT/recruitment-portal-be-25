const bcrypt = require("bcrypt");
require("dotenv").config();

const createMailTransporter = require("./mailTransporter");
const VerificationModel = require("../models/verificationModel");

async function sendVerificationMail(user) {
  const transporter = createMailTransporter();

  try {
    const otp = `${Math.floor(100000 + Math.random() * 90000)}`;
    const mailOption = {
      from: process.env.AUTH_EMAIL,
      to: user.email,
      subject: "Verify Email OTP",
      html: `<p>Dear Candidate ,</p>  

            <p>Your OTP for the Mozilla Firefox Club - VIT recruitment process is: <b>${otp}</b></p>  

            <p>It is valid for 15 minutes. Please enter it promptly.</p>  

            <p>Thank you for your interest.</p>`,
    };
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    console.log("Hashed OTP: ", hashedOTP);
    const newOTPVerification = new VerificationModel({
      user_id: user._id,
      otp: hashedOTP,
      email: user.email,
      createdAt: Date.now(),
      expiresAt: Date.now() + 54000,
    });
    await newOTPVerification.save();
    await transporter.sendMail(mailOption);
    return {
      status: "PENDING",
      message: "verification otp email sent",
      data: {
        userId: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = sendVerificationMail;
