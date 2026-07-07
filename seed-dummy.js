const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');


if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app, "ymcc-vii");

async function seed() {
  console.log("Seeding dummy data...");
  const batch = db.batch();

  // 1. Users (Participant, Admin, Operator, Fundraising)
  const usersRef = db.collection('users');
  const dummyUsers = [
    {
      id: "dummy_participant_1",
      email: "participant1@dummy.com",
      fullName: "John Doe (Dummy)",
      role: "Participant",
      whatsapp: "081234567890",
      birthDate: "2000-01-01",
      gender: "Male",
      institution: "Dummy University",
      studentId: "12345678",
      educationLevel: "Undergraduate",
      tshirtSize: "L",
      country: "Indonesia",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      address: "Jl. Dummy Address No 1, Very Long Address to test if the UI breaks when it wraps across multiple lines",
      dietary: "None",
      medicalHistory: "None",
      emergencyContact: "08987654321",
      registrationStatus: "VERIFIED",
      verificationNote: "",
      documents: {
        paymentProof: "https://example.com/payment.jpg",
        idCard: "https://example.com/id.jpg"
      },
      createdAt: new Date().toISOString()
    },
    {
      id: "dummy_operator_1",
      email: "operator@dummy.com",
      fullName: "Op Staff",
      role: "Operator",
      status: "APPROVED",
      department: "Event",
      division: "Logistic",
      nim: "987654",
      position: "Staff",
      createdAt: new Date().toISOString()
    }
  ];

  dummyUsers.forEach(u => {
    batch.set(usersRef.doc(u.id), u);
  });

  // 2. News
  const newsRef = db.collection('news');
  batch.set(newsRef.doc("dummy_news_1"), {
    title: "Dummy Very Long News Title That Might Break The UI Because It Has Too Many Words And characters",
    slug: "dummy-very-long-news-title",
    content: "<p>This is a dummy content. It is extremely long. <b>Bold text</b>. ".repeat(20) + "</p>",
    imageUrl: "https://i.ibb.co/k2RVQVqC.jpg", // placeholder
    date: "JUN 25, 2026",
    createdAt: new Date().toISOString()
  });

  // 3. Merch
  const merchRef = db.collection('merchandise');
  batch.set(merchRef.doc("dummy_merch_1"), {
    name: "Dummy Merch Overpowered T-Shirt With Very Long Name",
    price: "Rp 150.000",
    priceNumber: 150000,
    stockAmount: 10,
    category: "APPAREL",
    image: "https://i.ibb.co/k2RVQVqC.jpg",
    additionalImages: ["https://i.ibb.co/k2RVQVqC.jpg"],
    description: "This is a dummy merchandise description. " .repeat(10),
    sizes: "S, M, L, XL, XXL",
    active: true,
    weight: 300,
    createdAt: new Date().toISOString()
  });

  // 4. Promos
  const promoRef = db.collection('promos');
  batch.set(promoRef.doc("dummy_promo_1"), {
    code: "DUMMYDISC50",
    type: "VOUCHER",
    discount: "50",
    discountType: "PERCENT",
    maxUses: "100",
    createdAt: new Date().toISOString()
  });
  batch.set(promoRef.doc("dummy_affiliate_1"), {
    code: "AFFDUMMY",
    type: "REFERRAL",
    discount: "10000",
    discountType: "FIXED",
    commission: "5000",
    affiliateEmail: "affiliate@dummy.com",
    frozenBalance: 0,
    availableBalance: 0,
    createdAt: new Date().toISOString()
  });

  // 5. Orders
  const orderRef = db.collection('merch_orders');
  batch.set(orderRef.doc("dummy_order_1"), {
    orderId: "YMCC-MRCH-DUMMY1",
    customerInfo: {
      fullName: "Dummy Customer",
      email: "buyer@dummy.com",
      whatsapp: "0811111111",
      referralCode: "AFFDUMMY",
    },
    shippingAddress: {
      address: "Long dummy address for shipping, block C no 15.",
      province: "Banten",
      city: "Tangerang"
    },
    items: [
      { id: "dummy_merch_1", name: "Dummy Merch", price: 150000, size: "L", quantity: 2 }
    ],
    totalAmount: 300000,
    shippingCost: 20000,
    deliveryMethod: "shipping",
    paymentStatus: "PAID",
    orderStatus: "PROCESSING",
    createdAt: new Date().toISOString()
  });

  // 6. Tickets
  const ticketRef = db.collection('tickets');
  batch.set(ticketRef.doc("dummy_ticket_1"), {
    userId: "dummy_participant_1",
    userEmail: "participant1@dummy.com",
    userName: "John Doe (Dummy)",
    category: "Payment",
    subject: "Dummy payment issue that is very long subject line to test",
    message: "I paid but it's not verified. Help!".repeat(10),
    status: "OPEN",
    priority: "HIGH",
    responses: [
      { sender: "participant1@dummy.com", message: "Any update?", timestamp: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  });

  try {
    await batch.commit();
    console.log("Dummy data seeded successfully.");
  } catch (error) {
    console.error("Error seeding dummy data:", error);
  }
}

seed();
