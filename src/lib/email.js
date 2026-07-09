import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const generateEmailTemplate = (subject, emailContent) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #09090b; color: #e5e7eb;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              <!-- Header -->
              <tr>
                <td align="left" style="background-color: #000000; padding: 40px; border-bottom: 3px solid #c1ff00;">
                  <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ymccvii.com'}/LOGO%20YMCC.png" alt="YMCC Logo" style="height: 45px; display: block; margin-bottom: 25px; filter: brightness(0) invert(1); -webkit-filter: brightness(0) invert(1);" />
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">NAVIGATE THE FUTURE.</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px; line-height: 1.8; font-size: 15px; color: #d1d5db;">
                  ${emailContent}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td align="left" style="background-color: #111111; padding: 30px 40px; border-top: 1px solid #222222;">
                  <div style="margin-bottom: 20px;">
                     <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ymccvii.com'}/LOGO%20UPN.png" alt="UPN Logo" style="height: 40px; margin-right: 15px; display: inline-block;" />
                     <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://ymccvii.com'}/LOGO%20HMTA.png" alt="HMTA Logo" style="height: 40px; display: inline-block;" />
                  </div>
                  <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                    This is an automated message from the YMCC VII System.<br/>
                    Please do not reply directly to this email.<br/>
                    For support, please contact our official admin via WhatsApp.
                  </p>
                  <p style="margin: 15px 0 0 0; font-size: 11px; color: #555555; font-weight: bold;">
                    &copy; ${new Date().getFullYear()} Organizing Committee of YMCC VII. All Rights Reserved.
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ymccvii.com";

