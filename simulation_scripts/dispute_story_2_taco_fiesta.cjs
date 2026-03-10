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
    const steps = [
        {id: "s1", tp: "Scanning queue...", ts: "Case selected", r: ["Selected case from queue"]},
        {id: "s2a", tp: "Reviewing merchant...", ts: "Merchant assessed", r: ["Profile evaluated"]},
        {id: "s2b", tp: "Analyzing order...", ts: "Order complete", r: ["Items extracted"]},
        {id: "s2c", tp: "Checking delivery...", ts: "Delivery verified", r: ["Timing reviewed"]},
        {id: "s2d", tp: "Assessing customer...", ts: "Risk assessed", r: ["History analyzed"]},
        {id: "s2e", tp: "Reading statement...", ts: "Statement reviewed", r: ["Credibility evaluated"]},
        {id: "s3", tp: "Verifying Stripe...", ts: "Stripe complete", r: ["Payment confirmed"]},
        {id: "s4", tp: "Synthesizing...", ts: "Assessment done", r: ["Rules applied"]},
        {id: "s5", tp: "Awaiting approval...", ts: "Approved", r: ["Human approved"], a: [{type: "decision", label: "HITL", data: {question: "Approve?", options: ["Yes"]}}]},
        {id: "s6", tp: "Processing...", ts: "Resolution executed", r: ["Processed"]},
        {id: "s7", tp: "Finalizing...", ts: "Complete", r: ["Closed"]}
    ];

    for (let i = 0; i < steps.length; i++) {
        const st = steps[i];
        updateProcessLog(PROCESS_ID, {id: st.id, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}), title: st.tp, status: "processing"});
        await updateStatus(PROCESS_ID, "In Progress", st.tp);
        await delay(2000);

        if (st.id === "s5") {
            updateProcessLog(PROCESS_ID, {id: st.id, title: st.ts, status: "warning", reasoning: st.r, artifacts: st.a});
            await updateStatus(PROCESS_ID, "Needs Attention", "Awaiting approval");
            await waitSignal("APPROVE_UPHOLD_002");
        }

        updateProcessLog(PROCESS_ID, {id: st.id, title: st.ts, status: i === steps.length - 1 ? "completed" : "success", reasoning: st.r, artifacts: st.a || []});
        await updateStatus(PROCESS_ID, i === steps.length - 1 ? "Done" : "In Progress", st.ts);
        await delay(1500);
    }
})();
