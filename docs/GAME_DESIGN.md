# Rel Nusantara — Game Design Document (Draft v0.1)

> Game mobile (iOS & Android) bertema kereta api Indonesia.
> Genre: **Simulasi masinis kasual + manajemen jaringan rel**, dibungkus **mode cerita**.

---

## 1. Konsep Inti (Elevator Pitch)

Pemain adalah **Raka**, masinis muda yang mewarisi depo kereta tua milik kakeknya di sebuah kota kecil.
Jalur-jalur di sekitarnya sudah lama mati. Dengan mengemudikan kereta secara tepat waktu dan aman,
pemain mengumpulkan dana, menghidupkan kembali stasiun-stasiun, dan perlahan membangun
jaringan rel yang menghubungkan pulau-pulau Nusantara.

**Satu kalimat:** *"Kemudikan, kelola, dan hidupkan kembali rel Nusantara — satu stasiun demi satu stasiun."*

### Pilar Desain
1. **Mudah dimainkan, sulit dikuasai** — kontrol satu jari, tapi berhenti tepat di garis peron butuh skill.
2. **Nuansa lokal** — stasiun, kuliner, budaya, dan pemandangan khas tiap daerah.
3. **Progres yang terasa** — depo kosong berubah jadi jaringan rel ramai.
4. **Sesi pendek** — satu perjalanan 2–4 menit, cocok untuk mobile.

---

## 2. Core Gameplay Loop

```
 ┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
 │  Pilih Misi  │ ──▶ │  Kemudikan    │ ──▶ │  Dapat Bintang,  │
 │  / Rute      │     │  Kereta       │     │  Koin & Penumpang│
 └──────────────┘     └───────────────┘     └────────┬─────────┘
        ▲                                             │
        │            ┌───────────────────┐            │
        └─────────── │ Upgrade Kereta,   │ ◀──────────┘
                     │ Bangun Stasiun,   │
                     │ Buka Rute Baru    │
                     └───────────────────┘
```

### 2.1 Mode Mengemudi (Gameplay Utama)
Tampilan 2.5D samping/belakang kereta. Kontrol:

| Kontrol | Fungsi |
|---|---|
| **Tuas throttle** (geser vertikal di kanan) | Atur kecepatan |
| **Tombol rem** (tahan) | Rem; tahan lama = rem darurat (penalti kenyamanan) |
| **Tombol klakson** | Wajib dibunyikan sebelum perlintasan |
| **Tombol pintu** | Buka/tutup pintu di stasiun |
| **Tap wesel** (di minimap) | Pilih jalur di percabangan |

Tantangan saat perjalanan:
- **Sinyal** hijau/kuning/merah — melanggar merah = gagal misi.
- **Batas kecepatan** di tikungan, jembatan, dan area stasiun.
- **Berhenti presisi** di marka peron → bonus bintang (Perfect / Good / Miss).
- **Ketepatan waktu** — jadwal tiba tiap stasiun.
- **Kenyamanan penumpang** — akselerasi & pengereman kasar menurunkan rating.
- **Kejadian acak** — hujan deras (rem lebih licin), kabut, hewan ternak di rel, longsor kecil, perlintasan ramai.

**Penilaian per perjalanan (maks 3 bintang):**
⭐ Selamat sampai tujuan · ⭐ Tepat waktu · ⭐ Kenyamanan ≥ 80% & semua pemberhentian “Good/Perfect”

### 2.2 Mode Manajemen (Meta Game)
Di peta jaringan (tampilan atas, gaya peta ilustrasi):
- **Renovasi stasiun** — tambah peron, kantin, mushola, ruang tunggu → menaikkan jumlah penumpang.
- **Buka rute baru** — butuh koin + bintang + syarat cerita.
- **Garasi/Depo** — beli & upgrade lokomotif dan rangkaian (mesin, rem, kenyamanan, kapasitas).
- **Pendapatan pasif** — rute yang sudah dikuasai bisa dijalankan otomatis (idle income, dibatasi waktu offline).

---

## 3. Skenario & Alur Cerita (Mode Cerita)

