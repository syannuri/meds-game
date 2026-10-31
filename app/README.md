# Rel Nusantara: Prototipe Babak 1

Prototipe yang bisa dimainkan untuk Misi 1-4 **"Pagi Pertama Pasar Minggu"** dan Misi 1-5 **"Hujan di Lengkung Watu"** dari
[`docs/GAME_DESIGN.md`](../docs/GAME_DESIGN.md). Game ditulis dengan HTML5 Canvas + JavaScript
murni (tanpa dependensi), lalu dibungkus **Capacitor** supaya jalan sebagai aplikasi native iOS dan Android.

## Misi
| Misi | Rute | Tantangan |
|---|---|---|
| 1-4 Pagi Pertama Pasar Minggu | Sukamaju → Cibening → Pasar Lama (2,6 km, 06.00) | Tikungan 30 km/h, perlintasan, kambing, kabut, sinyal blok merah |
| 1-5 Hujan di Lengkung Watu | Pasar Lama → Kali Jernih → Watugede (3,0 km, 15.30) | Hujan & petir (rem lebih lemah, roda selip, tombol pasir), turunan 15‰, tanjakan 20‰, Terowongan Lengkung Watu, wesel yang disabotase (Dimas memeriksa lewat radio) |

Misi dipilih di layar judul. Setiap misi didefinisikan sebagai data di objek `MISSIONS` dalam `game.js`.

## Yang sudah ada di prototipe
- Tuas kendali (master controller) P1–P4 / N / B1–B4 / EB dengan respons rem yang bertahap
- Fisika kereta: percepatan, hambatan, pengereman, sentakan (jerk)
- Sinyal 3 aspek (merah/kuning/hijau), sinyal blok yang berubah (kereta barang di petak depan)
- Batas kecepatan per zona (tikungan, jembatan, area stasiun); anjlok jika terlalu cepat di tikungan
- Perlintasan sebidang (wajib klakson) dan kambing di rel
- Kabut yang menyembunyikan sinyal jauh dari peta jalur
- Berhenti presisi di marka "3" (Perfect / Good / OK / Miss), buka-tutup pintu, penumpang naik
- Jadwal dan jam game, kenyamanan penumpang, koin, 3 bintang, layar hasil, rekor tersimpan
- Audio sintetis (WebAudio, tanpa berkas suara):
  - Musik latar bernuansa gamelan (laras slendro: saron, bonang, kenong, kempul, gong, kendang)
  - Suasana: kicau burung, jangkrik saat fajar, angin, sungai di bawah jembatan, riuh penumpang di peron
  - Kereta: hentakan uap, gemuruh roda (lebih bergema di jembatan), "jeglak-jeglek" sambungan rel,
    desis uap saat diam, rem angin, decit rem, peluit dengan gema
  - Bel perlintasan "teng-teng", embik kambing, pintu geser, bel pintu, tabrakan
  - Pengumuman stasiun dengan nada "ting-tung"; jika perangkat punya suara Bahasa Indonesia, pengumuman dibacakan
  - Jingle bintang di layar hasil; tombol terpisah untuk musik dan semua suara
- Kontrol sentuh (HP) dan keyboard (desktop)

## Coba di browser
```bash
cd app
npm run serve        # buka http://localhost:8080 (di HP: pakai IP komputer, posisi landscape)
```
Keyboard: `↑/W` tenaga, `↓/S` rem, `Spasi` rem darurat, `H` klakson, `D/Enter` pintu, `A` pasir, `Esc` jeda.

## Build aplikasi Android & iOS
Prasyarat: Node 18+, Android Studio (Android), Xcode di macOS (iOS).
```bash
cd app
npm install
npx cap add android
npx cap add ios
npm run android      # membuka Android Studio → Run / Build APK/AAB
npm run ios          # membuka Xcode → Run / Archive
```
Kunci orientasi landscape:
- **Android**: `android/app/src/main/AndroidManifest.xml`, di tag `<activity>` tambahkan `android:screenOrientation="sensorLandscape"`.
- **iOS**: di Xcode → target → General → Device Orientation, centang hanya *Landscape Left/Right*.

Font diambil dari Google Fonts; jika offline, game memakai font cadangan sistem.
Untuk rilis, unduh font (Big Shoulders Display, Plus Jakarta Sans) ke `www/fonts/` agar tampil sama tanpa internet.

## Struktur
```
app/
  www/index.html   layar & HUD
  www/style.css    tampilan
  www/game.js      mesin game (rute, fisika, aturan, render, audio)
  capacitor.config.json
```
Data misi ada di objek `MISSIONS` di `game.js` (stasiun, zona kecepatan, sinyal, skrip sinyal, perlintasan, hewan, kabut, jembatan, terowongan, landai, petunjuk). Menambah misi baru cukup dengan menambah entri di sana dan di `MISSION_ORDER`.
