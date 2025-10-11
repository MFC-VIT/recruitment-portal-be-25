const nodemailer = require("nodemailer");
require("dotenv").config();

const createMailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });
};

module.exports = createMailTransporter;
