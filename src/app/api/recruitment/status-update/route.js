import { NextResponse } from 'next/server';
import { db, auth } from "@/lib/firebaseAdmin";
import nodemailer from 'nodemailer';
import { generateEmailTemplate } from '@/lib/email';

export async function POST(req) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    
    let adminEmail = "";
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token);
        adminEmail = decoded.email;
        const masterAdmins = ["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "suryatripatih2003@gmail.com", "noreply@ymccvii.com"];
        
        if (!masterAdmins.includes(adminEmail)) {
          const staffDoc = await db.collection("staff_applications").doc(adminEmail).get();
          if (!staffDoc.exists || staffDoc.data().status !== "APPROVED") {
            return NextResponse.json({ error: "Forbidden: Not an admin/staff" }, { status: 403 });
          }
        }
      } catch (e) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
    }

    const { docId, newStatus, email, fullName, sendEmail, acceptedDivision } = await req.json();

    if (!docId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update Firestore
    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: adminEmail
    };

    if (newStatus === "ACCEPTED" && acceptedDivision) {
      updateData.acceptedDivision = acceptedDivision;
    }

    await db.collection("recruitment_submissions").doc(docId).update(updateData);

    // Handle Optional Email Notification
    if (sendEmail && email && fullName) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.zoho.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      let emailSubject = "YMCC VII - Recruitment Status Update";
      let emailHtml = "";

      if (newStatus === "PENDING_REVIEW") {
        emailSubject = "YMCC VII - Application Received";
        emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="color: #000; border-bottom: 2px solid #c1ff00; padding-bottom: 10px;">Application Received</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Thank you for submitting your application for the YMCC VII 2027 Committee Batch 2.</p>
          <p>We have successfully received your application. It is currently under review by our team.</p>
          <p>Please join the prospective committee WhatsApp group for further updates:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://chat.whatsapp.com/H4txE9KTit33amyJFsryks" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Join WhatsApp Group</a>
          </div>
          <p>Best regards,<br/><strong>YMCC VII 2027 Committee</strong></p>
          </div>
        `;
      } else if (newStatus === "INTERVIEW") {
        emailSubject = "YMCC VII - Invitation to Interview";
        emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="color: #000; border-bottom: 2px solid #c1ff00; padding-bottom: 10px;">Congratulations! You've Passed to the Interview Stage</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>We are pleased to inform you that you have advanced to the Interview Stage for the YMCC VII 2027 Committee Batch 2.</p>
          <p>Please check the recruitment portal for your status update and await further information regarding the interview schedule in the WhatsApp group.</p>
          <p>Best regards,<br/><strong>YMCC VII 2027 Committee</strong></p>
          </div>
        `;
      } else {
        emailSubject = "YMCC VII - Final Recruitment Result Announcement";
        emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          
          <h2 style="color: #000; border-bottom: 2px solid #c1ff00; padding-bottom: 10px;">Final Selection Announcement</h2>
          
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>The final result for the YMCC VII 2027 Committee Batch 2 recruitment has been officially released.</p>
          ${newStatus === "ACCEPTED" && acceptedDivision ? `<p>Congratulations! You have been accepted into the <strong>${acceptedDivision}</strong> division.</p>` : ''}
          <p>Please check your final result independently through our official portal:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://ymccvii.com/recruitment/status" style="background-color: #000; color: #c1ff00; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Check Result Portal</a>
          </div>
          
          <p>Best regards,<br/><strong>YMCC VII 2027 Committee</strong></p>
          </div>
        `;
      }

      if (emailHtml) {
        const professionalTemplate = generateEmailTemplate(subject, emailHtml);
        const mailOptions = {
          from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          html: professionalTemplate,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error("Failed to send status email:", emailErr);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Status Update API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
