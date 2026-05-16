from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import uvicorn
import os
from datetime import datetime

app = FastAPI(title="Vostok Labs Admin Console")

# Habilitar CORS para que la app web pueda enviar datos al servidor local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "vostok_admin.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY, 
                  remote_id INTEGER,
                  email TEXT, 
                  content TEXT, 
                  created_at TEXT,
                  synced_at TEXT)''')
    conn.commit()
    conn.close()

init_db()

@app.post("/vostok/sync")
async def sync_data(request: Request):
    data = await request.json()
    messages = data.get("messages", [])
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    count = 0
    for msg in messages:
        # Evitar duplicados basados en remote_id (el id de Dexie)
        c.execute("SELECT id FROM messages WHERE remote_id = ?", (msg['id'],))
        if not c.fetchone():
            c.execute("INSERT INTO messages (remote_id, email, content, created_at, synced_at) VALUES (?, ?, ?, ?, ?)",
                      (msg['id'], msg['email'], msg['content'], msg['created_at'], datetime.now().isoformat()))
            count += 1
            
    conn.commit()
    conn.close()
    return {"status": "success", "synced_count": count}

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM messages ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    
    table_html = ""
    for row in rows:
        table_html += f"""
        <tr class="border-b border-[#39FF14]/10 hover:bg-[#39FF14]/5 transition-colors">
            <td class="p-4 font-mono text-[#39FF14] text-xs">{row[0]}</td>
            <td class="p-4 text-slate-300 font-bold">{row[2]}</td>
            <td class="p-4 text-slate-400">{row[3]}</td>
            <td class="p-4 font-mono text-slate-500 text-[10px]">{row[4]}</td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Vostok Labs | Admin Console</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            body {{ 
                background-color: #010101; 
                color: #f8fafc;
                font-family: 'JetBrains Mono', monospace;
            }}
            .crt-scanlines {{
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                background-size: 100% 2px, 3px 100%;
            }}
            .glow-text {{ text-shadow: 0 0 10px rgba(57, 255, 20, 0.5); }}
        </style>
    </head>
    <body class="p-8 crt-scanlines min-h-screen">
        <div class="max-w-6xl mx-auto">
            <header class="mb-12 border-b border-[#39FF14]/20 pb-6 flex justify-between items-end">
                <div>
                    <h1 class="text-4xl font-black text-[#39FF14] glow-text tracking-tighter uppercase">Vostok Admin Console</h1>
                    <p class="text-slate-500 text-xs mt-2 uppercase tracking-[0.3em]">Soberanía de Datos | Registros Locales</p>
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
                        {table_html if table_html else '<tr><td colspan="4" class="p-12 text-center text-slate-600 italic">No hay mensajes sincronizados aún.</td></tr>'}
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
    """

if __name__ == "__main__":
    print("[*] Vostok Admin Server iniciando en http://localhost:5000")
    print("[*] Dashboard disponible en http://localhost:5000/admin")
    uvicorn.run(app, host="0.0.0.0", port=5000)
