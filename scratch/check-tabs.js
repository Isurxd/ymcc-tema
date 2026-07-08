import fs from 'fs';

const content = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');
const regex = /collection\(\w+,\s*["']([^"']+)["']/g;
const matches = [];
let match;
while ((match = regex.exec(content)) !== null) {
  matches.push(match[1]);
}
console.log("All collections used in StaffDashboard.js:");
console.log([...new Set(matches)]);