### Prolog — "Peluit Terakhir"
Raka pulang ke kota kelahirannya setelah kakeknya, Pak Harjo (mantan masinis legendaris),
wafat. Ia mewarisi **Depo Sukamaju** yang terbengkalai dan satu lokomotif diesel-elektrik tua bernama **"Si Gagah"** (RN 2001) yang dipulihkan bersama Dimas.
Kepala stasiun tua, **Bu Wulan**, memberinya buku catatan kakek berisi peta jalur-jalur lama
yang telah ditutup.
*Tutorial: menyalakan lokomotif, jalan pelan, berhenti di peron.*

### Babak 1 — Jawa: "Menghidupkan Kembali"
- Membuka kembali jalur lokal antar kota kecil (pegunungan, sawah, terowongan).
- Mengenal **Dimas** (mekanik depo, comic relief) dan **Sari** (anak pedagang stasiun yang ingin jadi PPKA/pengatur perjalanan).
- Konflik: perusahaan bus besar **"TransKilat"** milik **Pak Bram** ingin membeli lahan depo untuk dijadikan terminal.
- Misi spesial: kereta mudik Lebaran (penumpang membludak, jadwal ketat).
- **Boss mission:** balapan reputasi — kereta Raka harus tiba lebih cepat dan lebih nyaman daripada armada bus TransKilat.

### Babak 2 — Sumatra: "Jalur Batu Bara & Hutan"
- Kereta barang: angkut batu bara, sawit, dan hasil bumi — muatan berat, momentum tinggi, butuh pengereman lebih awal.
- Medan tanjakan curam (mekanik **rel gigi** di dataran tinggi).
- Raka menemukan bahwa catatan kakeknya menyimpan **peta jalur rahasia** yang dulu sengaja ditutup.
- Misi malam hari & cuaca ekstrem.

### Babak 3 — Kalimantan & Sulawesi: "Rel Baru"
- Membangun jalur rel baru dari nol (mini-puzzle peletakan rel di peta).
- Kereta wisata premium — misi fokus pada kenyamanan & pemandangan (bonus foto).
- Pak Bram mencoba sabotase (sinyal rusak, wesel dipindah) → misi investigasi ringan.

### Babak 4 — Final: "Kereta Nusantara"
- Terungkap bahwa Pak Bram adalah mantan asisten kakek Raka yang dulu gagal dan dendam.
- Misi final: perjalanan malam panjang menembus badai, dengan Si Gagah yang sudah direstorasi penuh.
- Akhir cerita: jaringan rel menyatukan kota-kota; Pak Bram berdamai dan bergabung membangun
  integrasi **bus–kereta** (pesan positif: kerja sama, bukan saling menjatuhkan).

> Total kampanye awal: ±60 misi cerita (15 per babak), ditambah misi sampingan harian.

---

## 4. Mode Tambahan

| Mode | Deskripsi |
|---|---|
| **Misi Harian** | 3 misi acak tiap hari (mis. “Berhenti Perfect 5 kali”). |
| **Event Musiman** | Mudik Lebaran, Natal & Tahun Baru, HUT RI 17 Agustus (kereta berhias merah putih). |
| **Mode Bebas (Sandbox)** | Jalan-jalan tanpa jadwal di rute yang sudah dibuka. |
| **Time Trial / Leaderboard** | Skor perjalanan dibandingkan dengan pemain lain (Game Center / Google Play Games). |
| **Album Foto** | Mode kamera saat melewati landmark → koleksi kartu daerah. |

---

## 5. Konten Kereta (Koleksi)

| Kelas | Contoh (fiktif, terinspirasi era nyata) | Ciri |
|---|---|---|
| Lokomotif uap | “Mbah Sepur” (koleksi museum, misi spesial) | Lambat, ikonik, butuh manajemen uap |
| Diesel-elektrik CC | “Si Gagah” RN 2001 (kereta utama) | Kabin depan, kap panjang, kuat di tanjakan |
| Diesel hidrolik | Seri DH-Nusa | Seimbang, kereta lokal |
| Diesel elektrik | Seri CC-Garuda | Kuat untuk barang & antarkota |
| KRL | Seri Komuter | Akselerasi cepat, banyak stasiun |
| Kereta cepat | Seri “Kilat Nusantara” | Kecepatan sangat tinggi, sinyal ketat |

Kustomisasi: livery (warna/motif batik, tenun, dsb.), klakson, interior kabin.

> Catatan: semua nama kereta, livery, dan perusahaan **fiktif** agar aman dari isu hak merek.

---

