# Menerbitkan Rel Nusantara di Google Play

Panduan ini berisi langkah yang dilakukan pemilik akun, ditambah teks dan gambar siap pakai untuk halaman toko.
Proyek Android (Capacitor 8, target Android API 36) ada di `app/android`. File rilis dibangun otomatis oleh
GitHub Actions, jadi Android Studio tidak wajib dipasang.

## 1. Buat kunci tanda tangan (sekali saja)

Kunci ini menandatangani setiap rilis. **Simpan file dan sandinya di tempat aman. Jika hilang, pembaruan
aplikasi tidak bisa diunggah lagi** (kecuali memakai Play App Signing, lihat langkah 4).

Di komputer yang sudah ada Java (JDK 17 atau lebih baru):

```bash
keytool -genkeypair -v -keystore upload-keystore.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Isi nama dan sandi saat diminta. Lalu ubah file menjadi teks base64:

```bash
base64 -w0 upload-keystore.jks > keystore.txt      # Linux
base64 -i upload-keystore.jks -o keystore.txt      # macOS
```

## 2. Simpan kunci sebagai Secret di GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**, buat empat secret:

| Nama | Isi |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | seluruh isi `keystore.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | sandi keystore |
| `ANDROID_KEY_ALIAS` | `upload` (atau alias yang Anda pakai) |
| `ANDROID_KEY_PASSWORD` | sandi kunci (sering sama dengan sandi keystore) |

Jangan pernah meng-commit file `.jks` ke repo (sudah diabaikan oleh `.gitignore`).

## 3. Bangun file rilis

Repo → **Actions → Bangun aplikasi Android → Run workflow**, isi nama versi (mis. `1.0.0`).
Setelah selesai (±5–8 menit), unduh artefak `rel-nusantara-android-…` yang berisi:

- `app-release.aab` untuk diunggah ke Google Play
- `app-release.apk` untuk dipasang langsung di HP Android (uji coba)

Nomor versi (`versionCode`) naik otomatis setiap kali workflow dijalankan.
Bila secret belum diisi, workflow hanya membuat `app-debug.apk` untuk dicoba di HP.

## 4. Siapkan Google Play Console

1. Daftar di <https://play.google.com/console> (biaya pendaftaran sekali bayar, verifikasi identitas).
2. **Nama pengembang** di akun Play Console: **Prismatix Lab**.
   **Buat aplikasi**: nama *Rel Nusantara*, bahasa default Indonesia, jenis **Game**, **Gratis**.
3. Aktifkan **Play App Signing** (disarankan). Google menyimpan kunci aplikasi; kunci Anda menjadi
   *upload key*, sehingga bila kunci hilang bisa diganti lewat dukungan Google.
4. Lengkapi **App content**:
   - **Kebijakan privasi**: `https://syannuri.github.io/meds-game/privacy.html`
   - **Iklan**: Tidak berisi iklan
   - **Akses aplikasi**: Semua fungsi tersedia tanpa akses khusus
   - **Rating konten**: isi kuesioner IARC. Kategori *Game*; tidak ada kekerasan, konten seksual, bahasa kasar,
     zat terlarang, perjudian, atau interaksi antarpengguna. Hasil yang diharapkan: **Semua umur (3+)**
   - **Target audiens**: 13 tahun ke atas (paling sederhana), atau sertakan anak-anak bila diinginkan
   - **Keamanan data**: Tidak mengumpulkan data; tidak membagikan data
   - **Aplikasi berita / pemerintahan / keuangan / kesehatan**: Bukan
5. **Pengujian tertutup (wajib untuk akun pribadi baru)**: buat jalur *Closed testing*, unggah `.aab`, undang
   minimal **12 penguji** (alamat Gmail) dan biarkan mereka ikut selama **14 hari berturut-turut**.
   Setelah itu tombol untuk mengajukan akses *Production* akan aktif. Periksa jumlah dan durasi terbaru di
   Play Console, karena ketentuan ini bisa berubah.
