const { initializeApp } = require("firebase/app");
const { getFirestore, writeBatch, doc, collection } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ymcc-vii");

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const longText = "This is a very long text to test UI overflow handling. ".repeat(10);
const veryLongText = "Testing extremely long continuous words like pneumonoultramicroscopicsilicovolcanoconiosis to see if CSS break-word works properly. ".repeat(10);

async function seed() {
  console.log("Seeding COMPREHENSIVE dummy data using Client SDK...");

  try {
    const batches = [];
    let currentBatch = writeBatch(db);
    let opCount = 0;

    const addOp = (ref, data) => {
      currentBatch.set(ref, data);
      opCount++;
      if (opCount === 400) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    };

    // 1. Users (50 participants, 10 staff)
    const usersRef = collection(db, 'users');
    for (let i = 1; i <= 50; i++) {
      addOp(doc(usersRef, `dummy_user_${i}`), {
        email: `participant${i}@dummy.com`,
        fullName: `Participant Dummy ${i} ${longText.substring(0, 50)}`,
        role: "participant",
        whatsapp: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        birthDate: "2000-01-01",
        gender: randomChoice(["Male", "Female"]),
        institution: `University of Dummy ${i}`,
        studentId: `STU${i}`,
        educationLevel: "Undergraduate",
        tshirtSize: randomChoice(["S", "M", "L", "XL", "XXL"]),
        country: "Indonesia",
        province: "DKI Jakarta",
        city: "Jakarta Selatan",
        address: `Jl. Dummy Address No ${i}. ${longText}`,
        dietary: randomChoice(["None", "Vegetarian", "Vegan"]),
        medicalHistory: "None",
        emergencyContact: "08987654321",
        registrationStatus: randomChoice(["VERIFIED", "PENDING", "NEEDS REVISION"]),
        verificationNote: "Please check your ID card blurriness.",
        documents: {
          paymentProof: "https://i.ibb.co/k2RVQVqC.jpg",
          idCard: "https://i.ibb.co/k2RVQVqC.jpg"
        },
        createdAt: new Date().toISOString()
      });
    }

    const staffRoles = ["Operator", "Admin", "Fundraising"];
    for (let i = 1; i <= 10; i++) {
      addOp(doc(usersRef, `dummy_staff_${i}`), {
        email: `staff${i}@dummy.com`,
        fullName: `Staff Dummy ${i}`,
        role: randomChoice(staffRoles),
        status: "APPROVED",
        department: "Event",
        division: "Logistic",
        nim: `NIM${i}`,
        position: "Staff",
        createdAt: new Date().toISOString()
      });
    }

    // 2. News (15 items)
    const newsRef = collection(db, 'news');
    for (let i = 1; i <= 15; i++) {
      addOp(doc(newsRef, `dummy_news_${i}`), {
        title: `Dummy News ${i}: ${longText.substring(0, 100)}`,
        slug: `dummy-news-${i}`,
        content: `<p>Paragraph 1: ${longText}</p><p>Paragraph 2: ${veryLongText}</p>`,
        imageUrl: "https://i.ibb.co/k2RVQVqC.jpg",
        date: `JUN ${i}, 2026`,
        createdAt: new Date().toISOString()
      });
    }

    // 3. FAQs (20 items)
    const faqsRef = collection(db, 'faqs');
    for (let i = 1; i <= 20; i++) {
      addOp(doc(faqsRef, `dummy_faq_${i}`), {
        q: `FAQ Question ${i}: What if ${longText.substring(0, 50)}?`,
        a: `Answer for FAQ ${i}: ${veryLongText}`,
        createdAt: new Date().toISOString()
      });
    }

    // 4. Sponsors (10 items)
    const sponsorsRef = collection(db, 'sponsors');
    for (let i = 1; i <= 10; i++) {
      addOp(doc(sponsorsRef, `dummy_sponsor_${i}`), {
        name: `Sponsor Company ${i}`,
        imageUrl: "https://i.ibb.co/k2RVQVqC.jpg",
        link: "https://example.com",
        tier: randomChoice(["PLATINUM", "GOLD", "SILVER", "BRONZE", "MEDIA PARTNER"]),
        createdAt: new Date().toISOString()
      });
    }

    // 5. Activities (15 items)
    const activitiesRef = collection(db, 'activities');
    for (let i = 1; i <= 15; i++) {
      addOp(doc(activitiesRef, `dummy_activity_${i}`), {
        title: `Activity ${i} ${longText.substring(0, 30)}`,
        description: `Description for Activity ${i}. ${longText}`,
        icon: randomChoice(["FaCalendarAlt", "FaTrophy", "FaUsers"]),
        time: "10:00 AM - 12:00 PM",
        location: "Main Auditorium, Level 1",
        guidebookUrl: "https://example.com/guidebook.pdf",
        registrationLink: "https://example.com/register",
        deadline: new Date(Date.now() + 86400000 * i).toISOString().split('T')[0],
        type: randomChoice(["Pre-Event", "Main Event", "Workshop"]),
        pills: "Competition, Workshop, Seminar",
        createdAt: new Date().toISOString()
      });
    }

    // 6. Merch Banners (5 items)
    const bannersRef = collection(db, 'merch_banners');
    for (let i = 1; i <= 5; i++) {
      addOp(doc(bannersRef, `dummy_banner_${i}`), {
        title: `Mega Sale ${i}`,
        subtitle: `Subtitle for Mega Sale ${i}. ${longText.substring(0, 50)}`,
        image: "https://i.ibb.co/k2RVQVqC.jpg",
        link: "/merch",
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    // 7. Merchandise (30 items)
    const merchRef = collection(db, 'merchandise');
    for (let i = 1; i <= 30; i++) {
      addOp(doc(merchRef, `dummy_merch_${i}`), {
        name: `Dummy Merch Product ${i}: ${longText.substring(0, 60)}`,
        price: `Rp ${(150000 + i * 10000).toLocaleString()}`,
        priceNumber: 150000 + i * 10000,
        stockAmount: Math.floor(Math.random() * 50),
        category: randomChoice(["APPAREL", "ACCESSORIES", "STATIONERY"]),
        image: "https://i.ibb.co/k2RVQVqC.jpg",
        additionalImages: ["https://i.ibb.co/k2RVQVqC.jpg", "https://i.ibb.co/k2RVQVqC.jpg"],
        description: `Merchandise ${i} description. ${veryLongText}`,
        sizes: "S, M, L, XL, XXL",
        active: true,
        weight: 300 + (i * 10),
        createdAt: new Date().toISOString()
      });
    }

    // 8. Merch Orders (50 items)
    const orderRef = collection(db, 'merch_orders');
    for (let i = 1; i <= 50; i++) {
      addOp(doc(orderRef, `dummy_order_${i}`), {
        orderId: `YMCC-MRCH-DUMMY-${i}`,
        customerInfo: {
          fullName: `Buyer ${i} ${longText.substring(0,20)}`,
          email: `buyer${i}@dummy.com`,
          whatsapp: `081111111${i}`,
          referralCode: i % 3 === 0 ? "AFFDUMMY" : "",
        },
        shippingAddress: {
          address: `Shipping Address ${i}. ${longText}`,
          province: "Banten",
          city: "Tangerang"
        },
        items: [
          { id: `dummy_merch_${Math.ceil(Math.random()*30)}`, name: `Dummy Merch ${i}`, price: 150000, size: "L", quantity: Math.ceil(Math.random()*3) }
        ],
        totalAmount: 300000 + (i * 1000),
        shippingCost: 20000,
        deliveryMethod: randomChoice(["shipping", "pickup"]),
        paymentStatus: randomChoice(["PAID", "UNPAID", "EXPIRED"]),
        orderStatus: randomChoice(["PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]),
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
      });
    }

    // 9. Promos (15 items)
    const promoRef = collection(db, 'promos');
    for (let i = 1; i <= 15; i++) {
      addOp(doc(promoRef, `dummy_promo_${i}`), {
        code: `PROMO${i}DUMMY`,
        type: randomChoice(["VOUCHER", "REFERRAL"]),
        discount: i % 2 === 0 ? "50" : "15000",
        discountType: i % 2 === 0 ? "PERCENT" : "FIXED",
        maxUses: "100",
        commission: "5000",
        affiliateEmail: i % 2 !== 0 ? `affiliate${i}@dummy.com` : "",
        frozenBalance: i * 1000,
        availableBalance: i * 5000,
        createdAt: new Date().toISOString()
      });
    }

    // 10. Affiliate Applications (20 items)
    const affAppRef = collection(db, 'affiliate_applications');
    for (let i = 1; i <= 20; i++) {
      addOp(doc(affAppRef, `dummy_aff_app_${i}`), {
        fullName: `Affiliate Applicant ${i}`,
        email: `aff_app${i}@dummy.com`,
        phone: `0899999999${i}`,
        socialLink: `https://instagram.com/dummy${i}`,
        bankDetails: `BCA 1234567890 a.n Applicant ${i}`,
        reason: `Reason ${i}: ${veryLongText}`,
        status: randomChoice(["PENDING", "APPROVED", "REJECTED"]),
        createdAt: new Date().toISOString()
      });
    }

    // 11. Tickets (30 items)
    const ticketRef = collection(db, 'tickets');
    for (let i = 1; i <= 30; i++) {
      addOp(doc(ticketRef, `dummy_ticket_${i}`), {
        userId: `dummy_participant_${Math.ceil(Math.random()*50)}`,
        userEmail: `participant${i}@dummy.com`,
        userName: `User ${i} Name`,
        category: randomChoice(["Payment", "Technical", "General"]),
        subject: `Ticket ${i} Subject: ${longText.substring(0, 80)}`,
        message: `Ticket Message ${i}: ${veryLongText}`,
        status: randomChoice(["OPEN", "IN_PROGRESS", "CLOSED"]),
        priority: randomChoice(["LOW", "NORMAL", "HIGH"]),
        responses: [
          { sender: `participant${i}@dummy.com`, message: `Any update? ${veryLongText.substring(0, 100)}`, timestamp: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString()
      });
    }

    // 12. Audit Logs (100 items)
    const auditRef = collection(db, 'audit_logs');
    for (let i = 1; i <= 100; i++) {
      addOp(doc(auditRef, `dummy_audit_${i}`), {
        action: randomChoice(["CREATE", "UPDATE", "DELETE", "APPROVE"]),
        entity: randomChoice(["User", "Merchandise", "Promo", "Ticket", "Order"]),
        entityId: `entity_${i}`,
        performedBy: `dummy_staff_${Math.ceil(Math.random()*10)}`,
        performedByEmail: `staff${Math.ceil(Math.random()*10)}@dummy.com`,
        details: `Performed action ${i}. ${longText.substring(0, 50)}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString()
      });
    }

    if (opCount > 0) {
      batches.push(currentBatch);
    }

    console.log(`Executing ${batches.length} batches...`);
    for (let b of batches) {
      await b.commit();
    }
    
    console.log("✅ COMPREHENSIVE Dummy data seeded successfully via Client SDK!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding dummy data via Client SDK:", error);
    process.exit(1);
  }
}

seed();
