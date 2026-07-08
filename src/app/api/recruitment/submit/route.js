import { NextResponse } from 'next/server';
import { db } from "@/lib/firebaseAdmin";
import nodemailer from 'nodemailer';
import { generateEmailTemplate } from '@/lib/email';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      fullName, nim, email, whatsapp, domicile, 
      organizationExp, achievementDesc, academicCommitment, 
      division1, division2, specificContribution, 
      ktaLink, documentLink, protocolConsent
    } = body;

    // Server-side validation
    if (!fullName || !nim || !email || !whatsapp || !division1 || !division2 || !protocolConsent) {
      return NextResponse.json({ error: "Incomplete data" }, { status: 400 });
    }

    // Save to Firestore using Admin SDK
    const submissionData = {
      fullName,
      nim,
      email,
      whatsapp,
      domicile,
      organizationExp,
      achievementDesc,
      academicCommitment,
      division1,
      division2,
      specificContribution,
      ktaLink,
      documentLink: documentLink || "",
      protocolConsent,
      status: "PENDING_REVIEW",
      submittedAt: new Date()
    };

    const docRef = await db.collection("recruitment_submissions").add(submissionData);

    // Send Confirmation Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zoho.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #111; margin: 0; font-size: 24px;">APPLICATION RECEIVED</h2>
        <p style="color: #666; font-size: 14px;">YMCC VII 2027 | The Green Compass</p>
      </div>
      
      <p>Dear <strong>${fullName}</strong>,</p>
      <p>Thank you for applying as a Staff Candidate <strong>(Staff Recruitment Batch 2)</strong> for YMCC VII. Your application data and documents have been successfully received and saved in our database.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c1ff00;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;"><strong>Application Details:</strong></p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #333;">
          <li>Student ID (NIM): ${nim}</li>
          <li>Choice 1: ${division1}</li>
          <li>Choice 2: ${division2}</li>
        </ul>
      </div>

      <p>Currently, your application documents are undergoing the <strong>Document Verification</strong> phase by our team. Announcements regarding the next stages (including Interview schedules) will be sent to you in due course.</p>
      
      <p>To facilitate coordination, please join the official Staff Candidate Batch 2 YMCC VII WhatsApp Group via the link below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE" style="background-color: #111; color: #c1ff00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">JOIN WHATSAPP GROUP</a>
        <p style="font-size: 11px; color: #999; margin-top: 10px;">*(Group link will be updated by the committee)*</p>
      </div>
      
      <p>Prepare yourself well. The Green Compass Starts With You!</p>
      
      <br/>
      <p style="font-size: 12px; color: #888;">Warm regards,<br/>YMCC VII 2027 Committee</p>
    `;

    const professionalTemplate = generateEmailTemplate("Application Received - YMCC VII Staff Recruitment", emailHtml);

    const mailOptions = {
      from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Application Received - YMCC VII Staff Recruitment",
      html: professionalTemplate,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Failed to send confirmation email, but data was saved:", emailErr);
      // We don't fail the request if email fails, but maybe we should log it
    }

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Recruitment API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
