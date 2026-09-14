# Matchcast

[![CI](https://github.com/gilsid/matchcast/actions/workflows/test.yml/badge.svg)](https://github.com/gilsid/matchcast/actions/workflows/test.yml)

Platform manajemen turnamen olahraga amatir. Penyelenggara buat bracket, kelola
skor, peserta/penonton lihat jadwal dan skor real-time via link publik, tanpa
login.

Satu app SvelteKit fullstack (API same-origin di `src/routes/api/*`), deploy
serverless Vercel + Neon. Riwayat keputusan di `docs/adr/`.

## Cara Pakai

1. Daftar di `/register`, lalu login.
2. Di dashboard, buat turnamen (nama + cabang olahraga).
3. Buka halaman turnamen, tambah tim selagi status masih draft.
4. Generate bracket, lalu mulai tiap match dari `scheduled` ke `ongoing`.
5. Input skor tiap match yang berjalan. Pemenang lolos otomatis ke ronde berikut.
6. Bagikan link publik `/t/[slug]` ke peserta dan penonton. Halaman ini muat
   ulang skor sendiri tiap 12 detik.

## Tech Stack

| Lapisan  | Stack                                                               |
| -------- | ------------------------------------------------------------------- |
| App      | SvelteKit 2 fullstack + TypeScript + Tailwind CSS 4 + shadcn-svelte |
| Database | PostgreSQL (Neon HTTP di Vercel, pg Pool lokal) via Prisma 7        |
| Runtime  | Bun (Node 22 di Vercel)                                             |
| Auth     | JWT via `jose`, httpOnly cookie, bcryptjs                           |
| Testing  | Playwright (API + mobile) + Vitest (unit/component)                 |
| CI       | GitHub Actions, check + unit + build + Playwright                   |
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
│       ├── api/           # request.ts helper + fetch relatif /api/*
│       ├── bracket.ts     # groupByRound/maxRound
│       ├── types/
│       └── components/ui/
├── tests/
│   ├── api/
│   └── mobile-responsive.spec.ts
└── package.json
```

## Cara Menjalankan Lokal

### Prasyarat

- Bun 1.4+
- PostgreSQL 16 lokal (atau Docker)

### 1. Clone & Install

```bash
git clone https://github.com/gilsid/matchcast.git matchcast
cd matchcast
bun install
```

### 2. Environment

```bash
cp .env.example .env
```

| Variabel     | Wajib | Isi                                                            |
| ------------ | ----- | -------------------------------------------------------------- |
| DATABASE_URL | Ya    | Connection string Postgres. URL `neon.tech` pakai HTTP driver, |
|              |       | URL lain pakai pg Pool                                         |
| JWT_SECRET   | Prod  | Kunci JWT. App mati saat boot kalau kosong di production       |

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

## Script

| Perintah            | Fungsi                                    |
| ------------------- | ----------------------------------------- |
| `bun run dev`       | dev server port 5173                      |
| `bun run build`     | production build (adapter-vercel)         |
| `bun run preview`   | preview hasil build lokal                 |
| `bun run check`     | svelte-check (typecheck)                  |
| `bun run test:unit` | Vitest, tanpa DB                          |
| `bun run test`      | build + Playwright, butuh DB + JWT_SECRET |
| `bun run lint`      | prettier check + eslint                   |
| `bun run format`    | prettier write                            |

## Testing

```bash
# Unit & component (Vitest, tanpa DB)
bun run test:unit

# API + mobile (Playwright, butuh DB + JWT_SECRET + migrasi applied)
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
export JWT_SECRET="local-dev-secret"
bun run test

# Typecheck
bun run check
```

### CI

Setiap push/PR ke `main`: install, generate, migrate, check, unit,
build, Playwright (Chromium, Postgres service).

## Deployment

- **App:** Vercel via `@sveltejs/adapter-vercel` (runtime nodejs22.x)
- **DB:** Neon serverless PostgreSQL via `DATABASE_URL` (URL `neon.tech`
  otomatis pakai HTTP driver; URL lain pakai pg Pool)
- **Env wajib:** `DATABASE_URL`, `JWT_SECRET`

## Troubleshooting

- Test API gagal konek DB: pastikan Postgres jalan dan `migrate deploy` sudah
  applied.
- App mati saat boot di production: `JWT_SECRET` kosong, isi dulu.
- Error Prisma Client setelah pull: jalankan `bunx prisma generate` lagi.

## Dokumen Terkait

- `AGENTS.md`: aturan kerja, konvensi, pola atomic Prisma
- `CONTEXT.md`: glosarium domain (turnamen, bracket, seed, bye)
- `docs/adr/`: catatan keputusan arsitektur
