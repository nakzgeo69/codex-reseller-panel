const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 ILAGAY ITO SA RENDER ENV VARIABLES
const MAIN_PANEL_URL = process.env.MAIN_PANEL_URL || "https://codex-license-api.onrender.com";
const ADMIN_PASS = "CodexSquad101"; 

// LOGIN (Verify sa Main Panel)
app.post('/api/reseller-login', async (req, res) => {
    const { key } = req.body;
    try {
        const response = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (err) {
        res.status(500).json({ status: "error", message: "Main Server unreachable" });
    }
});

// GENERATE (Pass sa Main Panel)
app.get('/generate', async (req, res) => {
    const { password, duration, unit } = req.query;
    try {
        const response = await fetch(`${MAIN_PANEL_URL}/api/reseller-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resellerKey: password, duration, unit })
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
});

// LIST (Filter sa Main Panel, RESELLER lang ibalik)
app.get('/list', async (req, res) => {
    try {
        const response = await fetch(`${MAIN_PANEL_URL}/list?password=${ADMIN_PASS}`);
        const allKeys = await response.json();
        const resellerKeys = {};
        Object.keys(allKeys).forEach(k => {
            if (allKeys[k].source === "RESELLER") {
                resellerKeys[k] = allKeys[k];
            }
        });
        res.json(resellerKeys);
    } catch (err) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
});

// TOGGLE PAUSE (Pass sa Main Panel)
app.get('/toggle-pause', async (req, res) => {
    const { key } = req.query;
    try {
        const response = await fetch(`${MAIN_PANEL_URL}/toggle-pause?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

// DELETE (Pass sa Main Panel)
app.get('/delete', async (req, res) => {
    const { key } = req.query;
    try {
        const response = await fetch(`${MAIN_PANEL_URL}/delete?password=${ADMIN_PASS}&key=${key}`);
        const data = await response.json();
        res.json(data);
    } catch (err) { res.status(500).json({ status: "error" }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Reseller Server running on port ${PORT}`));
