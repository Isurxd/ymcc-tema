import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import nodemailer from "nodemailer";

const SUPERADMIN_EMAILS = [
  "m.fairuzadhimularifin@gmail.com",
  "suryatripatih@gmail.com",
  "noreply@ymccvii.com"
];

// Helper: Convert array of objects to CSV string
function toCSV(rows) {
  if (!rows || rows.length === 0) return "No data available.\n";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h] ?? "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

// Helper: Fetch a whole Firestore collection
async function fetchCollection(collectionName) {
  if (!db) return [];
  try {
    const snap = await db.collection(collectionName).get();
    return snap.docs.map(d => {
      const data = d.data();
      // Convert Firestore Timestamps to readable strings
      const cleaned = {};
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && typeof v.toDate === "function") {
          cleaned[k] = v.toDate().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
        } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          cleaned[k] = JSON.stringify(v);
        } else if (Array.isArray(v)) {
          cleaned[k] = v.join("; ");
        } else {
          cleaned[k] = v;
        }
      }
      return { id: d.id, ...cleaned };
    });
  } catch (e) {
    console.error(`Failed to fetch ${collectionName}:`, e.message);
    return [];
  }
}

export async function POST(req) {
  try {
    // Verify superadmin token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let callerEmail = null;
    if (auth) {
      const decoded = await auth.verifyIdToken(token);
      callerEmail = decoded.email;
      if (!SUPERADMIN_EMAILS.includes(callerEmail)) {
        return NextResponse.json({ error: "Forbidden: Only Superadmin can trigger a backup." }, { status: 403 });
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).replace(/[/:, ]/g, "-");

    // Fetch all important collections in parallel
    const [users, orders, staffApps, ticketOrders, attendanceLogs, auditLogs, promos, affiliates] = await Promise.all([
      fetchCollection("users"),
      fetchCollection("merch_orders"),
      fetchCollection("staff_applications"),
      fetchCollection("ticket_orders"),
      fetchCollection("attendance_logs"),
      fetchCollection("audit_logs"),
      fetchCollection("promos"),
      fetchCollection("affiliate_applications"),
    ]);

    // Build CSV attachments
    const attachments = [
      { filename: `1_peserta_${dateStr}.csv`, content: toCSV(users) },
      { filename: `2_orders_merch_${dateStr}.csv`, content: toCSV(orders) },
      { filename: `3_pendaftaran_staf_${dateStr}.csv`, content: toCSV(staffApps) },
      { filename: `4_orders_tiket_${dateStr}.csv`, content: toCSV(ticketOrders) },
      { filename: `5_presensi_${dateStr}.csv`, content: toCSV(attendanceLogs) },
      { filename: `6_audit_log_aktivitas_admin_${dateStr}.csv`, content: toCSV(auditLogs) },
      { filename: `7_promo_voucher_${dateStr}.csv`, content: toCSV(promos) },
      { filename: `8_pendaftar_afiliasi_${dateStr}.csv`, content: toCSV(affiliates) },
    ];

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const summaryRows = [
      `📦 Peserta Terdaftar: ${users.length} akun`,
      `🛒 Order Merchandise: ${orders.length} transaksi`,
      `🎟️ Order Tiket: ${ticketOrders.length} transaksi`,
      `👤 Pendaftar Staf: ${staffApps.length} orang`,
      `📋 Log Presensi: ${attendanceLogs.length} entri`,
      `🔍 Log Audit Admin: ${auditLogs.length} aksi`,
      `🏷️ Promo & Voucher: ${promos.length} kode`,
      `🤝 Pendaftar Afiliasi: ${affiliates.length} orang`,
    ].join("\n");

    await transporter.sendMail({
      from: `"YMCC VII Backup System" <${process.env.EMAIL_USER}>`,
      to: SUPERADMIN_EMAILS.join(", "),
      subject: `[BACKUP] Database YMCC VII – ${now.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })}`,
      text: `Halo Superadmin,\n\nBerikut adalah cadangan data otomatis dari sistem YMCC VII yang dikirim pada:\n${now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB\n\nDipicu oleh: ${callerEmail || "System"}\n\n=== RINGKASAN DATA ===\n${summaryRows}\n\nSemua data terlampir dalam format CSV yang dapat dibuka dengan Microsoft Excel atau Google Sheets.\n\n⚠️ Email ini bersifat rahasia dan hanya untuk keperluan internal YMCC VII.\n\nSalam,\nSistem Otomatis YMCC VII`,
      attachments: attachments.map(a => ({
        filename: a.filename,
        content: Buffer.from(a.content, "utf-8"),
        contentType: "text/csv; charset=utf-8",
      })),
    });

    // Write audit log for this backup action
    if (db && callerEmail) {
      await db.collection("audit_logs").add({
        staffEmail: callerEmail,
        action: "DATABASE_BACKUP",
        details: `Manual backup triggered. Exported ${users.length} users, ${orders.length} merch orders, ${ticketOrders.length} ticket orders. Sent to: ${SUPERADMIN_EMAILS.join(", ")}`,
        timestamp: new Date(),
      });
    }

    return NextResponse.json({ success: true, message: `Backup berhasil dikirim ke email ${SUPERADMIN_EMAILS.join(", ")}. Cek inbox email Superadmin Anda.` });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ error: "Backup gagal: " + error.message }, { status: 500 });
  }
}
