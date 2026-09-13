# PRE-LAUNCH CHECKLIST — Matchcast

> Jalankan checklist ini SETELAH deploy selesai, SEBELUM link dibagikan ke publik.

## 1. Environment Variables

- [ ] **Vercel:** `DATABASE_URL` terisi pooled connection Neon
- [ ] **Vercel:** `JWT_SECRET` terisi (generate dengan `openssl rand -hex 32`)
- [ ] Migrasi jalan dengan direct connection (`bunx prisma migrate deploy` hijau)

## 2. Build & Deploy

- [ ] `bun run build` lokal sukses tanpa error
- [ ] Log deploy Vercel hijau (success)
- [ ] `curl https://<app>.vercel.app/api/health` → `200 OK`

## 3. Smoke Test di Production

- [ ] Buka frontend di browser → landing page tampil
- [ ] Register akun baru → sukses
- [ ] Login → redirect ke dashboard
- [ ] Buat turnamen → sukses
- [ ] Tambah 6 tim → sukses
- [ ] Generate bracket → 5 match terbuat
- [ ] Mulai match → status ongoing
- [ ] Isi skor → match selesai, winner propagate ke ronde berikut
- [ ] Selesaikan semua match → tournament status "finished"
- [ ] Buka halaman publik (incognito) → semua data tampil benar

## 4. Monitoring

- [ ] **Neon dashboard:** backup otomatis (point-in-time recovery) aktif
- [ ] **Vercel dashboard:** familiar dengan tab "Functions" untuk error serverless
- [ ] Rencana: cek log Vercel tiap hari di minggu pertama setelah launch

## 5. Komunikasi

- [ ] Jangan share link ke publik luas dulu
- [ ] Undang 2-3 komunitas kecil untuk testing
- [ ] Siapkan saluran feedback (DM WhatsApp atau Google Form sederhana)

## 6. Rollback Plan

1. **App error:** Vercel → deploy ulang versi sebelumnya (Deployments → ⋮ → Promote to Production)
2. **Database korup:** Neon → point-in-time recovery
3. **Darurat:** aktifkan Deployment Protection di Vercel untuk menutup akses publik sementara
