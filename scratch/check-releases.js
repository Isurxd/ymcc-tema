import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

async function run() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: serviceAccount.project_id
  });

  const client = await auth.getClient();
  const projectId = serviceAccount.project_id;
  
  const url = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
  const res = await client.request({ url });
  
  console.log("ALL RELEASES:");
  res.data.releases.forEach(r => console.log(r.name, "->", r.rulesetName));
}
run().catch(console.error);
