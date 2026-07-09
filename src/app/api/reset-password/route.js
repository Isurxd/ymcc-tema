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
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      resetLink = await auth.generatePasswordResetLink(email);
    } else {
      console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is missing. Using mock reset link for template testing.");
      resetLink = `https://ymccvii.com/__/auth/action?mode=resetPassword&oobCode=mockCode_for_${encodeURIComponent(email)}`;
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
