# Matchcast — AGENTS.md

## 1. Deskripsi

Platform manajemen turnamen olahraga amatir. Penyelenggara bikin bracket, kelola skor, peserta/penonton lihat jadwal & skor real-time via link publik tanpa login.

## 2. Tech Stack

| Lapisan | Stack |
|---------|-------|
| Frontend | SvelteKit 2 + TypeScript + Tailwind CSS 4 + shadcn-svelte (CVA, tailwind-variants, tailwind-merge) |
| Backend | Fastify 5 + TypeScript + Prisma 7 + Neon (production DB) |
| Database | PostgreSQL |
| Runtime | Bun |
| Auth | JWT via `@fastify/jwt`, httpOnly cookie (`token`), bcryptjs |
| Testing | Playwright (API-level, di backend) |
| Font | Inter (body), Oswald (display), JetBrains Mono (mono) via @fontsource |
| Ikon | svelte-radix |
| Production DB | Neon (serverless PostgreSQL) |

## 3. Struktur Folder

```
matchcast/
├── AGENTS.md
├── .gitignore
├── README.md
├── matchcast-backend/
│   ├── src/
│   │   ├── index.ts                 # entry, register plugins & routes
│   │   ├── prisma-client.ts         # singleton Prisma client
│   │   ├── plugins/auth.ts          # JWT verify decorator, makeOnRequestAuth
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       # POST /auth/register, /auth/login
│   │   │   ├── health.routes.ts     # GET /health
│   │   │   ├── tournament.routes.ts # CRUD tournament/team/match + score
│   │   │   └── public.routes.ts     # GET /t/:slug, /t/:slug/matches
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── tournament.service.ts
│   │       └── bracket.service.ts   # generateBracket, updateMatchScore, startMatch, propagateWinner
│   ├── prisma/
│   │   └── schema.prisma
│   ├── tests/                       # Playwright API tests
│   ├── playwright.config.ts
│   └── package.json
└── matchcast-frontend/
    ├── src/
    │   ├── routes/
    │   │   ├── +layout.svelte
    │   │   ├── +page.svelte         # landing
    │   │   ├── layout.css           # global styles, token, clipped-corner, live-badge
    │   │   ├── dashboard/+page.svelte
    │   │   ├── login/+page.svelte
    │   │   ├── register/+page.svelte
    │   │   ├── t/[slug]/+page.svelte    # halaman publik (tanpa auth)
    │   │   └── tournaments/[id]/+page.svelte  # admin dashboard turnamen
    │   └── lib/
    │       ├── api/
    │       │   ├── auth.ts           # apiRegister, apiLogin
    │       │   ├── health.ts
    │       │   └── tournament.ts     # request() helper, semua fungsi CRUD
    │       ├── components/ui/        # shadcn-style + custom
    │       │   ├── bracket.svelte
    │       │   ├── score-modal.svelte
    │       │   ├── button.svelte, card.svelte, input.svelte, label.svelte
    │       └── types/index.ts
    └── package.json
```

## 4. Skema Database

```
User       id, email(unique), passwordHash, name, createdAt
Tournament id, slug(unique), name, sport, format("knockout"), status("draft"|"ongoing"|"finished"), ownerId→User
Team       id, name, seed?, tournamentId→Tournament(Cascade)
Match      id, round, matchOrder, homeTeamId→Team?, awayTeamId→Team?,
           homeScore?, awayScore?, winnerTeamId→Team?,
           status("scheduled"|"ongoing"|"finished"), tournamentId→Tournament(Cascade)
           @@index([tournamentId, round, matchOrder])
```

