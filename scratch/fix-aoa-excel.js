const fs = require('fs');

let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

const start = code.indexOf('const exportDatabaseToExcel = () => {');
const end = code.indexOf('  const downloadQR =');
const toReplace = code.substring(start, end);

const newCode = `const exportDatabaseToExcel = () => {
    const filtered = getFilteredDatabaseParticipants();
    const headers = ["UID", "Full Name", "Email", "WhatsApp", "Gender", "Date of Birth", "Country", "Province", "City", "District", "Village", "Full Address", "Institution", "Student ID", "Education Level", "T-Shirt Size", "Dietary Restrictions", "Medical History", "Emergency Contact", "Verification Status", "Attendance Status", "Registered Activities"];
    
    const aoaData = [headers];

    filtered.forEach(p => {
      const paidComps = getUserPaidCompetitions(p.email);
      const compsStr = paidComps.map(c => c.name).join("; ");
      
      aoaData.push([
        p.id,
        p.fullName || "",
        p.email || "",
        p.whatsapp || p.phone || "",
        p.gender || "",
        p.birthDate || "",
        p.country || "",
        p.province || "",
        p.city || "",
        p.district || "",
        p.village || "",
        p.address || "",
        p.institution || "",
        String(p.studentId || ""),
        p.educationLevel || "",
        p.tshirtSize || "",
        p.dietary || "",
        p.medicalHistory || "",
        p.emergencyContact || "",
        p.registrationStatus || "UNVERIFIED",
        p.attendance ? "PRESENT" : "ABSENT",
        compsStr || ""
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Database");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`database_export_\${new Date().getTime()}.xlsx\`;
    a.click();
  };

`;

code = code.replace(toReplace, newCode);
fs.writeFileSync('src/components/StaffDashboard.js', code);
console.log('Successfully updated to aoa_to_sheet.');
