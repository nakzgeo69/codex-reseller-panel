const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors'); // 🔥 Kailangan para makausap ang Main Panel
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 ENVIRONMENT VARIABLES (I-set sa Render)
const MAIN_PANEL_URL = process.env.MAIN_PANEL_URL || "https://codex-license-api.onrender.com";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://geodevz69:GeoDevs69@cluster0.leanvjg.mongodb.net/resellerDB?retryWrites=true&w=majority";

// 🔥 CONNECT SA MONGODB (Gumawa ka ng bagong database sa Atlas, hal: resellerDB)
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to Reseller MongoDB Atlas!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// SAME SCHEMA PARA PAREHONG-PAREHO ANG DATA STRUCTURE
const keySchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    hwid: { type: String, default: "WALA_PA" },
    status: { type: String, default: "UNUSED" },
    duration: { type: Number, required: true },
    unit: { type: String, required: true },
    expires: { type: Date, default: null },
    pausedTimeLeft: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now }
});

const ResellerKey = mongoose.model('ResellerKey', keySchema);

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==========================================
// 🔥 VERIFICATION MIDDLEWARE
// Ito ang magche-check kung valid ang reseller key sa Main Panel
// ==========================================
async function verifyResellerAccess(req, res, next) {
    const resellerKey = req.query.password; 

    if (!resellerKey) {
        return res.status(401).json({ status: "error", message: "Reseller Key Required" });
    }

    try {
        // Tatawagin nito ang /verify-reseller endpoint ng Main Panel mo
        const response = await fetch(`${MAIN_PANEL_URL}/verify-reseller`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: resellerKey })
        });

        const data = await response.json();

        if (data.status === "success") {
            next(); // Papasukin si reseller
        } else {
            res.status(403).json({ status: "error", message: "Access Denied: " + data.message });
        }
    } catch (error) {
        console.error("Main Panel Verification Error:", error);
        res.status(500).json({ status: "error", message: "Cannot verify with Main Server" });
    }
}

// ==========================================
// MGA ENDPOINTS (Naka-protect sa Middleware)
// ==========================================

app.get('/generate', verifyResellerAccess, async (req, res) => {
    const { duration, unit } = req.query;

    const key = `CODEX-${generateRandomString(4)}-${generateRandomString(4)}`;
    
    const newKey = new ResellerKey({
        key: key,
        duration: parseInt(duration),
        unit: unit
    });

    try {
        await newKey.save();
        res.json({ status: "success", key: key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Database Error" });
    }
});

app.get('/list', verifyResellerAccess, async (req, res) => {
    try {
        const keys = await ResellerKey.find();
        const formattedData = {};
        
        keys.forEach(k => {
            formattedData[k.key] = {
                hwid: k.hwid,
                status: k.status,
                duration: k.duration,
                unit: k.unit,
                expires: k.expires,
                pausedTimeLeft: k.pausedTimeLeft,
                createdAt: k.createdAt.getTime()
            };
        });
        
        res.json(formattedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error" });
    }
});

app.get('/toggle-pause', verifyResellerAccess, async (req, res) => {
    const { key } = req.query;

    try {
        const keyData = await ResellerKey.findOne({ key: key });
        if (!keyData) return res.status(404).json({ status: "error", message: "Key not found" });

        if (keyData.status === "ACTIVE") {
            let timeLeft = new Date(keyData.expires) - new Date();
            if (timeLeft < 0) timeLeft = 0;
            keyData.pausedTimeLeft = timeLeft;
            keyData.status = "PAUSED";
            await keyData.save();
            return res.json({ status: "success", message: "Key Successfully Hold!" });
        } 
        else if (keyData.status === "PAUSED") {
            let newExpires = new Date();
            newExpires.setMilliseconds(newExpires.getMilliseconds() + keyData.pausedTimeLeft);
            keyData.expires = newExpires;
            keyData.pausedTimeLeft = null;
            keyData.status = "ACTIVE";
            await keyData.save();
            return res.json({ status: "success", message: "Key Successfully Resumed!" });
        }
        res.json({ status: "error", message: "Cannot pause UNUSED key" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error" });
    }
});

app.get('/delete', verifyResellerAccess, async (req, res) => {
    const { key } = req.query;
    
    try {
        const deleted = await ResellerKey.findOneAndDelete({ key: key });
        if (deleted) {
            return res.json({ status: "success", message: "Keys Successfully Deleted" });
        }
        res.status(404).json({ status: "error", message: "Not found" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Reseller Server running on port ${PORT}`));
