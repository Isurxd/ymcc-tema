"use client";

import { useState } from "react";
import Image from "next/image";

export default function MidtransSnapDemo() {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("methods"); // "methods" | "transfer" | "gopay" | "qris"

  const methods = [
    {
      id: "gopay",
      name: "GoPay",
      icon: "🟢",
      color: "#00AED6",
      badge: null,
    },
    {
      id: "qris",
      name: "QRIS",
      icon: "▦",
      color: "#E8192C",
      badge: "Semua e-Wallet",
    },
    {
      id: "bca",
      name: "Transfer Bank – BCA",
      icon: "🏦",
      color: "#0066AE",
      badge: null,
    },
    {
      id: "bni",
      name: "Transfer Bank – BNI",
      icon: "🏦",
      color: "#F16522",
      badge: null,
    },
    {
      id: "bri",
      name: "Transfer Bank – BRI",
      icon: "🏦",
      color: "#0066AE",
      badge: null,
    },
    {
      id: "mandiri",
      name: "Transfer Bank – Mandiri",
      icon: "🏦",
      color: "#003087",
      badge: null,
    },
    {
      id: "cc",
      name: "Kartu Kredit / Debit",
      icon: "💳",
      color: "#1A1F71",
      badge: "Visa · Mastercard · JCB",
    },
    {
      id: "alfamart",
      name: "Alfamart",
      icon: "🏪",
      color: "#E31E24",
      badge: null,
    },
    {
      id: "indomaret",
      name: "Indomaret",
      icon: "🏪",
      color: "#E31E24",
      badge: null,
    },
    {
      id: "ovo",
      name: "OVO",
      icon: "🟣",
      color: "#4C3494",
      badge: null,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        padding: "24px",
        position: "relative",
      }}
    >
      {/* Background overlay blur simulation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url('/images/checkout-bg.jpg') center/cover",
          opacity: 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Snap Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "420px",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #003c8f 0%, #0066cc 100%)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Midtrans logo placeholder */}
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "10px",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            💳
          </div>
          <div>
            <div
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "11px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "2px",
              }}
            >
              Pembayaran Aman oleh
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "0.5px",
              }}
            >
              Midtrans
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "11px",
                marginBottom: "2px",
              }}
            >
              Total Pembayaran
            </div>
            <div
              style={{
                color: "#c1ff00",
                fontSize: "22px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
              }}
            >
              Rp 240.000
            </div>
          </div>
        </div>

        {/* Merchant info */}
        <div
          style={{
            background: "#f0f4ff",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid #e8ecf4",
          }}
        >
          <div
            style={{
              background: "#003c8f",
              color: "white",
              borderRadius: "8px",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "800",
              flexShrink: 0,
            }}
          >
            Y
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "13px", color: "#1a1a2e" }}>
              YMCC VII – Merchandise
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "1px" }}>
              Order ID: YMCC7-{Date.now().toString().slice(-8)}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              background: "#e8f5e9",
              color: "#2e7d32",
              fontSize: "11px",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "100px",
              border: "1px solid #c8e6c9",
            }}
          >
            🔒 Aman
          </div>
        </div>

        {/* Section title */}
        <div
          style={{
            padding: "16px 24px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#333",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Pilih Metode Pembayaran
          </span>
          <span style={{ fontSize: "11px", color: "#999" }}>
            {methods.length} metode tersedia
          </span>
        </div>

        {/* Payment Methods List */}
        <div style={{ padding: "4px 16px 8px", maxHeight: "340px", overflowY: "auto" }}>
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: selected === m.id ? `2px solid ${m.color}` : "2px solid transparent",
                background: selected === m.id ? `${m.color}10` : "#f8f9fa",
                cursor: "pointer",
                marginBottom: "6px",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "24px", flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a2e" }}>
                  {m.name}
                </div>
                {m.badge && (
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "1px" }}>
                    {m.badge}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: "16px",
                  color: selected === m.id ? m.color : "#ccc",
                  transition: "color 0.15s",
                }}
              >
                {selected === m.id ? "●" : "›"}
              </span>
            </button>
          ))}
        </div>

        {/* Pay Button */}
        <div style={{ padding: "12px 16px 20px" }}>
          <button
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: selected
                ? "linear-gradient(135deg, #003c8f 0%, #0066cc 100%)"
                : "#e0e0e0",
              color: selected ? "#ffffff" : "#999",
              fontSize: "15px",
              fontWeight: "700",
              cursor: selected ? "pointer" : "not-allowed",
              letterSpacing: "0.5px",
              transition: "all 0.2s ease",
              boxShadow: selected
                ? "0 4px 15px rgba(0,102,204,0.35)"
                : "none",
            }}
          >
            {selected ? `Lanjutkan Pembayaran →` : "Pilih Metode Pembayaran"}
          </button>
          <div
            style={{
              textAlign: "center",
              marginTop: "10px",
              fontSize: "11px",
              color: "#aaa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>🔐</span>
            <span>Transaksi dienkripsi 256-bit SSL · Powered by Midtrans</span>
          </div>
        </div>
      </div>
    </div>
  );
}
