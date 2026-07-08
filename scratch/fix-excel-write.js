const fs = require('fs');

let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

const regex = /const csvString = headers\.join\("\\n"\) \+ "\\n" \+ csvData\.join\("\\n"\);\s*const workbook = XLSX\.read\(csvString, \{ type: "string" \}\);\s*XLSX\.writeFile\(workbook, `([^`]+)\.xlsx`\);/g;

code = code.replace(regex, (match, p1) => {
  return `const csvString = headers.join("\\n") + "\\n" + csvData.join("\\n");
    const workbook = XLSX.read(csvString, { type: "string" });
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`${p1}.xlsx\`;
    a.click();`;
});

fs.writeFileSync('src/components/StaffDashboard.js', code);
console.log('Successfully updated to robust Excel Blob generation.');
