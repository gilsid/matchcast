# Matchcast

Platform pengelola turnamen olahraga amatir lokal. Memudahkan penyelenggara membuat bracket, mengelola skor, dan memberikan akses real-time jadwal serta klasemen ke peserta/penonton lewat link publik — tanpa perlu install aplikasi atau daftar akun.

## Tech Stack

- **Frontend:** SvelteKit + TypeScript + Tailwind CSS + shadcn-svelte
- **Backend:** Fastify + TypeScript + Prisma
- **Database:** PostgreSQL
- **Package Manager:** Bun

## Struktur Folder

```
tournament-project/
├── PRD.md                          # Product Requirement Document
├── AGENT-PROMPT-Turnamen.md        # Petunjuk development untuk AI coding agent
├── README.md                       # File ini
├── .gitignore
├── matchcast-frontend/             # SvelteKit app
│   ├── src/routes/                 # Halaman (/, /login, /register, /dashboard, /tournaments/[id], /t/[slug])
│   ├── src/lib/                    # Komponen, API client, types
│   └── ...
└── matchcast-backend/              # Fastify API
    ├── src/routes/                 # Route handlers (health, auth, tournament, public)
    ├── src/services/               # Business logic (auth, tournament, bracket)
    ├── prisma/                     # Schema & migrations
    └── ...
```

## Cara Menjalankan Lokal

### Prasyarat

- Bun (package manager)
- PostgreSQL berjalan lokal (atau via Docker)

### 1. Clone & Install

```bash
git clone <repo-url> tournament-project
cd tournament-project
```

### 2. Setup Environment Variables

```bash
# Backend
cp matchcast-backend/.env.example matchcast-backend/.env
# Edit matchcast-backend/.env — isi DATABASE_URL sesuai koneksi PostgreSQL lokal

# Frontend
cp matchcast-frontend/.env.example matchcast-frontend/.env
# Default VITE_API_URL=http://localhost:3001 sudah sesuai
```

### 3. Install Dependencies

```bash
cd matchcast-backend && bun install && cd ..
cd matchcast-frontend && bun install && cd ..
```

### 4. Setup Database

```bash
cd matchcast-backend
bunx prisma migrate dev
cd ..
```

### 5. Jalankan Dev Server

Jalankan di dua terminal terpisah:

```bash
# Terminal 1 — Backend (port 3001)
cd matchcast-backend && bun run dev

# Terminal 2 — Frontend (port 5173)
cd matchcast-frontend && bun run dev
```

Buka `http://localhost:5173` di browser.

