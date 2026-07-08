const fs = require('fs');
let code = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

code = code.replace(/Anda memiliki akses eksklusif untuk mereview, menambah, dan menyunting aplikasi staff \(Admin & Operator\)\./g, 'You have exclusive access to review, add, and edit staff applications (Admin & Operator).');
code = code.replace(/Database Peserta/g, 'Participant Database');
code = code.replace(/Kelola dan ekspor data peserta terdaftar serta lihat QR Code untuk proses check-in\./g, 'Manage and export registered participant data, and view QR Codes for check-in process.');
code = code.replace(/Directory Peserta/g, 'Participant Directory');
code = code.replace(/Cari nama\/email\/wa\.\.\./g, 'Search name/email/wa...');
code = code.replace(/Semua Kompetisi/g, 'All Competitions');
code = code.replace(/Semua Status/g, 'All Statuses');
code = code.replace(/<th className="p-4">Peserta<\/th>/g, '<th className="p-4">Participant</th>');
code = code.replace(/<th className="p-4">Kontak<\/th>/g, '<th className="p-4">Contact</th>');
code = code.replace(/<th className="p-4">Institusi<\/th>/g, '<th className="p-4">Institution</th>');
code = code.replace(/<th className="p-4">Kompetisi<\/th>/g, '<th className="p-4">Competition</th>');
code = code.replace(/<th className="text-right p-4">Aksi<\/th>/g, '<th className="text-right p-4">Action</th>');
code = code.replace(/Belum mendaftar/g, 'Not Registered');
code = code.replace(/Tidak ada data peserta ditemukan\./g, 'No participant data found.');
code = code.replace(/Menampilkan/g, 'Showing');
code = code.replace(/Dari(.*?)Peserta/g, 'of$1Participants');
code = code.replace(/>Recruitment Database</g, '>Recruitment<');

fs.writeFileSync('src/components/StaffDashboard.js', code);
console.log("Successfully translated Dashboard pieces.");
