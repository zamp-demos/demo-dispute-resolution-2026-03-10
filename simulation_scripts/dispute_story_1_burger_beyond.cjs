const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public/data');
const recorder = require('./browser_recorder.cjs');
const PROCESS_ID = "DISP_001";

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

const waitSignal = async (signals) => {
    const sids = Array.isArray(signals) ? signals : [signals];
    const sf = path.join(__dirname, '../interaction-signals.json');
    while (true) {
        try {
            if (fs.existsSync(sf)) {
                const c = fs.readFileSync(sf, 'utf8');
                if (c) {
                    const s = JSON.parse(c);
                    for (const sid of sids) {
                        if (s[sid]) {
                            delete s[sid];
                            writeJson(sf, s);
                            return sid;
                        }
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
    
    const s1SfDisputeQueuePath = await recorder.recordSalesforce({outputFile: "s1_sf_dispute_queue.webm", caseNumber: null, tabLabel: null});
    updateProcessLog(PROCESS_ID, {
        id: "s1", 
        title: "Case Intake Complete", 
        status: "success",
        reasoning: [
            "Case #00078432 identified in queue - Burger & Beyond dispute",
            "Priority: HIGH based on merchant tier (Gold) and dispute amount ($24.50)",
            "Dispute type: Missing Items - customer claims items not received",
            "SLA: 45 minutes remaining of 60-minute window"
        ],
        artifacts: [{
            id: "s1-a1", 
            type: "table", 
            label: "Case Overview", 
            data: [
                {"Field": "Case Number", "Value": "00078432"},
                {"Field": "Merchant", "Value": "Burger & Beyond"},
                {"Field": "Type", "Value": "Missing Items"},
                {"Field": "Amount", "Value": "$24.50"},
                {"Field": "Priority", "Value": "High"},
                {"Field": "Order ID", "Value": "UE-ORD-9947201"}
            ]
        }, { id: "s1-vid", type: "video", label: "Salesforce — Dispute Queue", videoPath: s1SfDisputeQueuePath }]
    });
    await updateStatus(PROCESS_ID, "In Progress", "Case intake complete");
    await delay(2000);

    // Step 2a: Merchant Profile
    updateProcessLog(PROCESS_ID, {id: "s2a", time: now(), title: "Reviewing merchant profile...", status: "processing"});
    await delay(2000);
    
    const s1SfMerchantProfilePath = await recorder.recordSalesforce({outputFile: "s1_sf_merchant_profile.webm", caseNumber: "00078432", tabLabel: "Merchant Profile"});
    updateProcessLog(PROCESS_ID, {
        id: "s2a",
        title: "Merchant Profile Assessed",
        status: "success",
        reasoning: [
            "Burger & Beyond is Gold tier with 97.2% accuracy rate",
            "Above 95% threshold - highly credible merchant",
            "2 prior disputes in 90 days, both resolved in merchant's favor",
            "Strong track record supports merchant credibility"
        ],
        artifacts: [{
            id: "s2a-a1",
            type: "table",
            label: "Merchant Profile — Burger & Beyond",
            data: [
                {"Field": "Merchant Name", "Value": "Burger & Beyond", "Policy Implication": "—"},
                {"Field": "Partner Tier", "Value": "Gold", "Policy Implication": "Established, reliable partner"},
                {"Field": "Order Accuracy Rate", "Value": "97.2%", "Policy Implication": "Above 95% threshold — highly credible"},
                {"Field": "Prior Disputes (90 days)", "Value": "2", "Policy Implication": "Both resolved in merchant's favor"},
                {"Field": "Account Status", "Value": "Active — Good Standing", "Policy Implication": "No flags or warnings"}
            ]
        }, { id: "s2a-vid", type: "video", label: "Salesforce — Merchant Profile", videoPath: s1SfMerchantProfilePath }]
    });
    await delay(1500);

    // Step 2b: Order Details
    updateProcessLog(PROCESS_ID, {id: "s2b", time: now(), title: "Analyzing order details...", status: "processing"});
    await delay(2000);
    
    const s1SfOrderDetailsPath = await recorder.recordSalesforce({outputFile: "s1_sf_order_details.webm", caseNumber: "00078432", tabLabel: "Order Details"});
    updateProcessLog(PROCESS_ID, {
        id: "s2b",
        title: "Order Analysis Complete",
        status: "success",
        reasoning: [
            "Order contained 3 items totaling $24.50",
            "Customer claims Truffle Fries ($7.00) and Chocolate Milkshake ($5.00) were missing",
            "Customer received most expensive item (Classic Smash Burger $12.50)",
            "Full $24.50 refund issued, not just missing items value ($12.00)"
        ],
        artifacts: [{
            id: "s2b-a1",
            type: "table",
            label: "Order Details — UE-ORD-9947201",
            data: [
                {"Item": "Classic Smash Burger", "Price": "$12.50", "Status": "Delivered"},
                {"Item": "Truffle Fries", "Price": "$7.00", "Status": "Claimed Missing"},
                {"Item": "Chocolate Milkshake", "Price": "$5.00", "Status": "Claimed Missing"},
                {"Item": "Total", "Price": "$24.50", "Status": "Full refund issued"}
            ]
        }, { id: "s2b-vid", type: "video", label: "Salesforce — Order Details", videoPath: s1SfOrderDetailsPath }]
    });
    await delay(1500);

    // Step 2c: Delivery Info
    updateProcessLog(PROCESS_ID, {id: "s2c", time: now(), title: "Checking delivery data...", status: "processing"});
    await delay(2000);
    
    const s1SfDeliveryTrackingPath = await recorder.recordSalesforce({outputFile: "s1_sf_delivery_tracking.webm", caseNumber: "00078432", tabLabel: "Delivery Tracking"});
    updateProcessLog(PROCESS_ID, {
        id: "s2c",
        title: "Delivery Verification Complete",
        status: "success",
        reasoning: [
            "Delivery on time: 36 min actual vs 35 min ETA (1 min variance - normal)",
            "Route direct with no deviations or unscheduled stops",
            "Proof of delivery shows sealed brown bag at front door",
            "Sealed bag confirms items packed at restaurant, no driver tampering"
        ],
        artifacts: [{
            id: "s2c-a1",
            type: "table",
            label: "Delivery Details — UE-ORD-9947201",
            data: [
                {"Field": "Estimated Delivery", "Value": "35 min", "Assessment": "—"},
                {"Field": "Actual Delivery", "Value": "36 min", "Assessment": "On time (1 min over — normal)"},
                {"Field": "Route", "Value": "Direct, no deviations", "Assessment": "No tampering risk"},
                {"Field": "Proof of Delivery", "Value": "Photo: sealed bag at door", "Assessment": "Bag sealed — items packed at restaurant"},
                {"Field": "Driver Notes", "Value": "None", "Assessment": "Uneventful delivery"}
            ]
        }, { id: "s2c-vid", type: "video", label: "Salesforce — Delivery Tracking", videoPath: s1SfDeliveryTrackingPath }]
    });
    await delay(1500);

    // Step 2d: Customer Risk
    updateProcessLog(PROCESS_ID, {id: "s2d", time: now(), title: "Assessing customer risk profile...", status: "processing"});
    await delay(2500);
    
    const s1SfCustomerHistoryPath = await recorder.recordSalesforce({outputFile: "s1_sf_customer_history.webm", caseNumber: "00078432", tabLabel: "Customer History"});
    updateProcessLog(PROCESS_ID, {
        id: "s2d",
        title: "Customer Risk Assessment Complete",
        status: "success",
        reasoning: [
            "David Chen: 87 lifetime orders (high-value customer)",
            "Refund rate: 13.8% - EXCEEDS 10% fraud threshold",
            "8 of 12 refunds for 'missing items' (66% concentration)",
            "5 refund requests in last 90 days - exceeds 3-claim pattern threshold",
            "🚩 FRAUD FLAG: Multiple thresholds exceeded"
        ],
        artifacts: [{
            id: "s2d-a1",
            type: "table",
            label: "Customer Risk Assessment — David Chen",
            data: [
                {"Metric": "Lifetime Orders", "Value": "87", "Threshold": "50+ = High-Value", "Flag": "⚠️ High-Value Customer"},
                {"Metric": "Total Refunds", "Value": "12", "Threshold": "—", "Flag": "—"},
                {"Metric": "Refund Rate", "Value": "13.8%", "Threshold": ">10% = Fraud", "Flag": "🚩 EXCEEDS — Fraud Flag"},
                {"Metric": "'Missing Items' Refunds", "Value": "8 of 12 (66%)", "Threshold": "3+ same type = Pattern", "Flag": "🚩 Pattern Detected"},
                {"Metric": "Refunds Last 90 Days", "Value": "5 ($156.40)", "Threshold": "3+ = Pattern Fraud", "Flag": "🚩 EXCEEDS — 5 claims"}
            ]
        }, { id: "s2d-vid", type: "video", label: "Salesforce — Customer History", videoPath: s1SfCustomerHistoryPath }]
    });
    await delay(1500);

    // Step 2e: Merchant Statement
    updateProcessLog(PROCESS_ID, {id: "s2e", time: now(), title: "Reading merchant statement...", status: "processing"});
    await delay(2000);
    
    const s1SfMerchantStatementPath = await recorder.recordSalesforce({outputFile: "s1_sf_merchant_statement.webm", caseNumber: "00078432", tabLabel: "Merchant Statement"});
    updateProcessLog(PROCESS_ID, {
        id: "s2e",
        title: "Merchant Statement Reviewed",
        status: "success",
        reasoning: [
            "Merchant claims: 'All items packed and sealed. Photo evidence of sealed bag before driver handoff'",
            "Statement is specific and backed by physical evidence",
            "Merchant notes customer's multiple prior missing-item claims",
            "HIGH credibility: specific claim + photo + 97.2% accuracy rate"
        ],
        artifacts: [{
            id: "s2e-a1",
            type: "table",
            label: "Merchant Statement — Burger & Beyond",
            data: [
                {"Element": "Claim", "Detail": "All items packed and sealed", "Credibility Assessment": "Specific, verifiable"},
                {"Element": "Evidence Provided", "Detail": "Photo of sealed bag before driver handoff", "Credibility Assessment": "Physical evidence — high weight"},
                {"Element": "Customer Pattern Noted", "Detail": "Multiple prior missing-item claims", "Credibility Assessment": "Corroborated by customer risk data"},
                {"Element": "Overall Credibility", "Detail": "HIGH", "Credibility Assessment": "Specific + photo + 97.2% accuracy"}
            ]
        }, { id: "s2e-vid", type: "video", label: "Salesforce — Merchant Statement", videoPath: s1SfMerchantStatementPath }]
    });
    await delay(1500);

    // Step 3: Stripe Verification
    updateProcessLog(PROCESS_ID, {id: "s3", time: now(), title: "Verifying payment in Stripe...", status: "processing"});
    await delay(2500);
    
    const s1StripePaymentPath = await recorder.recordStripe({outputFile: "s1_stripe_payment.webm", paymentId: "pi_3Ox8kL2eZvKYlo2C"});
    updateProcessLog(PROCESS_ID, {
        id: "s3",
        title: "Payment Verification Complete",
        status: "success",
        reasoning: [
            "Payment intent verified: $24.50 charged to Visa ••••4242",
            "Customer refund rate confirmed at 13.8% (12 of 87 orders)",
            "8 of 12 refunds cite 'missing items' - pattern confirmed in Stripe",
            "Cross-system consistency strengthens fraud case"
        ],
        artifacts: [{
            id: "s3-a1",
            type: "table",
            label: "Payment & Refund Verification — Stripe",
            data: [
                {"Field": "Payment Intent", "Value": "pi_3Ox8kL2eZvKYlo2C"},
                {"Field": "Amount", "Value": "$24.50"},
                {"Field": "Status", "Value": "Succeeded"},
                {"Field": "Payment Method", "Value": "Visa •••• 4242"},
                {"Field": "Customer Refund Rate", "Value": "13.8% (12/87 orders)"},
                {"Field": "Missing Items Refunds", "Value": "8 of 12 (66%)"},
                {"Field": "90-Day Refund Total", "Value": "$156.40 (5 transactions)"},
                {"Field": "Merchant Weekly Payout", "Value": "~$4,200"}
            ]
        }, { id: "s3-vid", type: "video", label: "Stripe — Payment Verification", videoPath: s1StripePaymentPath }]
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
            "Merchant credibility: HIGH (97.2% accuracy, photo evidence, Gold tier)",
            "Customer credibility: LOW (13.8% refund rate, pattern fraud indicators)",
            "Delivery factors: NEUTRAL (on-time, sealed bag, no issues)",
            "Policy Rule #1 applies: Customer refund >10% + Merchant accuracy >95% + Normal delivery",
            "Recommendation: REVERSE ADJUSTMENT (merchant wins)"
        ],
        artifacts: [{
            id: "s4-a1",
            type: "table",
            label: "Evidence Summary",
            data: [
                {"Category": "Merchant Credibility", "Assessment": "HIGH", "Reasoning": "97.2% accuracy + photo evidence + Gold tier"},
                {"Category": "Customer Credibility", "Assessment": "LOW", "Reasoning": "13.8% refund rate + 8 'missing items' claims + 5 in 90 days"},
                {"Category": "Delivery Factors", "Assessment": "NEUTRAL", "Reasoning": "On time, sealed bag, no driver issues"},
                {"Category": "Policy Rule Applied", "Assessment": "Rule #1", "Reasoning": "Reverse Adjustment — merchant wins"}
            ]
        }, {
            id: "s4-a2",
            type: "file",
            label: "Investigation Report",
            pdfPath: "/data/DISP_001_investigation_report.pdf"
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
            "Pace recommends REVERSING the $24.50 adjustment",
            "Merchant has strong evidence: Gold tier, 97.2% accuracy, photo proof",
            "Customer shows pattern fraud: 13.8% refund rate, 8 'missing items' claims",
            "Note: Customer has 87 lifetime orders (high-value status)",
            "Human review required before executing financial action"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Resolution",
            data: {
                question: "Approve reversal of $24.50 adjustment for Burger & Beyond? Customer David Chen flagged for pattern fraud (13.8% refund rate, 8 'missing items' claims). Merchant is Gold tier with 97.2% accuracy and photo evidence.",
                options: [
                    {"label": "Approve — Reverse $24.50 adjustment (merchant wins)", "value": "approve_reversal", "signal": "APPROVE_REVERSAL_001"},
                    {"label": "Reject — Keep adjustment for customer", "value": "reject", "signal": "REJECT_001"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "Needs Attention", "Awaiting approval");
    const decision = await waitSignal(["APPROVE_REVERSAL_001", "REJECT_001"]);
    const approved = decision === "APPROVE_REVERSAL_001";

    updateProcessLog(PROCESS_ID, {
        id: "s5",
        title: approved ? "Resolution Approved" : "Resolution Rejected",
        status: "success",
        reasoning: approved ? [
            "Human reviewer approved: Reverse Adjustment",
            "Proceeding with $24.50 refund to merchant",
            "Customer fraud flag will be applied"
        ] : [
            "Human reviewer rejected reversal",
            "Original $24.50 adjustment stands — customer keeps credit",
            "No fraud flag applied — case closed as-is"
        ],
        artifacts: [{
            id: "s5-a1",
            type: "decision",
            label: "Approve Resolution",
            data: {
                question: "Approve reversal of $24.50 adjustment for Burger & Beyond? Customer David Chen flagged for pattern fraud (13.8% refund rate, 8 'missing items' claims). Merchant is Gold tier with 97.2% accuracy and photo evidence.",
                options: [
                    {"label": "Approve — Reverse $24.50 adjustment (merchant wins)", "value": "approve_reversal", "signal": "APPROVE_REVERSAL_001"},
                    {"label": "Reject — Keep adjustment for customer", "value": "reject", "signal": "REJECT_001"}
                ]
            }
        }]
    });
    await updateStatus(PROCESS_ID, "In Progress", "Executing resolution");
    await delay(2000);

    // Step 6: Execute Resolution
    updateProcessLog(PROCESS_ID, {id: "s6", time: now(), title: "Processing reversal...", status: "processing"});
    await delay(2500);
    
    updateProcessLog(PROCESS_ID, {
        id: "s6",
        title: approved ? "Resolution Executed" : "Rejection Processed",
        status: "success",
        reasoning: approved ? [
            "$24.50 reversed to Burger & Beyond's next payout",
            "Salesforce case updated with resolution details",
            "Merchant dispute record shows another case resolved in their favor",
            "Audit trail complete with policy rule and reviewer approval"
        ] : [
            "Original $24.50 adjustment maintained",
            "Customer credit remains — no reversal processed",
            "Salesforce case updated with rejection details",
            "Audit trail recorded with reviewer decision"
        ],
        artifacts: [{
            id: "s6-a1",
            type: "table",
            label: approved ? "Resolution Summary" : "Rejection Summary",
            data: approved ? [
                {"Field": "Resolution", "Value": "Adjustment Reversed — Merchant Wins"},
                {"Field": "Amount Returned to Merchant", "Value": "$24.50"},
                {"Field": "Policy Rule Applied", "Value": "Rule #1: Customer fraud + credible merchant"},
                {"Field": "Stripe Action", "Value": "Refund reversal processed"},
                {"Field": "Salesforce Update", "Value": "Case resolution recorded"}
            ] : [
                {"Field": "Resolution", "Value": "Adjustment Upheld — Customer Keeps Credit"},
                {"Field": "Amount", "Value": "$24.50 remains with customer"},
                {"Field": "Reviewer Decision", "Value": "Reversal rejected"},
                {"Field": "Stripe Action", "Value": "No action — original adjustment stands"},
                {"Field": "Salesforce Update", "Value": "Case rejection recorded"}
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
        reasoning: approved ? [
            "Customer account flagged for pattern fraud",
            "Flag will assist future dispute investigations",
            "Case notes include fraud indicators and merchant evidence",
            "Resolved within 60-minute SLA (used ~15 of 45 minutes)",
            "Audit trail complete and stored"
        ] : [
            "Merchant notified of rejection outcome",
            "No fraud flag applied to customer account",
            "Resolved within 60-minute SLA",
            "Audit trail complete and stored"
        ],
        artifacts: [{
            id: "s7-a1",
            type: "table",
            label: "Case Closure — 00078432",
            data: approved ? [
                {"Field": "Case Status", "Value": "Closed — Resolved"},
                {"Field": "Resolution", "Value": "Adjustment Reversed (Merchant Wins)"},
                {"Field": "Customer Flag", "Value": "🚩 Pattern Fraud Flag Applied — David Chen"},
                {"Field": "SLA Status", "Value": "✅ Within SLA"},
                {"Field": "Audit Trail", "Value": "Complete — all steps documented"}
            ] : [
                {"Field": "Case Status", "Value": "Closed — Rejected"},
                {"Field": "Resolution", "Value": "Adjustment Upheld (Customer Keeps Credit)"},
                {"Field": "Customer Flag", "Value": "None applied"},
                {"Field": "SLA Status", "Value": "✅ Within SLA"},
                {"Field": "Audit Trail", "Value": "Complete — all steps documented"}
            ]
        }]
    });
    await updateStatus(PROCESS_ID, "Done", approved ? "Case closed - merchant wins" : "Case closed - rejection upheld");
})();
