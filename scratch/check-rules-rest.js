import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

async function checkRules() {
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
  
  if (res.data.releases && res.data.releases.length > 0) {
    const release = res.data.releases.find(r => r.name.includes('cloud.firestore'));
    if (release) {
      console.log(`Active ruleset for firestore: ${release.rulesetName}`);
      const rulesetUrl = `https://firebaserules.googleapis.com/v1/${release.rulesetName}`;
      const rulesetRes = await client.request({ url: rulesetUrl });
      console.log("RULES CONTENT:");
      console.log(rulesetRes.data.source.files[0].content);
    } else {
      console.log("No firestore release found.");
    }
  }
}
checkRules().catch(console.error);
