# Migrasi Fullstack SvelteKit (Vercel) — Panduan Agent

Keputusan kunci di `docs/adr/0001-fullstack-sveltekit-vercel.md`. Glosari di `CONTEXT.md`.
 Target: satu app SvelteKit + `adapter-vercel`, `matchcast-backend/` dihapus di fase akhir.

## 1. Tujuan & Non-tujuan

Tujuan: satu deploy Vercel, satu kontrak tipe, cookie same-origin, tiap fase tetap deployable.

Non-tujuan (YAGNI — jangan dibangun sekarang):

- Rate-limit persisten (Upstash/Vercel KV). `@fastify/rate-limit` in-memory mati di lambda; skip MVP, tambah saat abuse nyata.
- tRPC / OpenAPI codegen / Zod. Validasi port apa adanya dari `auth.routes.ts`, `tournament.routes.ts`, `match.routes.ts`.
- Websocket / SSE realtime. Pertahankan polling 12s; perbaiki pile-up dengan `setTimeout` rekursif (P2.11) saja.
- Mobile API versioning, multi-klien, i18n baru, round-robin (skema tulis `"round_robin" (v2)` — abaikan).
- ISR untuk route authed. ISR hanya `/t/:slug` anonim.

## 2. Arsitektur target

```text
matchcast/
├── CONTEXT.md
├── docs/adr/
├── specs/
├── prisma/
│   ├── schema.prisma        # pindahan matchcast-backend/prisma/, output diperbarui
│   └── migrations/
├── src/
│   ├── lib/
│   │   ├── server/          # SERVER-ONLY. Prisma, services, auth. Jangan import dari klien.
│   │   │   ├── db.ts
│   │   │   ├── auth.ts
│   │   │   ├── tournament.service.ts
│   │   │   ├── bracket.service.ts
│   │   │   ├── errors.ts    # DomainError + subclass
│   │   │   └── __tests__/
│   │   ├── types/index.ts   # ApiSuccess/ApiErrorResponse + Team/Tournament/Match (tunggal)
│   │   ├── api/             # fetch relatif /api/*, credentials same-origin
│   │   └── components/ui/
│   ├── routes/
│   │   ├── api/             # +server.ts JSON. Mutasi + auth. Baca milik halaman sendiri JANGAN lewat HTTP.
│   │   │   ├── health/+server.ts
│   │   │   ├── auth/register/+server.ts
│   │   │   ├── auth/login/+server.ts
│   │   │   ├── auth/logout/+server.ts
│   │   │   ├── tournaments/+server.ts            # GET + POST
│   │   │   ├── tournaments/[id]/+server.ts      # GET detail (fallback; utama via +page.server.ts)
│   │   │   ├── tournaments/[id]/teams/+server.ts
│   │   │   ├── tournaments/[id]/teams/[teamId]/+server.ts
│   │   │   ├── tournaments/[id]/generate-bracket/+server.ts
│   │   │   ├── matches/[id]/start/+server.ts
│   │   │   └── matches/[id]/score/+server.ts
│   │   ├── dashboard/+page.server.ts             # listTournaments langsung, redirect /login saat AuthError
│   │   ├── tournaments/[id]/+page.server.ts
│   │   ├── t/[slug]/+page.server.ts              # publik langsung, boleh ISR 60s
│   │   └── login/, register/, +error.svelte
│   ├── hooks.server.ts      # verify JWT → event.locals.user
│   ├── app.html, error.html
├── svelte.config.js         # BARU. adapter-vercel. Hari ini tidak ada (adapter inline di vite.config.ts).
├── vite.config.ts           # bersihkan adapter inline, pindah ke svelte.config.js
├── static/, tests/
└── package.json             # tunggal, nama matchcast, gabungan script
```

Aturan batas:

- `$lib/server/*` tidak boleh diimport file klien (`.svelte` tanpa `server`, `+page.ts`). SvelteKit block via `$lib/server` alias — hormati.
- Baca milik halaman sendiri: `+page.server.ts` panggil service langsung. Jangan `fetch('/api/...')` dari server load sendiri (roundtrip sia-sia).
- Mutasi dari browser: `fetch` relatif ke `/api/...`, `credentials: 'same-origin'`. Hapus `VITE_API_URL` + `API_BASE` absolut (`lib/api/auth.ts:8-9`, `tournament.ts:3`, `health.ts:3-4`).
- Tidak ada direktori `api/` di root proyek (milik Vercel Functions). Semua API = SvelteKit `routes/api/`.

## 3. Pemetaan endpoint (14)

Envelope dipertahankan: `{ success: true, data }` / `{ success: false, error: { message, code } }`.

