# Matchcast — AGENTS.md

## 1. Deskripsi

Platform manajemen turnamen olahraga amatir. Penyelenggara bikin bracket,
kelola skor, peserta/penonton lihat jadwal & skor real-time via link publik
tanpa login.

## 2. Tech Stack

| Lapisan      | Stack                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| App          | SvelteKit 2 fullstack + TypeScript + Tailwind CSS 4 + shadcn-svelte    |
| Database     | PostgreSQL (Neon HTTP di Vercel, pg Pool lokal) via Prisma 7           |
| Runtime      | Bun (Node 22 di deploy Vercel)                                         |
| Auth         | JWT via `jose`, httpOnly cookie, bcryptjs                              |
| Testing API  | Playwright — `tests/api/*.spec.ts` + `tests/mobile-responsive.spec.ts` |
| Testing Unit | Vitest — `src/**/*.test.ts`                                            |
| Linting      | Prettier + ESLint                                                      |
| Format       | Prettier (useTabs: true, singleQuote: true)                            |
| Font         | Inter, Oswald, JetBrains Mono via @fontsource                          |
| Ikon         | svelte-radix                                                           |
| CI           | GitHub Actions — check + vitest + build + Playwright                   |

## 3. Struktur Folder

```text
matchcast/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── specs/
│   ├── improvement-plan.md
│   └── fullstack-migration.md
├── docs/adr/
├── .github/workflows/
│   └── test.yml
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prisma.config.ts
├── svelte.config.js         # adapter-vercel (runtime nodejs22.x)
├── src/
│   ├── hooks.server.ts      # verify JWT → locals.user
│   ├── app.d.ts             # Locals { user, tokenInvalid }
│   ├── routes/
│   │   ├── api/             # +server.ts JSON (auth, tournaments, matches, t)
│   │   ├── dashboard/+page.server.ts
│   │   ├── tournaments/[id]/+page.server.ts
│   │   └── t/[slug]/+page.server.ts   # ISR 60s
│   └── lib/
│       ├── server/          # SERVER-ONLY: db, auth, services, respond, errors
│       ├── api/             # request.ts helper + fetch relatif /api/*
│       ├── bracket.ts       # groupByRound/maxRound (satu-satunya pemilik grouping)
│       ├── types/index.ts
│       └── components/ui/
├── tests/
│   ├── api/                 # 5 spec + helpers.ts
│   └── mobile-responsive.spec.ts
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

| Method | Path                                    | Auth | Deskripsi                        |
| ------ | --------------------------------------- | ---- | -------------------------------- |
| GET    | `/api/health`                           | ❌   | Health check → `{success, data}` |
| POST   | `/api/auth/register`                    | ❌   | Daftar (pw 8-128)                |
| POST   | `/api/auth/login`                       | ❌   | Login, set cookie `token`        |
| POST   | `/api/auth/logout`                      | ❌   | Logout — clear token cookie      |
| POST   | `/api/tournaments`                      | ✅   | Buat turnamen                    |
| GET    | `/api/tournaments`                      | ✅   | List turnamen milik user         |
| GET    | `/api/tournaments/:id`                  | ✅   | Detail + teams + matches         |
| POST   | `/api/tournaments/:id/teams`            | ✅   | Tambah tim (draft only)          |
| DELETE | `/api/tournaments/:id/teams/:teamId`    | ✅   | Hapus tim (draft only)           |
| POST   | `/api/tournaments/:id/generate-bracket` | ✅   | Generate bracket                 |
| PATCH  | `/api/matches/:id/start`                | ✅   | scheduled → ongoing              |
| PATCH  | `/api/matches/:id/score`                | ✅   | Update skor (integer only)       |
| GET    | `/api/t/:slug`                          | ❌   | Detail publik turnamen           |
| GET    | `/api/t/:slug/matches`                  | ❌   | List match publik (paginated)    |

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
- **Error helper:** `DomainError` di `lib/server/errors.ts` — subclass dgn `message`, `code`, `statusCode`.
  `failure(err)` di `lib/server/respond.ts` map `DomainError` → response konsisten;
  `authCheck(event)` bedakan token hilang (`UNAUTHORIZED`) vs token rusak (`INVALID_TOKEN`).
- **Auth:** JWT via httpOnly cookie `token` atau `Authorization: Bearer`, verify di
  `hooks.server.ts` → `locals.user`. Tanpa `JWT_SECRET` di prod → fatal + exit.
- **Server boundary:** `$lib/server/*` tidak boleh diimport kode klien. Baca milik
  halaman sendiri via `+page.server.ts` langsung ke service; mutasi browser via
  `fetch` relatif `/api/*` (same-origin, tanpa `VITE_API_URL`).
- **Penamaan file:** services = `resource.service.ts`, Svelte components = PascalCase,
  API = `routes/api/.../+server.ts`.
- **Penamaan endpoint:** plural (`/api/tournaments`, `/api/matches/:id/score`).
- **Error domain:** `TournamentError`, `BracketError`, `AuthError` — masing2
  punya `message`, `code`, `statusCode`.
- **Skor:** integer non-negatif, validasi di `+server.ts` via `Number.isInteger`.
- **Navigasi:** semua `href` internal dan `goto()` wajib lewat `resolve()` dari
  `$app/paths` (aturan `svelte/no-navigation-without-resolve`). Bentuk route-id:
  `resolve('/tournaments/[id]', { id })`, path biasa: `resolve('/login')`.
- **Error page:** `+error.svelte` kit hanya terima prop `error`; status baca dari
  `page.status` (`$app/state`). `{#each}` selalu ber-key, misal `(t.id)`.
- **svelte-ignore:** `svelte/no-unused-svelte-ignore` off di `eslint.config.js`
  karena eslint-plugin-svelte 3.20 tidak kenal kode a11y svelte 5.56; sumber
  kebenaran a11y adalah `svelte-check`, bukan rule itu.
- **Komentar:** hanya bila perlu (kenapa non-obvious, trade-off YAGNI, peringatan bahaya).
  Maks 1-2 baris, Inggris di kode.
- **SSR seed:** `t/[slug]/+page.svelte` sengaja `$state(data.tournament)` + poll
  12 detik (`svelte-ignore state_referenced_locally`, intentional). Halaman admin
  pakai pola `refreshed ?? data` + `$derived`, bukan copy props.
- **YAGNI:** tanpa rate-limit persisten, tanpa tRPC/OpenAPI/Zod, tanpa websocket.
  Lihat `specs/fullstack-migration.md` §1 untuk daftar no.
- **Format code:** Prettier: `useTabs: true`, `singleQuote: true`,
  `trailingComma: "none"`, `printWidth: 100`. `bun run format`.

## 8. Command Penting

```bash
bun run dev               # dev server (port 5173, API same-origin /api/*)
bun run build             # production build (adapter-vercel)
bun run preview           # preview build lokal
bun run check             # svelte-check (typecheck)
bun run test:unit         # Vitest (src/**/*.test.ts)
bun run test              # build + Playwright (butuh DATABASE_URL + JWT_SECRET)
bun run lint              # prettier --check + eslint
bun run format            # prettier --write
bunx prisma generate      # generate client ke src/lib/generated/prisma
bunx prisma migrate dev   # migrasi schema (dev)
bunx prisma migrate deploy # migrasi schema (prod/CI)
bunx prisma studio        # GUI database
```

Test API butuh Postgres jalan + migrasi applied. `.env` cukup, tanpa
export manual (`db.ts` load `.env` via `dotenv/config`, dotenv sudah
ikut transitif via prisma). Vercel unaffected, platform vars menang.

```bash
bunx prisma migrate deploy
bun run test
```

## 9. Aturan Kerja

1. **Skema Prisma:** jangan ubah tanpa konfirmasi.
2. **Dependency:** jangan tambah baru tanpa alasan. Gunakan existing dulu.
3. **Testing:** Playwright (`tests/api/*.spec.ts`) untuk API logic; Vitest
   (`src/**/*.test.ts`) untuk unit/component.
4. **Ambiguitas:** tanya dulu.
5. **Git:** staging hanya file yg sengaja diubah. Delete branch remote setelah
   merge.
6. **Scope:** jangan implementasi di luar permintaan.
7. **Keamanan:** tanpa `JWT_SECRET` di prod → fatal + exit. Input di-trim &
   divalidasi (email regex, max length, skor integer). Tanpa rate-limit
   persisten (YAGNI, lihat ADR-0001).

## 10. Prisma Atomic Patterns

- **Neon HTTP larangan:** tanpa interactive `$transaction`, tanpa `updateMany`,
  tanpa create-with-include (implicit tx). Semua lempar
  "Transactions are not supported in HTTP mode".
- **Guarded raw UPDATE:** lock status via single statement, first writer wins:
  `UPDATE "Match" SET status='ongoing' WHERE id=${id} AND status='scheduled'
