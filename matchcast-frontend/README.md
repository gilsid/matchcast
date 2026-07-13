# matchcast-frontend

Frontend SvelteKit untuk platform manajemen turnamen olahraga. UI comp ready dengan shadcn-svelte + Tailwind.

## Stack

- **Framework:** SvelteKit 2
- **CSS:** Tailwind CSS 4 + typography/forms plugin
- **UI:** shadcn-svelte (button, card, input, label via class-variance-authority)
- **Font:** Inter, JetBrains Mono, Oswald
- **Ikon:** svelte-radix
- **Lint/Format:** ESLint + Prettier

## Struktur

```
src/
├── app.html
├── app.d.ts
├── lib/
│   ├── api/
│   │   ├── auth.ts        # login/register API call
│   │   ├── health.ts      # health check
│   │   └── tournament.ts  # CRUD turnamen
│   ├── components/ui/     # shadcn components
│   ├── types/index.ts     # tipe bersama
│   └── utils.ts           # cn() helper
└── routes/
    ├── +layout.svelte
    ├── +page.svelte
    ├── layout.css
    ├── login/+page.svelte
    ├── register/+page.svelte
    ├── dashboard/+page.svelte
    ├── tournaments/[id]/+page.svelte
    └── t/[slug]/+page.svelte     # publik tournament page
```

## Halaman

| route | keterangan |
|-------|-----------|
| `/` | landing page |
| `/login` | login form |
| `/register` | register form |
| `/dashboard` | daftar turnamen milik user |
| `/tournaments/[id]` | detail/setting turnamen |
| `/t/[slug]` | halaman publik turnamen |

## Setup

```bash
bun install
cp .env.example .env   # isi PUBLIC_API_URL
bun run dev
```

## Scripts

| perintah | keterangan |
|---------|-----------|
| `bun run dev` | dev server (vite) |
| `bun run build` | build production |
| `bun run preview` | preview build |
| `bun run check` | typecheck svelte |
| `bun run lint` | prettier + eslint |
| `bun run format` | prettier --write |
