# Fullstack SvelteKit di Vercel, Fastify dihapus

Web-only tanpa mobile, deploy serverless Vercel. Satu app SvelteKit gantikan pasangan Fastify (`:3001`) + SvelteKit (`:5173`): API pindah ke `routes/api/.../+server.ts`, logic ke `$lib/server/`, Prisma ke Neon HTTP. Hilangkan CORS, double deploy, dan duplikat tipe.

## Considered Options

- **Tetap split Fastify + SvelteKit**: menang untuk multi-klien dan koneksi pool long-running, kalah di 2 deploy + CORS + kontrak tipe manual untuk produk yang diputuskan web-only.
- **SvelteKit di single VM (adapter-node)**: pertahankan `pg.Pool`, tapi lawan keputusan deploy Vercel yang sudah kunci.
- **Fullstack SvelteKit di Vercel (dipilih)**: satu deploy, tipe tunggal, cookie same-origin. Harga: tulis ulang 14 endpoint, auth, rate-limit, dan test backend.

## Consequences

- `pg.Pool` (`matchcast-backend/src/prisma-client.ts`) wajib pensiun; Vercel lambda bikin pool jebol. Ganti `@prisma/adapter-neon` + singleton `globalThis`.
- `@fastify/rate-limit` in-memory tidak berlaku antar lambda. MVP tanpa rate-limit persisten, tambah Upstash/Vercel KV saat abuse nyata (YAGNI).
- Test API Playwright backend ditulis ulang ke endpoint SvelteKit; pola `Promise.allSettled` race-test dipertahankan.
- Rollback = branch `main` sebelum penghapusan `matchcast-backend/`; tiap fase migrasi harus deployable.
