# Matchcast

Platform manajemen turnamen olahraga amatir. Penyelenggara buat bracket, kelola skor, peserta/penonton lihat jadwal & skor real-time via link publik — tanpa login.

## Tech Stack

| Lapisan | Stack |
| --------- | ------- |
| Frontend | SvelteKit 2 + TypeScript + Tailwind CSS 4 + shadcn-svelte |
| Backend | Fastify 5 + TypeScript + Prisma 7 |
| Database | PostgreSQL (Neon production) |
| Runtime | Bun |
| Auth | JWT via `@fastify/jwt`, httpOnly cookie, bcryptjs |
| Testing | Playwright (API E2E) + Vitest (unit/component) |
| CI | GitHub Actions — typecheck + unit test + Playwright test |
| Font | Inter, Oswald, JetBrains Mono via @fontsource |
| Ikon | svelte-radix |

## Struktur Folder

```
matchcast/
├── AGENTS.md              # Petunjuk untuk AI coding agent
├── README.md
├── specs/                 # Dokumentasi & improvement plan
├── .github/workflows/     # CI (test.yml)
├── matchcast-frontend/    # SvelteKit app
│   ├── src/routes/        # Halaman (/, /login, /register, /dashboard, /tournaments/[id], /t/[slug], +error)
│   ├── src/lib/
│   │   ├── api/           # API client (auth, health, tournament)
│   │   ├── components/ui/ # Komponen (bracket, score-modal, button, card, input, skeleton, spinner)
│   │   │   └── __tests__/ # Vitest component tests
│   │   └── types/
│   └── vitest.config.ts
└── matchcast-backend/     # Fastify API
    ├── src/
    │   ├── index.ts
    │   ├── prisma-client.ts   # PrismaClient singleton + pg adapter
    │   ├── plugins/           # auth plugin (JWT verify)
    │   ├── routes/            # health, auth, tournament, public
    │   ├── services/          # auth, tournament, bracket
    │   │   └── __tests__/     # Vitest unit tests
    │   └── generated/prisma/  # Prisma client (generated)
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── prisma.config.ts       # Prisma 7 config (no url/directUrl in schema)
    ├── tests/                 # Playwright API tests (4 spec files)
    ├── vitest.config.ts
    └── playwright.config.ts
```

## Cara Menjalankan Lokal

### Prasyarat

- Bun (package manager)
- PostgreSQL berjalan lokal (atau via Docker)

### 1. Clone & Install

```bash
git clone <repo-url> matchcast
cd matchcast
```

### 2. Setup Environment Variables

```bash
# Backend
cp matchcast-backend/.env.example matchcast-backend/.env
# Edit matchcast-backend/.env — isi DATABASE_URL sesuai koneksi PostgreSQL

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
bunx prisma generate
bunx prisma migrate dev
cd ..
```

### 5. Jalankan Dev Server

Dua terminal terpisah:

```bash
# Terminal 1 — Backend (port 3001)
cd matchcast-backend && bun run dev

# Terminal 2 — Frontend (port 5173)
cd matchcast-frontend && bun run dev
```

Buka `http://localhost:5173` di browser.

## Testing

### Backend

```bash
cd matchcast-backend

# Unit & integration tests (Vitest)
bun run test:unit

# API E2E tests (Playwright — requires DB + JWT_SECRET)
bun run test

# Playwright + typecheck
bun run test:ci
```

### Frontend

```bash
cd matchcast-frontend

# Component tests (Vitest, standalone, no browser needed)
bun run test:unit

# Responsive E2E tests (Playwright — requires build)
bun run test
```

### CI

Setiap push/PR ke `main` otomatis menjalankan:

1. Backend: typecheck → unit test → Playwright test (dengan PostgreSQL container)
2. Frontend: svelte-kit sync → build → unit test

## Deployment

- **DB:** Neon (serverless PostgreSQL) — koneksi via `DATABASE_URL`
- **Migrations:** `bun run build` (Prisma generate + migrate deploy)
- **Production start:** `bun run start` di backend
