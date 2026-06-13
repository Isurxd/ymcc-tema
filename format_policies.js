const fs = require('fs');
const path = require('path');

const cookiesContent = `
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
- **Xendit API (Payment Gateway)**: Deploys encryption and fraud-detection cookies to protect your transactions (Virtual Accounts, QRIS, Credit Cards) during payment processing on their secure, PCI-DSS compliant servers. 
- **Biteship & RajaOngkir API (Logistic Engine)**: Stores transient geolocation and postal code metadata to calculate real-time, dynamic shipping rates from Sleman, Yogyakarta to your specified delivery address.

### 4. USER RIGHTS AND CONSENT MANAGEMENT
You possess the legal right to control, block, or delete cookies on your device at any time: 
- **A. Browser-Level Controls**: You can configure your web browser settings to block all cookies, accept only first-party cookies, or clear all temporary data caches upon closing the application. 
- **B. Implications of Disabling Necessary Cookies**: Because our Exam Engine and E-commerce checkout systems are full-stack, real-time applications, disabling Strictly Necessary or Telemetry cookies will cause severe structural errors. If you block these technologies: 
  - You will be unable to log into the /dashboard portal. 
  - The Exam Engine will block your access to the active exam session due to an inability to establish a secure proctoring environment. 
  - The Merch Shop checkout page will fail to process payments via Xendit or calculate shipping rates via Biteship. 

By choosing to block essential cookies, you accept full responsibility for any subsequent system failures, exam disqualifications, or transaction errors, and the Organizer shall be held entirely free from liability.

### 5. DATA RETENTION AND ARCHIVING BOUNDARIES
The lifespan of the cookies and tracking tokens deployed on ymccvii.com is governed by clear technical parameters: 
- **Session Cookies**: These are temporary tokens that are automatically deleted from your device's RAM the moment you close your web browser or log out of your YMCC account. 
- **Persistent Storage**: Local storage data (including local exam backups and cart details) remains on your device's hard drive until you manually clear your browser cache, or until the Web System database clears the token following the successful completion of the event. 
- **Proctoring Logs**: All proctoring event logs compiled during active exams are archived securely in our Firebase Cloud Database and will be permanently purged from all active servers upon the final submission of the YMCC VII Accountability Report (LPJ) in 2027.

### 6. EXCLUSION OF LIABILITY AND CHANGES TO THIS POLICY
The YMCC VII Organizing Committee and ARC Studio reserve the right to amend, update, or restructure this Cookie Policy at any time to align with new system features or changes in global data privacy legislation. Any changes will be published immediately on this page with an updated "Last Updated" timestamp. Your continued use of the Platform after such modifications constitutes your formal acceptance of the updated terms. 

**CONTACT FOR PRIVACY AND COOKIE COMPLAINTS**: media@ymccvii.com
`;

