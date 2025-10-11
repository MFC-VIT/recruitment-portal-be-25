const nodemailer = require("nodemailer");
require("dotenv").config();

const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });
};

module.exports = createMailTransporter;