| # | Semula (Fastify) | Target SvelteKit | Catatan port |
|---|---|---|---|
| 1 | `GET /health` (`health.routes.ts:4`) | `routes/api/health/+server.ts` | Return `{ success: true, data: { status: 'ok' } }`. Samakan dengan harapan `lib/api/health.ts`. |
| 2 | `POST /auth/register` | `routes/api/auth/register/+server.ts` | Port `validateRegisterInput` 1:1 (`auth.routes.ts:13-33`): trim, regex email, max 254/100, pw 8-128. Service `auth.service.ts:10-23`. 201. |
| 3 | `POST /auth/login` | `routes/api/auth/login/+server.ts` | Port `validateLoginInput` (`auth.routes.ts:35-48`). `login()` generik "Invalid credentials" (`auth.service.ts:25-37`). Sign JWT 7d via `jose`, `cookies.set('token', ...)` httpOnly, lax, `secure` prod, `maxAge` 7 hari. Return `{ token, user }` (kompat lama). |
| 4 | `POST /auth/logout` | `routes/api/auth/logout/+server.ts` | `cookies.delete('token', { path: '/' })`. Return `{ success: true, data: null }`. |
| 5 | `POST /tournaments` | `routes/api/tournaments/+server.ts` POST | Guard auth via `locals.user`, port cek nama ≤100 + sport wajib (`tournament.routes.ts:20-38`). Service `createTournament`. 201. |
| 6 | `GET /tournaments` | `dashboard/+page.server.ts` (utama) + GET di file sama | `listTournaments(ownerId)` order `createdAt desc` + `_count.teams`. |
| 7 | `GET /tournaments/:id` | `tournaments/[id]/+page.server.ts` (utama) | `getTournament(id, ownerId)` + `tournamentInclude` (teams asc, matches round+matchOrder + home/away/winner select). |
| 8 | `POST /tournaments/:id/teams` | `routes/api/tournaments/[id]/teams/+server.ts` POST | Port cek nama ≤50 (`tournament.routes.ts:78-87`) + `addTeam` guard `status === 'draft'` (`tournament.service.ts:111-117`). 201. |
| 9 | `DELETE /tournaments/:id/teams/:teamId` | `.../teams/[teamId]/+server.ts` DELETE | `deleteTeam` atomic `deleteMany` + `count === 0` → 404 (`tournament.service.ts:143-148`). Return `data: null`. |
| 10 | `POST /tournaments/:id/generate-bracket` | `.../generate-bracket/+server.ts` POST | `generateBracket`: min 2 tim, shuffle, `nextPowerOf2`/bye, `$transaction` lock `updateMany status draft→ongoing` + persist seed + create matches. |
| 11 | `PATCH /matches/:id/start` | `routes/api/matches/[id]/start/+server.ts` PATCH | `startMatch`: 404, owner 403, harus `scheduled`, tim lengkap, `updateMany` guard race (`bracket.service.ts:266-276`). |
| 12 | `PATCH /matches/:id/score` | `routes/api/matches/[id]/score/+server.ts` PATCH | Port cek eksistensi + `Number.isInteger` + ≥0 di route (`match.routes.ts:26-58`); larang seri + tentukan winner di service (`bracket.service.ts:313-337`). Transaksi: `updateMany status ongoing→finished` + `propagateWinner` + finish turnamen. |
| 13 | `GET /t/:slug` | `t/[slug]/+page.server.ts` (utama) | `getPublicTournamentBySlug` + include sama. 404 jika slug asing. |
| 14 | `GET /t/:slug/matches?page&limit` | `t/[slug]` load + `routes/api/t/[slug]/matches/+server.ts` GET (untuk polling klien) | Port clamp `page ≥ 1`, `limit 1-100 default 50` (`public.routes.ts:43-47`). Return `{ matches, pagination }`. |

## 4. Pemetaan file service

