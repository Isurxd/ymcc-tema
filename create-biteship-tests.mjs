import fs from 'fs';

// ⚠️ PLEASE REPLACE WITH YOUR BITESHIP TEST KEY ⚠️
// (Ensure it's the key from Mode Testing)
const API_KEY = "biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiWU1DQyBWSUkiLCJ1c2VySWQiOiI2YTJhNmNhNDc1NjUzMTEwMGEwN2YwZGIiLCJpYXQiOjE3ODExNjcwOTR9.vKSITC7yj7PTNzd-gUucEFcKVnEztp_Y4Mc3YK8oIZY"; 

async function createOrder(reference) {
  const payload = {
    "origin_contact_name": "Admin YMCC",
    "origin_contact_phone": "081234567890",
    "origin_address": "Pendopo FTME Kampus 1 UPN Veteran Yogyakarta",
    "origin_postal_code": 55281,
    "destination_contact_name": "Test User",
    "destination_contact_phone": "089876543210",
    "destination_address": "Jalan Sudirman No 1, Jakarta Pusat",
    "destination_postal_code": 10220,
    "courier_company": "jne",
    "courier_type": "reg",
    "delivery_type": "now",
    "items": [
      {
        "name": "YMCC Merchandise",
        "value": 100000,
        "quantity": 1,
        "weight": 500
      }
    ],
    "reference_id": reference
  };

  const response = await fetch("https://api.biteship.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (data.success) {
    console.log(`✅ Order Created: ${data.id}`);
    return data.id;
  } else {
    console.error("❌ Failed:", data);
  }
}

async function main() {
  if (API_KEY === "YOUR_BITESHIP_TEST_KEY_HERE") {
    console.log("❌ ERROR: You must edit this file and replace 'YOUR_BITESHIP_TEST_KEY_HERE' with your Biteship Test Key.");
    return;
  }

  console.log("📦 Creating Order 1 (To be Delivered)...");
  await createOrder("TEST-DELIVERED-001");

  console.log("\n📦 Creating Order 2 (To be Cancelled)...");
  await createOrder("TEST-CANCELLED-001");

  console.log("\n✅ Done! Check your Biteship Dashboard (Testing Mode) to update their status, then paste the IDs into the activation form.");
}

main();
