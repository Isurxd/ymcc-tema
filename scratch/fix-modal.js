const fs = require('fs');
let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

// 1. Fix FaEye import
if (!code.includes('FaEye')) {
    code = code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react-icons\/fa['"]/, (match, p1) => {
        return `import {${p1}, FaEye} from 'react-icons/fa'`;
    });
}

// 2. Add Formal Profile Photo, etc. to ParticipantModal
// Search for "Verify Participant" header to inject photo
const photoHtml = `
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center">
                <span className="text-gray-500 font-bold text-xs block uppercase mb-2">Formal Profile Photo</span>
                {participantModal.data.photoUrl ? (
                  <div className="w-32 h-40 bg-red-600 rounded-lg overflow-hidden border-2 border-black shadow-[4px_4px_0_0_#000]">
                    <img src={participantModal.data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-40 bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-400 text-gray-400 text-xs text-center p-2">
                    No Photo<br/>Uploaded
                  </div>
                )}
              </div>
            </div>
`;

if (!code.includes('participantModal.data.photoUrl')) {
    code = code.replace(/(<h3 className="font-anton text-2xl uppercase mb-4 border-b-2 border-gray-100 pb-2">Verify Participant<\/h3>)/, `$1\n${photoHtml}`);
}

// Ensure the translated string changes from earlier didn't get overridden
code = code.replace(/Anda memiliki akses eksklusif untuk mereview, menambah, dan menyunting aplikasi staff \(Admin & Operator\)\./g, 'You have exclusive access to review, add, and edit staff applications (Admin & Operator).');
code = code.replace(/>Recruitment Database</g, '>Recruitment<');

fs.writeFileSync('src/components/StaffDashboard.js', code);
console.log("Fixed FaEye, added profile photo, and ensured translation.");
