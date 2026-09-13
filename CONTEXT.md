# Matchcast

Turnamen amatir: penyelenggara bikin bracket, kelola skor; penonton lihat jadwal & skor via link publik tanpa login.

## Language

### Penyelenggara

Pemilik turnamen. Satu-satunya peran yang login dan boleh mutasi data.
_Avoid_: Admin, user, owner (di glosari; `ownerId` tetap di kode)

### Penonton

Siapa pun yang membuka link publik. Tanpa login, hanya baca.
_Avoid_: Guest, peserta, viewer

### Turnamen

Satu kompetisi tunggal. Punya nama, cabang olahraga, status, dan slug publik.
_Avoid_: Event, kompetisi, league

### Tim

Satu kontestan dalam satu turnamen. Nama unik per turnamen tidak wajib.
_Avoid_: Peserta, klub, player

### Bracket

Seluruh struktur pertandingan knockout satu turnamen, di-generate sekali dari daftar tim.
_Avoid_: Bagan, draw, fixture

### Match

Satu pertandingan dalam bracket. Punya ronde, urutan, dua slot tim, skor, dan status.
_Avoid_: Game, laga, pertandingan (di kode: `Match`)

### Ronde

Nomor babak dalam bracket. Ronde 1 = babak awal, ronde tertinggi = final.
_Avoid_: Round (di teks user boleh), stage, babak (di kode: `round`)

### Seed

Nomor undian tim (1..N). Seed kecil dapat bye saat jumlah tim bukan pangkat dua.
_Avoid_: Ranking, peringkat, unggulan

### Bye

Hak lolos otomatis ke ronde 2 tanpa main di ronde 1. Hanya saat jumlah tim bukan pangkat dua.
_Avoid_: Walkover, WO, free pass

### Skor

Angka bulat non-negatif per tim dalam satu match. Knockout tidak mengenal seri.
_Avoid_: Poin, nilai, gol

### Pemenang

Tim dengan skor lebih tinggi. Menempati slot kosong di match ronde berikutnya.
_Avoid_: Juara (juara = pemenang final saja), winner (di kode: `winnerTeamId` tetap)

### Slug

Identitas publik turnamen di URL (`/t/:slug`). Stabil, unik, turunan nama.
_Avoid_: Shortlink, kode publik, shareId
