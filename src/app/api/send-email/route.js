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
        await auth.verifyIdToken(token);
      } catch (e) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }
    }

    const { to, bcc, subject, html, text } = await req.json();

    if ((!to && !bcc) || !subject || (!text && !html)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Professional Anti-Spam HTML Template Wrapper
    const emailContent = html || (text ? text.replace(/\n/g, '<br/>') : '');
    
    const professionalTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td align="center" style="background-color: #000000; padding: 30px;">
                    <h1 style="color: #c1ff00; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">YMCC VII</h1>
                    <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">Yogyakarta Mining Competition & Conference</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px; line-height: 1.6; font-size: 16px;">
                    ${emailContent}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; font-size: 12px; color: #888888;">
                      This is an automated message from the YMCC VII System.<br/>
                      Please do not reply directly to this email.<br/>
                      For support, please contact our official admin via WhatsApp.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #bbbbbb;">
                      &copy; ${new Date().getFullYear()} YMCC VII. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

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
