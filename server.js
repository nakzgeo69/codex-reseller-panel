const express = require('express');
const path = require('path');
const fs = require('fs'); 
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MAIN_PANEL_URL = process.env.MAIN_PANEL_URL || "https://codex-license-api.onrender.com";
const ADMIN_PASS = process.env.ADMIN_PASS || "CodexSquad101"; 

async function fetchWithRetry(url, options, retries = 3, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if ([502, 503, 504].includes(response.status) && i < retries - 1) {
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            return response;
        } catch (err) {
            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
}

app.post('/verify', async (req, res) => {
    const { key, hwid } = req.body;
    if (!key || !hwid) return res.status(400).json({ status: "error", message: "Missing Data" });

    try {
        const response = await fetchWithRetry(`${MAIN_PANEL_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, hwid: hwid })
        });
        const data = await response.json();
        
        // IPAPASA ANG EXPIRES AT ANG TAMANG STATUS
        return res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ status: "error", message: "Main Panel is waking up. Please try again." });
    }
});

app.get('/list', async (req, res) => {
    const resellerKey = req.query.password;
    let deviceHwid = req.query.hwid;
    
    if (!deviceHwid || deviceHwid === "undefined" || deviceHwid === "null" || deviceHwid.trim() === "") {
        deviceHwid = "WEB-FALLBACK-" + Math.random().toString(36).substring(2, 10);
    }
    if (!resellerKey) return res.status(401).json({ status: "error", message: "Missing Key" });

    try {
        const verifyRes = await fetchWithRetry(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: resellerKey, hwid: deviceHwid })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status !== "success") {
            return res.status(403).json({ status: "error", message: verifyData.message || "Access Denied" });
        }
        
        const response = await fetchWithRetry(`${MAIN_PANEL_URL}/list-reseller?resellerKey=${resellerKey}`);
        const myKeys = await response.json();
        res.json(myKeys);
    } catch (err) { 
        res.status(500).json({ status: "error", message: "Server Error" }); 
    }
});

app.get('/generate', async (req, res) => {
    const { password, duration, unit, hwid } = req.query;
    try {
        const verifyRes = await fetchWithRetry(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid Key" });
        
        const response = await fetchWithRetry(`${MAIN_PANEL_URL}/api/reseller-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resellerKey: password, duration, unit })
        });
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error", message: "Server Error" }); }
});

app.get('/toggle-pause', async (req, res) => {
    const { password, key, hwid } = req.query;
    try {
        const verifyRes = await fetchWithRetry(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid Key" });
        
        const response = await fetchWithRetry(`${MAIN_PANEL_URL}/toggle-pause?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

app.get('/delete', async (req, res) => {
    const { password, key, hwid } = req.query;
    try {
        const verifyRes = await fetchWithRetry(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid Key" });
        
        const response = await fetchWithRetry(`${MAIN_PANEL_URL}/delete?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

app.post('/get-latest-script', async (req, res) => {
    const { key, hwid } = req.body;
    if (!key || !hwid) return res.status(400).json({ status: "error", message: "Missing Data" });

    try {
        const verifyRes = await fetchWithRetry(`${MAIN_PANEL_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status !== "success") {
            return res.status(403).json({ status: "error", message: verifyData.message || "Invalid Key" });
        }

        const scriptPath = path.join(__dirname, 'latest_script.lua');
        if (!fs.existsSync(scriptPath)) {
            return res.status(500).json({ status: "error", message: "Script file not found on server." });
        }

        const scriptContent = fs.readFileSync(scriptPath, 'utf8');
        const base64Script = Buffer.from(scriptContent, 'utf8').toString('base64');

        return res.json({ status: "success", script: base64Script });

    } catch (err) {
        console.error("Get Script Error:", err);
        res.status(500).json({ status: "error", message: "Server Error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Reseller Server running on port ${PORT}`));
