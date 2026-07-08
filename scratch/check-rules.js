import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*?)'/s);
const serviceAccount = JSON.parse(match[1]);

initializeApp({
  credential: cert(serviceAccount)
});

async function checkRules() {
  const securityRules = getSecurityRules();
  const release = await securityRules.getFirestoreRulesetRelease();
  console.log("Active ruleset:", release.rulesetName);
  const ruleset = await securityRules.getRuleset(release.rulesetName);
  console.log("Rules:");
  console.log(ruleset.source.files[0].content);
}

checkRules();