const privacyContent = `
## PRIVACY POLICY AND GENERAL CONSENT AGREEMENT

**ORGANIZING COMMITTEE OF YOUTH MINING CAMP COMPETITION (YMCC) VII**  
**DEPARTMENT OF MINING ENGINEERING - UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" YOGYAKARTA**

---

### PREAMBLE & JURIDICAL BOUNDARIES
This Universal Privacy Policy and General Consent Agreement (hereinafter referred to as the "Agreement") constitutes a legally binding contract between the Organizing Committee of YMCC VII (in collaboration with ARC Studio, hereinafter referred to as the "Organizer") and any individual who accesses, registers, purchases, participates, judges, administrates, supervises, or is otherwise captured visually or digitally within the physical and digital boundaries of YMCC VII (hereinafter referred to as the "User"). 

By accessing the domain ymccvii.com (including all subdomains and integrated portals), registering as staff, acting as an advisor, or entering any physical venue of YMCC VII, the User explicitly and unconditionally consents to all terms, data processing workflows, intellectual property assignments, and legal waivers contained herein.

### SECTION 1: DEFINITIONS & APPLICABILITY OF ROLES
This Agreement applies to all Users, classified into the following specific legal roles. A User may hold multiple roles simultaneously, and all applicable clauses shall apply cumulatively:
1. **Registered Account Holders ("Registered Users")**: Any individual who creates credentials to access closed portals of the website.
2. **Competitors & Applicants ("Participants")**: Any individual or team representative registered to compete in any official sub-event of YMCC VII (including, but not limited to, the Intellectual Challenge).
3. **Models & Talents ("Models")**: Any individual commissioned, hired, or volunteering to act as the primary visual subject for official YMCC VII promotional material, catalogs, or teasers.
4. **E-Commerce Buyers ("Buyers")**: Any individual or entity purchasing official merchandise, jackets, vests, or seminar kits via the integrated Merch Shop.
5. **Judges & Evaluators ("Juries")**: Academic and industry experts appointed to evaluate, grade, and score any competition tier.
6. **Committee Members & Organizers ("Committee/Panitia")**: Any student officer, staff member, manager, head of department, or member of the Board of Directors of YMCC VII who executes operational, technical, or administrative duties.
7. **Academic Advisors, Lecturers, & Faculty ("Advisors/Dosen")**: Members of the academic senate, lecturers, advisors, and faculty representatives of Universitas Pembangunan Nasional "Veteran" Yogyakarta who supervise, audit, or approve the event.
8. **Accidental Public & On-Site Attendees ("Public Subjects")**: Any visitor, observer, supporter, photographer, or passerby present within the physical filming locations, event venues, or campus premises of YMCC VII, whose image or voice may be captured.

### SECTION 2: ROLE-SPECIFIC LEGAL CLAUSES & WAIVERS

#### 2.1 FOR REGISTERED USERS: ACCOUNT SECURITY & METADATA LOGS
- **Data Collected**: IP Address, browser User-Agent, cookie identifiers, login timestamps, and account session activities. 
- **Consent & Security Protocol**: Registered Users agree that the Organizer reserves the right to monitor account activities to prevent brute-force attacks, multi-device login fraud, and unauthorized system access. Security logs are retained for audit purposes and will not be shared with external parties unless mandated by law.

#### 2.2 FOR PARTICIPANTS: ACADEMIC PROCTORING, REAL-TIME TELEMETRY, & SCORE PUBLICATION
- **Proctoring Consent**: Participants in online examinations explicitly consent to the active deployment of the Tab Visibility API and screen-monitoring telemetry. The system will automatically log, timestamp, and report every instance of browser tab-switching or window defocusing to the operator dashboard as potential academic fraud. 
- **Proctoring Validation**: Participants acknowledge that while the web platform logs system anomalies, physical proctoring via separate cameras (Zoom/Google Meet) is managed by panitia. The system logs are final and non-negotiable. 
- **Real-time Leaderboard & Media Release**: Participants agree that their names, university affiliations, team scores, and ranking telemetry will be stored, processed, and displayed publicly in real-time on live leaderboards, videotron displays, and official print/digital publications. 
- **SLA for Technical Disqualification**: Participants agree that any automated or manual disqualification resulting from documented security or proctoring violations is final and does not entitle the Participant to a refund of registration fees.

#### 2.3 FOR MODELS & TALENTS: COMMERCIAL EXPLOITATION & ROYALTY WAIVER
- **Absolute Likeness Release**: Models grant the Organizer an exclusive, perpetual, worldwide, and royalty-free right to publish, distribute, and commercially exploit their physical appearance, voice, and poses captured during official sessions. 
- **Waiver of Review & Compensation**: Models waive any right to inspect or approve the final visual outputs (photographs, catalog designs, video teasers) and permanently waive any claim to financial compensation, royalties, or profit-sharing arising from the commercial sale of merchandise featuring their likeness.

#### 2.4 FOR BUYERS: LOGISTICS, BILLING METADATA, & TRANSACTIONAL RETENTION
- **Third-Party API Processing**: Buyers consent to the transmission of necessary transaction metadata (full name, delivery address, phone number, and parcel specifications) to integrated API systems:
  1. **Xendit API**: For PCI-DSS compliant payment processing (VA, QRIS, Credit Card).
  2. **Biteship / RajaOngkir API**: For dynamic shipping calculations and automated waybill generation. 
- **Data Retention**: Transactional data is securely archived in the Organizer's database to facilitate order tracking, customer service, and historical financial reporting. 
- **Platform Fee Consent**: Buyers agree that all transactional processing fees charged by third-party APIs are integrated into the "Platform Fee" paid by the Buyer at checkout.

#### 2.5 FOR JURIES & EVALUATORS: INDEPENDENT DECISION & LOGGING VALIDITY
- **Data Logging**: Juries agree that all grading inputs, comments, and scoring metrics submitted via the Web Scoring Center /admin are logged under their authorized accounts. 
- **Decision Validity**: Juries and Participants agree that once grading metrics are committed to the database, they are structurally unalterable, except by explicit written authorization of the Head of Competition, to preserve competitive integrity.

#### 2.6 FOR COMMITTEE MEMBERS / ORGANIZERS: NDA & AUTOMATIC IP TRANSFER
- **Absolute Non-Disclosure (Data Confidentiality)**: Any Committee member who accesses administrative panels, participant databases, answer sheets, or financial records is strictly bound to confidentiality. Sharing, exporting, or utilizing participant personal data (NIM, emails, phone numbers) outside of official YMCC VII operations is a direct violation of Indonesian Personal Data Protection Law (UU No. 27/2022) and will result in immediate dishonorable discharge and legal prosecution. 
- **Automatic Intellectual Property (IP) Transfer (UU No. 28/2014)**: Under Article 36 of the Indonesian Copyright Law (UU Hak Cipta), any and all works produced by Committee members during their tenure (including, but not limited to, website source code written by Web System, designs created by BPR/CP, video footage captured by CP, and copywriting text compiled by PC) are considered "Works Made for Hire" (Ciptaan dalam Hubungan Dinas). All copyrights and economic exploitation rights of these works are automatically transferred and owned exclusively by YMCC VII and ARC Studio. Committee members cannot revoke, demand take-down, or claim royalty over these assets during or after their tenure.

#### 2.7 FOR ACADEMIC ADVISORS, LECTURERS, & FACULTY: INSTITUTIONAL SHIELD & NO-LIABILITY
- **Limitation of Personal Liability**: Advisors and Lecturers provide academic counsel, guidance, and institutional oversight only. Under no circumstances shall UPN "Veteran" Yogyakarta faculty, advisors, or lecturers be held personally or financially liable for any operational failure, contractual disputes with third-party vendors, or financial deficits incurred by the student organizers of YMCC VII. 
- **Confidential Access and Auditing**: Faculty advisors are granted auditing access to the centralized Digform and financial dashboards. This access is governed by academic privilege and cannot be shared with external academic institutions or commercial entities.

#### 2.8 FOR PUBLIC SUBJECTS: ACCIDENTAL CROWD DOCUMENTATION & NEWSLETTER ARTICLES
- **Crowr Release (On-Site Consent)**: By entering any physical venue or filming location of YMCC VII (including Studio Alam Gamplong, Pendopo FTME, Kaliurang Villa, and campus competition spaces), Public Subjects acknowledge that they are entering an active media documentation zone. 
- **Accidental Publication Waiver**: Public Subjects grant the Organizer the right to utilize, crop, edit, and publish photographs or video recordings containing their background presence (including crowd shots, group photos, and candid documentations) in promotional videos, after-movies, and official articles or newsletters. 
- **No Defamation Claims**: Public Subjects waive the right to assert any claim of invasion of privacy, trespass, or defamation against the Organizer or ARC Studio for the publication of background documentation in any medium. 

### SECTION 3: INTELLECTUAL PROPERTY & DESIGN GOVERNANCE (ARC STUDIO)
1. All proprietary designs, UI/UX layouts, custom icons, sub-branding systems, website source codes, database structures, and digital assets associated with YMCC VII are the exclusive intellectual property of the Organizer under the design governance of ARC Studio.
2. Any unauthorized replication, reverse engineering, scrap-mining, or modification of the website architecture is strictly prohibited and will be prosecuted under the applicable laws of the Republic of Indonesia. 

### SECTION 4: INDEMNIFICATION, LIMITATION OF LIABILITY, & WAIVER OF CLASS ACTION
1. The User agrees to defend, indemnify, and hold harmless the Organizer, UPN "Veteran" Yogyakarta, the Department of Mining Engineering, HMTA, and ARC Studio from any claims, damages, liabilities, or legal expenses (including attorney fees) arising from the User's breach of this Agreement.
2. Under no circumstances shall the Organizer be liable for any indirect, incidental, or consequential damages, including server downtime, transaction processing delays, or minor data syncing latencies between the database and the Google Sheets fallback system. 

### SECTION 5: WAIVER OF ARTICLE 1266 OF THE INDONESIAN CIVIL CODE
Both the Organizer and the User explicitly and intentionally waive the application of Article 1266 of the Indonesian Civil Code (Kitab Undang-Undang Hukum Perdata / KUHPerdata). Consequently, any termination or revocation of consent under this Agreement shall not require a judicial decree or court intervention to be considered valid and effective. This Agreement remains binding from the moment of digital execution/access. 

### SECTION 6: SEVERABILITY CLAUSE
If any provision, clause, or paragraph of this Agreement is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such invalidity or unenforceability shall not affect the validity, legality, and enforceability of the remaining provisions of this Agreement, which shall remain in full force and effect. 

### SECTION 7: GOVERNING LAW AND JURISDICTION
This Agreement is governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes arising from or in connection with this Agreement that cannot be resolved through amicable mediation within 14 (fourteen) calendar days shall be submitted to the exclusive jurisdiction of the Sleman District Court (Pengadilan Negeri Sleman), Daerah Istimewa Yogyakarta. 

**End of Legal Document.**  
**Organizing Committee of YMCC VII - Media Department.**
`;