| Semula | Target | Aksi |
|---|---|---|
| `src/prisma-client.ts` (`pg.Pool` + `PrismaPg`) | `src/lib/server/db.ts` | Tulis ulang Neon HTTP + singleton `globalThis`. Hapus shim `emitWarning` pg. |
| `src/utils/route-handler.ts` (`DomainError`, `wrapHandler`) | `src/lib/server/errors.ts` + `src/lib/server/respond.ts` | `DomainError` dipertahankan 1:1. `wrapHandler` Fastify → helper `json()`/`fail()` + `try/catch DomainError` per `+server.ts` / `+page.server.ts` (`error()` SvelteKit untuk halaman). |
| `src/plugins/auth.ts` (`makeOnRequestAuth`, cookie/Bearer) | `src/hooks.server.ts` + `src/lib/server/auth.ts` | Verify `jose`, isi `locals.user`. Terima cookie `token` (utama); Bearer opsional, jangan wajib. |
| `src/services/auth.service.ts` | `src/lib/server/auth-service.ts` atau gabung `auth.ts` | Port 1:1 (`bcryptjs`, SALT 12, select tanpa hash). |
| `src/services/tournament.service.ts` | `src/lib/server/tournament.service.ts` | Port 1:1 termasuk `slugify`/`uniqueSlug`/`tournamentInclude`. |
| `src/services/bracket.service.ts` | `src/lib/server/bracket.service.ts` | Port 1:1 termasuk pola atomik (`updateMany` guard, `$transaction`, `Prisma.TransactionClient`). |
| `src/lib/api/*.ts` | sama, sederhanakan | Hapus base absolut, pakai path relatif + `event.fetch` di load. Satu `request()` + `ApiResult`. |
| `src/lib/types/index.ts` | tetap, jadi tunggal | Hapus duplikat `ApiSuccess` di `api/auth.ts:1`. Tambah `updatedAt` konsisten bila dipakai. |
| `tests/*.spec.ts` (5 backend) | `tests/api/*.spec.ts` | Tulis ulang target preview SvelteKit tunggal (lihat §9). |
| `services/__tests__/bracket.service.test.ts` | `src/lib/server/__tests__/` | Pindah + sesuaikan import `$lib/server`. |

## 5. Fase eksekusi (berurutan, tiap fase deployable)

### Fase 0 — Fondasi repo (tanpa ubah perilaku)

1. `svelte.config.js` baru dengan `adapter-vercel`; bersihkan adapter inline di `vite.config.ts:8-20`.
2. `package.json` tunggal (`matchcast`, hapus typo `tournament-backend`/`turnament-frontend`); gabung script `dev/build/check/test:unit/test`; Prettier samakan `useTabs: true, singleQuote: true, trailingComma: 'none', printWidth: 100`.
3. Pindah `matchcast-backend/prisma/` → `prisma/` root; perbarui `output` generator ke `../src/lib/generated/prisma`, `prisma.config.ts` schema path; `bunx prisma generate` hijau.
4. Verify: `bun run check`, `bun run build` lokal hijau. Backend lama tetap jalan, belum dihapus.

### Fase 1 — DB + auth di serverless

1. Tambah `@sveltejs/adapter-vercel`, `jose`, `@prisma/adapter-neon`, `@neondatabase/serverless`. Jangan tambah lain tanpa alasan (AGENTS.md §2).
2. `src/lib/server/db.ts`: Neon HTTP + `globalThis` singleton. `DATABASE_URL` wajib fatal saat boot (ganti `prisma-client.ts:5-9`); bedakan pooled/unpooled sesuai panel Neon.
3. `src/lib/server/errors.ts` + `respond.ts`; `src/lib/server/auth.ts` (sign/verify 7d, cookie opts); `src/hooks.server.ts` (verify → `locals.user`, tanpa `JWT_SECRET` di prod = fatal + exit, ikut `index.ts:18-21`).
4. Endpoint 1-4 (§3) + `+page.server.ts` login/register redirect bila sudah login.
5. Verify: register → login → cookie `token` httpOnly → logout hapus; tanpa secret di prod = boot gagal dengan log jelas.

### Fase 2 — Turnamen + tim

1. Pindah `tournament.service.ts` 1:1; endpoint 5-9.
2. `dashboard/+page.server.ts` + `tournaments/[id]/+page.server.ts` panggil langsung; `redirect(302, '/login')` saat `AuthError`.
3. Verify: buat turnamen → tambah/hapus tim di draft → tambah tim setelah bracket = 403 `BRACKET_LOCKED`.

### Fase 3 — Bracket + match + publik

1. Pindah `bracket.service.ts` 1:1 (jangan refactor algoritma + pola atomik) dengan SATU
   perkecualian terdokumentasi: `planBracketMatches` restart `matchOrder` per ronde.
   Backend lama nomor global (final 4-tim = `(2,3)`), sementara `propagateWinner`
   mencari slot per-ronde (`ceil(order/2)`), sehingga pemenang tak pernah terisi —
   test `full-tournament.spec.ts` backend gagal di `main` karenanya. Nomor per-ronde
   juga cocok dengan tampilan `R{round}·M{order}` di `bracket.svelte`.
   Regresi dikunci `src/lib/server/__tests__/bracket.service.test.ts` (`planBracketMatches`).
2. Endpoint 10-12 + 14; halaman `t/[slug]` server load + polling `setTimeout` rekursif.
3. `export const config = { isr: { expiration: 60 } }` hanya di route publik anonim.
4. Verify: full alur 4 tim → start → skor → propagasi → final → turnamen `finished`; skor seri/negatif/non-integer ditolak; double-generate sequential = 409; race `start`/`score` = tepat 1 sukses.

