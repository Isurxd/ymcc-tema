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
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
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
      
      <p>Halo <strong>${fullName}</strong>,</p>
      <p>Terima kasih telah mendaftar sebagai Calon Panitia <strong>(Staff Recruitment Batch 2)</strong> YMCC VII. Data pendaftaran Anda beserta kelengkapan berkas telah berhasil kami terima dan masuk ke dalam database kami.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c1ff00;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;"><strong>Detail Pendaftaran:</strong></p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #333;">
          <li>NIM: ${nim}</li>
          <li>Pilihan 1: ${division1}</li>
          <li>Pilihan 2: ${division2}</li>
        </ul>
      </div>

      <p>Saat ini berkas Anda sedang berada dalam tahap <strong>Verifikasi Berkas</strong> oleh tim kami. Pengumuman tahapan selanjutnya (termasuk jadwal Wawancara) akan diinformasikan kemudian.</p>
      
      <p>Untuk mempermudah koordinasi, silakan bergabung ke dalam Grup WhatsApp resmi Calon Panitia Batch 2 YMCC VII melalui tautan di bawah ini:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE" style="background-color: #111; color: #c1ff00; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">GABUNG GRUP WHATSAPP</a>
        <p style="font-size: 11px; color: #999; margin-top: 10px;">*(Tautan grup akan menyusul diupdate oleh panitia)*</p>
      </div>
      
      <p>Persiapkan diri Anda sebaik mungkin. The Green Compass Starts With You!</p>
      
      <br/>
      <p style="font-size: 12px; color: #888;">Salam hormat,<br/>Panitia YMCC VII 2027</p>
    `;

    const professionalTemplate = generateEmailTemplate("Pendaftaran Berhasil - YMCC VII Staff Recruitment", emailHtml);

    const mailOptions = {
      from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Pendaftaran Berhasil - YMCC VII Staff Recruitment",
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