const tosContent = `
## TERMS OF SERVICE (ToS)

**ORGANIZING COMMITTEE OF YOUTH MINING CAMP COMPETITION (YMCC) VII**  
**DEPARTMENT OF MINING ENGINEERING - UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" YOGYAKARTA**

---

### LEGAL NOTICE AND AGREEMENT
Welcome to the official digital platform of the Youth Mining Camp Competition (YMCC) VII (accessible via ymccvii.com, its subdomains, and integrated web systems, hereinafter referred to as the "Platform"). These Terms of Service (hereinafter referred to as "ToS" or "Agreement") constitute a legally binding, high-level contract between the Organizing Committee of YMCC VII (in strategic partnership with ARC Studio, hereinafter referred to as the "Organizer") and any individual or entity accessing, registering, purchasing, participating, evaluating, or administering within the digital and physical domains of YMCC VII (hereinafter referred to as the "User"). 

**BY CREATING AN ACCOUNT, SUBMITTING REGISTRATION DATA, PURCHASING MERCHANDISE, PARTICIPATING IN COMPETITIONS, EVALUATING AS A JURY, OR ACCESSING ANY PORTION OF THE PLATFORM, YOU UNCONDITIONALLY AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE ALL USE OF THE PLATFORM.**

### SECTION 1: DEFINITIONS AND ROLES OF USERS
To ensure absolute clarity in liability boundaries, Users are classified into the following roles. A User may hold multiple roles simultaneously, and all applicable clauses shall apply cumulatively:
1. **Registered Account Holders ("Registered Users")**: Individuals who establish login credentials on the Platform to access closed portals or transactional interfaces.
2. **Competitors & Applicants ("Participants")**: Individuals, team representatives, or team members registered to compete in any official sub-event of YMCC VII (including, but not limited to, the Intellectual Challenge, Mining Games, MSIC, and Paper Competition).
3. **Models & Talents ("Models")**: Individuals acting as the visual subject for official YMCC VII promotional campaigns, merchandise catalogs, or cinematic teasers.
4. **E-Commerce Buyers ("Buyers")**: Individuals or entities purchasing official merchandise, jackets, vests, or seminar kits via the integrated Merch Shop.
5. **Judges & Evaluators ("Juries")**: Academic or industry experts appointed to evaluate, score, and grade any competition tier of YMCC VII.
6. **Committee Members & Officers ("Committee/Panitia")**: Student officers, managers, heads of department, and directors executing operational, technical, or administrative duties for YMCC VII.
7. **Academic Advisors, Lecturers, & Faculty ("Advisors/Dosen")**: Members of the academic senate, lecturers, and faculty representatives of Universitas Pembangunan Nasional "Veteran" Yogyakarta supervising the event.
8. **Accidental Public & On-Site Attendees ("Public Subjects")**: Visitors, supporters, observers, or passersby present within the physical filming locations, event venues, or campus premises of YMCC VII. 

### SECTION 2: THE EXAM ENGINE & ACADEMIC INTEGRITY (FOR PARTICIPANTS)
To preserve strict competitive integrity, the online selection system (specifically for the Intellectual Challenge/IC) operates under the following technical mandates:
1. **Active Telemetry & Proctoring Consent**: During any active examination session in the "Exam Center," the Platform deploys the Tab Visibility API and screen-monitoring telemetry. The system automatically logs, timestamps, and records every instance of browser tab-switching, minimized windows, or browser defocusing as a technical anomaly.
2. **Conclusive Evidence of Fraud**: The system-generated activity logs and millisecond timestamps are considered prima facie (final, binding, and absolute) evidence of a Participant's browser activity.
3. **Disqualification and Forfeiture**: The Organizer reserves the absolute right to automatically disqualify any Participant or team whose activity logs indicate repeated proctoring violations. Disqualification on grounds of academic fraud is final, non-negotiable, and will result in the immediate forfeiture of all registration fees.
4. **Dual-Layer Verification**: While the Platform logs system anomalies, physical verification (via live camera feeds on Zoom/Google Meet) is managed manually by the proctoring committee. The technical logs shall serve as the primary source of truth. 

### SECTION 3: E-COMMERCE & SIZING LIABILITY (FOR BUYERS)
All merchandise sales, including the Pre-Order (PO) of YMCC VII Safety Jackets/Wearpacks and Vests, are governed by the following transactional rules:
1. **Sizing Chart Responsibility**: Sizing charts and measurements are provided explicitly on the Platform. The Buyer bears 100% of the responsibility to select the correct size. The Organizer will not accommodate any requests for returns, exchanges, or refunds due to sizing errors made by the Buyer.
2. **Payment Validation & Inventory Lock**: Upon checkout, the system reserves the requested stock for a maximum of 24 hours. If full payment is not verified within this window, the transaction is automatically cancelled, the stock is released, and any partial deposit is forfeited.
3. **Platform and Gateway Fees**: All transactions are processed via secure third-party APIs (Xendit for payment gateways and Biteship/RajaOngkir for shipping calculations). Users agree that any transactional processing fees or dynamic courier costs are automatically calculated and added to the "Platform Fee" paid by the Buyer at checkout. 

### SECTION 4: AUTOMATIC INTELLECTUAL PROPERTY TRANSFER (FOR COMMITTEE/PANITIA)
To secure the digital and brand equity of YMCC VII against internal disputes, the following copyright clauses apply to all Committee members:
1. **Works Made for Hire (Ciptaan dalam Hubungan Dinas)**: Pursuant to Article 36 of the Indonesian Copyright Law (Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta), any and all creative, technical, or administrative works produced by a Committee member during their tenure—including website source code (Next.js/Firebase), graphic designs, video footage, motion logos, copywriting, and administrative databases—are legally defined as "Works Made for Hire."
2. **Absolute IP Transfer**: All economic rights, copyrights, and exploitation rights of the aforementioned works are automatically, unconditionally, and irrevocably transferred to the Organizer and ARC Studio.
3. **No Revocation Rights**: Committee members, including those who resign, are discharged, or complete their tenure, permanently waive their rights to demand the removal (take-down), modification, or deletion of their produced assets, and are not entitled to any royalties or financial compensation for their commercial exploitation. 

### SECTION 5: INSTITUTIONAL SHIELD & NO-LIABILITY (FOR ADVISORS & UNIVERSITY)
1. **Academic Supervision Only**: Academic Advisors, Lecturers, and the Faculty of Universitas Pembangunan Nasional "Veteran" Yogyakarta provide academic and institutional oversight only.
2. **Complete Indemnification**: Under no circumstances shall the University, the Department of Mining Engineering, or any faculty advisor/lecturer be held personally, civilly, or financially liable for any operational failures, contractual breaches with third-party vendors, safety incidents during field events (GMPC/Mining Camp), or financial deficits incurred by the student organizers of YMCC VII. 

### SECTION 6: FINALITY OF EVALUATIONS (FOR JURIES & PARTICIPANTS)
1. **Scoring Committal**: Once an appointed Jury member commits scoring metrics and evaluation data into the Web Scoring Center (/admin), the data is structurally locked in the Cloud Database.
2. **Waiver of Challenge**: All Juries and Participants agree that the scoring metrics, evaluation sheets, and final rankings generated by the Web Scoring Center are final, absolute, and legally unchallengeable in any student senate, university forum, or court of law. 

### SECTION 7: GENERAL PUBLIC CROWD RELEASE (FOR PUBLIC SUBJECTS)
1. **Active Media Zone**: By entering any physical venue, filming location, or campus space where YMCC VII events or promotional shootouts (including Studio Alam Gamplong, Pendopo FTME, Kaliurang Villa, and campus spaces) are actively taking place, Public Subjects acknowledge they are entering an active media documentation zone.
2. **Consent to Background Publication**: Public Subjects grant the Organizer the right to edit, crop, and publish photographs, videos, or audio recordings containing their background presence for after-movies, promotional reels, and newsletter articles without any compensation or notification. 

### SECTION 8: LEGAL ENGINEERING SHIELDS (UNIVERSAL CLAUSES)
1. **EXCLUSION OF ARTICLE 1266 OF THE INDONESIAN CIVIL CODE**: Both the Organizer and the User explicitly and intentionally waive the application of Article 1266 of the Indonesian Civil Code (Kitab Undang-Undang Hukum Perdata / KUHPerdata). Consequently, any unilateral termination, suspension of account, or revocation of access executed by the Organizer under this Agreement shall be immediately effective without requiring a judicial decree or court intervention.
2. **SEVERABILITY**: If any provision, clause, or paragraph of this Agreement is declared invalid, illegal, or unenforceable by a court of competent jurisdiction (such as PN Sleman), such invalidity or unenforceability shall not affect the validity, legality, and enforceability of the remaining provisions, which shall remain in full force and effect.
3. **AS-IS AND AS-AVAILABLE PLATFORM WARRANTY**: The digital platform, database systems, and payment integrations are provided "as-is" and "as-available." The Organizer and ARC Studio make no warranties regarding 100% server uptime, zero-latency database syncs, or the absolute prevention of minor API syncing delays.
4. **LIMITATION OF LIABILITY**: To the maximum extent permitted by law, the Organizer, its directors, and ARC Studio shall not be liable for any indirect, incidental, or consequential damages (including transaction failures, courier delivery delays, or temporary system downtime).
5. **GOVERNING LAW AND JURISDICTION**: This Agreement shall be governed by, construed, and enforced in accordance with the laws of the Republic of Indonesia. Any disputes arising from or in connection with these terms that cannot be resolved through amicable mediation within 14 calendar days shall be submitted to the exclusive jurisdiction of the Sleman District Court (Pengadilan Negeri Sleman), Daerah Istimewa Yogyakarta. 

**End of Legal Document.**  
**Organizing Committee of YMCC VII - Media Department.**
`;

