import nodemailer from 'nodemailer';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const EMAIL_USER = envFile.match(/EMAIL_USER="(.*?)"/)[1];
const EMAIL_PASS = envFile.match(/EMAIL_PASS="(.*?)"/)[1];
const SMTP_HOST = envFile.match(/SMTP_HOST="(.*?)"/)[1];
const SMTP_PORT = envFile.match(/SMTP_PORT="(.*?)"/)[1];

process.env.EMAIL_USER = EMAIL_USER;
process.env.EMAIL_PASS = EMAIL_PASS;
process.env.SMTP_HOST = SMTP_HOST;
process.env.SMTP_PORT = SMTP_PORT;

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    console.log(`Connecting to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} with user ${process.env.EMAIL_USER}...`);
    const info = await transporter.sendMail({
      from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email from Local",
      text: "This is a test email to verify Zoho SMTP."
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

testEmail();
