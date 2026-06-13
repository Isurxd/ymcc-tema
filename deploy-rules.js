const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deployRules() {
  try {
    const rules = fs.readFileSync("firestore.rules", "utf8");
    const source = {
      files: [{
        name: "firestore.rules",
        content: rules
      }]
    };
    console.log("Creating new ruleset...");
    const ruleset = await admin.securityRules().createRuleset(source);
    console.log("Created ruleset: " + ruleset.name);
    
    console.log("Releasing ruleset...");
    await admin.securityRules().releaseFirestoreRuleset(ruleset.name);
    console.log("Successfully deployed Firestore rules!");
    process.exit(0);
  } catch (error) {
    console.error("Error deploying rules:", error);
    process.exit(1);
  }
}

deployRules();
