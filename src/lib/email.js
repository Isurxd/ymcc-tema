import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderCreatedEmail = async (toEmail, orderData) => {
  const subject = `Action Required: Pay Your YMCC Order [${orderData.id}]`;
  const emailContent = `
    <h2 style="text-transform: uppercase; font-size: 20px; font-weight: bold; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; margin-top: 0;">Order Placed - Awaiting Payment</h2>
    <p>Hello <strong>${orderData.customerName}</strong>,</p>
    <p>Thank you for placing an order for YMCC VII Official Merchandise. Your order has been recorded with the ID: <strong>${orderData.id}</strong>.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; margin: 25px 0; border-radius: 8px; border: 1px solid #eeeeee;">
      <p style="margin: 0; font-weight: bold; font-size: 16px;">Total Amount: Rp ${orderData.totalAmount.toLocaleString('id-ID')}</p>
      <p style="margin: 10px 0 0 0; font-weight: bold;">Status: <span style="background-color: #fbbf24; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${orderData.status}</span></p>
    </div>

    <p>Please complete your payment so we can process your gear. You can resume your payment or track your order status anytime by clicking the link below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/order-status?id=${orderData.id}" style="display: inline-block; background-color: #000000; color: #c1ff00; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
        PAY / VIEW MY ORDER
      </a>
    </div>
  `;

  const htmlContent = `
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
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">Youth Mining Camp Competition</p>
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
    from: `"YMCC VII Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
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
    <h2 style="text-transform: uppercase; font-size: 20px; font-weight: bold; border-bottom: 2px solid #eeeeee; padding-bottom: 10px; margin-top: 0;">Payment Successful</h2>
    <p>Hello <strong>${orderData.customerName}</strong>,</p>
    <p>We have successfully received your payment for order ID: <strong>${orderData.id}</strong>.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; margin: 25px 0; border-radius: 8px; border: 1px solid #eeeeee;">
      <p style="margin: 0; font-weight: bold; font-size: 16px;">Total Paid: Rp ${orderData.totalAmount.toLocaleString('id-ID')}</p>
      <p style="margin: 10px 0 0 0; font-weight: bold;">Status: <span style="background-color: #c1ff00; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 14px;">PAID</span></p>
    </div>

    <p>Your order is now being processed by our team. You can track your shipment and order status anytime by clicking the link below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/order-status?id=${orderData.id}" style="display: inline-block; background-color: #000000; color: #c1ff00; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
        TRACK MY ORDER
      </a>
    </div>
  `;

  const htmlContent = `
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
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">Youth Mining Camp Competition</p>
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
    from: `"YMCC VII Store" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
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
