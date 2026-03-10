const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESS_ID = "DISP_003";

const delay = (ms) => new Promise(r => setTimeout(r, ms));
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 4));

const updateProcessLog = (id, entry) => {
    const pf = path.join(PUBLIC_DATA_DIR, `process_${id}.json`);
    let d = {logs: [], keyDetails: {}};
    if (fs.existsSync(pf)) d = JSON.parse(fs.readFileSync(pf, 'utf8'));
    if (entry) {
        const idx = entry.id ? d.logs.findIndex(l => l.id === entry.id) : -1;
        if (idx !== -1) d.logs[idx] = {...d.logs[idx], ...entry};
        else d.logs.push(entry);
    }
    writeJson(pf, d);
};

const updateStatus = async (id, status, currentStatus) => {
    try {
        await fetch(`${process.env.VITE_API_URL || 'http://localhost:3001'}/api/update-status`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, status, currentStatus})
        });
    } catch(e) {}
};

const waitSignal = async (sid) => {
    const sf = path.join(__dirname, '../interaction-signals.json');
    while (true) {
        try {
            if (fs.existsSync(sf)) {
                const c = fs.readFileSync(sf, 'utf8');
                if (c) {
                    const s = JSON.parse(c);
                    if (s[sid]) {
                        delete s[sid];
                        writeJson(sf, s);
                        return true;
                    }
                }
            }
        } catch(e) {}
        await delay(1000);
    }
};

