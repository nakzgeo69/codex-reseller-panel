
const express = require('express');
const app = express();
const crypto = require('crypto');

app.use(express.json());
app.use(express.static('public'));

// 🔥 ILAGAY DITO ANG URL NG MAIN PANEL MO SA RENDER
const MAIN_PANEL_URL = 'https://codex-license-api.onrender.com'; 

// Sariling database ng Second Panel (Para sa mga keys na gine-generate ng reseller)
let resellerLicenses = [];

// 1. LOGIN NG RESELLER (Tatawag sa Main Panel)
app.post('/api/reseller-login', async (req, res) => {
    const { key } = req.body;

    try {
        // I-verify ang key sa Main Panel
        const response = await fetch(`${MAIN_PANEL_URL}/api/verify-reseller-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });

        const data = await response.json();

        if (data.success) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: data.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Main server unreachable' });
    }
});

// 2. GENERATE KEY SA SECOND PANEL (Same function, pero dito naka-save)
app.post('/api/generate', (req, res) => {
    const { duration, unit } = req.body;
    
    // Same format: CODEX-XXXX-XXXX
    const key = `CODEX-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    
    let expiresAt = new Date();
    if (unit === 'Minutes') expiresAt.setMinutes(expiresAt.getMinutes() + duration);
    else if (unit === 'Days') expiresAt.setDate(expiresAt.getDate() + duration);

    const newLicense = {
        id: resellerLicenses.length + 1,
        key: key,
        status: 'ACTIVE',
        expiresAt: expiresAt.toISOString(),
        timeValid: `${duration} ${unit}`
    };

    resellerLicenses.push(newLicense);
    res.json({ success: true, license: newLicense });
});

// 3. Kunin ang listahan ng keys ng reseller
app.get('/api/licenses', (req, res) => {
    res.json(resellerLicenses);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Reseller Server running`));
