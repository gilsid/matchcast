# Matchcast — Improvement Plan

> **STALE pasca-ADR-0001 — jangan eksekusi buta.** Review 2026-05-02 menunjuk path
> `matchcast-backend/` + `matchcast-frontend/` yang dilebur ke satu app SvelteKit
> (lihat `docs/adr/0001-fullstack-sveltekit-vercel.md`). Urutan eksekusi =
> `specs/fullstack-migration.md`. Tabel di bawah hasil verifikasi kode saat migrasi
> direncanakan; status `CEK` = verifikasi ulang di fase tercantum.
>
> | ID    | Status        | Keterangan                                                                                     |
> | ----- | ------------- | ---------------------------------------------------------------------------------------------- |
> | P1.1  | DONE          | Guard draft ada (`tournament.service.ts:111`)                                                  |
> | P1.2  | DONE          | Max 128 ada (`auth.routes.ts:31`)                                                              |
> | P1.3  | OPEN→PORT     | Tulis ulang ke `tests/api/*` (Fase 3-4)                                                        |
> | P1.4  | DONE→SIMPLIFY | CI ada; sederhanakan 1 job (Fase 4)                                                            |
> | P1.5  | SEBAGIAN      | `role/aria-modal` ada (`score-modal.svelte:85-86`); sisa focus trap + `svelte:window` (Fase 3) |
> | P1.6  | DONE          | `onMount(checkHealth)` (`+page.svelte:25`)                                                     |
> | P1.7  | DONE          | `+error.svelte` ada                                                                            |
> | P2.1  | REMAP         | Duplikat validasi skor masih ada; rapikan saat port (Fase 3)                                   |
> | P2.2  | DONE          | `endsWith` fix (`public.routes.ts:14-16`)                                                      |
> | P2.3  | DONE→PORT     | `wrapHandler` ada; jadi `respond.ts` (Fase 1)                                                  |
> | P2.4  | DONE          | `tournamentInclude` terekstrak (`tournament.service.ts:62`)                                    |
> | P2.5  | DONE          | Seed dipersist (`bracket.service.ts:200-205`)                                                  |
> | P2.6  | DONE→PORT     | Paginasi ada; port clamp 1-100/50 (Fase 3)                                                     |
> | P2.7  | DONE          | Validasi email login ada (`auth.routes.ts:43`)                                                 |
> | P2.8  | DONE          | Hex hardcode hilang dari `src`                                                                 |
> | P2.9  | DONE          | Import tunggal dari `$lib/types`                                                               |
> | P2.10 | OPEN          | Dashboard masih `<button>` (`+page.svelte:46,88`) (Fase 3)                                     |
> | P2.11 | DONE          | `setTimeout` rekursif (`t/[slug]/+page.svelte:32,37`)                                          |
> | P2.12 | DONE          | `deleteMany` atomik (`tournament.service.ts:143`)                                              |
> | P2.13 | SEBAGIAN      | `+page.ts` ada; naikkan ke `+page.server.ts` (Fase 2-3)                                        |
> | P2.14 | DONE          | `typecheck` ada                                                                                |
> | P2.15 | SEBAGIAN      | `cleanupUser` helper ada (`tests/helpers.ts:59`); wiring `afterAll` CEK (Fase 4)               |
> | P2.16 | CEK           | (Fase 4)                                                                                       |
> | P2.17 | CEK           | `utils.ts` masih ada (Fase 4)                                                                  |
> | P3.1  | DONE→CEK      | `bracket.test.ts` + `score-modal.test.ts` ada; kualitas CEK (Fase 4)                           |
> | P3.2  | DONE          | `bracket.service.test.ts` ada                                                                  |
> | P3.3  | OPEN→PORT     | Port ke `tests/api/*` (Fase 4)                                                                 |
> | P3.4  | OBSOLETE      | Hilang bersama `index.ts` (Fase 1)                                                             |
> | P3.5  | OBSOLETE      | Hilang bersama `plugins/auth.ts` (Fase 1)                                                      |
> | P3.6  | CEK           | (Fase 4)                                                                                       |
> | P3.7  | CEK           | (Fase 4)                                                                                       |
> | P3.8  | CEK           | (Fase 3)                                                                                       |
> | P3.9  | DONE          | Health terbungkus (`health.routes.ts:5`)                                                       |

Review date: 2026-05-02
Reviewers: 3 subagents (backend, frontend, testing/CI)
Source files: all `.ts`, `.svelte`, `.prisma`, test specs, package.json

---

## Phase 1 — Critical (before production)

### 🔴 P1.1 `addTeam` missing draft-status guard

