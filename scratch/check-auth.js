const fs = require('fs');
const code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

const startIndex = code.indexOf('onAuthStateChanged(auth, async');
if (startIndex !== -1) {
    console.log(code.substring(startIndex, startIndex + 2500));
} else {
    console.log("Could not find onAuthStateChanged block.");
}
