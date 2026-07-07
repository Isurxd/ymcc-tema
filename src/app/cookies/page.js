import ReactMarkdown from 'react-markdown';

export default function Page() {
  const content = `
## COOKIE AND TRACKING POLICY
 
**ORGANIZING COMMITTEE OF YOUTH MINING CAMP COMPETITION (YMCC) VII**  
**DEPARTMENT OF MINING ENGINEERING - UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" YOGYAKARTA**
 
**DOCUMENT CLASSIFICATION: LEGAL PORTAL CONTENTS (GLOBAL STANDARD)**  
**LAST UPDATED: MAY 26, 2026**

---

### 1. INTRODUCTION AND LEGAL COMPLIANCE
This Cookie and Tracking Policy (hereinafter referred to as the "Cookie Policy") governs the use of cookies, local storage, session storage, and equivalent digital tracking technologies on the official website of the Youth Mining Camp Competition (YMCC) VII (accessible via ymccvii.com, its subdomains, and integrated portals, hereinafter collectively referred to as the "Platform"). This Platform is operated by the YMCC VII Organizing Committee in strategic collaboration with ARC Studio (hereinafter referred to as the "Organizer"). 

Because YMCC VII hosts international delegates from ASEAN, China, and Australia, this Policy is established in strict compliance with the Indonesian Personal Data Protection Law (UU No. 27/2022 tentang Perlindungan Data Pribadi), the General Data Protection Regulation (GDPR) of the European Union, and other applicable global data privacy frameworks. By accessing the Platform, creating an account, or participating in YMCC VII activities, you acknowledge and agree to the tracking practices detailed in this Policy.

### 2. UNDERSTANDING COOKIES AND TEMPORARY DATA STORAGE
To ensure the technical stability of our full-stack web applications, we utilize several methods of temporary data storage on your browser or device: 

- **A. Browser Cookies**: Small text files placed on your device by our servers. These are read back by our web application to verify your session status and security tokens. 
- **B. Local Storage and Session Storage (Web Storage APIs)**: Dedicated data storage space within your web browser. Unlike standard cookies, data stored here is not transmitted to the server on every HTTP request but is processed locally by our frontend scripts (Next.js) for instantaneous performance and secure exam state management. 

For the purposes of this Policy, the term "Cookies" shall be used collectively to refer to browser cookies, local storage, session storage, and any equivalent telemetry-capturing scripts.

### 3. SPECIFIC CATEGORIES OF COOKIES DEPLOYED ON THE PLATFORM
We operate under a strict "Privacy by Design" model. We DO NOT deploy any behavioral advertising, third-party remarketing, or cross-site tracking cookies. The cookies we utilize are limited strictly to the following critical operational categories: 

#### A. STRICTLY NECESSARY COOKIES (FUNCTIONAL)
These cookies are mathematically and architecturally required to navigate the Platform, access secure user portals, and prevent system hijacking. Without these cookies, the core services of YMCC VII cannot be delivered. 
- **User Authentication Persistence (__session, firebase:authUser)**: Used by our backend authentication engine (Firebase Auth) to recognize you as a verified logged-in user. This cookie prevents you from being logged out when navigating between /dashboard, /profile, and the exam rooms. 
- **Transactional Cart State (ymcc_cart_session)**: Maintains the selected quantities and sizing parameters of your safety jackets, wearpacks, and vests in the Merch Shop prior to payment routing. 
- **Cross-Site Request Forgery (CSRF) Tokens**: Secures your form submissions against unauthorized malicious script injections from external domains. 

#### B. SYSTEM SECURITY AND PROCTORING TELEMETRY (EXAM ENGINE)
To maintain absolute academic fairness during the online selection phases (specifically the Intellectual Challenge/IC), our custom Exam Engine utilizes localized Web Storage APIs. 
- **Local Storage Exam State (ymcc_exam_progress_cache)**: Temporarily caches your active exam answers, current question index, and remaining exam timer directly on your device. This serves as a vital fail-safe, ensuring your exam data is not lost if your internet connection drops mid-session. 
- **Proctoring Telemetry Logs (Tab Visibility API)**: Captures and stores precise millisecond timestamps of browser focus anomalies (such as switching tabs, minimizing windows, or defocusing the active exam screen). These logs are cached locally before being pushed via secure WebSockets to the operator's verification dashboard. 

#### C. THIRD-PARTY API INTEGRATION COOKIES
To deliver e-commerce, automated logistics, and payment verification, our Platform integrates third-party Application Programming Interfaces (APIs). These external partners deploy specialized cookies to execute their services securely: 
- **Midtrans API (Payment Gateway)**: Deploys encryption and fraud-detection cookies to protect your transactions (Virtual Accounts, QRIS, Credit Cards) during payment processing on their secure, PCI-DSS compliant servers. 
- **Biteship & RajaOngkir API (Logistic Engine)**: Stores transient geolocation and postal code metadata to calculate real-time, dynamic shipping rates from Sleman, Yogyakarta to your specified delivery address.

### 4. USER RIGHTS AND CONSENT MANAGEMENT
You possess the legal right to control, block, or delete cookies on your device at any time: 
- **A. Browser-Level Controls**: You can configure your web browser settings to block all cookies, accept only first-party cookies, or clear all temporary data caches upon closing the application. 
- **B. Implications of Disabling Necessary Cookies**: Because our Exam Engine and E-commerce checkout systems are full-stack, real-time applications, disabling Strictly Necessary or Telemetry cookies will cause severe structural errors. If you block these technologies: 
  - You will be unable to log into the /dashboard portal. 
  - The Exam Engine will block your access to the active exam session due to an inability to establish a secure proctoring environment. 
  - The Merch Shop checkout page will fail to process payments via Midtrans or calculate shipping rates via Biteship. 

By choosing to block esential cookies, you accept full responsibility for any subsequent system failures, exam disqualifications, or transaction errors, and the Organizer shall be held entirely free from liability.

### 5. DATA RETENTION AND ARCHIVING BOUNDARIES
The lifespan of the cookies and tracking tokens deployed on ymccvii.com is governed by clear technical parameters: 
- **Session Cookies**: These are temporary tokens that are automatically deleted from your device's RAM the moment you close your web browser or log out of your YMCC account. 
- **Persistent Storage**: Local storage data (including local exam backups and cart details) remains on your device's hard drive until you manually clear your browser cache, or until the Web System database clears the token following the successful completion of the event. 
- **Proctoring Logs**: All proctoring event logs compiled during active exams are archived securely in our Firebase Cloud Database and will be permanently purged from all active servers upon the final submission of the YMCC VII Accountability Report (LPJ) in 2027.

### 6. EXCLUSION OF LIABILITY AND CHANGES TO THIS POLICY
The YMCC VII Organizing Committee and ARC Studio reserve the right to amend, update, or restructure this Cookie Policy at any time to align with new system features or changes in global data privacy legislation. Any changes will be published immediately on this page with an updated "Last Updated" timestamp. Your continued use of the Platform after such modifications constitutes your formal acceptance of the updated terms. 

**CONTACT FOR PRIVACY AND COOKIE COMPLAINTS**: media@ymccvii.com`;

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[var(--color-grass)] border-b-2 border-black"></div>
        
        <h1 className="font-poppins font-bold text-3xl md:text-5xl uppercase tracking-wide text-[#111] mb-8 border-b-2 border-black pb-6 mt-2">
          COOKIE POLICY YMCC VII
        </h1>
        
        <div className="prose prose-lg prose-headings:font-poppins prose-headings:font-bold prose-headings:uppercase prose-headings:text-[#111] prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:font-poppins prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-li:font-poppins prose-li:text-gray-700 max-w-none text-justify">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

