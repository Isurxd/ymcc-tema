const fs = require('fs');

let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

// 1. Add import for XLSX at the top
if (!code.includes("import * as XLSX from 'xlsx'")) {
  code = code.replace(/import \{ useState/, "import * as XLSX from 'xlsx';\nimport { useState");
}

// 2. Rename function declarations and calls
const renameMap = {
  'exportParticipantsToCSV': 'exportParticipantsToExcel',
  'exportDatabaseToCSV': 'exportDatabaseToExcel',
  'exportAffiliatesToCSV': 'exportAffiliatesToExcel',
  'exportPayoutsToCSV': 'exportPayoutsToExcel',
  'exportMerchOrdersToCSV': 'exportMerchOrdersToExcel',
  'exportSubmissionsToCSV': 'exportSubmissionsToExcel',
  'exportOrdersToCSV': 'exportOrdersToExcel',
  'exportRecruitmentToCSV': 'exportRecruitmentToExcel'
};

for (const [oldName, newName] of Object.entries(renameMap)) {
  code = code.split(oldName).join(newName);
}

// 3. Rename "Export CSV" text in JSX
code = code.split('Export CSV').join('Export Excel');

// 4. Replace the Blob export logic with XLSX logic
const regex = /const blob = new Blob\(\[headers\.join\("\\n"\) \+ "\\n" \+ csvData\.join\("\\n"\)\], \{ type: [^}]+ \}\);\s*const url = URL\.createObjectURL\(blob\);\s*const a = document\.createElement\('a'\);\s*a\.href = url;\s*a\.download = `([^`]+)\.csv`;\s*a\.click\(\);/g;

code = code.replace(regex, (match, p1) => {
  return `const csvString = headers.join("\\n") + "\\n" + csvData.join("\\n");
    const workbook = XLSX.read(csvString, { type: "string" });
    XLSX.writeFile(workbook, \`${p1}.xlsx\`);`;
});

fs.writeFileSync('src/components/StaffDashboard.js', code);
console.log('Successfully refactored to Excel export.');
