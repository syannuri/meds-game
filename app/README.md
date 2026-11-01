# Rel Nusantara: Prototipe Babak 1 & 2

Prototipe yang bisa dimainkan untuk Babak 1: Misi 1-4 **"Pagi Pertama Pasar Minggu"**, Misi 1-5 **"Hujan di Lengkung Watu"**, dan Misi 1-6 **"Duel Malam Takbiran"** dari
[`docs/GAME_DESIGN.md`](../docs/GAME_DESIGN.md). Game ditulis dengan HTML5 Canvas + JavaScript
murni (tanpa dependensi), lalu dibungkus **Capacitor** supaya jalan sebagai aplikasi native iOS dan Android.

## Misi
| Misi | Rute | Tantangan |
|---|---|---|
| 1-4 Pagi Pertama Pasar Minggu | Sukamaju → Cibening → Pasar Lama (2,6 km, 06.00) | Tikungan 30 km/h, perlintasan, kambing, kabut, sinyal blok merah |
| 1-5 Hujan di Lengkung Watu | Pasar Lama → Kali Jernih → Watugede (3,0 km, 15.30) | Hujan & petir (rem lebih lemah, roda selip, tombol pasir), turunan 15‰, tanjakan 20‰, Terowongan Lengkung Watu, wesel yang disabotase (Dimas memeriksa lewat radio) |

| 1-6 Duel Malam Takbiran | Watugede → Pasar Lama → Sukamaju (3,45 km, 18.45) | Balapan melawan bus TransKilat Kilat 07 di jalan raya (bus tertahan palang perlintasan saat kereta lewat), kereta penuh pemudik (lebih berat), dua stasiun dilewati langsung, malam dengan kembang api, bedug, dan ketupat |

| 2-1 Emas Hitam | Tambang Muara Kelam → Dermaga Tanjung Api, Sumatra (3,3 km, 07.10) | Kereta barang 4 gerbong batu bara: muat presisi gerbong demi gerbong di bawah corong silo, rangkaian berat (momentum besar, rem lebih panjang), rombongan gajah Sumatra menyeberang (berhenti dan tunggu, klakson membuat gajah panik), turunan 16‰ ke pantai, bongkar di dermaga |

Misi dipilih di layar judul. Setiap misi didefinisikan sebagai data di objek `MISSIONS` dalam `game.js`.

## Tampilan (Visual 2.0)
- Kereta: lokomotif diesel-elektrik CC "Si Gagah" RN 2001 (kabin depan dengan muka 3/4, kap panjang
  berkisi radiator dan kipas atap, bogie berpegas, tangki bahan bakar, pelindung depan) dan tiga gerbong
  stainless berjendela berbingkai dengan AC atap. Marka henti di peron bernomor 4 (lokomotif + 3 gerbong). Livery orisinal putih-safron-toska, tanpa logo operator mana pun.
- Kedalaman 2.5D: petak sawah berperspektif menuju titik hilang, lapisan latar depan yang bergerak lebih
  cepat (paralaks), rel dua batang dengan bantalan berperspektif, muka atas atap kereta dan peron, pegunungan
  berlapis yang makin pucat di kejauhan, bayangan panjang kereta dan tiang saat pagi.
- Jembatan baja busur modern (tied-arch) dengan rusuk depan-belakang, batang gantung, lampu malam, dan
  pantulan di sungai.
- Pemandangan: sinar matahari pagi, kabut tipis di kaki gunung, genangan sawah yang memantulkan langit,
  cahaya tepi pada kereta dan pohon, bayangan kereta, gas buang diesel dengan semburan saat tuas dinaikkan.
- HUD kaca buram: speedometer analog, tuas logam dengan kenop kuningan, cincin kenyamanan,
  diagram jalur, dan pemandu titik henti yang muncul saat mendekati marka "3".
- Layar judul dengan karcis misi bergaya karcis kereta lama.

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
  - Mesin diesel: putaran bertingkat per notch P1–P4 (naik perlahan seperti governor), denyut
    letupan silinder "dug-dug-dug", geraman saat menarik beban, desing turbo yang menyusul belakangan
    (turbo lag), gemuruh knalpot, dengung motor traksi, kompresor udara saat berhenti
  - Rel: "jeglak-jeglek" tiap gandar di sambungan rel (tik logam, dentum roda, dengung rel), desis rel
    yang makin nyaring saat kencang, decit flens roda di tikungan, gemeretak wesel saat masuk/keluar
    stasiun, dentum panel karet saat melintasi jalan perlintasan
  - Klakson udara tiga nada dengan hembusan udara dan gema perbukitan; berbunyi selama tombol
    (atau tombol `H`) ditahan
