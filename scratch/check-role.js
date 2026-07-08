const fs = require('fs');
const code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

const roleMatch = code.match(/setUserRole\(([^)]+)\)/g);
console.log('setUserRole calls:', roleMatch);

const authStateMatch = code.match(/onAuthStateChanged[\s\S]{0,1000}/);
console.log('onAuthStateChanged logic:', authStateMatch[0]);