(async () => {
    writeJson(path.join(PUBLIC_DATA_DIR, `process_${PROCESS_ID}.json`), {logs: [], keyDetails: {}});
    const now = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    // Step 1: Case Intake
    updateProcessLog(PROCESS_ID, {id: "s1", time: now(), title: "Scanning dispute queue...", status: "processing"});
    await updateStatus(PROCESS_ID, "In Progress", "Scanning dispute queue...");
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s1",
        title: "Case Intake Complete",
        status: "success",
        reasoning: [
            "Case #00078458 identified - Capital Grille dispute",
            "Priority: URGENT - high-value catering order",
            "Dispute type: Missing Items + Quality (compound complaint)",
            "Amount: $187.50 - exceeds $100 escalation trigger",
            "Corporate client: Whitfield & Associates",
            "SLA: 38 minutes remaining - tightest timeline"
        ],
        artifacts: [{
            id: "s1-a1",
            type: "table",
            label: "Case Overview",
            data: [
                {"Field": "Case Number", "Value": "00078458"},
                {"Field": "Merchant", "Value": "Capital Grille"},
                {"Field": "Type", "Value": "Missing Items / Quality"},
                {"Field": "Amount", "Value": "$187.50"},
                {"Field": "Priority", "Value": "Urgent"},
                {"Field": "Order ID", "Value": "UE-ORD-9958734"},
                {"Field": "Customer", "Value": "Whitfield & Associates (Corporate)"}
            ]
        }, { id: "s1-vid", type: "video", label: "Salesforce — Dispute Queue", videoPath: "/data/recordings/sf_dispute_queue.webm" }]
    });
    await updateStatus(PROCESS_ID, "In Progress", "Case intake complete");
    await delay(2000);

    // Step 2a: Merchant Profile
    updateProcessLog(PROCESS_ID, {id: "s2a", time: now(), title: "Reviewing merchant profile...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s2a",
        title: "Merchant Profile Assessed",
        status: "success",
        reasoning: [
            "Capital Grille is Platinum tier - highest tier partner",
            "Order accuracy: 98.8% - exceptionally high, well above 95% threshold",
            "Annual platform revenue: ~$960,000 (high-value merchant)",
            "Only 2 prior disputes in 90 days, both resolved in merchant's favor",
            "Excellent track record and outstanding standing"
        ],
        artifacts: [{
            id: "s2a-a1",
            type: "table",
            label: "Merchant Profile — Capital Grille",
            data: [
                {"Field": "Merchant Name", "Value": "Capital Grille", "Policy Implication": "—"},
                {"Field": "Partner Tier", "Value": "Platinum", "Policy Implication": "Highest tier — premium partner"},
                {"Field": "Order Accuracy Rate", "Value": "98.8%", "Policy Implication": "Well above 95% threshold — highly credible"},
                {"Field": "Annual Platform Revenue", "Value": "~$960,000", "Policy Implication": "High-value merchant account"},
                {"Field": "Prior Disputes (90 days)", "Value": "2", "Policy Implication": "Both resolved in merchant's favor"},
                {"Field": "Account Status", "Value": "Active — Excellent Standing", "Policy Implication": "No flags or concerns"}
            ]
        }, { id: "s2a-vid", type: "video", label: "Salesforce — Merchant Profile", videoPath: "/data/recordings/sf_merchant_profile.webm" }]
    });
    await delay(1500);

    // Step 2b: Order Details
    updateProcessLog(PROCESS_ID, {id: "s2b", time: now(), title: "Analyzing order details...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s2b",
        title: "Order Analysis Complete",
        status: "success",
        reasoning: [
            "Catering order for 15-person client meeting - high-stakes context",
            "Order totaled $187.50 with 5 platters",
            "Customer reports: 2 platters completely missing ($79.50 value)",
            "3 delivered platters arrived cold with poor presentation",
            "Compound complaint: missing items + quality issues",
            "Business meeting context adds reputational impact beyond dollar amount"
        ],
        artifacts: [{
            id: "s2b-a1",
            type: "table",
            label: "Order Details — UE-ORD-9958734 (Catering, 15 persons)",
            data: [
                {"Item": "Prime Filet Sliders", "Price": "$45.00", "Status": "Delivered — cold, poor presentation"},
                {"Item": "Grilled Shrimp Display", "Price": "$38.50", "Status": "MISSING"},
                {"Item": "Caesar Salad Station", "Price": "$28.00", "Status": "Delivered — cold, poor presentation"},
                {"Item": "Artisan Cheese Board", "Price": "$35.00", "Status": "Delivered — acceptable"},
                {"Item": "Dessert Trio", "Price": "$41.00", "Status": "MISSING"},
                {"Item": "Total", "Price": "$187.50", "Status": "2 missing ($79.50), 2 quality issues"}
            ]
        }, { id: "s2b-vid", type: "video", label: "Salesforce — Order Details", videoPath: "/data/recordings/sf_order_details.webm" }]
    });
    await delay(1500);

    // Step 2c: Delivery Info
    updateProcessLog(PROCESS_ID, {id: "s2c", time: now(), title: "Checking delivery data...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s2c",
        title: "Delivery Verification Complete",
        status: "success",
        reasoning: [
            "🚩 Delivery 33 minutes late - exceeds 20-minute SOP threshold for platform liability",
            "🚩 Driver made unscheduled 8-minute stop during transit - unexplained",
            "🚩 Proof of delivery shows only 3 bags delivered, order had 5 platters",
            "33-minute delay likely caused food temperature issues (cold food)",
            "Multiple delivery failures introduce platform/driver liability"
        ],
        artifacts: [{
            id: "s2c-a1",
            type: "table",
            label: "Delivery Details — UE-ORD-9958734",
            data: [
                {"Field": "ETA vs. Actual", "Value": "33 min LATE", "Assessment": "🚩 Exceeds 20-min threshold — platform liability trigger"},
                {"Field": "Route", "Value": "Deviation detected", "Assessment": "🚩 Unscheduled 8-min stop during transit"},
                {"Field": "Proof of Delivery", "Value": "Photo: 3 bags at door", "Assessment": "🚩 Order had 5 platters — only 3 delivered"},
                {"Field": "Driver Notes", "Value": "None provided", "Assessment": "No explanation for delay or stop"},
                {"Field": "Temperature Impact", "Value": "33 min delay", "Assessment": "Likely caused food quality issues"}
            ]
        }, { id: "s2c-vid", type: "video", label: "Salesforce — Delivery Tracking", videoPath: "/data/recordings/sf_delivery_tracking.webm" }]
    });
    await delay(1500);

    // Step 2d: Customer Risk
    updateProcessLog(PROCESS_ID, {id: "s2d", time: now(), title: "Assessing customer risk profile...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s2d",
        title: "Customer Risk Assessment Complete",
        status: "success",
        reasoning: [
            "Whitfield & Associates: corporate account with 47 lifetime orders",
            "Refund rate: 8.5% - below 10% fraud threshold but elevated",
            "4 refunds with mixed reasons: 2 late, 1 quality, 1 missing (no pattern)",
            "Near high-value threshold (50+ orders) but hasn't crossed it",
            "Total refunded in 90 days: $312.00 (higher per-order value typical for catering)",
            "Gray zone: not flagged for fraud, but not pristine either"
        ],
        artifacts: [{
            id: "s2d-a1",
            type: "table",
            label: "Customer Risk Assessment — Whitfield & Associates",
            data: [
                {"Metric": "Account Type", "Value": "Corporate", "Threshold": "—", "Flag": "Business account"},
                {"Metric": "Lifetime Orders", "Value": "47", "Threshold": "50+ = High-Value", "Flag": "Near threshold"},
                {"Metric": "Total Refunds", "Value": "4", "Threshold": "—", "Flag": "—"},
                {"Metric": "Refund Rate", "Value": "8.5%", "Threshold": ">10% = Fraud", "Flag": "⚠️ Below threshold but elevated"},
                {"Metric": "Refund Breakdown", "Value": "2 late, 1 quality, 1 missing", "Threshold": "3+ same type = Pattern", "Flag": "✅ No pattern — mixed"},
                {"Metric": "Refunds Last 90 Days", "Value": "4 ($312.00)", "Threshold": "3+ = Pattern", "Flag": "⚠️ Count hits threshold but mixed types"}
            ]
        }, { id: "s2d-vid", type: "video", label: "Salesforce — Customer History", videoPath: "/data/recordings/sf_customer_history.webm" }]
    });
    await delay(1500);

    // Step 2e: Merchant Statement
    updateProcessLog(PROCESS_ID, {id: "s2e", time: now(), title: "Reading merchant statement...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s2e",
        title: "Merchant Statement Reviewed",
        status: "success",
        reasoning: [
            "Merchant provides detailed, timestamped statement",
            "Claims: 'All 5 platters prepared and ready at 9:45 AM'",
            "Physical evidence: Kitchen prep photos showing all 5 platters",
            "Identifies failure point: 'Driver arrived 10:05, only loaded 3 containers'",
            "Account: '2 platters remained on our pickup shelf'",
            "VERY HIGH credibility: specific + timestamped + photos + 98.8% accuracy + consistent with 3-bag delivery photo"
        ],
        artifacts: [{
            id: "s2e-a1",
            type: "table",
            label: "Merchant Statement — Capital Grille",
            data: [
                {"Element": "Preparation Claim", "Detail": "All 5 platters ready at 9:45 AM", "Credibility Assessment": "Specific timestamp — verifiable"},
                {"Element": "Evidence Provided", "Detail": "Kitchen prep photos of all 5 platters", "Credibility Assessment": "Physical evidence — high weight"},
                {"Element": "Driver Pickup", "Detail": "Driver arrived 10:05, loaded only 3", "Credibility Assessment": "Explains 3-bag delivery photo"},
                {"Element": "Missing Items Location", "Detail": "2 platters remained on pickup shelf", "Credibility Assessment": "Accounts for missing items"},
                {"Element": "Overall Credibility", "Detail": "VERY HIGH", "Credibility Assessment": "Specific + photo + 98.8% accuracy"}
            ]
        }, { id: "s2e-vid", type: "video", label: "Salesforce — Merchant Statement", videoPath: "/data/recordings/sf_merchant_statement.webm" }]
    });
    await delay(1500);

    // Step 3: Stripe Verification
    updateProcessLog(PROCESS_ID, {id: "s3", time: now(), title: "Verifying payment in Stripe...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s3",
        title: "Payment Verification Complete",
        status: "success",
        reasoning: [
            "Payment intent verified: $187.50 charged to Amex Corporate ••••1002",
            "Corporate Amex confirms business account - expense needs internal accounting",
            "Customer refund rate confirmed at 8.5% (4 of 47 orders)",
            "Refund breakdown confirmed: 2 late, 1 quality, 1 missing (mixed types)",
            "Cross-system consistency - no discrepancies between Salesforce and Stripe"
        ],
        artifacts: [{
            id: "s3-a1",
            type: "table",
            label: "Payment & Refund Verification — Stripe",
            data: [
                {"Field": "Payment Intent", "Value": "pi_3OxBpR6hWvNYnq4E"},
                {"Field": "Amount", "Value": "$187.50"},
                {"Field": "Status", "Value": "Succeeded"},
                {"Field": "Payment Method", "Value": "Amex Corporate •••• 1002"},
                {"Field": "Customer Refund Rate", "Value": "8.5% (4/47 orders)"},
                {"Field": "Refund Breakdown", "Value": "2 late, 1 quality, 1 missing"},
                {"Field": "90-Day Refund Total", "Value": "$312.00 (4 transactions)"},
                {"Field": "Merchant Weekly Payout", "Value": "~$18,500"}
            ]
        }, { id: "s3-vid", type: "video", label: "Stripe — Payment Verification", videoPath: "/data/recordings/stripe_payment.webm" }]
    });
    await delay(1500);

    // Step 4: Evidence Synthesis
    updateProcessLog(PROCESS_ID, {id: "s4", time: now(), title: "Synthesizing evidence...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s4",
        title: "Evidence Assessment Complete",
        status: "success",
        reasoning: [
            "Merchant credibility: VERY HIGH (98.8% accuracy, Platinum tier, photo evidence)",
            "Customer credibility: MODERATE (8.5% refund rate - elevated but below threshold)",
            "Delivery failures: SIGNIFICANT (33 min late, unscheduled stop, 3 of 5 bags)",
            "Rule #3 partially applies (delivery >20 min late) BUT case has multiple complicating factors",
            "Conflicts: Platinum merchant photos show driver fault vs elevated customer refunds vs >$100 amount vs corporate account",
            "Rule #4 applies: Mixed/unclear evidence + amount >$100 with conflicting signals",
            "Recommendation: ESCALATE TO TIER 2 - no single rule resolves cleanly"
        ],
        artifacts: [{
            id: "s4-a1",
            type: "table",
            label: "Evidence Summary & Conflicts",
            data: [
                {"Category": "Merchant Credibility", "Assessment": "VERY HIGH", "Reasoning": "98.8% accuracy + photo evidence + Platinum tier"},
                {"Category": "Customer Credibility", "Assessment": "MODERATE", "Reasoning": "8.5% refund rate - elevated but below 10% threshold"},
                {"Category": "Delivery Failures", "Assessment": "SIGNIFICANT", "Reasoning": "33 min late + unscheduled stop + 3 of 5 bags"},
                {"Category": "Amount Trigger", "Assessment": "EXCEEDED", "Reasoning": "$187.50 > $100 escalation threshold"},
                {"Category": "Policy Conflicts", "Assessment": "MULTIPLE", "Reasoning": "Rule #3 partial match + high-value merchant + corporate customer"},
                {"Category": "Recommended Action", "Assessment": "ESCALATE", "Reasoning": "Rule #4: Mixed evidence + >$100 + competing interests"}
            ]
        }, {
            id: "s4-a2",
            type: "file",
            label: "Investigation Report",
            pdfPath: "/data/DISP_003_investigation_report.pdf"
        }]
    });
    await delay(1500);

    // Step 5: HITL Checkpoint
    updateProcessLog(PROCESS_ID, {id: "s5", time: now(), title: "Resolution recommendation ready...", status: "processing"});
    await delay(1500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s5",
        title: "Awaiting Human Decision",
        status: "warning",
        reasoning: [
            "Pace recommends ESCALATING to Tier 2 Review",
            "Evidence conflicts: Platinum merchant (98.8% accuracy) has kitchen photos proving all 5 platters prepared - driver loaded only 3",
            "Delivery was 33 min late (>20 min threshold) with unscheduled 8-min stop",
            "Customer (corporate) has 8.5% refund rate - elevated but below 10% threshold",
            "Amount $187.50 exceeds $100 escalation trigger",
            "Multiple policy rules partially apply but none resolve cleanly - senior analyst judgment needed"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Escalation",
            data: {
                question: "Escalate Case 00078458 (Capital Grille, $187.50) to Tier 2? Evidence conflicts: Platinum merchant (98.8%) has kitchen photos proving driver loaded only 3 of 5 containers. Delivery 33 min late with unscheduled stop. Corporate customer has 8.5% refund rate (elevated but below threshold). Amount >$100. No single policy rule resolves competing interests cleanly.",
                options: [
                    {"label": "Approve — Escalate to Tier 2 review", "value": "approve_escalate", "signal": "APPROVE_ESCALATE_003"},
                    {"label": "Reject — Resolve at current tier", "value": "reject", "signal": "REJECT_003"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "Needs Attention", "Awaiting escalation decision");
    await waitSignal("APPROVE_ESCALATE_003");

    updateProcessLog(PROCESS_ID, {
        id: "s5",
        title: "Escalation Approved",
        status: "success",
        reasoning: [
            "Human reviewer confirmed: Escalate to Tier 2",
            "Packaging complete evidence for senior analyst",
            "Case complexity requires higher-tier judgment"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Escalation",
            data: {
                question: "Escalate Case 00078458 (Capital Grille, $187.50) to Tier 2? Evidence conflicts: Platinum merchant (98.8%) has kitchen photos proving driver loaded only 3 of 5 containers. Delivery 33 min late with unscheduled stop. Corporate customer has 8.5% refund rate (elevated but below threshold). Amount >$100. No single policy rule resolves competing interests cleanly.",
                options: [
                    {"label": "Approve — Escalate to Tier 2 review", "value": "approve_escalate", "signal": "APPROVE_ESCALATE_003"},
                    {"label": "Reject — Resolve at current tier", "value": "reject", "signal": "REJECT_003"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "In Progress", "Processing escalation");
    await delay(2000);

    // Step 6: Process Escalation
    updateProcessLog(PROCESS_ID, {id: "s6", time: now(), title: "Packaging escalation...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s6",
        title: "Escalation Executed",
        status: "success",
        reasoning: [
            "Case routed to Tier 2 review queue with 'Urgent — Escalated' priority",
            "Complete evidence package attached: merchant photos, delivery data, Stripe verification",
            "Specific questions flagged for Tier 2: (1) Platform absorb full or partial cost? (2) Driver investigation for incomplete pickup? (3) Corporate account relationship outreach? (4) Platinum merchant communication?",
            "Full reasoning chain included - Tier 2 analyst has complete context"
        ],
        artifacts: [{
            id: "s6-a1",
            type: "table",
            label: "Escalation Summary",
            data: [
                {"Field": "Resolution", "Value": "Escalated to Tier 2 Review"},
                {"Field": "Escalation Reason", "Value": "Mixed evidence — no single policy rule applies"},
                {"Field": "Key Conflicts", "Value": "Platinum merchant (driver fault) vs elevated customer vs delivery failure vs >$100"},
                {"Field": "Tier 2 Priority", "Value": "Urgent — Escalated"},
                {"Field": "Evidence Package", "Value": "Complete — photos, delivery data, Stripe verification, full reasoning"},
                {"Field": "Questions for Tier 2", "Value": "Cost allocation, driver investigation, account mgmt, merchant comms"}
            ]
        }]
    });
    await delay(1500);

    // Step 7: Partial Close (Escalated)
    updateProcessLog(PROCESS_ID, {id: "s7", time: now(), title: "Finalizing escalation...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s7",
        title: "Case Escalated — Pending Tier 2",
        status: "completed",
        reasoning: [
            "L1 investigation complete - case handed off to Tier 2 with full context",
            "No customer fraud flag - 8.5% below threshold, mixed refund types",
            "No merchant flag - Capital Grille has excellent track record and strong evidence",
            "Driver flagged for review: 33 min late, unscheduled stop, incomplete pickup",
            "Investigation completed within SLA - Tier 2 receives comprehensive package",
            "Case status: Escalated — Pending Tier 2 Review"
        ],
        artifacts: [{
            id: "s7-a1",
            type: "table",
            label: "Case Status — 00078458",
            data: [
                {"Field": "Case Status", "Value": "Escalated — Pending Tier 2 Review"},
                {"Field": "L1 Investigation", "Value": "Complete — all evidence gathered"},
                {"Field": "Customer Flag", "Value": "None — below fraud threshold"},
                {"Field": "Merchant Flag", "Value": "None — Platinum with excellent track record"},
                {"Field": "Driver Flag", "Value": "⚠️ Flagged for review — 33 min late, unscheduled stop, incomplete pickup"},
                {"Field": "SLA Status", "Value": "✅ Investigation completed within SLA"},
                {"Field": "Audit Trail", "Value": "Complete — full reasoning in escalation package"}
            ]
        }]
    });
    await updateStatus(PROCESS_ID, "Escalated", "Pending Tier 2 review");
})();
