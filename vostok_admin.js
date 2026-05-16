const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;
const DB_PATH = path.join(__dirname, 'vostok_admin.db');

app.use(cors());
app.use(express.json());

// Initialize Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('Error opening database', err);
  else {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER,
      email TEXT,
      content TEXT,
      created_at TEXT,
      synced_at TEXT
    )`);
  }
});

// Sync Endpoint
app.post('/vostok/sync', (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid data' });

  const stmt = db.prepare("INSERT INTO messages (remote_id, email, content, created_at, synced_at) VALUES (?, ?, ?, ?, ?)");
  let count = 0;

  const processMessages = async () => {
    for (const msg of messages) {
      const exists = await new Promise((resolve) => {
        db.get("SELECT id FROM messages WHERE remote_id = ?", [msg.id], (err, row) => resolve(!!row));
      });

      if (!exists) {
        stmt.run(msg.id, msg.email, msg.content, msg.created_at, new Date().toISOString());
        count++;
      }
    }
    stmt.finalize();
    res.json({ status: 'success', synced_count: count });
  };

  processMessages();
});

// Admin Dashboard
app.get('/admin', (req, res) => {
  db.all("SELECT * FROM messages ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).send('Database Error');

    let tableHtml = rows.length ? rows.map(row => `
      <tr class="border-b border-[#39FF14]/10 hover:bg-[#39FF14]/5 transition-colors">
          <td class="p-4 font-mono text-[#39FF14] text-xs">${row.id}</td>
          <td class="p-4 text-slate-300 font-bold">${row.email}</td>
          <td class="p-4 text-slate-400">${row.content}</td>
          <td class="p-4 font-mono text-slate-500 text-[10px]">${row.created_at}</td>
      </tr>
    `).join('') : '<tr><td colspan="4" class="p-12 text-center text-slate-600 italic">No hay mensajes sincronizados aún.</td></tr>';

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Vostok Labs | Admin Console</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            body { 
                background-color: #010101; 
                color: #f8fafc;
                font-family: 'JetBrains Mono', monospace;
            }
            .crt-scanlines {
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                background-size: 100% 2px, 3px 100%;
            }
            .glow-text { text-shadow: 0 0 10px rgba(57, 255, 20, 0.5); }
        </style>
    </head>
    <body class="p-8 crt-scanlines min-h-screen">
        <div class="max-w-6xl mx-auto">
            <header class="mb-12 border-b border-[#39FF14]/20 pb-6 flex justify-between items-end">
                <div>
                    <h1 class="text-4xl font-black text-[#39FF14] glow-text tracking-tighter uppercase">Vostok Admin Console</h1>
                    <p class="text-slate-500 text-xs mt-2 uppercase tracking-[0.3em]">Soberanía de Datos | Registros Locales (Node.js)</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-slate-600 block mb-1">DATABASE STATUS</span>
                    <span class="px-2 py-1 bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[10px] rounded-full animate-pulse">ONLINE</span>
                </div>
            </header>

            <div class="bg-[#050505] border border-[#39FF14]/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-[#39FF14]/5 border-b border-[#39FF14]/20">
                            <th class="p-4 text-[#39FF14] text-[10px] uppercase tracking-widest">ID</th>
                            <th class="p-4 text-[#39FF14] text-[10px] uppercase tracking-widest">Remitente</th>
                            <th class="p-4 text-[#39FF14] text-[10px] uppercase tracking-widest">Contenido del Mensaje</th>
                            <th class="p-4 text-[#39FF14] text-[10px] uppercase tracking-widest">Fecha Envío</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableHtml}
                    </tbody>
                </table>
            </div>

            <footer class="mt-12 text-slate-700 text-[10px] flex justify-between uppercase tracking-widest">
                <span>Vostok Labs v1.1.0</span>
                <span>© 2026 VOSTOK CORE TECHNOLOGY</span>
            </footer>
        </div>
    </body>
    </html>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`[*] Vostok Admin Server iniciando en http://localhost:${PORT}`);
  console.log(`[*] Dashboard disponible en http://localhost:${PORT}/admin`);
});