export const sendOrderCreatedEmail = async (toEmail, orderData) => {
  const subject = `Action Required: Pay Your YMCC Order [${orderData.id}]`;
  const emailContent = `
    <h2 style="text-transform: uppercase; font-size: 20px; font-weight: bold; border-bottom: 2px solid #27272a; padding-bottom: 15px; margin-top: 0; color: #ffffff;">ORDER PLACED - AWAITING PAYMENT</h2>
    <p>Hello <strong style="color: #ffffff;">${orderData.customerName}</strong>,</p>
    <p>Thank you for placing an order for YMCC VII Official Merchandise. Your order has been recorded with the ID: <strong style="color: #c1ff00;">${orderData.id}</strong>.</p>
    
    <div style="background-color: #09090b; padding: 20px; margin: 25px 0; border-radius: 12px; border: 1px solid #27272a;">
      <p style="margin: 0; font-weight: bold; font-size: 16px; color: #ffffff;">Total Amount: Rp ${orderData.totalAmount.toLocaleString('id-ID')}</p>
      <p style="margin: 12px 0 0 0; font-weight: bold; color: #ffffff;">Status: <span style="background-color: #fbbf24; color: #000; padding: 4px 10px; border-radius: 6px; font-size: 14px; margin-left: 5px;">${orderData.status}</span></p>
    </div>

    <p>Please complete your payment so we can process your gear. You can resume your payment or track your order status anytime by clicking the link below:</p>
    
    <div style="text-align: left; margin: 35px 0 10px 0;">
      <a href="${SITE_URL}/order-status?id=${orderData.id}" style="display: inline-block; background-color: #c1ff00; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
        PAY / VIEW MY ORDER
      </a>
    </div>
  `;

  const htmlContent = generateEmailTemplate(subject, emailContent);
  const textContent = `Halo ${orderData.customerName},\n\nTerima kasih telah melakukan pemesanan di YMCC VII. Pesanan Anda telah tercatat dengan ID: ${orderData.id}.\n\nTotal Pembayaran: Rp ${orderData.totalAmount.toLocaleString('id-ID')}\nStatus: ${orderData.status}\n\nSilakan selesaikan pembayaran Anda melalui tautan berikut:\n${SITE_URL}/order-status?id=${orderData.id}\n\nSalam hangat,\nTim YMCC VII`;

  const mailOptions = {
    from: `"YMCC VII Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    replyTo: process.env.EMAIL_USER,
    subject: subject,
    html: htmlContent,
    text: textContent,
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "X-Mailer": "Nodemailer (YMCC-VII)",
      "Importance": "Normal"
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

export const sendPaymentReceivedEmail = async (toEmail, orderData) => {
  const subject = `Payment Received - YMCC Order [${orderData.id}]`;
  const emailContent = `
    <h2 style="text-transform: uppercase; font-size: 20px; font-weight: bold; border-bottom: 2px solid #27272a; padding-bottom: 15px; margin-top: 0; color: #ffffff;">PAYMENT SUCCESSFUL</h2>
    <p>Hello <strong style="color: #ffffff;">${orderData.customerName}</strong>,</p>
    <p>We have successfully received your payment for order ID: <strong style="color: #c1ff00;">${orderData.id}</strong>.</p>
    
    <div style="background-color: #09090b; padding: 20px; margin: 25px 0; border-radius: 12px; border: 1px solid #27272a;">
      <p style="margin: 0; font-weight: bold; font-size: 16px; color: #ffffff;">Total Paid: Rp ${orderData.totalAmount.toLocaleString('id-ID')}</p>
      <p style="margin: 12px 0 0 0; font-weight: bold; color: #ffffff;">Status: <span style="background-color: #c1ff00; color: #000; padding: 4px 10px; border-radius: 6px; font-size: 14px; margin-left: 5px;">PAID</span></p>
    </div>

    <p>Your order is now being processed by our team. You can track your shipment and order status anytime by clicking the link below:</p>
    
    <div style="text-align: left; margin: 35px 0 10px 0;">
      <a href="${SITE_URL}/order-status?id=${orderData.id}" style="display: inline-block; background-color: #c1ff00; color: #000000; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
        TRACK MY ORDER
      </a>
    </div>
  `;

  const htmlContent = generateEmailTemplate(subject, emailContent);
  const textContent = `Halo ${orderData.customerName},\n\nPembayaran Anda untuk order ID: ${orderData.id} telah kami terima dengan sukses.\n\nTotal Terbayar: Rp ${orderData.totalAmount.toLocaleString('id-ID')}\nStatus: PAID\n\nPesanan Anda sedang diproses oleh tim kami. Anda dapat melacak status pesanan Anda melalui tautan berikut:\n${SITE_URL}/order-status?id=${orderData.id}\n\nSalam hangat,\nTim YMCC VII`;

  const mailOptions = {
    from: `"YMCC VII Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    replyTo: process.env.EMAIL_USER,
    subject: subject,
    html: htmlContent,
    text: textContent,
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "X-Mailer": "Nodemailer (YMCC-VII)",
      "Importance": "Normal"
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

// Force Next.js Turbopack to recompile

export const sendPasswordResetEmailTemplate = async (toEmail, resetLink) => {
  const subject = "Reset Your YMCC VII Password";
  const emailContent = `
    <h2 style="text-transform: uppercase; font-size: 20px; font-weight: bold; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; margin-top: 0;">PASSWORD RESET REQUEST</h2>
    <p>Hello,</p>
    <p>We received a request to reset the password for your YMCC VII account associated with <strong>${toEmail}</strong>.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; margin: 25px 0; border-radius: 8px; border: 1px solid #eeeeee; text-align: center;">
      <p style="margin: 0; font-size: 14px;">Click the button below to set a new password:</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: #c1ff00; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
        RESET PASSWORD
      </a>
    </div>

    <p style="font-size: 14px; color: #555;">If the button above does not work, copy and paste this link into your web browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #888;">${resetLink}</p>
    
    <p style="margin-top: 30px; font-size: 14px;">If you didn't request a password reset, please ignore this email or contact our support if you have questions.</p>
  `;

  const htmlContent = generateEmailTemplate(subject, emailContent);
  const textContent = `Halo,\n\nKami menerima permintaan untuk mereset kata sandi akun YMCC VII Anda.\n\nSilakan klik tautan berikut untuk membuat kata sandi baru:\n${resetLink}\n\nJika Anda tidak meminta reset kata sandi, abaikan email ini.\n\nSalam hangat,\nTim YMCC VII`;

  if (!process.env.SMTP_HOST || !process.env.EMAIL_USER) {
    console.warn("WARNING: SMTP credentials missing. Writing reset email template to public/reset-email-preview.html instead of sending.");
    try {
      const previewPath = path.join(process.cwd(), 'public', 'reset-email-preview.html');
      fs.writeFileSync(previewPath, htmlContent, 'utf8');
      console.log(`Email template preview successfully written to: ${previewPath}`);
    } catch (e) {
      console.error("Failed to write preview file:", e);
    }
    return true;
  }

  const mailOptions = {
    from: `"YMCC VII Official" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    replyTo: process.env.EMAIL_USER,
    subject: subject,
    html: htmlContent,
    text: textContent,
    headers: {
      "X-Priority": "3",
      "X-MSMail-Priority": "Normal",
      "X-Mailer": "Nodemailer (YMCC-VII)",
      "Importance": "Normal"
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending password reset email: ", error);
    return false;
  }
};