const refundContent = `
## REFUND & CANCELLATION POLICY

**ORGANIZING COMMITTEE OF YOUTH MINING CAMP COMPETITION (YMCC) VII**  
**DEPARTMENT OF MINING ENGINEERING - UNIVERSITAS PEMBANGUNAN NASIONAL "VETERAN" YOGYAKARTA**

**DOCUMENT CLASSIFICATION: TRANSACTIONAL SAFETY REGULATIONS (GLOBAL STANDARD)**  
**LAST UPDATED: MAY 26, 2026**

---

### 1. BINDING LEGAL AND TRANSACTIONAL STANDARD
This Refund and Cancellation Policy (hereinafter referred to as the "Policy") establishes the absolute and legally binding terms governing all monetary transactions, invoice settlements, registrations, structural deposits, and merchandise purchases executed through the domain ymccvii.com, its subdomains, or integrated transactional APIs. By initiating any payment, confirming a checkout session, or transferring funds to the YMCC VII Organizing Committee (in strategic partnership with ARC Studio, hereinafter collectively referred to as the "Organizer"), the individual or entity making the payment (hereinafter referred to as the "User", "Buyer", or "Participant") unconditionally and irrevocably accepts all terms, conditions, and waivers specified in this Policy.

### 2. COMPREHENSIVE AND ABSOLUTE NO-REFUND POLICY
All payments, fees, and transactions processed through the Platform are strictly and absolutely non-refundable, non-transferable, and non-exchangeable under any circumstances. 
- **A. Centralized Allocation of Funds**: The User acknowledges that the Organizer operates under a centralized, real-time financial commitment system. Upon successful validation of any transaction, the funds are instantaneously allocated to third-party vendor production contracts (including American Drill fabric procurement and custom embroidery), cloud database maintenance (Next.js/Firebase), and administrative verification logistics. Consequently, retroactively extracting or reversing processed funds is financially and structurally impossible. 
- **B. Inapplicability of Refunds**: The strict No-Refund Policy shall apply to all transaction types, including but not limited to: 
  - Voluntary withdrawal or self-initiated disqualification of a registered participant, team representative, or entire team from any sub-event or competition tier. 
  - Automatic technical disqualification of a Participant or team resulting from documented proctoring anomalies or academic fraud detected by the Exam Engine (including Tab Visibility API logs). 
  - Administrative rejection of pendaftaran due to the submission of fraudulent, unverified, or expired credentials (such as falsified KTM or transcripts). 
  - Mistakes made by the Buyer during the Pre-Order (PO) checkout process, including incorrect size selections, incorrect product variants, or double payments caused by browser refresh latencies. 
  - Changes, modifications, or format transformations of physical event categories into online/hybrid structures necessitated by Force Majeure or administrative university directives.

### 3. PRE-ORDER CANCELLATION, INVENTORY BOUNDARIES, AND TIMEOUTS
To protect the cash-flow integrity of the YMCC VII Merch Shop, the system enforces automated operational timelines: 
- **A. Automated Payment Window (24-Hour Timeout)**: Upon confirming a checkout session, the Platform secures and reserves the requested stock (such as Safety Jackets/Wearpacks and Vests) in the database for a maximum duration of twenty-four (24) hours. If full payment validation is not received and confirmed by the payment gateway (Xendit webhook) within this strict window: 
  - The transaction is automatically declared cancelled by the system. 
  - The reserved inventory is immediately returned to the public stock database (+1). 
  - The transaction cannot be reinstated, and the Buyer must initiate a new checkout session under active stock conditions. 
- **B. Liquidated Damages and Deposit Forfeiture**: In the event that the Organizer permits a split-payment or deposit scheme (DP) for custom bulk-orders, any failure by the Buyer to complete the full pending balance within the specified production timeline will result in: 
  - Immediate and unilateral cancellation of the entire order. 
  - The absolute forfeiture of all initial deposit payments to the Organizer as liquidated damages, with no right to partial restitution or material compensation.

### 4. SIZING LIABILITY, FITMENT DISCLAIMER, AND REPLACEMENT PROTOCOLS
The production of high-performance field safety gear requires strict conformity to sizing specifications: 
- **A. Size Selection Responsibility**: The official sizing chart for official YMCC VII Wearpacks and Vests is displayed clearly on the checkout interface. The Buyer bears 100% of the responsibility to ensure their physical measurements match the chart before payment. The Organizer provides no warranty regarding the individual subjective fitment of the clothing and will not accept returns or exchanges for incorrect sizes ordered by the Buyer. 
- **B. Protocol for Manufacturing Defects**: Exchanges are permitted strictly and exclusively in the event of a verified Manufacturing Defect. A Manufacturing Defect is defined as a major structural failure present prior to shipping (such as a broken metal zipper mechanism or major fabric tears). To qualify for a replacement, the Buyer must strictly comply with the following evidentiary protocol:
  1. **Unbroken Unboxing Video (Mandatory)**: The Buyer must record a continuous, unedited, high-definition video of the package being opened for the first time. The video must clearly show the shipping label, the unopened plastic packaging, and the immediate extraction and close-up inspection of the defect without any cuts, transitions, or edits.
  2. **24-Hour Reporting Window**: The unboxing video and formal replacement request must be submitted via email to billing@ymccvii.id or the designated Secretariat contact within twenty-four (24) hours of the courier delivery timestamp. Any claims submitted after this window will be rejected with no exception.
  3. **Pristine State Requirement**: The defective item must remain completely unused, unwashed, and in its original packaging with all tags attached. If the item shows signs of wear, field usage, washing, or manual alteration, the exchange request is immediately nullified.

### 5. CHARGEBACK PREVENTION AND WAIVER OF CLASS ACTION
- **A. Explicit Waiver of Dispute Rights**: The User agrees that by completing a transaction, they waive any right to file a dispute, chargeback, or transaction reversal with their issuing bank, credit card company, e-wallet operator, or payment gateway processor (Xendit). 
- **B. Liquidated Costs for Unauthorized Disputes**: In the event that the User violates this clause and initiates an unauthorized chargeback dispute, the User agrees to pay the Organizer all associated dispute resolution fees, administrative costs, and legal representation expenses incurred to defend the transaction, with a minimum liquidated fee of IDR 1,500,000 per disputed invoice.

### 6. EXCLUSION OF ARTICLE 1266 OF THE INDONESIAN CIVIL CODE
To prevent the unilateral revocation of this transactional contract, the Parties explicitly, intentionally, and legally waive the application of Article 1266 of the Indonesian Civil Code (Kitab Undang-Undang Hukum Perdata / KUHPerdata). Consequently, the termination of any pending transaction, forfeiture of deposit, or cancellation of registration executed by the Organizer under this Policy is fully valid, immediate, and effective without requiring a judicial decree or court intervention to be executed.

### 7. GOVERNING LAW AND RESOLUTION OF FINANCIAL DISPUTES
This Policy shall be governed by, construed, and enforced in accordance with the laws of the Republic of Indonesia. Any disputes arising from or in connection with these financial terms that cannot be resolved through amicable mediation within fourteen (14) calendar days shall be submitted to the exclusive jurisdiction of the Sleman District Court (Pengadilan Negeri Sleman), Daerah Istimewa Yogyakarta. 

**End of Legal Document.**  
**Organizing Committee of YMCC VII - Media Department.**
`;

function replaceContent(filePath, newContent) {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  fileContent = fileContent.replace(/const content = \`[\\s\\S]*?\`;/, \`const content = \\\`\n\${newContent}\\\`;\`);
  fs.writeFileSync(filePath, fileContent);
  console.log(\`Updated \${filePath}\`);
}

replaceContent(path.join(__dirname, 'src/app/cookies/page.js'), cookiesContent);
replaceContent(path.join(__dirname, 'src/app/privacy/page.js'), privacyContent);
replaceContent(path.join(__dirname, 'src/app/tos/page.js'), tosContent);
replaceContent(path.join(__dirname, 'src/app/refund/page.js'), refundContent);

console.log("All policies updated successfully.");
