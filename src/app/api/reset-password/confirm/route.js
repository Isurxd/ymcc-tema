import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { email, newPassword, oobCode } = await req.json();

    if (!email || !newPassword || !oobCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Security check: Only allow mock resets if oobCode starts with mockCode_for_
    if (!oobCode.startsWith('mockCode_for_')) {
      return NextResponse.json({ error: 'Unauthorized reset request' }, { status: 403 });
    }

    if (!auth) {
      return NextResponse.json({ error: 'Auth not initialized' }, { status: 500 });
    }

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Update user password directly using Admin SDK
    await auth.updateUser(userRecord.uid, {
      password: newPassword
    });

    console.log(`Successfully reset password for mock user: ${email}`);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error confirming mock password reset:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
