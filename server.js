const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const app = express();
const PORT = 3000;

// Database setup
const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) console.error(err.message);
    console.log("Connected to SQLite database.");
});

// Create table for keys
db.run(`
    CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        is_used INTEGER DEFAULT 0,
        expires_at DATETIME
    )
`);

// Generate random key
const generateKey = () => {
    return crypto.randomBytes(5).toString("hex");
};

// API untuk menghasilkan key baru
app.get("/api/get-key", (req, res) => {
    const key = generateKey();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Berlaku 24 jam

    db.run(
        `INSERT INTO keys (key, expires_at) VALUES (?, ?)`,
        [key, expiresAt.toISOString()],
        function (err) {
            if (err) {
                return res.json({ error: "Gagal membuat key." });
            }
            res.json({ key });
        }
    );
});

// API untuk memvalidasi key
app.post("/api/validate-key", express.json(), (req, res) => {
    const { key } = req.body;

    db.get(
        `SELECT * FROM keys WHERE key = ? AND is_used = 0 AND expires_at > datetime('now')`,
        [key],
        (err, row) => {
            if (err) {
                return res.json({ valid: false, error: "Terjadi kesalahan." });
            }

            if (row) {
                db.run(`UPDATE keys SET is_used = 1 WHERE key = ?`, [key]);
                res.json({ valid: true, message: "Key valid dan sudah digunakan." });
            } else {
                res.json({ valid: false, message: "Key tidak valid atau sudah digunakan." });
            }
        }
    );
});

// Serve static files
app.use(express.static("public"));

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});