import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const usersToCreate = [
  { email: 'suryatripatih@gmail.com', password: 'admin123', displayName: 'Surya Tripatih Master' },
  { email: 'noreply@ymccvii.com', password: 'admin123', displayName: 'YMCC System Admin' }
];

async function createAdmins() {
  const auth = getAuth(app);
  for (const user of usersToCreate) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true
      });
      console.log(`Successfully created new user: ${userRecord.uid} (${user.email})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`User already exists: ${user.email}. Attempting to update password...`);
        try {
          const existingUser = await auth.getUserByEmail(user.email);
          await auth.updateUser(existingUser.uid, { password: user.password });
          console.log(`Successfully updated password for ${user.email}`);
        } catch (updateError) {
          console.error(`Error updating password for ${user.email}:`, updateError);
        }
      } else {
        console.error(`Error creating new user ${user.email}:`, error);
      }
    }
  }
}

createAdmins();