6. **Produksi**: buat rilis baru, unggah `.aab` terbaru, isi catatan rilis, lalu kirim untuk ditinjau
   (biasanya beberapa hari).

## 5. Halaman toko (Main store listing)

Gambar ada di `docs/play-store/`:

| Kebutuhan | File |
|---|---|
| Ikon aplikasi 512×512 | `icon-512.png` |
| Gambar fitur 1024×500 | `feature-graphic-1024x500.png` |
| Screenshot ponsel (2–8, 16:9) | `screenshot-01-menu.jpg` … `screenshot-08-stasiun.jpg` |

**Nama aplikasi** (maks. 30 karakter)

> Rel Nusantara: Masinis Kereta

**Deskripsi singkat** (maks. 80 karakter)

> Kemudikan kereta diesel hingga kereta cepat 250 km/h di Jawa dan Sumatra.

**Deskripsi lengkap**

> Jadilah masinis di Rel Nusantara! Bawa Cakra, lokomotif diesel kebanggaan, melintasi sawah, hutan, dan
> kota di Jawa dan Sumatra, lalu naik pangkat hingga mengemudikan kereta cepat Guntur 250 km/h.
>
> 🚆 13 MISI BERCERITA
> Dari langkah pertama di depo hingga jalur kereta cepat menembus Bukit Barisan. Antar pedagang pasar di
> pagi berkabut, hadapi hujan deras dan wesel licin, adu cepat dengan bus mudik, angkut batu bara di
> Sumatra, sampai melaju di jalur layang di atas sawah.
>
> 🎛️ MENGEMUDI SEPERTI MASINIS SUNGGUHAN
> Atur tuas tenaga dan rem, baca sinyal dan papan batas kecepatan, bunyikan klakson di perlintasan,
> dan berhenti tepat di marka peron. Jaga kenyamanan penumpang: tarikan dan pengereman harus halus.
>
> ⚡ LIMA KERETA, LIMA RASA
> • Cakra (diesel CC) dengan livery batik
> • Agraveda, lokomotif ekspres Argo Senja 120 km/h
> • Guntur GT 6001, kereta cepat listrik 250 km/h
> • Kilat G1, kereta cepat generasi pertama di Sumatra
> Kereta listrik punya pantograf, seksi netral, dan rem regeneratif yang mengembalikan energi.
>
> 👁️ DUA SUDUT PANDANG
> Tampilan samping yang sinematik atau kabin masinis lengkap dengan dasbor analog, digital, dan HUD.
>
> 🌅 NUSANTARA YANG HIDUP
> Fajar, senja keemasan, malam berbintang, hujan, dan kabut. Stasiun warisan, rumah gadang, candi,
> gunung api, kebun sawit, dan kota modern. Kumpulkan kartu pos dari tempat-tempat yang dilewati.
>
> 🏅 RUTE HARIAN & PANGKAT MASINIS
> Rute baru setiap hari, raih bintang untuk naik pangkat dari Asisten Masinis hingga Masinis Utama, dan
> buka livery batik untuk Cakra.
>
> Tanpa iklan, tanpa pembelian dalam aplikasi, dan bisa dimainkan tanpa internet.

**Kategori**: Game → Simulasi · **Tag**: Kereta, Simulasi, Mengemudi

**Catatan rilis 1.0.0**

> Rilis perdana Rel Nusantara: 13 misi di Jawa dan Sumatra, kereta diesel hingga kereta cepat, tampilan
> kabin, rute harian, dan kartu pos Nusantara.

## Memperbarui aplikasi

Setiap ada perubahan game di `app/www` yang ingin dirilis: jalankan workflow **Bangun aplikasi Android**
lagi dengan nomor versi baru (mis. `1.0.1`), unduh `.aab`, lalu unggah sebagai rilis baru di Play Console.
Versi web di GitHub Pages tetap diperbarui otomatis seperti biasa.
