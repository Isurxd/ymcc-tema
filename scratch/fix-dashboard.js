const fs = require('fs');
let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

// 1. Remove Presensi Header from Database table
code = code.replace(/<th className="p-4">Presensi<\/th>/g, '');

// 2. Remove Presensi Data from Database table
code = code.replace(/<td className="p-4">\s*\{p\.attendance \? \(\s*<span className="text-green-600 font-bold bg-green-50 border border-green-200 px-2\.5 py-0\.5 rounded text-xs uppercase">Hadir<\/span>\s*\) : \(\s*<span className="text-gray-400 font-medium bg-gray-50 border border-gray-200 px-2\.5 py-0\.5 rounded text-xs uppercase">Absen<\/span>\s*\)\}\s*<\/td>/g, '');

// 3. Add View Details button next to View QR in Database table
const qrButtonStr = `<button 
                                  onClick={() => setSelectedQrParticipant(p)}
                                  className="bg-white hover:bg-gray-100 border-2 border-black text-black font-anton text-xs uppercase px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px"
                                >
                                  <FaQrcode /> View QR
                                </button>`;
const viewDetailsDbStr = `<button 
                                  onClick={() => setParticipantModal({ isOpen: true, data: p })}
                                  className="bg-[#c1ff00] hover:bg-black hover:text-[#c1ff00] border-2 border-black text-black font-anton text-xs uppercase px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px"
                                >
                                  <FaEye /> View Details
                                </button>`;
code = code.replace(qrButtonStr, viewDetailsDbStr + '\n                                ' + qrButtonStr);

// 4. Remove Attendance Header from Verification table
code = code.replace(/<th className="p-4 border-b border-gray-200">Attendance<\/th>/g, '');

// 5. Remove Attendance Data from Verification table
code = code.replace(/<td className="p-4 border-b border-gray-100 text-xs">\s*\{p\.attendance \? \(\s*<span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Checked In<\/span>\s*\) : \(\s*<span className="text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">Absent<\/span>\s*\)\}\s*<\/td>/g, '');

// 6. Remove toggleAttendance buttons from Verification table
const actionCellRegex = /(<td className="p-4 border-b border-gray-100 text-right">\s*<div className="flex justify-end gap-2">\s*)\{p\.attendance \? \(\s*<button onClick=\{\(\) => toggleAttendance\(p\.id, false\)\} disabled=\{actionLoading\} className="text-orange-500 hover:text-orange-700 bg-orange-50 p-2 rounded-lg" title="Undo Check-In">\s*<FaTimesCircle \/>\s*<\/button>\s*\) : \(\s*<button onClick=\{\(\) => toggleAttendance\(p\.id, true\)\} disabled=\{actionLoading\} className="text-green-500 hover:text-green-700 bg-green-50 p-2 rounded-lg" title="Manual Check-In">\s*<FaCheck \/>\s*<\/button>\s*\)\}/g;
code = code.replace(actionCellRegex, '$1');

// 7. Change FaEdit to FaEye and text for "View Details" in Verification table Action cell
code = code.replace(/<button onClick=\{\(\) => setParticipantModal\(\{ isOpen: true, data: p \}\)\} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg">\s*<FaEdit \/>\s*<\/button>/g, `<button onClick={() => setParticipantModal({ isOpen: true, data: p })} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg flex items-center gap-1 text-xs font-bold uppercase"><FaEye size={14}/> Detail</button>`);

// Make sure FaEye is imported
if (!code.includes('FaEye')) {
    code = code.replace(/FaEdit,/, 'FaEdit, FaEye,');
}

fs.writeFileSync('src/components/StaffDashboard.js', code, 'utf8');
console.log('Successfully updated StaffDashboard.js');
