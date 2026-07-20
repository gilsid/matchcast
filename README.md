# Matchcast

Platform manajemen turnamen olahraga amatir. Penyelenggara buat bracket, kelola
skor, peserta/penonton lihat jadwal & skor real-time via link publik — tanpa
login.

## Tech Stack

| Lapisan | Stack |
| --- | --- |
| Frontend | SvelteKit 2 + TypeScript + Tailwind CSS 4 + shadcn-svelte |
| Backend | Fastify 5 + TypeScript + Prisma 7 |
| Database | PostgreSQL (Neon production) |
| Runtime | Bun |
| Auth | JWT via `@fastify/jwt`, httpOnly cookie, bcryptjs |
| Testing | Playwright (API E2E) + Vitest (unit/component) |
| CI | GitHub Actions — typecheck + unit + Playwright |
| Font | Inter, Oswald, JetBrains Mono via @fontsource |
| Ikon | svelte-radix |

## Struktur Folder

```text
matchcast/
├── AGENTS.md
├── README.md
├── specs/
├── .github/workflows/
├── matchcast-frontend/
│   ├── src/routes/
│   ├── src/lib/
│   │   ├── api/
│   │   ├── components/ui/
│   │   │   └── __tests__/
│   │   └── types/
│   └── vitest.config.ts
└── matchcast-backend/
    ├── src/
    │   ├── index.ts
    │   ├── prisma-client.ts
    │   ├── plugins/
    │   ├── routes/
    │   ├── services/
    │   │   └── __tests__/
    │   └── generated/prisma/
    ├── prisma/
    ├── prisma.config.ts
    ├── tests/
    ├── vitest.config.ts
    └── playwright.config.ts
```

## Cara Menjalankan Lokal

### Prasyarat

- Bun (package manager)
- PostgreSQL lokal (atau Docker)

### 1. Clone & Install

```bash
git clone <repo-url> matchcast
cd matchcast
```

### 2. Setup Environment Variables

```bash
# Backend
cp matchcast-backend/.env.example matchcast-backend/.env
# Edit DATABASE_URL sesuai koneksi PostgreSQL

# Frontend
cp matchcast-frontend/.env.example matchcast-frontend/.env
# Default VITE_API_URL=http://localhost:3001
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

Dua terminal:

```bash
# Terminal 1 — Backend (port 3001)
cd matchcast-backend && bun run dev

# Terminal 2 — Frontend (port 5173)
cd matchcast-frontend && bun run dev
```

Buka `http://localhost:5173`.

## Testing

### Backend

```bash
cd matchcast-backend

# Unit & integration (Vitest)
bun run test:unit

# API E2E (Playwright — requires DB + JWT_SECRET)
bun run test

# All: typecheck + Playwright
bun run test:ci
```

### Frontend

```bash
cd matchcast-frontend

# Component tests (Vitest, standalone)
bun run test:unit

# Responsive E2E (Playwright — requires build)
bun run test
```

### CI

Setiap push/PR ke `main`:

1. Backend: typecheck → unit test → Playwright (PostgreSQL container)
2. Frontend: svelte-kit sync → build → unit test

## Deployment

- **DB:** Neon serverless PostgreSQL via `DATABASE_URL`
- **Migrations:** `bun run build` (generate + migrate deploy)
- **Production:** `bun run start` di backend