RETURNING id` — rows 0 = kalah race (409/400, kontrak race test sama).
- **Plain create + re-read:** `match.create` tanpa include (Promise.all ok),
  relasi baca ulang via `findMany include homeTeam,awayTeam`.
- **P2002 = kalah race:** create tabrakan unique → map ke 409 BRACKET_EXISTS.
- **Neon driver:** URL mengandung `neon.tech` → `PrismaNeonHttp`; selain itu
  `PrismaPg` Pool (lokal). Lihat `lib/server/db.ts`.
- **Match state machine:** `scheduled → ongoing → finished`. Score gate on
  `"ongoing"`, not `{ not: "finished" }`.
- **Nomor match per ronde:** `matchOrder` restart tiap ronde (final 4-tim =
  `(2,1)`). `propagateWinner` cari slot via `ceil(order/2)`.
- **Cookie extraction:** `res.headersArray().filter(h => h.name ===
"set-cookie")`.
- **Race test:** `Promise.allSettled` → filter status → assert success === 1.
- **Test cleanup:** hapus `Tournament` dulu (FK owner RESTRICT), baru `User`.

## 11. CI Pipeline

```yaml
test: # single job
  postgres:16 service
  bun install
  prisma generate
  migrate deploy
  check (svelte-check)
  test:unit (Vitest)
  build (adapter-vercel)
  playwright install chromium
  test (Playwright: tests/api + mobile)
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