## 5. Endpoint API

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/health` | ❌ | Health check |
| POST | `/auth/register` | ❌ | Daftar (rate: 5/m/IP) |
| POST | `/auth/login` | ❌ | Login (rate: 5/m/IP) |
| POST | `/tournaments` | ✅ | Buat turnamen |
| GET | `/tournaments` | ✅ | List turnamen milik user |
| GET | `/tournaments/:id` | ✅ | Detail turnamen + teams + matches |
| POST | `/tournaments/:id/teams` | ✅ | Tambah tim |
| DELETE | `/tournaments/:id/teams/:teamId` | ✅ | Hapus tim (hanya draft) |
| POST | `/tournaments/:id/generate-bracket` | ✅ | Generate bracket knockout |
| PATCH | `/matches/:id/start` | ✅ | scheduled → ongoing |
| PATCH | `/matches/:id/score` | ✅ | Update skor + propagate winner |
| GET | `/t/:slug` | ❌ | Detail publik turnamen |
| GET | `/t/:slug/matches` | ❌ | List match publik |

## 6. Token Desain

**Warna (dari layout.css `@theme`):**

```
bg-base: #0B0E14        bg-surface: #161B26
border-subtle: #2A3142  accent-primary: #5B6EF5  accent-live: #FFB020
text-primary: #E8EAF0   text-muted: #8890A6
destructive: #E54B4B
```

**Tipografi:** display=Oswald, body=Inter, mono=JetBrains Mono

**Signature:** clipped-corner (`clip-path` polygon), `live-badge` amber + pulse animasi.

## 7. Konvensi

- **Response API:** semua endpoint return `{ success: boolean, data?: T, error?: { message, code } }`
- **Auth:** JWT dikirim via httpOnly cookie `token` ATAU `Authorization: Bearer <token>`. Token via cookie otomatis di `credentials: "include"`.
- **Penamaan file:** Fastify routes = `resource.routes.ts`, services = `resource.service.ts`, Svelte components = PascalCase.
- **Penamaan endpoint:** plural (`/tournaments`, `/matches/:id/score`).
- **Error domain:** `TournamentError`, `BracketError`, `AuthError` — setiap kelas punya `message`, `code`, `statusCode`. Route handler catch specific error → reply dengan format konsisten. Error tak terduga → global `setErrorHandler` log lengkap, reply generic.

## 8. Command Penting

### Backend (matchcast-backend/)

```
bun run src/index.ts      # dev server (port 3001)
bun run start             # production start
bun run build             # prisma generate + migrate deploy
bun run test              # playwright test (API-level)
cd ../matchcast-frontend && bun run test  # mobile responsive test (browser)
bunx prisma migrate dev   # migrasi schema (development)
bunx prisma studio        # GUI database
```

## 9. Aturan Kerja

1. **Skema Prisma:** jangan ubah tanpa konfirmasi. Kalau terpaksa, jelaskan alasannya dulu.
2. **Dependency:** jangan tambah yang baru tanpa alasan jelas. Bunyakan dulu library existing (`@fastify/*`, shadcn components, dll).
3. **Testing:** tulis Playwright test (`tests/*.spec.ts`) untuk setiap perubahan logic penting (bukan UI murni). Test harus bisa jalan dengan `bun run test`.
4. **Ambiguitas:** tanya dulu. Jangan asumsi.
5. **Git:** jangan commit dengan `-A`. Staging hanya file yang sengaja diubah.
6. **Scope:** jangan implementasi fitur di luar yang diminta.
7. **Keamanan:** production tanpa `JWT_SECRET` → fatal error + exit. Input di-trim dan divalidasi (email regex, max length, integer non-negatif untuk skor). Rate limit auth 5/m/IP.

## 10. Prisma Atomic Patterns

- **updateMany with where guard:** prefer `updateMany({ where: { id, status: "X" }, data: { status: "Y" } })` over `findUnique`+check+`update` — race-safe
- **$transaction for multi-step writes:** score + propagateWinner + finish check in one `$transaction`; pass`tx: Prisma.TransactionClient` to helpers
- **TransactionClient type:** `import type { Prisma } from "../generated/prisma/client"` → `Prisma.TransactionClient`
- **Neon migrations:** `DATABASE_URL_UNPOOLED` (direct, non-pooled) required for `directUrl` in schema — migrations fail with pooled URL
- **Match state machine:** `scheduled → ongoing → finished`. Score endpoint gates on `"ongoing"`, not `{ not: "finished" }`
- **APIResponse cookie extraction:** use `res.headersArray().filter(h => h.name === "set-cookie")` — `headerValues()` doesn't exist on `APIRequestContext` responses
- **Race test pattern:** `Promise.allSettled` → filter by status code → assert `successCount === 1, failCount === N-1`

<!-- BEGIN:workflow -->
## Git workflow (Wajib!)

- **GitHub Flow:** `main` = production. Setiap kerja bikin branch baru dari `main`.
- Saat user bilang "kerjain X" / "bikin Y": `git checkout main && git pull && git checkout -b <tipe>/<nama>` otomatis.
  - Tipe branch sesuai konteks:
    - `feat/` — fitur baru
    - `fix/` — perbaikan bug
    - `refactor/` — refaktor kode
    - `docs/` — dokumentasi
    - `chore/` — maintenance, config, dependency
    - `style/` — styling, UI (bukan logika)
- Selesai → push + buat PR ke `main`. Merge sendiri. Delete branch setelah merge.
- Waktu bikin PR: body description pake `-F` atau `--body-file`, jangan pakai `\n` di string literal biar line breaks beneran.
<!-- END:workflow -->