### Fase 4 — Hapus backend + rapikan

1. Hapus `matchcast-backend/`; sederhanakan `playwright.config.ts` ke satu `webServer` (preview `:5173`); satu CI job (ganti 2 job di `test.yml`); perbarui `README`/`DEPLOYMENT`.
2. Env Vercel: `DATABASE_URL`, `JWT_SECRET`, region dekat Neon, `maxDuration` default Hobby cukup.
3. Verify: `check` + `test:unit` + `test` hijau dari root; tidak ada import `$lib/server` dari klien; tidak ada sisa `VITE_API_URL`/`localhost:3001`.

## 6. Best practice Svelte (wajib)

- Runes mode (`$state`, `$derived`, `$effect`) — proyek sudah paksa di `vite.config.ts:11-12`; komponen baru runes-only.
- Data di `+page.server.ts` (`load`), bukan `onMount` + spinner. `event.fetch` di load, `fetch` browser di komponen. Sudah benar di `dashboard/+page.ts`, `t/[slug]/+page.ts`, `tournaments/[id]/+page.ts` — naikkan ke `.server.ts` agar bisa import service langsung.
- Mutasi JSON = `+server.ts` (`request.json()`, `json()` dari `@sveltejs/kit`). `error(401/404)` untuk halaman, `{ success: false, error }` untuk API.
- `hooks.server.ts` hanya auth/populate `locals`; tanpa logic bisnis.
- Aksesibilitas modal skor tetap (hasil P1.5): `svelte:window onkeydown`, `role="dialog" aria-modal`, focus trap. Jangan regresi saat pindah.
- Styling pakai token `@theme` (`var(--color-*)`), bukan hex hardcode (P2.8).

## 7. Best practice TS (wajib)

- `strict: true` + pertahankan `noUncheckedIndexedAccess` ala backend. Perbaiki index access (`seeds[i]` → guard) alih-alih non-null assertion.
- `verbatimModuleSyntax`: `import type` untuk tipe. Validasi boundary: `unknown` → narrow manual (portif eksplisit `Number.isInteger`, trim, max-length) sebelum service.
- Satu sumber tipe (`$lib/types`): `ApiSuccess<T>`, `ApiErrorResponse`, `ApiResult<T>`, `Team/Tournament/Match/PaginatedMatches`. Tipe Prisma tidak bocor mentah ke klien bila select berbeda — definisikan DTO.
- Jangan `as any` / `(err as any).statusCode` (`index.ts:56-59` lama). Pakai `instanceof DomainError` + `error()` SvelteKit.
- Fungsi murni (`slugify`, `nextPowerOf2`, `shuffleArray`, `planBracketMatches`) tetap export untuk Vitest.

## 8. Komentar: hanya bila perlu

- Tanpa komentar untuk yang jelas dari nama (`// get user by id` dilarang).
- Boleh: kenapa non-obvious (bye `P - n`, guard `updateMany` anti-race, `globalThis` anti pool-exhaust, ISR hanya anonim), trade-off YAGNI (kenapa rate-limit ditunda), dan peringatan bahaya (jangan import `$lib/server` di klien).
- Maks 1-2 baris. Bahasa Inggris di kode. Hapus komentar `ponytail`/`istanbul ignore` lama bila tidak relevan, atau port seperlunya bersama test.

## 9. Testing

- Vitest tetap: pure bracket (`nextPowerOf2`, `shuffleArray`, `propagateWinner` via skor), `slugify`/`uniqueSlug` (mock). Pindah ke `src/lib/server/__tests__/`.
- Playwright: satu server (preview SvelteKit). Port 5 spec backend: full-tournament, bracket-generation, error-paths (tied/negatif/non-integer/404/401), list-tournaments (isolasi user, sort, empty), race-condition (`Promise.allSettled`, tepat 1 sukses). Helper `loginUser/createTournament/addTeam/generateBracket` ganti base ke preview + cookie SvelteKit.
- Mobile-responsive spec dipertahankan; hilangkan skip diam-diam (P2.16).
- DoD tiap fase: `bun run check` + `bun run test:unit` + `bun run test` hijau; tidak ada regresi P1.5/P2.11.

## 10. Risiko & mitigasi

- Pool exhaust di Vercel → Neon HTTP + singleton; jangan bawa `pg.Pool`.
- Secret hilang → fatal boot di server (bukan fallback dev diam-diam di prod).
- Cookie cross-origin hilang → selesai karena same-origin; jangan bawa `CORS_ORIGIN`/`VITE_API_URL`.
- Bracket regresi → larangan refactor algoritma di Fase 3; hanya pindah + test.
