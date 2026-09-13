# Matchcast

Platform manajemen turnamen olahraga amatir. Penyelenggara buat bracket, kelola
skor, peserta/penonton lihat jadwal & skor real-time via link publik — tanpa
login.

Satu app SvelteKit fullstack (API same-origin di `src/routes/api/*`), deploy
serverless Vercel + Neon. Riwayat keputusan di `docs/adr/`.

## Tech Stack

| Lapisan  | Stack                                                               |
| -------- | ------------------------------------------------------------------- |
| App      | SvelteKit 2 fullstack + TypeScript + Tailwind CSS 4 + shadcn-svelte |
| Database | PostgreSQL (Neon HTTP di Vercel, pg Pool lokal) via Prisma 7        |
| Runtime  | Bun (Node 22 di Vercel)                                             |
| Auth     | JWT via `jose`, httpOnly cookie, bcryptjs                           |
| Testing  | Playwright (API + mobile) + Vitest (unit/component)                 |
| CI       | GitHub Actions — check + unit + build + Playwright                  |
| Font     | Inter, Oswald, JetBrains Mono via @fontsource                       |
| Ikon     | svelte-radix                                                        |

## Struktur Folder

```text
matchcast/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── specs/
├── docs/adr/
├── .github/workflows/
├── prisma/
├── src/
│   ├── hooks.server.ts
│   ├── routes/
│   │   ├── api/
│   │   └── dashboard/ login/ register/ t/[slug]/ tournaments/[id]/
│   └── lib/
│       ├── server/        # SERVER-ONLY: db, auth, services
│       ├── api/           # fetch relatif /api/*
│       ├── types/
│       └── components/ui/
├── tests/
│   ├── api/
│   └── mobile-responsive.spec.ts
└── package.json
```

## Cara Menjalankan Lokal

### Prasyarat

- Bun
- PostgreSQL lokal (atau Docker)

### 1. Clone & Install

```bash
git clone <repo-url> matchcast
cd matchcast
bun install
```

### 2. Environment

```bash
cp .env.example .env
# Isi DATABASE_URL (postgres lokal) dan JWT_SECRET
```

### 3. Database

```bash
bunx prisma generate
bunx prisma migrate deploy
```

### 4. Dev Server

```bash
bun run dev
```

Buka `http://localhost:5173`. API ikut same-origin di `/api/*`.

## Testing

```bash
# Unit & component (Vitest, tanpa DB)
bun run test:unit

# API + mobile (Playwright — butuh DB + JWT_SECRET + migrasi applied)
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
export JWT_SECRET="local-dev-secret"
bun run test

# Typecheck
bun run check
```

### CI

Setiap push/PR ke `main`: install → generate → migrate → check → unit →
build → Playwright (Chromium, Postgres service).

## Deployment

- **App:** Vercel via `@sveltejs/adapter-vercel` (runtime nodejs22.x)
- **DB:** Neon serverless PostgreSQL via `DATABASE_URL` (URL `neon.tech`
  otomatis pakai HTTP driver; URL lain pakai pg Pool)
- **Env wajib:** `DATABASE_URL`, `JWT_SECRET`
