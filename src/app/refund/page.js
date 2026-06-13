import ReactMarkdown from 'react-markdown';

export default function Page() {
  const content = `
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

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-[#fafafa]">
      <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-3xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[var(--color-grass)] border-b-2 border-black"></div>
        
        <h1 className="font-poppins font-bold text-3xl md:text-5xl uppercase tracking-wide text-[#111] mb-8 border-b-2 border-black pb-6 mt-2">
          REFUND AND CANCELLATION POLICY YMCC VII
        </h1>
        
        <div className="prose prose-lg prose-headings:font-poppins prose-headings:font-bold prose-headings:uppercase prose-headings:text-[#111] prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:font-poppins prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-li:font-poppins prose-li:text-gray-700 max-w-none text-justify">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

