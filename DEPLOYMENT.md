# DEPLOYMENT — Matchcast

Satu app SvelteKit di Vercel (`@sveltejs/adapter-vercel`, runtime nodejs22.x),
database Neon serverless PostgreSQL. Tanpa backend terpisah, tanpa CORS,
tanpa `VITE_API_URL`.

## 1. Database — Neon

1. Daftar/login ke https://neon.tech, buat project baru.
2. Simpan **dua** connection string:
   - **Pooled** (hostname ada `-pooler`): untuk `DATABASE_URL` runtime aplikasi.
   - **Direct** (tanpa `-pooler`): untuk menjalankan migrasi.
3. Jalankan migrasi dengan direct connection (pooled gagal dengan error
   `prepared statement already exists`):

```bash
export DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
bunx prisma migrate deploy
```

## 2. App — Vercel

1. Import GitHub repo di dashboard Vercel. Root directory = repo root,
   framework terdeteksi otomatis (SvelteKit).
2. Isi environment variables:

| Variable       | Value                        | Keterangan                       |
| -------------- | ---------------------------- | -------------------------------- |
| `DATABASE_URL` | `postgresql://...-pooler...` | Pooled connection Neon           |
| `JWT_SECRET`   | `<random string>`            | Generate: `openssl rand -hex 32` |

3. Deploy. Region fungsi samakan/dekatkan dengan region Neon bila bisa.

## 3. Verifikasi

```bash
# Health check
curl https://<app>.vercel.app/api/health

# Lalu di browser: register → login → buat turnamen → tambah tim →
# generate bracket → main sampai selesai → cek link publik /t/:slug
```
