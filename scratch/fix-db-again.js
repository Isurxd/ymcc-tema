const fs = require('fs');

// 1. Fix StaffDashboard.js
let dash = fs.readFileSync('src/components/StaffDashboard.js', 'utf8');

// Add "View Details" button to the Participant Database
if (!dash.includes('<FaEye /> View Details')) {
  // Find the View QR button and insert View Details before it
  dash = dash.replace(
    /<button[^>]*onClick=\{\(\) => setSelectedQrParticipant\(p\)\}[^>]*>[\s\S]*?<FaQrcode \/> View QR[\s\S]*?<\/button>/,
    (match) => {
      return `<button 
          onClick={() => setParticipantModal({ isOpen: true, data: p })}
          className="bg-[#c1ff00] hover:bg-black hover:text-[#c1ff00] border-2 border-black text-black font-anton text-xs uppercase px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-[2px_2px_0_0_#000] hover:shadow-none active:translate-y-px mr-2"
        >
          <FaEye /> View Details
        </button>
        ${match}`;
    }
  );
}

// Translate Recruitment Database in StaffDashboard.js
dash = dash.replace(/Pendaftaran Terbuka:/g, 'Registration Status:');
dash = dash.replace(/UPCOMING/g, 'UPCOMING');
dash = dash.replace(/OPEN/g, 'OPEN');
dash = dash.replace(/CLOSED/g, 'CLOSED');
// Ensure any other Indonesian strings in Staff Dashboard are translated
dash = dash.replace(/Belum mendaftar/gi, 'Not Registered');
dash = dash.replace(/Menampilkan/g, 'Showing');
dash = dash.replace(/Dari/g, 'of');
dash = dash.replace(/Peserta/g, 'Participants');
dash = dash.replace(/Tidak ada data peserta ditemukan./gi, 'No participant data found.');
dash = dash.replace(/Tidak ada data rekrutmen./gi, 'No recruitment data found.');

fs.writeFileSync('src/components/StaffDashboard.js', dash);
console.log('Fixed StaffDashboard.js');

// 2. Fix Recruitment Page
try {
  let recPage = fs.readFileSync('src/app/recruitment/page.js', 'utf8');
  recPage = recPage.replace(/Formulir Pendaftaran Panitia/gi, 'Committee Registration Form');
  recPage = recPage.replace(/Harap isi data dengan lengkap dan benar\./gi, 'Please fill in the data completely and correctly.');
  recPage = recPage.replace(/Nama Lengkap/gi, 'Full Name');
  recPage = recPage.replace(/Nomor WhatsApp/gi, 'WhatsApp Number');
  recPage = recPage.replace(/Alamat Email/gi, 'Email Address');
  recPage = recPage.replace(/Program Studi/gi, 'Study Program / Major');
  recPage = recPage.replace(/Angkatan/gi, 'Batch / Year');
  recPage = recPage.replace(/Pilihan Divisi 1/gi, 'Division Choice 1');
  recPage = recPage.replace(/Pilih divisi prioritas utama/gi, 'Select main priority division');
  recPage = recPage.replace(/Pilihan Divisi 2/gi, 'Division Choice 2');
  recPage = recPage.replace(/Pilih divisi alternatif/gi, 'Select alternative division');
  recPage = recPage.replace(/Pilih Divisi/gi, 'Select Division');
  recPage = recPage.replace(/Link Bukti Follow IG & Tiktok/gi, 'Proof of Follow IG & Tiktok Link');
  recPage = recPage.replace(/Link Post Twibbon/gi, 'Twibbon Post Link');
  recPage = recPage.replace(/Link KHS/gi, 'KHS / Transcript Link');
  recPage = recPage.replace(/Pastikan link Google Drive bersifat/gi, 'Ensure Google Drive links are');
  recPage = recPage.replace(/Anyone with the link can view/gi, 'Anyone with the link can view');
  recPage = recPage.replace(/Alasan Mendaftar/gi, 'Reason for Applying');
  recPage = recPage.replace(/Ceritakan mengapa Anda tertarik/gi, 'Tell us why you are interested');
  recPage = recPage.replace(/Kirim Pendaftaran/gi, 'Submit Application');
  recPage = recPage.replace(/Mengirim.../gi, 'Submitting...');
  recPage = recPage.replace(/Kembali/gi, 'Back');
  recPage = recPage.replace(/Pendaftaran Belum Dibuka/gi, 'Registration Not Yet Open');
  recPage = recPage.replace(/Pendaftaran Ditutup/gi, 'Registration Closed');
  recPage = recPage.replace(/Rekrutmen panitia YMCC VII belum dibuka/gi, 'YMCC VII committee recruitment has not opened yet');
  recPage = recPage.replace(/Rekrutmen panitia YMCC VII sudah ditutup/gi, 'YMCC VII committee recruitment is now closed');
  recPage = recPage.replace(/Terima kasih atas partisipasi Anda/gi, 'Thank you for your participation');
  
  // Clean up exact specific sentences
  recPage = recPage.replace(/Pastikan link Google Drive bersifat "Anyone with the link can view"/gi, 'Ensure Google Drive links are set to "Anyone with the link can view"');
  recPage = recPage.replace(/Ceritakan mengapa Anda tertarik bergabung/gi, 'Tell us why you are interested in joining');
  fs.writeFileSync('src/app/recruitment/page.js', recPage);
  console.log('Fixed recruitment page translation');
} catch(e) {
  console.log('Could not fix recruitment page:', e.message);
}
