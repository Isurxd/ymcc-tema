const fs = require('fs');
const code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');
const regex = /collection\(db,\s*['"]([^'"]+)['"]\)/g;
let match;
const collections = new Set();
while ((match = regex.exec(code)) !== null) {
  collections.add(match[1]);
}
console.log([...collections]);
