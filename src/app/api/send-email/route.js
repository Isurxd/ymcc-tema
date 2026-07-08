import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { auth } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token);
        const email = decoded.email;
        const masterAdmins = ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"];
        
        if (!masterAdmins.includes(email)) {
          // Check if they are approved staff
          const { getFirestore } = require("firebase-admin/firestore");
          const db = getFirestore();
          const staffDoc = await db.collection("staff_applications").doc(email).get();
          if (!staffDoc.exists || staffDoc.data().status !== "APPROVED") {
            return NextResponse.json({ error: "Forbidden: Not an admin/staff" }, { status: 403 });
          }
        }
      } catch (e) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
    }

    const { to, bcc, subject, html, text } = await req.json();

    if ((!to && !bcc) || !subject || (!text && !html)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Professional Anti-Spam HTML Template Wrapper
    const emailContent = html || (text ? text.replace(/\n/g, '<br/>') : '');
    const { generateEmailTemplate } = require('@/lib/email');
    const professionalTemplate = generateEmailTemplate(subject, emailContent);

    const mailOptions = {
      from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
      to: to || process.env.EMAIL_USER, // fallback to sender if bcc is used exclusively
      bcc: bcc,
      subject,
      html: professionalTemplate,
      text: text || "Please view this email in an HTML compatible client." // Fallback text for spam filters
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