- HUD ringkas: panel atas satu baris, speedometer kecil tembus pandang, tuas ramping, tombol bulat;
  strip rute dan titik henti hanya muncul saat mendekati stasiun, sinyal, perlintasan, satwa, atau
  perubahan batas kecepatan. Di tampilan kabin, kecepatan pindah ke panel dasbor
- Skala nyata: atap gerbong dan lokomotif sekitar 4 m, orang 1,65 m; kamera sedikit lebih dekat
- Latar berlapis: gunung, bukit, kampung (rumah genteng, masjid, kelapa, pisang, bambu; rumah panggung
  dan sawit di Sumatra), dataran sawah di seberang rel dengan petani bercaping dan burung kuntul,
  serta bayangan kontak di bawah objek
- Dua sudut pandang: samping 2.5D atau kabin masinis (tombol kabin di kanan atas, atau tombol `V`).
  Dari kabin terlihat rel di depan dengan perspektif, tikungan yang berbelok, sinyal, perlintasan,
  stasiun dengan penumpang, jembatan busur, mulut terowongan, gajah dan kambing, wiper saat hujan,
  serta dasbor dengan pengukur tekanan udara
- Suasana alam: gemerisik daun, kicau burung (kutilang, prenjak), dekur perkutut, ayam jago saat
  fajar, dan tonggeret di siang hari; makin ramai saat kereta pelan atau berhenti. Desis udara rem,
  pintu, turbo, dan rel dibuat lebih pelan dan lembut
- Kereta hidup: badan tiap gerbong naik-turun saat bogie melewati sambungan rel, sambungan antargerbong
  merenggang saat menarik dan merapat saat mengerem, badan mendongak/menunduk, pintu geser bergerak,
  lampu depan berkedip saat klakson, debu dan daun kering terangkat di belakang rangkaian
- Momen penting: berhenti Perfect membuat kamera mendekat, marka berkilau, koin terbang ke penghitung,
  dan penumpang bertepuk tangan; Good/OK/Miss punya cap sendiri; pelanggaran memunculkan tepi merah
  berdenyut, guncangan, dan cap merah
- Tikungan 3D: rel diproyeksikan dengan perspektif sungguhan (memendek dan menjauh, gerbong ikut
  berputar ke kedalaman), latar jauh bergeser mengikuti arah kamera, ujung rel memudar ke kejauhan.
  Lokomotif masuk tikungan lebih
  dulu lalu gerbong menyusul. Kamera miring dan bergoyang mengikuti gaya samping, indikator gaya
  samping di speedometer (hijau, kuning, merah), percik api di roda saat terlalu kencang
- Suara jembatan: "klang" sambungan muai di kedua ujung, dentum berongga tiap segmen gelagar,
  dengung baja dengan denting rangka, dan gema lembah selama kereta di atas jembatan
- Peron sisi dekat di setiap stasiun: penumpang berkumpul ke dekat pintu saat kereta datang,
  penumpang turun didahulukan, lalu antre dan naik satu per satu (lansia lebih pelan). PPKA bertopi
  merah mengangkat semboyan 40 dan kondektur meniup peluit semboyan 41 sebelum naik
- Perlintasan sebidang 2.5D: jalan aspal yang menjauh ke latar dengan marka, panel karet di atas rel,
  palang pintu dan lampu "AWAS KERETA API" di kedua sisi, pos jaga JPL, serta motor, mobil, dan
  angkot yang antre lalu jalan kembali setelah kereta lewat
  - Pengereman: desis katup saat tuas ke B, gesekan blok rem yang mengikuti kecepatan, decit roda
    menjelang berhenti, lalu hentakan sambungan gerbong dan desis pelepasan panjang saat kereta berhenti
  - Pintu: buka = katup udara > geser > benturan; tutup = bel peringatan > katup > geser > benturan + kunci
  - Mixer: jalur terpisah (mesin, rem, pintu, efek, suasana, musik), gema ringan, peredam nada tinggi,
    kompresor lembut; pintu, rem berhenti, dan pengumuman menurunkan suasana & musik sesaat, dan
    pengumuman stasiun menunggu sampai bunyi pintu/rem selesai
  - Bel perlintasan "teng-teng", embik kambing, pintu geser, bel pintu, tabrakan
  - Pengumuman stasiun dengan nada "ting-tung"; jika perangkat punya suara Bahasa Indonesia, pengumuman dibacakan
  - Jingle bintang di layar hasil; tombol terpisah untuk musik dan semua suara
- Kontrol sentuh (HP) dan keyboard (desktop)

## Coba di browser
```bash
cd app
npm run serve        # buka http://localhost:8080 (di HP: pakai IP komputer, posisi landscape)
```
Keyboard: `↑/W` tenaga, `↓/S` rem, `Spasi` rem darurat, `H` klakson, `D/Enter` pintu, `A` pasir, `V` ganti tampilan, `Esc` jeda.

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
