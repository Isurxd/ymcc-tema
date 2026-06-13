import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync("./firebase-admin-key.json", "utf8"));

initializeApp({
  credential: cert(serviceAccount)
});

async function deployRules() {
  try {
    const rules = fs.readFileSync("firestore.rules", "utf8");
    const securityRules = getSecurityRules();
    const source = securityRules.createRulesFileFromSource("firestore.rules", rules);
    console.log("Creating new ruleset...");
    const ruleset = await securityRules.createRuleset(source);
    console.log("Created ruleset: " + ruleset.name);
    
    console.log("Releasing ruleset...");
    await securityRules.releaseFirestoreRuleset(ruleset.name);
    console.log("Successfully deployed Firestore rules!");
    process.exit(0);
  } catch (error) {
    console.error("Error deploying rules:", error);
    process.exit(1);
  }
}

deployRules();
