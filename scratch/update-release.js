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
  
  const rulesetName = "projects/ymcc-vii/rulesets/665aa9d6-5006-48c9-bdd0-22ba4ef88e15";
  const releaseName = `projects/ymcc-vii/releases/cloud.firestore/ymcc-vii`;
  
  const url = `https://firebaserules.googleapis.com/v1/${releaseName}`;
  
  try {
    const res = await client.request({ 
      url, 
      method: 'PATCH',
      data: {
        release: {
          name: releaseName,
          rulesetName: rulesetName
        }
      }
    });
    console.log("Successfully updated release!");
    console.log(res.data);
  } catch (e) {
    if (e.response && e.response.data) {
      console.log(JSON.stringify(e.response.data, null, 2));
    } else {
      console.error(e);
    }
  }
}
run().catch(console.error);
