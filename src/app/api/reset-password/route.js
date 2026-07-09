import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { sendPasswordResetEmailTemplate } from '@/lib/email';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate the password reset link
    let resetLink;
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ymccvii.com";
    if (process.env.NODE_ENV === "development") {
      siteUrl = "http://localhost:3000";
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const fbLink = await auth.generatePasswordResetLink(email);
        const url = new URL(fbLink);
        const oobCode = url.searchParams.get('oobCode');
        resetLink = `${siteUrl}/reset-password?oobCode=${oobCode}`;
      } catch (fbErr) {
        console.error("Firebase Admin failed generating reset link, falling back to mock:", fbErr);
        resetLink = `${siteUrl}/reset-password?oobCode=mockCode_for_${encodeURIComponent(email)}&email=${encodeURIComponent(email)}`;
      }
    } else {
      console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is missing. Using mock reset link for template testing.");
      resetLink = `${siteUrl}/reset-password?oobCode=mockCode_for_${encodeURIComponent(email)}&email=${encodeURIComponent(email)}`;
    }

    // Send the link using our custom Nodemailer template
    const sent = await sendPasswordResetEmailTemplate(email, resetLink);

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Error generating password reset link:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