**File:** `matchcast-backend/src/services/tournament.service.ts:121`
**Problem:** `addTeam` doesn't check tournament `status === "draft"`. Teams can be added after bracket generated, corrupting bracket matches.
**Fix:** Add `findFirst({ where: { id: tournamentId, ownerId, status: "draft" } })` guard at entry. Same pattern as `deleteTeam`.

### 🔴 P1.2 Password max-length missing

**File:** `matchcast-backend/src/routes/auth.routes.ts:31`
**Problem:** No upper bound on password length. Attacker sends 1MB string → bcrypt hashing DoS.
**Fix:** Add `password.length > 128` reject. bcryptjs truncates at 72 bytes anyway, so >72 is wasted CPU.

### 🔴 P1.3 Customer-facing error paths untested

**Files:**

- `matchcast-backend/tests/*.spec.ts`
- `test coverage gap analysis`

**Missing tests (hardest to find via manual QA):**

1. `DELETE /tournaments/:id/teams/:teamId` — 0 coverage
2. `PATCH /matches/:id/start` error paths — non-existent match, finished match, null team slots, other user's match
3. `PATCH /matches/:id/score` error paths — tied score, negative, non-integer, non-existent, unauthorized
4. `POST /tournaments/:id/generate-bracket` sequential double-generate (race test exists, sequential missing)
5. Auth error paths — duplicate email, wrong password, missing token, invalid token, expired token
6. `GET /t/:slug/matches` — 0 coverage, happy path + 404
7. `GET /tournaments/:id` error — non-existent ID, other user's tournament
8. `DELETE /tournaments/:id/teams/:teamId` error — non-existent team, bracket-locked tournament

**Fix:** Add Playwright API tests covering all above scenarios. ~20 test cases.

### 🔴 P1.4 No CI configuration

**Files:** root `/`, both `package.json`
**Problem:** Zero `.github/` or other CI config. Tests run only manually. Backend missing `typecheck` + `lint` scripts entirely.
**Fix:**

- `.github/workflows/test.yml` — install → prisma generate → migrate → test (backend + frontend)
- Backend `package.json` add: `"typecheck": "tsc --noEmit"`, `"lint": "prettier --check src/ tests/"`
- Pre-commit hooks (optional but recommended)

### 🔴 P1.5 Score modal a11y and keyboard handling

**File:** `matchcast-frontend/src/lib/components/ui/score-modal.svelte:56`
**Problems:**

1. Escape key handler on overlay div — doesn't fire when `<input>` is focused (event doesn't bubble from input)
2. No `aria-modal="true"` / `aria-labelledby`
3. No focus trap — Tab moves behind modal
4. Click-only handler on non-interactive div — no keyboard equivalent

**Fix:** Use `svelte:window onkeydown`, add `role="dialog" aria-modal="true" aria-labelledby`, implement focus trap (cycling between first/last focusable), add `onkeydown` for Enter/Space on backdrop.

### 🔴 P1.6 Landing page SSR health check crash

**File:** `matchcast-frontend/src/routes/+page.svelte:16`
**Problem:** `checkHealth()` called at module top-level — runs during SSR (fetch to localhost:3001 fails in server context). Server renders error state, client re-hydrates over it.
**Fix:** Move `checkHealth()` into `onMount`.

### 🔴 P1.7 No `+error.svelte`

**File:** `matchcast-frontend/src/routes/`
**Problem:** No custom error boundary. SvelteKit default error page is white/light — mismatches dark theme entirely.
**Fix:** Add `src/routes/+error.svelte` with dark-themed error display, consistent with `layout.css`.

---

## Phase 2 — Important (after Phase 1)

### 🟠 P2.1 Score validation duplicated route + service

**Files:** `tournament.routes.ts:104-105` + `bracket.service.ts:131`
**Problem:** Score non-negative and integer checks duplicated in route layer AND service layer. DRY violation, maintenance risk.
**Fix:** Keep validation in service layer (closer to data), drop from route. Route can keep field-existence check only.

### 🟠 P2.2 Public rate-limit `replace("s")` fragile

**File:** `matchcast-backend/src/routes/public.routes.ts:13`
**Problem:** `context.after?.replace("s", " detik")` only replaces first `"s"`. Input `"30s"` → `"30 detik"` (works by luck). Input `"1m"` → `"1m"` (no replacement).
**Fix:** Use unit-aware formatting — if after.endsWith("s") → `${seconds} detik`, else use raw value.

### 🟠 P2.3 Repetitive try/catch error handling in every route

**Files:** `auth.routes.ts`, `tournament.routes.ts`, `public.routes.ts`
**Problem:** Every route handler repeats same `try/catch (err instanceof XxxError) { reply.code(err.statusCode).send(...) }` pattern.
**Fix:** Extract reusable `wrapHandler(fn)` helper that catches domain errors and sends formatted response. Or use `onError` hook.

