# Matchcast — AGENTS.md

## 1. Deskripsi

Platform manajemen turnamen olahraga amatir. Penyelenggara bikin bracket,
kelola skor, peserta/penonton lihat jadwal & skor real-time via link publik
tanpa login.

## 2. Tech Stack

| Lapisan | Stack |
| --- | --- |
| Frontend | SvelteKit 2 + TypeScript + Tailwind CSS 4 + shadcn-svelte |
| Backend | Fastify 5 + TypeScript + Prisma 7 + Neon |
| Database | PostgreSQL |
| Runtime | Bun |
| Auth | JWT via `@fastify/jwt`, httpOnly cookie, bcryptjs |
| Testing API | Playwright — 6 spec files (5 backend + 1 frontend) |
| Testing Unit | Vitest — 3 test files |
| Linting | Prettier + ESLint (frontend) |
| Format | Prettier (useTabs: true, singleQuote: true) |
| Font | Inter, Oswald, JetBrains Mono via @fontsource |
| Ikon | svelte-radix |
| CI | GitHub Actions — typecheck + vitest + Playwright |

## 3. Struktur Folder

```text
matchcast/
├── AGENTS.md
├── README.md
├── specs/
│   └── improvement-plan.md
├── .github/workflows/
│   └── test.yml
├── matchcast-backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── prisma-client.ts
│   │   ├── plugins/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   └── route-handler.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── health.routes.ts
│   │   │   ├── match.routes.ts
│   │   │   ├── public.routes.ts
│   │   │   └── tournament.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── bracket.service.ts
│   │   │   ├── tournament.service.ts
│   │   │   └── __tests__/
│   │   │       └── bracket.service.test.ts
│   │   └── generated/
│   │       └── prisma/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── prisma.config.ts
│   ├── tests/
│   │   ├── helpers.ts
│   │   ├── bracket-generation.spec.ts
│   │   ├── error-paths.spec.ts
│   │   ├── full-tournament.spec.ts
│   │   ├── list-tournaments.spec.ts
│   │   └── race-condition.spec.ts
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   └── package.json
└── matchcast-frontend/
    ├── prettier.config.js
    ├── src/
    │   ├── routes/
    │   │   ├── +layout.svelte
    │   │   ├── +page.svelte
    │   │   ├── +error.svelte
    │   │   ├── layout.css
    │   │   ├── dashboard/
    │   │   │   ├── +page.svelte
    │   │   │   └── +page.ts
    │   │   ├── login/
    │   │   │   └── +page.svelte
    │   │   ├── register/
    │   │   │   └── +page.svelte
    │   │   ├── t/[slug]/
    │   │   │   ├── +page.svelte
    │   │   │   └── +page.ts
    │   │   └── tournaments/[id]/
    │   │       ├── +page.svelte
    │   │       └── +page.ts
    │   └── lib/
    │       ├── api/
    │       │   ├── auth.ts
    │       │   ├── health.ts
    │       │   └── tournament.ts
    │       ├── components/ui/
    │       │   ├── auth-form.svelte
    │       │   ├── bracket.svelte
    │       │   ├── button.svelte
    │       │   ├── card.svelte
    │       │   ├── card-content.svelte
    │       │   ├── card-header.svelte
    │       │   ├── input.svelte
    │       │   ├── label.svelte
    │       │   ├── score-modal.svelte
    │       │   ├── skeleton.svelte
    │       │   ├── spinner.svelte
    │       │   └── __tests__/
    │       │       ├── bracket.test.ts
    │       │       └── score-modal.test.ts
    │       ├── types/
    │       │   └── index.ts
    │       ├── utils.ts
    │       ├── index.ts
    │       ├── assets/
    │       │   └── favicon.svg
    │       └── hooks/
    ├── tests/
    │   └── mobile-responsive.spec.ts
    ├── vitest.config.ts
    ├── playwright.config.ts
    └── package.json
```

## 4. Skema Database

```text
User       id, email(unique), passwordHash, name, createdAt
Tournament id, slug(unique), name, sport, format("knockout"),
           status("draft"|"ongoing"|"finished"), ownerId→User
Team       id, name, seed?, tournamentId→Tournament(Cascade)
Match      id, round, matchOrder, homeTeamId→Team?, awayTeamId→Team?,
           homeScore?, awayScore?, winnerTeamId→Team?,
           status("scheduled"|"ongoing"|"finished"),
           tournamentId→Tournament(Cascade)
           @@index([tournamentId, round, matchOrder])
```

## 5. Endpoint API

| Method | Path | Auth | Deskripsi |
| --- | --- | --- | --- |
| GET | `/health` | ❌ | Health check → `{success, data}` |
| POST | `/auth/register` | ❌ | Daftar (pw max 128, rate 5/m/IP) |
| POST | `/auth/login` | ❌ | Login (rate 5/m/IP) |
| POST | `/auth/logout` | ❌ | Logout — clear token cookie |
| POST | `/tournaments` | ✅ | Buat turnamen |
| GET | `/tournaments` | ✅ | List turnamen milik user |
| GET | `/tournaments/:id` | ✅ | Detail + teams + matches |
| POST | `/tournaments/:id/teams` | ✅ | Tambah tim (draft only) |
| DELETE | `/tournaments/:id/teams/:teamId` | ✅ | Hapus tim (draft only) |
| POST | `/tournaments/:id/generate-bracket` | ✅ | Generate bracket |
| PATCH | `/matches/:id/start` | ✅ | scheduled → ongoing |
| PATCH | `/matches/:id/score` | ✅ | Update skor (integer only) |
| GET | `/t/:slug` | ❌ | Detail publik turnamen |
| GET | `/t/:slug/matches` | ❌ | List match publik (paginated) |

