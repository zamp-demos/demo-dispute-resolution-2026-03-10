const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

try { require('dotenv').config(); } catch(e) {}

const { GoogleGenerativeAI } = require('@google/generative-ai');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const FEEDBACK_QUEUE_PATH = path.join(PUBLIC_DIR, 'data', 'feedbackQueue.json');
const KB_VERSIONS_PATH = path.join(PUBLIC_DIR, 'data', 'kbVersions.json');
const KB_PATH = path.join(__dirname, 'src', 'data', 'knowledgeBase.md');

let state = { sent: false, confirmed: false, signals: {} };
let runningProcesses = new Map();

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

// Initialize files on startup
const signalFile = path.join(__dirname, 'interaction-signals.json');
if (!fs.existsSync(signalFile)) {
    fs.writeFileSync(signalFile, JSON.stringify({ APPROVE_REVERSAL_001: false, REJECT_001: false, APPROVE_UPHOLD_002: false, REJECT_002: false, APPROVE_ESCALATE_003: false, REJECT_003: false }, null, 4));
}

const processesPath = path.join(PUBLIC_DIR, 'data', 'processes.json');
const baseProcessesPath = path.join(PUBLIC_DIR, 'data', 'base_processes.json');
if (!fs.existsSync(processesPath) && fs.existsSync(baseProcessesPath)) {
    fs.copyFileSync(baseProcessesPath, processesPath);
}

if (!fs.existsSync(FEEDBACK_QUEUE_PATH)) fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
if (!fs.existsSync(KB_VERSIONS_PATH)) fs.writeFileSync(KB_VERSIONS_PATH, '[]');

const snapshotsDir = path.join(PUBLIC_DIR, 'data', 'snapshots');
if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir, { recursive: true });

