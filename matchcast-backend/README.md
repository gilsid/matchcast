# matchcast-backend

REST API untuk platform manajemen turnamen olahraga. Otentikasi JWT, CRUD turnamen/team/pertandingan, bracket generation.

## Stack

- **Runtime:** Bun
- **Framework:** Fastify
- **ORM:** Prisma + PostgreSQL
- **Auth:** JWT (via `@fastify/jwt`) + bcryptjs
- **Lain:** CORS, rate-limit, cookie

## Struktur

```
src/
├── index.ts            # entry point, register routes & plugins
├── prisma-client.ts    # singleton Prisma client
├── plugins/
│   └── auth.ts         # JWT verify decorator
├── routes/
│   ├── auth.routes.ts    # login / register
│   ├── health.routes.ts  # healthcheck
│   ├── public.routes.ts  # public tournament listing
│   └── tournament.routes.ts  # CRUD tournament, team, match
└── services/
    ├── auth.service.ts
    ├── bracket.service.ts
    └── tournament.service.ts
```

## Model

- **User** — akun pembuat turnamen
- **Tournament** — nama, slug, sport, format (knockout/round_robin), status
- **Team** — peserta turnamen, dengan seed
- **Match** — pertandingan, skor, pemenang, round & order

## Setup

```bash
bun install
cp .env.example .env   # isi DATABASE_URL
bunx prisma migrate dev
bun run src/index.ts
```

## Scripts

| perintah | keterangan |
|---------|-----------|
| `bun run src/index.ts` | jalankan dev server |
| `bunx prisma studio`   | buka GUI database |
| `bunx prisma migrate dev` | migrasi skema |