## 6. Ekonomi & Monetisasi (F2P yang adil)

- **Mata uang:** Koin (dari gameplay) & Tiket Emas (premium, juga bisa didapat gratis secara terbatas).
- **Energi?** Tidak — hindari sistem energi agar pemain bebas bermain.
- **Monetisasi:**
  - Iklan *rewarded* opsional (2x hadiah, buka peti bonus).
  - Kosmetik (livery, klakson, skin masinis).
  - **Battle Pass musiman** ringan.
  - Pembelian satu kali “Hapus Iklan”.
- Tidak ada pay-to-win untuk leaderboard (kereta disamakan statistiknya di mode kompetitif).

---

## 7. Arah Visual & Audio

- **Visual:** Low-poly 3D dengan warna hangat & cerah (gaya ilustrasi), kamera 2.5D.
  Daerah berbeda punya palet sendiri: hijau sawah Jawa, hutan lebat Sumatra, pantai Sulawesi.
- **UI:** Besar, ramah jempol, landscape mode.
- **Audio:** Suara rel “jeglak-jeglek”, klakson khas, pengumuman stasiun, musik latar
  bernuansa gamelan/keroncong modern yang berganti tiap daerah.

---

## 8. Teknologi yang Direkomendasikan

| Aspek | Pilihan | Alasan |
|---|---|---|
| Engine | **Unity (C#)** | Satu kode untuk iOS & Android, kuat untuk 3D low-poly, ekosistem plugin iklan/IAP lengkap |
| Alternatif ringan | Godot 4 / Flutter + Flame (jika ingin 2D) | Open-source, ukuran build kecil |
| Backend | Firebase (Auth, Firestore, Remote Config, Analytics, Crashlytics) | Cepat & murah untuk tahap awal |
| Leaderboard | Game Center (iOS) & Google Play Games Services (Android) | Native |
| IAP & Iklan | Unity IAP + AdMob / Unity Ads | Standar industri |
| Lokalisasi | Bahasa Indonesia (utama), English | Pasar lokal + global |

**Target perangkat:** Android 8+ (RAM 3 GB), iOS 15+. Ukuran unduhan awal < 200 MB (aset daerah diunduh bertahap).

---

## 9. Roadmap Pengembangan

| Fase | Durasi (perkiraan) | Hasil |
|---|---|---|
| 0. Pra-produksi | 2–4 minggu | GDD final, moodboard, prototipe kontrol kereta |
| 1. Prototipe (Vertical Slice) | 6–8 minggu | 1 rute, 1 kereta, sinyal, stasiun, sistem bintang |
| 2. Alpha | 3 bulan | Babak 1 lengkap, depo & upgrade, peta jaringan |
| 3. Beta tertutup | 1–2 bulan | Uji di Play Store (closed testing) & TestFlight, balancing |
| 4. Soft Launch | 1 bulan | Rilis di Indonesia dulu, pantau metrik retensi |
| 5. Global Launch + Live Ops | berkelanjutan | Babak 2–4, event musiman |

---

## 10. Contoh Skenario Satu Misi (Detail)

**Misi 1-4: "Pagi Pertama Pasar Minggu"**
- **Rute:** Stasiun Sukamaju → Cibening → Pasar Lama (12 km, 3 pemberhentian)
- **Kereta:** Si Gagah + 2 gerbong
- **Waktu:** 06.00 pagi, berkabut ringan
- **Briefing (Bu Wulan):** *"Raka, pedagang pasar sudah menunggu di Cibening. Jangan sampai sayur mereka layu!"*
- **Alur:**
  1. Berangkat dari Sukamaju saat sinyal hijau.
  2. Tikungan bukit — batas 30 km/jam.
  3. Perlintasan sebidang dengan sepeda motor — bunyikan klakson.
  4. Berhenti di Cibening, buka pintu, 20 pedagang naik dengan keranjang.
  5. Kabut menebal — sinyal kuning muncul tiba-tiba, kurangi kecepatan.
  6. Tiba di Pasar Lama — berhenti presisi di marka.
- **Hadiah:** 150 koin, 3 bintang, membuka **Kios Sarapan** di Stasiun Cibening.
- **Twist kecil:** Dimas menelepon — ada wesel yang terlihat dipindah orang tak dikenal semalam
  (benih konflik dengan TransKilat).