### 🟠 P2.4 Duplicate Prisma `include` block

**File:** `matchcast-backend/src/services/tournament.service.ts:60-119`
**Problem:** `getTournament` and `getPublicTournamentBySlug` each define identical `include` block (~30 lines) for teams + matches.
**Fix:** Extract `const tournamentInclude = { teams: true, matches: { include: {...}, orderBy: {...} } }` as shared constant.

### 🟠 P2.5 Team seeds computed but not persisted

**File:** `matchcast-backend/src/services/bracket.service.ts:57-62`
**Problem:** Bye logic computes team placements (which teams get byes) in-memory. Schema has `Team.seed Int?` but never written.
**Fix:** After `generateBracket` computes seed assignments, persist them with `prisma.team.update({ where: { id }, data: { seed } })` in same transaction.

### 🟠 P2.6 Public endpoints no pagination

**File:** `matchcast-backend/src/routes/public.routes.ts:23,30`
**Problem:** `/t/:slug` returns all teams + matches in one response. For 128-team tournament, payload is large.
**Fix:** Add `?page=&limit=` params on matches. For now, keep teams inline (few hundred max).

### 🟠 P2.7 Login doesn't validate email format

**File:** `matchcast-backend/src/routes/auth.routes.ts:57`
**Problem:** Login path accepts any string as email. Register validates format. Inconsistent — user gets "invalid credentials" instead of "invalid format".
**Fix:** Add same email regex check as register, with consistent error.

### 🟠 P2.8 Frontend hardcoded theme colors

**Files:** `bracket.svelte:148-167`, `t/[slug]/+page.svelte:65`
**Problem:** `#2A3142` and `#5B6EF5` hardcoded in `<style>` block and inline `style=""`. If theme changes in `layout.css`, bracket visually breaks.
**Fix:** Use CSS custom properties from `@theme` — `var(--color-border-subtle)`, `var(--color-accent-primary)`.

### 🟠 P2.9 Duplicate API type definitions

**Files:** `auth.ts:6-11`, `tournament.ts:16-24`, `types/index.ts`
**Problem:** `ApiSuccess<T>` and `ApiErrorResponse` defined identically in 2 files. `types/index.ts` has unused `ApiResponse`/`ApiError`.
**Fix:** Export shared types from `$lib/types`, import in both files. Remove dead types.

### 🟠 P2.10 Dashboard cards use `<button>` not `<a>`

**File:** `matchcast-frontend/src/routes/dashboard/+page.svelte:83`
**Problem:** Tournament list items are `<button>` elements — lost link semantics (no right-click → open in new tab, no middle-click, no share target).
**Fix:** Use `<a href={/tournaments/${t.id}}>` styled as card. SvelteKit intercepts client-side navigation.

### 🟠 P2.11 Public page polling may pile up

**File:** `matchcast-frontend/src/routes/t/[slug]/+page.svelte:28`
**Problem:** `setInterval(load, 12000)` fires every 12s regardless of whether previous fetch completed. If network slow, multiple requests overlap.
**Fix:** Recursive `setTimeout` — `load()` calls `setTimeout(load, 12000)` on completion.

### 🟠 P2.12 `addTeam` has race window between read + delete

**File:** `matchcast-backend/src/services/tournament.service.ts:146`
**Problem:** `findFirst` tournament → `findFirst` team → `delete`. Two reads before write. Concurrent calls could both pass checks.
**Fix:** Use `deleteMany({ where: { id, tournamentId } })` → check `count === 1`. Single trip, atomic.

### 🟠 P2.13 No async `load` functions / SSR streaming

**File:** all frontend route pages
**Problem:** Every page fetches data in component `onMount` + shows loading spinner. SvelteKit `+page.ts` `load` functions run before render (SSR + streaming). Page content appears on first paint without spinner flash.
**Fix:** Move data fetching to `+page.ts` `load` functions. Use `$page.data` in components. Benefit: SSR, streaming, no loading flash.

### 🟠 P2.14 Backend missing typecheck + lint scripts

**File:** `matchcast-backend/package.json`
**Problem:** `tsconfig.json` has `strict: true` but `tsc --noEmit` absent from scripts. Bun runtime skips full type-check — errors invisible. No eslint/prettier.
**Fix:** Add `"typecheck": "tsc --noEmit"`, `"lint": "prettier --check src/ tests/"`. Add devDeps if missing.

### 🟠 P2.15 No test DB cleanup

**Files:** `tests/*.spec.ts`
**Problem:** Test users/tournaments accumulate across runs. Unique email via `Date.now()` prevents collisions, but DB bloat over time.
**Fix:** In `beforeAll`, register unique user. In `afterAll`, delete test user (cascades to tournaments/teams/matches). Or use test DB transaction rollback.

