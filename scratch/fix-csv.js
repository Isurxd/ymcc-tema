const fs = require('fs');

let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

const regex = /const exportDatabaseToCSV = \(\) => \{[\s\S]*?a\.click\(\);\s*\};/;

const newExportFunc = `const exportDatabaseToCSV = () => {
    const filtered = getFilteredDatabaseParticipants();
    const headers = ["UID,Full Name,Email,WhatsApp,Gender,Date of Birth,Country,Province,City,District,Village,Full Address,Institution,Student ID,Education Level,T-Shirt Size,Dietary Restrictions,Medical History,Emergency Contact,Verification Status,Attendance Status,Registered Activities"];
    
    const csvData = filtered.map(p => {
      const paidComps = getUserPaidCompetitions(p.email);
      const compsStr = paidComps.map(c => c.name).join("; ");
      
      const escapeCsv = (str) => {
        if (!str) return "";
        return '"' + String(str).replace(/"/g, '""') + '"';
      };

      const fullName = escapeCsv(p.fullName);
      const email = escapeCsv(p.email);
      const whatsapp = escapeCsv(p.whatsapp || p.phone);
      const gender = escapeCsv(p.gender);
      const dob = escapeCsv(p.birthDate);
      const country = escapeCsv(p.country);
      const province = escapeCsv(p.province);
      const city = escapeCsv(p.city);
      const district = escapeCsv(p.district);
      const village = escapeCsv(p.village);
      const address = escapeCsv(p.address);
      const institution = escapeCsv(p.institution);
      const studentId = escapeCsv(p.studentId);
      const eduLevel = escapeCsv(p.educationLevel);
      const tshirt = escapeCsv(p.tshirtSize);
      const dietary = escapeCsv(p.dietary);
      const medical = escapeCsv(p.medicalHistory);
      const emergency = escapeCsv(p.emergencyContact);
      const status = escapeCsv(p.registrationStatus || "UNVERIFIED");
      const attendance = escapeCsv(p.attendance ? "PRESENT" : "ABSENT");
      const activities = escapeCsv(compsStr);

      return \`"\${p.id}",\${fullName},\${email},\${whatsapp},\${gender},\${dob},\${country},\${province},\${city},\${district},\${village},\${address},\${institution},\${studentId},\${eduLevel},\${tshirt},\${dietary},\${medical},\${emergency},\${status},\${attendance},\${activities}\`;
    });
    
    const blob = new Blob([headers.join("\\n") + "\\n" + csvData.join("\\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`database_export_\${new Date().getTime()}.csv\`;
    a.click();
  };`;

if (code.match(regex)) {
  code = code.replace(regex, newExportFunc);
  fs.writeFileSync('src/components/StaffDashboard.js', code);
  console.log('Successfully replaced exportDatabaseToCSV');
} else {
  console.log('Could not find exportDatabaseToCSV');
}
