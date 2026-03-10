const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const PROCESS_ID = "DISP_002";

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
            "Case #00078445 identified in queue - Taco Fiesta dispute",
            "Priority: MEDIUM - wrong order complaint",
            "Dispute type: Wrong Order - customer received incorrect items",
            "SLA: 52 minutes remaining of 60-minute window"
        ],
        artifacts: [{
            id: "s1-a1",
            type: "table",
            label: "Case Overview",
            data: [
                {"Field": "Case Number", "Value": "00078445"},
                {"Field": "Merchant", "Value": "Taco Fiesta"},
                {"Field": "Type", "Value": "Wrong Order"},
                {"Field": "Amount", "Value": "$38.75"},
                {"Field": "Priority", "Value": "Medium"},
                {"Field": "Order ID", "Value": "UE-ORD-9951482"}
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
            "Taco Fiesta is Silver tier with 88.5% accuracy rate",
            "🚩 BELOW 90% threshold - indicates systemic fulfillment issues",
            "7 disputes in last 90 days, 3 specifically for wrong orders",
            "Pattern of wrong-order errors - recurring problem"
        ],
        artifacts: [{
            id: "s2a-a1",
            type: "table",
            label: "Merchant Profile — Taco Fiesta",
            data: [
                {"Field": "Merchant Name", "Value": "Taco Fiesta", "Policy Implication": "—"},
                {"Field": "Partner Tier", "Value": "Silver", "Policy Implication": "Mid-tier partner"},
                {"Field": "Order Accuracy Rate", "Value": "88.5%", "Policy Implication": "🚩 Below 90% threshold — systemic issues"},
                {"Field": "Prior Disputes (90 days)", "Value": "7 (3 wrong-order)", "Policy Implication": "High dispute volume, pattern"},
                {"Field": "Account Status", "Value": "Active — Under Review", "Policy Implication": "Flagged for accuracy issues"}
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
            "Customer ordered 4 vegetarian items totaling $38.75",
            "Received 3 of 4 items WRONG - including meat dishes",
            "Vegetarian customer received Carne Asada and Carnitas (meat)",
            "Only 1 item correct (Horchata) - complete order mix-up",
            "Food safety concern: dietary restriction violation"
        ],
        artifacts: [{
            id: "s2b-a1",
            type: "table",
            label: "Order vs. Delivered — UE-ORD-9951482",
            data: [
                {"Ordered": "Veggie Burrito Bowl", "Price": "$14.50", "Received": "Carne Asada Burrito", "Match": "❌ Wrong (meat)"},
                {"Ordered": "Black Bean Tacos x2", "Price": "$12.00", "Received": "Carnitas Tacos", "Match": "❌ Wrong (meat)"},
                {"Ordered": "Horchata", "Price": "$4.25", "Received": "Horchata", "Match": "✅ Correct"},
                {"Ordered": "Guac & Chips", "Price": "$8.00", "Received": "Queso & Chips", "Match": "❌ Wrong item"}
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
            "Delivery on time: 39 min actual vs 40 min ETA (1 min early)",
            "Route direct with no deviations",
            "Proof of delivery shows sealed bag at door",
            "Driver delivered exactly what restaurant packed - problem originated at restaurant"
        ],
        artifacts: [{
            id: "s2c-a1",
            type: "table",
            label: "Delivery Details — UE-ORD-9951482",
            data: [
                {"Field": "Estimated Delivery", "Value": "40 min", "Assessment": "—"},
                {"Field": "Actual Delivery", "Value": "39 min", "Assessment": "On time (1 min early)"},
                {"Field": "Route", "Value": "Direct, no deviations", "Assessment": "No driver-side issues"},
                {"Field": "Proof of Delivery", "Value": "Photo: sealed bag at door", "Assessment": "Confirms restaurant packed wrong order"},
                {"Field": "Driver Notes", "Value": "None", "Assessment": "Uneventful delivery"}
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
            "Sarah Kim: 22 lifetime orders with only 1 prior refund",
            "Refund rate: 4.5% - well below 10% fraud threshold",
            "Single prior refund was for late delivery (different issue)",
            "No pattern of repeated claims - clean customer profile",
            "Vegetarian dietary profile noted - meat delivery is food safety issue"
        ],
        artifacts: [{
            id: "s2d-a1",
            type: "table",
            label: "Customer Risk Assessment — Sarah Kim",
            data: [
                {"Metric": "Lifetime Orders", "Value": "22", "Threshold": "50+ = High-Value", "Flag": "Standard customer"},
                {"Metric": "Total Refunds", "Value": "1", "Threshold": "—", "Flag": "Minimal history"},
                {"Metric": "Refund Rate", "Value": "4.5%", "Threshold": ">10% = Fraud", "Flag": "✅ Well below threshold"},
                {"Metric": "Prior Refund Reason", "Value": "Late delivery", "Threshold": "3+ same type = Pattern", "Flag": "✅ No pattern"},
                {"Metric": "Refunds Last 90 Days", "Value": "1 ($12.30)", "Threshold": "3+ = Pattern", "Flag": "✅ Clean"},
                {"Metric": "Dietary Profile", "Value": "Vegetarian", "Threshold": "—", "Flag": "Received meat — food safety concern"}
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
            "Merchant states: 'We believe we packed the correct vegetarian items'",
            "Vague statement - 'we believe' is not definitive",
            "No photo evidence, no packaging verification provided",
            "No explanation for how meat dishes ended up in vegetarian order",
            "LOW credibility: vague denial + no evidence + 88.5% accuracy"
        ],
        artifacts: [{
            id: "s2e-a1",
            type: "table",
            label: "Merchant Statement — Taco Fiesta",
            data: [
                {"Element": "Claim", "Detail": "We believe we packed correct items", "Credibility Assessment": "Vague — 'we believe' not definitive"},
                {"Element": "Evidence Provided", "Detail": "None", "Credibility Assessment": "No photos, no verification"},
                {"Element": "Explanation for Error", "Detail": "None offered", "Credibility Assessment": "No account of meat items sent"},
                {"Element": "Overall Credibility", "Detail": "LOW", "Credibility Assessment": "Vague + no evidence + 88.5% accuracy + 3 prior wrong-order disputes"}
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
            "Payment intent verified: $38.75 charged to Mastercard ••••8819",
            "Customer refund rate confirmed at 4.5% (1 of 22 orders)",
            "Single prior refund was for late delivery, not wrong order",
            "Cross-system data consistent - clean customer profile confirmed"
        ],
        artifacts: [{
            id: "s3-a1",
            type: "table",
            label: "Payment & Refund Verification — Stripe",
            data: [
                {"Field": "Payment Intent", "Value": "pi_3Ox9mN4fYvLZmp3D"},
                {"Field": "Amount", "Value": "$38.75"},
                {"Field": "Status", "Value": "Succeeded"},
                {"Field": "Payment Method", "Value": "Mastercard •••• 8819"},
                {"Field": "Customer Refund Rate", "Value": "4.5% (1/22 orders)"},
                {"Field": "Prior Refund Reason", "Value": "Late delivery ($12.30)"},
                {"Field": "90-Day Refund Total", "Value": "$12.30 (1 transaction)"},
                {"Field": "Merchant Weekly Payout", "Value": "~$2,800"}
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
            "Merchant credibility: LOW (88.5% accuracy below 90%, vague statement, no evidence)",
            "Customer credibility: HIGH (4.5% refund rate, clean history, specific complaint)",
            "Delivery factors: NEUTRAL (on-time, sealed bag)",
            "Food safety concern: Vegetarian received meat - dietary violation",
            "Policy Rule #2 applies: Merchant accuracy <90% + clean customer history",
            "Recommendation: UPHOLD ADJUSTMENT (customer wins)"
        ],
        artifacts: [{
            id: "s4-a1",
            type: "table",
            label: "Evidence Summary",
            data: [
                {"Category": "Merchant Credibility", "Assessment": "LOW", "Reasoning": "88.5% accuracy + vague statement + no evidence + 3 prior wrong-order disputes"},
                {"Category": "Customer Credibility", "Assessment": "HIGH", "Reasoning": "4.5% refund rate + clean history + specific complaint + vegetarian got meat"},
                {"Category": "Delivery Factors", "Assessment": "NEUTRAL", "Reasoning": "On time, no driver issues"},
                {"Category": "Policy Rule Applied", "Assessment": "Rule #2", "Reasoning": "Uphold Adjustment — customer wins"}
            ]
        }, {
            id: "s4-a2",
            type: "file",
            label: "Investigation Report",
            pdfPath: "/data/DISP_002_investigation_report.pdf"
        }]
    });
    await delay(1500);

    // Step 5: HITL Checkpoint
    updateProcessLog(PROCESS_ID, {id: "s5", time: now(), title: "Resolution recommendation ready...", status: "processing"});
    await delay(1500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s5",
        title: "Awaiting Human Approval",
        status: "warning",
        reasoning: [
            "Pace recommends UPHOLDING the $38.75 adjustment",
            "Customer has clean history: 4.5% refund rate, only 1 prior refund",
            "Merchant has systemic issues: 88.5% accuracy (below 90%), 3 wrong-order disputes in 90 days",
            "Food safety concern: vegetarian customer received meat dishes",
            "Human review required before finalizing"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Resolution",
            data: {
                question: "Approve upholding $38.75 adjustment for Taco Fiesta? Customer Sarah Kim received entirely wrong order (3 of 4 items incorrect, vegetarian received meat - food safety concern). Customer refund rate clean at 4.5%. Merchant accuracy 88.5% (below 90% threshold) with vague statement and no evidence.",
                options: [
                    {"label": "Approve — Uphold $38.75 adjustment (customer wins)", "value": "approve_uphold", "signal": "APPROVE_UPHOLD_002"},
                    {"label": "Reject — Reverse adjustment for merchant", "value": "reject", "signal": "REJECT_002"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "Needs Attention", "Awaiting approval");
    await waitSignal("APPROVE_UPHOLD_002");

    updateProcessLog(PROCESS_ID, {
        id: "s5",
        title: "Resolution Approved",
        status: "success",
        reasoning: [
            "Human reviewer approved: Uphold Adjustment",
            "Customer keeps $38.75 refund",
            "Merchant absorbs cost due to accuracy issues"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Resolution",
            data: {
                question: "Approve upholding $38.75 adjustment for Taco Fiesta? Customer Sarah Kim received entirely wrong order (3 of 4 items incorrect, vegetarian received meat - food safety concern). Customer refund rate clean at 4.5%. Merchant accuracy 88.5% (below 90% threshold) with vague statement and no evidence.",
                options: [
                    {"label": "Approve — Uphold $38.75 adjustment (customer wins)", "value": "approve_uphold", "signal": "APPROVE_UPHOLD_002"},
                    {"label": "Reject — Reverse adjustment for merchant", "value": "reject", "signal": "REJECT_002"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "In Progress", "Executing resolution");
    await delay(2000);

    // Step 6: Execute Resolution
    updateProcessLog(PROCESS_ID, {id: "s6", time: now(), title: "Processing resolution...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s6",
        title: "Resolution Executed",
        status: "success",
        reasoning: [
            "Customer's $38.75 refund remains in place - no reversal",
            "Merchant's dispute record updated - 4th case resolved against them in 90 days",
            "Salesforce case updated with resolution details",
            "Dietary restriction violation flagged in notes"
        ],
        artifacts: [{
            id: "s6-a1",
            type: "table",
            label: "Resolution Summary",
            data: [
                {"Field": "Resolution", "Value": "Adjustment Upheld — Customer Wins"},
                {"Field": "Customer Refund", "Value": "$38.75 retained by Sarah Kim"},
                {"Field": "Merchant Impact", "Value": "Adjustment stands — deducted from payout"},
                {"Field": "Policy Rule Applied", "Value": "Rule #2: Merchant accuracy <90% + clean customer"},
                {"Field": "Additional Note", "Value": "Dietary restriction violation flagged"}
            ]
        }]
    });
    await delay(1500);

    // Step 7: Close Case
    updateProcessLog(PROCESS_ID, {id: "s7", time: now(), title: "Finalizing case...", status: "processing"});
    await delay(2000);
    
    updateProcessLog(PROCESS_ID, {
        id: "s7",
        title: "Case Closed",
        status: "completed",
        reasoning: [
            "No customer fraud flag - Sarah Kim has clean profile",
            "Merchant note added: 4th dispute resolved against Taco Fiesta in 90 days",
            "Accuracy concern flagged for merchant partnerships review",
            "Case resolved within 60-minute SLA",
            "Audit trail complete with evidence and reasoning"
        ],
        artifacts: [{
            id: "s7-a1",
            type: "table",
            label: "Case Closure — 00078445",
            data: [
                {"Field": "Case Status", "Value": "Closed — Resolved"},
                {"Field": "Resolution", "Value": "Adjustment Upheld (Customer Wins)"},
                {"Field": "Customer Flag", "Value": "None — clean profile"},
                {"Field": "Merchant Note", "Value": "⚠️ Accuracy concern — 4th dispute against merchant in 90 days"},
                {"Field": "SLA Status", "Value": "✅ Within SLA"},
                {"Field": "Audit Trail", "Value": "Complete — all steps documented"}
            ]
        }]
    });
    await updateStatus(PROCESS_ID, "Done", "Case closed - customer wins");
})();
