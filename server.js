const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MAIN_PANEL_URL = process.env.MAIN_PANEL_URL || "https://codex-license-api.onrender.com";
const ADMIN_PASS = "CodexSquad101"; 

app.get('/list', async (req, res) => {
    const resellerKey = req.query.password;
    let deviceHwid = req.query.hwid;
    
    // Fallback HWID
    if (!deviceHwid || deviceHwid === "undefined" || deviceHwid === "null" || deviceHwid.trim() === "") {
        deviceHwid = "WEB-FALLBACK-" + Math.random().toString(36).substring(2, 10);
    }
    
    if (!resellerKey) return res.status(401).json({ status: "error", message: "Missing Key" });

    try {
        const verifyRes = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: resellerKey, hwid: deviceHwid })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status !== "success") {
            return res.status(403).json({ status: "error", message: verifyData.message || "Access Denied" });
        }
        
        // Kunin lahat ng keys sa Main Panel
        const response = await fetch(`${MAIN_PANEL_URL}/list?password=${ADMIN_PASS}`);
        const allKeys = await response.json();
        
        // I-FILTER: Kanya lang
        const myKeys = {};
        Object.keys(allKeys).forEach(k => { 
            // DAPAT: Source ay RESELLER, at ang resellerId ay kapareho ng kanyang resellerKey
            if (
                allKeys[k].source === "RESELLER" && 
                allKeys[k].resellerId && // <--- Pipigil sa mga walang tag
                allKeys[k].resellerId === resellerKey
            ) {
                myKeys[k] = allKeys[k]; 
            }
        });
        
        res.json(myKeys);
    } catch (err) { 
        res.status(500).json({ status: "error", message: "Server Error" }); 
    }
});

app.get('/generate', async (req, res) => {
    const { password, duration, unit, hwid } = req.query;
    try {
        const verifyRes = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid or Expired Reseller Key" });
        
        const response = await fetch(`${MAIN_PANEL_URL}/api/reseller-generate`, {
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
        const verifyRes = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid or Expired Reseller Key" });
        
        const response = await fetch(`${MAIN_PANEL_URL}/toggle-pause?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

app.get('/delete', async (req, res) => {
    const { password, key, hwid } = req.query;
    try {
        const verifyRes = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: password, hwid: hwid })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status !== "success") return res.status(403).json({ status: "error", message: verifyData.message || "Invalid or Expired Reseller Key" });
        
        const response = await fetch(`${MAIN_PANEL_URL}/delete?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Reseller Server running on port ${PORT}`));