## 6. Token Desain

**Warna (dari layout.css `@theme`):**

```text
bg-base: #0B0E14        bg-surface: #161B26
border-subtle: #2A3142  accent-primary: #5B6EF5  accent-live: #FFB020
text-primary: #E8EAF0   text-muted: #8890A6
destructive: #E54B4B
```

**Tipografi:** display=Oswald, body=Inter, mono=JetBrains Mono

**Signature:** clipped-corner (`clip-path` polygon), `live-badge` amber + pulse.

## 7. Konvensi

- **Response API:** semua endpoint return
  `{ success, data?, error?: { message, code } }`
- **Error helper:** `DomainError` di `utils/route-handler.ts` — subclass dgn `message`, `code`, `statusCode`.
  `wrapHandler(fn)` otomatis catch `DomainError` → response konsisten.
- **Auth:** JWT via httpOnly cookie `token` atau `Authorization: Bearer`. Cookie
  otomatis di `credentials: "include"`.
- **Penamaan file:** routes = `resource.routes.ts`, services =
  `resource.service.ts`, Svelte components = PascalCase.
- **Penamaan endpoint:** plural (`/tournaments`, `/matches/:id/score`).
- **Error domain:** `TournamentError`, `BracketError`, `AuthError` — masing2
  punya `message`, `code`, `statusCode`. Route handler catch specific →
  reply konsisten. Error tak terduga → global `setErrorHandler` log, reply
  generic.
- **Skor:** integer non-negatif, validasi di `match.routes.ts` via `Number.isInteger`.
- **Format code:** Prettier config di `matchcast-frontend/prettier.config.js`:
  `useTabs: true`, `singleQuote: true`, `trailingComma: "none"`, `printWidth: 100`.
  Frontend: `bun run format` (prettier --write). Backend: manual.

## 8. Command Penting

### Backend (matchcast-backend/)

```bash
bun run src/index.ts      # dev server (port 3001)
bun run start             # production
bun run build             # prisma generate + migrate deploy
bun run typecheck         # TypeScript check
bun run test:unit         # Vitest
bun run test              # Playwright API
bun run test:ci           # typecheck + Playwright
bunx prisma migrate dev   # migrasi schema
bunx prisma studio        # GUI database
```

### Frontend (matchcast-frontend/)

```bash
bun run dev               # dev server (port 5173)
bun run build             # production build
bun run test:unit         # Vitest component
bun run test              # build + Playwright
bun run check             # svelte-check
```

### Testing

```bash
# Backend — all
cd matchcast-backend && bun run typecheck && bun run test:unit && bun run test

# Frontend — unit only (no DB)
cd matchcast-frontend && bun run test:unit
```

## 9. Aturan Kerja

1. **Skema Prisma:** jangan ubah tanpa konfirmasi.
2. **Dependency:** jangan tambah baru tanpa alasan. Gunakan existing dulu.
3. **Testing:** Playwright (`tests/*.spec.ts`) untuk API logic; Vitest
   (`src/**/*.test.ts`) untuk unit/component.
4. **Ambiguitas:** tanya dulu.
5. **Git:** staging hanya file yg sengaja diubah. Delete branch remote setelah
   merge.
6. **Scope:** jangan implementasi di luar permintaan.
7. **Keamanan:** tanpa `JWT_SECRET` → fatal + exit. Input di-trim & divalidasi
   (email regex, max length, skor integer). Rate limit auth 5/m/IP.

## 10. Prisma Atomic Patterns

- **updateMany with where guard:** `updateMany({ where: { id, status: "X" },
  data: { status: "Y" } })` — race-safe.
- **$transaction for multi-step:** score + propagateWinner + finish check in
  one `$transaction`; pass`tx: Prisma.TransactionClient`.
- **TransactionClient type:**
  `import type { Prisma } from "../generated/prisma/client"`.
- **Neon migrations:** `DATABASE_URL_UNPOOLED` di `prisma.config.ts` (bukan di
  `schema.prisma` — Prisma 7).
- **Match state machine:** `scheduled → ongoing → finished`. Score gate on
  `"ongoing"`, not `{ not: "finished" }`.
- **Cookie extraction:** `res.headersArray().filter(h => h.name ===
  "set-cookie")`.
- **Race test:** `Promise.allSettled` → filter status → assert success === 1.

## 11. CI Pipeline

```yaml
backend-test:
  postgres:16 service
  bun install
  prisma generate
  migrate deploy
  typecheck
  test:unit (Vitest)
  test (Playwright API)

frontend-test:
  bun install
  svelte-kit sync
  build
  test:unit (Vitest)
```

<!-- BEGIN:workflow -->
## Git workflow (Wajib!)

- **GitHub Flow:** `main` = production. Setiap kerja bikin branch baru.
- Saat user bilang "kerjain X": `git checkout main && git pull &&
  git checkout -b <tipe>/<nama>` otomatis.
  - Tipe: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `style/`
- Selesai → push + PR ke `main`. Merge sendiri. Delete branch.
- Body PR pake `-F` atau `--body-file`, jangan `\n` literal.
<!-- END:workflow -->