const server = http.createServer((req, res) => {
    const cleanPath = req.url.split('?')[0];

    if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

    if (cleanPath === '/reset') {
        state = { sent: false, confirmed: false, signals: {} };
        fs.writeFileSync(signalFile, JSON.stringify({ APPROVE_REVERSAL_001: false, REJECT_001: false, APPROVE_UPHOLD_002: false, REJECT_002: false, APPROVE_ESCALATE_003: false, REJECT_003: false }, null, 4));

        runningProcesses.forEach((proc) => {
            try { process.kill(-proc.pid, 'SIGKILL'); } catch(e) {}
        });
        runningProcesses.clear();

        exec('pkill -9 -f "node(.*)simulation_scripts" || true', () => {
            setTimeout(() => {
                const cases = [
                    { id: "DISP_001", name: "Burger & Beyond — Missing Items", category: "Dispute Resolution", merchantName: "Burger & Beyond", disputeAmount: "$24.50", disputeType: "Missing Items", priority: "High", caseNumber: "00078432", status: "In Progress", currentStatus: "Initializing..." },
                    { id: "DISP_002", name: "Taco Fiesta — Wrong Order", category: "Dispute Resolution", merchantName: "Taco Fiesta", disputeAmount: "$38.75", disputeType: "Wrong Order", priority: "Medium", caseNumber: "00078445", status: "In Progress", currentStatus: "Initializing..." },
                    { id: "DISP_003", name: "Capital Grille — Complex Catering", category: "Dispute Resolution", merchantName: "Capital Grille", disputeAmount: "$187.50", disputeType: "Missing / Quality", priority: "Urgent", caseNumber: "00078458", status: "In Progress", currentStatus: "Initializing..." }
                ];
                fs.writeFileSync(processesPath, JSON.stringify(cases, null, 4));
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, '[]');
                fs.writeFileSync(KB_VERSIONS_PATH, '[]');

                const scripts = [
                    { file: 'dispute_story_1_burger_beyond.cjs', id: 'DISP_001' },
                    { file: 'dispute_story_2_taco_fiesta.cjs', id: 'DISP_002' },
                    { file: 'dispute_story_3_capital_grille.cjs', id: 'DISP_003' }
                ];

                scripts.forEach((script, idx) => {
                    setTimeout(() => {
                        const scriptPath = path.join(__dirname, 'simulation_scripts', script.file);
                        const child = exec(`node "${scriptPath}" > "${scriptPath}.log" 2>&1`, (error) => {
                            if (error && error.code !== 0) console.error(`${script.file} error:`, error.message);
                            runningProcesses.delete(script.id);
                        });
                        runningProcesses.set(script.id, child);
                    }, idx * 2000);
                });
            }, 1000);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (cleanPath === '/email-status') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try { state.sent = JSON.parse(body).sent; } catch(e) {}
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            });
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ sent: state.sent }));
        }
        return;
    }

    if (cleanPath === '/signal') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { signal: signalId } = JSON.parse(body);
                const signals = JSON.parse(fs.readFileSync(signalFile, 'utf8'));
                signals[signalId] = true;
                fs.writeFileSync(signalFile, JSON.stringify(signals, null, 4));
            } catch(e) {}
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    if (cleanPath === '/api/update-status') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { id, status, currentStatus } = JSON.parse(body);
                const processes = JSON.parse(fs.readFileSync(processesPath, 'utf8'));
                const idx = processes.findIndex(p => p.id === String(id));
                if (idx !== -1) {
                    processes[idx].status = status;
                    processes[idx].currentStatus = currentStatus;
                    fs.writeFileSync(processesPath, JSON.stringify(processes, null, 4));
                }
            } catch(e) {}
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    if (cleanPath === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const parsed = JSON.parse(body);
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: process.env.VITE_MODEL || 'gemini-2.5-flash' });

                let messages, systemPrompt;
                if (parsed.messages && parsed.systemPrompt) {
                    messages = parsed.messages;
                    systemPrompt = parsed.systemPrompt;
                } else {
                    const kbContent = parsed.knowledgeBase || '';
                    systemPrompt = "You are Pace, an AI assistant with access to the following knowledge base:\n\n" + kbContent + "\n\nAnswer questions based on this knowledge. Be concise and helpful.";
                    messages = (parsed.history || []).map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] }));
                    messages.push({ role: 'user', parts: [{ text: parsed.message }] });
                }

                const chat = model.startChat({ history: messages.slice(0, -1), systemInstruction: systemPrompt });
                const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: result.response.text() }));
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (cleanPath === '/api/feedback/questions') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { feedback, knowledgeBase } = JSON.parse(body);
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: process.env.VITE_MODEL || 'gemini-2.5-flash' });
                const prompt = `User feedback: "${feedback}"\n\nKnowledge Base:\n${knowledgeBase}\n\nGenerate exactly 3 clarifying questions to understand this feedback better. Return as JSON array of strings.`;
                const result = await model.generateContent(prompt);
                const text = result.response.text().replace(/```json\n?|```/g, '').trim();
                const questions = JSON.parse(text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ questions }));
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (cleanPath === '/api/feedback/summarize') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { feedback, questions, answers, knowledgeBase } = JSON.parse(body);
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: process.env.VITE_MODEL || 'gemini-2.5-flash' });
                const prompt = `Feedback: "${feedback}"\n\nQ&A:\n${questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}\n\nKB:\n${knowledgeBase}\n\nSummarize this into a clear 1-2 sentence proposal for updating the knowledge base.`;
                const result = await model.generateContent(prompt);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ summary: result.response.text() }));
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (cleanPath === '/api/feedback/queue') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const item = JSON.parse(body);
                    const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
                    queue.push({ ...item, status: 'pending', timestamp: new Date().toISOString() });
                    fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(queue, null, 2));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok' }));
                } catch(e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        } else {
            const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ queue }));
        }
        return;
    }

    if (cleanPath.startsWith('/api/feedback/queue/')) {
        const feedbackId = cleanPath.split('/').pop();
        const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
        const filtered = queue.filter(item => item.id !== feedbackId);
        fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(filtered, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (cleanPath === '/api/feedback/apply') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { feedbackId } = JSON.parse(body);
                const queue = JSON.parse(fs.readFileSync(FEEDBACK_QUEUE_PATH, 'utf8'));
                const item = queue.find(q => q.id === feedbackId);
                if (!item) throw new Error('Feedback not found');

                const currentKB = fs.readFileSync(KB_PATH, 'utf8');
                const prevFile = `kb_before_${Date.now()}.md`;
                const newFile = `kb_after_${Date.now()}.md`;
                fs.writeFileSync(path.join(snapshotsDir, prevFile), currentKB);

                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: process.env.VITE_MODEL || 'gemini-2.5-flash' });
                const prompt = `Current KB:\n${currentKB}\n\nFeedback to apply: "${item.summary}"\n\nUpdate the knowledge base. Return ONLY the updated markdown, no explanation.`;
                const result = await model.generateContent(prompt);
                const updatedKB = result.response.text().replace(/```markdown\n?|```/g, '').trim();

                fs.writeFileSync(KB_PATH, updatedKB);
                fs.writeFileSync(path.join(snapshotsDir, newFile), updatedKB);

                const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
                versions.push({ id: Date.now().toString(), timestamp: new Date().toISOString(), snapshotFile: newFile, previousFile: prevFile, changes: [item.summary] });
                fs.writeFileSync(KB_VERSIONS_PATH, JSON.stringify(versions, null, 2));

                const updatedQueue = queue.filter(q => q.id !== feedbackId);
                fs.writeFileSync(FEEDBACK_QUEUE_PATH, JSON.stringify(updatedQueue, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, content: updatedKB }));
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }


    if (cleanPath === '/api/kb/update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { find, replace } = JSON.parse(body);
                if (!find) throw new Error('Missing "find" field');
                const currentKB = fs.readFileSync(KB_PATH, 'utf8');
                if (!currentKB.includes(find)) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Text not found in KB' }));
                    return;
                }
                const updatedKB = currentKB.replace(find, replace || '');
                fs.writeFileSync(KB_PATH, updatedKB);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'KB updated' }));
            } catch(e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }
    if (cleanPath === '/api/kb/content') {
        const versionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('versionId');
        let content;
        if (versionId) {
            const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
            const version = versions.find(v => v.id === versionId);
            if (version) content = fs.readFileSync(path.join(snapshotsDir, version.snapshotFile), 'utf8');
        } else {
            content = fs.readFileSync(KB_PATH, 'utf8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content }));
        return;
    }

    if (cleanPath === '/api/kb/versions') {
        const versions = JSON.parse(fs.readFileSync(KB_VERSIONS_PATH, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ versions }));
        return;
    }

    if (cleanPath.startsWith('/api/kb/snapshot/')) {
        const filename = path.basename(cleanPath);
        const content = fs.readFileSync(path.join(snapshotsDir, filename), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/markdown' });
        res.end(content);
        return;
    }

    // Serve static files
    const filePath = path.join(PUBLIC_DIR, cleanPath === '/' ? 'index.html' : cleanPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf', '.webm': 'video/webm' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
