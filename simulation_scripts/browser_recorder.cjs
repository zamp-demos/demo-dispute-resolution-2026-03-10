/**
 * Browser Recorder Module
 * 
 * Launches Playwright against live portal URLs (read from KB),
 * records browser sessions as .webm, and returns the file path.
 * 
 * Used inline by simulation scripts during each step.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const KB_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'knowledgeBase.md');
const RECORDINGS_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'recordings');

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

/**
 * Parse the knowledge base to extract portal URLs and credentials
 */
function parseKB() {
    const kb = fs.readFileSync(KB_PATH, 'utf8');
    
    const sfUrlMatch = kb.match(/Salesforce Portal URL\*\*:\s*(https?:\/\/[^\s]+)/);
    const sfCredsMatch = kb.match(/Salesforce Credentials\*\*:\s*([^\s]+)\s*\/\s*([^\s\n]+)/);
    const stripeUrlMatch = kb.match(/Stripe Portal URL\*\*:\s*(https?:\/\/[^\s]+)/);
    const stripeCredsMatch = kb.match(/Stripe Credentials\*\*:\s*([^\s]+)\s*\/\s*([^\s\n]+)/);

    return {
        salesforce: {
            url: sfUrlMatch ? sfUrlMatch[1] : 'https://salesforce-ubereats-demo.vercel.app',
            email: sfCredsMatch ? sfCredsMatch[1] : 'agent@ubereats.com',
            password: sfCredsMatch ? sfCredsMatch[2] : 'UberEats2026!'
        },
        stripe: {
            url: stripeUrlMatch ? stripeUrlMatch[1] : 'https://stripe-ubereats-demo-vignesh-zamps-projects.vercel.app',
            email: stripeCredsMatch ? stripeCredsMatch[1] : 'finance@ubereats.com',
            password: stripeCredsMatch ? stripeCredsMatch[2] : 'UberEats2026!'
        }
    };
}

/**
 * Record a Salesforce portal session.
 * @param {string} outputFile - Filename for the recording (e.g., "s1_sf_dispute_queue.webm")
 * @param {string|null} caseNumber - Case to click (null = just record queue view)
 * @param {string|null} tabLabel - Tab to click after opening case (null = default tab)
 * @returns {string} Web path to the recording (e.g., "/data/recordings/s1_sf_dispute_queue.webm")
 */
async function recordSalesforce({ outputFile, caseNumber = null, tabLabel = null }) {
    const config = parseKB();
    const { url, email, password } = config.salesforce;
    const tempDir = path.join(RECORDINGS_DIR, '_temp_' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            recordVideo: { dir: tempDir, size: { width: 1280, height: 800 } }
        });

        const page = await context.newPage();

        // Navigate to portal and login
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(500);

        // Fill login form
        await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"], .login-btn, button:has-text("Log In"), button:has-text("Login")');

        // Wait for cases to load
        await page.waitForTimeout(2000);

        if (caseNumber) {
            // Click the case (works for both sidebar list v1 and card grid v2)
            const caseEl = page.locator(`text=${caseNumber}`).first();
            await caseEl.click({ timeout: 10000 });
            await page.waitForTimeout(1500);

            if (tabLabel) {
                // Click the tab by its visible label text
                const tabEl = page.locator(`.tab:has-text("${tabLabel}")`).first();
                await tabEl.click({ timeout: 10000 });
                await page.waitForTimeout(2000);
            }
        }

        // Let the page settle for a nice recording
        await page.waitForTimeout(2000);

        // CRITICAL: context.close() BEFORE browser.close() to flush video
        await context.close();
        await browser.close();
        browser = null;

        // Find the recorded file and move it to the final location
        const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
        if (files.length > 0) {
            const srcPath = path.join(tempDir, files[0]);
            const destPath = path.join(RECORDINGS_DIR, outputFile);
            fs.renameSync(srcPath, destPath);
        }

        // Cleanup temp dir
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`[Recorder] Salesforce recording saved: ${outputFile}`);
        return `/data/recordings/${outputFile}`;

    } catch (err) {
        console.error(`[Recorder] Salesforce recording failed for ${outputFile}:`, err.message);
        if (browser) await browser.close().catch(() => {});
        fs.rmSync(tempDir, { recursive: true, force: true });
        // Return fallback path (static file if it exists)
        return `/data/recordings/${outputFile}`;
    }
}

/**
 * Record a Stripe portal session.
 * @param {string} outputFile - Filename for the recording
 * @param {string} paymentId - Payment intent ID to find and click
 * @returns {string} Web path to the recording
 */
async function recordStripe({ outputFile, paymentId }) {
    const config = parseKB();
    const { url, email, password } = config.stripe;
    const tempDir = path.join(RECORDINGS_DIR, '_temp_' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            recordVideo: { dir: tempDir, size: { width: 1280, height: 800 } }
        });

        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(500);

        // Login
        await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"], .login-btn, button:has-text("Log In"), button:has-text("Login")');
        await page.waitForTimeout(2000);

        // Click the payment row
        if (paymentId) {
            const payEl = page.locator(`text=${paymentId}`).first();
            await payEl.click({ timeout: 10000 });
            await page.waitForTimeout(2000);
        }

        await page.waitForTimeout(2000);

        // CRITICAL: context.close() BEFORE browser.close()
        await context.close();
        await browser.close();
        browser = null;

        const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
        if (files.length > 0) {
            fs.renameSync(path.join(tempDir, files[0]), path.join(RECORDINGS_DIR, outputFile));
        }
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`[Recorder] Stripe recording saved: ${outputFile}`);
        return `/data/recordings/${outputFile}`;

    } catch (err) {
        console.error(`[Recorder] Stripe recording failed for ${outputFile}:`, err.message);
        if (browser) await browser.close().catch(() => {});
        fs.rmSync(tempDir, { recursive: true, force: true });
        return `/data/recordings/${outputFile}`;
    }
}

module.exports = { recordSalesforce, recordStripe, parseKB };