### 🟠 P2.16 mobile-responsive test silent skip

**File:** `matchcast-frontend/tests/mobile-responsive.spec.ts` line ~263
**Problem:** `test.beforeAll` catch sets `setupFailed = true`, all 5 tests `test.skip(setupFailed, ...)` → silently skipped with zero failure indication.
**Fix:** Use `test.skip(!!setupFailed, 'setup failed')` with reason, or fail on setup failure instead of silently skipping.

### 🟠 P2.17 Frontend dependencies: dead code

**Files:** `matchcast-frontend/package.json`, `src/lib/utils.ts`
**Problem:** `class-variance-authority`, `tailwind-variants` in deps but never used. `utils.ts` defines `cn()` with `clsx` + `twMerge` but no component imports it.
**Fix:** Remove `cva`, `tailwind-variants` from deps. Remove `utils.ts` or keep if planned.

---

## Phase 3 — Nice to Have (tech debt)

### 🟡 P3.1 No component tests

**File:** frontend (all)
**Gap:** `bracket.svelte` and `score-modal.svelte` have no component-level tests. Bracket rendering logic (round grouping, connector visibility) is untested.
**Fix:** Add Playwright component tests or Vitest unit tests for bracket logic.

### 🟡 P3.2 No unit tests for core logic

**Files:** `bracket.service.ts` (shuffleArray, nextPowerOf2, propagateWinner), `tournament.service.ts` (slugify)
**Gap:** Core algorithmic logic only tested via e2e tests. Unit tests would surface edge cases faster.
**Fix:** Extract pure functions, add Vitest unit tests.

### 🟡 P3.3 `GET /tournaments` list coverage

**File:** `matchcast-backend/tests/`
**Gap:** List tournaments endpoint only implicitly tested via full-tournament spec. Never verifies: only user's tournaments returned, sorted by date, empty list for new user.
**Fix:** Add dedicated list test.

### 🟡 P3.4 Backend `(err as any).statusCode` cast

**File:** `matchcast-backend/src/index.ts:47`
**Problem:** Casts to `any` loses type safety. Use typed Fastify error interface.
**Fix:** `err instanceof FastifyError` or branded interface.

### 🟡 P3.5 `makeOnRequestAuth` unnecessary async

**File:** `matchcast-backend/src/plugins/auth.ts:22`
**Problem:** Function returns `async` but contains zero `await`. Adds microtask overhead.
**Fix:** Remove `async`.

### 🟡 P3.6 Frontend dead code / unused classes

**File:** `layout.css:65-69`
**Gap:** `.live-pulse` class defined but never used. `.live-badge` duplicates the animation.
**Fix:** Remove `.live-pulse`.

### 🟡 P3.7 Frontend: `@tailwindcss/forms` may conflict

**File:** `layout.css:6`
**Problem:** Plugin loaded but all inputs use custom `clipped-sm` classes. Plugin adds default styles that could conflict with custom styling.
**Fix:** Test with plugin unloaded. If no regression, remove.

### 🟡 P3.8 No error skeleton/spinner patterns

**File:** all frontend pages
**Gap:** Loading states use plain text "Memuat..." only. No skeleton screens or branded spinner.
**Fix:** Add skeleton component as pattern for all async pages.

### 🟡 P3.9 Frontend: `health.ts` returns different API shape

**File:** `matchcast-frontend/src/lib/api/health.ts:10`
**Problem:** Backend health endpoint returns `{ status: "ok" }` directly (not wrapped in `{ success, data }`). Breaks API convention. If backend wraps it later, landing page shows undefined.
**Fix:** Either align backend health to convention, or document exception in type.

---

## Summary

| Phase                    | Count | Category                                |
| ------------------------ | ----- | --------------------------------------- |
| 🔴 Phase 1: Critical     | 7     | Production safety gates                 |
| 🟠 Phase 2: Important    | 17    | Quality, maintainability, test coverage |
| 🟡 Phase 3: Nice to have | 9     | Tech debt, minor improvements           |

**Total: 33 improvements**

### Priority order for execution

1. P1.1 → P1.2 → P1.6 → P1.7 (code fixes, quick wins)
2. P1.3 + P1.5 (test + a11y, medium effort)
3. P2.1 → P2.2 → P2.3 → P2.4 → P2.5 → P2.6 → P2.7 (backend cleanup)
4. P2.8 → P2.9 → P2.10 → P2.11 → P2.12 (frontend cleanup)
5. P1.4 + P2.14 (CI + typecheck/lint infra)
6. P2.13 → P2.15 → P2.16 → P2.17 (test infra)
7. P3.1 → P3.9 (tech debt, lowest priority)
