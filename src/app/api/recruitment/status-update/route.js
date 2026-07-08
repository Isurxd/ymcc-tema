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

    const { docId, newStatus, email, fullName, sendEmail } = await req.json();

    if (!docId || !newStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update Firestore
    await db.collection("recruitment_submissions").doc(docId).update({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: adminEmail
    });

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

      let emailHtml = "";
      let subject = "";

      if (newStatus === "INTERVIEW") {
        subject = "Pengumuman: Lolos Tahap Wawancara - YMCC VII";
        emailHtml = `
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #111; margin: 0; font-size: 24px;">TAHAP WAWANCARA</h2>
            <p style="color: #666; font-size: 14px;">YMCC VII 2027 | The Green Compass</p>
          </div>
          
          <p>Halo <strong>${fullName}</strong>,</p>
          <p>Selamat! Kami sampaikan bahwa Anda <strong>LOLOS</strong> ke tahap Wawancara pada seleksi Calon Panitia Batch 2 YMCC VII 2027.</p>
          <p>Jadwal dan mekanisme wawancara akan diinformasikan lebih lanjut melalui Grup WhatsApp Calon Panitia. Pastikan Anda terus memantau informasi di grup tersebut.</p>
          <p>Persiapkan diri Anda sebaik mungkin. Kami tunggu performa terbaik Anda!</p>
          <br/>
          <p style="font-size: 12px; color: #888;">Salam hormat,<br/>Panitia YMCC VII 2027</p>
        `;
      } 
      else if (newStatus === "ACCEPTED" || newStatus === "REJECTED") {
        subject = "Pengumuman Hasil Akhir Seleksi Panitia - YMCC VII";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://trial-ymccvii.netlify.app";
        emailHtml = `
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #111; margin: 0; font-size: 24px;">PENGUMUMAN HASIL AKHIR</h2>
            <p style="color: #666; font-size: 14px;">YMCC VII 2027 | The Green Compass</p>
          </div>
          
          <p>Halo <strong>${fullName}</strong>,</p>
          <p>Pengumuman Hasil Akhir seleksi Calon Panitia Batch 2 YMCC VII 2027 telah resmi dirilis.</p>
          <p>Silakan periksa hasil kelulusan Anda secara mandiri melalui portal resmi kami:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/recruitment/status" style="background-color: #111; color: #c1ff00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">CEK KELULUSAN SAYA</a>
          </div>
          
          <p>Terima kasih atas partisipasi dan antusiasme Anda. Apapun hasilnya, tetap semangat dan terus berkarya!</p>
          <br/>
          <p style="font-size: 12px; color: #888;">Salam hormat,<br/>Panitia YMCC VII 2027</p>
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
