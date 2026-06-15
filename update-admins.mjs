import fs from 'fs';
const files = [
  'src/app/login/page.js',
  'src/app/portal/page.js',
  'src/app/staff/page.js',
  'src/components/StaffDashboard.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/user\.email === "m\.fairuzadhimularifin@gmail\.com"/g, '["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(user.email)');
  
  content = content.replace(/currentUser\.email === "m\.fairuzadhimularifin@gmail\.com"/g, '["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(currentUser.email)');
  
  content = content.replace(/userEmail === "m\.fairuzadhimularifin@gmail\.com"/g, '["m.fairuzadhimularifin@gmail.com", "suryatripatih@gmail.com", "noreply@ymccvii.com"].includes(userEmail)');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${file}`);
}
