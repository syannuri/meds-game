/* Rel Nusantara — prototipe Babak 1: Misi 1-4 dan 1-5
 * Satu berkas, tanpa dependensi. Dunia 1 dimensi sepanjang rel (satuan meter),
 * digambar 2.5D ke <canvas>. Bisa dibungkus Capacitor menjadi aplikasi iOS/Android.
 */
(() => {
  'use strict';

  // ---------- util ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function mix(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t));
    const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
    const bl = Math.round(lerp(a & 255, b & 255, t));
    return `rgb(${r},${g},${bl})`;
  }
  const store = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };

  // ---------- data misi & rute ----------
  const TIME_SCALE = 5;            // 1 detik nyata = 5 detik jam game
  const LOCO_LEN = 16, COACH_LEN = 20, WAGON_LEN = 12, GAP = 1.2;
  const VS = 0.54, VPIV = 1.05; // skala tinggi badan kereta (atap sekitar 4,1 m)
  const trainH = (h) => (h <= VPIV ? h : VPIV + (h - VPIV) * VS);
  // susunan rangkaian berubah per misi: 3 gerbong penumpang atau N gerbong batu bara
  let N_COACH = 3, CAR_LEN = COACH_LEN;
  let TRAIN_LEN = LOCO_LEN + N_COACH * (CAR_LEN + GAP);
  const carFront = (k) => LOCO_LEN + GAP + k * (CAR_LEN + GAP);   // jarak muka gerbong ke-k dari moncong
  const WINDOW_BEFORE = 40, WINDOW_AFTER = 55; // jendela berhenti di peron (m)
  const SAND_USES = 3, SAND_TIME = 8;

  const MISSIONS = {
    // ---------- misi pembuka: tiap misi mengajarkan satu keterampilan ----------
    '1-1': {
      id: '1-1',
      chapter: 'Babak 1 · Jawa',
      title: 'Langkah Pertama di Depo',
      startClock: 5 * 3600 + 30 * 60,
      sky: 'dawn',
      rain: false,
      tutorial: true, startClosed: true, noDoors: true,
      tags: ['Tuas', 'Berhenti'],
      speaker: { who: 'Kakek, pensiunan masinis', initials: 'KK' },
      brief: 'Raka, sebelum membawa penumpang, kenali dulu Si Gagah. Bawa ia pelan dari depo ke Peron 1 Sukamaju dan berhenti tepat di marka. Kakek duduk di sebelahmu.',
      weather: 'cerah',
      intro: 'Sinyal depo sebentar lagi hijau. Tunggu aba-aba Kakek.',
      reward: '<strong>Kakek:</strong> Bagus, Raka! Besok kita belajar membaca sinyal.',
      aboard: 0,
      route: {
        lineSpeed: 40,
        stations: [
          { name: 'DEPO SUKAMAJU', elev: '+386 m', x: 0, sched: 0, waiting: 0 },
          { name: 'SUKAMAJU', elev: '+386 m', x: 600, sched: 600, waiting: 0, final: true },
        ],
        zones: [{ from: -120, to: 700, limit: 25, label: 'area depo' }],
        signals: [{ id: 'S1', x: 40, start: 0, init: 'R' }],
        scripts: [], crossings: [], goats: [], fog: null, bridge: null, tunnel: null, grades: [], switchX: null, hints: [],
        bufferStop: 700,
      },
    },
    '1-2': {
      id: '1-2',
      chapter: 'Babak 1 · Jawa',
      title: 'Membaca Sinyal',
      startClock: 5 * 3600 + 50 * 60,
      sky: 'dawn',
      rain: false,
      tutorial: true, startClosed: true, noDoors: true,
      tags: ['Sinyal', 'Batas kecepatan'],
      speaker: { who: 'Dimas, pengatur perjalanan', initials: 'DM' },
      brief: 'Pagi, Raka. Bawa Si Gagah kosong ke Cibening. Di jalan ada papan batas kecepatan, sinyal kuning, dan sinyal merah. Baca warnanya; aku pandu lewat radio.',
      weather: 'cerah',
      intro: 'Tunggu sinyal S1 hijau, lalu berangkat.',
      reward: '<strong>Dimas:</strong> Sinyal sudah kamu kuasai. Berikutnya, penumpang pertamamu.',
      aboard: 0,
      route: {
        lineSpeed: 60,
        stations: [
          { name: 'SUKAMAJU', elev: '+386 m', x: 0, sched: 0, waiting: 0 },
          { name: 'CIBENING', elev: '+412 m', x: 1200, sched: 900, waiting: 0, final: true },
        ],
        zones: [
          { from: -120, to: 200, limit: 40, label: 'area Stasiun Sukamaju' },
          { from: 480, to: 780, limit: 40, label: 'petak Kali Kecil' },
          { from: 1000, to: 1350, limit: 40, label: 'area Stasiun Cibening' },
        ],
        signals: [
          { id: 'S1', x: 60, start: 0, init: 'R' },
          { id: 'J1', x: 860, init: 'Y' },
          { id: 'S2', x: 1080, init: 'R' },
        ],
        scripts: [{ type: 'hold', sig: 'S2', at: 600, near: 90, wait: 6, radio: 'Jalur aman, S2 hijau. Silakan jalan, Raka.' }],
        crossings: [], goats: [], fog: null, bridge: null, tunnel: null, grades: [], switchX: null, hints: [],
        bufferStop: 1300,
      },
    },
    '1-3': {
      id: '1-3',
      chapter: 'Babak 1 · Jawa',
      title: 'Penumpang Pertama',
      startClock: 6 * 3600 + 20 * 60,
      sky: 'dawn',
      rain: false,
      tutorial: true,
      tags: ['Pintu', 'Kenyamanan', 'Klakson'],
      speaker: { who: 'Bu Wulan, kepala stasiun', initials: 'BW' },
      brief: 'Raka, ini perjalanan pertamamu dengan penumpang. Berhenti di Halte Sumberrejo, buka pintu, tunggu semua naik, lalu antar ke Cibening. Jaga tarikan dan rem tetap halus.',
      weather: 'cerah berawan',
      intro: 'Penumpang sudah naik. Tutup pintu untuk bersiap berangkat.',
      reward: '<strong>Bu Wulan:</strong> Penumpang senang. Kamu siap untuk pagi pertama di Pasar Minggu.',
      aboard: 4,
      route: {
        lineSpeed: 60,
        stations: [
          { name: 'SUKAMAJU', elev: '+386 m', x: 0, sched: 0, waiting: 0 },
          { name: 'SUMBERREJO', elev: '+398 m', x: 700, sched: 560, waiting: 6 },
          { name: 'CIBENING', elev: '+412 m', x: 1800, sched: 1260, waiting: 0, final: true },
        ],
        zones: [
          { from: -120, to: 200, limit: 40, label: 'area Stasiun Sukamaju' },
          { from: 560, to: 820, limit: 40, label: 'area Halte Sumberrejo' },
          { from: 1600, to: 1950, limit: 40, label: 'area Stasiun Cibening' },
        ],
        signals: [
          { id: 'S1', x: 60, start: 0, init: 'R' },
          { id: 'S2', x: 760, start: 1, init: 'R' },
          { id: 'J1', x: 1500, init: 'G' },
        ],
        scripts: [],
        crossings: [{ x: 1250, hornFrom: 950 }],
        goats: [], fog: null, bridge: null, tunnel: null, grades: [], switchX: null, hints: [],
        bufferStop: 1950,
      },
    },
    '1-4': {
      id: '1-4',
      chapter: 'Babak 1 · Jawa',
      title: 'Pagi Pertama Pasar Minggu',
      startClock: 6 * 3600,
      sky: 'dawn',
      rain: false,
      tags: ['Kabut', 'Perlintasan', 'Kambing'],
      speaker: { who: 'Bu Wulan, kepala stasiun', initials: 'BW' },
      brief: 'Raka, pedagang pasar sudah menunggu di Cibening. Jangan sampai sayur mereka layu! Pagi ini berkabut, jadi perhatikan sinyal di petak jembatan.',
      weather: 'kabut ringan',
      intro: 'Selamat pagi, Masinis Raka! Tutup pintu untuk bersiap berangkat.',
      reward: '<strong>Terbuka:</strong> Kios Sarapan di Stasiun Cibening. Penumpang di Cibening bertambah di misi berikutnya.',
      aboard: 9,
      route: {
        lineSpeed: 80,
        stations: [
          { name: 'SUKAMAJU', elev: '+386 m', x: 0, sched: 0, waiting: 0 },
          { name: 'CIBENING', elev: '+412 m', x: 1200, sched: 780, waiting: 14, traders: true },
          { name: 'PASAR LAMA', elev: '+371 m', x: 2600, sched: 1560, waiting: 5, final: true },
        ],
        zones: [
          { from: -120, to: 200, limit: 40, label: 'area Stasiun Sukamaju' },
          { from: 380, to: 620, limit: 30, label: 'Tikungan Bukit', curve: true },
          { from: 1000, to: 1400, limit: 40, label: 'area Stasiun Cibening' },
          { from: 1900, to: 2050, limit: 50, label: 'Jembatan Ci Leuleuy' },
          { from: 2450, to: 2760, limit: 40, label: 'area Stasiun Pasar Lama' },
        ],
        signals: [
          { id: 'S1', x: 60, start: 0, init: 'R' },
          { id: 'J1', x: 1000, init: 'Y' },
          { id: 'S2', x: 1260, start: 1, init: 'R' },
          { id: 'B1', x: 2250, init: 'G' },
          { id: 'J2', x: 2450, init: 'G' },
        ],
        scripts: [
          {
            type: 'timed', sig: 'B1', at: 1980, red: 18, yellow: 9,
            msg: 'Sinyal blok B1 MERAH! Kereta barang masih di petak depan. Siap berhenti.',
            yellowMsg: 'B1 berubah kuning. Jalan pelan, maks 40 km/h.',
          },
        ],
        crossings: [{ x: 820, hornFrom: 520 }],
        goats: [{ x: 1650, hornFrom: 1430 }],
        fog: { from: 1480, to: 2330 },
        bridge: { from: 1900, to: 2050 },
        tunnel: null,
        grades: [],
        switchX: null,
        hints: [
          { at: 260, msg: 'Tikungan Bukit di depan: batas 30 km/h. Rem lebih awal.' },
          { at: 1480, msg: 'Kabut menebal. Sinyal jauh tidak terlihat di peta jalur.' },
        ],
        bufferStop: 2700,
      },
    },
    '1-5': {
      id: '1-5',
      chapter: 'Babak 1 · Jawa',
      title: 'Hujan di Lengkung Watu',
      startClock: 15 * 3600 + 30 * 60,
      sky: 'storm',
      rain: true,
      tags: ['Hujan', 'Tanjakan', 'Terowongan', 'Wesel'],
      speaker: { who: 'Dimas, mekanik depo', initials: 'DM' },
      brief: 'Hujan deras sejak siang, Raka. Rel licin, jadi pakai P1–P2 waktu berangkat dan tabur pasir kalau roda selip. Satu lagi: semalam ada yang mengutak-atik wesel dekat Watu. Aku menunggu di sana.',
      weather: 'hujan deras, petir',
      intro: 'Sore yang basah, Raka. Tutup pintu, lalu berangkat pelan-pelan.',
      reward: '<strong>Cerita:</strong> Di wesel Watu, Dimas menemukan bekas linggis berlogo TransKilat. Sinyal blok Watu kini dipasangi gembok baru.',
      aboard: 12,
      route: {
        lineSpeed: 70,
        stations: [
          { name: 'PASAR LAMA', elev: '+371 m', x: 0, sched: 0, waiting: 0 },
          { name: 'KALI JERNIH', elev: '+348 m', x: 1350, sched: 780, waiting: 10, umbrellas: true },
          { name: 'WATUGEDE', elev: '+455 m', x: 3000, sched: 1920, waiting: 4, umbrellas: true, final: true },
        ],
        zones: [
          { from: -120, to: 200, limit: 40, label: 'area Stasiun Pasar Lama' },
          { from: 960, to: 1110, limit: 35, label: 'Tikungan Ledok', curve: true },
          { from: 1150, to: 1550, limit: 40, label: 'area Stasiun Kali Jernih' },
          { from: 1600, to: 1720, limit: 50, label: 'Jembatan Kali Jernih' },
          { from: 2400, to: 2700, limit: 50, label: 'Terowongan Lengkung Watu' },
          { from: 2820, to: 3160, limit: 40, label: 'area Stasiun Watugede' },
        ],
        signals: [
          { id: 'S1', x: 60, start: 0, init: 'R' },
          { id: 'J1', x: 1150, init: 'Y' },
          { id: 'S2', x: 1410, start: 1, init: 'R' },
          { id: 'B2', x: 2150, init: 'G' },
          { id: 'J2', x: 2820, init: 'G' },
        ],
        scripts: [
          {
            type: 'inspect', sig: 'B2', at: 1840, near: 260, dur: 9,
            radioRed: 'Raka, B2 kubuat merah. Wesel di depannya tidak terkunci! Berhenti sebelum sinyal, aku periksa dulu.',
            radioWork: 'Oke, kereta sudah berhenti. Aku kunci weselnya... tunggu sebentar.',
            radioDone: 'Wesel sudah terkunci. Ada bekas linggis, ini disengaja. Lanjut pelan, sinyal kuning.',
          },
        ],
        crossings: [{ x: 700, hornFrom: 420 }],
        goats: [],
        fog: null,
        bridge: { from: 1600, to: 1720 },
        tunnel: { from: 2400, to: 2700, name: 'LENGKUNG WATU', year: '1912' },
        grades: [
          { from: 250, to: 900, permil: -15, label: 'Turunan Kali Jernih' },
          { from: 1760, to: 2360, permil: 20, label: 'Tanjakan Watu' },
        ],
        switchX: 2195,
        hints: [
          { at: 40, msg: 'Rel basah: rem lebih lemah dan roda mudah selip. Berangkat dengan P1–P2.', kind: 'warn' },
          { at: 250, msg: 'Turunan 15‰ ke lembah. Tahan rem B1–B2 supaya kereta tidak kebablasan.', kind: 'warn' },
          { at: 1700, msg: 'Tanjakan 20‰ di depan. Jaga momentum, tapi siap berhenti di B2.' },
          { at: 2330, msg: 'Masuk Terowongan Lengkung Watu. Gelap, perhatikan peta jalur.' },
        ],
        bufferStop: 3100,
      },
    },
  };
  MISSIONS['1-6'] = {
    id: '1-6',
    chapter: 'Babak 1 · Jawa',
    title: 'Duel Malam Takbiran',
    startClock: 18 * 3600 + 45 * 60,
    sky: 'night',
    rain: false,
    heavy: true,
    lebaran: true,
    goal2: 'rival',
    tags: ['Malam', 'Balapan bus', 'Pemudik', 'Lewat langsung'],
    speaker: { who: 'Bu Wulan, kepala stasiun', initials: 'BW' },
    brief: 'Pak Bram menantang kita, Raka. Siapa yang lebih dulu membawa pemudik dari Watugede ke Sukamaju malam ini, dialah yang dapat kontrak angkutan Lebaran. Bus Kilat 07 cepat di jalan raya, tapi bus wajib berhenti kalau palang perlintasan turun.',
    weather: 'malam takbiran, cerah',
    intro: 'Malam takbiran! Kereta penuh pemudik. Tutup pintu dan kalahkan bus Kilat 07.',
    rewardWin: '<strong>Menang!</strong> Kontrak angkutan Lebaran jatuh ke Depo Sukamaju. Pak Bram pergi tanpa sepatah kata, tapi Dimas yakin urusan wesel belum selesai.',
    rewardLose: '<strong>Bus menang kali ini.</strong> Pak Bram tersenyum puas. Coba lagi: kalau kereta tiba di perlintasan lebih dulu, bus tertahan palang.',
    aboard: 22,
    route: {
      lineSpeed: 80,
      stations: [
        { name: 'WATUGEDE', elev: '+455 m', x: 0, sched: 0, waiting: 0 },
        { name: 'PASAR LAMA', elev: '+371 m', x: 2250, sched: 1200, waiting: 26, travelers: true },
        { name: 'SUKAMAJU', elev: '+386 m', x: 3450, sched: 1800, waiting: 6, final: true },
      ],
      passStations: [
        { name: 'KALI JERNIH', elev: '+348 m', x: 1300, waiting: 9 },
        { name: 'CIBENING', elev: '+412 m', x: 2950, waiting: 10 },
      ],
      zones: [
        { from: -120, to: 200, limit: 40, label: 'area Stasiun Watugede' },
        { from: 260, to: 520, limit: 50, label: 'Terowongan Lengkung Watu' },
        { from: 1040, to: 1160, limit: 50, label: 'Jembatan Kali Jernih' },
        { from: 1200, to: 1400, limit: 40, label: 'Stasiun Kali Jernih (langsung)' },
        { from: 1900, to: 2020, limit: 35, label: 'Tikungan Ledok', curve: true },
        { from: 2100, to: 2450, limit: 40, label: 'area Stasiun Pasar Lama' },
        { from: 2850, to: 3050, limit: 40, label: 'Stasiun Cibening (langsung)' },
        { from: 3300, to: 3560, limit: 40, label: 'area Stasiun Sukamaju' },
      ],
      signals: [
        { id: 'S1', x: 60, start: 0, init: 'R' },
        { id: 'J1', x: 1180, init: 'G' },
        { id: 'J2', x: 2100, init: 'Y' },
        { id: 'S2', x: 2310, start: 1, init: 'R' },
        { id: 'J3', x: 3300, init: 'G' },
      ],
      scripts: [],
      crossings: [{ x: 1520, hornFrom: 1220 }, { x: 2650, hornFrom: 2350 }],
      goats: [],
      fog: null,
      bridge: { from: 1040, to: 1160 },
      tunnel: { from: 260, to: 520, name: 'LENGKUNG WATU', year: '1912' },
      grades: [
        { from: 520, to: 1000, permil: -20, label: 'Turunan Watu' },
        { from: 1560, to: 1900, permil: 15, label: 'Tanjakan Ledok' },
      ],
      switchX: null,
      rival: {
        name: 'Kilat 07', startDelay: 4, cruise: 58, finish: 3440,
        segments: [
          { from: -60, to: 250, v: 30 },
          { from: 1150, to: 1450, v: 35 },
          { from: 1950, to: 2400, v: 16, label: 'macet pasar tumpah' },
          { from: 2850, to: 3100, v: 35 },
          { from: 3300, to: 3600, v: 25 },
        ],
        stops: [{ x: 2240, dur: 20, label: 'terminal Pasar Lama' }],
      },
      hints: [
        { at: 40, msg: 'Kereta penuh pemudik: lebih berat, percepatan dan pengereman lebih lambat.', kind: 'warn' },
        { at: 1120, msg: 'Kali Jernih dilewati langsung. Jaga 40 km/h, tidak perlu berhenti.' },
        { at: 1950, msg: 'Jalan raya macet di pasar tumpah. Kesempatan menyalip bus!' },
        { at: 2820, msg: 'Cibening dilewati langsung. Sukamaju sudah dekat.' },
      ],
      bufferStop: 3550,
    },
  };
  MISSIONS['2-1'] = {
    id: '2-1',
    chapter: 'Babak 2 · Sumatra',
    title: 'Emas Hitam',
    startClock: 7 * 3600 + 10 * 60,
    sky: 'dawn',
    rain: false,
    freight: true,
    wagons: 4,
    land: 'sawit',
    ticket: 'jungle',
    tags: ['Kereta barang', 'Muat presisi', 'Gajah', 'Turunan panjang'],
    speaker: { who: 'Sari, PPKA magang', initials: 'SR' },
    brief: 'Selamat datang di Sumatra, Raka! Hari ini Si Gagah menarik empat gerbong batu bara dari Tambang Muara Kelam ke Dermaga Tanjung Api. Muat satu per satu tepat di bawah corong. Rangkaian penuh itu berat, jadi mulai mengerem jauh lebih awal, apalagi di turunan menuju pantai.',
    weather: 'pagi berkabut tipis',
    intro: 'Maju pelan ke corong muat. Hentikan gerbong 1 tepat di bawah corong.',
    reward: '<strong>Cerita:</strong> Di dermaga, Sari menunjukkan peta tua milik kakek Raka: ada jalur cabang yang dulu ditutup menuju pedalaman Bukit Barisan. Babak 2 baru dimulai.',
    aboard: 0,
    route: {
      lineSpeed: 60,
      startX: 150,
      loading: { silo: 160 },
      stations: [
        { name: 'TAMBANG MUARA KELAM', elev: '+212 m', x: 0, sched: 0, waiting: 0, depot: true },
        { name: 'DERMAGA TANJUNG API', elev: '+4 m', x: 3300, sched: 2100, waiting: 0, final: true, port: true },
      ],
      zones: [
        { from: -150, to: 255, limit: 15, label: 'area muat tambang' },
        { from: 255, to: 430, limit: 30, label: 'emplasemen tambang' },
        { from: 1150, to: 1300, limit: 35, label: 'Tikungan Bukit Barisan', curve: true },
        { from: 2450, to: 2600, limit: 40, label: 'Tikungan Pantai', curve: true },
        { from: 2700, to: 2830, limit: 50, label: 'Jembatan Way Sekampung' },
        { from: 3050, to: 3400, limit: 30, label: 'area dermaga' },
      ],
      signals: [
        { id: 'S1', x: 265, start: 0, init: 'R' },
        { id: 'B1', x: 1420, init: 'G' },
        { id: 'J1', x: 3050, init: 'Y' },
      ],
      scripts: [],
      crossings: [{ x: 2950, hornFrom: 2650 }],
      goats: [],
      elephants: { x: 1700, trigger: 1180, cross: 12 },
      fog: { from: 380, to: 1000 },
      bridge: { from: 2700, to: 2830 },
      tunnel: null,
      grades: [
        { from: 600, to: 1100, permil: 12, label: 'Tanjakan Muara' },
        { from: 1900, to: 2450, permil: -16, label: 'Turunan Pantai' },
      ],
      switchX: null,
      hints: [
        { at: 280, msg: 'Rangkaian penuh sangat berat: percepatan lambat, jarak pengereman jauh lebih panjang.', kind: 'warn' },
        { at: 1880, msg: 'Turunan panjang 16‰ ke pantai. Tahan rem dari sekarang, jangan biarkan kereta kebablasan.', kind: 'warn' },
        { at: 2900, msg: 'Dermaga di depan. Berhenti tepat di marka bongkar.' },
      ],
      bufferStop: 3400,
    },
  };
  MISSIONS['1-7'] = {
    id: '1-7',
    chapter: 'Babak 1 · Jawa',
    title: 'Bersilang di Krajan',
    startClock: 16 * 3600 + 10 * 60,
    sky: 'storm',
    rain: true,
    tags: ['Lintas tunggal', 'Persilangan', 'Pohon tumbang', 'Banjir'],
    speaker: { who: 'Dimas, mekanik depo', initials: 'DM' },
    brief: 'Hujan mulai reda, Raka, tapi lintas selatan masih berantakan. Jalur ke Kedung Banteng hanya satu rel. Di Halte Krajan kita bersilang dengan KA 112 Lintas Selatan dari arah berlawanan: masuk sepur belok pelan, berhenti sebelum patok bebas, lalu tunggu dia lewat. Angin tadi siang menumbangkan pohon di beberapa tempat, dan ada rel yang tergenang.',
    weather: 'hujan reda, angin kencang',
    intro: 'Tutup pintu dan berangkat. Waspadai pohon tumbang setelah Watugede.',
    reward: '<strong>Cerita:</strong> Masinis KA 112 membunyikan klakson dua kali saat bersilang, tanda hormat untuk Si Gagah. Di Kedung Banteng, kepala stasiun menyerahkan surat tugas baru: Raka diminta ke Sumatra.',
    aboard: 10,
    route: {
      lineSpeed: 70,
      stations: [
        { name: 'WATUGEDE', elev: '+455 m', x: 0, sched: 0, waiting: 0 },
        { name: 'KRAJAN', elev: '+402 m', x: 1500, sched: 1140, waiting: 5, umbrellas: true },
        { name: 'KEDUNG BANTENG', elev: '+318 m', x: 3400, sched: 2700, waiting: 6, umbrellas: true, final: true },
      ],
      zones: [
        { from: -120, to: 200, limit: 40, label: 'area Stasiun Watugede' },
        { from: 1310, to: 1335, limit: 30, label: 'wesel masuk Krajan', turnout: true },
        { from: 1200, to: 1640, limit: 40, label: 'area Halte Krajan' },
        { from: 1610, to: 1635, limit: 30, label: 'wesel keluar Krajan', turnout: true },
        { from: 2290, to: 2400, limit: 10, label: 'rel tergenang', flood: true },
        { from: 2760, to: 2880, limit: 45, label: 'Tikungan Kedung', curve: true },
        { from: 3250, to: 3510, limit: 40, label: 'area Stasiun Kedung Banteng' },
      ],
      signals: [
        { id: 'S1', x: 60, start: 0, init: 'R' },
        { id: 'J1', x: 1250, init: 'Y' },
        { id: 'S2', x: 1540, start: 1, init: 'R' },
        { id: 'J2', x: 3250, init: 'G' },
      ],
      scripts: [],
      crossings: [{ x: 3050, hornFrom: 2750 }],
      goats: [],
      fog: null,
      bridge: null,
      tunnel: null,
      grades: [
        { from: 1800, to: 2250, permil: -14, label: 'Turunan Kedung' },
      ],
      switchX: null,
      // pohon tumbang di titik acak dalam zona ini; peringatan radio sekitar 400 m sebelumnya
      tree: { from: 520, to: 1100, warn: 420 },
      // genangan menutup rel: maksimal 10 km/h, dilarang berhenti di air
      flood: { from: 2330, to: 2400 },
      // persilangan: sepur belok Krajan antara dua wesel, KA 112 lewat di jalur utama (sisi depan)
      meet: { st: 1, entry: 1310, exit: 1610, foul: 1548, name: 'KA 112', cars: 5 },
      hints: [
        { at: 40, msg: 'Rel masih basah: rem lebih lemah. Berangkat dengan P1–P2.', kind: 'warn' },
        { at: 1180, msg: 'Sinyal masuk J1 kuning: Si Gagah dibelokkan ke sepur belok Krajan. Maksimal 30 km/h di wesel.', kind: 'warn' },
        { at: 2130, msg: 'Rel tergenang di depan. Maksimal 10 km/h dan jangan berhenti di air.', kind: 'warn' },
      ],
      bufferStop: 3510,
    },
  };
  MISSIONS['2-2'] = {
    id: '2-2',
    chapter: 'Babak 2 · Sumatra',
    title: 'Jalur yang Ditutup',
    startClock: 19 * 3600 + 40 * 60,
    sky: 'night',
    rain: false,
    dark: true,
    grass: true,
    coaches: 1,
    land: 'sawit',
    ticket: 'jungle',
    tags: ['Malam gelap', 'Sinyal semafor', 'Jembatan kayu', 'Kabut lembah'],
    speaker: { who: 'Sari, PPKA magang', initials: 'SR' },
    brief: 'Peta kakekmu benar, Raka. Jalur cabang ke pedalaman Bukit Barisan masih ada, hanya lama tidak dipakai. Malam ini kita jalankan kereta inspeksi, satu gerbong saja. Sinyalnya masih semafor tua: lengan mendatar berarti berhenti, lengan terangkat berarti aman. Jembatan kayu Lubuk Tua maksimal 15 km/h, dan rumput di antara rel membuat rem lebih lemah.',
    weather: 'malam, kabut di lembah',
    intro: 'Kereta inspeksi siap. Tutup pintu; jalur di depan hanya diterangi lampu sorot.',
    reward: '<strong>Cerita:</strong> Di Simpang Barisan, Sari menemukan buku harian kepala stasiun tahun 1950-an: jalur ini dulu mengangkut kopi rakyat. Warga desa sudah menunggu di peron, membawa karung kopi.',
    aboard: 3,
    route: {
      lineSpeed: 45,
      stations: [
        { name: 'MUARA KELAM', elev: '+212 m', x: 0, sched: 0, waiting: 0 },
        { name: 'LUBUK TUA', elev: '+268 m', x: 1500, sched: 1100, waiting: 2 },
        { name: 'SIMPANG BARISAN', elev: '+340 m', x: 3200, sched: 2300, waiting: 0, final: true },
      ],
      zones: [
        { from: -150, to: 200, limit: 25, label: 'emplasemen Muara Kelam' },
        { from: 880, to: 1000, limit: 30, label: 'Tikungan Lubuk', curve: true },
        { from: 1380, to: 1600, limit: 30, label: 'Halte Lubuk Tua' },
        { from: 2050, to: 2110, limit: 15, label: 'Jembatan Kayu Lubuk Tua', wood: true },
        { from: 3050, to: 3300, limit: 25, label: 'emplasemen Simpang Barisan' },
      ],
      signals: [
        { id: 'S1', x: 60, start: 0, init: 'R', sema: true },
        { id: 'M1', x: 1250, init: 'R', sema: true },
        { id: 'S2', x: 1540, start: 1, init: 'R', sema: true },
        { id: 'M2', x: 2900, init: 'G', sema: true },
      ],
      scripts: [
        { type: 'hold', sig: 'M1', at: 700, near: 140, wait: 5, radio: 'Lengan M1 sudah kunaikkan. Jalur ke Lubuk Tua aman, maju pelan.' },
      ],
      crossings: [],
      goats: [],
      fog: { from: 500, to: 2750 },
      bridge: { from: 2050, to: 2110, wood: true },
      tunnel: null,
      grades: [
        { from: 350, to: 820, permil: 14, label: 'Tanjakan Muara' },
        { from: 2300, to: 2800, permil: 12, label: 'Tanjakan Barisan' },
      ],
      switchX: null,
      hints: [
        { at: 40, msg: 'Rumput di antara rel: rem sedikit lebih lemah. Mulai mengerem lebih awal.', kind: 'warn' },
        { at: 820, msg: 'Semafor M1 di depan dalam kabut. Lengan mendatar berarti berhenti.', kind: 'warn' },
        { at: 1830, msg: 'Jembatan kayu tua di depan. Maksimal 15 km/h, di atas 25 km/h jembatan tidak kuat.', kind: 'warn' },
      ],
      bufferStop: 3300,
    },
  };
  MISSIONS['2-3'] = {
    id: '2-3',
    chapter: 'Babak 2 · Sumatra',
    title: 'Kereta Rakyat',
    startClock: 6 * 3600 + 20 * 60,
    sky: 'dawn',
    rain: false,
    coaches: 2,
    land: 'sawit',
    ticket: 'jungle',
    tags: ['Menyambung gerbong', 'Hari pasar', 'Rangkaian lebih panjang'],
    speaker: { who: 'Sari, PPKA magang', initials: 'SR' },
    brief: 'Warga sepanjang jalur cabang minta tolong, Raka. Panen kopi harus sampai ke Muara Kelam pagi ini. Di Pasar Kopi Liwa, warga mendorong gerbong kopi ke belakang rangkaian. Setelah pintu ditutup, mundur pelan dan sambung: sentuh gerbong paling cepat 3 km/h, lalu tekan Sambung. Rangkaian jadi lebih panjang dan lebih berat.',
    weather: 'pagi berkabut tipis',
    intro: 'Hari pasar! Tutup pintu dan berangkat ke Pasar Kopi Liwa.',
    reward: '<strong>Cerita:</strong> Gerbong kopi tiba utuh di Muara Kelam. Pak Kades menitipkan sekarung kopi untuk Kakek, dan kabar bahwa jalur cabang akan dibuka lagi untuk umum.',
    aboard: 8,
    route: {
      lineSpeed: 50,
      stations: [
        { name: 'SIMPANG BARISAN', elev: '+340 m', x: 0, sched: 0, waiting: 0 },
        { name: 'PASAR KOPI LIWA', elev: '+296 m', x: 1500, sched: 900, waiting: 12, traders: true, couple: true },
        { name: 'MUARA KELAM', elev: '+212 m', x: 3500, sched: 2420, waiting: 0, final: true },
      ],
      zones: [
        { from: -150, to: 200, limit: 25, label: 'emplasemen Simpang Barisan' },
        { from: 1350, to: 1600, limit: 30, label: 'area Pasar Kopi Liwa' },
        { from: 2200, to: 2340, limit: 35, label: 'Tikungan Kopi', curve: true },
        { from: 3350, to: 3600, limit: 30, label: 'emplasemen Muara Kelam' },
      ],
      signals: [
        { id: 'S1', x: 60, start: 0, init: 'R' },
        { id: 'J1', x: 1250, init: 'G' },
        { id: 'S2', x: 1560, start: 1, init: 'R' },
        { id: 'J2', x: 3300, init: 'Y' },
      ],
      scripts: [],
      crossings: [{ x: 2750, hornFrom: 2450 }],
      goats: [{ x: 900, hornFrom: 680 }],
      fog: { from: 200, to: 700 },
      bridge: null,
      tunnel: null,
      grades: [
        { from: 1800, to: 2200, permil: -12, label: 'Turunan Liwa' },
      ],
      switchX: null,
      couple: { st: 1, gap: 45 },
      hints: [
        { at: 40, msg: 'Kabut pagi tipis. Kambing sering merumput di rel dekat kebun kopi.' },
        { at: 1200, msg: 'Pasar Kopi Liwa di depan: berhenti di marka, lalu sambung gerbong kopi di belakang.' },
        { at: 1700, msg: 'Rangkaian kini lebih berat: mulai mengerem lebih awal di turunan Liwa.', kind: 'warn' },
      ],
      bufferStop: 3600,
    },
  };
  const MISSION_ORDER = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '2-1', '2-2', '2-3'];
  // palet khas tiap misi: warna langit (fajar → siang, atau gelap/mendung), dan gradasi warna akhir
  // (soft-light) yang diterapkan ke seluruh dunia game, ditambah kabut lembap untuk Sumatra
  const PALETTES = {
    '1-4': { sky: [['#3a3f6e', '#5d9fd3'], ['#e39a6a', '#a8d2ea'], ['#ffd48a', '#f2ecd8']], grade: ['rgba(255,170,80,0.22)', 'rgba(255,205,120,0.14)'] },
    '1-5': { storm: ['#24323d', '#4f6673', '#86a0aa'], grade: ['rgba(60,115,150,0.26)', 'rgba(40,95,105,0.2)'] },
    '1-6': { night: ['#120b2c', '#3a2366', '#8a4170'], grade: ['rgba(150,60,180,0.24)', 'rgba(255,120,60,0.12)'] },
    '1-7': { storm: ['#34434e', '#62798a', '#a7b8bd'], grade: ['rgba(80,125,140,0.2)', 'rgba(60,100,90,0.16)'] },
    '2-2': { night: ['#05081a', '#141c3a', '#2a2f52'], grade: ['rgba(60,80,150,0.24)', 'rgba(20,40,60,0.2)'], mist: true },
    '2-3': { sky: [['#5a6a7e', '#8aa0aa'], ['#d9b48a', '#e6d8b8'], ['#f0d29a', '#f2ead2']], grade: ['rgba(230,180,110,0.2)', 'rgba(120,80,40,0.16)'], mist: true },
    '2-1': { sky: [['#4a6a6e', '#6a9aa6'], ['#b9b08a', '#cfd9c0'], ['#ead6a4', '#f0ead2']], grade: ['rgba(200,215,170,0.2)', 'rgba(160,70,40,0.2)'], mist: true },
  };
  const ROUTE_LM = {
    '1-1': [{ id: 'menara', x: 260 }],
    '1-2': [{ id: 'pg', x: 640 }],
    '1-3': [{ id: 'asam', x: 1020 }],
    '1-4': [{ id: 'candi', x: 520 }, { id: 'pg', x: 820 }, { id: 'masjid', x: 2330 }],
    '1-5': [{ id: 'gunung', x: 700 }, { id: 'curug', x: 1950 }],
    '1-6': [{ id: 'pasar', x: 2060 }, { id: 'masjid', x: 2420 }],
    '1-7': [{ id: 'beringin', x: 1250 }, { id: 'waduk', x: 2650 }],
    '2-2': [{ id: 'jembatan', x: 2110, card: true }],
    '2-3': [{ id: 'kopi', x: 1430 }],
    '2-1': [{ id: 'sawit', x: 620 }, { id: 'barisan', x: 1450 }, { id: 'panggung', x: 2050 }, { id: 'mercu', x: 3150 }],
  };
  MISSION_ORDER.forEach((id) => { MISSIONS[id].route.landmarks = ROUTE_LM[id] || []; });
  MISSION_ORDER.forEach((id) => { MISSIONS[id].id = id; MISSIONS[id].pal = PALETTES[id] || PALETTES['1-4']; });
  let MIS = MISSIONS['1-4'];
  let ROUTE = MIS.route;
  const finalStation = () => ROUTE.stations[ROUTE.stations.length - 1];
  const markNum = () => N_COACH + 1 + (S && S.coupled ? 1 : 0); // marka henti = jumlah kendaraan dalam rangkaian
  const baseLen = () => LOCO_LEN + N_COACH * (CAR_LEN + GAP);
  const titleCase = (s) => s.toLowerCase().replace(/(^|\s)(\w)/g, (m0, sp, ch) => sp + ch.toUpperCase());

  // Tuas: indeks 0 (atas) .. 9 (bawah); notch = 4 - indeks
  const NOTCHES = ['P4', 'P3', 'P2', 'P1', 'N', 'B1', 'B2', 'B3', 'B4', 'EB'];
  const notchLabel = (n) => NOTCHES[4 - n];

  // ---------- audio (WebAudio sintetis, tanpa berkas) ----------
  // Mixer: setiap kelompok bunyi punya jalur sendiri (mesin, rem, pintu, efek, suasana, musik).
  // Semua jalur masuk ke master -> peredam frekuensi tinggi -> kompresor lembut, dengan gema
  // ringan yang menguat di terowongan. Bunyi penting (pintu, rem berhenti, pengumuman) menurunkan
  // suasana & musik sesaat (ducking) supaya tidak bertabrakan, lalu naik kembali perlahan.
  const Sound = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    const MIX = { master: 0.85, engine: 0.9, brake: 0.8, door: 0.85, sfx: 0.75, amb: 0.7, musicIdle: 0.15, musicPlay: 0.08 };
    let ac = null, master = null;
    let engine = null, brake = null, door = null, sfx = null, amb = null, music = null;
    let engineSend = null, brakeSend = null, revOut = null;
    const duckNode = {}, duckEnd = { amb: 0, music: 0, engine: 0 }, duckDepth = { amb: 0, music: 0, engine: 0 };
    let white = null, brown = null, panOk = false;
    let muted = store.get('rn.mute') === '1';
    let musicOn = store.get('rn.music') !== '0';
    const L = {};                    // lapisan bunyi kontinu
    const tails = [];                // ekor desis yang boleh dipotong halus
    let nextBird = 0, nextBell = 0, nextCricket = 0, nextFrog = 0, nextBedug = 6, nextDove = 4, nextRooster = 3, nextCicada = 8, nextBird2 = 1.5;
    let eventBusyUntil = 0;
    let musicTimer = null, nextBeat = 0, beat = 0, musicLevel = MIX.musicIdle;
    let idVoice = null;
    let lastJoint = null, nextPump = 0, rpm = 0.2, turboS = 0.2, lastUpd = 0, lastFX = null;
    let hornNodes = null, track = { turnouts: [], decks: [], bridge: null }, railBus = null, lastGirder = null, nextStep = 0;
    const meters = {};

    function g(v) { const n = ac.createGain(); n.gain.value = v; return n; }
    function set(param, v, tc = 0.15) { param.setTargetAtTime(v, ac.currentTime, tc); }
    function makeNoise(sec, isBrown) {
      const len = Math.floor(ac.sampleRate * sec);
      const b = ac.createBuffer(1, len, ac.sampleRate);
      const d = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (isBrown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
      return b;
    }
    function makeIR(sec, decay) {
      const len = Math.floor(ac.sampleRate * sec);
      const b = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) { lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45; d[i] = lp * Math.pow(1 - i / len, decay); }
      }
      return b;
    }
    function loop(buf, type, freq, q, bus) {
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const gn = g(0);
      src.connect(f).connect(gn).connect(bus);
      src.start(0, Math.random() * buf.duration);
      return { f, g: gn };
    }
    function panner(p) {
      if (!panOk) return null;
      const n = ac.createStereoPanner(); n.pan.value = p; return n;
    }
    function mkBus(name, level, send, revIn, duckable) {
      const b = g(level);
      let tail = b;
      if (duckable) { duckNode[name] = g(1); b.connect(duckNode[name]); tail = duckNode[name]; }
      tail.connect(master);
      const s = g(send); tail.connect(s); s.connect(revIn);
      if (window.__rnAudioDebug) { const an = ac.createAnalyser(); an.fftSize = 2048; tail.connect(an); meters[name] = an; }
      return { in: b, send: s };
    }

    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      if (!AC) return;
      try {
        ac = new AC();
        panOk = typeof ac.createStereoPanner === 'function';
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.006; comp.release.value = 0.3;
        const lowcut = ac.createBiquadFilter(); lowcut.type = 'highpass'; lowcut.frequency.value = 28;
        const soft = ac.createBiquadFilter(); soft.type = 'highshelf'; soft.frequency.value = 6500; soft.gain.value = -4;
        master = g(muted ? 0 : MIX.master);
        master.connect(lowcut).connect(soft).connect(comp).connect(ac.destination);
        if (window.__rnAudioDebug) { const an = ac.createAnalyser(); an.fftSize = 2048; comp.connect(an); meters.out = an; }
        // gema ringan bersama
        const revIn = g(1), conv = ac.createConvolver();
        conv.buffer = makeIR(1.6, 3);
        revOut = g(0.2);
        revIn.connect(conv).connect(revOut).connect(master);

        white = makeNoise(2.2, false); brown = makeNoise(3.1, true);
        const E = mkBus('engine', MIX.engine, 0.12, revIn, true); engine = E.in; engineSend = E.send;
        const B = mkBus('brake', MIX.brake, 0.15, revIn, false); brake = B.in; brakeSend = B.send;
        door = mkBus('door', MIX.door, 0.1, revIn, false).in;
        sfx = mkBus('sfx', MIX.sfx, 0.1, revIn, false).in;
        amb = mkBus('amb', MIX.amb, 0.05, revIn, true).in;
        music = mkBus('music', musicOn ? musicLevel : 0, 0.15, revIn, true).in;

        // lapisan kontinu mesin & roda
        L.rumble = loop(brown, 'lowpass', 140, 0.7, engine);    // gemuruh roda di rel
        // jembatan: bunyi roda lewat jalur 'rail' yang juga dikirim ke gema lembah
        railBus = g(1); railBus.connect(engine);
        {
          const dl = ac.createDelay(1); dl.delayTime.value = 0.36;
          const fb = g(0.32), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
          L.echoSend = g(0); railBus.connect(L.echoSend).connect(dl);
          dl.connect(lp).connect(fb).connect(dl); lp.connect(g(0.9)).connect(engine);
        }
        L.boom = loop(brown, 'bandpass', 150, 2.5, engine);      // dentum berongga gelagar
        {
          // dengung baja panjang dengan tremolo, dan denting halus rangka di atasnya
          const steel = g(0), sw = g(0.6), trem = ac.createOscillator(), tg = g(0.4);
          trem.frequency.value = 3.1; trem.connect(tg).connect(sw.gain); trem.start();
          sw.connect(steel).connect(engine);
          [87, 131, 196, 262].forEach((f, i) => { const o = ac.createOscillator(); o.type = i === 3 ? 'triangle' : 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004); o.connect(g([1, 0.7, 0.4, 0.15][i])).connect(sw); o.start(); });
          const ring = g(0);
          [1180, 1745, 2630].forEach((f, i) => { const o = ac.createOscillator(); o.frequency.value = f; const lfo = ac.createOscillator(); lfo.frequency.value = 0.7 + i * 0.5; const og = g(0.5); lfo.connect(g(0.5)).connect(og.gain); o.connect(og).connect(ring); o.start(); lfo.start(); });
          ring.connect(engine);
          L.steel = { g: steel }; L.ring = { g: ring };
        }
        L.hiss = loop(white, 'bandpass', 2400, 0.5, engine);    // desis sistem udara saat diam (lembut)
        // mesin diesel: dua gergaji sedikit sumbang + sub-oktaf, diredam lowpass, berdenyut seperti silinder
        {
          const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 0.9;
          const am = g(0.75), out = g(0);
          const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 26;
          const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 26.2;
          const o3 = ac.createOscillator(); o3.type = 'square'; o3.frequency.value = 13;
          const o3g = g(0.45);
          o1.connect(f); o2.connect(f); o3.connect(o3g).connect(f);
          const puls = ac.createOscillator(); puls.type = 'sine'; puls.frequency.value = 6.5;
          const pg = g(0.25); puls.connect(pg).connect(am.gain);
          f.connect(am).connect(out).connect(engine);
          [o1, o2, o3, puls].forEach((o) => o.start());
          L.diesel = { o1, o2, o3, puls, f, g: out };
        }
        // desing turbo dan udara masuk
        {
          const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 1200;
          const gn = g(0); o.connect(gn).connect(engine); o.start();
          L.turbo = { o, g: gn };
        }
        L.turboAir = loop(white, 'bandpass', 2000, 0.8, engine);
        L.exhaust = loop(brown, 'lowpass', 110, 0.7, engine);    // gemuruh knalpot
        // denyut pembakaran: noise yang dibuka-tutup sesuai frekuensi letupan silinder ("dug-dug-dug")
        {
          const src = ac.createBufferSource(); src.buffer = brown; src.loop = true;
          const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 240; bp.Q.value = 1.1;
          const am = g(0), out = g(0);
          const mod = ac.createOscillator(); mod.type = 'sine'; mod.frequency.value = 10;
          const sh = ac.createWaveShaper(); const curve = new Float32Array(256);
          for (let i = 0; i < 256; i++) { const x = i / 127.5 - 1; curve[i] = Math.pow(Math.max(0, x), 3); }
          sh.curve = curve;
          mod.connect(sh).connect(am.gain);
          src.connect(bp).connect(am).connect(out).connect(engine);
          src.start(0, Math.random() * 2); mod.start();
          L.comb = { mod, bp, g: out };
        }
        // geraman saat menarik beban: cabang terdistorsi lembut dari suara mesin
        {
          const sh = ac.createWaveShaper(); const curve = new Float32Array(512);
          for (let i = 0; i < 512; i++) { const x = i / 255.5 - 1; curve[i] = Math.tanh(x * 4); }
          sh.curve = curve;
          const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
          const out = g(0);
          L.diesel.f.connect(sh).connect(lp).connect(out).connect(engine);
          L.grit = { g: out };
        }
        // desis rel saat melaju ("rel bernyanyi") dan decit flens roda di tikungan
        L.railHiss = loop(white, 'bandpass', 2600, 0.5, engine);
        {
          const sq2 = g(0), f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 3600; f2.Q.value = 5;
          [3420, 3880].forEach((fq, i) => {
            const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = fq;
            const lfo = ac.createOscillator(); lfo.frequency.value = 2.3 + i * 1.7;
            const lg = g(40); lfo.connect(lg).connect(o.frequency);
            o.connect(f2); o.start(); lfo.start();
          });
          f2.connect(sq2).connect(brake);
          L.flange = { g: sq2 };
        }
        // dengung motor traksi listrik (naik turun mengikuti kecepatan)
        {
          const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = 100;
          const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 300;
          const gn = g(0), g2 = g(0.35);
          o.connect(gn); o2.connect(g2).connect(gn); gn.connect(engine); o.start(); o2.start();
          L.motor = { o, o2, g: gn };
        }
        // rem: gesekan blok rem dan decit roda
        L.grind = loop(white, 'bandpass', 1400, 0.9, brake);
        const sq = g(0), sqf = ac.createBiquadFilter();
        sqf.type = 'bandpass'; sqf.frequency.value = 3000; sqf.Q.value = 3;
        [2850, 3170].forEach((f, i) => {
          const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          const lfo = ac.createOscillator(); lfo.frequency.value = 4.1 + i * 1.3;
          const lg = g(16); lfo.connect(lg).connect(o.frequency);
          o.connect(sqf); o.start(); lfo.start();
        });
        sqf.connect(sq).connect(brake);
        L.squeal = { g: sq };
        // suasana
        L.wind = loop(brown, 'bandpass', 520, 0.6, amb);
        L.river = loop(white, 'bandpass', 900, 0.6, amb);
        L.crowd = loop(brown, 'bandpass', 520, 1.3, amb);
        L.rain = loop(white, 'bandpass', 2400, 0.35, amb);
        L.rainLow = loop(brown, 'lowpass', 500, 0.5, amb);
        // gemerisik daun pepohonan: noise lembut yang naik-turun pelan seperti tertiup angin
        L.leaves = loop(white, 'bandpass', 1500, 0.4, amb);
        {
          const lpL = ac.createBiquadFilter(); lpL.type = 'lowpass'; lpL.frequency.value = 2600;
          L.leaves.g.disconnect(); L.leaves.g.connect(lpL).connect(amb);
          const swell = g(0.6), l1 = ac.createOscillator(), l2 = ac.createOscillator();
          l1.frequency.value = 0.07; l2.frequency.value = 0.19;
          l1.connect(g(0.35)).connect(swell.gain); l2.connect(g(0.18)).connect(swell.gain);
          l1.start(); l2.start();
          L.leavesOut = swell; lpL.disconnect(); lpL.connect(swell).connect(amb);
        }
        const lfo = ac.createOscillator(); lfo.frequency.value = 0.11;
        const lg = g(0.025); lfo.connect(lg).connect(L.wind.g.gain); lfo.start();
        const mod = ac.createOscillator(); mod.frequency.value = 3.3;
        const mg = g(0.03); mod.connect(mg).connect(L.crowd.g.gain); mod.start();

        loadVoice();
        startMusic();
      } catch (e) { ac = null; }
    }

    function loadVoice() {
      if (!('speechSynthesis' in window)) return;
      const pick = () => {
        const vs = window.speechSynthesis.getVoices() || [];
        idVoice = vs.find((v) => /^(id|in)[-_]/i.test(v.lang)) || null;
      };
      pick();
      try { window.speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) { /* old webview */ }
    }

    // ---- pengatur prioritas: ducking & antrean peristiwa ----
    function duck(amounts, dur) {
      if (!ac) return;
      const t = ac.currentTime;
      for (const k of Object.keys(amounts)) {
        const node = duckNode[k];
        if (!node) continue;
        const active = t < duckEnd[k];
        const depth = active ? Math.max(duckDepth[k], amounts[k]) : amounts[k];
        const end = Math.max(duckEnd[k], t + dur);
        duckDepth[k] = depth; duckEnd[k] = end;
        const p = node.gain;
        p.cancelScheduledValues(t);
        p.setTargetAtTime(1 - depth, t, 0.08);
        p.setTargetAtTime(1, end, 0.45);
      }
    }
    function busyFor(dur) { if (ac) eventBusyUntil = Math.max(eventBusyUntil, ac.currentTime + dur); }
    function fadeTails(t) {
      while (tails.length) { const n = tails.pop(); try { n.gain.cancelScheduledValues(t); n.gain.setTargetAtTime(0.0001, t, 0.06); } catch (e) { /* done */ } }
    }

    // ---- bunyi sesaat ----
    function nz(t, type, freq, q, vol, dur, bus, attack = 0.012) {
      const src = ac.createBufferSource(); src.buffer = white;
      const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + attack);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(gn).connect(bus || sfx);
      src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
      return gn;
    }
    function burst(freq, q, vol, dur, type, bus, delay = 0) {
      if (!ac || muted) return;
      nz(ac.currentTime + delay, type, freq, q, vol, dur, bus);
    }
    function tone(freq, vol, dur, opts = {}) {
      if (!ac || muted) return;
      const t = opts.at !== undefined ? opts.at : ac.currentTime + (opts.delay || 0);
      const o = ac.createOscillator(); o.type = opts.type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.glide || dur));
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.008));
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let out = o.connect(gn);
      const pn = opts.pan !== undefined ? panner(opts.pan) : null;
      if (pn) out = out.connect(pn);
      out.connect(opts.bus || sfx);
      o.start(t); o.stop(t + dur + 0.05);
    }
    // desis udara dengan filter bergeser (katup rem, pintu pneumatik)
    function hiss(t, dur, vol, f0, f1, bus) {
      // desis dibuat lebih lembut: volume dikurangi, frekuensi diturunkan, puncak tajam dipotong lowpass,
      // naik dan turun lebih pelan agar tidak menusuk telinga
      vol *= 0.5; f0 *= 0.72; f1 *= 0.72;
      const src = ac.createBufferSource(); src.buffer = white;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.45;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.5;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.18, dur * 0.3));
      gn.gain.setTargetAtTime(0.0001, t + dur * 0.4, dur * 0.3);
      src.connect(f).connect(lp).connect(gn).connect(bus);
      src.start(t, Math.random() * 1.2); src.stop(t + dur * 1.6 + 0.05);
      return gn;
    }
    // logam berbilah (saron/bonang/bel): nada dasar + parsial tak harmonis + "ombak" (detak)
    function metal(freq, vol, dur, bus, delay = 0) {
      tone(freq, vol, dur, { bus, delay });
      tone(freq + 2.6, vol * 0.6, dur * 0.9, { bus, delay });
      tone(freq * 2.76, vol * 0.18, dur * 0.35, { bus, delay });
      tone(freq * 4.1, vol * 0.06, dur * 0.18, { bus, delay });
    }

    // ---- roda & udara ----
    function clack(t, vol) { // "jeglak" roda melewati sambungan rel: tik logam + dentum + dengung rel
      const b = railBus || engine;
      nz(t, 'highpass', 2600, 0.8, vol * 0.6, 0.025, b, 0.002);
      nz(t, 'bandpass', 420 + Math.random() * 80, 1.1, vol, 0.07, b, 0.003);
      tone(1800 + Math.random() * 250, vol * 0.1, 0.09, { at: t, bus: b, attack: 0.002 });
    }
    function girder(t, vol) { // dentum berongga tiap segmen gelagar jembatan
      nz(t, 'lowpass', 190, 0.8, vol * 1.6, 0.2, railBus, 0.004);
      tone(96, vol * 0.9, 0.35, { at: t, to: 82, bus: railBus, attack: 0.004 });
      clack(t + 0.004, vol * 0.45);
    }
    function klang(t, vol) { // sambungan muai di ujung jembatan
      clack(t, vol * 1.3);
      tone(420 + Math.random() * 40, vol * 0.5, 0.25, { at: t + 0.002, type: 'triangle', bus: railBus, attack: 0.002 });
      tone(633, vol * 0.25, 0.4, { at: t + 0.002, bus: railBus, attack: 0.002 });
      nz(t, 'lowpass', 220, 0.8, vol * 1.8, 0.18, railBus, 0.003);
    }
    function pump(t) { // pompa udara lokomotif saat berhenti
      nz(t, 'lowpass', 300, 0.7, 0.03, 0.2, engine, 0.03);
      tone(95, 0.025, 0.16, { at: t, to: 80, bus: engine, attack: 0.02 });
      nz(t + 0.55, 'lowpass', 280, 0.7, 0.02, 0.18, engine, 0.03);
    }
    // posisi gandar (m di belakang moncong): lokomotif + dua gerbong
    let AXLES = [1.8, 3.5, 5.2, 10.45, 12.15, 13.85, 20.4, 22.5, 31.9, 34.0, 41.6, 43.7, 53.1, 55.2, 62.8, 64.9, 74.3, 76.4];

    // ---- musik latar bernuansa gamelan (laras slendro, buatan sendiri) ----
    const SL = { 1: 1, 2: 1.147, 3: 1.318, 5: 1.512, 6: 1.737, 7: 2 }; // 7 = 1 tinggi
    const BALUNGAN = [2, 1, 2, 6, 2, 1, 2, 6, 3, 5, 6, 7, 6, 5, 3, 2, 5, 3, 5, 6, 7, 6, 5, 3, 6, 5, 3, 2, 3, 5, 3, 2];
    const BASE = 233;
    const BEAT = 0.62;
    function startMusic() {
      if (musicTimer) return;
      nextBeat = ac.currentTime + 0.3;
      musicTimer = setInterval(scheduleMusic, 90);
    }
    function scheduleMusic() {
      if (!ac || ac.state !== 'running') return;
      while (nextBeat < ac.currentTime + 0.4) { playBeat(beat, nextBeat - ac.currentTime); nextBeat += BEAT; beat++; }
    }
    function playBeat(i, d) {
      if (muted || !musicOn) return;
      const n = BALUNGAN[i % BALUNGAN.length];
      const nx = BALUNGAN[(i + 1) % BALUNGAN.length];
      const pos = i % 16;
      metal(BASE * SL[n], 0.22, 1.5, music, d);                       // saron
      metal(BASE * 2 * SL[n], 0.07, 0.5, music, d + BEAT * 0.5);      // bonang (imbal)
      metal(BASE * 2 * SL[nx], 0.05, 0.4, music, d + BEAT * 0.75);
      if (pos % 4 === 3) metal(BASE * 0.5 * SL[n] * 2, 0.12, 2.2, music, d);   // kenong
      if (pos === 5 || pos === 9 || pos === 13) metal(BASE * 0.5 * SL[n], 0.1, 2.6, music, d); // kempul
      if (pos === 15) {                                                // gong ageng
        tone(62, 0.45, 6, { bus: music, delay: d, attack: 0.03 });
        tone(63.3, 0.3, 6, { bus: music, delay: d, attack: 0.03 });
        tone(130, 0.08, 3, { bus: music, delay: d, attack: 0.03 });
      }
      if (pos % 2 === 0) tone(110, 0.16, 0.22, { bus: music, delay: d, to: 70, glide: 0.18 });
      if (pos % 4 === 1) burst(2200, 1.5, 0.05, 0.06, 'bandpass', music, d + BEAT * 0.5);
    }

    // ---- satwa & suasana ----
    function bird(vol) {
      const pan = Math.random() * 1.6 - 0.8;
      if (Math.random() < 0.5) {
        const k = 2 + Math.floor(Math.random() * 3), f0 = 2600 + Math.random() * 1400;
        for (let i = 0; i < k; i++) tone(f0, vol, 0.08, { to: f0 * 1.45, glide: 0.06, delay: i * 0.12, bus: amb, pan });
      } else {
        const f0 = 1700 + Math.random() * 500;
        [[1, 0], [1.33, 0.16], [1.18, 0.3]].forEach(([m, dl]) => tone(f0 * m, vol, 0.16, { to: f0 * m * 1.06, delay: dl, bus: amb, pan }));
      }
    }
    // kutilang: kicau bernada naik-turun beberapa not
    function bulbul(vol) {
      const pan = Math.random() * 1.6 - 0.8, base = 1700 + Math.random() * 500;
      const notes = [1, 1.26, 1.12, 1.5, 1.33, 1.19].slice(0, 4 + Math.floor(Math.random() * 3));
      let d = 0;
      notes.forEach((m, i) => {
        const len = 0.09 + Math.random() * 0.07;
        tone(base * m, vol * (0.8 + Math.random() * 0.3), len, { delay: d, to: base * m * (i % 2 ? 0.94 : 1.08), glide: len, bus: amb, pan, attack: 0.012 });
        d += len + 0.03 + Math.random() * 0.04;
      });
    }
    // prenjak: "cwit-cwit" tajam berulang, terdengar dari kejauhan
    function prenjak(vol) {
      const pan = Math.random() * 1.6 - 0.8, f = 3400 + Math.random() * 700, n = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) tone(f, vol * 0.7, 0.06, { delay: i * 0.17, to: f * 1.25, glide: 0.05, bus: amb, pan, attack: 0.005 });
    }
    // perkutut/tekukur: dekur rendah "kuk-kruu-kuk"
    function dove(vol) {
      const pan = Math.random() * 1.2 - 0.6, f = 430 + Math.random() * 60;
      [[1, 0, 0.22], [1.12, 0.3, 0.42], [0.95, 0.85, 0.3], [1.05, 1.25, 0.5]].forEach(([m, d, len]) => {
        tone(f * m, vol, len, { delay: d, to: f * m * 0.9, glide: len, type: 'sine', bus: amb, pan, attack: 0.06 });
        tone(f * m * 2, vol * 0.18, len, { delay: d, to: f * m * 1.8, glide: len, bus: amb, pan, attack: 0.06 });
      });
    }
    // ayam jago di kejauhan saat fajar
    function rooster(vol) {
      const pan = Math.random() < 0.5 ? -0.7 : 0.7;
      [[520, 0, 0.16, 640], [700, 0.2, 0.18, 760], [760, 0.42, 0.55, 520]].forEach(([f, d, len, to]) => {
        tone(f, vol, len, { delay: d, to, glide: len, type: 'sawtooth', bus: amb, pan, attack: 0.03 });
      });
    }
    // tonggeret: dengung serangga siang yang membesar lalu mereda
    function cicada(vol) {
      if (!ac) return;
      const t = ac.currentTime + 0.05, dur = 3 + Math.random() * 2.5;
      const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 4600 + Math.random() * 600;
      const am = ac.createOscillator(); am.frequency.value = 48 + Math.random() * 20;
      const ag = ac.createGain(); ag.gain.value = 0; am.connect(g(0.5)).connect(ag.gain);
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000; bp.Q.value = 2;
      const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const pn = panner(Math.random() * 1.4 - 0.7);
      let out = o.connect(bp).connect(ag).connect(env);
      if (pn) out = out.connect(pn);
      out.connect(amb);
      o.start(t); am.start(t); o.stop(t + dur + 0.1); am.stop(t + dur + 0.1);
    }
    function cricket(vol) {
      const f = 4300 + Math.random() * 500, pan = Math.random() * 1.4 - 0.7;
      for (let i = 0; i < 4; i++) tone(f, vol, 0.03, { type: 'square', delay: i * 0.045, bus: amb, pan });
    }
    function frog(vol) {
      const pan = Math.random() * 1.2 - 0.6, f = 150 + Math.random() * 60;
      for (let i = 0; i < 2; i++) tone(f, vol, 0.09, { type: 'square', to: f * 0.8, delay: i * 0.13, bus: amb, pan });
    }
    function bedug(vol) {
      [0, 0.7, 1.3, 1.8, 2.2, 2.5, 2.75, 2.95].forEach((d, i) => {
        tone(78, vol * (i < 2 ? 1 : 0.8), 0.6, { to: 52, glide: 0.45, delay: d, bus: amb, pan: -0.3 });
        burst(160, 0.8, vol * 0.25, 0.12, 'lowpass', amb, d);
      });
    }
    function crossingBell(vol) {
      tone(1180, vol, 0.45, { bus: amb, pan: 0.35 });
      tone(2830, vol * 0.35, 0.25, { bus: amb, pan: 0.35 });
      burst(5000, 2, vol * 0.25, 0.03, 'highpass', amb);
    }

    // ---- dipanggil tiap frame ----
    function update(info) {
      if (!ac) return;
      const t = ac.currentTime;
      const live = !muted;
      const run = live && info.running;
      const scene = live && info.scene;
      const v = info.v || 0;
      const power = info.power || 0;
      const brakeF = info.brake || 0;

      // mesin diesel: putaran bertingkat sesuai notch, naik perlahan (governor) dan turun lebih cepat
      const dtA = lastUpd ? Math.min(0.1, t - lastUpd) : 0; lastUpd = t;
      const notchRpm = [0.2, 0.4, 0.58, 0.78, 1][Math.round(power * 4)];
      const rpmTarget = info.slip ? 1 : notchRpm;
      rpm += clamp(rpmTarget - rpm, -0.4 * dtA, 0.22 * dtA);
      turboS += (rpm - turboS) * Math.min(1, dtA * 0.5);            // turbo menyusul belakangan
      const load = run && power > 0 ? rpm : 0;
      const fr = 16 + rpm * 34;
      L.diesel.o1.frequency.setTargetAtTime(fr, t, 0.08);
      L.diesel.o2.frequency.setTargetAtTime(fr * 1.006, t, 0.08);
      L.diesel.o3.frequency.setTargetAtTime(fr / 2, t, 0.08);
      L.diesel.puls.frequency.setTargetAtTime(fr / 4, t, 0.08);
      L.diesel.f.frequency.setTargetAtTime(200 + rpm * 800 + load * 300, t, 0.2);
      set(L.diesel.g.gain, scene ? 0.02 + rpm * 0.07 : 0, 0.25);
      L.comb.mod.frequency.setTargetAtTime(6 + rpm * 22, t, 0.1);
      L.comb.bp.frequency.setTargetAtTime(200 + rpm * 160, t, 0.2);
      set(L.comb.g.gain, scene ? 0.05 + rpm * 0.05 + load * 0.04 : 0, 0.25);
      set(L.grit.g.gain, scene ? load * 0.022 : 0, 0.3);
      L.turbo.o.frequency.setTargetAtTime(700 + turboS * 2600, t, 0.2);
      set(L.turbo.g.gain, scene ? turboS * turboS * 0.009 : 0, 0.3);
      L.turboAir.f.frequency.setTargetAtTime(1300 + turboS * 1400, t, 0.4);
      set(L.turboAir.g.gain, scene ? turboS * turboS * 0.012 : 0, 0.6);
      set(L.exhaust.g.gain, scene ? 0.008 + rpm * 0.045 + load * 0.02 : 0, 0.3);
      // desis rel & decit flens di tikungan
      set(L.railHiss.g.gain, run ? Math.pow(Math.min(v, 22) / 22, 2) * 0.008 * (info.tunnel ? 1.4 : 1) : 0, 0.8);
      L.railHiss.f.frequency.setTargetAtTime(1900 + Math.min(v, 22) * 40, t, 0.8);
      set(L.flange.g.gain, run && info.curve && v > 3 ? clamp(0.25 + ((info.lat || 0) - 0.5) * 0.8, 0.2, 1.3) * clamp((v - 3) / 6, 0, 1) * 0.03 : 0, 0.25);
      // wesel & panel perlintasan: bunyi khas tiap gandar yang melintas
      if (run && v > 0.4 && lastFX !== null) {
        const hit = (list, fn) => list.forEach((px) => {
          if (lastFX < px && info.x >= px) AXLES.forEach((off, k) => { const d = off / v; if (d < 3) fn(t + d, clamp(0.02 + v * 0.003, 0.02, 0.075) * (k % 2 ? 0.8 : 1)); });
        });
        hit(track.turnouts, (at, vol) => { clack(at, vol * 1.2); clack(at + 0.035, vol * 0.8); clack(at + 0.075, vol * 0.9); });
        hit(track.decks, (at, vol) => { nz(at, 'lowpass', 260, 0.8, vol * 1.3, 0.12, engine, 0.004); clack(at + 0.02, vol * 0.5); });
        if (track.bridge) hit([track.bridge.from, track.bridge.to], (at, vol) => klang(at, vol));
      }
      lastFX = run ? info.x : null;
      const mv = info.slip ? v + 9 : v;
      L.motor.o.frequency.setTargetAtTime(90 + mv * 34, t, 0.15);
      L.motor.o2.frequency.setTargetAtTime((90 + mv * 34) * 3, t, 0.15);
      set(L.motor.g.gain, run && (power > 0 || brakeF > 0.3) ? clamp(mv / 2, 0, 1) * 0.012 : 0, 0.3);
      set(L.rumble.g.gain, run ? Math.min(0.32, v * 0.018) * (info.onBridge ? 1.6 : 1) * (info.tunnel ? 1.5 : 1) : 0, 0.25);
      L.rumble.f.frequency.setTargetAtTime(100 + v * 9 + (info.onBridge ? 70 : 0) + (info.tunnel ? 90 : 0), t, 0.25);
      set(L.hiss.g.gain, scene ? (v < 0.4 ? 0.0022 : 0.0008) : 0, 0.8);
      // jembatan: lapisan suara mengikuti bagian rangkaian yang berada di atas jembatan
      const bf = run ? info.bridgeFrac || 0 : 0, vk = clamp(v / 10, 0, 1);
      set(L.boom.g.gain, bf * (0.04 + vk * 0.12), 0.3);
      set(L.steel.g.gain, bf * vk * 0.04, 0.4);
      set(L.ring.g.gain, bf * vk * 0.005, 0.5);
      set(L.echoSend.gain, bf * 0.55, 0.3);
      const Bd = track.bridge, onDeck = !!Bd && info.x > Bd.from && info.x < Bd.to;
      if (run && v > 0.5 && onDeck) {
        // di atas jembatan: dentum gelagar tiap 12 m menggantikan sambungan rel biasa
        const j = Math.floor((info.x - Bd.from) / 12);
        if (lastGirder === null) lastGirder = j;
        if (j !== lastGirder) {
          lastGirder = j;
          const vol = clamp(0.018 + v * 0.003, 0.018, 0.075);
          AXLES.forEach((off, i) => { const d = off / v; if (d < 2.6) girder(t + d, vol * (i % 2 ? 0.75 : 1)); });
        }
      } else lastGirder = null;
      // sambungan rel: setiap gandar berbunyi sesuai jaraknya
      if (run && v > 0.5) {
        const j = Math.floor(info.x / 25);
        if (lastJoint === null) lastJoint = j;
        if (j !== lastJoint && onDeck) lastJoint = j;
        if (j !== lastJoint) {
          lastJoint = j;
          const vol = clamp(0.015 + v * 0.0028, 0.015, 0.07);
          AXLES.forEach((off, i) => { const d = off / v; if (d < 2.6) clack(t + d, vol * (i % 2 ? 0.75 : 1)); });
        }
      } else if (!run) lastJoint = null;
      // rem: gesekan saat cepat, decit saat hampir berhenti
      set(L.grind.g.gain, run ? clamp(brakeF, 0, 1.6) * clamp(v / 8, 0, 1) * 0.08 : 0, 0.15);
      L.grind.f.frequency.setTargetAtTime(900 + Math.min(v, 22) * 40, t, 0.3);
      const sq = run && brakeF > 0.18 && v > 0.25 && v < 6.5 ? 0.03 * clamp(brakeF, 0, 1.2) * (1 - v / 6.5) + 0.006 : 0;
      set(L.squeal.g.gain, sq, 0.12);
      // pompa udara terdengar saat lokomotif diam
      if (scene && v < 0.3 && t >= nextPump) { pump(t + 0.02); nextPump = t + 1.8 + Math.random() * 0.5; }
      // gema terowongan
      set(engineSend.gain, info.tunnel ? 0.45 : 0.12, 0.4);
      set(brakeSend.gain, info.tunnel ? 0.5 : 0.15, 0.4);
      set(revOut.gain, info.tunnel ? 0.35 : 0.2, 0.5);

      // suasana
      set(L.rain.g.gain, scene ? (info.rain || 0) * 0.08 : 0, 0.6);
      set(L.rainLow.g.gain, scene ? (info.rain || 0) * 0.1 : 0, 0.6);
      set(L.wind.g.gain, scene && !info.tunnel ? 0.04 + v * 0.0035 + info.fog * 0.03 + (info.rain || 0) * 0.03 : 0, 0.5);
      set(L.river.g.gain, scene ? info.river * 0.11 : 0, 0.4);
      set(L.crowd.g.gain, scene ? info.crowd * 0.07 : 0, 0.5);
      const want = !musicOn || muted ? 0 : info.running ? MIX.musicPlay : MIX.musicIdle;
      if (Math.abs(want - musicLevel) > 0.001) { musicLevel = want; set(music.gain, want, 0.6); }
      if (!scene) return;
      if (info.bell > 0 && t >= nextBell) { crossingBell(0.04 + info.bell * 0.1); nextBell = t + 0.55; }
      const quiet = t < duckEnd.amb; // jangan tambah bunyi satwa saat ada peristiwa penting
      // suasana asri: gemerisik daun dan aneka burung, lebih ramai saat kereta pelan atau berhenti
      const open = !info.tunnel && !info.rain && !info.night, calm = clamp(1 - v / 20, 0.35, 1);
      set(L.leaves.g.gain, scene && !info.tunnel ? (info.rain ? 0.004 : 0.016 * calm) : 0, 0.8);
      if (t >= nextBird) {
        if (!quiet && info.fog < 0.6 && open) (Math.random() < 0.5 ? bird : bulbul)((0.014 + Math.random() * 0.018) * calm);
        nextBird = t + 0.7 + Math.random() * (info.fog > 0.3 ? 5 : 2.2) / calm;
      }
      if (t >= nextBird2) {
        if (!quiet && open && Math.random() < 0.7) prenjak((0.01 + Math.random() * 0.012) * calm);
        nextBird2 = t + 2.5 + Math.random() * 4;
      }
      if (t >= nextDove) {
        if (!quiet && open) dove((0.03 + Math.random() * 0.015) * calm);
        nextDove = t + 9 + Math.random() * 10;
      }
      if (info.dawn && t >= nextRooster) {
        if (!quiet && open) rooster(0.012 + Math.random() * 0.006);
        nextRooster = t + 22 + Math.random() * 20;
      }
      if (!info.dawn && t >= nextCicada) {
        if (!quiet && open) cicada((0.006 + Math.random() * 0.004) * calm);
        nextCicada = t + 10 + Math.random() * 12;
      }
      if (!quiet && (info.dawn || info.night) && !info.tunnel && t >= nextCricket) { cricket(0.01); nextCricket = t + 0.35 + Math.random() * 0.5; }
      if (!quiet && info.night && !info.tunnel && t >= nextFrog) { frog(0.04); nextFrog = t + 0.6 + Math.random() * 1.6; }
      if (!quiet && info.night && info.lebaran && t >= nextBedug) { bedug(0.28); nextBedug = t + 16 + Math.random() * 12; }
    }

    // ---- pengumuman stasiun: menunggu pintu/rem selesai ----
    function chime(at) { [784, 659, 523, 659].forEach((f, i) => metal(f, 0.09, 1.1, sfx, at + i * 0.42)); }
    function announce(text) {
      if (!ac || muted) return;
      const wait = Math.max(0, eventBusyUntil - ac.currentTime);
      const dur = 2 + text.length * 0.07;
      setTimeout(() => {
        if (!ac || muted) return;
        duck({ amb: 0.55, music: 0.75, engine: 0.3 }, dur);
        chime(0);
        busyFor(dur);
        if (!idVoice || !('speechSynthesis' in window)) return;
        setTimeout(() => {
          try {
            const u = new SpeechSynthesisUtterance(text);
            u.voice = idVoice; u.lang = idVoice.lang; u.rate = 0.95; u.pitch = 1.05; u.volume = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
          } catch (e) { /* speech not available */ }
        }, 1700);
      }, wait * 1000);
    }

    return {
      init, update, announce,
      tick() { // detent tuas
        if (!ac || muted) return;
        const t = ac.currentTime;
        nz(t, 'bandpass', 2400, 3, 0.022, 0.03, sfx, 0.003);
        tone(160, 0.035, 0.05, { at: t, bus: sfx, attack: 0.003 });
      },
      brakeApply(step = 1) {
        if (!ac || muted) return;
        hiss(ac.currentTime, 0.32, 0.03 + 0.012 * Math.min(step, 4), 2400, 1700, brake);
      },
      brakeRelease(amount = 0.08) {
        if (!ac || muted) return;
        tails.push(hiss(ac.currentTime, 0.8, amount, 2800, 1300, brake));
      },
      emergency() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        tails.push(hiss(t, 1.4, 0.12, 3200, 900, brake));
        tone(3000, 0.03, 0.9, { at: t + 0.05, to: 2700, bus: brake, attack: 0.05 });
        duck({ amb: 0.4, music: 0.5 }, 1.6);
      },
      // perangkai beradu saat menyambung gerbong
      couple(kmh = 1) {
        if (!ac || muted) return;
        const t = ac.currentTime, v = clamp(0.4 + kmh * 0.25, 0.4, 1.6);
        metal(180, 0.1 * v, 0.6, sfx); metal(260, 0.06 * v, 0.4, sfx, 0.05);
        nz(t, 'lowpass', 320, 0.7, 0.12 * v, 0.25, sfx, 0.004);
        nz(t + 0.12, 'lowpass', 260, 0.7, 0.06 * v, 0.2, sfx, 0.004);
      },
      // KA lain bersilang: klakson dua kali (nada lebih rendah dari Si Gagah) dan gemuruh lewat
      farHorn() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        [0, 1.25].forEach((o) => [277, 349, 415].forEach((f, i) => tone(f, 0.022 - i * 0.004, 0.95, { at: t + o, bus: sfx, attack: 0.07, type: 'sawtooth', pan: 0.3 })));
        nz(t + 0.8, 'lowpass', 240, 0.7, 0.09, 7, sfx, 1.6);
        for (let k = 0; k < 14; k++) clack(t + 2 + k * 0.42 + (k % 2) * 0.09, 0.5);
      },
      // rangkaian saat kereta berhenti: hentakan rem & sambungan, lalu desis pelepasan panjang
      stopSettle(force) {
        if (!ac || muted) return;
        const t = ac.currentTime, s = clamp(force, 0.25, 1.6);
        tone(82, 0.16 * s, 0.26, { at: t, to: 55, bus: brake, attack: 0.006 });
        nz(t, 'lowpass', 380, 0.7, 0.09 * s, 0.2, brake, 0.006);
        nz(t + 0.11, 'lowpass', 320, 0.7, 0.05 * s, 0.17, brake, 0.006);
        nz(t + 0.2, 'lowpass', 300, 0.7, 0.035 * s, 0.15, brake, 0.006);
        tails.push(hiss(t + 0.45, 1.5, 0.1, 3200, 900, brake));
        busyFor(2.1);
        duck({ amb: 0.35, music: 0.4, engine: 0.45 }, 1.9);
      },
      // pintu: buka = katup udara > geser > benturan; tutup = bel peringatan > katup > geser > benturan + kunci
      door(open) {
        if (!ac || muted) return;
        const t = ac.currentTime;
        fadeTails(t);
        const slide = (at, dur, f0, f1, vol) => {
          const src = ac.createBufferSource(); src.buffer = white;
          const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.6;
          f.frequency.setValueAtTime(f0, at); f.frequency.linearRampToValueAtTime(f1, at + dur);
          const gn = g(0);
          gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(vol, at + 0.07);
          gn.gain.setValueAtTime(vol, at + dur - 0.15); gn.gain.exponentialRampToValueAtTime(0.0001, at + dur);
          src.connect(f).connect(gn).connect(door); src.start(at, Math.random()); src.stop(at + dur + 0.05);
          const rb = ac.createBufferSource(); rb.buffer = brown;
          const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 260;
          const rg = g(0);
          rg.gain.setValueAtTime(0.0001, at); rg.gain.exponentialRampToValueAtTime(vol * 0.9, at + 0.07);
          rg.gain.setValueAtTime(vol * 0.9, at + dur - 0.15); rg.gain.exponentialRampToValueAtTime(0.0001, at + dur);
          rb.connect(rf).connect(rg).connect(door); rb.start(at, Math.random()); rb.stop(at + dur + 0.05);
        };
        const thud = (at, s) => {
          tone(96, 0.2 * s, 0.18, { at, to: 70, bus: door, attack: 0.004 });
          nz(at, 'lowpass', 520, 0.8, 0.05 * s, 0.09, door, 0.004);
        };
        if (open) {
          hiss(t, 0.3, 0.05, 2600, 1800, door);
          slide(t + 0.16, 0.62, 420, 950, 0.075);
          thud(t + 0.78, 0.9);
          busyFor(1.2);
          duck({ amb: 0.35, music: 0.4, engine: 0.5 }, 1.2);
        } else {
          [[988, 0], [784, 0.32]].forEach(([fr, d]) => {
            tone(fr, 0.075, 0.75, { at: t + d, bus: door, attack: 0.012 });
            tone(fr * 2, 0.012, 0.3, { at: t + d, bus: door, attack: 0.012 });
          });
          hiss(t + 0.75, 0.28, 0.045, 2600, 1800, door);
          slide(t + 0.88, 0.62, 950, 420, 0.075);
          thud(t + 1.5, 1.1);
          nz(t + 1.58, 'bandpass', 2200, 4, 0.025, 0.04, door, 0.003); // kunci pintu
          busyFor(1.8);
          duck({ amb: 0.35, music: 0.45, engine: 0.5 }, 1.8);
        }
      },
      signalChime() { // "tong" lembut saat sinyal berangkat hijau
        if (!ac || muted) return;
        const t = ac.currentTime;
        tone(660, 0.05, 0.6, { at: t, bus: sfx, attack: 0.01 });
        tone(990, 0.02, 0.4, { at: t, bus: sfx, attack: 0.01 });
      },
      ding() { this.signalChime(); },
      // klakson udara tiga nada: berbunyi selama tombol ditahan
      hornStart() {
        if (!ac || muted || hornNodes) return;
        const t = ac.currentTime;
        const gn = ac.createGain();
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.11, t + 0.07);
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1050; bp.Q.value = 0.55;
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600;
        gn.connect(bp).connect(lp).connect(sfx);
        // gema dari perbukitan
        const dl = ac.createDelay(1); dl.delayTime.value = 0.42;
        const fb = g(0.28), ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 1400;
        const eg = g(0.35);
        lp.connect(dl); dl.connect(ef).connect(fb).connect(dl); ef.connect(eg).connect(amb);
        const vib = ac.createOscillator(); vib.frequency.value = 5.4; const vg = g(1.4); vib.connect(vg); vib.start(t);
        const oscs = [];
        [[311.1, 'sawtooth', 1], [370.0, 'sawtooth', 0.9], [466.2, 'sawtooth', 0.75], [155.6, 'square', 0.22]].forEach(([fq, type, lv]) => {
          const o = ac.createOscillator(); o.type = type;
          o.frequency.setValueAtTime(fq * 0.93, t); o.frequency.exponentialRampToValueAtTime(fq, t + 0.12);
          vg.connect(o.frequency);
          const og = g(lv); o.connect(og).connect(gn); o.start(t);
          oscs.push([o, fq]);
        });
        oscs.push([vib, 0]);
        burst(1800, 0.7, 0.05, 0.25, 'highpass', sfx);    // hembusan udara saat katup terbuka
        duck({ amb: 0.4, music: 0.4 }, 6);
        hornNodes = { gn, oscs, t0: t, fb };
        hornNodes.auto = setTimeout(() => this.hornStop(), 5000);
      },
      hornStop() {
        if (!ac || !hornNodes) return;
        const H = hornNodes; hornNodes = null;
        clearTimeout(H.auto);
        const t = Math.max(ac.currentTime, H.t0 + 0.45);
        H.gn.gain.cancelScheduledValues(t); H.gn.gain.setTargetAtTime(0.0001, t, 0.07);
        H.oscs.forEach(([o, fq]) => { if (fq) o.frequency.setTargetAtTime(fq * 0.96, t, 0.12); o.stop(t + 0.7); });
        H.fb.gain.setTargetAtTime(0, t + 1.2, 0.3);
        duck({ amb: 0.3, music: 0.3 }, Math.max(0.6, t - ac.currentTime + 0.6));
      },
      whistle() { this.hornStart(); setTimeout(() => this.hornStop(), 900); },
      guardWhistle() { // peluit kondektur (semboyan 41): getar khas peluit berbola
        if (!ac || muted) return;
        const t = ac.currentTime + 0.02;
        const o = ac.createOscillator(); o.frequency.value = 2850;
        const tr = ac.createOscillator(); tr.frequency.value = 28; tr.connect(g(160)).connect(o.frequency);
        const gn = ac.createGain(); gn.gain.setValueAtTime(0.0001, t);
        [[0, 0.05], [0.25, 0.05], [0.35, 0.0001], [0.45, 0.06], [1.35, 0.06], [1.5, 0.0001]].forEach(([d, v]) => gn.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + d + 0.03));
        o.connect(gn).connect(sfx); o.start(t); tr.start(t); o.stop(t + 1.6); tr.stop(t + 1.6);
        nz(t, 'highpass', 3000, 0.7, 0.012, 1.4, sfx, 0.04);
      },
      footstep(vol = 0.012) { // langkah kaki penumpang di peron (dibatasi agar tidak ramai)
        if (!ac || muted || ac.currentTime < nextStep) return;
        nextStep = ac.currentTime + 0.07;
        nz(ac.currentTime + Math.random() * 0.02, 'bandpass', 1400 + Math.random() * 600, 1.2, vol, 0.05, amb, 0.002);
      },
      boardThump() { if (!ac || muted) return; const t = ac.currentTime + 0.01; nz(t, 'lowpass', 220, 0.8, 0.05, 0.12, door, 0.003); nz(t + 0.18, 'lowpass', 260, 0.8, 0.035, 0.1, door, 0.003); },
      setTrack(tr) { track = tr; lastFX = null; },
      bleat() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        const o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(360, t + 0.55);
        const vib = ac.createOscillator(); vib.frequency.value = 9;
        const vg = g(28); vib.connect(vg).connect(o.frequency);
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 2.5;
        const gn = g(0);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.1, t + 0.04);
        gn.gain.setValueAtTime(0.085, t + 0.4); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
        const pn = panner(0.4);
        let out = o.connect(f).connect(gn); if (pn) out = out.connect(pn); out.connect(amb);
        o.start(t); vib.start(t); o.stop(t + 0.7); vib.stop(t + 0.7);
      },
      crash() {
        if (!ac || muted) return;
        fadeTails(ac.currentTime);
        burst(180, 0.5, 0.45, 1.4, 'lowpass', brake);
        burst(900, 4, 0.18, 0.9, 'bandpass', brake, 0.05);
        metal(310, 0.18, 1.6, sfx, 0.02);
        duck({ amb: 0.6, music: 0.8, engine: 0.6 }, 2.5);
      },
      stars(n) {
        const notes = [523.25, 659.25, 783.99];
        for (let i = 0; i < n; i++) metal(notes[i] * 2, 0.14, 1.4, sfx, 0.35 + i * 0.3);
        if (n === 3) metal(1046.5 * 2, 0.1, 2, sfx, 1.4);
        duck({ music: 0.6 }, 2.4);
      },
      thunder(delay) {
        if (!ac || muted) return;
        const t = ac.currentTime + delay;
        const src = ac.createBufferSource(); src.buffer = brown;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(120, t + 2.5);
        const gn = g(0);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.55, t + 0.06);
        gn.gain.exponentialRampToValueAtTime(0.2, t + 0.6); gn.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
        src.connect(f).connect(gn).connect(amb); src.start(t); src.stop(t + 3.7);
      },
      firework(delay) {
        if (!ac || muted) return;
        tone(900, 0.016, 0.5, { to: 2600, glide: 0.5, delay, bus: amb, attack: 0.05 });
        burst(300, 0.6, 0.18, 0.5, 'lowpass', amb, delay + 0.5);
        for (let i = 0; i < 6; i++) burst(4500, 1.5, 0.03, 0.05, 'highpass', amb, delay + 0.6 + i * 0.07 + Math.random() * 0.05);
      },
      telolet() {
        [[523, 0], [659, 0.15], [784, 0.3], [659, 0.45], [784, 0.6], [1047, 0.75]].forEach(([f, d]) => {
          tone(f, 0.05, 0.16, { type: 'square', delay: d, bus: amb, pan: 0.2 });
          tone(f * 1.5, 0.016, 0.16, { type: 'square', delay: d, bus: amb, pan: 0.2 });
        });
      },
      radio() {
        burst(1800, 1.2, 0.04, 0.25, 'bandpass');
        tone(1320, 0.04, 0.08, { delay: 0.22 });
        duck({ amb: 0.3, music: 0.4 }, 4);
      },
      sand() { burst(700, 0.8, 0.1, 0.9, 'bandpass', brake); burst(4000, 0.7, 0.03, 0.6, 'highpass', brake); },
      setAxles(a) { AXLES = a; },
      coal(dur = 3) { // gemuruh batu bara jatuh ke gerbong
        if (!ac || muted) return;
        const t = ac.currentTime;
        const src = ac.createBufferSource(); src.buffer = brown; src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.6;
        const gn = g(0);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.32, t + 0.3);
        gn.gain.setValueAtTime(0.32, t + dur - 0.5); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f).connect(gn).connect(sfx); src.start(t); src.stop(t + dur + 0.05);
        for (let i = 0; i < dur * 9; i++) burst(1600 + Math.random() * 1600, 2, 0.025, 0.05, 'bandpass', sfx, 0.2 + Math.random() * (dur - 0.4));
        duck({ amb: 0.3, music: 0.35 }, dur);
      },
      trumpet(vol = 0.5) { // lengkingan gajah di kejauhan
        if (!ac || muted) return;
        const t = ac.currentTime;
        const o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(820, t + 0.35); o.frequency.exponentialRampToValueAtTime(520, t + 1.1);
        const vib = ac.createOscillator(); vib.frequency.value = 11; const vg = g(30); vib.connect(vg).connect(o.frequency);
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.8;
        const gn = g(0);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.1 * vol, t + 0.12);
        gn.gain.setValueAtTime(0.09 * vol, t + 0.9); gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        const pn = panner(0.3);
        let out = o.connect(f).connect(gn); if (pn) out = out.connect(pn); out.connect(amb);
        o.start(t); vib.start(t); o.stop(t + 1.35); vib.stop(t + 1.35);
      },
      failSting() { [392, 311, 233].forEach((f, i) => tone(f, 0.1, 0.7, { type: 'triangle', delay: i * 0.3 })); },
      toggleMute() {
        muted = !muted; store.set('rn.mute', muted ? '1' : '0');
        if (master) set(master.gain, muted ? 0 : MIX.master, 0.05);
        if (muted && 'speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        return muted;
      },
      toggleMusic() { musicOn = !musicOn; store.set('rn.music', musicOn ? '1' : '0'); return musicOn; },
      meter() { // hanya untuk pengujian: tingkat RMS & puncak per jalur
        const r = {};
        for (const [k, an] of Object.entries(meters)) {
          const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d);
          let s = 0, pk = 0; for (const x of d) { s += x * x; pk = Math.max(pk, Math.abs(x)); }
          r[k] = { rms: Math.sqrt(s / d.length), peak: pk };
        }
        return r;
      },
      get muted() { return muted; },
      get musicOn() { return musicOn; },
    };
  })();

  // ---------- state ----------
  let S = null;
  function newState() {
    TRAIN_LEN = baseLen();
    return {
      mode: 'play',
      x: ROUTE.startX || 0, v: 0, aCmd: -0.5, aAct: 0, aPrev: 0, jerkF: 0,
      notch: -2,
      t: 0, clock: 0,
      comfort: 100, coins: 0,
      violations: [], violKeys: {}, stops: [],
      phase: MIS.freight ? 'load' : 'dwell', st: 0, doors: MIS.freight || MIS.startClosed ? 'closed' : 'open',
      load: MIS.freight ? Array(MIS.wagons).fill(0) : [], loadIdx: 0, loadT: 0, loads: [],
      eleph: { phase: 'idle', t: 0, prog: 0, honked: false },
      dwell: { step: MIS.startClosed ? 'signal' : 'close', timer: MIS.startClosed ? -1.5 : 0 },
      tut: { shown: {}, active: null, t: 0 },
      waiting: ROUTE.stations.map((s) => s.waiting),
      aboard: MIS.aboard,
      sig: Object.fromEntries(ROUTE.signals.map((q) => [q.id, q.init])),
      scripts: ROUTE.scripts.map(() => ({ phase: 'idle', t: 0 })),
      yellowLimit: false,
      horned: ROUTE.crossings.map(() => false),
      goats: ROUTE.goats.map(() => ({ state: 'idle', t: 0 })),
      sand: SAND_USES, sandT: 0, slip: false, spin: 0,
      bus: { x: -30, v: 0, t: 0, started: false, dwell: 0, stopIdx: 0, held: false, heldShown: {}, done: false, arrive: null, lead: 0 },
      overT: 0,
      shake: 0,
      smoke: [],
      hints: {},
      stoppedShortShown: false,
      failReason: null,
      tree: ROUTE.tree ? { x: Math.round(ROUTE.tree.from + Math.random() * (ROUTE.tree.to - ROUTE.tree.from)), phase: 'idle', t: 0, gap: null, far: false } : null,
      meet: ROUTE.meet ? { phase: 'idle', x: 0, v: 0, cleared: false, honked: false } : null,
      wetMotor: false, floodStop: 0, splash: [], lmSeen: {},
      rev: false, coupled: false, cw: null, // gerbong kopi: posisi ujung depan, status
    };
  }

  // ---------- DOM ----------
  const cv = $('world'), ctx = cv.getContext('2d');
  const sv = $('strip'), sctx = sv.getContext('2d');
  let W = 0, H = 0, DPR = 1, SW = 0, SH = 0;
  let mode = 'title';
  let radioTimer = 0, camLead = 0, camZoom = 1;
  let viewMode = store.get('rn.view') === 'cab' ? 'cab' : 'side'; // 'side' (2.5D) atau 'cab' (kabin masinis)
  let rotateSkipped = false;

  const ui = {
    hud: $('hud'), toast: $('toast'),
    clock: $('clock'), nextName: $('nextName'), nextSched: $('nextSched'),
    comfortRing: $('comfortRing'), comfortVal: $('comfortVal'), coins: $('coins'), rivalSep: $('rivalSep'),
    gTrack: $('gTrack'), gFill: $('gFill'), gTicks: $('gTicks'), gLimit: $('gLimit'), gNeedle: $('gNeedle'), gLabels: $('gLabels'),
    precise: $('precise'), precTxt: $('precTxt'), precSub: $('precSub'), precPtr: $('precPtr'),
    rivalPanel: $('rivalPanel'), rivalVal: $('rivalVal'),
    speed: $('speed'), speedo: $('speedo'), unit: $('speedUnit'), btnSand: $('btnSand'), sandLbl: $('sandLbl'), limit: $('limit'), nextLimit: $('nextLimit'),
    stopDist: $('stopDist'), stopBox: $('stopBox'), hud: $('hud'), goalChips: $('goalChips'), coach: $('coach'),
    btnHorn: $('btnHorn'), btnDoor: $('btnDoor'), doorLbl: $('doorLbl'),
    lever: $('lever'), leverRows: $('leverRows'), thumb: $('leverThumb'),
    screens: { title: $('screenTitle'), howto: $('screenHowto'), brief: $('screenBrief'), pause: $('screenPause'), result: $('screenResult') },
  };
  const textCache = new Map();
  function setText(el, txt) { if (textCache.get(el) !== txt) { textCache.set(el, txt); el.textContent = txt; } }
  function setClass(el, cls, on) { el.classList.toggle(cls, !!on); }

  // build lever rows
  const rowEls = NOTCHES.map((lab, i) => {
    const s = document.createElement('span');
    s.textContent = lab;
    s.className = i < 4 ? 'p' : i === 4 ? 'n' : i === 9 ? 'eb' : 'b';
    ui.leverRows.appendChild(s);
    return s;
  });

  // ---------- speedometer analog (SVG) ----------
  const gAng = (v) => (135 + clamp(v, 0, 100) * 2.7) * Math.PI / 180;
  const gPt = (r, v) => [98 + r * Math.cos(gAng(v)), 98 + r * Math.sin(gAng(v))];
  function gArc(r, v0, v1) {
    const a = gPt(r, v0), b = gPt(r, v1);
    const large = (v1 - v0) * 2.7 > 180 ? 1 : 0;
    return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}A${r} ${r} 0 ${large} 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  (function initGauge() {
    ui.gTrack.setAttribute('d', gArc(80, 0, 100));
    let d = '';
    for (let v = 0; v <= 100; v += 5) {
      const a = gPt(v % 20 === 0 ? 60 : 64, v), b = gPt(71, v);
      d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
    }
    ui.gTicks.setAttribute('d', d);
    for (let v = 20; v <= 80; v += 20) {
      const p = gPt(48, v);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', p[0].toFixed(1)); t.setAttribute('y', (p[1] + 4).toFixed(1));
      t.textContent = String(v);
      ui.gLabels.appendChild(t);
    }
  })();
  const gaugeCache = { v: -1, lim: -1 };
  function updateGauge(kmh, lim) {
    const v = Math.round(kmh * 2) / 2;
    if (v !== gaugeCache.v) {
      gaugeCache.v = v;
      ui.gFill.setAttribute('d', v > 0.2 ? gArc(80, 0.01, v) : '');
      const n = gPt(66, v);
      ui.gNeedle.setAttribute('x2', n[0].toFixed(1)); ui.gNeedle.setAttribute('y2', n[1].toFixed(1));
    }
    if (lim !== gaugeCache.lim) {
      gaugeCache.lim = lim;
      const a = gPt(72, lim), b = gPt(86, lim);
      ui.gLimit.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
    }
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    checkOrientation();
  }
  function fitStrip() {
    const w = sv.clientWidth, h = sv.clientHeight;
    if (w !== SW || h !== SH) { SW = w; SH = h; sv.width = Math.round(w * DPR); sv.height = Math.round(h * DPR); }
  }
  function checkOrientation() {
    const portrait = window.innerHeight > window.innerWidth;
    $('rotate').hidden = !(portrait && !rotateSkipped);
  }

  // ---------- toast ----------
  let toastTimer = 0, toastPri = 0;
  const toastCool = {};
  function toast(msg, kind = 'info', dur = 2.8, key = null, pri = 1) {
    if (key) {
      const now = performance.now();
      if (toastCool[key] && now - toastCool[key] < 6000) return;
      toastCool[key] = now;
    }
    if (toastTimer > 0 && pri < toastPri) return;
    ui.toast.textContent = msg;
    ui.toast.className = 'show ' + kind;
    toastTimer = dur; toastPri = pri;
  }
  function hintOnce(key, msg, kind = 'info', dur = 3.4) {
    if (S.hints[key]) return;
    S.hints[key] = true;
    toast(msg, kind, dur, null, 2);
  }

  // ---------- route helpers ----------
  function zoneAt(x) {
    let best = null;
    for (const z of ROUTE.zones) {
      if (x >= z.from && x - TRAIN_LEN < z.to) { if (!best || z.limit < best.limit) best = z; }
    }
    return best;
  }
  function currentLimit() {
    const z = zoneAt(S.x);
    let lim = z ? z.limit : ROUTE.lineSpeed, key = z ? z.label : 'jalur bebas';
    if (S.yellowLimit && lim > 40) { lim = 40; key = 'sinyal kuning'; }
    return { lim, key };
  }
  function nextLimitAhead() {
    let best = null;
    for (const z of ROUTE.zones) {
      if (z.from > S.x && z.from - S.x < 600) { if (!best || z.from < best.from) best = z; }
    }
    return best;
  }
  function gradeAt(x) {
    for (const g of ROUTE.grades) if (x >= g.from && x < g.to) return g;
    return null;
  }
  const inTunnel = (x) => !!ROUTE.tunnel && x > ROUTE.tunnel.from && x < ROUTE.tunnel.to;
  function fogAt(x) {
    const f = ROUTE.fog;
    if (!f) return 0;
    return smooth(f.from, f.from + 140, x) * (1 - smooth(f.to - 140, f.to, x));
  }
  const nextStation = () => ROUTE.stations[S.st + 1];
  const fmtClock = (s) => {
    const t = MIS.startClock + Math.floor(s);
    return `${String(Math.floor(t / 3600)).padStart(2, '0')}.${String(Math.floor(t / 60) % 60).padStart(2, '0')}`;
  };
  const fmtDur = (gs) => { const s = Math.round(Math.abs(gs)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const fmtM = (m) => (Math.abs(m) < 10 ? m.toFixed(1) : Math.round(m).toString()).replace('.', ',');

  // ---------- gameplay ----------
  function violation(key, text, comfortHit) {
    if (S.violKeys[key]) return;
    S.violKeys[key] = true;
    S.violations.push(text);
    S.comfort = clamp(S.comfort - comfortHit, 0, 100);
    toast(text, 'bad', 3.2, null, 3);
    const title = key.startsWith('over') ? 'MELEBIHI BATAS KECEPATAN' : key.startsWith('crossing') ? 'LUPA KLAKSON DI PERLINTASAN' : key.startsWith('goat') ? 'HAMPIR MENABRAK KAMBING' : key === 'eleph-horn' ? 'GAJAH PANIK' : key === 'flood' ? 'TERLALU CEPAT DI GENANGAN' : key === 'floodstop' ? 'BERHENTI DI GENANGAN' : 'PELANGGARAN';
    S.alarm = { t: 0, title, sub: `kenyamanan −${comfortHit}` };
    S.shake = Math.max(S.shake, 0.5);
  }
  function fail(reason) {
    if (S) S.alarm = { t: 0, title: 'PELANGGARAN BERAT', sub: 'misi gagal' };
    if (S.mode !== 'play') return;
    S.failReason = reason;
    S.mode = 'fail';
    S.shake = 1.4;
    Sound.crash();
    setTimeout(() => showResult(), 1100);
  }

  function setNotch(n, fromUser = true) {
    n = clamp(Math.round(n), -5, 4);
    if (n === S.notch) return;
    const prev = S.notch;
    S.notch = n;
    if (n > 0 && n > prev && S.doors !== 'open' && S.phase !== 'dwell') S.burst = 0.5 + (n - Math.max(prev, 0)) * 0.2;
    Sound.tick();
    if (prev < 0 && n > prev && n > -5) Sound.brakeRelease(n >= 0 ? 0.075 : 0.035);
    else if (n < 0 && n < prev && n > -5) Sound.brakeApply(prev - n);
    if (n === -5 && prev !== -5 && S.v > 1) {
      S.comfort = clamp(S.comfort - 10, 0, 100);
      S.shake = 0.8;
      Sound.emergency();
      toast('Rem darurat! Penumpang terguncang.', 'bad', 2.6, 'eb', 3);
    }
    if (n > 0 && S.doors === 'open') toast('Tutup pintu dulu sebelum menambah tenaga.', 'warn', 2.4, 'doorpower', 2);
    if (fromUser) { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* no haptics */ } }
    renderLever();
  }

  function horn() {
    if (!S || S.mode !== 'play') return;
    Sound.hornStart();
    S.hornFlash = 1.2;
    if (ROUTE.elephants && (S.eleph.phase === 'block' || S.eleph.phase === 'cross') && !S.eleph.honked) {
      S.eleph.honked = true;
      Sound.trumpet(0.7);
      violation('eleph-horn', 'Membunyikan klakson ke gajah: rombongan panik dan berhenti di rel', 6);
    }
    ROUTE.crossings.forEach((c, i) => {
      if (S.x >= c.hornFrom && S.x < c.x && !S.horned[i]) {
        S.horned[i] = true;
        toast('Klakson dibunyikan. Perlintasan aman.', 'good', 2, null, 2);
      }
    });
    ROUTE.goats.forEach((g, i) => {
      const gs = S.goats[i];
      if (gs.state === 'idle' && S.x >= g.hornFrom && S.x < g.x - 25) {
        gs.state = 'flee'; gs.t = 0;
        setTimeout(() => Sound.bleat(), 350);
        toast('Kambing menyingkir dari rel.', 'good', 2, null, 2);
      }
    });
  }

  function sand() {
    if (!S || S.mode !== 'play' || !MIS.rain) return;
    if (S.sandT > 0) { toast('Pasir masih bekerja.', 'info', 1.6, 'sandon', 1); return; }
    if (S.sand <= 0) { toast('Pasir habis. Atur tenaga dengan hati-hati.', 'warn', 2.2, 'sandout', 2); return; }
    S.sand--; S.sandT = SAND_TIME;
    Sound.sand();
    toast(`Pasir ditabur ke rel. Cengkeraman roda pulih selama ${SAND_TIME} detik.`, 'good', 2.4, null, 2);
  }

  function radio(text, dur = 6.5, who = 'Dimas', initials = 'DM') {
    const el = $('radio');
    $('radioText').textContent = text;
    $('radioWho').textContent = `Radio · ${who}`;
    $('radioAvatar').textContent = initials;
    el.hidden = false;
    radioTimer = dur;
    Sound.radio();
  }

  // bus pesaing di jalan raya sejajar rel
  function stepBus(dt) {
    const R = ROUTE.rival;
    if (!R) return;
    const B = S.bus;
    B.t += dt;
    if (B.done || B.t < R.startDelay) return;
    if (!B.started) {
      B.started = true;
      Sound.telolet();
      toast(`Bus ${R.name} berangkat. Balapan dimulai!`, 'warn', 3, null, 2);
    }
    if (B.dwell > 0) { B.dwell -= dt; if (B.dwell <= 0) B.stopIdx++; return; }
    let vt = R.cruise / 3.6;
    for (const sg of R.segments) if (B.x >= sg.from && B.x < sg.to) vt = Math.min(vt, sg.v / 3.6);
    const stop = R.stops[B.stopIdx];
    let target = stop ? Math.min(stop.x, R.finish) : R.finish;
    B.held = false;
    ROUTE.crossings.forEach((c, i) => {
      const barrier = S.x > c.x - 300 && S.x - TRAIN_LEN < c.x + 5;
      if (barrier && B.x < c.x - 6 && B.x > c.x - 140) {
        target = Math.min(target, c.x - 8);
        B.held = true;
        if (B.v < 0.5 && !B.heldShown[i]) { B.heldShown[i] = true; toast(`Bus ${R.name} tertahan palang perlintasan!`, 'good', 3, null, 2); }
      }
    });
    const dist = target - B.x;
    const want = Math.min(vt, Math.sqrt(2 * 2.0 * Math.max(0, dist - 0.5)));
    B.v = B.v < want ? Math.min(want, B.v + 1.1 * dt) : Math.max(want, B.v - 2.6 * dt);
    B.x += B.v * dt;
    if (dist < 1.5 && B.v < 0.6) {
      B.v = 0;
      if (stop && Math.abs(B.x - stop.x) < 2) B.dwell = stop.dur;
      else if (target === R.finish) {
        B.done = true; B.arrive = S.clock;
        Sound.telolet();
        if (S.st < ROUTE.stations.length - 1) toast(`Bus ${R.name} sudah tiba di ${titleCase(finalStation().name)}.`, 'bad', 3.4, null, 3);
      }
    }
    // saling menyalip
    const lead = S.x - B.x;
    if (B.lead >= 0 && lead < -15) { B.lead = lead; Sound.telolet(); toast(`Bus ${R.name} menyalip!`, 'bad', 2.4, null, 2); }
    else if (B.lead < 0 && lead > 15) { B.lead = lead; toast(`Kamu menyalip bus ${R.name}!`, 'good', 2.4, null, 2); }
    else if (Math.abs(lead) > 15) B.lead = lead;
  }

  function runScript(sc, ss, dt) {
    const sig = ROUTE.signals.find((q) => q.id === sc.sig);
    if (sc.type === 'timed') {
      if (ss.phase === 'idle' && S.x > sc.at) { ss.phase = 'red'; ss.t = 0; S.sig[sc.sig] = 'R'; toast(sc.msg, 'bad', 3.6, null, 3); }
      if (ss.phase === 'red' || ss.phase === 'yellow') {
        ss.t += dt;
        if (ss.phase === 'red' && ss.t > sc.red && S.x < sig.x) { ss.phase = 'yellow'; S.sig[sc.sig] = 'Y'; toast(sc.yellowMsg, 'warn', 2.6, null, 2); }
        if (ss.phase === 'yellow' && ss.t > sc.red + sc.yellow && S.x < sig.x) { ss.phase = 'done'; S.sig[sc.sig] = 'G'; }
      }
    } else if (sc.type === 'hold') {
      const gap = sig.x - S.x;
      if (ss.phase === 'idle' && S.x > sc.at) { ss.phase = 'red'; ss.t = 0; S.sig[sc.sig] = 'R'; }
      else if (ss.phase === 'red' && S.v === 0 && gap > 0) {
        if (gap < sc.near) { ss.t += dt; if (ss.t > sc.wait) { ss.phase = 'done'; S.sig[sc.sig] = 'G'; radio(sc.radio, 5); Sound.signalChime(); } }
        else if (!ss.farShown) { ss.farShown = true; toast(`Terlalu jauh dari sinyal ${sc.sig}. Maju pelan ${Math.round(gap - sc.near + 20)} m lagi.`, 'warn', 2.8, null, 2); }
      }
      if (S.v > 0.3) ss.farShown = false;
    } else if (sc.type === 'inspect') {
      const gap = sig.x - S.x;
      if (ss.phase === 'idle' && S.x > sc.at) {
        ss.phase = 'red'; S.sig[sc.sig] = 'R';
        radio(sc.radioRed, 7);
        toast(`Sinyal ${sc.sig} MERAH. Berhenti sebelum sinyal.`, 'bad', 3.2, null, 3);
      } else if (ss.phase === 'red' && S.v === 0 && gap > 0) {
        if (gap < sc.near) { ss.phase = 'work'; ss.t = 0; radio(sc.radioWork, 5); }
        else if (!ss.farShown) { ss.farShown = true; toast(`Terlalu jauh dari sinyal ${sc.sig}. Maju pelan ${Math.round(gap - sc.near + 20)} m lagi.`, 'warn', 2.8, null, 2); }
      } else if (ss.phase === 'work') {
        ss.t += dt;
        if (ss.t > sc.dur) { ss.phase = 'yellow'; ss.t = 0; S.sig[sc.sig] = 'Y'; radio(sc.radioDone, 7); Sound.signalChime(); }
      } else if (ss.phase === 'yellow') {
        ss.t += dt;
        if (ss.t > 6 && S.x < sig.x) { ss.phase = 'done'; S.sig[sc.sig] = 'G'; }
      }
      if (S.v > 0.3) ss.farShown = false;
    }
  }

  function door() {
    if (!S || S.mode !== 'play' || MIS.freight) return;
    if (S.phase === 'dwell') {
      const step = S.dwell.step;
      if (step === 'open') {
        S.doors = 'open'; Sound.door(true);
        S.dwell.step = ROUTE.stations[S.st].final ? 'alight' : 'board';
        S.dwell.timer = 0;
        return;
      }
      if (step === 'couple') { tryCouple(); return; }
      if (step === 'close') {
        S.doors = 'closed'; Sound.door(false);
        const CP = ROUTE.couple;
        if (CP && S.st === CP.st && !S.coupled) { startCouple(); return; }
        S.dwell.step = 'signal'; S.dwell.timer = 0;
        toast('Pintu tertutup. Tunggu sinyal berangkat hijau.', 'info', 2.4, null, 2);
        return;
      }
      if (step === 'board' || step === 'alight') { toast('Tunggu penumpang selesai.', 'info', 1.8, 'wait', 1); return; }
      toast('Pintu sudah tertutup.', 'info', 1.6, 'closed', 1);
      return;
    }
    const ns = nextStation();
    if (ns && S.v < 0.05) {
      const d = S.x - ns.x;
      if (d < -WINDOW_BEFORE) toast(`Belum sampai peron. Maju ${fmtM(-d)} m lagi.`, 'warn', 2.4, null, 2);
      else toast('Pintu hanya bisa dibuka saat berhenti di peron.', 'warn', 2.2, null, 2);
    } else {
      toast('Pintu hanya bisa dibuka saat kereta berhenti di peron.', 'warn', 2.2, 'doorrun', 2);
    }
  }

  // ---------- kereta hidup: suspensi, sambungan, pintu geser, debu & daun ----------
  function carSpan(idx) { // [jarak moncong ke ujung depan, panjang] kendaraan idx (0 = lokomotif)
    if (idx === 0) return [0, LOCO_LEN];
    return MIS.freight ? [carFront(idx - 1), WAGON_LEN] : [LOCO_LEN + GAP + (idx - 1) * (COACH_LEN + GAP), COACH_LEN];
  }
  function updateCarDyn(dt) {
    const n = N_COACH + 1;
    if (!S.carDyn || S.carDyn.length !== n) S.carDyn = Array.from({ length: n }, () => ({ s: 0, g: 0, yF: 0, yR: 0, vF: 0, vR: 0, dy: 0, pitch: 0, jF: null, jR: null }));
    const a = S.aAct || 0, target = clamp(a * 0.55, -0.32, 0.36);
    S.carDyn.forEach((D, k) => {
      if (k > 0) { const prev = S.carDyn[k - 1]; D.g += ((k === 1 ? target : prev.g) - D.g) * Math.min(1, dt * 4); D.s = prev.s + D.g; }
      const [mF, len] = carSpan(k);
      [['F', mF + 3], ['R', mF + len - 3]].forEach(([b, m]) => {
        const j = Math.floor((S.x - m - D.s) / 25);
        if (D['j' + b] !== null && j !== D['j' + b] && S.v > 1) D['v' + b] -= 0.3 + S.v * 0.045;
        D['j' + b] = j;
        D['v' + b] += (-80 * D['y' + b] - 7 * D['v' + b]) * dt;
        D['y' + b] += D['v' + b] * dt;
      });
      D.dy = (D.yF + D.yR) / 2;
      D.pitch = (D.yR - D.yF) / len - a * 0.004;
    });
    S.doorAnim = clamp((S.doorAnim || 0) + (S.doors === 'open' ? dt : -dt) / 0.9, 0, 1);
    if (S.hornFlash > 0) S.hornFlash = Math.max(0, S.hornFlash - dt);
    // debu dan daun kering terangkat di belakang rangkaian saat melaju
    if (S.v > 6 && !REDUCE_MOTION) {
      const rear = S.x - TRAIN_LEN, rate = (S.v - 6) * 3 * dt;
      if (Math.random() < rate) S.smoke.push({ x: rear - Math.random() * 2, y: 0.3, r: 0.5, grow: 1.6, vx: S.v * (0.2 + Math.random() * 0.25), vy: 0.5 + Math.random() * 0.8, life: 0, max: 1.6 + Math.random(), tan: true, a: 0.3 });
      if (Math.random() < rate * 0.5) (S.leaves || (S.leaves = [])).push({ x: rear - Math.random() * 3, y: 0.2, vx: S.v * (0.3 + Math.random() * 0.4), vy: 1 + Math.random() * 2, rot: Math.random() * 6, life: 0, max: 1.6 + Math.random() * 1.4, col: Math.random() < 0.5 ? '#c9a25a' : '#8a9a3a' });
    }
    if (S.leaves) {
      for (const l of S.leaves) { l.life += dt; l.x += l.vx * dt; l.vx *= 1 - dt * 1.2; l.y = Math.max(0, l.y + l.vy * dt); l.vy -= 1.2 * dt; l.rot += dt * 7; }
      S.leaves = S.leaves.filter((l) => l.life < l.max);
    }
  }

  // muka kereta saat gerbong ke-i tepat di bawah corong silo
  const loadTarget = (i) => ROUTE.loading.silo + carFront(i) + CAR_LEN / 2;
  function rateLoad(d) {
    const a = Math.abs(d);
    if (a <= 0.5) return { r: 'Perfect', c: 'perfect', coins: 40 };
    if (a <= 2) return { r: 'Good', c: 'good', coins: 25 };
    if (a <= 5) return { r: 'OK', c: 'ok', coins: 10 };
    return { r: 'Miss', c: 'miss', coins: 0 };
  }
  // titik henti aktif: corong muat saat memuat, atau stasiun berikutnya
  function stopTarget() {
    if (!S) return null;
    if (S.phase === 'load' && S.loadIdx < N_COACH) return { x: loadTarget(S.loadIdx), load: true };
    if (S.phase === 'run') { const ns = nextStation(); return ns ? { x: ns.x, load: false } : null; }
    return null;
  }

  function rateStop(d) {
    const a = Math.abs(d);
    if (a <= 1) return { r: 'Perfect', c: 'perfect', coins: 50 };
    if (a <= 4) return { r: 'Good', c: 'good', coins: 30 };
    if (a <= 10) return { r: 'OK', c: 'ok', coins: 10 };
    return { r: 'Miss', c: 'miss', coins: 0 };
  }

  function arrive(stIdx) {
    const st = ROUTE.stations[stIdx];
    const d = S.x - st.x;
    const rating = rateStop(d);
    S.stops.push({ name: st.name, offset: d, rating, clock: S.clock, sched: st.sched });
    S.coins += rating.coins;
    S.moment = { kind: rating.c, label: rating.r, t: 0, x: st.x, coins: rating.coins, sub: `${fmtM(Math.abs(d))} m ${d > 0 ? 'lewat' : 'kurang'} dari marka${rating.coins ? ` · +${rating.coins} koin` : ''}` };
    S.st = stIdx;
    S.phase = 'dwell';
    S.dwell = { step: MIS.freight ? 'unload' : MIS.noDoors && st.final ? 'end' : 'open', timer: 0 };
    S.yellowLimit = false;
    if (S.wetMotor) { S.wetMotor = false; toast('Motor traksi sudah kering. Tenaga kembali penuh.', 'good', 2.4, null, 1); }
    const where = d > 0 ? 'lewat' : 'kurang';
    const kind = rating.c === 'miss' ? 'bad' : rating.c === 'ok' ? 'info' : 'good';
    toast(`${rating.r.toUpperCase()}! ${fmtM(Math.abs(d))} m ${where} dari marka. ${MIS.freight ? 'Membongkar muatan...' : MIS.noDoors && st.final ? '' : 'Buka pintu.'}`, kind, 3.2, null, 3);
    if (MIS.freight) { Sound.coal(4.5); return; }
    if (st.final) setTimeout(() => Sound.announce(`Kereta telah tiba di Stasiun ${titleCase(st.name)}, stasiun akhir. Terima kasih telah bepergian bersama Si Gagah.`), 900);
  }

  function updateDwell(dt) {
    const st = ROUTE.stations[S.st];
    const dw = S.dwell;
    dw.timer += dt;
    if (dw.step === 'board') {
      const total = MIS.heavy ? 3 + st.waiting * 0.25 : 4.5;
      const cr = crowds.get(S.st);
      let done;
      if (cr && cr.doors) {
        // penumpang berjalan dan naik sendiri; batas waktu menjaga lama berhenti tetap wajar
        if (dw.timer > total + 6 && cr.left > 0) forceBoard(cr);
        done = cr.left === 0 && cr.doors.every((d) => d.alight === 0 && !d.busy) && dw.timer > 1.2;
        if (done) cr.boardDone = true;
      } else {
        const startWaiting = st.waiting;
        const left = Math.max(0, Math.round(startWaiting * (1 - dw.timer / total)));
        if (left < S.waiting[S.st]) { S.aboard += S.waiting[S.st] - left; S.waiting[S.st] = left; }
        done = dw.timer >= total;
      }
      if (done) {
        dw.step = 'close'; dw.timer = 0;
        toast(st.travelers ? 'Pemudik dan barang bawaannya sudah naik. Tutup pintu.' : st.traders ? 'Para pedagang sudah naik dengan keranjangnya. Tutup pintu.' : st.umbrellas ? 'Penumpang naik sambil melipat payung. Tutup pintu.' : 'Penumpang sudah naik. Tutup pintu.', 'info', 3, null, 2);
      }
    } else if (dw.step === 'unload') {
      // bongkar: muatan tiap gerbong turun bergiliran ke hopper dermaga
      for (let k = 0; k < N_COACH; k++) S.load[k] = Math.max(0, Math.min(S.load[k], 1 - (dw.timer - k * 0.6) / 2.4));
      if (Math.random() < 0.5) S.smoke.push({ x: S.x - carFront(Math.floor(Math.random() * N_COACH)) - CAR_LEN / 2, y: 0.4, r: 0.4, grow: 1.2, vx: (Math.random() - 0.5), vy: 0.6, life: 0, max: 1.4, dust: true, a: 0.45 });
      if (dw.timer >= 5) finish();
    } else if (dw.step === 'end') {
      if (dw.timer >= 2.6) finish();
    } else if (dw.step === 'alight') {
      if (dw.timer > 1) S.aboard = Math.max(0, S.aboard - Math.ceil(dt * 12));
      if (dw.timer >= 3.2) finish();
    } else if (dw.step === 'signal') {
      const MT = ROUTE.meet;
      if (MT && S.st === MT.st && !S.meet.cleared) {
        dw.timer = Math.min(dw.timer, 0.5);
        if (!dw.waitShown) { dw.waitShown = true; toast(`Tunggu ${MT.name} lewat. Sinyal keluar S2 tetap merah sampai ekornya melewati patok bebas.`, 'info', 3.4, null, 2); }
      }
      if (dw.timer >= 2) {
        const sig = ROUTE.signals.find((s) => s.start === S.st);
        if (sig) S.sig[sig.id] = 'G';
        S.phase = 'run';
        S.stoppedShortShown = false;
        Sound.signalChime();
        toast(S.st === 0 ? 'Sinyal hijau! Dorong tuas ke P untuk berangkat.' : 'Sinyal berangkat hijau. Lanjutkan perjalanan.', 'good', 3, null, 3);
        if (MIS.freight && S.st === 0) setTimeout(() => { if (S && S.mode === 'play') radio('Muara Kelam ke Si Gagah: jalur aman sampai Tanjung Api. Hati-hati, rombongan gajah sering melintas pagi begini.', 6.5, 'Sari', 'SR'); }, 1500);
      }
    }
  }

  function step(dt) {
    const prevX = S.x, prevV = S.v;
    S.t += dt; S.clock += dt * TIME_SCALE;

    // --- dinamika kereta ---
    const n = S.notch;
    let target;
    const coupling = S.phase === 'dwell' && S.dwell.step === 'couple';
    const powerLocked = S.doors === 'open' || (S.phase === 'dwell' && !coupling) || S.loadT > 0;
    const wet = MIS.rain && !inTunnel(S.x - LOCO_LEN);
    if (S.sandT > 0) S.sandT = Math.max(0, S.sandT - dt);
    const grip = (wet && S.sandT <= 0 ? 0.78 : 1) * (MIS.grass ? 0.86 : 1); // rel basah / berumput melemahkan rem
    const massF = (MIS.freight ? 1.35 + S.load.reduce((a, b) => a + b, 0) * 0.22 : MIS.heavy ? 1 + S.aboard / 140 : 1) * (S.coupled ? 1.18 : 1); // kereta penuh lebih berat
    const brakeF = 1 + (massF - 1) * 0.6;
    if (n > 0) target = powerLocked ? 0 : (n * 0.26 * Math.max(0, 1 - S.v / 26)) / massF * (S.wetMotor ? 0.6 : 1);
    else if (n === 0) target = 0;
    else if (n === -5) target = (-1.6 * grip) / brakeF;
    else target = (n * 0.25 * grip) / brakeF;
    // roda selip: tenaga besar di kecepatan rendah saat rel basah
    S.slip = wet && S.sandT <= 0 && n > 0 && !powerLocked && S.v < 6 && target > 0.6;
    if (S.slip) {
      target = 0.08;
      S.spin += dt * 14;
      S.comfort -= dt * 1.5;
      toast('Roda selip! Turunkan ke P1–P2 atau tabur pasir.', 'warn', 2.4, 'slip', 3);
    }
    const rate = n === -5 ? 3.2 : 0.9;
    S.aCmd += clamp(target - S.aCmd, -rate * dt, rate * dt);
    const resist = S.v > 0.01 ? 0.012 + 0.00032 * S.v * S.v : 0;
    const gr = gradeAt(S.x - TRAIN_LEN / 2);
    let a = S.aCmd - resist - (gr ? 9.81 * gr.permil / 1000 : 0);
    if (S.v <= 0 && a < 0) a = 0;
    S.v = Math.max(0, S.v + a * dt);
    S.x += S.v * dt * (S.rev ? -1 : 1);
    S.aAct = (S.v - prevV) / dt;

    // --- kenyamanan: sentakan ---
    if (S.v > 0 && prevV > 0) {
      const jerk = Math.abs(S.aAct - S.aPrev) / dt;
      S.jerkF = lerp(S.jerkF, jerk, 0.08);
      if (S.jerkF > 1.05 && !(S.tree && S.tree.phase === 'warn')) S.comfort -= (S.jerkF - 1.05) * dt * 3;
    }
    S.aPrev = S.v > 0 ? S.aAct : 0;
    if (prevV > 0 && S.v === 0) Sound.stopSettle(Math.max(0.25, -S.aCmd));
    if (prevV > 0 && S.v === 0 && S.aCmd < -0.5 && S.notch !== -5) {
      const hit = (-S.aCmd - 0.45) * 9;
      S.comfort -= hit;
      toast('Kereta berhenti menyentak. Kurangi rem ke B1 sesaat sebelum berhenti.', 'warn', 3, 'jerkstop', 2);
    }

    // --- batas kecepatan ---
    const { lim, key } = currentLimit();
    const kmh = S.v * 3.6;
    if (kmh > lim + 2) {
      S.comfort -= (kmh - lim) * dt * 0.08;
      S.overT += dt;
      toast(`Terlalu cepat! Batas ${lim} km/h.`, 'warn', 2, 'over' + key, 2);
      if (S.overT > 1.2 && kmh > lim + 5) violation('over:' + key, `Melebihi batas kecepatan di ${key}`, 6);
      const zc = zoneAt(S.x);
      if (zc && zc.curve && kmh > zc.limit * 2) fail(`Kereta anjlok di ${zc.label} karena melaju ${Math.round(kmh)} km/h di batas ${zc.limit} km/h.`);
      if (zc && zc.wood && kmh > 25) fail(`Jembatan kayu tua tidak kuat: kereta melaju ${Math.round(kmh)} km/h di batas ${zc.limit} km/h.`);
      if (zc && zc.wood) { S.shake = Math.max(S.shake, 0.35); toast('Jembatan berderit! Turunkan kecepatan.', 'bad', 1.8, 'creak', 3); }
      if (zc && zc.turnout && kmh > 45) fail(`Kereta anjlok di ${zc.label}: melaju ${Math.round(kmh)} km/h di wesel berbatas ${zc.limit} km/h.`);
    } else {
      S.overT = Math.max(0, S.overT - dt);
    }

    // --- sinyal ---
    for (const sig of ROUTE.signals) {
      if (prevX < sig.x && S.x >= sig.x) {
        const asp = S.sig[sig.id];
        if (asp === 'R') { fail(`Melanggar sinyal merah ${sig.id}. Dalam dunia nyata ini pelanggaran paling berat bagi masinis.`); return; }
        S.yellowLimit = asp === 'Y';
        if (asp === 'Y') toast(`Sinyal ${sig.id} kuning: maksimal 40 km/h sampai sinyal berikutnya.`, 'warn', 3, null, 2);
        S.sig[sig.id] = 'R'; // petak di belakang kereta tertutup
      }
    }
    ROUTE.scripts.forEach((sc, i) => runScript(sc, S.scripts[i], dt));
    stepBus(dt);
    if (S.mode !== 'play') return;

    // --- perlintasan & kambing ---
    ROUTE.crossings.forEach((c, i) => {
      if (prevX < c.hornFrom && S.x >= c.hornFrom) hintOnce('crossing' + i, 'Perlintasan sebidang 300 m lagi. Bunyikan klakson!', 'warn');
      if (prevX < c.x && S.x >= c.x && !S.horned[i]) violation('crossing' + i, 'Tidak membunyikan klakson sebelum perlintasan', 8);
    });
    ROUTE.goats.forEach((g, i) => {
      const gs = S.goats[i];
      if (prevX < g.hornFrom && S.x >= g.hornFrom && gs.state === 'idle') hintOnce('goat' + i, 'Ada kambing di rel! Bunyikan klakson.', 'warn');
      if (gs.state === 'idle' && S.x >= g.x - 25) { gs.state = 'flee'; gs.t = 0; Sound.bleat(); violation('goat' + i, 'Hampir menabrak kambing. Klakson lebih awal.', 6); }
      if (gs.state === 'flee') { gs.t += dt; if (gs.t > 2.2) gs.state = 'gone'; }
    });

    // --- petunjuk ---
    ROUTE.hints.forEach((h, i) => { if (S.x > h.at) hintOnce('h' + i, h.msg, h.kind || 'info'); });
    const ns = nextStation();
    if (!MIS.freight && ns && S.phase === 'run' && ns.x - S.x < 420 && ns.x - S.x > 0 && !S.hints['ann' + S.st]) {
      S.hints['ann' + S.st] = true;
      Sound.announce(`Sesaat lagi kereta akan tiba di Stasiun ${titleCase(ns.name)}. Periksa kembali barang bawaan Anda.`);
    }
    if (ns && S.phase === 'run' && ns.x - S.x < 260 && ns.x - S.x > 0) hintOnce('stop' + S.st, MIS.freight ? `${ns.name}: berhenti tepat di marka bongkar.` : `Stasiun ${ns.name}: berhenti tepat di marka kuning "${markNum()}".`);

    // --- pemuatan batu bara gerbong demi gerbong ---
    if (S.phase === 'load') {
      const i = S.loadIdx, d = S.x - loadTarget(i);
      if (S.loadT > 0) {
        S.loadT -= dt;
        S.load[i] = Math.min(1, S.load[i] + dt / 2.1);
        if (Math.random() < 0.6) S.smoke.push({ x: ROUTE.loading.silo + (Math.random() - 0.5) * 2, y: trainH(4.4), r: 0.35, grow: 1, vx: (Math.random() - 0.5) * 0.6, vy: 0.5, life: 0, max: 1.2, dust: true, a: 0.35 });
        if (S.loadT <= 0) {
          S.load[i] = 1; S.loadIdx++;
          if (S.loadIdx >= N_COACH) {
            S.phase = 'dwell'; S.dwell = { step: 'signal', timer: 0 };
            toast('Keempat gerbong penuh. Tunggu sinyal berangkat S1.', 'good', 3, null, 3);
          } else toast(`Gerbong ${i + 1} penuh. Maju pelan, hentikan gerbong ${i + 2} di bawah corong.`, 'info', 3, null, 2);
        }
      } else if (S.v === 0 && prevV === 0 && d > -6 && d < 9) {
        const rating = rateLoad(d);
        S.loads.push({ i, offset: d, rating });
        S.coins += rating.coins;
        S.moment = { kind: rating.c, label: rating.r, t: 0, x: ROUTE.loading.silo, coins: rating.coins, sub: `gerbong ${i + 1} · ${fmtM(Math.abs(d))} m dari corong${rating.coins ? ` · +${rating.coins} koin` : ''}` };
        if (rating.c === 'miss') { S.comfort -= 8; toast(`Gerbong ${i + 1} lewat ${fmtM(d)} m. Batu bara tumpah ke rel!`, 'bad', 3, null, 3); }
        else toast(`${rating.r.toUpperCase()}! Gerbong ${i + 1} ${fmtM(Math.abs(d))} m dari corong. Memuat...`, rating.c === 'ok' ? 'info' : 'good', 2.6, null, 3);
        S.loadT = 2.3; Sound.coal(2.3);
      } else if (S.v === 0 && prevV === 0 && d <= -6 && d > -60 && !S.stoppedShortShown) {
        S.stoppedShortShown = true;
        toast(`Belum di bawah corong. Maju ${fmtM(-d)} m lagi.`, 'warn', 2.4, null, 2);
      }
    }

    // --- rombongan gajah Sumatra melintas ---
    const E = ROUTE.elephants;
    if (E) {
      const el = S.eleph;
      if (el.phase === 'idle' && S.x > E.trigger) {
        el.phase = 'block'; el.t = 0;
        radio(`Si Gagah, hati-hati! Rombongan gajah melintas di depan, sekitar ${Math.round(E.x - S.x)} m. Berhenti dan tunggu, jangan dibunyikan klakson.`, 7, 'Sari', 'SR');
        Sound.trumpet(0.4);
      }
      if (el.phase === 'block') {
        el.t += dt;
        if ((S.v === 0 && E.x - S.x < 320) || el.t > 30) { el.phase = 'cross'; el.t = 0; }
      } else if (el.phase === 'cross') {
        el.t += dt;
        el.prog = Math.min(1, el.t / (E.cross + (el.honked ? 5 : 0)));
        if (el.prog >= 1) { el.phase = 'gone'; toast('Rombongan gajah sudah menyeberang. Jalur aman.', 'good', 2.6, null, 2); }
      }
      const onTrack = el.phase === 'block' || (el.phase === 'cross' && el.prog < 0.55);
      if (onTrack && S.x >= E.x - 3) { fail('Kereta menabrak rombongan gajah Sumatra. Berhentilah lebih awal saat ada satwa di jalur.'); return; }
    }
    checkLandmarks();
    stepTree(dt);
    if (S.mode !== 'play') return;
    stepFlood(dt, kmh);
    stepMeet(dt);

    // --- tiba di stasiun ---
    if (S.phase === 'run' && ns && S.v === 0 && prevV === 0) {
      const d = S.x - ns.x;
      if (d >= -WINDOW_BEFORE && d <= WINDOW_AFTER) arrive(S.st + 1);
      else if (d < -WINDOW_BEFORE && d > -250 && !S.stoppedShortShown) {
        S.stoppedShortShown = true;
        toast(`Belum sampai peron. Maju ${fmtM(-d)} m lagi.`, 'warn', 2.6, null, 2);
      }
    }
    if (S.v > 0.3) S.stoppedShortShown = false;
    if (S.phase === 'dwell') { if (S.dwell.step === 'couple') stepCouple(dt); else updateDwell(dt); }
    updateCrowds(dt);
    updateCarDyn(dt);

    if (S.x >= ROUTE.bufferStop - 0.5) fail(`Kereta menabrak penahan di ujung rel ${titleCase(finalStation().name)}.`);

    S.comfort = clamp(S.comfort, 0, 100);

    // --- asap ---
    const power = S.notch > 0 && !powerLocked ? S.notch / 4 : 0;
    S.burst = Math.max(0, (S.burst || 0) - dt);
    const rateSmoke = 4 + power * 12 + S.v * 0.35;
    if (Math.random() < rateSmoke * dt) S.smoke.push(exhaust(S.x - 8.2, trainH(6.8), power, false));
    if ((S.burst > 0 || S.slip) && Math.random() < 28 * dt) S.smoke.push(exhaust(S.x - 8.2, trainH(6.8), 1, true));
    if (S.sandT > 0 && Math.random() < 25 * dt) S.smoke.push(sandPuff(S.x - 7 - Math.random() * 4));
    for (const p of S.smoke) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.993; p.vx *= 0.995; p.r += p.grow * dt * (1 - p.life / (p.max * 1.6));
    }
    S.smoke = S.smoke.filter((p) => p.life < p.max);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 1.6);
  }

  // gas buang diesel: tipis, dengan semburan gelap saat tuas tenaga dinaikkan
  function exhaust(x, y, power, dark) {
    return {
      x: x + (Math.random() - 0.5) * 0.2, y, r: 0.22 + power * 0.1,
      grow: 0.55 + power * 0.5 + Math.random() * 0.3 + (dark ? 0.4 : 0),
      vx: (Math.random() - 0.5) * 0.6 - 1.3, vy: 1.3 + power * 1.6 + Math.random() * 0.6,
      life: 0, max: 1.5 + Math.random() * 0.8 + (dark ? 0.7 : 0), dark, a: dark ? 0.6 : 0.26 + power * 0.22,
    };
  }
  function puff(x, y, white, power = 0) {
    return {
      x: x + (Math.random() - 0.5) * 0.4, y, r: white ? 0.35 : 0.55 + power * 0.25,
      grow: white ? 1.5 : 1.0 + power * 0.9 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 0.8 - 1.5, vy: white ? 1.2 + Math.random() : 2.2 + power * 2.6 + Math.random() * 0.8,
      life: 0, max: white ? 1.3 : 3.4 + Math.random() * 1.2, white, a: white ? 0.75 : 0.55 + power * 0.3,
      spin: Math.random() * 6.28,
    };
  }
  function sandPuff(x) {
    return { x, y: 0.3, r: 0.15, grow: 0.5, vx: (Math.random() - 0.5) * 1.2, vy: 0.2, life: 0, max: 0.8, sand: true, a: 0.6 };
  }

  // ---------- kejadian lintas: pohon tumbang, genangan banjir, persilangan ----------
  function stepTree(dt) {
    const TR = S.tree;
    if (!TR || TR.phase === 'clear') return;
    const gap = TR.x - S.x;
    if (TR.phase === 'idle' && gap < ROUTE.tree.warn) {
      TR.phase = 'warn';
      radio(`Si Gagah, berhenti! Pohon tumbang melintang rel, sekitar ${Math.round(gap / 10) * 10} m di depanmu!`, 7);
      toast('Pohon tumbang di depan! Rem darurat atau B4 sekarang.', 'bad', 3.4, null, 3);
      S.alarm = { t: 0, title: 'POHON TUMBANG', sub: `${Math.round(gap)} m di depan` };
      Sound.signalChime();
    }
    if (TR.phase === 'warn' && S.v === 0) {
      if (gap < 300) {
        TR.phase = 'work'; TR.t = 0; TR.gap = gap;
        toast(`Berhenti ${fmtM(gap)} m sebelum pohon. Aman!`, 'good', 3, null, 3);
        S.moment = { kind: gap < 60 ? 'good' : 'ok', label: 'AMAN', t: 0, x: TR.x, coins: gap < 60 ? 30 : 10, sub: `berhenti ${fmtM(gap)} m sebelum pohon` };
        S.coins += gap < 60 ? 30 : 10;
        setTimeout(() => { if (S && S.mode === 'play') radio('Bagus, Raka. Tim jalan rel sudah di lokasi; beri kami waktu memotong batangnya.', 5); }, 1200);
      } else if (!TR.far) { TR.far = true; toast(`Masih ${Math.round(gap)} m dari pohon. Maju pelan sampai kurang dari 300 m.`, 'warn', 2.8, null, 2); }
    }
    if (S.v > 0.3) TR.far = false;
    if (TR.phase === 'work') {
      TR.t += dt;
      if (TR.t > 18) { TR.phase = 'clear'; radio('Jalur sudah bersih. Lanjut, Raka, tetap waspada.', 5); Sound.signalChime(); }
    }
    if (TR.phase !== 'clear' && gap <= 1.5) fail('Kereta menabrak pohon tumbang. Begitu ada peringatan radio, langsung rem darurat.');
  }
  const inFlood = (x) => { const F = ROUTE.flood; return !!F && x > F.from && x - TRAIN_LEN < F.to; };
  function stepFlood(dt, kmh) {
    const F = ROUTE.flood;
    if (!F) return;
    const inW = inFlood(S.x);
    if (inW && kmh > 15 && !S.wetMotor) {
      S.wetMotor = true;
      violation('flood', 'Terlalu cepat di genangan: motor traksi kemasukan air, tenaga berkurang sampai stasiun berikutnya.', 8);
    }
    if (inW && S.v === 0 && S.phase === 'run') {
      S.floodStop += dt;
      if (S.floodStop > 1) toast('Jangan berhenti di genangan! Jalan pelan terus.', 'warn', 2, 'floodstop', 2);
      if (S.floodStop > 4) violation('floodstop', 'Berhenti di genangan. Kereta harus terus berjalan pelan.', 5);
    } else S.floodStop = 0;
    // cipratan dari roda yang menerjang air
    if (inW && S.v > 0.5 && S.splash.length < 120) {
      const n = Math.random() < S.v * dt * 6 ? 2 : 0;
      for (let i = 0; i < n; i++) {
        const wx = S.x - Math.random() * TRAIN_LEN;
        if (wx < F.from || wx > F.to) continue;
        S.splash.push({ x: wx, y: 0.3, vx: (Math.random() - 0.3) * 1.2, vy: 1 + Math.random() * S.v * 0.6, life: 0, max: 0.6 + Math.random() * 0.4 });
      }
    }
    for (const q of S.splash) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 9 * dt; }
    S.splash = S.splash.filter((q) => q.life < q.max && q.y > -0.2);
  }
  const OPP_LOCO = 17, OPP_CAR = 20.5;
  const oppLen = () => OPP_LOCO + ROUTE.meet.cars * OPP_CAR;
  function stepMeet(dt) {
    const MT = ROUTE.meet;
    if (!MT) return;
    const m = S.meet;
    // KA 112 baru masuk setelah Si Gagah berhenti di sepur belok
    if (m.phase === 'idle' && S.st >= MT.st) {
      m.phase = 'run'; m.x = S.x + 230; m.v = 15;
      radio(`${MT.name} masuk Krajan dari arah berlawanan. Tetap di sepur belok sampai sinyal S2 hijau.`, 5.5);
    }
    if (m.phase !== 'run') return;
    m.v += clamp(13 - m.v, -0.6 * dt, 0.6 * dt);
    m.x -= m.v * dt;
    if (!m.honked && m.x < S.x + 70) { m.honked = true; Sound.farHorn(); }
    if (!m.cleared && m.x + oppLen() < MT.foul - 4) {
      m.cleared = true;
      if (S.phase === 'dwell') setTimeout(() => { if (S && S.mode === 'play') radio(`${MT.name} sudah lewat. S2 hijau sebentar lagi, silakan berangkat.`, 4.5); }, 600);
    }
    if (m.x + oppLen() < S.x - 400) m.phase = 'gone';
  }

  // ---------- menyambung gerbong kopi: mundur pelan, sentuh ≤ 3 km/h, tekan Sambung ----------
  function startCouple() {
    const CP = ROUTE.couple;
    S.cw = { front: S.x - TRAIN_LEN - CP.gap, slide: 0, contact: false, ready: false };
    S.dwell.step = 'couple'; S.dwell.timer = 0;
    radio('Warga sudah mendorong gerbong kopi ke belakang rangkaian. Mundur pelan, sentuh paling cepat 3 km/h, lalu tekan Sambung.', 7, 'Sari', 'SR');
  }
  const coupleGap = () => (S.cw ? S.x - TRAIN_LEN - S.cw.front : Infinity);
  function stepCouple(dt) {
    const cw = S.cw; if (!cw) return;
    cw.slide = Math.min(1, cw.slide + dt / 3);
    S.rev = cw.slide >= 1 && !S.coupled;
    if (!S.rev) { if (S.notch > 0) toast('Tunggu gerbong kopi selesai didorong ke rel.', 'info', 1.6, 'cwait', 1); S.v = 0; return; }
    const gap = coupleGap();
    if (gap <= 0 && !cw.contact) {
      cw.contact = true;
      const kmh = S.v * 3.6;
      S.x = cw.front + TRAIN_LEN; S.v = 0; S.aCmd = Math.min(S.aCmd, 0);
      Sound.couple(kmh);
      S.shake = Math.max(S.shake, Math.min(1.2, 0.2 + kmh * 0.15));
      cw.speed = kmh;
      if (kmh > 5) violation('couplehard', `Menabrak gerbong kopi ${fmtM(kmh)} km/h: karung kopi berjatuhan.`, 12);
      else if (kmh > 3) { S.comfort -= 6; toast(`Sentakan keras (${fmtM(kmh)} km/h). Lain kali lebih pelan.`, 'warn', 2.6, null, 2); }
      else toast('Gerbong tersentuh dengan lembut. Tekan Sambung.', 'good', 2.4, null, 2);
    }
    if (cw.contact) { S.v = 0; S.x = cw.front + TRAIN_LEN; }
    cw.ready = S.v === 0 && gap < 1.0;
    if (S.v === 0 && gap >= 1.0 && gap < 60 && S.notch <= 0 && !cw.farShown) { cw.farShown = true; toast(`Masih ${fmtM(gap)} m ke gerbong kopi. Mundur pelan lagi.`, 'warn', 2.4, null, 2); }
    if (S.v > 0.2) cw.farShown = false;
  }
  function tryCouple() {
    const cw = S.cw;
    if (!cw || !cw.ready) { toast(cw && cw.slide >= 1 ? `Belum menempel: ${fmtM(Math.max(0, coupleGap()))} m lagi.` : 'Gerbong kopi belum siap.', 'warn', 2, 'cnot', 2); return; }
    S.coupled = true; S.rev = false; S.notch = Math.min(S.notch, -1);
    TRAIN_LEN = baseLen() + WAGON_LEN + GAP;
    S.x = cw.front + TRAIN_LEN;
    S.couple = { speed: cw.speed || 0, gap: Math.max(0, coupleGap()) };
    Sound.couple(0.5);
    S.moment = { kind: (cw.speed || 0) <= 3 ? 'good' : 'ok', label: 'TERSAMBUNG', t: 0, x: cw.front, coins: (cw.speed || 0) <= 3 ? 30 : 10, sub: `kontak ${fmtM(cw.speed || 0)} km/h` };
    S.coins += (cw.speed || 0) <= 3 ? 30 : 10;
    S.dwell.step = 'signal'; S.dwell.timer = 0;
    radio(`Tersambung! Rangkaian sekarang ${markNum()} kendaraan: berhenti di marka "${markNum()}".`, 5, 'Sari', 'SR');
    renderLever();
  }

  // ---------- akhir misi ----------
  function finish() {
    S.mode = 'done';
    showResult();
  }

  // ---------- target bintang: tiga sasaran per misi, dinilai langsung saat bermain ----------
  const okRating = (x) => x.rating.c === 'perfect' || x.rating.c === 'good';
  const finalStop = () => S.stops.find((s) => s.name === finalStation().name);
  // tiap sasaran: label (dipakai di briefing), lalu eval() → { state: pending | ok | lost, value }
  function goalDefs() {
    const f = finalStation(), fname = titleCase(f.name);
    const fin = () => (S ? finalStop() : null), failed = () => !!(S && S.failReason);
    const arrive = (label) => ({ label, tip: '', eval: () => ({ state: failed() ? 'lost' : fin() ? 'ok' : 'pending', value: fin() ? 'selesai' : '' }) });
    const onTime = (label, needGood) => ({
      label, tip: needGood ? 'Kejar waktu di lintas lurus, lalu mulai rem B1 sekitar 250 m sebelum marka.' : 'Di lintas lurus pakai P3–P4 sampai batas kecepatan, lalu meluncur di N.',
      eval: () => {
        const fs = fin(), late = fs ? fs.clock - f.sched : S.clock - f.sched;
        if (fs) return { state: late <= 30 && (!needGood || okRating(fs)) ? 'ok' : 'lost', value: `${fmtClock(fs.clock)} / ${fmtClock(f.sched)}${needGood ? ` · ${fs.rating.r}` : ''}` };
        return { state: late > 30 ? 'lost' : 'pending', value: late > 30 ? `terlambat ${fmtDur(late)}` : `sisa ${fmtDur(-late)}` };
      },
    });
    const worstStop = () => S.stops.concat(S.loads.map((l) => ({ name: `Muat gerbong ${l.i + 1}`, offset: l.offset, rating: l.rating }))).find((s) => !okRating(s));
    const smoothStops = (label, minComfort) => ({
      label, tip: 'Mulai rem B1 lebih awal dan naikkan rem satu tingkat demi satu tingkat; hentakan menurunkan kenyamanan.',
      eval: () => {
        const bad = worstStop(), cf = Math.round(S.comfort);
        const all = !!fin() && S.stops.length === ROUTE.stations.length - 1 && (!MIS.freight || S.loads.length === N_COACH);
        const value = bad ? `${titleCase(bad.name)}: ${bad.rating.r}, ${fmtM(Math.abs(bad.offset))} m` : `${cf}%`;
        return { state: S.comfort < minComfort || bad ? 'lost' : all ? 'ok' : 'pending', value };
      },
    });
    const id = MIS.id;
    if (id === '1-1') {
      const off = () => { const fs = fin(); return fs ? Math.abs(fs.offset) : null; };
      return [
        arrive('Berhenti di Peron 1'),
        { label: 'Paling jauh 4 m dari marka', tip: 'Kembalikan tuas ke N lebih awal, lalu rem B1–B2 mengikuti panduan titik henti.', eval: () => (off() === null ? { state: 'pending', value: '' } : { state: off() <= 4 ? 'ok' : 'lost', value: `${fmtM(off())} m` }) },
        { label: 'Paling jauh 1 m · nyaman ≥ 90%', tip: 'Rem bertahap: B1 dulu, B2 hanya bila perlu, lalu lepas sedikit sebelum berhenti.', eval: () => { const o = off(); if (S.comfort < 90) return { state: 'lost', value: `nyaman ${Math.round(S.comfort)}%` }; return o === null ? { state: 'pending', value: '' } : { state: o <= 1 ? 'ok' : 'lost', value: `${fmtM(o)} m` }; } },
      ];
    }
    if (id === '1-2') {
      const over = () => Object.keys(S.violKeys).some((k) => k.startsWith('over:'));
      return [
        arrive('Tidak melewati sinyal merah'),
        { label: 'Tidak melebihi batas lebih dari 5 km/h', tip: 'Turunkan kecepatan sebelum papan batas, bukan sesudahnya.', eval: () => ({ state: over() ? 'lost' : fin() ? 'ok' : 'pending', value: over() ? 'melebihi batas' : '' }) },
        onTime('Tepat waktu · berhenti Good', true),
      ];
    }
    if (id === '1-3') {
      const noHorn = () => Object.keys(S.violKeys).some((k) => k.startsWith('crossing'));
      return [
        arrive('Semua penumpang diantar'),
        { label: 'Nyaman ≥ 85% · klakson di perlintasan', tip: 'Bunyikan klakson sejak papan 35 sampai perlintasan, dan tarik serta rem perlahan.', eval: () => {
          const cf = Math.round(S.comfort);
          if (noHorn()) return { state: 'lost', value: 'lupa klakson' };
          return { state: S.comfort < 85 ? 'lost' : fin() ? 'ok' : 'pending', value: `${cf}%` };
        } },
        smoothStops('Semua berhenti Good · nyaman ≥ 95%', 95),
      ];
    }
    if (id === '2-2') {
      const fast = () => Object.keys(S.violKeys).some((k) => k === 'over:Jembatan Kayu Lubuk Tua');
      return [
        arrive(`Tiba di ${fname} · patuhi semafor`),
        { label: 'Jembatan kayu ≤ 15 km/h', tip: 'Turunkan kecepatan sebelum papan 1,5; rangkaian berat butuh jarak, dan rumput melemahkan rem.', eval: () => ({ state: fast() ? 'lost' : fin() ? 'ok' : 'pending', value: fast() ? 'terlalu cepat' : '' }) },
        smoothStops('Nyaman ≥ 80% · semua berhenti Good', 80),
      ];
    }
    if (id === '2-3') {
      return [
        arrive(`Kopi tiba di ${fname}`),
        { label: 'Sambung gerbong ≤ 3 km/h', tip: 'Saat mundur, pakai P1 sebentar lalu N; sentuh gerbong dengan sangat pelan.', eval: () => {
          const cp = S.couple; if (!cp) return { state: failed() ? 'lost' : 'pending', value: '' };
          return { state: cp.speed <= 3 ? 'ok' : 'lost', value: `${fmtM(cp.speed)} km/h` };
        } },
        onTime('Tepat waktu · berhenti Good', true),
      ];
    }
    if (id === '1-7') {
      const ot = onTime('', false), sm = smoothStops('', 80);
      const slow = () => Object.keys(S.violKeys).find((k) => k === 'flood' || k === 'over:wesel masuk Krajan' || k === 'over:wesel keluar Krajan' || k === 'over:rel tergenang');
      return [
        arrive(`Tiba di ${fname} dengan selamat`),
        { label: 'Wesel ≤ 30 km/h · genangan ≤ 10 km/h', tip: 'Mulai rem sebelum sinyal J1 kuning, dan turunkan kecepatan jauh sebelum papan genangan.', eval: () => {
          const v = slow(); if (v) return { state: 'lost', value: v === 'flood' ? 'genangan terlalu cepat' : 'wesel terlalu cepat' };
          return { state: fin() ? 'ok' : 'pending', value: '' };
        } },
        { label: 'Tepat waktu · nyaman ≥ 80% · berhenti Good', tip: 'Di lintas lurus pakai P3–P4; setelah pohon disingkirkan dan KA 112 lewat, kejar waktu yang hilang.', eval: () => {
          const a = ot.eval(), b = sm.eval();
          if (a.state === 'lost') return a;
          if (b.state === 'lost') return b;
          return { state: a.state === 'ok' && b.state === 'ok' ? 'ok' : 'pending', value: a.value };
        } },
      ];
    }
    const g2 = MIS.goal2 === 'rival'
      ? { label: `Tiba sebelum bus ${ROUTE.rival.name}`, tip: 'Jangan berhenti terlalu lama dan manfaatkan saat bus tertahan palang perlintasan.', eval: () => {
        const fs = fin(), B = S.bus;
        if (fs) return { state: !B.done || fs.clock < B.arrive ? 'ok' : 'lost', value: B.done ? `bus tiba ${fmtClock(B.arrive)}` : 'bus belum tiba' };
        return { state: B.done ? 'lost' : 'pending', value: B.done ? 'bus menang' : `${Math.round(Math.abs(B.x - S.x))} m` };
      } }
      : onTime(`Tiba di ${fname} tepat waktu`, false);
    return [
      arrive(`Tiba di ${fname}`),
      g2,
      smoothStops(MIS.freight ? 'Muatan ≥ 80% · muat & bongkar Good' : 'Nyaman ≥ 80% · semua berhenti Good', 80),
    ];
  }
  // sorotan kecil di HUD: tiga chip sasaran yang diperbarui langsung
  let goalSig = '';
  function updateGoalChips() {
    const el = ui.goalChips; if (!el || !S) return;
    const gs = goalDefs().map((g) => ({ ...g, ...g.eval() }));
    const sig = gs.map((g) => g.state).join('|');
    if (sig !== goalSig) {
      const changed = goalSig ? goalSig.split('|') : [];
      el.innerHTML = gs.map((g, i) => `<li class="gchip ${g.state}${changed.length && changed[i] !== g.state ? ' flash' : ''}"><span class="s">★</span><span class="t">${g.label}</span><span class="m">${g.state === 'ok' ? '✓' : g.state === 'lost' ? '✕' : ''}</span></li>`).join('');
      goalSig = sig;
    }
  }

  // ---------- petunjuk misi pembuka: layar meredup, kontrol disorot, satu kalimat dari Kakek/Dimas ----------
  const stopAhead = () => { const ns = S.phase === 'run' ? nextStation() : null; return ns ? ns.x - S.x : Infinity; };
  const sigAhead = (id) => { const q = ROUTE.signals.find((g) => g.id === id); return q ? q.x - S.x : Infinity; };
  const TUTORIAL = {
    '1-1': [
      { target: '#lever', who: 'KK', text: 'Geser tuas ke P1. Si Gagah mulai bergerak pelan.', when: () => S.phase === 'run' && S.v < 0.2 && S.notch <= 0, done: () => S.notch > 0 },
      { target: '#speedo', who: 'KK', text: 'Lihat jarum. Batas di depo 25 km/h; tahan di bawahnya.', when: () => S.v * 3.6 > 15, done: (t) => t > 4.5 },
      { target: '#lever', who: 'KK', text: 'Kembalikan tuas ke N. Kereta meluncur sendiri.', when: () => stopAhead() < 170, done: () => S.notch <= 0 },
      { target: '#stopBox', who: 'KK', text: 'Rem B1, lalu B2 bila perlu. Jarak ke marka ada di sini.', when: () => stopAhead() < 95, done: (t) => S.notch < 0 && t > 2.5 },
      { target: '#precise', who: 'KK', text: 'Panduan titik henti: hentikan saat penunjuk di garis hijau.', when: () => stopAhead() < 30, done: () => S.v < 0.05 },
    ],
    '1-2': [
      { target: '.strip-wrap', who: 'DM', text: 'Papan 40 di depan: batas kecepatan berlaku mulai papan itu.', when: () => S.phase === 'run' && S.x > 230, done: (t) => t > 5 },
      { target: '.strip-wrap', who: 'DM', text: 'Sinyal J1 kuning. Siap berhenti di sinyal berikutnya; maksimum 40 km/h.', when: () => sigAhead('J1') < 300, done: () => sigAhead('J1') < 0 },
      { target: '.strip-wrap', who: 'DM', text: 'Sinyal S2 merah. Berhenti sebelum tiangnya; aku hijaukan setelah jalur aman.', when: () => sigAhead('S2') < 220 && S.sig.S2 === 'R', done: () => S.v === 0 || S.sig.S2 === 'G' },
      { target: '#lever', who: 'DM', text: 'S2 hijau. Silakan jalan lagi ke Cibening.', when: () => S.sig.S2 === 'G' && sigAhead('S2') > 0, done: () => S.notch > 0 },
    ],
    '1-3': [
      { target: '#btnDoor', who: 'BW', text: 'Tutup pintu dulu sebelum berangkat.', when: () => S.phase === 'dwell' && S.st === 0 && S.dwell.step === 'close', done: () => S.dwell.step !== 'close' },
      { target: '.cluster .ring', who: 'BW', text: 'Tarik dan rem perlahan. Hentakan menurunkan kenyamanan penumpang.', when: () => S.comfort < 99.6, done: (t) => t > 5 },
      { target: '#btnDoor', who: 'BW', text: 'Sudah berhenti di halte. Buka pintu, penumpang naik.', when: () => S.phase === 'dwell' && S.st === 1 && S.dwell.step === 'open', done: () => S.dwell.step !== 'open' },
      { target: '#btnDoor', who: 'BW', text: 'Semua sudah naik. Tutup pintu sebelum berangkat.', when: () => S.phase === 'dwell' && S.st === 1 && S.dwell.step === 'close', done: () => S.dwell.step !== 'close' },
      { target: '#btnHorn', who: 'KK', text: 'Papan 35: bunyikan klakson sampai perlintasan.', when: () => ROUTE.crossings[0] && S.x > ROUTE.crossings[0].hornFrom + 10 && !S.horned[0], done: () => S.horned[0] || S.x > ROUTE.crossings[0].x },
    ],
  };
  TUTORIAL['1-7'] = [
    { target: '#lever', who: 'DM', text: 'Pohon tumbang di depan! Tarik tuas ke EB, rem darurat tidak mengurangi kenyamanan sekarang.', when: () => S.tree && S.tree.phase === 'warn' && S.v > 3, done: () => S.notch <= -4 || S.v === 0 },
    { target: '.strip-wrap', who: 'DM', text: 'J1 kuning: kita masuk sepur belok Krajan. Paling cepat 30 km/h di wesel, lalu berhenti sebelum patok bebas merah-putih.', when: () => sigAhead('J1') < 260 && sigAhead('J1') > 0, done: (t) => t > 7 },
    { target: '.strip-wrap', who: 'DM', text: 'KA 112 lewat di jalur utama. S2 baru hijau setelah ekornya melewati patok bebas.', when: () => S.phase === 'dwell' && S.st === 1 && S.dwell.step === 'signal' && !S.meet.cleared, done: () => S.meet.cleared },
    { target: '.strip-wrap', who: 'DM', text: 'Genangan di depan: maksimal 10 km/h dan jangan berhenti di air.', when: () => ROUTE.flood.from - S.x < 320 && ROUTE.flood.from > S.x, done: () => S.x > ROUTE.flood.to },
  ];
  TUTORIAL['2-2'] = [
    { target: '.strip-wrap', who: 'SR', text: 'Semafor M1: lengan mendatar dan lampu merah berarti berhenti. Tunggu sampai lengannya terangkat.', when: () => sigAhead('M1') < 300 && sigAhead('M1') > 0 && S.sig.M1 === 'R', done: () => S.sig.M1 === 'G' },
    { target: '.strip-wrap', who: 'SR', text: 'Jembatan kayu tua di depan: maksimal 15 km/h. Di atas 25 km/h jembatannya tidak kuat.', when: () => ROUTE.bridge.from - S.x < 260 && ROUTE.bridge.from > S.x, done: () => S.x > ROUTE.bridge.to },
  ];
  TUTORIAL['2-3'] = [
    { target: '#lever', who: 'SR', text: 'Gerbong kopi di belakang. Dorong tuas ke P1 sebentar untuk mundur, lalu N dan meluncur pelan.', when: () => S.phase === 'dwell' && S.dwell.step === 'couple' && S.cw && S.cw.slide >= 1 && S.v < 0.1 && coupleGap() > 3, done: () => S.v > 0.3 },
    { target: '#btnDoor', who: 'SR', text: 'Sudah menempel. Tekan Sambung.', when: () => S.phase === 'dwell' && S.dwell.step === 'couple' && S.cw && S.cw.ready, done: () => S.coupled },
  ];
  const TUT_WHO = { KK: 'Kakek', DM: 'Radio · Dimas', BW: 'Bu Wulan', SR: 'Radio · Sari' };
  function updateTutorial(dt) {
    const coach = ui.coach; if (!coach) return;
    const beats = TUTORIAL[MIS.id];
    if (!beats || !S || S.mode !== 'play' || S.expert || store.get('rn.tutSkip') === '1') { coach.hidden = true; return; }
    const T = S.tut;
    if (T.active !== null) {
      T.t += dt;
      const b = beats[T.active];
      if (b.done(T.t) || T.t > 14) { T.active = null; coach.hidden = true; }
    }
    if (T.active === null) {
      // ambil petunjuk terakhir yang sudah waktunya; petunjuk lebih awal yang terlewat tidak ditampilkan lagi
      let i = -1;
      beats.forEach((b, k) => { if (!T.shown[k] && b.when()) i = k; });
      if (i < 0) return;
      for (let k = 0; k <= i; k++) T.shown[k] = true;
      T.active = i; T.t = 0;
      const b = beats[i];
      $('coachWho').textContent = TUT_WHO[b.who]; $('coachAv').textContent = b.who; $('coachText').textContent = b.text;
      coach.hidden = false;
    }
    // ikuti posisi kontrol yang disorot (layout bisa berubah)
    const b = beats[T.active], tg = document.querySelector(b.target);
    if (!tg || !tg.getBoundingClientRect().width) { $('coachSpot').hidden = true; return; }
    const r = tg.getBoundingClientRect(), pad = 6, sp = $('coachSpot');
    sp.hidden = false;
    Object.assign(sp.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const bub = $('coachBubble'), bw = bub.offsetWidth, bh = bub.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let x = r.left + r.width / 2 - bw / 2, y = r.top - bh - 16;
    if (y < 8) y = r.bottom + 16;
    if (r.left > vw * 0.7) { x = r.left - bw - 18; y = Math.min(Math.max(8, r.top + r.height / 2 - bh / 2), vh - bh - 8); }
    bub.style.left = `${clamp(x, 8, vw - bw - 8)}px`; bub.style.top = `${clamp(y, 8, vh - bh - 8)}px`;
  }

  function computeResult() {
    const failed = !!S.failReason;
    const final = S.stops.find((s) => s.name === finalStation().name);
    const onTime = final ? final.clock - final.sched <= 30 : false;
    const B = S.bus;
    const beatBus = !!final && (!B.done || final.clock < B.arrive);
    const okR = (x) => x.rating.c === 'perfect' || x.rating.c === 'good';
    const goodStops = S.stops.length === ROUTE.stations.length - 1 && S.stops.every(okR) && (!MIS.freight || (S.loads.length === N_COACH && S.loads.every(okR)));
    void goodStops;
    const goals = goalDefs().map((g) => ({ ...g, ...g.eval() }));
    const stars = failed || !final ? 0 : goals.filter((g) => g.state === 'ok').length;
    const base = failed ? 0 : 100;
    const comfortBonus = failed ? 0 : Math.round(S.comfort * 0.5);
    const penalty = S.violations.length * 20;
    const raw = Math.max(0, base + S.coins + comfortBonus - penalty), total = S.expert ? Math.round(raw * 1.5) : raw;
    const daily = MIS.daily ? total + stars * 150 + (failed ? 0 : Math.round(Math.max(0, finalStation().sched - S.clock) * 0.5)) : null;
    return { failed, stars, onTime, beatBus, total, base, comfortBonus, penalty, goals, daily };
  }

  const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

  function showResult() {
    const r = computeResult();
    const best = MIS.daily ? 3 : bestOf(MIS.id);
    if (r.stars > best) store.set('relnusantara.best.' + MIS.id, String(r.stars));
    let extra = '';
    if (MIS.daily && !r.failed) {
      const sc = dailyScores(), prev = sc[MIS.daily.key] || 0;
      if (r.daily > prev) { sc[MIS.daily.key] = r.daily; store.set('rn.daily', JSON.stringify(sc)); }
      extra += `<div class="reward"><strong>Rute Harian ${MIS.daily.label}:</strong> skor ${r.daily}${r.daily > prev ? (prev ? ' · rekor baru hari ini!' : '') : ` · terbaik hari ini ${prev}`} · 🔥 ${dailyStreak()} hari beruntun</div>`;
    }
    if (S.expert && !r.failed && r.stars === 3) {
      const a = ahliSet(); if (!a.includes(MIS.id)) { a.push(MIS.id); store.set('rn.ahli', JSON.stringify(a)); }
      extra += '<div class="reward ahli"><strong>MASINIS AHLI</strong> · tiga bintang tanpa bantuan HUD. Lencana emas ditambahkan ke karcis misi ini.</div>';
    }
    if (r.failed) Sound.failSting(); else Sound.stars(r.stars);
    $('resTitle').textContent = r.failed ? 'Misi gagal' : 'Misi selesai';
    const mid = MIS.daily ? `Rute Harian ${MIS.daily.label}` : `Misi ${MIS.id}`;
    $('resEyebrow').textContent = (r.failed ? `${mid} · ${MIS.title}` : `${mid} · tiba ${fmtClock(S.clock)}`) + (S.expert ? ' · Masinis Ahli' : '');
    $('resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < r.stars ? 'on' : 'off'}">${STAR_SVG}</span>`).join('');
    $('resStars').setAttribute('aria-label', `${r.stars} dari 3 bintang`);
    const fr = $('resFail');
    fr.hidden = !r.failed;
    fr.textContent = r.failed ? S.failReason : '';
    $('btnAgain').textContent = r.failed ? 'Coba lagi' : 'Main lagi';

    const rows = S.stops.map((s) => {
      const late = s.clock - s.sched;
      const timeCell = late > 30 ? `<span class="late">terlambat ${fmtDur(late)}</span>` : `<span class="ontime">tepat waktu</span>`;
      return `<tr><td>${s.name}</td><td><span class="tag ${s.rating.c}">${s.rating.r}</span> ${fmtM(Math.abs(s.offset))} m</td><td>${fmtClock(s.clock)} / ${fmtClock(s.sched)}<br>${timeCell}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Belum ada pemberhentian.</td></tr>';
    const loadRows = S.loads.map((l) => `<tr><td>Muat gerbong ${l.i + 1}</td><td colspan="2"><span class="tag ${l.rating.c}">${l.rating.r}</span> ${fmtM(Math.abs(l.offset))} m dari corong</td></tr>`).join('');
    const viol = S.violations.length ? `<ul class="viol">${S.violations.map((v) => `<li>${v}</li>`).join('')}</ul>` : '';
    const rewardTxt = MIS.goal2 === 'rival' ? (r.beatBus ? MIS.rewardWin : MIS.rewardLose) : MIS.reward;
    const reward = !r.failed && r.stars >= 1 ? `<div class="reward">${rewardTxt}</div>` : '';
    const rivalRow = ROUTE.rival && !r.failed ? `<tr><td>Bus ${ROUTE.rival.name}</td><td colspan="2">${S.bus.done ? `tiba ${fmtClock(S.bus.arrive)}` : 'belum tiba'} · ${r.beatBus ? '<span class="ontime">kamu menang</span>' : '<span class="late">bus menang</span>'}</td></tr>` : '';
    const next = MISSION_ORDER.includes(MIS.id) ? MISSION_ORDER[MISSION_ORDER.indexOf(MIS.id) + 1] : null;
    const btnNext = $('btnNext');
    btnNext.hidden = !(next && !r.failed);
    if (next) btnNext.textContent = `Lanjut ke Misi ${next}`;
    const missed = r.goals.find((g) => g.state !== 'ok' && g.tip);
    const goalList = `<ul class="rgoals">${r.goals.map((g) => `<li class="${g.state === 'ok' ? 'ok' : 'miss'}"><i>★</i><span>${g.label}</span><small>${g.value || (g.state === 'ok' ? 'tercapai' : 'belum')}</small></li>`).join('')}</ul>${!r.failed && missed ? `<p class="rtip">Tips: ${missed.tip}</p>` : ''}`;
    $('resCard').innerHTML = `${goalList}
      <table class="rtable">
        <thead><tr><th>Stasiun</th><th>Berhenti</th><th>Tiba / jadwal</th></tr></thead>
        <tbody>${loadRows}${rows}
          ${rivalRow}
          <tr><td>${MIS.freight ? 'Muatan utuh' : 'Kenyamanan'}</td><td colspan="2">${Math.round(S.comfort)}%${S.comfort >= 80 ? '' : ' (target 80%)'}</td></tr>
          <tr><td>Koin</td><td colspan="2"><strong>${r.total}</strong> <span style="color:var(--muted)">(misi ${r.base} + berhenti ${S.coins} + nyaman ${r.comfortBonus} − pelanggaran ${r.penalty}${S.expert ? ', ×1,5 Masinis Ahli' : ''})</span></td></tr>
        </tbody>
      </table>${viol}${extra}${reward}`;
    showScreen('result');
  }

  // ---------- screen flow ----------
  function showScreen(name) {
    mode = name;
    for (const [k, el] of Object.entries(ui.screens)) el.hidden = k !== name;
    ui.hud.hidden = !(name === 'play' || name === 'pause');
    if (name !== 'play') { toastTimer = 0; ui.toast.className = ''; }
    if (name === 'title') renderMissionList();
    if (name !== 'play' && name !== 'pause') $('radio').hidden = true;
  }
  const bestOf = (id) => Number(store.get('relnusantara.best.' + id) || 0);
  const starStr = (b) => '★'.repeat(b) + '☆'.repeat(3 - b);
  const clockOf = (sec) => `${String(Math.floor(sec / 3600)).padStart(2, '0')}.${String(Math.floor(sec / 60) % 60).padStart(2, '0')}`;
  // misi berikutnya: yang pertama belum diselesaikan, atau misi terakhir
  const nextMissionId = () => {
    const veteran = MISSION_ORDER.some((id) => !MISSIONS[id].tutorial && bestOf(id) > 0);
    return MISSION_ORDER.find((id) => bestOf(id) === 0 && !(veteran && MISSIONS[id].tutorial)) || MISSION_ORDER[MISSION_ORDER.length - 1];
  };
  // ---------- layar judul: peta misi Jawa–Sumatra dan garasi Si Gagah ----------
  // koordinat peta dalam bidang 540 x 390; diskalakan ke ukuran kanvas
  const MAP_ROUTES = {
    '1-1': { pts: [[282, 308], [300, 300]], col: '#f2c94c' },
    '1-2': { pts: [[300, 300], [338, 292]], col: '#e0b07a' },
    '1-3': { pts: [[300, 300], [319, 299], [338, 292]], col: '#d8a06a' },
    '1-4': { pts: [[300, 300], [338, 292], [372, 300]], col: '#e8955a' },
    '1-5': { pts: [[372, 300], [404, 314], [440, 306]], col: '#7aa6b8' },
    '1-6': { pts: [[440, 306], [404, 318], [372, 306], [336, 300], [300, 306]], col: '#b07ad8' },
    '1-7': { pts: [[440, 306], [464, 314], [486, 318]], col: '#5f9fb0' },
    '2-2': { pts: [[176, 168], [150, 140], [124, 112]], col: '#8fa0d8' },
    '2-3': { pts: [[124, 112], [140, 150], [176, 168]], col: '#c9a05a' },
    '2-1': { pts: [[176, 168], [206, 196], [236, 214], [262, 238]], col: '#6fb36a' },
  };
  const MAP_ST = [[282, 308, 'Depo'], [319, 299, ''], [300, 300, 'Sukamaju'], [338, 292, 'Cibening'], [372, 300, 'Pasar Lama'], [404, 314, 'Kali Jernih'], [440, 306, 'Watugede'], [464, 314, ''], [486, 318, 'Kedung Banteng'], [176, 168, 'Muara Kelam'], [150, 140, ''], [124, 112, 'Simpang Barisan'], [262, 238, 'Tanjung Api']];
  const ISL_SUM = [[22, 30], [60, 14], [110, 44], [160, 92], [212, 136], [262, 178], [300, 222], [306, 256], [282, 266], [240, 246], [190, 214], [134, 168], [84, 120], [40, 78], [18, 48]];
  const ISL_JAW = [[252, 266], [300, 254], [360, 260], [420, 266], [480, 272], [522, 288], [528, 330], [492, 352], [430, 348], [370, 346], [310, 342], [262, 330], [240, 298]];
  const titleMap = { tab: 'map', focus: null, t: 0 };
  function islandPath(c, pts) {
    const n = pts.length, mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
    c.beginPath(); const m0 = mid(n - 1); c.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(i); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    c.closePath();
  }
  function routeAt(pts, u) {
    let L = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); L += d; }
    let d = u * L;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const k = d / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])]; } d -= seg[i]; }
    return [pts[pts.length - 1][0], pts[pts.length - 1][1], 0];
  }
  function drawTitleMap(dt) {
    const cvm = $('mapCv'); if (!cvm || cvm.offsetParent === null) return;
    titleMap.t += dt;
    const r = cvm.getBoundingClientRect(), w = Math.round(r.width * DPR), h = Math.round(r.height * DPR);
    if (!w || !h) return;
    if (cvm.width !== w || cvm.height !== h) { cvm.width = w; cvm.height = h; }
    const c = cvm.getContext('2d'), t = titleMap.t;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
    if (titleMap.tab === 'garage') { c.setTransform(DPR, 0, 0, DPR, 0, 0); drawGarage(c, w / DPR, h / DPR, t); return; }
    // peta 540x390 dipotong tengah agar mengisi kanvas
    const sea = c.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, '#1e5668'); sea.addColorStop(1, '#14404f');
    c.fillStyle = sea; c.fillRect(0, 0, w, h);
    const k = Math.min(w / 540, h / 370), ox = (w - 540 * k) / 2, oy = (h - 370 * k) / 2 - 8 * k;
    c.setTransform(k, 0, 0, k, ox, oy);
    c.strokeStyle = 'rgba(200,235,240,0.12)'; c.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = (hash(i) * 560 + t * 4) % 560 - 10, y = hash(i + 7) * 390; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 5, y - 3, x + 10, y); c.stroke(); }
    [[ISL_SUM, 'SUMATRA', 66, 50], [ISL_JAW, 'JAWA', 352, 334]].forEach(([pts, name, lx, ly]) => {
      c.save(); islandPath(c, pts); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 14; c.fillStyle = '#e9dcb8'; c.fill(); c.restore();
      c.save(); islandPath(c, pts); c.clip();
      const g = c.createLinearGradient(0, 0, 0, 390); g.addColorStop(0, '#b9cf8a'); g.addColorStop(1, '#8fb070'); c.fillStyle = g; c.fillRect(0, 0, 540, 390);
      c.fillStyle = 'rgba(70,110,60,0.25)';
      for (let i = 0; i < 120; i++) { c.beginPath(); c.arc(hash(i * 3.1 + lx) * 540, hash(i * 1.7 + ly) * 390, 1.6, 0, 7); c.fill(); }
      c.restore();
      islandPath(c, pts); c.strokeStyle = '#f3ead0'; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(40,60,40,0.55)'; c.font = '800 15px "Big Shoulders Display", sans-serif'; c.textAlign = 'center'; c.fillText(name, lx, ly); c.textAlign = 'start';
    });
    [[96, 70], [150, 118], [352, 274], [478, 296]].forEach(([x, y], i) => {
      c.fillStyle = '#7c6a5a'; c.beginPath(); c.moveTo(x - 12, y + 6); c.lineTo(x - 2, y - 10); c.lineTo(x + 2, y - 10); c.lineTo(x + 12, y + 6); c.closePath(); c.fill();
      for (let q = 0; q < 4; q++) { const u = (t * 0.08 + q / 4 + i * 0.2) % 1; c.fillStyle = `rgba(240,236,228,${0.35 * (1 - u)})`; c.beginPath(); c.arc(x + u * 10, y - 12 - u * 12, 2 + u * 4, 0, 7); c.fill(); }
    });
    c.fillStyle = 'rgba(200,235,240,0.55)'; c.font = 'italic 600 10px "Plus Jakarta Sans", sans-serif'; c.fillText('Selat Sunda', 186, 300);
    c.save(); c.translate(500, 40); c.strokeStyle = 'rgba(243,234,208,0.7)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke();
    c.fillStyle = '#f2a516'; c.beginPath(); c.moveTo(0, -18); c.lineTo(4, 0); c.lineTo(-4, 0); c.closePath(); c.fill();
    c.fillStyle = '#f3ead0'; c.font = '800 10px "Big Shoulders Display", sans-serif'; c.textAlign = 'center'; c.fillText('U', 0, -22); c.textAlign = 'start'; c.restore();
    const sel = titleMap.focus || nextMissionId();
    Object.entries(MAP_ROUTES).forEach(([id, m]) => {
      const on = id === sel;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = on ? 'rgba(255,255,255,0.9)' : 'rgba(40,40,40,0.55)'; c.lineWidth = on ? 6 : 4;
      c.beginPath(); m.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      c.strokeStyle = m.col; c.lineWidth = on ? 3.5 : 2; c.setLineDash(on ? [] : [4, 3]);
      c.beginPath(); m.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.setLineDash([]);
    });
    MAP_ST.forEach(([x, y, n]) => {
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.strokeStyle = '#2a2a2a'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#1f2a22'; c.font = '700 9px "Plus Jakarta Sans", sans-serif'; c.textAlign = 'center'; c.fillText(n, x, y + (y > 300 ? 16 : -9)); c.textAlign = 'start';
    });
    const u = REDUCE_MOTION ? 0.5 : Math.sin(t * 0.6) * 0.5 + 0.5, [px, py, a] = routeAt(MAP_ROUTES[sel].pts, u);
    c.save(); c.translate(px, py); c.rotate(a);
    c.fillStyle = '#f7f3e8'; roundRect(c, -9, -4, 18, 8, 2); c.fill(); c.fillStyle = '#f2a516'; c.fillRect(-9, 0, 18, 2); c.fillStyle = '#1f6f6d'; c.fillRect(5, -3, 3, 3);
    c.restore();
  }
  function drawGarage(c, w, h, t) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1f24'); g.addColorStop(1, '#0c0f12');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const x = w * (0.12 + i * 0.3), bw = w * 0.12;
      const bg = c.createLinearGradient(0, h * 0.08, 0, h * 0.85); bg.addColorStop(0, 'rgba(255,220,160,0.14)'); bg.addColorStop(1, 'rgba(255,220,160,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(x, h * 0.08); c.lineTo(x + bw, h * 0.08); c.lineTo(x + bw * 1.7, h * 0.85); c.lineTo(x + bw * 0.6, h * 0.85); c.closePath(); c.fill();
    }
    const gy = h * 0.78, ppm = w / 24;
    c.fillStyle = '#2a2f33'; c.beginPath(); c.ellipse(w / 2, gy + 6, w * 0.46, h * 0.1, 0, 0, 7); c.fill();
    c.fillStyle = '#7d8487'; c.fillRect(w * 0.06, gy - 2, w * 0.88, 2); c.fillStyle = '#a3a9ab'; c.fillRect(w * 0.06, gy + 2, w * 0.88, 2);
    // Si Gagah dari samping, digambar dengan fungsi kereta di game
    const V = { c, ppm, gy, X: (wx) => w / 2 + (wx - 9) * ppm, st: { x: 18, doors: 'closed', aboard: 0, spin: 0, carDyn: null }, p: 0.7, storm: false, tf: 0, camX: 0, rimA: 0.35, rim: '#ffcf8a', refl: 0.15, lit: false, sunShadow: 0, night: false, bdy: () => 0 };
    const keep = [N_COACH]; N_COACH = 0;
    try { drawTrain(V); } finally { N_COACH = keep[0]; }
    for (let i = 0; i < 30; i++) { const x = ((hash(i) * w + t * 5 * (hash(i + 2) - 0.5)) % w + w) % w, y = (hash(i + 5) * h * 0.7 + t * 3) % (h * 0.7) + h * 0.08; c.fillStyle = 'rgba(255,230,190,0.3)'; c.fillRect(x, y, 1.5, 1.5); }
    c.fillStyle = '#f3eee1'; c.font = `900 ${Math.round(h * 0.09)}px "Big Shoulders Display", sans-serif`; c.fillText('SI GAGAH · RN 2001', w * 0.04, h * 0.14);
    const done = MISSION_ORDER.filter((id) => bestOf(id) > 0).length;
    c.fillStyle = '#a5b4b5'; c.font = `600 ${Math.round(h * 0.045)}px "Plus Jakarta Sans", sans-serif`;
    c.fillText(`Depo Sukamaju · ${done} dari ${MISSION_ORDER.length} misi selesai · diesel-elektrik CC, livery Rel Nusantara`, w * 0.04, h * 0.22);
    // album kartu pos landmark
    const got = cardsGot(), n = LM_IDS.length, gap = w * 0.008, cw = (w * 0.92 - gap * (n - 1)) / n, ch = cw * 1.08, ay = h * 0.275;
    c.fillStyle = '#c9b48a'; c.font = `800 ${Math.round(h * 0.032)}px "Plus Jakarta Sans", sans-serif`;
    c.fillText(`ALBUM KARTU POS · ${got.length} DARI ${n}`, w * 0.04, ay - h * 0.012);
    if (!albumCv) { albumCv = document.createElement('canvas'); albumCv.width = 80; albumCv.height = 100; }
    const ac2 = albumCv.getContext('2d');
    LM_IDS.forEach((id, i) => {
      const d = LANDMARKS[id], x = w * 0.04 + i * (cw + gap), has = got.includes(id);
      if (has) { drawCardArt(ac2, 80, 100, d, true); c.drawImage(albumCv, x, ay, cw, ch); c.strokeStyle = '#f7f1e2'; c.lineWidth = 2; c.strokeRect(x, ay, cw, ch); }
      else {
        c.setLineDash([3, 3]); c.strokeStyle = 'rgba(243,238,225,0.3)'; c.lineWidth = 1; c.strokeRect(x + 0.5, ay + 0.5, cw - 1, ch - 1); c.setLineDash([]);
        c.fillStyle = 'rgba(243,238,225,0.4)'; c.textAlign = 'center'; c.font = `800 ${Math.round(cw * 0.26)}px "Big Shoulders Display", sans-serif`; c.fillText(d.mis, x + cw / 2, ay + ch * 0.58); c.textAlign = 'start';
      }
    });
  }
  let albumCv = null;


  // ---------- Rute Harian: satu misi per hari, kondisi acak yang sama untuk semua pemain pada tanggal itu ----------
  const DAILY_POOL = ['1-4', '1-5', '1-6', '1-7', '2-2'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function buildDaily(day) {
    const key = dateKey(day), rnd = seeded('rn-harian-' + key);
    const baseId = DAILY_POOL[Math.floor(rnd() * DAILY_POOL.length)], base = MISSIONS[baseId];
    const m = JSON.parse(JSON.stringify(Object.assign({}, base, { pal: null })));
    m.id = 'daily'; m.base = baseId; m.pal = base.pal; m.chapter = 'Rute Harian'; m.tutorial = false;
    const R = m.route, st = R.stations, fin = st[st.length - 1].x, mods = [];
    const inStation = (x) => st.concat(R.passStations || []).some((q) => x > q.x - 160 && x < q.x + 80);
    const pick = (lo, hi) => { for (let k = 0; k < 20; k++) { const x = Math.round(lo + rnd() * (hi - lo)); if (!inStation(x)) return x; } return null; };
    const pool = ['rain', 'fog', 'tree', 'goat', 'tight'].sort(() => rnd() - 0.5);
    const want = 2 + (rnd() < 0.5 ? 1 : 0);
    for (const kind of pool) {
      if (mods.length >= want) break;
      if (kind === 'rain' && m.sky !== 'night' && !m.rain) { m.rain = true; m.sky = 'storm'; m.pal = MISSIONS['1-5'].pal; m.weather = 'hujan deras'; mods.push('☂ Hujan deras, rel licin'); }
      else if (kind === 'fog' && !R.fog) { const a = pick(250, fin - 900); if (a !== null) { R.fog = { from: a, to: a + 550 }; mods.push(`🌫 Kabut di km ${(a / 1000).toFixed(1).replace('.', '+')}`); } }
      else if (kind === 'tree' && !R.tree) {
        for (let i = 0; i < st.length - 1; i++) { const a = st[i].x + 350, b = st[i + 1].x - 550; if (b - a > 250) { R.tree = { from: a, to: b, warn: 420 }; mods.push('🌳 Pohon tumbang di lintas lurus'); break; } }
      } else if (kind === 'goat') { const x = pick(400, fin - 500); if (x !== null) { R.goats = (R.goats || []).concat([{ x, hornFrom: x - 230 }]); mods.push('🐐 Kambing di rel'); } }
      else if (kind === 'tight') { st.forEach((q) => { q.sched = Math.round(q.sched * 0.97); }); mods.push('⏱ Jadwal ketat (−3%)'); }
    }
    m.daily = { key, label: `${day.getDate()}/${day.getMonth() + 1}`, hari: HARI[day.getDay()], mods };
    return m;
  }
  const dailyScores = () => { try { const o = JSON.parse(store.get('rn.daily') || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  function dailyStreak() {
    const sc = dailyScores(), d = new Date();
    if (!sc[dateKey(d)]) d.setDate(d.getDate() - 1);
    let n = 0; while (sc[dateKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const ahliSet = () => { try { const a = JSON.parse(store.get('rn.ahli') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  let expertOn = store.get('rn.expert') === '1';
  const expertAllowed = (m) => MISSION_ORDER.includes(m.id) && bestOf(m.id) > 0;
  function renderMissionList() {
    const nextId = nextMissionId();
    const today = new Date();
    MISSIONS.daily = buildDaily(today);
    const D = MISSIONS.daily, best = dailyScores()[D.daily.key], streak = dailyStreak(), bm = MISSIONS[D.base];
    const dailyLi = `<li class="daily"><button class="ticket t-daily" data-id="daily">
        <span class="stub"><small>HARIAN</small><b>${D.daily.label}</b><small>${D.daily.hari}</small></span>
        <span class="tbody"><b>Rute Harian · ${bm.title}</b><small>Misi ${D.base} · ${D.daily.mods.join(' · ')}</small><span class="dline">${best ? `Terbaik hari ini <strong>${best}</strong>` : 'Belum dimainkan hari ini'}${streak ? ` · 🔥 ${streak} hari beruntun` : ''}</span></span>
      </button></li>`;
    const ahli = ahliSet();
    $('missionList').innerHTML = dailyLi + MISSION_ORDER.map((id) => {
      const m = MISSIONS[id], b = bestOf(id), st = m.route.stations;
      const route = `${titleCase(st[0].name)} → ${titleCase(st[st.length - 1].name)} · ${clockOf(m.startClock)} · ${m.weather}`;
      const stars = b ? `<span class="tstars" aria-label="${b} dari 3 bintang">${'★'.repeat(b)}<i>${'★'.repeat(3 - b)}</i></span>` : '<span class="tnew">BELUM DIMAINKAN</span>';
      return `<li${m.tutorial ? ' class="tut"' : ''}><button class="ticket t-${m.ticket || m.sky}${m.tutorial ? ' t-tut' : ''}${id === nextId ? ' next' : ''}" data-id="${id}">
        <span class="stub"><small>MISI</small><b>${id}</b></span>
        <span class="tbody"><b>${m.title}</b><small>${route}</small>${stars}${ahli.includes(id) ? '<span class="tahli" title="Masinis Ahli">AHLI</span>' : ''}</span>
      </button></li>`;
    }).join('');
    const anyPlayed = MISSION_ORDER.some((id) => bestOf(id) > 0);
    $('continueLbl').textContent = `${anyPlayed ? 'Lanjutkan' : 'Mulai'} · Misi ${nextId}`;
  }
  function selectMission(id) {
    MIS = MISSIONS[id]; ROUTE = MIS.route;
    N_COACH = MIS.freight ? MIS.wagons : MIS.coaches || 3;
    CAR_LEN = MIS.freight ? WAGON_LEN : COACH_LEN;
    TRAIN_LEN = LOCO_LEN + N_COACH * (CAR_LEN + GAP);
    const ax = [1.8, 3.5, 5.2, 10.45, 12.15, 13.85];
    for (let k = 0; k < N_COACH; k++) {
      const f = carFront(k);
      (MIS.freight ? [1.6, 3.4, 8.6, 10.4] : [3.17, 5.33, 14.67, 16.83]).forEach((o) => ax.push(f + o));
    }
    Sound.setAxles(ax);
    const turnouts = [];
    allStations().forEach((q) => { turnouts.push(q.x - 112, q.x + 42); });
    Sound.setTrack({ turnouts, decks: ROUTE.crossings.map((cr) => cr.x), bridge: ROUTE.bridge || null });
    buildBend();
    idleState = makeIdle();
    textCache.clear();
  }
  function showBrief() {
    const m = MIS, R = ROUTE, f = finalStation();
    $('briefEyebrow').textContent = m.daily ? `Rute Harian · ${m.daily.hari} ${m.daily.label} · Misi ${m.base}` : `${m.chapter} · Misi ${m.id}`;
    $('briefTitle').textContent = m.title;
    $('briefAvatar').textContent = m.speaker.initials;
    $('briefWho').textContent = m.speaker.who;
    $('briefText').textContent = m.brief;
    const stops = R.stations.slice(1);
    $('briefFacts').innerHTML = `
      <dt>Rute</dt><dd>${R.stations.map((s) => titleCase(s.name)).join(' → ')}</dd>
      <dt>Jarak</dt><dd>${(f.x / 1000).toFixed(1).replace('.', ',')} km · ${m.freight ? 'muat di tambang, bongkar di dermaga' : `${stops.length} pemberhentian`}</dd>
      <dt>Kereta</dt><dd>${m.freight ? `Si Gagah + ${m.wagons} gerbong batu bara` : `Si Gagah + ${N_COACH} gerbong penumpang${ROUTE.couple ? ' (+ gerbong kopi di Pasar Kopi Liwa)' : ''}`}</dd>
      <dt>Berangkat</dt><dd>${fmtClock(0)}, ${m.weather}</dd>
      <dt>Jadwal</dt><dd>${stops.map((s) => `${titleCase(s.name)} ${fmtClock(s.sched)}`).join(' · ')}</dd>${m.daily ? `<dt>Kondisi hari ini</dt><dd>${m.daily.mods.join(' · ')}</dd>` : ''}`;
    $('briefGoals').innerHTML = goalDefs().map((g) => `<li><span class="star">★</span>${g.label}</li>`).join('');
    const tb = $('btnTutSkip');
    tb.hidden = !TUTORIAL[m.id];
    syncTutSkip();
    $('btnExpert').hidden = !expertAllowed(m);
    syncExpert();
    showScreen('brief');
  }
  function startMission() {
    S = newState();
    textCache.clear();
    showScreen('play');
    fitStrip();
    renderLever();
    S.expert = expertOn && expertAllowed(MIS);
    ui.hud.classList.toggle('expert', S.expert);
    $('btnSand').hidden = !MIS.rain;
    ui.btnDoor.hidden = !!MIS.freight;
    document.querySelector('.cluster .ring .lbl').textContent = MIS.freight ? 'Muatan' : 'Kenyamanan';
    document.querySelector('.cluster .next .lbl').textContent = MIS.freight ? 'Tujuan' : 'Stasiun berikutnya';
    $('rivalPanel').hidden = !ROUTE.rival;
    document.querySelectorAll('.cluster .coins').forEach((el) => { el.hidden = !!ROUTE.rival; });
    ui.rivalSep.hidden = !ROUTE.rival;
    $('radio').hidden = true; radioTimer = 0; camLead = 0; camZoom = 1; camRoll = 0; sparks.length = 0; crowds.clear(); goalSig = '';
    resetCrossings();
    const thisRun = S;
    if (ROUTE.rival) setTimeout(() => { if (S === thisRun && S.mode === 'play') radio(`Selamat bertanding, anak muda. ${ROUTE.rival.name} belum pernah kalah.`, 6, 'Pak Bram', 'PB'); }, 4500);
    toast(MIS.intro, 'info', 4, null, 3);
    if (!MIS.freight) setTimeout(() => { if (S && S.st === 0) Sound.announce(`Perhatian. Kereta lokal Si Gagah tujuan ${titleCase(finalStation().name)} di jalur satu akan segera diberangkatkan.`); }, 600);
  }

  // ---------- input ----------
  function bindPress(el, fn) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.init(); el.classList.add('pressed'); fn(); });
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }
  // klakson ditahan: berbunyi selama tombol ditekan
  ui.btnHorn.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.init(); ui.btnHorn.classList.add('pressed'); horn(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => ui.btnHorn.addEventListener(ev, () => { ui.btnHorn.classList.remove('pressed'); Sound.hornStop(); }));
  ui.btnHorn.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); horn(); } });
  ui.btnHorn.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') Sound.hornStop(); });
  window.addEventListener('keyup', (e) => { if (e.key.toLowerCase() === 'h') Sound.hornStop(); });
  bindPress(ui.btnDoor, door);
  bindPress($('btnSand'), sand);

  function leverFromY(clientY) {
    const r = ui.leverRows.getBoundingClientRect();
    const idx = clamp(Math.floor(((clientY - r.top) / r.height) * NOTCHES.length), 0, NOTCHES.length - 1);
    if (S && S.mode === 'play') setNotch(4 - idx);
  }
  let leverDrag = false;
  ui.lever.addEventListener('pointerdown', (e) => {
    e.preventDefault(); Sound.init();
    leverDrag = true;
    try { ui.lever.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    leverFromY(e.clientY);
  });
  ui.lever.addEventListener('pointermove', (e) => { if (leverDrag) leverFromY(e.clientY); });
  const endDrag = () => { leverDrag = false; };
  ui.lever.addEventListener('pointerup', endDrag);
  ui.lever.addEventListener('pointercancel', endDrag);
  ui.lever.addEventListener('keydown', (e) => {
    if (!S || S.mode !== 'play') return;
    if (e.key === 'ArrowUp') { e.preventDefault(); setNotch(S.notch + 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setNotch(S.notch - 1); }
  });

  function renderLever() {
    if (!S) return;
    const idx = 4 - S.notch;
    ui.thumb.style.top = `${idx * 10}%`;
    ui.thumb.className = 'thumb' + (S.notch < 0 ? ' brake' : '');
    ui.thumb.textContent = notchLabel(S.notch);
    rowEls.forEach((el, i) => el.classList.toggle('on', i === idx));
    ui.lever.setAttribute('aria-valuenow', String(S.notch));
    ui.lever.setAttribute('aria-valuetext', notchLabel(S.notch));
  }

  window.addEventListener('keydown', (e) => {
    if (mode !== 'play' || !S || S.mode !== 'play') {
      if ((e.key === 'Escape' || e.key === 'p') && mode === 'pause') resume();
      return;
    }
    if (e.target === ui.lever) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { e.preventDefault(); setNotch(S.notch + 1); }
    else if (k === 'arrowdown' || k === 's') { e.preventDefault(); setNotch(S.notch - 1); }
    else if (k === ' ') { e.preventDefault(); setNotch(-5); }
    else if (k === 'h') { if (!e.repeat) horn(); }
    else if (k === 'v') toggleView();
    else if (k === 'd' || k === 'enter') door();
    else if (k === 'a') sand();
    else if (k === 'escape' || k === 'p') pause();
    Sound.init();
  });

  function pause() { if (mode === 'play') { showScreen('pause'); } }
  function resume() { if (mode === 'pause') { showScreen('play'); last = performance.now(); } }
  $('btnPause').addEventListener('click', pause);
  $('btnResume').addEventListener('click', resume);
  $('btnRestart').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnQuit').addEventListener('click', () => { S = null; showScreen('title'); });
  $('btnContinue').addEventListener('click', () => { Sound.init(); selectMission(nextMissionId()); showBrief(); });
  // peta misi: sorot rute saat karcis disentuh, ketuk rute untuk memilih misi, tab peta/garasi
  const mapId = (id) => (id === 'daily' && MISSIONS.daily ? MISSIONS.daily.base : id);
  $('missionList').addEventListener('pointerover', (e) => { const b = e.target.closest('.ticket'); if (b) titleMap.focus = mapId(b.dataset.id); });
  $('missionList').addEventListener('focusin', (e) => { const b = e.target.closest('.ticket'); if (b) titleMap.focus = mapId(b.dataset.id); });
  document.querySelectorAll('[data-maptab]').forEach((b) => b.addEventListener('click', () => {
    titleMap.tab = b.dataset.maptab;
    document.querySelectorAll('[data-maptab]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('mapCv').addEventListener('click', (e) => {
    if (titleMap.tab !== 'map') return;
    const cvm = e.currentTarget, r = cvm.getBoundingClientRect(), w = r.width, h = r.height;
    const k = Math.min(w / 540, h / 370), ox = (w - 540 * k) / 2, oy = (h - 370 * k) / 2 - 8 * k;
    const x = (e.clientX - r.left - ox) / k, y = (e.clientY - r.top - oy) / k;
    let best = null, bd = 22;
    Object.entries(MAP_ROUTES).forEach(([id, m]) => m.pts.forEach(([px, py]) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = id; } }));
    if (!best) return;
    if (titleMap.focus === best) { Sound.init(); selectMission(best); showBrief(); } else titleMap.focus = best;
  });
  $('missionList').addEventListener('click', (e) => {
    const b = e.target.closest('.ticket');
    if (!b) return;
    Sound.init(); selectMission(b.dataset.id); showBrief();
  });
  $('btnHowto').addEventListener('click', () => showScreen('howto'));
  $('btnHowtoBack').addEventListener('click', () => showScreen('title'));
  $('btnNext').addEventListener('click', () => {
    const next = MISSION_ORDER.includes(MIS.id) ? MISSION_ORDER[MISSION_ORDER.indexOf(MIS.id) + 1] : null;
    if (next) { selectMission(next); showBrief(); }
  });
  $('btnBack').addEventListener('click', () => showScreen('title'));
  $('btnGo').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnAgain').addEventListener('click', () => { Sound.init(); startMission(); });
  $('btnMenu').addEventListener('click', () => { S = null; showScreen('title'); });
  const SPK_ON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const SPK_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function syncAudioButtons() {
    const m = Sound.muted, mu = Sound.musicOn;
    $('btnMute').innerHTML = m ? SPK_OFF : SPK_ON;
    $('btnMute').setAttribute('aria-label', m ? 'Nyalakan suara' : 'Matikan semua suara');
    $('btnMusic').classList.toggle('off', !mu);
    $('btnMusic').setAttribute('aria-label', mu ? 'Matikan musik' : 'Nyalakan musik');
    $('btnMusicTitle').textContent = `Musik: ${mu ? 'nyala' : 'mati'}`;
    $('btnSoundTitle').textContent = `Suara: ${m ? 'mati' : 'nyala'}`;
  }
  $('btnMute').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncAudioButtons(); });
  $('btnSoundTitle').addEventListener('click', () => { Sound.init(); Sound.toggleMute(); syncAudioButtons(); });
  $('btnMusic').addEventListener('click', () => { Sound.init(); Sound.toggleMusic(); syncAudioButtons(); });
  // tombol ganti sudut pandang: samping (2.5D) atau kabin masinis
  function syncViewButton() {
    const b = $('btnView'), cab = viewMode === 'cab';
    b.classList.toggle('on', cab);
    b.setAttribute('aria-label', cab ? 'Tampilan samping' : 'Tampilan kabin masinis');
    b.setAttribute('aria-pressed', String(cab));
  }
  function toggleView() {
    viewMode = viewMode === 'cab' ? 'side' : 'cab';
    store.set('rn.view', viewMode);
    syncViewButton();
    toast(viewMode === 'cab' ? 'Tampilan kabin masinis. Tekan lagi untuk tampilan samping.' : 'Tampilan samping.', 'info', 2, 'view', 1);
  }
  $('btnView').addEventListener('click', toggleView);
  $('btnExpert').addEventListener('click', () => { expertOn = !expertOn; store.set('rn.expert', expertOn ? '1' : '0'); syncExpert(); });
  $('btnTutSkip').addEventListener('click', () => { store.set('rn.tutSkip', store.get('rn.tutSkip') === '1' ? '0' : '1'); syncTutSkip(); });
  syncViewButton();
  $('btnMusicTitle').addEventListener('click', () => { Sound.init(); Sound.toggleMusic(); syncAudioButtons(); });
  syncAudioButtons();
  // browser hanya mengizinkan audio setelah sentuhan pertama
  document.addEventListener('pointerdown', () => Sound.init(), { once: true });
  document.addEventListener('keydown', () => Sound.init(), { once: true });
  $('btnRotateSkip').addEventListener('click', () => { rotateSkipped = true; checkOrientation(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', resize);

  // ---------- HUD ----------
  function syncExpert() {
    const b = $('btnExpert'); if (!b) return;
    b.textContent = expertOn ? '★ Masinis Ahli: nyala' : 'Masinis Ahli: mati';
    b.setAttribute('aria-pressed', String(expertOn)); b.classList.toggle('on', expertOn);
  }
  function syncTutSkip() {
    const skip = store.get('rn.tutSkip') === '1', tb = $('btnTutSkip');
    tb.textContent = skip ? 'Petunjuk: mati' : 'Petunjuk: nyala';
    tb.setAttribute('aria-pressed', String(!skip));
  }
  function updateHud() {
    setText(ui.clock, fmtClock(S.clock));
    const ns = S.phase === 'dwell' ? ROUTE.stations[S.st] : nextStation();
    if (S.phase === 'load') {
      setText(ui.nextName, 'CORONG MUAT');
      setText(ui.nextSched, S.loadT > 0 ? `memuat gerbong ${S.loadIdx + 1}...` : `gerbong ${Math.min(S.loadIdx + 1, N_COACH)} dari ${N_COACH}`);
    } else if (ns) {
      setText(ui.nextName, ns.name);
      if (S.phase === 'dwell' && S.st === 0) setText(ui.nextSched, `berangkat ${fmtClock(0)}`);
      else if (S.phase === 'dwell') setText(ui.nextSched, 'berhenti di peron');
      else {
        const rem = ns.sched - S.clock;
        setText(ui.nextSched, `jadwal ${fmtClock(ns.sched)} · ${rem >= 0 ? 'sisa ' + fmtDur(rem) : 'terlambat ' + fmtDur(rem)}`);
      }
    }
    const cf = Math.round(S.comfort);
    ui.comfortRing.style.strokeDasharray = `${(106.8 * cf / 100).toFixed(1)} 106.8`;
    ui.comfortRing.style.stroke = cf >= 80 ? 'var(--sig-green)' : cf >= 55 ? 'var(--saffron)' : 'var(--sig-red)';
    setText(ui.comfortVal, String(cf));
    setText(ui.coins, String(S.coins));

    const kmh = S.v * 3.6;
    const { lim } = currentLimit();
    setText(ui.speed, String(Math.round(kmh)));
    setText(ui.limit, String(lim));
    setClass(ui.speedo, 'over', kmh > lim + 2);
    updateGauge(kmh, lim);
    const nl = nextLimitAhead();
    setText(ui.nextLimit, nl ? `${nl.limit} dalam ${Math.round(nl.from - S.x)} m` : S.yellowLimit ? 'Sinyal kuning · maks 40' : '');
    {
      const zc = zoneAt(S.x), lat = latAccel(S), gl = $('gLat');
      gl.hidden = !(zc && zc.curve);
      if (!gl.hidden) {
        $('gLatFill').style.width = `${Math.round(clamp(lat / 2.2, 0, 1) * 100)}%`;
        setClass(gl, 'warn', lat >= 1.0 && lat < 1.5); setClass(gl, 'bad', lat >= 1.5);
      }
    }
    const gr = gradeAt(S.x - TRAIN_LEN / 2);
    setText(ui.unit, gr ? `km/h · ${gr.permil > 0 ? '↗' : '↘'} ${Math.abs(gr.permil)}‰` : 'km/h');

    // titik henti (stasiun atau corong muat)
    let stopTxt = '—', near = false, over = false;
    const tg = stopTarget();
    if (tg) {
      const d = tg.x - S.x;
      if (d < 700) {
        if (d >= 0) { stopTxt = `${fmtM(d)} m`; near = d < 60; }
        else { stopTxt = `+${fmtM(-d)} m`; over = true; }
      }
    } else if (S.phase === 'dwell' && S.dwell.step === 'couple' && S.cw) {
      const g = Math.max(0, coupleGap());
      stopTxt = `↤ ${fmtM(g)} m`; near = g < 3;
    } else if (S.phase === 'dwell') {
      const last = S.stops[S.stops.length - 1];
      if (last && S.st > 0) stopTxt = last.rating.r;
    }
    setText(ui.stopDist, stopTxt);
    setClass(ui.stopBox, 'near', near); setClass(ui.stopBox, 'over', over);

    // pemandu titik henti: muncul saat moncong mendekati marka atau corong
    const cplG = S.phase === 'dwell' && S.dwell.step === 'couple' && S.cw && S.cw.slide >= 1 ? Math.max(0, coupleGap()) : null;
    const pd = cplG !== null ? cplG : tg && !(S.loadT > 0) ? tg.x - S.x : null;
    const showP = pd !== null && (cplG !== null ? pd < 14 : pd < (tg.load ? 14 : 32) && pd > -12);
    ui.precise.hidden = !showP;
    // HUD ringkas: strip rute & titik henti hanya muncul saat ada yang perlu diperhatikan di depan
    {
      const dStop = tg ? tg.x - S.x : Infinity;
      const sigAhead = ROUTE.signals.some((q) => q.x > S.x && q.x - S.x < 650 && S.sig[q.id] !== 'G');
      const hazard = ROUTE.crossings.some((cr) => cr.x > S.x && cr.x - S.x < 450)
        || ROUTE.goats.some((g, i) => S.goats[i].state === 'idle' && g.x > S.x && g.x - S.x < 500)
        || (!!ROUTE.elephants && S.eleph.phase !== 'gone' && ROUTE.elephants.x - S.x < 700 && ROUTE.elephants.x > S.x - 20);
      const attention = S.phase !== 'run' || S.v < 0.5 || dStop < 800 || sigAhead || hazard || (nl && nl.from - S.x < 450) || kmh > lim + 2 || S.yellowLimit;
      const tutStrip = S.tut && S.tut.active !== null && TUTORIAL[MIS.id] && TUTORIAL[MIS.id][S.tut.active].target === '.strip-wrap';
      setClass(ui.hud, 'calm', !attention && !tutStrip);
      setClass(ui.hud, 'cab', viewMode === 'cab');
    }
    if (showP) {
      setText(ui.precTxt, pd >= 0 ? `${fmtM(pd)} m` : `+${fmtM(-pd)} m`);
      if (cplG !== null) setText(ui.precSub, `ke gerbong kopi · ${fmtM(S.v * 3.6)} km/h`);
      else setText(ui.precSub, tg.load ? (pd >= 0 ? `gerbong ${S.loadIdx + 1} ke corong` : 'melewati corong') : pd >= 0 ? (MIS.freight ? 'lagi ke marka bongkar' : `lagi ke marka "${markNum()}"`) : 'melewati marka');
      const scale = tg && tg.load ? 28 : 14;
      const px = 150 + clamp(-pd * scale, -140, 140);
      ui.precPtr.setAttribute('transform', `translate(${px.toFixed(1)},0)`);
    }

    // pintu
    const dw = S.phase === 'dwell' ? S.dwell.step : null;
    const cpl = S.phase === 'dwell' && S.dwell.step === 'couple';
    setText(ui.doorLbl, cpl ? 'Sambung' : S.doors === 'open' ? 'Tutup' : 'Buka');
    setClass(ui.btnDoor, 'attn', cpl && S.cw && S.cw.ready);
    setClass(ui.btnDoor, 'cue', dw === 'open' || dw === 'close');
    const hornCue = ROUTE.crossings.some((c, i) => S.x >= c.hornFrom && S.x < c.x && !S.horned[i])
      || ROUTE.goats.some((g, i) => S.goats[i].state === 'idle' && S.x >= g.hornFrom && S.x < g.x - 25);
    setClass(ui.btnHorn, 'cue', hornCue);
    if (ROUTE.rival) {
      const B = S.bus, lead = S.x - B.x;
      const txt = B.done ? 'sudah tiba' : !B.started ? 'bersiap' : `${lead >= 0 ? '+' : '−'}${Math.round(Math.abs(lead))} m`;
      setText(ui.rivalVal, txt + (B.held ? ' · tertahan' : B.dwell > 0 ? ' · terminal' : ''));
      setClass(ui.rivalPanel, 'ahead', B.started && !B.done && lead >= 0);
      setClass(ui.rivalPanel, 'behind', B.done || (B.started && lead < 0));
    }
    if (MIS.rain) {
      setText(ui.sandLbl, `Pasir · ${S.sand}`);
      setClass(ui.btnSand, 'cue', S.slip && S.sand > 0 && S.sandT <= 0);
      setClass(ui.btnSand, 'active', S.sandT > 0);
    }
  }

  // ---------- render dunia ----------
  // ---------- tikungan 2.5D: rel dan rangkaian melengkung menjauh dari kamera ----------
  // Setiap zona tikungan membelokkan arah rel sebesar BEND_TH. Posisi samping (b) tiap titik rel
  // dihitung relatif terhadap tengah rangkaian, lalu diproyeksikan menjadi geseran vertikal dan skala.
  const BEND_OFF = 300, BEND_TH = 50 * Math.PI / 180, BEND_D = 26, BEND_KV = 0.4;
  const REDUCE_MOTION = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let BEND = null, camRoll = 0, swayT = 0;
  const bendCv = document.createElement('canvas'), bctx = bendCv.getContext('2d');
  const sparks = [];
  function buildBend() {
    const zones = ROUTE.zones.filter((z) => z.curve);
    if (!zones.length) { BEND = null; return; }
    const end = Math.max(ROUTE.bufferStop || 0, ...ROUTE.stations.map((q) => q.x)) + 600;
    const n = Math.ceil(end + BEND_OFF);
    const Hh = new Float32Array(n + 1), Sx = new Float32Array(n + 1), Cx = new Float32Array(n + 1);
    const kap = (x) => {
      for (const z of zones) {
        if (x > z.from && x < z.to) {
          const Lz = z.to - z.from, e = Math.min(35, Lz * 0.3);
          return Math.min(1, (x - z.from) / e, (z.to - x) / e) * BEND_TH / (Lz - e);
        }
      }
      return 0;
    };
    for (let i = 0; i < n; i++) {
      Hh[i + 1] = Hh[i] + kap(i - BEND_OFF + 0.5);
      const hm = (Hh[i] + Hh[i + 1]) / 2;
      Sx[i + 1] = Sx[i] + Math.sin(hm); Cx[i + 1] = Cx[i] + Math.cos(hm);
    }
    BEND = { H: Hh, S: Sx, C: Cx, n };
  }
  const bAt = (arr, x) => { const f = clamp(x + BEND_OFF, 0, BEND.n - 1e-3), i = Math.floor(f); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
  function bendB(x, xr) {
    const hr = bAt(BEND.H, xr);
    return (bAt(BEND.S, x) - bAt(BEND.S, xr)) * Math.cos(hr) - (bAt(BEND.C, x) - bAt(BEND.C, xr)) * Math.sin(hr);
  }
  // proyeksi perspektif: kamera berjarak PD meter dari rel, tegak lurus arah rangkaian di tengahnya.
  // a = jarak sepanjang arah kamera, b = jarak menjauh dari kamera (negatif = mendekat)
  // BEND_3D: tikungan perspektif penuh (dimatikan sementara; masih dipertimbangkan)
  const BEND_3D = false;
  // BEND_25: lengkung rel 2.5D di tampilan samping (dimatikan; rel tampil lurus)
  const BEND_25 = false;
  const bendDy25 = (b, ppm) => -BEND_KV * BEND_D * Math.tanh(b / BEND_D) * ppm;
  const bendScale25 = (b) => 1 - 0.2 * Math.tanh(b / BEND_D);
  const PD = 40, PKV = 0.32;
  function bendPlan(x, xr) {
    const hr = bAt(BEND.H, xr), ch = Math.cos(hr), sh = Math.sin(hr);
    const dS = bAt(BEND.S, x) - bAt(BEND.S, xr), dC = bAt(BEND.C, x) - bAt(BEND.C, xr);
    return { a: dC * ch + dS * sh, b: dS * ch - dC * sh };
  }
  const projS = (b) => PD / (PD + Math.max(b, -0.35 * PD));
  const bendDy = (b, ppm) => { const bb = Math.max(b, -0.35 * PD); return -PKV * ppm * PD * bb / (PD + bb); };
  // gaya samping (m/s²): sekitar 0,9 tepat di batas kecepatan tikungan
  function latAccel(st) { const z = st && zoneAt(st.x); return z && z.curve ? 0.9 * Math.pow((st.v * 3.6) / z.limit, 2) : 0; }
  // lapisan dunia digambar lebih lebar dari layar (E piksel di kiri-kanan) supaya saat rel memendek
  // karena menjauh, isi dari luar layar ikut masuk dan tidak ada celah kosong di tepi
  // lapisan tikungan digambar dengan resolusi sedikit lebih rendah agar ringan di ponsel
  // kualitas turun otomatis bila frame di tikungan terlalu lambat (perangkat lemah)
  let bendLite = false, bendDtAvg = 16;
  const LDPR = () => Math.min(DPR, bendLite ? 0.8 : 1.25);
  function beginBend(V, E, ER) {
    const ld = LDPR(), w = Math.round((W + E + ER) * ld), h = Math.round(H * ld);
    if (bendCv.width !== w || bendCv.height !== h) { bendCv.width = w; bendCv.height = h; }
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, bendCv.width, bendCv.height);
    bctx.setTransform(ld, 0, 0, ld, 0, 0);
    const mid = E + W / 2; // tengah layar dalam koordinat lapisan
    return Object.assign({}, V, { c: bctx, bdy: () => 0, bx: null, X: (wx) => V.X(wx) + E, Xn: (sx) => mid + (sx - mid) * 1.75, wx0: V.wx0 - E / V.ppm, wx1: V.wx1 + ER / V.ppm });
  }
  function endBend(c, B, gy, ppm) {
    // per kolom: dipindah ke posisi proyeksinya (memendek saat menjauh), bagian atas (rel, kereta, objek)
    // diskalakan, bagian bawah (sawah di depan rel) diregangkan sampai tepi bawah agar tanah menyambung
    const yK = Math.min(H - 2, gy + 1.6 * ppm);
    const end = W + B.E + B.ER, fadeR = B.ER * 0.45, fadeL = B.E * 0.5;
    // bila rel yang menjauh tidak sampai tepi kanan layar, pudarkan menurut posisi di layar
    let maxD = -1e9; for (const q of B.cols) maxD = Math.max(maxD, q.dx + q.dw);
    const fadeD = maxD < W + 4 ? W * 0.22 : 0;
    for (const col of B.cols) {
      const { sx, w, dx, dw, dy, s } = col;
      if (dx + dw < -2 || dx > W + 2 || dw <= 0.05) continue;
      // ujung lapisan memudar ke kabut agar rel yang menjauh tidak terpotong tajam
      c.globalAlpha = clamp(Math.min((end - sx) / fadeR, (sx + w) / fadeL, fadeD ? (maxD - dx - dw / 2) / fadeD : 1), 0, 1);
      if (c.globalAlpha <= 0.01) continue;
      const dK = Math.min(H - 4, gy + (yK - gy) * s + dy);
      const top = dK - yK * s;
      const ld = LDPR();
      c.drawImage(bendCv, sx * ld, 0, w * ld, yK * ld, dx, top, dw + 0.6, yK * s);
      c.drawImage(bendCv, sx * ld, yK * ld, w * ld, (H - yK) * ld, dx, dK, dw + 0.6, H - dK);
    }
    c.globalAlpha = 1;
  }
  function drawSparks(V, dt, lat) {
    const { c, ppm, gy, X, st } = V;
    dt = dt || 0.016;
    if (S && st === S && S.mode === 'play' && lat > 1.0 && st.v > 3 && !REDUCE_MOTION) {
      const rate = (lat - 1.0) * 60 * dt;
      let n = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0);
      while (n-- > 0 && sparks.length < 120) sparks.push({ x: st.x - Math.random() * TRAIN_LEN, vx: -1 - Math.random() * 2.5, vh: 1 + Math.random() * 2.5, life: 0, max: 0.25 + Math.random() * 0.25 });
    }
    if (!sparks.length) return;
    c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const q = sparks[i]; q.life += dt;
      if (q.life >= q.max) { sparks.splice(i, 1); continue; }
      const t = q.life, a = 1 - t / q.max;
      const x = X(q.x + q.vx * t), y = gy - (0.35 + q.vh * t - 4.9 * t * t) * ppm;
      c.strokeStyle = `rgba(255,${180 + Math.floor(60 * a)},90,${a})`; c.lineWidth = Math.max(1, 0.07 * ppm);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.25 * ppm, y + 0.12 * ppm); c.stroke();
    }
    c.restore();
  }

  // ---------- tampilan kabin masinis (orang pertama) ----------
  // Rel di depan diproyeksikan dengan perspektif dari mata masinis. Tikungan memakai data lengkung yang sama
  // dengan tampilan samping (BEND), sehingga rel benar-benar berbelok ke kiri/kanan di depan kabin.
  const cabRain = Array.from({ length: 70 }, (_, i) => ({ x: hash(i * 1.7), y: hash(i * 2.9 + 1), r: 0.6 + hash(i + 4) * 1.4 }));
  function tickCrossings(st, dt) {
    ROUTE.crossings.forEach((cr, i) => {
      const A = crossState(i);
      const active = st.x > cr.x - 320 && st.x - TRAIN_LEN < cr.x + 6;
      A.gate += clamp((active ? 1 : 0) - A.gate, -dt * 0.7, dt * 0.7);
      if (!active && A.gate < 0.15 && st.x - TRAIN_LEN > cr.x) A.released = true;
      if (A.released) for (const v of A.veh) v.d += v.dir * dt * (v.kind === 'moto' ? 0.42 : 0.3);
    });
  }
  function drawCab(c, st, dtReal, lat) {
    const dt = Math.min(0.05, dtReal || 0.016);
    tickCrossings(st, dt);
    const x0 = st.x - 1.5, EH = 3.4;
    const storm = MIS.sky === 'storm', night = MIS.sky === 'night';
    const p = storm ? 0.6 : night ? 0.35 : clamp(st.clock / 1500, 0, 1);
    const T = ROUTE.tunnel, inTun = !!T && x0 > T.from && x0 < T.to;
    const f = W * 0.8;
    const bob = REDUCE_MOTION ? 0 : Math.sin(st.t * (2 + st.v * 0.45)) * Math.min(1.4, st.v * 0.08) + (st.shake > 0 ? (Math.random() - 0.5) * st.shake * 5 : 0);
    // masinis duduk di sisi kiri kabin (kereta di Indonesia berjalan di jalur kiri)
    const hy = H * 0.4 + bob, cx = W * 0.5, SEAT = 0.55;
    // posisi rel di depan: z = jarak ke depan, lat = geser ke kanan (m)
    const h0 = BEND ? bAt(BEND.H, x0) : 0, ch = Math.cos(h0), sh = Math.sin(h0);
    const S0 = BEND ? bAt(BEND.S, x0) : 0, C0 = BEND ? bAt(BEND.C, x0) : 0;
    const plan = (d) => {
      if (!BEND) return { z: d, lat: 0, hd: 0 };
      const x = x0 + d, dS = bAt(BEND.S, x) - S0, dC = bAt(BEND.C, x) - C0;
      return { z: dC * ch + dS * sh, lat: -(dS * ch - dC * sh), hd: bAt(BEND.H, x) - h0 };
    };
    const P = (z, lat, h) => { if (z < 0.8) return null; const k = f / z; return { x: cx + (lat + SEAT) * k, y: hy + (EH - h) * k, k }; };
    // titik dunia: jarak d sepanjang rel, geser samping o (kanan positif) tegak lurus rel, tinggi h
    const W3 = (d, o, h) => { const q = plan(d); return P(q.z + Math.sin(q.hd) * o, q.lat + Math.cos(q.hd) * o, h); };
    const quad = (a, b, d2, e, fill) => { if (!a || !b || !d2 || !e) return; c.fillStyle = fill; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d2.x, d2.y); c.lineTo(e.x, e.y); c.closePath(); c.fill(); };
    const FAR = inTun ? T.to - x0 + 2 : T && x0 < T.from && T.from - x0 < 520 ? T.from - x0 : 520;

    // ---- langit & bukit jauh (bergeser saat kereta berbelok) ----
    const Vs = { c, gy: hy, p, night, storm, camX: x0 * 0.2 + h0 * 400, ppm: 1 };
    if (!inTun) drawSky(Vs); else { c.fillStyle = '#07090b'; c.fillRect(0, 0, W, H); }
    const pan = h0 * f;
    if (!inTun) {
      const ridge = (amp, fq, col, par, ph) => {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, hy + 1);
        for (let x = 0; x <= W + 8; x += 8) { const u = x + pan * par; c.lineTo(x, hy - amp * (0.55 + 0.3 * Math.sin(u * fq + ph) + 0.15 * Math.sin(u * fq * 2.7 + ph * 2))); }
        c.lineTo(W, hy + 1); c.closePath(); c.fill();
      };
      ridge(H * 0.13, 0.004, night ? '#1b2040' : storm ? '#56626b' : mix('#6a6e9a', '#8fb0c4', p), 0.6, 1);
      ridge(H * 0.07, 0.009, night ? '#141a2c' : storm ? '#46525a' : mix('#4f6a62', '#6f9a7c', p), 0.9, 3);
      // tanah: sawah atau kebun sawit, garis pematang yang bergerak mendekat
      const sawit = MIS.land === 'sawit';
      const gg = c.createLinearGradient(0, hy, 0, H);
      gg.addColorStop(0, night ? '#18241a' : sawit ? mix('#4a5a32', '#62773f', p) : mix('#5f8a48', '#7cab52', p));
      gg.addColorStop(1, night ? '#0d140e' : sawit ? mix('#3a3022', '#4e3f2c', p) : mix('#2f5427', '#3f6d33', p));
      c.fillStyle = gg; c.fillRect(0, hy, W, H - hy);
      c.strokeStyle = night ? 'rgba(120,160,120,0.08)' : sawit ? 'rgba(120,90,60,0.18)' : 'rgba(150,200,110,0.22)';
      c.lineWidth = 1;
      const cell = 12;
      for (let wd = Math.ceil((x0 + 4) / cell) * cell; wd < x0 + Math.min(FAR, 300); wd += cell) {
        const q = P(wd - x0, 0, 0); if (!q) continue;
        c.beginPath(); c.moveTo(0, q.y); c.lineTo(W, q.y); c.stroke();
      }
      for (let k = -8; k <= 8; k++) { if (!k) continue; const a = P(400, k * 14, 0), b = P(3, k * 14, 0); if (a && b) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } }
      // jalan raya sejajar rel (misi dengan bus pesaing)
      if (ROUTE.rival) {
        for (let d = 2; d < Math.min(FAR, 400); d += 4) quad(W3(d, 10, 0), W3(d, 17, 0), W3(d + 4, 17, 0), W3(d + 4, 10, 0), '#3a3b3e');
      }
      // sungai di bawah jembatan
      const B = ROUTE.bridge;
      if (B && B.to > x0 && B.from - x0 < FAR) {
        const d0 = Math.max(2, B.from + 4 - x0), d1 = Math.min(FAR, B.to - 4 - x0);
        if (d1 > d0) quad(W3(d0, -200, -3), W3(d0, 200, -3), W3(d1, 200, -3), W3(d1, -200, -3), night ? '#232a55' : mix('#5f8ea2', '#86bdd0', p));
      }
      // jalan perlintasan melintang
      ROUTE.crossings.forEach((cr) => {
        const d = cr.x - x0; if (d < -4 || d > FAR) return;
        quad(W3(d - 3.5, -80, 0.02), W3(d - 3.5, 80, 0.02), W3(d + 3.5, 80, 0.02), W3(d + 3.5, -80, 0.02), mix('#4a4a4d', '#5a5a5e', p));
        quad(W3(d - 0.08, -80, 0.03), W3(d - 0.08, 80, 0.03), W3(d + 0.08, 80, 0.03), W3(d + 0.08, -80, 0.03), 'rgba(240,236,224,0.7)');
      });
    } else {
      // di dalam terowongan: dinding batu gelap diterangi lampu kereta
      c.fillStyle = '#0b0d10'; c.fillRect(0, 0, W, H);
    }

    // ---- badan rel: balas, bantalan, rel ----
    const steps = [];
    for (let d = 1.2; d < FAR; d += Math.max(0.6, d * 0.035)) steps.push(d);
    steps.push(FAR);
    const onB = (d) => ROUTE.bridge && x0 + d > ROUTE.bridge.from && x0 + d < ROUTE.bridge.to;
    for (let i = steps.length - 2; i >= 0; i--) {
      const a = steps[i], b = steps[i + 1];
      const deck = onB((a + b) / 2);
      const col = inTun ? '#24221f' : deck ? (night ? '#2a3038' : '#4a535a') : mix('#8d8275', '#a59a8c', p);
      quad(W3(a, -2.3, 0), W3(a, 2.3, 0), W3(b, 2.3, 0), W3(b, -2.3, 0), col);
    }
    // tekstur batu balas yang bergerak mendekat
    if (!inTun) {
      const tones = [mix('#6f665d', '#7c736a', p), mix('#a39889', '#b2a798', p), mix('#827869', '#8e8478', p)];
      for (const [lat, zz, sz, tn] of CAB_BAL) {
        const d = 1.5 + (((zz * 60 - x0) % 60) + 60) % 60;
        if (d > FAR || onB(d)) continue;
        const q = W3(d, lat * 2.2, 0.02); if (!q) continue;
        const r = Math.max(0.6, sz * 0.06 * q.k);
        c.fillStyle = tones[tn < 0.33 ? 0 : tn < 0.66 ? 1 : 2]; c.fillRect(q.x - r / 2, q.y - r / 2, r, r * 0.7);
      }
    }
    const slp = 0.65;
    for (let wd = Math.floor((x0 + 60) / slp) * slp; wd > x0 + 1.4; wd -= slp) {
      const d = wd - x0;
      const odd = Math.floor(wd / slp) % 7 === 0;
      quad(W3(d - 0.12, -1.2, 0.05), W3(d - 0.12, 1.2, 0.05), W3(d + 0.12, 1.2, 0.05), W3(d + 0.12, -1.2, 0.05), inTun ? '#3a3631' : odd ? mix('#7d776e', '#9a948a', p) : mix('#6f6a63', '#8b857b', p));
    }
    [-0.53, 0.53].forEach((o) => {
      for (let i = 0; i < steps.length - 1; i++) {
        const a = W3(steps[i], o - 0.035, 0.16), b = W3(steps[i + 1], o - 0.035, 0.16), a2 = W3(steps[i], o + 0.035, 0.16), b2 = W3(steps[i + 1], o + 0.035, 0.16);
        quad(a, b, b2, a2, inTun ? '#6d6a66' : '#9aa2a6');
        // kilap kepala rel
        if (!inTun && steps[i] < 160) { const m0 = W3(steps[i], o, 0.17), m1 = W3(steps[i + 1], o, 0.17); if (m0 && m1) { c.strokeStyle = night ? 'rgba(200,210,255,0.5)' : 'rgba(255,236,204,0.85)'; c.lineWidth = Math.max(0.6, 0.018 * m0.k); c.beginPath(); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke(); } }
      }
    });

    // jalur utama persilangan di kanan (sepur belok = jalur Si Gagah)
    const MTc = ROUTE.meet, MO = 10;
    if (MTc && !inTun) {
      const a0 = Math.max(1.2, MTc.entry - x0), b0 = Math.min(FAR, MTc.exit - x0);
      if (b0 > a0) {
        const oo = (d) => MO * meetK(x0 + d);
        for (let d = b0; d > a0; d -= 3) { const e = Math.max(a0, d - 3); quad(W3(e, oo(e) - 2.3, 0), W3(e, oo(e) + 2.3, 0), W3(d, oo(d) + 2.3, 0), W3(d, oo(d) - 2.3, 0), mix('#8d8275', '#a59a8c', p)); }
        for (let wd = Math.floor((x0 + Math.min(b0, 60)) / slp) * slp; wd > x0 + a0; wd -= slp) { const d = wd - x0, o = oo(d); quad(W3(d - 0.12, o - 1.2, 0.05), W3(d - 0.12, o + 1.2, 0.05), W3(d + 0.12, o + 1.2, 0.05), W3(d + 0.12, o - 1.2, 0.05), mix('#6f6a63', '#8b857b', p)); }
        [-0.53, 0.53].forEach((ro) => { for (let d = b0; d > a0; d -= 2) { const e = Math.max(a0, d - 2); quad(W3(e, oo(e) + ro - 0.035, 0.16), W3(d, oo(d) + ro - 0.035, 0.16), W3(d, oo(d) + ro + 0.035, 0.16), W3(e, oo(e) + ro + 0.035, 0.16), '#9aa2a6'); } });
      }
    }

    // ---- objek tepi rel, digambar dari jauh ke dekat ----
    const items = [];
    const add = (d, fn) => { if (d > 1 && d <= FAR + 1) items.push({ d, fn }); };
    if (!inTun) {
      const dMax = Math.min(FAR, 420);
      for (let wd = Math.ceil(x0 / 40) * 40; wd < x0 + dMax; wd += 40) add(wd - x0, () => {
        const d = wd - x0, b = W3(d, 3.6, 0), t = W3(d, 3.6, 7.2), arm = W3(d, 3.6, 6.8);
        if (!b || !t) return;
        c.strokeStyle = '#5b4a3a'; c.lineWidth = Math.max(1, 0.22 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
        c.lineWidth = Math.max(1, 0.12 * b.k); c.beginPath(); c.moveTo(arm.x - 0.9 * b.k, arm.y); c.lineTo(arm.x + 0.9 * b.k, arm.y); c.stroke();
      });
      const sawit = MIS.land === 'sawit';
      for (let i = Math.ceil(x0 / 9); i * 9 < x0 + dMax; i++) {
        const side = hash(i * 1.3) < 0.5 ? -1 : 1, o = side * (8 + hash(i * 2.1) * 26), ht = 5 + hash(i * 3.7) * 6;
        const wd = i * 9 + hash(i) * 5;
        if (nearStation(wd) && side < 0 && Math.abs(o) < 22) continue;
        if (onB(wd - x0)) continue;
        add(wd - x0, () => {
          const d = wd - x0, b = W3(d, o, 0), t = W3(d, o, ht); if (!b || !t) return;
          const palm = sawit || hash(i * 5.3) < 0.35;
          c.strokeStyle = night ? '#1c1712' : '#5a4430'; c.lineWidth = Math.max(1, 0.3 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
          const r = (palm ? 2.4 : ht * 0.32) * b.k;
          c.fillStyle = night ? '#16261a' : palm ? mix('#3d6a34', '#4f8a40', p) : (hash(i * 7.7) < 0.5 ? mix('#2f5f36', '#3f7a4a', p) : mix('#3a6a3c', '#4c8a50', p));
          if (palm) {
            c.strokeStyle = c.fillStyle; c.lineWidth = Math.max(1, 0.28 * b.k); c.lineCap = 'round';
            for (let k = 0; k < 7; k++) { const a = Math.PI + k * (Math.PI / 6); c.beginPath(); c.moveTo(t.x, t.y); c.quadraticCurveTo(t.x + Math.cos(a) * r * 0.7, t.y - r * 0.5, t.x + Math.cos(a) * r, t.y + r * 0.35); c.stroke(); }
            c.lineCap = 'butt';
          } else { c.beginPath(); c.arc(t.x, t.y + r * 0.5, r, 0, 7); c.arc(t.x - r * 0.6, t.y + r, r * 0.7, 0, 7); c.arc(t.x + r * 0.6, t.y + r, r * 0.7, 0, 7); c.fill(); }
        });
      }
    }
    // patok hektometer di kiri rel tiap 100 m (angka km di atas, hektometer di bawah)
    if (!inTun) for (let wd = Math.ceil(x0 / 100) * 100; wd < x0 + Math.min(FAR, 320); wd += 100) {
      const d = wd - x0; if (d < 2 || onB(d)) continue;
      add(d, () => {
        const b = W3(d, -2.6, 0), t = W3(d, -2.6, 0.9); if (!b || !t) return;
        const w = Math.max(2, 0.22 * b.k);
        c.fillStyle = '#f4f1e8'; c.fillRect(b.x - w / 2, t.y, w, b.y - t.y);
        if (b.k > 14) {
          c.fillStyle = '#1b1b1b'; c.textAlign = 'center'; c.font = `800 ${Math.round(0.16 * b.k)}px "Big Shoulders Display", sans-serif`;
          c.fillText(String(Math.floor(wd / 1000)), b.x, t.y + 0.3 * b.k); c.fillText(String(Math.floor((wd % 1000) / 100)), b.x, t.y + 0.6 * b.k);
          c.textAlign = 'start';
        }
      });
    }
    // papan semboyan 35 (perintah membunyikan klakson) sebelum perlintasan
    ROUTE.crossings.forEach((cr) => {
      const d = cr.hornFrom + 40 - x0; if (d < 2 || d > FAR) return;
      add(d, () => {
        const b = W3(d, -2.8, 0), t = W3(d, -2.8, 2.6); if (!b || !t) return;
        c.strokeStyle = '#3a3a3a'; c.lineWidth = Math.max(1, 0.1 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
        const w = 0.9 * b.k, h = 0.6 * b.k;
        c.fillStyle = '#f4f1e8'; c.fillRect(t.x - w / 2, t.y - h, w, h);
        c.strokeStyle = '#1b1b1b'; c.lineWidth = Math.max(1, 0.06 * b.k); c.strokeRect(t.x - w / 2, t.y - h, w, h);
        if (h > 7) { c.fillStyle = '#1b1b1b'; c.textAlign = 'center'; c.font = `900 ${Math.round(h * 0.75)}px "Big Shoulders Display", sans-serif`; c.fillText('35', t.x, t.y - h * 0.2); c.textAlign = 'start'; }
      });
    });
    // sinyal di kiri rel
    for (const sig of ROUTE.signals) {
      const d = sig.x - x0; if (d < 2 || d > FAR) continue;
      add(d, () => {
        const b = W3(d, -2.8, 0), t = W3(d, -2.8, 5.6); if (!b || !t) return;
        if (sig.sema) { const sp = W3(d, -2.8, 7.2); if (sp) semaphoreHead(c, sp.x, sp.y + 7.2 * b.k, b.k, st.sig ? st.sig[sig.id] : 'R', sig.id); return; }
        c.strokeStyle = '#3a3a3a'; c.lineWidth = Math.max(1, 0.18 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
        const w = 0.7 * b.k, hh = 2.0 * b.k;
        c.fillStyle = '#1b1d1f'; roundRect(c, t.x - w / 2, t.y - hh, w, hh, w * 0.3); c.fill();
        const asp = st.sig ? st.sig[sig.id] : 'R';
        [['R', '#ff4b3a'], ['Y', '#ffc42b'], ['G', '#3bff8a']].forEach(([a, col], k) => {
          const on = asp === a, ly = t.y - hh + (k + 0.5) * (hh / 3);
          c.fillStyle = on ? col : 'rgba(80,80,80,0.6)'; c.beginPath(); c.arc(t.x, ly, w * 0.3, 0, 7); c.fill();
          if (on) { const gl = c.createRadialGradient(t.x, ly, 0, t.x, ly, w * 2.2); gl.addColorStop(0, col + 'aa'); gl.addColorStop(1, col + '00'); c.fillStyle = gl; c.beginPath(); c.arc(t.x, ly, w * 2.2, 0, 7); c.fill(); }
        });
      });
    }
    // stasiun: peron & bangunan di kiri, peron penumpang di kanan
    allStations().forEach((s) => {
      const pass = (ROUTE.passStations || []).includes(s);
      const a = s.x + PLAT_FROM - x0, b = s.x + PLAT_TO - x0;
      if (b < 1 || a > FAR) return;
      const da = Math.max(1.2, a), db = Math.min(FAR, b);
      add(db, () => {
        // peron kiri (tinggi 1 m): muka atas dan sisi yang menghadap rel
        const seg = (o0, o1, col, colSide) => {
          for (let d = db; d > da; d -= 6) {
            const e = Math.max(da, d - 6);
            quad(W3(e, o0, 1), W3(e, o1, 1), W3(d, o1, 1), W3(d, o0, 1), col);
            const edge = Math.abs(o0) < Math.abs(o1) ? o0 : o1;
            quad(W3(e, edge, 0), W3(d, edge, 0), W3(d, edge, 1), W3(e, edge, 1), colSide);
          }
          const ln = Math.sign(o0) * (Math.min(Math.abs(o0), Math.abs(o1)) + 0.25);
          for (let d = db; d > da; d -= 6) { const e = Math.max(da, d - 6); quad(W3(e, ln - 0.1, 1.01), W3(e, ln + 0.1, 1.01), W3(d, ln + 0.1, 1.01), W3(d, ln - 0.1, 1.01), '#e8c33a'); }
        };
        seg(-2.1, -8, mix('#b9b2a2', '#cfc8b8', p), '#8d8679');
        if (!pass && !MIS.freight) seg(2.1, 7, mix('#c4bdad', '#ddd6c6', p), '#9d968a');
      });
      // bangunan stasiun & kanopi
      const bd = s.x - 48 - x0;
      add(bd + 12, () => {
        const q = (d1, d2, o1, o2, h1, h2, col) => quad(W3(d1, o1, h1), W3(d2, o2, h1), W3(d2, o2, h2), W3(d1, o1, h2), col);
        q(bd - 12, bd + 12, -12, -12, 1, 6, mix('#d9cfb9', '#efe6d2', p));
        q(bd + 12, bd + 12, -12, -20, 1, 6, mix('#c4bba6', '#ddd3bd', p));
        q(bd - 13, bd + 13, -11, -11, 6, 8.4, '#8f4330');
        for (let k = 0; k < 5; k++) q(bd - 10 + k * 4.6, bd - 8.2 + k * 4.6, -11.95, -11.95, 1.2, 4.2, '#3d4a4f');
      });
      // papan nama stasiun
      add(s.x + 13 - x0, () => {
        const d = s.x + 13 - x0, l = W3(d, -5.5, 3.2), r = W3(d, -1.4, 3.2), lb = W3(d, -5.5, 2.2), pl = W3(d, -5.2, 0), pr = W3(d, -1.7, 0);
        if (!l || !r || !lb) return;
        c.strokeStyle = '#3a3a3a'; c.lineWidth = Math.max(1, 0.1 * l.k);
        if (pl && pr) { c.beginPath(); c.moveTo(pl.x, pl.y); c.lineTo(pl.x, lb.y); c.moveTo(pr.x, pr.y); c.lineTo(pr.x, lb.y); c.stroke(); }
        c.fillStyle = '#fbfaf5'; c.fillRect(l.x, l.y, r.x - l.x, lb.y - l.y);
        c.strokeStyle = '#1d2a2b'; c.strokeRect(l.x, l.y, r.x - l.x, lb.y - l.y);
        if (l.k > 4) {
          c.fillStyle = '#1d2a2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.font = `800 ${Math.round(0.5 * l.k)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
          c.fillText(s.name, (l.x + r.x) / 2, l.y + (lb.y - l.y) * 0.42);
          c.font = `700 ${Math.round(0.28 * l.k)}px "Plus Jakarta Sans", system-ui, sans-serif`;
          c.fillText(s.elev, (l.x + r.x) / 2, l.y + (lb.y - l.y) * 0.8);
          c.textAlign = 'start'; c.textBaseline = 'alphabetic';
        }
      });
      // marka henti
      if (!pass) add(s.x - x0, () => {
        const d = s.x - x0, b = W3(d, -2.4, 1), t = W3(d, -2.4, 2.8); if (!b || !t) return;
        c.strokeStyle = '#333'; c.lineWidth = Math.max(1, 0.12 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
        const sz = 0.9 * b.k; c.fillStyle = '#f2c230'; c.fillRect(t.x - sz / 2, t.y - sz, sz, sz);
        if (sz > 8) { c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${Math.round(sz * 0.8)}px "Big Shoulders Display", sans-serif`; c.fillText(MIS.freight ? 'B' : String(markNum()), t.x, t.y - sz / 2); c.textAlign = 'start'; c.textBaseline = 'alphabetic'; }
      });
      // calon penumpang di peron kanan
      const si = ROUTE.stations.indexOf(s), cr = si >= 0 ? crowds.get(si) : null;
      if (cr) {
        cr.people.concat([cr.ppka]).forEach((pp) => {
          if (pp.state === 'in' || pp.state === 'step' || pp.state === 'out') return;
          const d = pp.x - x0; if (d < 2) return;
          const o = 2.4 + pp.z * 4.2;
          add(d, () => { const q = W3(d, o, 1); if (q && q.k > 1.2) paxDraw(c, q.x, q.y, q.k * 1.1, pp, cr.paddle); });
        });
      }
    });
    // perlintasan: palang & lampu di kedua sisi, kendaraan menunggu
    ROUTE.crossings.forEach((cr, i) => {
      const d = cr.x - x0; if (d < 1 || d > FAR) return;
      const A = crossState(i), active = st.x > cr.x - 320 && st.x - TRAIN_LEN < cr.x + 6;
      const blink = Math.floor(performance.now() / 450) % 2 === 0;
      [[-1, d - 4.5], [1, d + 4.5]].forEach(([side, dd]) => add(dd, () => {
        const o = side * 4.2, b = W3(dd, o, 0), t = W3(dd, o, 3.2); if (!b || !t) return;
        c.strokeStyle = '#ddd'; c.lineWidth = Math.max(1, 0.15 * b.k); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(t.x, t.y); c.stroke();
        const r = Math.max(1.5, 0.2 * b.k);
        [[-0.35, blink], [0.35, !blink]].forEach(([dx, on]) => { const q = W3(dd, o + dx, 2.6); if (!q) return; c.fillStyle = active && on ? '#ff3b2e' : '#4a1a16'; c.beginPath(); c.arc(q.x, q.y, r, 0, 7); c.fill(); });
        // palang: turun melintang jalan (sejajar rel), naik tegak
        const ang = lerp(Math.PI / 2 * 0.95, 0, A.gate), L = 6.5;
        const pv = W3(dd, o, 1.1);
        if (pv) {
          const end = W3(dd + side * Math.cos(ang) * L * -1, o, 1.1 + Math.sin(ang) * L);
          if (end) { c.strokeStyle = '#f4f1e8'; c.lineWidth = Math.max(1.5, 0.16 * b.k); c.setLineDash([Math.max(2, 0.5 * b.k), Math.max(2, 0.5 * b.k)]); c.beginPath(); c.moveTo(pv.x, pv.y); c.lineTo(end.x, end.y); c.stroke(); c.strokeStyle = '#d62b20'; c.lineDashOffset = Math.max(2, 0.5 * b.k); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
        }
      }));
      if (A.gate > 0.5) [[-14, '#2e86ab'], [16, '#c0392b']].forEach(([o, col]) => add(d + (o < 0 ? -1 : 1) * 5.5, () => {
        const dd = d + (o < 0 ? -1 : 1) * 5.5, b0 = W3(dd - 1, o, 0), b1 = W3(dd + 1, o, 1.5); if (!b0 || !b1) return;
        c.fillStyle = col; roundRect(c, Math.min(b0.x, b1.x) - 1.1 * b0.k, b1.y, 2.2 * b0.k, b0.y - b1.y, 0.3 * b0.k); c.fill();
        c.fillStyle = 'rgba(30,40,50,0.8)'; c.fillRect(Math.min(b0.x, b1.x) - 0.8 * b0.k, b1.y + 0.15 * b0.k, 1.6 * b0.k, 0.45 * b0.k);
      }));
    });
    // jembatan busur: lengkung kiri-kanan, batang gantung, pagar
    const Br = ROUTE.bridge;
    if (Br && Br.wood && Br.to > x0 && Br.from - x0 < FAR) {
      for (let wx = Br.to; wx >= Br.from; wx -= 3) {
        const d = wx - x0; if (d < 1.5 || d > FAR) continue;
        add(d, () => [-2.4, 2.4].forEach((o) => {
          const a = W3(d, o, 0), t = W3(d, o, 1.1), b = W3(d - 3, o, 1.1); if (!a || !t || !b) return;
          c.strokeStyle = '#6b4e32'; c.lineWidth = Math.max(1, 0.16 * a.k); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(t.x, t.y); c.lineTo(b.x, b.y); c.stroke();
        }));
      }
    } else if (Br && Br.to > x0 && Br.from - x0 < FAR) {
      const Lb = Br.to - Br.from, arcH = (x) => 13 * Math.sin(Math.PI * clamp((x - Br.from) / Lb, 0, 1));
      for (let wx = Br.to; wx >= Br.from; wx -= 4) {
        const d = wx - x0; if (d < 1.5 || d > FAR) continue;
        add(d, () => {
          [-3.8, 3.8].forEach((o) => {
            const a = W3(d, o, arcH(wx) + 1), b = W3(d - 4, o, arcH(wx - 4) + 1);
            if (a && b) { c.strokeStyle = '#d7dcdb'; c.lineWidth = Math.max(1.5, 0.7 * a.k); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); }
            if (Math.round(wx) % 8 === 0) { const g0 = W3(d, o, 1.2); if (a && g0) { c.strokeStyle = 'rgba(210,215,215,0.8)'; c.lineWidth = Math.max(1, 0.08 * a.k); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(g0.x, g0.y); c.stroke(); } }
            const r0 = W3(d, o * 0.82, 1.1), r1 = W3(d - 4, o * 0.82, 1.1);
            if (r0 && r1) { c.strokeStyle = TOS_COL; c.lineWidth = Math.max(1, 0.12 * r0.k); c.beginPath(); c.moveTo(r0.x, r0.y); c.lineTo(r1.x, r1.y); c.stroke(); }
          });
        });
      }
    }
    // gajah & kambing di jalur
    const E = ROUTE.elephants;
    if (E && st.eleph && st.eleph.phase !== 'gone') {
      const el = st.eleph, prog = el.phase === 'cross' ? el.prog : 0;
      [[0, 1], [6.5, 1.08], [3.5, 0.6]].forEach(([off, sc]) => {
        const d = E.x + off - x0; if (d < 2 || d > FAR) return;
        const o = el.phase === 'idle' ? -9 - off * 0.3 : lerp(-7, 10, prog) - off * 0.2;
        add(d, () => {
          const b = W3(d, o, 0); if (!b) return;
          const s2 = b.k * sc, step = el.phase === 'cross' ? Math.sin(performance.now() / 220 + off) * 0.1 * s2 : 0;
          c.save(); c.globalAlpha = prog > 0.85 ? (1 - prog) / 0.15 : 1;
          c.fillStyle = night ? '#3c3d46' : '#7c7a7e';
          [-1.1, -0.4, 0.4, 1.1].forEach((dx, k) => c.fillRect(b.x + dx * s2 - 0.22 * s2, b.y - 1.4 * s2 + (k % 2 ? step : -step), 0.44 * s2, 1.4 * s2));
          c.beginPath(); c.ellipse(b.x, b.y - 2.2 * s2, 1.7 * s2, 1.2 * s2, 0, 0, 7); c.fill();
          c.beginPath(); c.arc(b.x + 1.5 * s2, b.y - 2.6 * s2, 0.8 * s2, 0, 7); c.fill();
          c.fillStyle = night ? '#33343c' : '#6a686c'; c.beginPath(); c.ellipse(b.x + 1.1 * s2, b.y - 2.6 * s2, 0.55 * s2, 0.75 * s2, 0, 0, 7); c.fill();
          c.strokeStyle = night ? '#3c3d46' : '#7c7a7e'; c.lineWidth = 0.28 * s2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(b.x + 2.0 * s2, b.y - 2.4 * s2); c.quadraticCurveTo(b.x + 2.4 * s2, b.y - 1.2 * s2, b.x + 2.1 * s2, b.y - 0.6 * s2); c.stroke(); c.lineCap = 'butt';
          c.restore();
        });
      });
    }
    ROUTE.goats.forEach((g, i) => {
      const gs = st.goats ? st.goats[i] : null; if (gs && gs.state === 'gone') return;
      const t = gs && gs.state === 'flee' ? gs.t : 0, d = g.x - x0; if (d < 2 || d > FAR) return;
      [0, 1.4].forEach((o2, k) => add(d + k, () => {
        const b = W3(d + k, t * 2.5 + o2 - 0.5, 0); if (!b) return;
        const s2 = b.k; c.save(); c.globalAlpha = clamp(1 - t / 2.2, 0, 1);
        c.fillStyle = k ? '#d9cfbd' : '#ece6da'; c.beginPath(); c.ellipse(b.x, b.y - 0.6 * s2, 0.45 * s2, 0.3 * s2, 0, 0, 7); c.fill();
        c.fillRect(b.x - 0.3 * s2, b.y - 0.4 * s2, 0.08 * s2, 0.4 * s2); c.fillRect(b.x + 0.22 * s2, b.y - 0.4 * s2, 0.08 * s2, 0.4 * s2);
        c.beginPath(); c.arc(b.x + 0.4 * s2, b.y - 0.85 * s2, 0.18 * s2, 0, 7); c.fill();
        c.restore();
      }));
    });
    // silo muat batu bara melintang di atas rel, penahan ujung rel, bus pesaing
    if (ROUTE.loading) {
      const d = ROUTE.loading.silo - x0;
      if (d > 2 && d < FAR) add(d, () => {
        const q = (o1, o2, h1, h2, col) => quad(W3(d, o1, h1), W3(d, o2, h1), W3(d, o2, h2), W3(d, o1, h2), col);
        q(-3.6, -3.0, 0, 9, '#5a5f63'); q(3.0, 3.6, 0, 9, '#5a5f63'); q(-4.5, 4.5, 9, 16, '#8c8f8f'); q(-1, 1, 7.2, 9, '#3b3e41');
      });
    }
    if (ROUTE.bufferStop) {
      const d = ROUTE.bufferStop - x0;
      if (d > 1 && d < FAR) add(d, () => { const a = W3(d, -1, 0), b = W3(d, 1, 1.4); if (a && b) { c.fillStyle = '#c23b2e'; c.fillRect(a.x, b.y, b.x - a.x, a.y - b.y); c.fillStyle = '#f1e9d6'; c.fillRect(a.x, b.y + (a.y - b.y) * 0.3, b.x - a.x, (a.y - b.y) * 0.2); } });
    }
    if (ROUTE.rival && st.bus) {
      const d = st.bus.x - x0;
      if (d > 2 && d < Math.min(FAR, 400)) add(d, () => {
        const a = W3(d - 12, 13.5, 0), b = W3(d, 13.5, 3.2); if (!a || !b) return;
        const w = 2.5 * a.k; c.fillStyle = '#d8312a'; roundRect(c, a.x - w / 2, b.y, w, a.y - b.y, 0.3 * a.k); c.fill();
        c.fillStyle = '#1c2a35'; c.fillRect(a.x - w * 0.4, b.y + (a.y - b.y) * 0.15, w * 0.8, (a.y - b.y) * 0.3);
      });
    }
    // tikungan: papan peringatan di kiri, chevron di sisi luar (kanan)
    ROUTE.zones.forEach((z) => {
      if (!z.curve) return;
      const dw = z.from - 120 - x0;
      if (dw > 2 && dw < FAR) add(dw, () => { const b = W3(dw, -2.8, 0); if (b) curveWarn(c, b.x, b.y, b.k, z.limit); });
      for (let m = z.from + 6; m < z.to; m += 14) { const d = m - x0; if (d < 2 || d > FAR) continue; add(d, () => { const b = W3(d, 3.6, 0); if (b) chevronBoard(c, b.x, b.y, b.k); }); }
    });
    // landmark di kiri rel, jauh di samping
    (ROUTE.landmarks || []).forEach((lm) => {
      const d0 = LANDMARKS[lm.id]; if (!d0 || d0.far || lm.card) return;
      const d = lm.x - x0; if (d < 8 || d > FAR) return;
      add(d + 30, () => { const b = W3(d, -42, 0); if (!b) return; drawLandmark(c, d0.kind, b.x, b.y, b.k, { t: performance.now() / 1000, night, storm, tone: (col) => col }); });
    });
    // patok bebas batas & KA 112 yang datang dari depan di jalur utama
    if (MTc) {
      const df = MTc.foul - x0;
      if (df > 1.5 && df < FAR) add(df, () => { for (let i = 0; i < 4; i++) { const q0 = W3(df, 4.8, i * 0.25), q1 = W3(df, 5.0, (i + 1) * 0.25); if (q0 && q1) { c.fillStyle = i % 2 ? '#f4f1e8' : '#d62b20'; c.fillRect(q0.x, q1.y, Math.max(1, q1.x - q0.x), q0.y - q1.y); } } });
      const mt = st.meet;
      if (mt && mt.phase === 'run') {
        let f = mt.x;
        [16].concat(Array(MTc.cars).fill(19.5)).forEach((len, k) => {
          const dn = f - x0, dr = f + len - x0;
          f += len + 1;
          if (dr < 1.5 || dn > FAR) return;
          const da = Math.max(1.5, dn), oa = MO * meetK(x0 + da), ob = MO * meetK(x0 + dr);
          add(da, () => {
            // sisi kiri rangkaian (menghadap Si Gagah)
            quad(W3(da, oa - 1.45, 1.1), W3(dr, ob - 1.45, 1.1), W3(dr, ob - 1.45, 4.0), W3(da, oa - 1.45, 4.0), '#d9dfe3');
            quad(W3(da, oa - 1.45, 1.55), W3(dr, ob - 1.45, 1.55), W3(dr, ob - 1.45, 1.95), W3(da, oa - 1.45, 1.95), '#1f4e8c');
            quad(W3(da, oa - 1.45, 0.4), W3(dr, ob - 1.45, 0.4), W3(dr, ob - 1.45, 1.1), W3(da, oa - 1.45, 1.1), '#24292d');
            if (k > 0) for (let w = 0; w < 8; w++) { const d1 = dn + 2 + w * 2.2; if (d1 < da || d1 + 1.4 > dr) continue; quad(W3(d1, oa - 1.46, 2.4), W3(d1 + 1.4, oa - 1.46, 2.4), W3(d1 + 1.4, oa - 1.46, 3.3), W3(d1, oa - 1.46, 3.3), night || storm ? '#f2d58c' : '#22313b'); }
            if (k === 0 && dn > 1.5) {
              // muka lokomotif: kaca, lampu sorot menyilaukan
              quad(W3(dn, oa - 1.45, 0.5), W3(dn, oa + 1.45, 0.5), W3(dn, oa + 1.45, 4.0), W3(dn, oa - 1.45, 4.0), '#e4e9ec');
              quad(W3(dn, oa - 1.3, 2.8), W3(dn, oa + 1.3, 2.8), W3(dn, oa + 1.3, 3.7), W3(dn, oa - 1.3, 3.7), '#1b2833');
              quad(W3(dn, oa - 1.45, 1.55), W3(dn, oa + 1.45, 1.55), W3(dn, oa + 1.45, 1.95), W3(dn, oa - 1.45, 1.95), '#1f4e8c');
              [-0.8, 0.8].forEach((lo) => { const hp = W3(dn, oa + lo, 2.3); if (!hp) return; const r = Math.max(2, 0.25 * hp.k); const g = c.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, r * 9); g.addColorStop(0, 'rgba(255,245,210,0.95)'); g.addColorStop(1, 'rgba(255,245,210,0)'); c.fillStyle = g; c.beginPath(); c.arc(hp.x, hp.y, r * 9, 0, 7); c.fill(); });
            }
          });
        });
      }
    }
    // pohon tumbang melintang rel & tim jalan rel
    const TRc = st.tree;
    if (TRc && !(TRc.phase === 'clear')) {
      const d = TRc.x - x0, cut = TRc.phase === 'work' && TRc.t > 13;
      if (d > 1.5 && d < FAR && !cut) add(d, () => {
        const bk = night ? '#2c2318' : '#4a3622';
        quad(W3(d - 0.3, -6, 0.2), W3(d + 1.2, 6, 0.3), W3(d + 1.2, 6, 1.0), W3(d - 0.3, -6, 0.9), bk);
        [[-7, 1.6, 1.8], [7.5, 2.0, 2.6], [5, 2.6, 2.0], [9.5, 1.2, 2.0], [2.8, 1.4, 1.4]].forEach(([o, h, r]) => { const q = W3(d + 1, o, h); if (!q) return; c.fillStyle = storm ? '#2c4f2e' : '#2f5a2f'; c.beginPath(); c.arc(q.x, q.y, r * q.k, 0, 7); c.fill(); });
        if (TRc.phase === 'work') [-2.6, 1.8, 3.4].forEach((o, i) => { const b = W3(d - 1.5 - i * 0.6, o, 0), h = W3(d - 1.5 - i * 0.6, o, 1.75); if (!b || !h) return; c.fillStyle = '#f08a24'; c.fillRect(b.x - 0.25 * b.k, h.y + 0.3 * b.k, 0.5 * b.k, b.y - h.y - 0.3 * b.k); c.fillStyle = '#f2c230'; c.beginPath(); c.arc(b.x, h.y + 0.15 * b.k, 0.22 * b.k, 0, 7); c.fill(); });
      });
    }
    // genangan menutupi rel
    const FLc = ROUTE.flood;
    if (FLc && !inTun) {
      const fa = Math.max(1.3, FLc.from - x0), fb = Math.min(FAR, FLc.to - x0);
      if (fb > fa) add(fb, () => {
        for (let d = fb; d > fa; d -= 4) { const e = Math.max(fa, d - 4); quad(W3(e, -8, 0.25), W3(e, 8, 0.25), W3(d, 8, 0.25), W3(d, -8, 0.25), night ? 'rgba(60,72,96,0.9)' : 'rgba(118,142,150,0.9)'); }
        c.strokeStyle = 'rgba(235,245,250,0.4)'; c.lineWidth = 1;
        for (let i = 0; i < 10; i++) { const d = fa + ((i * 7.3 + st.t * 3) % Math.max(1, fb - fa)), o = -5 + (i * 3.7) % 10; const q0 = W3(d, o, 0.26), q1 = W3(d, o + 1.2, 0.26); if (q0 && q1) { c.beginPath(); c.moveTo(q0.x, q0.y); c.lineTo(q1.x, q1.y); c.stroke(); } }
      });
    }
    items.sort((a, b) => b.d - a.d).forEach((it) => it.fn());
    // cipratan air di depan kaca saat menerjang genangan
    if (FLc && st.x > FLc.from && st.x < FLc.to + 4 && st.v > 0.3) {
      c.fillStyle = 'rgba(235,245,250,0.55)';
      for (let i = 0; i < 18; i++) { const sx = W * (0.15 + Math.random() * 0.7), sy = H * (0.5 + Math.random() * 0.18); c.beginPath(); c.arc(sx, sy, 1 + Math.random() * (2 + st.v), 0, 7); c.fill(); }
    }

    // ---- mulut terowongan ----
    if (T) {
      const portal = (d, outside) => {
        if (d < 1 || d > 540) return;
        const hole = [];
        for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; const q = W3(d, Math.cos(a) * 3.4, 4.6 + Math.sin(a) * 2.2); if (q) hole.push(q); }
        const bl = W3(d, -3.4, 0), br = W3(d, 3.4, 0);
        if (!bl || !br || hole.length < 3) return;
        if (outside) {
          const m = (o, h) => W3(d, o, h);
          const pts = [m(-60, 0), m(-40, 14), m(-14, 22), m(0, 24), m(16, 21), m(42, 12), m(60, 0)].filter(Boolean);
          c.fillStyle = night ? '#18241a' : mix('#3f5f37', '#4f7a43', p);
          c.beginPath(); pts.forEach((q, k) => (k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath(); c.fill();
          const fr = [m(-5, 0), m(-5, 8), m(5, 8), m(5, 0)].filter(Boolean);
          c.fillStyle = '#8a8378'; c.beginPath(); fr.forEach((q, k) => (k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath(); c.fill();
          c.fillStyle = '#050607'; c.beginPath(); c.moveTo(br.x, br.y); hole.forEach((q) => c.lineTo(q.x, q.y)); c.lineTo(bl.x, bl.y); c.closePath(); c.fill();
          const nm = m(0, 7.2);
          if (nm && nm.k > 5) { c.fillStyle = '#f2ead6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${Math.round(0.7 * nm.k)}px "Big Shoulders Display", sans-serif`; c.fillText(T.name, nm.x, nm.y); c.textAlign = 'start'; c.textBaseline = 'alphabetic'; }
        } else {
          // dari dalam: hanya lubang keluar yang terang
          const lg = c.createLinearGradient(0, hole[8].y, 0, br.y); lg.addColorStop(0, '#e9f0ea'); lg.addColorStop(1, '#a9c09a');
          c.fillStyle = lg; c.beginPath(); c.moveTo(br.x, br.y); hole.forEach((q) => c.lineTo(q.x, q.y)); c.lineTo(bl.x, bl.y); c.closePath(); c.fill();
        }
      };
      if (!inTun) portal(T.from - x0, true); else {
        portal(T.to - x0, false);
        // lampu dinding terowongan
        for (let wd = Math.ceil(x0 / 30) * 30; wd < T.to; wd += 30) { const d = wd - x0; if (d < 8) continue; [-3.2, 3.2].forEach((o) => { const q = W3(d, o, 3.8); if (q) { c.fillStyle = 'rgba(255,190,110,0.9)'; c.beginPath(); c.arc(q.x, q.y, Math.max(1.2, 0.18 * q.k), 0, 7); c.fill(); } }); }
      }
    }

    // ---- cuaca & cahaya ----
    const fog = fogAt(x0 + 60);
    if (fog > 0.02 && !inTun) {
      const fg = c.createLinearGradient(0, hy - H * 0.2, 0, H);
      fg.addColorStop(0, `rgba(222,228,230,${0.95 * fog})`); fg.addColorStop(0.35, `rgba(222,228,230,${0.85 * fog})`); fg.addColorStop(1, `rgba(222,228,230,${0.25 * fog})`);
      c.fillStyle = fg; c.fillRect(0, 0, W, H);
    }
    if (night || inTun || storm) {
      if (night && !inTun) { c.fillStyle = 'rgba(8,12,38,0.45)'; c.fillRect(0, 0, W, H); }
      if (storm && !inTun) { c.fillStyle = 'rgba(30,38,46,0.18)'; c.fillRect(0, 0, W, H); }
      // sorot lampu kereta di rel depan
      c.save(); c.globalCompositeOperation = 'lighter';
      const near = W3(4, 0, 0), far = W3(Math.min(FAR, 80), 0, 0);
      if (near && far) {
        const lg = c.createLinearGradient(0, near.y, 0, far.y);
        lg.addColorStop(0, `rgba(255,232,170,${inTun ? 0.28 : 0.22})`); lg.addColorStop(1, 'rgba(255,232,170,0)');
        c.fillStyle = lg; c.beginPath(); c.moveTo(near.x - 3.5 * near.k, near.y); c.lineTo(near.x + 3.5 * near.k, near.y); c.lineTo(far.x + 4 * far.k, far.y); c.lineTo(far.x - 4 * far.k, far.y); c.closePath(); c.fill();
      }
      c.restore();
    }

    applyGrade(c, { gy: hy + EH * f / 40, ppm: f / 40, tf: inTun ? 1 : 0 });
    // ---- kabin: kaca depan, pilar, dasbor ----
    const rain = MIS.rain && !inTun;
    if (rain) {
      // tetes hujan di kaca, disapu wiper
      const wp = (performance.now() / 1600) % 1, wa = Math.sin(wp * Math.PI * 2) * 0.5 + 0.5;
      c.fillStyle = 'rgba(220,232,240,0.35)';
      cabRain.forEach((r, k) => {
        const age = ((performance.now() / 1000 + k * 0.37) % 1.6) / 1.6;
        const x = r.x * W, y = r.y * H * 0.75;
        const wiperX = lerp(W * 0.08, W * 0.46, wa) + (x > W / 2 ? W * 0.46 : 0);
        if (Math.abs(x - wiperX) < W * 0.05) return;
        c.globalAlpha = 0.4 + age * 0.5; c.beginPath(); c.arc(x, y, r.r * (1 + age), 0, 7); c.fill();
      });
      c.globalAlpha = 1;
      c.strokeStyle = '#141619'; c.lineWidth = Math.max(2, W * 0.004); c.lineCap = 'round';
      [[W * 0.27, H * 0.67], [W * 0.73, H * 0.67]].forEach(([px, py]) => {
        const a = -Math.PI * (0.12 + wa * 0.76);
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * H * 0.42, py + Math.sin(a) * H * 0.42); c.stroke();
      });
      c.lineCap = 'butt';
    }
    const frame = night ? '#0c0f13' : '#1a2026';
    c.fillStyle = frame;
    c.fillRect(0, 0, W, H * 0.055);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.045, 0); c.lineTo(W * 0.02, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(W, 0); c.lineTo(W * 0.955, 0); c.lineTo(W * 0.98, H); c.lineTo(W, H); c.closePath(); c.fill();
    c.fillRect(W * 0.665, 0, W * 0.009, H * 0.66); // pilar tengah kaca depan (di kanan masinis)
    // pelindung matahari & pantulan kaca
    c.fillStyle = 'rgba(20,26,32,0.55)'; c.fillRect(W * 0.08, H * 0.055, W * 0.32, H * 0.05); c.fillRect(W * 0.6, H * 0.055, W * 0.32, H * 0.05);
    c.fillStyle = 'rgba(255,255,255,0.035)'; c.beginPath(); c.moveTo(W * 0.1, H * 0.06); c.lineTo(W * 0.2, H * 0.06); c.lineTo(W * 0.08, H * 0.7); c.lineTo(W * 0.04, H * 0.7); c.closePath(); c.fill();
    // dasbor
    const dy0 = H * 0.66; // dasbor dinaikkan agar instrumennya tidak tertutup tombol & strip HUD bawah
    const dg = c.createLinearGradient(0, dy0, 0, H);
    dg.addColorStop(0, night ? '#1d232a' : '#2e363e'); dg.addColorStop(1, night ? '#0b0e12' : '#151a1f');
    c.fillStyle = dg; c.beginPath(); c.moveTo(0, dy0 + H * 0.03); c.quadraticCurveTo(W * 0.5, dy0 - H * 0.03, W, dy0 + H * 0.03); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, dy0 + H * 0.01, W, 1.5);
    // pengukur tekanan udara (pipa utama & silinder rem) di tengah dasbor
    const gauge = (gx, val, label) => {
      const r = Math.min(W, H) * 0.042, gy2 = dy0 + H * 0.066;
      c.fillStyle = '#e9e5da'; c.beginPath(); c.arc(gx, gy2, r, 0, 7); c.fill();
      c.strokeStyle = '#2a2f33'; c.lineWidth = 2; c.stroke();
      const a = Math.PI * (0.75 + 1.5 * clamp(val, 0, 1));
      c.strokeStyle = '#c0392b'; c.lineWidth = Math.max(1.5, r * 0.08); c.beginPath(); c.moveTo(gx, gy2); c.lineTo(gx + Math.cos(a) * r * 0.8, gy2 + Math.sin(a) * r * 0.8); c.stroke();
      c.fillStyle = '#2a2f33'; c.font = `700 ${Math.max(7, Math.round(r * 0.32))}px "Plus Jakarta Sans", sans-serif`; c.textAlign = 'center'; c.fillText(label, gx, gy2 + r * 0.55); c.textAlign = 'start';
    };
    // panel instrumen: speedometer jarum dengan papan batas kecepatan (menggantikan speedometer HUD di kabin)
    c.fillStyle = 'rgba(32,39,46,0.95)'; roundRect(c, W * 0.12, dy0 + H * 0.01, W * 0.62, H * 0.115, H * 0.03); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; c.stroke();
    {
      const kmh = st.v * 3.6, { lim } = currentLimit(), nl = nextLimitAhead();
      const r = Math.min(W, H) * 0.052, gx = W * 0.2, gy2 = dy0 + H * 0.066;
      c.fillStyle = '#efeadf'; c.beginPath(); c.arc(gx, gy2, r, 0, 7); c.fill(); c.strokeStyle = '#3a4046'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#2a2f33'; c.lineWidth = 1;
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.75 + 1.5 * i / 12); c.beginPath(); c.moveTo(gx + Math.cos(a) * r * 0.76, gy2 + Math.sin(a) * r * 0.76); c.lineTo(gx + Math.cos(a) * r * 0.92, gy2 + Math.sin(a) * r * 0.92); c.stroke(); }
      const la = Math.PI * (0.75 + 1.5 * clamp(lim / 120, 0, 1));
      c.strokeStyle = '#e5483b'; c.lineWidth = 3; c.beginPath(); c.arc(gx, gy2, r * 0.86, la - 0.04, la + 0.04); c.stroke();
      const a = Math.PI * (0.75 + 1.5 * clamp(kmh / 120, 0, 1));
      c.strokeStyle = kmh > lim + 2 ? '#e5483b' : '#c0392b'; c.lineWidth = Math.max(2, r * 0.07); c.beginPath(); c.moveTo(gx, gy2); c.lineTo(gx + Math.cos(a) * r * 0.82, gy2 + Math.sin(a) * r * 0.82); c.stroke();
      c.fillStyle = '#2a2f33'; c.beginPath(); c.arc(gx, gy2, r * 0.08, 0, 7); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `900 ${Math.round(r * 0.36)}px "Big Shoulders Display", sans-serif`; c.fillText(String(Math.round(kmh)), gx, gy2 + r * 0.45);
      const lr = r * 0.32, lx = gx + r * 1.35, ly = gy2 - r * 0.35;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(lx, ly, lr, 0, 7); c.fill(); c.strokeStyle = '#e5483b'; c.lineWidth = lr * 0.22; c.stroke();
      c.fillStyle = '#111'; c.font = `900 ${Math.round(lr * 0.95)}px "Big Shoulders Display", sans-serif`; c.fillText(String(lim), lx, ly);
      if (nl) { c.fillStyle = '#ffd98a'; c.font = `700 ${Math.max(8, Math.round(r * 0.22))}px "Plus Jakarta Sans", sans-serif`; c.fillText(`${nl.limit} · ${Math.round(nl.from - st.x)} m`, lx, ly + lr * 2.1); }
      c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    }
    // tuas notch (pengendali utama) dan tuas rem ikut bergerak
    {
      const bx = W * 0.68, top = dy0 + H * 0.015, hgt = H * 0.1, n = st.notch;
      c.fillStyle = '#11161b'; roundRect(c, bx - W * 0.018, top, W * 0.036, hgt, 6); c.fill();
      for (let i = -5; i <= 4; i++) { const y = top + hgt * (1 - (i + 5) / 9.5) - 2; c.fillStyle = i === n ? '#f2a516' : i > 0 ? 'rgba(246,207,122,0.4)' : 'rgba(246,163,154,0.35)'; c.fillRect(bx - W * 0.012, y, W * 0.008, 1.5); }
      const hy2 = top + hgt * (1 - (n + 5) / 9.5) - 2;
      c.fillStyle = '#c9cfd2'; c.fillRect(bx - 2, hy2 - hgt * 0.22, 4, hgt * 0.22);
      c.fillStyle = n < 0 ? '#e0614f' : '#e2ac45'; roundRect(c, bx - W * 0.014, hy2 - hgt * 0.3, W * 0.028, hgt * 0.1, 4); c.fill();
      const ra = n < 0 ? -0.35 - Math.min(5, -n) * 0.12 : -0.2;
      c.save(); c.translate(W * 0.725, dy0 + H * 0.115); c.rotate(ra);
      c.fillStyle = '#8a1d14'; roundRect(c, -3, -hgt * 0.75, 6, hgt * 0.75, 3); c.fill();
      c.fillStyle = '#d8392b'; c.beginPath(); c.arc(0, -hgt * 0.78, Math.max(4, hgt * 0.1), 0, 7); c.fill();
      c.restore();
    }
    const brk = clamp(-(st.aCmd || 0) / 1.2, 0, 1);
    gauge(W * 0.44, 0.7 - brk * 0.3, 'BP'); gauge(W * 0.56, brk, 'BC');
    const lamp = (lx, on, col) => { c.fillStyle = on ? col : 'rgba(120,120,120,0.35)'; c.beginPath(); c.arc(lx, dy0 + H * 0.035, Math.max(2, H * 0.008), 0, 7); c.fill(); };
    lamp(W * 0.36, st.doors === 'open', '#f2c94c'); lamp(W * 0.38, st.notch > 0, '#5fd08a'); lamp(W * 0.6, st.notch < 0, '#f2c94c'); lamp(W * 0.62, !!st.slip, '#ef5b4c');
  }
  const TOS_COL = '#1f8f86';
  const CAB_BAL = Array.from({ length: 700 }, (_, i) => [hash(i * 1.3) * 2 - 1, hash(i * 2.7), 0.4 + hash(i * 3.9) * 0.8, hash(i + 9)]);

  // kamera mendekat ke pintu & peron selama penumpang naik/turun (setelah berhenti Good/Perfect)
  function stationZoom(st) {
    if (REDUCE_MOTION || !S || st !== S || S.phase !== 'dwell' || MIS.freight || viewMode === 'cab') return false;
    const step = S.dwell.step;
    if (!(step === 'open' || step === 'board' || step === 'alight' || step === 'close' || step === 'end')) return false;
    const last = S.stops[S.stops.length - 1], here = ROUTE.stations[S.st];
    return !!last && !!here && last.name === here.name && okRating(last);
  }
  function render(dtReal) {
    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const st = S || idleState;
    // zoom-out lembut saat ada satwa di jalur di depan
    const E0 = ROUTE.elephants, st0 = S || idleState;
    const TR0 = st0.tree, treeNear = TR0 && (TR0.phase === 'warn' || TR0.phase === 'work') && TR0.x - st0.x < 260;
    const stZoom = stationZoom(st0);
    const wantZoom = (E0 && st0.eleph && (st0.eleph.phase === 'block' || st0.eleph.phase === 'cross') && E0.x - st0.x < 260) || treeNear ? 0.7 : stZoom ? 1.45 : 1;
    camZoom += (wantZoom - camZoom) * Math.min(1, (dtReal || 0.016) * 1.2);
    const ppm = clamp(H / 44, 3.4, 13) * camZoom;
    const gy = Math.round(H * 0.64);
    const shake = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 7 : 0;
    const anchor = mode === 'play' || mode === 'pause' ? 0.6 : 0.78;
    // kamera melirik ke depan saat ada satwa di jalur, supaya pemain bisa melihatnya
    let lead = 0;
    const E = ROUTE.elephants;
    if (E && st.eleph && (st.eleph.phase === 'block' || st.eleph.phase === 'cross') && E.x - st.x < 200) {
      const base = st.x - (W * anchor) / ppm;
      lead = clamp(E.x + 16 - (base + (W * 0.84) / ppm), 0, (W * (anchor - 0.06)) / ppm);
    }
    // menyambung gerbong: kamera melihat ujung belakang rangkaian
    if (S && st === S && S.phase === 'dwell' && S.dwell.step === 'couple') lead = -TRAIN_LEN + (W * (anchor - 0.62)) / ppm;
    // zoom stasiun: titik fokus ke tengah rangkaian & peron
    if (stZoom) lead = -TRAIN_LEN * 0.42 + (W * (anchor - 0.5)) / ppm;
    if (treeNear && TR0.x - st.x < 200) {
      const base = st.x - (W * anchor) / ppm;
      lead = clamp(TR0.x + 14 - (base + (W * 0.84) / ppm), 0, (W * (anchor - 0.06)) / ppm);
    }
    camLead += (lead - camLead) * Math.min(1, (dtReal || 0.016) * 1.4);
    const camX = st.x - (W * anchor) / ppm + camLead;
    const X = (wx) => (wx - camX) * ppm + shake;
    const wx0 = camX - 30, wx1 = camX + W / ppm + 30;
    const storm = MIS.sky === 'storm', night = MIS.sky === 'night';
    const p = storm ? 0.6 : night ? 0.35 : clamp(st.clock / 1500, 0, 1); // fajar -> pagi
    const T = ROUTE.tunnel;
    const xc = st.x - 12; // posisi kabin
    const tf = T ? smooth(T.from, T.from + 25, xc) * (1 - smooth(T.to, T.to + 25, xc)) : 0;
    const V = { c, ppm, gy, camX, X, wx0, wx1, p, st, storm, night, tf, lit: storm || night || tf > 0.2 };
    // cahaya tepi (rim light), pantulan kaca, lampu kabin per suasana
    if (night) Object.assign(V, { rim: '#9fb4ff', rimA: 0.5, refl: 0.05, cabA: 0.9, haze: '#4b3d6b', hazeA: 0.3, water: '#3a3f74' });
    else if (storm) Object.assign(V, { rim: '#d5dde4', rimA: 0.3, refl: 0.14, cabA: 0.6, haze: '#8b97a1', hazeA: 0.45, water: '#a3aeb7' });
    else Object.assign(V, { rim: '#ffb67c', rimA: 0.85 * (1 - p * 0.55), refl: 0.28, cabA: 0.12, haze: '#fbd291', hazeA: 0.38 * (1 - p * 0.5), water: '#f7cb9c' });
    V.sunShadow = night ? 0 : storm ? 0.25 : 1 - p * 0.35;
    V.Xn = (sx) => W * 0.5 + (sx - W * 0.5) * 1.75; // proyeksi lapisan latar depan (lebih dekat ke kamera)
    if (tf > 0.2) { V.rimA = 0; V.sunShadow = 0; }

    // tikungan: lengkung rel di layar per kolom
    let bendCols = null;
    V.bdy = () => 0; V.bx = X; V.pan = 0;
    if (BEND && BEND_25 && !BEND_3D) {
      // tikungan 2.5D: tiap kolom layar hanya digeser naik/turun dan diskalakan (tanpa pemendekan)
      const xr = st.x - TRAIN_LEN / 2, step = Math.max(3, W / 260), cols = [];
      let mx = 0;
      for (let sx = 0; sx < W; sx += step) {
        const b = bendB(camX + (sx + step / 2 - shake) / ppm, xr), dy = bendDy25(b, ppm);
        cols.push({ sx, w: step, dx: sx, dw: step, dy, s: bendScale25(b), b });
        mx = Math.max(mx, Math.abs(dy));
      }
      if (mx > 0.6) { bendCols = { cols, E: 0, ER: 0 }; V.bdy = (wx) => bendDy25(bendB(wx, xr), ppm); }
    } else if (BEND && BEND_3D) {
      const xr = st.x - TRAIN_LEN / 2, Xr = X(xr);
      V.pan = bAt(BEND.H, xr) * ppm * PD; // latar jauh bergeser saat kamera ikut berputar
      // ke depan rel memendek paling banyak, jadi lapisan diperluas lebih jauh ke kanan
      const E = Math.round(W * 0.2), ER = Math.round(W * 0.6), step = Math.max(5, W / (bendLite ? 90 : 140)), cols = [];
      bendDtAvg += ((dtReal || 0.016) * 1000 - bendDtAvg) * 0.05;
      if (!bendLite && bendDtAvg > 45) bendLite = true;
      const proj = (wx) => { const q = bendPlan(wx, xr), sc = projS(q.b); return { x: Xr + q.a * ppm * sc, b: q.b, s: sc }; };
      let mx = 0;
      for (let lx = 0; lx < W + E + ER; lx += step) {
        const wa = camX + (lx - E - shake) / ppm, wb = wa + step / ppm;
        const p0 = proj(wa), p1 = proj(wb), b = (p0.b + p1.b) / 2;
        const dy = bendDy(b, ppm);
        cols.push({ sx: lx, w: step, dx: p0.x, dw: p1.x - p0.x, dy, s: projS(b), b });
        if (lx > E && lx < W + E) mx = Math.max(mx, Math.abs(dy), Math.abs(p0.x - X(wa)));
      }
      if (mx > 0.6) {
        cols.sort((p, q) => q.b - p.b); // yang jauh digambar dulu
        bendCols = { cols, E, ER };
        V.bdy = (wx) => bendDy(bendPlan(wx, xr).b, ppm);
        V.bx = (wx) => proj(wx).x;
      }
    }
    // kamera miring dan bergoyang mengikuti gaya samping di tikungan
    const lat = latAccel(st);
    const rollT = REDUCE_MOTION || st !== S ? 0 : clamp(lat * 1.1, 0, 2.2);
    camRoll += (rollT - camRoll) * Math.min(1, (dtReal || 0.016) * 1.5);
    swayT += dtReal || 0.016;
    if (camRoll > 0.02) {
      const r = camRoll * Math.PI / 180, k = 1 + r * (W / H) + 0.01;
      const sway = REDUCE_MOTION ? 0 : (Math.sin(swayT * 7.3) * 0.6 + Math.sin(swayT * 12.7) * 0.3) * Math.min(lat, 2) * 1.2;
      c.translate(W / 2 + sway, H / 2); c.rotate(-r); c.scale(k, k); c.translate(-W / 2, -H / 2);
    }

    if (viewMode === 'cab' && S && st === S && !(S.phase === 'dwell' && S.dwell.step === 'couple')) { drawCab(c, st, dtReal, lat); return; }
    // momen Perfect: kamera mendekat sebentar ke marka henti
    const mo = st.moment;
    if (mo && st === S) {
      mo.t += dtReal || 0.016;
      if (mo.kind === 'perfect' && !REDUCE_MOTION && mo.t < 2.6) {
        const z = 1 + 0.16 * (mo.t < 0.6 ? ease01(mo.t / 0.6) : mo.t < 1.9 ? 1 : 1 - ease01((mo.t - 1.9) / 0.7));
        const zx = X(mo.x), zy = gy - 2 * ppm;
        c.translate(zx, zy); c.scale(z, z); c.translate(-zx, -zy);
      }
    }
    clapNow = !!(mo && st === S && mo.kind === 'perfect' && mo.t < 2.8);
    drawSky(V);
    drawLandmarks(V, true);
    drawRidges(V);
    drawFarLand(V);
    drawLandmarks(V);
    drawPort(V);
    drawBackProps(V);
    drawTunnelHill(V);
    // lapisan tanah, rel & kereta: saat di tikungan digambar ke kanvas terpisah lalu dilengkungkan.
    // Tanah ikut melar di bawah rel sehingga rel tetap menapak di tanah, tidak melayang.
    if (bendCols) drawGround(V, 'field'); // alas sawah di belakang lapisan yang dilengkungkan
    const LV = bendCols ? beginBend(V, bendCols.E, bendCols.ER) : V;
    const W0 = W;
    if (bendCols) W = W0 + bendCols.E + bendCols.ER;
    drawGround(LV);
    drawTunnelInterior(LV);
    drawStations(LV);
    drawSwitch(LV);
    drawMeetTrack(LV);
    drawFlood(LV, 'back');
    drawTrackside(LV);
    drawBoards35(LV);
    drawCrossings(LV, 'back', dtReal);
    drawGoats(LV);
    drawTree(LV);
    drawSilo(LV, 'back');
    drawElephants(LV, 'back');
    drawBridge(LV, 'back');
    drawTrain(LV);
    drawCoffeeWagon(LV);
    drawPlatformFront(LV, dtReal);
    drawFlood(LV, 'front');
    drawOppTrain(LV);
    drawChevrons(LV);
    drawSparks(LV, dtReal, lat);
    drawSilo(LV, 'front');
    drawCrossings(LV, 'front', dtReal);
    drawElephants(LV, 'front');
    drawBus(LV);
    W = W0;
    if (bendCols) endBend(c, bendCols, gy, ppm);
    drawBridge(V, 'front');
    drawTunnelPortals(V);
    drawFrontProps(V);
    drawFog(V);
    drawWeather(V);
    drawNight(V);
    drawSmoke(V);
    drawTunnelDark(V);
    applyGrade(c, V);
    drawMoments(c, V, dtReal);
  }
  // gradasi warna khas misi di atas seluruh dunia (tidak mengenai HUD), plus kabut lembap Sumatra
  function applyGrade(c, V) {
    const P = MIS.pal; if (!P) return;
    if (P.mist && !V.tf) {
      const top = V.gy - 9 * V.ppm, bot = V.gy + 2 * V.ppm;
      const mg = c.createLinearGradient(0, top, 0, bot);
      mg.addColorStop(0, 'rgba(240,236,220,0)'); mg.addColorStop(0.55, 'rgba(240,236,220,0.32)'); mg.addColorStop(1, 'rgba(240,236,220,0)');
      c.fillStyle = mg; c.fillRect(-W, top, W * 3, bot - top);
    }
    if (P.grade) {
      c.save(); c.globalCompositeOperation = 'soft-light';
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.grade[0]); g.addColorStop(1, P.grade[1]);
      c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3); c.restore();
    }
  }

  // ---------- reaksi momen penting: cap hasil, kilau, koin terbang, peringatan merah ----------
  let clapNow = false;
  const ease01 = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  function drawMoments(c, V, dtReal) {
    const st = V.st; if (st !== S) return;
    const dt = Math.min(0.05, dtReal || 0.016);
    const mo = st.moment;
    if (mo && mo.t < 3.2) {
      const mx = V.bx(mo.x), my = V.gy - 3.2 * V.ppm + V.bdy(mo.x);
      // kilau di marka (Perfect & Good)
      if ((mo.kind === 'perfect' || mo.kind === 'good') && mo.t < 1.1) {
        const n = mo.kind === 'perfect' ? 22 : 10;
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const a = i * 2.39, r = (20 + hash(i) * 50) * ease01(mo.t / 0.9), al = 1 - mo.t / 1.1;
          const x = mx + Math.cos(a) * r, y = my + Math.sin(a) * r * 0.7, k = 3 + hash(i + 3) * 3;
          c.fillStyle = `rgba(255,226,140,${al})`; c.beginPath(); c.moveTo(x, y - k); c.lineTo(x + k * 0.3, y - k * 0.3); c.lineTo(x + k, y); c.lineTo(x + k * 0.3, y + k * 0.3); c.lineTo(x, y + k); c.lineTo(x - k * 0.3, y + k * 0.3); c.lineTo(x - k, y); c.lineTo(x - k * 0.3, y - k * 0.3); c.closePath(); c.fill();
        }
        c.restore();
      }
    }
    // dari sini dalam koordinat layar (tanpa zoom/miring kamera)
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const al = st.alarm;
    if (al) {
      al.t += dt;
      if (al.t > 3) st.alarm = null;
      else {
        const pulse = (1 - al.t / 3) * (0.6 + 0.4 * Math.sin(al.t * 12));
        const vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
        vg.addColorStop(0, 'rgba(220,40,30,0)'); vg.addColorStop(1, `rgba(220,40,30,${0.5 * pulse})`);
        c.fillStyle = vg; c.fillRect(0, 0, W, H);
        stamp(c, al.title, al.sub, al.t, 0.5, true);
      }
    }
    if (mo && mo.t < 3.2) {
      const scale = mo.kind === 'perfect' ? 1 : mo.kind === 'good' ? 0.78 : 0.62;
      if (!al) stamp(c, mo.label.toUpperCase(), mo.sub, mo.t, scale, mo.kind === 'miss');
      // koin terbang dari marka ke penghitung koin di HUD
      const nCoin = mo.kind === 'perfect' ? 14 : mo.kind === 'good' ? 8 : mo.kind === 'ok' ? 4 : 0;
      if (nCoin) {
        const cr = cv.getBoundingClientRect(), tr = ui.coins && !ui.coins.closest('[hidden]') ? ui.coins.getBoundingClientRect() : null;
        const tx = tr && tr.width ? tr.left - cr.left + tr.width / 2 : 40, ty = tr && tr.width ? tr.top - cr.top + tr.height / 2 : 24;
        const sx = V.bx(mo.x), sy = V.gy - 3.2 * V.ppm + V.bdy(mo.x);
        for (let i = 0; i < nCoin; i++) {
          const t = mo.t - 0.35 - i * 0.05; if (t < 0 || t > 0.85) continue;
          const u = ease01(t / 0.8), x = lerp(sx + Math.cos(i) * 14, tx, u), y = lerp(sy + Math.sin(i * 1.7) * 8, ty, u) - Math.sin(u * Math.PI) * 60;
          c.fillStyle = '#f2c230'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
          c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(x - 1.2, y - 1.2, 2, 0, 7); c.fill();
        }
      }
    }
  }
  function stamp(c, title, sub, t, scale, red) {
    const inT = ease01(t / 0.35), out = t > 2.4 ? clamp((t - 2.4) / 0.5, 0, 1) : 0;
    if (out >= 1) return;
    const fs = Math.round(clamp(H * 0.15, 34, 72));
    c.save(); c.globalAlpha = 1 - out;
    c.translate(W / 2, H * 0.36); c.rotate(-0.06);
    const k = lerp(1.7, 1, inT) * scale; c.scale(k, k);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `900 ${fs}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
    const w = c.measureText(title).width + fs * 0.6, hh = fs * 1.3;
    c.fillStyle = red ? 'rgba(80,10,8,0.55)' : 'rgba(20,14,4,0.45)'; c.fillRect(-w / 2, -hh / 2, w, hh);
    c.strokeStyle = red ? '#ef5b4c' : '#f2c230'; c.lineWidth = Math.max(3, fs * 0.07); c.strokeRect(-w / 2, -hh / 2, w, hh);
    c.fillStyle = red ? '#ff7a6c' : '#ffd25a'; c.fillText(title, 0, -fs * 0.12);
    c.font = `700 ${Math.round(fs * 0.24)}px "Plus Jakarta Sans", system-ui, sans-serif`; c.fillStyle = '#f7f3e8';
    c.fillText(sub, 0, fs * 0.42);
    c.restore();
  }

  // ---------- malam takbiran ----------
  function drawNight(V) {
    if (!V.night) return;
    const { c, ppm, gy, X, st } = V;
    c.fillStyle = MIS.dark ? 'rgba(4,6,20,0.7)' : 'rgba(8,12,38,0.5)'; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    // lampu peron dan lampu sinyal
    const lamp = (x, y, r, col) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    };
    for (const s of allStations()) {
      if (X(s.x + 30) < -40 || X(s.x - 100) > W + 40) continue;
      for (let k = 0; k <= 5; k++) lamp(V.bx(s.x - 80 + k * 11.5), gy - 4.9 * ppm + V.bdy(s.x - 80 + k * 11.5), 5 * ppm, 'rgba(255,214,140,0.35)');
    }
    for (const sig of ROUTE.signals) {
      if (sig.x < V.wx0 || sig.x > V.wx1) continue;
      const asp = st.sig ? st.sig[sig.id] : 'R';
      const i = asp === 'R' ? 0 : asp === 'Y' ? 1 : 2;
      lamp(V.bx(sig.x) - (sig.sema ? 0.45 * ppm : 0), sig.sema ? gy - 6.6 * ppm : gy - 6.2 * ppm - 2.1 * ppm + i * 0.9 * ppm + V.bdy(sig.x), 2.4 * ppm, asp === 'R' ? 'rgba(255,75,58,0.6)' : asp === 'Y' ? 'rgba(255,196,43,0.6)' : 'rgba(59,255,138,0.55)');
    }
    // sorot lampu depan lokomotif
    const lx = V.bx(st.x + 0.3), ly = gy - trainH(3.9) * ppm + V.bdy(st.x);
    const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 30 * ppm);
    lg.addColorStop(0, MIS.dark ? 'rgba(255,232,160,0.6)' : 'rgba(255,232,160,0.4)'); lg.addColorStop(1, 'rgba(255,232,160,0)');
    c.fillStyle = lg;
    c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 30 * ppm, ly - 7 * ppm); c.lineTo(lx + 30 * ppm, ly + 5 * ppm); c.closePath(); c.fill();
    // kembang api (hanya di langit, di belakang bukit)
    c.save(); c.beginPath(); c.rect(0, 0, W, gy * 0.72); c.clip();
    for (const f of weather.fw) {
      const a = clamp(1 - f.t / f.life, 0, 1);
      for (const q of f.parts) {
        const px = f.x + q.vx * f.t, py = f.y + q.vy * f.t + 40 * f.t * f.t;
        c.fillStyle = `hsla(${f.hue + q.dh},95%,65%,${a})`;
        c.fillRect(px - 1.5, py - 1.5, 3, 3);
      }
      if (f.t < 0.15) lamp(f.x, f.y, 60, `hsla(${f.hue},90%,70%,0.35)`);
    }
    c.restore();
    c.restore();
    drawWindowGlow(V, 0.8);
  }
  const allStations = () => ROUTE.stations.concat(ROUTE.passStations || []);

  function drawBus(V) {
    const R = ROUTE.rival;
    if (!R) return;
    const { c, ppm, gy, X } = V;
    const B = S ? S.bus : { x: -30, v: 0 };
    const k = 1.08, fx = X(B.x), L = 12 * ppm * k, Hh = 3.1 * ppm * k;
    if (fx < -20 || fx - L > W + 20) return;
    const base = gy + 7.4 * ppm;
    // bodi
    c.fillStyle = '#f2efe8';
    c.beginPath(); c.roundRect ? c.roundRect(fx - L, base - Hh, L, Hh - 0.35 * ppm, 0.5 * ppm) : c.rect(fx - L, base - Hh, L, Hh - 0.35 * ppm); c.fill();
    c.fillStyle = '#d6452f'; c.fillRect(fx - L, base - 1.25 * ppm, L, 0.45 * ppm);
    c.fillStyle = '#f29a1f'; c.fillRect(fx - L, base - 0.8 * ppm, L, 0.25 * ppm);
    // jendela menyala
    for (let i = 0; i < 6; i++) {
      c.fillStyle = V.night ? '#ffd889' : '#2b3a44';
      c.fillRect(fx - L + (0.6 + i * 1.75) * ppm, base - Hh + 0.45 * ppm, 1.45 * ppm, 1.0 * ppm);
    }
    c.fillStyle = '#2b3a44'; c.fillRect(fx - 1.3 * ppm, base - Hh + 0.35 * ppm, 1.1 * ppm, 1.6 * ppm);
    c.fillStyle = '#d6452f'; c.font = `900 italic ${Math.round(0.75 * ppm)}px "Big Shoulders Display", sans-serif`;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(`TRANSKILAT · ${R.name.toUpperCase()}`, fx - L + 0.6 * ppm, base - 1.65 * ppm);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    // roda
    [2.2, 9.6].forEach((d) => wheel(c, fx - d * ppm * k, base - 0.3 * ppm, 0.55 * ppm, B.x / 0.55, '#202224'));
    // lampu depan
    if (V.night) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(fx, base - 0.9 * ppm, 0, fx, base - 0.9 * ppm, 16 * ppm);
      g.addColorStop(0, 'rgba(255,240,200,0.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(fx, base - 0.9 * ppm); c.lineTo(fx + 16 * ppm, base - 3 * ppm); c.lineTo(fx + 16 * ppm, base + 1.5 * ppm); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = '#ffeab0'; c.fillRect(fx - 0.25 * ppm, base - 1.1 * ppm, 0.3 * ppm, 0.35 * ppm);
    c.fillStyle = '#ff5a4a'; c.fillRect(fx - L, base - 1.1 * ppm, 0.25 * ppm, 0.35 * ppm);
  }

  // ---------- cuaca: hujan & petir ----------
  const weather = { drops: [], flash: 0, nextFlash: 7, fw: [], nextFw: 1 };
  function updateWeather(dt, v) {
    for (const f of weather.fw) f.t += dt;
    weather.fw = weather.fw.filter((f) => f.t < f.life);
    if (MIS.sky === 'night' && MIS.lebaran) {
      weather.nextFw -= dt;
      if (weather.nextFw <= 0) {
        weather.nextFw = 0.7 + Math.random() * 2.2;
        const n = 34 + Math.floor(Math.random() * 20), sp = 60 + Math.random() * 60;
        const parts = [];
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const r = sp * (0.7 + Math.random() * 0.3); parts.push({ vx: Math.cos(a) * r, vy: Math.sin(a) * r, dh: Math.random() * 30 }); }
        weather.fw.push({ x: W * (0.1 + Math.random() * 0.8), y: H * (0.1 + Math.random() * 0.18), t: 0, life: 1.6 + Math.random() * 0.5, hue: Math.floor(Math.random() * 360), parts });
        Sound.firework(0.05 + Math.random() * 0.4);
      }
    } else weather.fw.length = 0;
    if (!MIS.rain) { weather.drops.length = 0; weather.flash = 0; return; }
    const want = Math.round(clamp(W * H / 2600, 60, 260));
    while (weather.drops.length < want) weather.drops.push({ x: Math.random() * (W + 200), y: Math.random() * H, s: 0.7 + Math.random() * 0.6 });
    if (weather.drops.length > want) weather.drops.length = want;
    const ppm = clamp(H / 44, 3.4, 13);
    for (const d of weather.drops) {
      d.y += 820 * d.s * dt;
      d.x -= (170 + v * ppm) * d.s * dt;
      if (d.y > H || d.x < -40) { d.y = -20 - Math.random() * 60; d.x = Math.random() * (W + 260); }
    }
    weather.flash = Math.max(0, weather.flash - dt * 2.6);
    weather.nextFlash -= dt;
    if (weather.nextFlash <= 0) {
      weather.flash = 1;
      weather.nextFlash = 9 + Math.random() * 14;
      Sound.thunder(0.6 + Math.random() * 2.2);
    }
  }
  function drawWeather(V) {
    if (!V.storm && !MIS.rain) return;
    const { c, X, gy, ppm } = V;
    // langit mendung menggelapkan pemandangan
    c.fillStyle = 'rgba(18,26,36,0.34)'; c.fillRect(0, 0, W, H);
    if (MIS.rain) {
      const T = ROUTE.tunnel;
      const t0 = T ? X(T.from) : -1, t1 = T ? X(T.to) : -1;
      c.strokeStyle = 'rgba(200,215,230,0.38)'; c.lineWidth = 1;
      c.beginPath();
      for (const d of weather.drops) {
        if (T && d.x > t0 && d.x < t1 && d.y > gy - 10 * ppm) continue; // kering di dalam terowongan
        c.moveTo(d.x, d.y); c.lineTo(d.x - 4 * d.s, d.y + 15 * d.s);
      }
      c.stroke();
      // cipratan di rel
      c.fillStyle = 'rgba(210,225,235,0.35)';
      for (let i = 0; i < 18; i++) {
        const sx = (hash(i + Math.floor(performance.now() / 90)) * W);
        if (T && sx > t0 && sx < t1) continue;
        c.fillRect(sx, gy - 0.2 * ppm + hash(i * 3.1) * 1.2 * ppm, 2, 1);
      }
    }
    if (weather.flash > 0) {
      c.fillStyle = `rgba(235,240,255,${weather.flash * 0.55})`; c.fillRect(0, 0, W, H);
    }
    // jendela gerbong menyala hangat di tengah hujan
    drawWindowGlow(V, 0.55);
  }
  function drawWindowGlow(V, alpha) {
    const { c, ppm, gy, X, st } = V;
    const fx = X(st.x);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(255,200,110,${alpha * 0.42})`;
    for (let k = 0; k < N_COACH; k++) {
      const F = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      for (let i = 0; i < 7; i++) {
        const a = 36 + i * 24.4;
        const m = F + (240 - a) / 12, x = V.bx ? V.bx(st.x - m) : fx - m * ppm;
        roundRect(c, x - 0.25 * ppm, gy - trainH(4.6) * ppm + V.bdy(st.x - m), (21 / 12 + 0.5) * ppm, (trainH(4.6) - trainH(2.7)) * ppm, 0.3 * ppm); c.fill();
      }
    }
    c.fillStyle = `rgba(255,215,143,${alpha * 0.35})`;
    c.fillRect(fx - 3.6 * ppm, gy - trainH(5.8) * ppm + V.bdy(st.x - 3), 2.5 * ppm, (trainH(5.8) - trainH(4.1)) * ppm);
    c.restore();
  }

  // ---------- terowongan ----------
  function drawTunnelHill(V) {
    const T = ROUTE.tunnel;
    if (!T) return;
    const { c, ppm, gy, X, p } = V;
    const a = X(T.from - 70), b = X(T.to + 70);
    if (b < 0 || a > W) return;
    const peak = gy - 30 * ppm;
    c.fillStyle = mix('#33503a', '#4a6e45', p);
    c.beginPath(); c.moveTo(a, gy + 1);
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = lerp(a, b, t);
      const hgt = Math.sin(t * Math.PI) ** 0.7 + 0.08 * Math.sin(t * 19) + 0.05 * Math.sin(t * 41);
      c.lineTo(x, lerp(gy, peak, clamp(hgt, 0, 1.1)));
    }
    c.lineTo(b, gy + 1); c.closePath(); c.fill();
    // batu-batu dan semak di lereng
    c.fillStyle = mix('#2a4331', '#3b5c3a', p);
    for (let i = 0; i < 26; i++) {
      const t = 0.08 + hash(i * 1.3) * 0.84, x = lerp(a, b, t);
      const top = lerp(gy, peak, Math.sin(t * Math.PI) ** 0.7);
      const y = lerp(top + 2 * ppm, gy - 2 * ppm, hash(i * 2.7));
      c.beginPath(); c.ellipse(x, y, (1 + hash(i) * 2) * ppm, (0.7 + hash(i + 4) * 0.9) * ppm, 0, 0, 7); c.fill();
    }
  }
  function drawTunnelInterior(V) {
    const T = ROUTE.tunnel;
    if (!T) return;
    const { c, ppm, gy, X } = V;
    const a = X(T.from), b = X(T.to);
    if (b < 0 || a > W) return;
    const top = gy - 7.5 * ppm;
    c.fillStyle = '#1c1a19'; c.fillRect(a, top, b - a, gy - top + 1.3 * ppm);
    // lapisan bata lengkung
    c.strokeStyle = 'rgba(120,96,78,0.35)'; c.lineWidth = Math.max(1, 0.15 * ppm);
    for (let x = T.from + 6; x < T.to; x += 12) {
      const sx = X(x);
      if (sx < -20 || sx > W + 20) continue;
      c.beginPath(); c.moveTo(sx, gy); c.lineTo(sx, top + 2 * ppm); c.quadraticCurveTo(sx + 2.5 * ppm, top, sx + 5 * ppm, top + 0.2 * ppm); c.stroke();
    }
    // lampu dinding
    for (let x = T.from + 15; x < T.to; x += 25) {
      const sx = X(x), sy = gy - 5.2 * ppm;
      if (sx < -30 || sx > W + 30) continue;
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, 4 * ppm);
      g.addColorStop(0, 'rgba(255,214,140,0.55)'); g.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 4 * ppm, 0, 7); c.fill();
      c.fillStyle = '#ffe2a0'; c.fillRect(sx - 0.2 * ppm, sy - 0.2 * ppm, 0.4 * ppm, 0.4 * ppm);
    }
  }
  function drawTunnelPortals(V) {
    const T = ROUTE.tunnel;
    if (!T) return;
    const { c, ppm, gy, X } = V;
    [T.from, T.to].forEach((x, i) => {
      const sx = X(x);
      if (sx < -60 || sx > W + 60) return;
      const w = 3 * ppm, top = gy - 10 * ppm;
      const x0 = i === 0 ? sx - w : sx;
      c.fillStyle = '#7d7468'; c.fillRect(x0, top, w, gy - top + 0.4 * ppm);
      c.strokeStyle = 'rgba(40,34,30,0.45)'; c.lineWidth = 1;
      for (let r = 1; r < 10; r++) { c.beginPath(); c.moveTo(x0, top + r * ppm); c.lineTo(x0 + w, top + r * ppm); c.stroke(); }
      c.fillStyle = '#6a6156'; c.fillRect(x0 - 0.4 * ppm, top - 0.8 * ppm, w + 0.8 * ppm, 0.9 * ppm);
      if (i === 0) {
        // prasasti nama terowongan
        c.fillStyle = '#e9e1cf'; c.fillRect(sx - 9 * ppm, top - 3.2 * ppm, 8 * ppm, 2.2 * ppm);
        c.fillStyle = '#2a2622'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${Math.round(0.85 * ppm)}px "Big Shoulders Display", sans-serif`;
        c.fillText(T.name, sx - 5 * ppm, top - 2.45 * ppm);
        c.font = `700 ${Math.round(0.55 * ppm)}px "Plus Jakarta Sans", sans-serif`;
        c.fillText(T.year, sx - 5 * ppm, top - 1.55 * ppm);
        c.textAlign = 'start'; c.textBaseline = 'alphabetic';
      }
    });
  }
  function drawTunnelDark(V) {
    if (V.tf <= 0.01) return;
    const { c, ppm, gy, X, st, tf } = V;
    c.fillStyle = `rgba(4,5,8,${0.6 * tf})`; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    const lx = V.bx(st.x + 0.3), ly = gy - trainH(3.9) * ppm + V.bdy(st.x);
    const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 30 * ppm);
    lg.addColorStop(0, `rgba(255,232,160,${0.5 * tf})`); lg.addColorStop(1, 'rgba(255,232,160,0)');
    c.fillStyle = lg;
    c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 30 * ppm, ly - 7 * ppm); c.lineTo(lx + 30 * ppm, ly + 5 * ppm); c.closePath(); c.fill();
    c.restore();
    drawWindowGlow(V, tf);
  }

  // ---------- wesel ----------
  function drawSwitch(V) {
    const sw = ROUTE.switchX;
    if (sw === null || sw === undefined) return;
    const { c, ppm, gy, X, st } = V;
    const sx = X(sw);
    // rel cabang mengarah ke depan (mendekati penonton)
    c.strokeStyle = '#8f9496'; c.lineWidth = Math.max(1.5, 0.22 * ppm);
    c.beginPath(); c.moveTo(sx, gy); c.quadraticCurveTo(sx + 18 * ppm, gy + 0.4 * ppm, sx + 45 * ppm, gy + 4 * ppm); c.stroke();
    c.beginPath(); c.moveTo(sx + 4 * ppm, gy + 0.6 * ppm); c.quadraticCurveTo(sx + 20 * ppm, gy + 1.2 * ppm, sx + 45 * ppm, gy + 5.2 * ppm); c.stroke();
    // tuas wesel dengan papan penunjuk
    const ss = S && ROUTE.scripts.length ? S.scripts[0] : null;
    const locked = !ss || ss.phase === 'idle' || ss.phase === 'yellow' || ss.phase === 'done';
    const bx = sx - 3 * ppm, by = gy + 2.2 * ppm;
    c.fillStyle = '#3a3a3a'; c.fillRect(bx - 0.12 * ppm, by - 2.4 * ppm, 0.24 * ppm, 2.4 * ppm);
    c.fillStyle = locked && ss && ss.phase !== 'idle' ? '#f4f1e8' : ss && ss.phase !== 'idle' ? '#d0392b' : '#f4f1e8';
    c.beginPath(); c.arc(bx, by - 2.7 * ppm, 0.5 * ppm, 0, 7); c.fill();
    // Dimas memeriksa wesel
    if (ss && ss.phase !== 'idle') {
      // Dimas berjalan dari wesel menuju lokomotif sambil membawa lentera
      const dx = X(Math.min(sw + 2, st.x + 18)), dy = gy + 2.6 * ppm;
      person(c, dx, dy, ppm, 7, { color: '#f08a24', helmet: true });
      if (ss.phase === 'work' || ss.phase === 'red') {
        const sw2 = Math.sin(performance.now() / 260) * 0.4 * ppm;
        const g = c.createRadialGradient(dx + 0.6 * ppm + sw2, dy - 1.0 * ppm, 0, dx + 0.6 * ppm + sw2, dy - 1.0 * ppm, 2.2 * ppm);
        g.addColorStop(0, 'rgba(255,215,120,0.8)'); g.addColorStop(1, 'rgba(255,215,120,0)');
        c.fillStyle = g; c.beginPath(); c.arc(dx + 0.6 * ppm + sw2, dy - 1.0 * ppm, 2.2 * ppm, 0, 7); c.fill();
      }
    }
  }

  function drawSky(V) {
    const { c, gy, p } = V;
    const PAL = MIS.pal || {};
    if (V.night) {
      const sg = c.createLinearGradient(0, 0, 0, gy), nc = PAL.night || ['#070b24', '#18214d', '#3b3a66'];
      sg.addColorStop(0, nc[0]); sg.addColorStop(0.7, nc[1]); sg.addColorStop(1, nc[2]);
      c.fillStyle = sg; c.fillRect(0, 0, W, gy + 4);
      const tw = performance.now() / 600;
      for (let i = 0; i < 110; i++) {
        const sx = ((hash(i) * (W + 300) - V.camX * V.ppm * 0.02) % (W + 300) + W + 300) % (W + 300) - 150;
        const sy = hash(i + 0.5) * gy * 0.75;
        const a = 0.35 + 0.45 * Math.abs(Math.sin(tw + i));
        c.fillStyle = `rgba(255,250,235,${a})`; c.fillRect(sx, sy, hash(i + 2) > 0.85 ? 2 : 1.2, hash(i + 2) > 0.85 ? 2 : 1.2);
      }
      // bulan sabit (hilal)
      const mx = W * 0.64, my = gy * 0.32, mr = Math.max(14, gy * 0.05);
      c.fillStyle = '#fff3c8'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
      c.fillStyle = PAL.night ? PAL.night[0] : '#0d1433'; c.beginPath(); c.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.92, 0, 7); c.fill();
      return;
    }
    if (V.storm) {
      const sg = c.createLinearGradient(0, 0, 0, gy), sc = PAL.storm || ['#36404b', '#66737e', '#8a96a0'];
      sg.addColorStop(0, sc[0]); sg.addColorStop(0.7, sc[1]); sg.addColorStop(1, sc[2]);
      c.fillStyle = sg; c.fillRect(0, 0, W, gy + 4);
      // awan mendung bergerak pelan
      const off = V.camX * V.ppm * 0.03 + performance.now() * 0.004;
      c.fillStyle = 'rgba(52,60,70,0.55)';
      for (let i = 0; i < 9; i++) {
        const cx = ((i * 260 - off) % (W + 400) + W + 400) % (W + 400) - 200;
        const cy = gy * (0.12 + hash(i) * 0.3);
        c.beginPath(); c.ellipse(cx, cy, 160 + hash(i + 2) * 120, 34 + hash(i + 5) * 20, 0, 0, 7); c.fill();
      }
      return;
    }
    const g = c.createLinearGradient(0, 0, 0, gy);
    const ks = PAL.sky || [['#2c3a6b', '#5d9fd3'], ['#c97a7a', '#a8d2ea'], ['#f7b36d', '#e3f0f0']];
    g.addColorStop(0, mix(ks[0][0], ks[0][1], p));
    g.addColorStop(0.65, mix(ks[1][0], ks[1][1], p));
    g.addColorStop(1, mix(ks[2][0], ks[2][1], p));
    c.fillStyle = g; c.fillRect(0, 0, W, gy + 4);
    // matahari terbit
    const sx = W * 0.8, sy = lerp(gy - 10, gy * 0.25, p);
    const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 90);
    sg.addColorStop(0, 'rgba(255,236,190,0.95)'); sg.addColorStop(0.18, 'rgba(255,214,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 90, 0, Math.PI * 2); c.fill();
    // berkas cahaya matahari pagi
    const rayA = 0.16 * (1 - p * 0.7);
    if (rayA > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      [[-0.95, 0.07], [-0.62, 0.05], [-0.3, 0.04], [-0.12, 0.035]].forEach(([dir, wdt]) => {
        const ex = sx + Math.cos(Math.PI + dir) * W * 1.1, ey = sy + Math.sin(Math.PI + dir) * W * 1.1;
        const rg = c.createLinearGradient(sx, sy, ex, ey);
        rg.addColorStop(0, `rgba(255,241,204,${rayA})`); rg.addColorStop(1, 'rgba(255,241,204,0)');
        const nx = Math.cos(Math.PI + dir + Math.PI / 2) * W * wdt, ny = Math.sin(Math.PI + dir + Math.PI / 2) * W * wdt;
        c.fillStyle = rg; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex + nx, ey + ny); c.lineTo(ex - nx, ey - ny); c.closePath(); c.fill();
      });
      c.restore();
    }
  }

  function ridgePath(V, par, base, amp, fn, color) {
    const { c, camX, ppm } = V;
    const off = camX * ppm * par - (V.pan || 0);
    c.beginPath(); c.moveTo(0, V.gy + 2);
    for (let sx = 0; sx <= W + 8; sx += 6) c.lineTo(sx, base - amp * fn(sx + off));
    c.lineTo(W, V.gy + 2); c.closePath();
    c.fillStyle = color; c.fill();
  }
  function drawRidges(V) {
    const { gy, p } = V;
    // gunung berapi jauh
    ridgePath(V, 0.05, gy - 8, gy * 0.42, (u) => {
      const k = ((u % 2600) + 2600) % 2600;
      const vol = Math.max(0, 1 - Math.abs(k - 1300) / 520);
      const cone = Math.min(0.92, Math.pow(vol, 1.25)) * 1.05;
      return Math.max(cone, 0.18 + 0.1 * Math.sin(u * 0.004) + 0.06 * Math.sin(u * 0.011));
    }, (() => { const vg = V.c.createLinearGradient(0, gy * 0.45, 0, gy); vg.addColorStop(0, mix('#5b4f7e', '#86a2bd', p)); vg.addColorStop(1, mix('#b79fb2', '#b4c6d4', p)); return V.storm || V.night ? mix('#5b4f7e', '#86a2bd', p) : vg; })());
    // kabut tipis di kaki gunung
    { const hz = V.c.createLinearGradient(0, gy * 0.55, 0, gy); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, V.haze); V.c.save(); V.c.globalAlpha = V.hazeA; V.c.fillStyle = hz; V.c.fillRect(0, gy * 0.55, W, gy * 0.45 + 2); V.c.restore(); }
    // pegunungan jauh: makin jauh makin pucat menyatu dengan kabut (perspektif udara)
    const farFn = (u) => 0.5 + 0.28 * Math.sin(u * 0.0019 + 3) + 0.16 * Math.sin(u * 0.0062 + 1);
    ridgePath(V, 0.09, gy - 2, gy * 0.32, farFn, mix(V.night ? '#1c2244' : V.storm ? '#5d6a74' : '#8a83a6', V.storm ? '#7c8a94' : '#93acc0', p));
    { const hz = V.c.createLinearGradient(0, gy * 0.6, 0, gy); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, V.haze); V.c.save(); V.c.globalAlpha = V.hazeA * 0.8; V.c.fillStyle = hz; V.c.fillRect(0, gy * 0.6, W, gy * 0.4 + 2); V.c.restore(); }
    const midFn = (u) => 0.45 + 0.3 * Math.sin(u * 0.0031 + 1) + 0.18 * Math.sin(u * 0.009 + 2);
    ridgePath(V, 0.16, gy - 4, gy * 0.26, midFn, (() => { const mg = V.c.createLinearGradient(0, gy * 0.72, 0, gy); mg.addColorStop(0, mix('#4d6d60', '#6f9c78', p)); mg.addColorStop(1, mix('#2f4a43', '#4c7a5c', p)); return V.night ? mix('#3c5a52', '#5f8f6c', p) : mg; })());
    { const hz = V.c.createLinearGradient(0, gy * 0.78, 0, gy); hz.addColorStop(0, 'rgba(0,0,0,0)'); hz.addColorStop(1, V.haze); V.c.save(); V.c.globalAlpha = V.hazeA * 0.55; V.c.fillStyle = hz; V.c.fillRect(0, gy * 0.78, W, gy * 0.22 + 2); V.c.restore(); }
    if (V.night) { // lampu rumah desa di lereng
      const off = V.camX * V.ppm * 0.16;
      for (let i = 0; i < 40; i++) {
        const u0 = i * 97;
        const sx = ((u0 - off) % 3880 + 3880) % 3880 - 40;
        if (sx > W + 10) continue;
        const top = gy - 4 - gy * 0.26 * midFn(sx + off);
        const y = lerp(top, gy - 6, 0.25 + hash(i) * 0.6);
        V.c.fillStyle = hash(i + 3) > 0.3 ? 'rgba(255,205,120,0.9)' : 'rgba(255,240,210,0.8)';
        V.c.fillRect(sx, y, 2, 2);
      }
    }
    if (MIS.land === 'sawit') {
      // tajuk hutan hujan bergelombang di kaki Bukit Barisan
      const parJ = 0.42, offJ = V.camX * V.ppm * parJ;
      const jf = (u) => 0.32 + 0.12 * Math.sin(u * 0.004 + 1) + 0.07 * Math.abs(Math.sin(u * 0.045)) + 0.05 * Math.abs(Math.sin(u * 0.11 + 2));
      ridgePath(V, parJ, gy, gy * 0.2, jf, (() => { const jg = V.c.createLinearGradient(0, gy * 0.8, 0, gy); jg.addColorStop(0, mix('#355a36', '#4f7f45', p)); jg.addColorStop(1, mix('#1f3a24', '#2f5a33', p)); return jg; })());
      const c2 = V.c; c2.save(); c2.globalAlpha = 0.25; c2.fillStyle = mix('#5d8a4a', '#86b866', p);
      for (let sx = 0; sx < W; sx += 14) { const top = gy - gy * 0.2 * jf(sx + offJ); c2.beginPath(); c2.arc(sx, top + 4, 6, Math.PI, 0); c2.fill(); }
      c2.restore();
      return;
    }
    // sawah terasering
    const par = 0.42, off = V.camX * V.ppm * par;
    const fn = (u) => 0.35 + 0.28 * Math.sin(u * 0.0045 + 4) + 0.12 * Math.sin(u * 0.013);
    const base = gy, amp = gy * 0.16;
    ridgePath(V, par, base, amp, fn, (() => { const tg = V.c.createLinearGradient(0, base - amp, 0, base); tg.addColorStop(0, mix('#5b8746', '#7fb055', p)); tg.addColorStop(1, mix('#3a5f33', '#5a8a40', p)); return tg; })());
    const c = V.c;
    c.save();
    c.strokeStyle = mix('#76a056', '#a6cf6b', p); c.lineWidth = 1.4; c.globalAlpha = 0.6;
    for (let k = 1; k <= 5; k++) {
      c.beginPath();
      for (let sx = 0; sx <= W + 8; sx += 6) {
        const top = base - amp * fn(sx + off);
        const y = top + (base - top) * (k / 6) + Math.sin((sx + off) * 0.03 + k) * 1.2;
        if (sx === 0) c.moveTo(sx, y); else c.lineTo(sx, y);
      }
      c.stroke();
    }
    c.restore();
    // genangan air sawah memantulkan langit
    c.save(); c.globalAlpha = V.night ? 0.35 : 0.42; c.fillStyle = V.water;
    for (const k of [2, 4]) {
      c.beginPath();
      for (let sx = 0; sx <= W + 8; sx += 8) {
        const top = base - amp * fn(sx + off);
        const y = top + (base - top) * (k / 6) + Math.sin((sx + off) * 0.03 + k) * 1.2 + 1.5;
        if (sx === 0) c.moveTo(sx, y); else c.lineTo(sx, y);
      }
      for (let sx = W + 8; sx >= 0; sx -= 8) {
        const top = base - amp * fn(sx + off);
        const y = top + (base - top) * ((k + 0.55) / 6) + Math.sin((sx + off) * 0.03 + k) * 1.2;
        c.lineTo(sx, y);
      }
      c.closePath(); c.fill();
    }
    c.restore();
  }

  // ---------- latar tengah: kampung di kaki bukit dan dataran sawah/kebun di seberang rel ----------
  // Lapisan ini memberi tanah di antara rel dan bukit, sehingga dunia terasa dalam dan rel tidak menggantung.
  // ---------- landmark rute: tempat khas (fiksi) di latar tengah, dikoleksi sebagai kartu pos ----------
  const LANDMARKS = {
    menara: { name: 'Menara Air Depo', sub: 'Sukamaju · dibangun 1921', kind: 'tower', mis: '1-1' },
    pg: { name: 'Pabrik Gula Cibening', sub: 'cerobong bata · berdiri 1884', kind: 'factory', mis: '1-2' },
    asam: { name: 'Asam Tua Sumberrejo', sub: 'peneduh halte sejak zaman trem', kind: 'tree', mis: '1-3' },
    candi: { name: 'Candi Batu Cibening', sub: 'reruntuhan abad ke-9', kind: 'candi', mis: '1-4' },
    masjid: { name: 'Masjid Agung Pasar Lama', sub: 'kubah bawang hijau · menara 30 m', kind: 'mosque', mis: '1-4' },
    gunung: { name: 'Gunung Sela', sub: 'gunung api yang selalu berasap', kind: 'volcano', mis: '1-5', far: true },
    curug: { name: 'Curug Watu', sub: 'air terjun di tepi rel', kind: 'waterfall', mis: '1-5' },
    pasar: { name: 'Pasar Malam Pasar Lama', sub: 'bianglala & lampion', kind: 'market', mis: '1-6' },
    beringin: { name: 'Beringin Krajan', sub: 'beringin raksasa · ratusan tahun', kind: 'banyan', mis: '1-7' },
    waduk: { name: 'Waduk Kedung Banteng', sub: 'bendungan 1978', kind: 'reservoir', mis: '1-7' },
    sawit: { name: 'Pabrik Sawit Muara Kelam', sub: 'cerobong kembar', kind: 'mill', mis: '2-1' },
    barisan: { name: 'Bukit Barisan', sub: 'punggung pegunungan Sumatra', kind: 'peaks', mis: '2-1', far: true },
    panggung: { name: 'Kampung Rumah Panggung', sub: 'rumah kayu di atas tiang', kind: 'stilt', mis: '2-1' },
    jembatan: { name: 'Jembatan Kayu Lubuk Tua', sub: 'kayu ulin · dibangun 1931', kind: 'trestle', mis: '2-2' },
    kopi: { name: 'Pasar Kopi Liwa', sub: 'gudang & jemuran kopi rakyat', kind: 'coffee', mis: '2-3' },
    mercu: { name: 'Mercusuar Tanjung Api', sub: 'penjaga dermaga sejak 1902', kind: 'lighthouse', mis: '2-1' },
  };
  const LM_IDS = Object.keys(LANDMARKS);
  const cardsGot = () => { try { const a = JSON.parse(store.get('rn.cards') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };

  // kubah bawang (masjid Nusantara): tabuh/drum, kubah menggembung lalu meruncing, mustaka bulan sabit
  // (cx, by) = dasar kubah di layar, r = jari-jari dasar, h = tinggi kubah (piksel)
  function onionDome(c, cx, by, r, h, col, hi, gold, finial = true) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(cx - r, by);
    c.bezierCurveTo(cx - r * 1.28, by - h * 0.35, cx - r * 1.05, by - h * 0.78, cx - r * 0.18, by - h * 0.93);
    c.quadraticCurveTo(cx, by - h * 0.98, cx, by - h);
    c.quadraticCurveTo(cx, by - h * 0.98, cx + r * 0.18, by - h * 0.93);
    c.bezierCurveTo(cx + r * 1.05, by - h * 0.78, cx + r * 1.28, by - h * 0.35, cx + r, by);
    c.closePath(); c.fill();
    if (hi) { // kilap & garis rusuk kubah
      c.save(); c.clip();
      c.fillStyle = hi; c.beginPath(); c.ellipse(cx - r * 0.45, by - h * 0.5, r * 0.28, h * 0.38, -0.15, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = Math.max(1, r * 0.04);
      [-0.55, 0, 0.55].forEach((k) => { c.beginPath(); c.moveTo(cx + k * r, by); c.quadraticCurveTo(cx + k * r * 1.15, by - h * 0.55, cx, by - h); c.stroke(); });
      c.restore();
    }
    if (!finial) return;
    const fh = h * 0.32;
    c.strokeStyle = gold; c.lineWidth = Math.max(1, r * 0.06);
    c.beginPath(); c.moveTo(cx, by - h); c.lineTo(cx, by - h - fh); c.stroke();
    c.fillStyle = gold; c.beginPath(); c.arc(cx, by - h - fh * 0.35, Math.max(1, r * 0.09), 0, 7); c.fill();
    const cr = Math.max(1.5, r * 0.16), cy = by - h - fh - cr * 0.6;
    // bulan sabit: lingkaran besar dikurangi lingkaran kecil yang bergeser, dimiringkan
    const R = cr, d = cr * 0.55, r2 = cr * 0.85, ix = (d * d + R * R - r2 * r2) / (2 * d), iy = Math.sqrt(Math.max(0, R * R - ix * ix));
    const t1 = Math.atan2(iy, ix), p1 = Math.atan2(iy, ix - d);
    c.save(); c.translate(cx, cy); c.rotate(-0.6);
    c.beginPath(); c.arc(0, 0, R, t1, Math.PI * 2 - t1, false); c.arc(d, 0, r2, -p1, p1, true); c.closePath(); c.fill();
    c.restore();
  }
  // gambar landmark: (x, y) titik dasar di tanah, s = piksel per meter, o = { t, night, tone(col) }
  function drawLandmark(c, kind, x, y, s, o) {
    const T = o.tone || ((col) => col), t = o.t || 0, night = !!o.night;
    const box = (x0, y0, w, h, col) => { c.fillStyle = T(col); c.fillRect(x + x0 * s, y - y0 * s - h * s, w * s, h * s); };
    const poly = (pts, col) => { c.fillStyle = T(col); c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(x + px * s, y - py * s) : c.moveTo(x + px * s, y - py * s))); c.closePath(); c.fill(); };
    const blob = (px, py, r, col, ry) => { c.fillStyle = T(col); c.beginPath(); c.ellipse(x + px * s, y - py * s, r * s, (ry || r) * s, 0, 0, 7); c.fill(); };
    const smoke = (px, py, n, sc) => { for (let i = 0; i < n; i++) { const k = ((t * 0.12 + i / n) % 1); c.fillStyle = `rgba(${night ? '120,120,140' : '228,224,214'},${0.42 * (1 - k)})`; c.beginPath(); c.arc(x + (px - k * 14 * sc) * s, y - (py + k * 16 * sc) * s, (1.2 + k * 5) * sc * s, 0, 7); c.fill(); } };
    const win = (px, py, w, h) => box(px, py, w, h, night ? '#f2c76a' : '#3d2f28');
    if (kind === 'tower') {
      c.strokeStyle = T('#5b5f62'); c.lineWidth = Math.max(1, 0.45 * s);
      [[-3, -1.8], [3, 1.8]].forEach(([a, b]) => { c.beginPath(); c.moveTo(x + a * s, y); c.lineTo(x + b * s, y - 11 * s); c.stroke(); });
      c.lineWidth = Math.max(1, 0.22 * s); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - (2.8 - i * 0.4) * s, y - i * 3.7 * s); c.lineTo(x + (2.4 - i * 0.4) * s, y - (i + 1) * 3.7 * s); c.stroke(); }
      box(-3.2, 11, 6.4, 4.6, '#6f7a7a'); poly([[-3.6, 15.6], [0, 17.6], [3.6, 15.6]], '#4f5858');
      box(-3.2, 12.2, 6.4, 0.4, '#a9b2b0');
    } else if (kind === 'factory' || kind === 'mill') {
      const mill = kind === 'mill', wall = mill ? '#8a9095' : '#9a5a3c', roof = mill ? '#5f666b' : '#7d4630', ch = mill ? '#7b8186' : '#8b4a32';
      box(-14, 0, 26, 9, wall); poly([[-15, 9], [13, 9], [10, 12.5], [-12, 12.5]], roof);
      for (let i = 0; i < 6; i++) win(-12 + i * 4, 2.5, 1.8, 3.6);
      const chim = mill ? [6, 9.5] : [7];
      chim.forEach((cx) => { poly([[cx - 1.3, 9], [cx - 0.9, 34], [cx + 0.9, 34], [cx + 1.3, 9]], ch); box(cx - 1.1, 34, 2.2, 1.2, '#4a2a20'); smoke(cx, 36, 7, 1); });
    } else if (kind === 'tree' || kind === 'banyan') {
      const big = kind === 'banyan' ? 1.35 : 1;
      box(-1.2 * big, 0, 2.4 * big, 7 * big, '#4e3a28');
      const lf = night ? '#1f3324' : '#33582f', lf2 = night ? '#284030' : '#41703a';
      [[-6, 10, 6], [5, 10, 6.5], [0, 13, 7.5], [-9, 7, 4], [9, 7.5, 4.5]].forEach(([px, py, r], i) => blob(px * big, py * big, r * big, i % 2 ? lf2 : lf, r * big * 0.8));
      if (kind === 'banyan') { c.strokeStyle = T('#5a4430'); c.lineWidth = Math.max(1, 0.12 * s); for (let i = 0; i < 12; i++) { const px = -11 + i * 2; c.beginPath(); c.moveTo(x + px * s, y - 6 * s); c.lineTo(x + (px + Math.sin(i) * 0.4) * s, y); c.stroke(); } }
    } else if (kind === 'candi') {
      [[-7, 0, 14, 3], [-5.5, 3, 11, 3.2], [-4, 6.2, 8, 3], [-2.6, 9.2, 5.2, 2.6]].forEach(([a, b, w, h], i) => { box(a, b, w, h, i % 2 ? '#7d7466' : '#8c8273'); box(a, b + h - 0.35, w, 0.35, '#a39888'); });
      poly([[-1.6, 11.8], [0, 15.5], [1.6, 11.8]], '#7d7466'); box(-1.2, 1, 2.4, 3, '#3a332c');
      blob(-9, 1.5, 2.4, night ? '#1f3324' : '#3f6a3a'); blob(9.5, 2, 3, night ? '#1f3324' : '#3f6a3a');
    } else if (kind === 'mosque') {
      // masjid agung: ruang salat berserambi lengkung, tabuh berjendela, kubah bawang hijau, dua kubah kecil,
      // menara ramping dengan dua balkon dan kubah bawang kecil
      const wall = '#efe9da', trim = '#d8cfb9', green = night ? '#1f5a44' : '#2f8a5e', hiG = night ? 'rgba(120,200,160,0.25)' : 'rgba(190,240,210,0.45)', gld = T('#e1b84a');
      box(-13, 0, 26, 8.5, wall); box(-13, 8.5, 26, 0.9, trim); box(-13.6, 0, 27.2, 0.7, trim);
      for (let i = 0; i < 6; i++) { const ax = -11 + i * 4.4; box(ax, 0.7, 2.6, 4.2, night ? '#f2c76a' : '#3d4a4f'); blob(ax + 1.3, 4.9, 1.3, night ? '#f2c76a' : '#3d4a4f', 1.1); }
      for (let i = 0; i < 6; i++) box(-11.2 + i * 4.4 + 0.5, 6.6, 1.6, 1.2, night ? '#f2c76a' : '#5d6a70');
      // tabuh (drum) berjendela
      box(-6, 9.4, 12, 3.2, wall); box(-6.3, 12.6, 12.6, 0.5, trim);
      for (let i = 0; i < 5; i++) { box(-4.9 + i * 2.2, 10.1, 1, 1.9, night ? '#f2c76a' : '#5d6a70'); }
      onionDome(c, x, y - 13.1 * s, 6.2 * s, 10.5 * s, T(green), hiG, gld);
      // kubah kecil di sudut
      [-11, 11].forEach((dx) => { box(dx - 1.3, 9.4, 2.6, 2.4, wall); onionDome(c, x + dx * s, y - 11.8 * s, 1.5 * s, 2.8 * s, T(green), null, gld); });
      // menara
      const mx = 17.5;
      box(mx - 1.2, 0, 2.4, 27, wall); box(mx - 1.5, 0, 3, 1.2, trim);
      [12, 21].forEach((bh) => { box(mx - 2.1, bh, 4.2, 0.6, trim); box(mx - 1.8, bh + 0.6, 3.6, 0.7, night ? '#f2c76a' : '#c7bea9'); });
      box(mx - 1.0, 27, 2.0, 1.2, trim);
      onionDome(c, x + mx * s, y - 28.2 * s, 1.35 * s, 3.4 * s, T(green), null, gld);
      for (let i = 0; i < 3; i++) box(mx - 0.35, 4 + i * 6, 0.7, 1.6, night ? '#f2c76a' : '#5d6a70');
      if (night) { for (let i = 0; i < 18; i++) { const lx = -13 + i * 1.55; c.fillStyle = i % 2 ? '#ffd27a' : '#9fe7c4'; c.beginPath(); c.arc(x + lx * s, y - (9.6 + Math.sin(i * 0.7) * 0.35) * s, Math.max(1, 0.25 * s), 0, 7); c.fill(); } }
    } else if (kind === 'volcano' || kind === 'peaks') {
      const k = 3.2; // jauh: dimensi diperbesar dan dipudarkan
      if (kind === 'volcano') { poly([[-26 * k, 0], [-5 * k, 15 * k], [-2.5 * k, 16 * k], [2.5 * k, 16 * k], [5 * k, 15 * k], [26 * k, 0]], night ? '#262a44' : '#7c7f92'); poly([[-4.5 * k, 14.6 * k], [-2.5 * k, 16 * k], [2.5 * k, 16 * k], [4.5 * k, 14.6 * k], [2 * k, 13 * k], [-1.5 * k, 13.8 * k]], night ? '#3a3d5a' : '#a9a9b8'); smoke(0, 16.5 * k, 8, 5); }
      else { poly([[-30 * k, 0], [-16 * k, 12 * k], [-10 * k, 9 * k], [-2 * k, 17 * k], [6 * k, 10 * k], [12 * k, 14 * k], [30 * k, 0]], night ? '#20283f' : '#5f7a88'); poly([[-2 * k, 17 * k], [-4 * k, 14.5 * k], [0, 15 * k], [2 * k, 14.2 * k]], '#dfe6e8'); }
    } else if (kind === 'waterfall') {
      poly([[-14, 0], [-12, 20], [-6, 26], [6, 25], [12, 19], [14, 0]], '#6d6457'); poly([[-12, 20], [-6, 26], [6, 25], [12, 19], [4, 22], [-4, 22.5]], night ? '#1f3324' : '#3f6a3a');
      const fg = c.createLinearGradient(0, y - 24 * s, 0, y); fg.addColorStop(0, T('#d8eef2')); fg.addColorStop(1, T('#f4fbfc'));
      c.fillStyle = fg; c.fillRect(x - 2.4 * s, y - 23.5 * s, 4.8 * s, 22 * s);
      c.strokeStyle = 'rgba(160,190,200,0.6)'; c.lineWidth = Math.max(1, 0.15 * s); for (let i = 0; i < 5; i++) { const fy = ((t * 9 + i * 4.4) % 22); c.beginPath(); c.moveTo(x + (-1.8 + i * 0.9) * s, y - (23 - fy) * s); c.lineTo(x + (-1.8 + i * 0.9) * s, y - (20 - fy) * s); c.stroke(); }
      blob(0, 0.6, 9, '#7fa8b4', 1.6); for (let i = 0; i < 6; i++) blob(-4 + i * 1.6 + Math.sin(t * 2 + i) * 0.4, 2 + (i % 2), 1.6, 'rgba(240,248,250,0.55)');
    } else if (kind === 'market') {
      const cols = ['#c0392b', '#2e86ab', '#e1a63b', '#3c8d5a'];
      for (let i = 0; i < 4; i++) { box(-16 + i * 6, 0, 5, 2.6, '#5a4a3a'); poly([[-16.4 + i * 6, 2.6], [-13.5 + i * 6, 4.4], [-10.6 + i * 6, 2.6]], cols[i]); }
      // bianglala
      const wx = 11, wy = 9, r = 7.5, a0 = t * 0.4;
      c.strokeStyle = T('#c9c2b3'); c.lineWidth = Math.max(1, 0.25 * s);
      c.beginPath(); c.moveTo(x + (wx - 3) * s, y); c.lineTo(x + wx * s, y - wy * s); c.lineTo(x + (wx + 3) * s, y); c.stroke();
      c.beginPath(); c.arc(x + wx * s, y - wy * s, r * s, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = a0 + i * Math.PI / 4, px = wx + Math.cos(a) * r, py = wy + Math.sin(a) * r; c.beginPath(); c.moveTo(x + wx * s, y - wy * s); c.lineTo(x + px * s, y - py * s); c.stroke(); c.fillStyle = night ? cols[i % 4] : T(cols[i % 4]); c.fillRect(x + (px - 0.7) * s, y - (py - 0.2) * s, 1.4 * s, 1.2 * s); }
      for (let i = 0; i < 16; i++) { const lx = -17 + i * 1.6, ly = 5.4 + Math.sin(i * 0.8) * 0.5; c.fillStyle = night ? (i % 3 ? '#ffcf6b' : '#ff7a5c') : T('#e9c46a'); c.beginPath(); c.arc(x + lx * s, y - ly * s, Math.max(1, 0.3 * s), 0, 7); c.fill(); }
    } else if (kind === 'reservoir') {
      poly([[-30, 0], [-26, 3.4], [26, 3.4], [30, 0]], '#9c9486');
      blob(0, 3.6, 25, night ? '#2a3360' : '#7fa8b8', 1.3);
      box(18, 3.4, 3, 6, '#b8b0a2'); poly([[17.6, 9.4], [19.5, 10.8], [21.4, 9.4]], '#8a4a3a');
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const lx = -18 + ((i * 11 + t * 2) % 34); c.beginPath(); c.moveTo(x + lx * s, y - 3.8 * s); c.lineTo(x + (lx + 3) * s, y - 3.8 * s); c.stroke(); }
    } else if (kind === 'stilt') {
      [[-12, 1], [-1, 1.15], [10, 0.9]].forEach(([hx, k]) => {
        for (let i = 0; i < 4; i++) box(hx - 3.6 * k + i * 2.4 * k, 0, 0.35 * k, 2.6 * k, '#4a3626');
        box(hx - 4 * k, 2.6 * k, 8 * k, 3.4 * k, '#8a6644'); win(hx - 1 * k, 3.4 * k, 1.6 * k, 1.8 * k);
        poly([[hx - 5 * k, 6 * k], [hx - 4.2 * k, 9.5 * k], [hx, 7.4 * k], [hx + 4.2 * k, 9.5 * k], [hx + 5 * k, 6 * k]], '#5a3a2a');
      });
    } else if (kind === 'trestle') {
      blob(0, -1, 26, '#5a6e5a', 3); c.strokeStyle = T('#6b4e32'); c.lineWidth = Math.max(1, 0.5 * s);
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 6 * s, y - 14 * s); c.lineTo(x + (i * 6 - 2) * s, y); c.moveTo(x + i * 6 * s, y - 14 * s); c.lineTo(x + (i * 6 + 2) * s, y); c.stroke(); if (i < 3) { c.beginPath(); c.moveTo(x + i * 6 * s, y - 13 * s); c.lineTo(x + (i + 1) * 6 * s, y - 6 * s); c.moveTo(x + (i + 1) * 6 * s, y - 13 * s); c.lineTo(x + i * 6 * s, y - 6 * s); c.stroke(); } }
      box(-20, 14, 40, 1.4, '#5a4430');
    } else if (kind === 'coffee') {
      box(-14, 0, 16, 8, '#8a6644'); poly([[-15, 8], [-6, 12], [3, 8]], '#5a3a2a'); box(-9, 0, 4, 5, '#3a2a20');
      c.fillStyle = T('#e8dcc0'); c.font = `800 ${Math.max(6, 1.6 * s)}px "Big Shoulders Display", sans-serif`; c.fillText('GUDANG KOPI', x - 13.5 * s, y - 6.3 * s);
      for (let i = 0; i < 3; i++) { box(4 + i * 4, 0, 0.3, 2.2, '#5a4430'); box(7 + i * 4, 0, 0.3, 2.2, '#5a4430'); box(3.6 + i * 4, 2.2, 3.8, 0.4, '#5a4430'); for (let j = 0; j < 6; j++) blob(4.1 + i * 4 + j * 0.55, 2.8, 0.32, j % 2 ? '#7a2e1e' : '#5a2a18'); }
      for (let i = 0; i < 4; i++) blob(-1.5 + i * 1.6, 0.8, 0.9, '#c9b48a', 0.75);
    } else if (kind === 'lighthouse') {
      poly([[-2.6, 0], [-1.6, 24], [1.6, 24], [2.6, 0]], '#f2efe6');
      [4, 12, 20].forEach((b) => poly([[-2.6 + b * 0.042, b], [-2.6 + (b + 4) * 0.042, b + 4], [2.6 - (b + 4) * 0.042, b + 4], [2.6 - b * 0.042, b]], '#c0392b'));
      box(-1.9, 24, 3.8, 2.4, '#2b3a44'); poly([[-2.2, 26.4], [0, 28.4], [2.2, 26.4]], '#c0392b');
      const on = night || o.storm;
      c.fillStyle = on ? '#fff2b0' : T('#f4e7a8'); c.fillRect(x - 1.4 * s, y - 26 * s, 2.8 * s, 1.6 * s);
      if (on) { const a = t * 0.9; const g = c.createLinearGradient(x, 0, x + Math.cos(a) * 40 * s, 0); g.addColorStop(0, 'rgba(255,240,180,0.35)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y - 25.2 * s); c.lineTo(x + Math.cos(a) * 40 * s, y - 28 * s); c.lineTo(x + Math.cos(a) * 40 * s, y - 22 * s); c.closePath(); c.fill(); }
    }
  }
  // lapisan latar tengah: landmark bergerak 0,62× kecepatan rel, berdiri di belakang emplasemen
  const LM_PAR = 0.62;
  function drawLandmarks(V, far = false) {
    const L = ROUTE.landmarks; if (!L || !L.length) return;
    const { c, ppm, gy, camX } = V;
    const cxW = camX + W / (2 * ppm), y = gy - 3.0 * ppm, s = ppm * 0.62;
    const hazeC = V.night ? '#1a2142' : V.storm ? '#8a96a0' : mix('#e8b98f', '#cfe0e6', V.p);
    const dark = V.night ? 0.5 : V.storm ? 0.3 : 0;
    const tone = (col) => { const m = mix(col, hazeC, 0.22); return dark ? mix(m, V.night ? '#0e1430' : '#5d6a74', dark) : m; };
    const tt = performance.now() / 1000;
    for (const lm of L) {
      const d = LANDMARKS[lm.id]; if (!d || lm.card || !!d.far !== far) continue;
      const sx = W / 2 + (lm.x - cxW) * ppm * (d.far ? 0.25 : LM_PAR);
      if (sx < -450 || sx > W + 450) continue;
      c.save();
      if (d.far) { c.globalAlpha = 0.5; drawLandmark(c, d.kind, sx, gy - 3.5 * ppm, s * 0.5, { t: tt, night: V.night, storm: V.storm, tone: (col) => mix(tone(col), hazeC, 0.3) }); }
      else drawLandmark(c, d.kind, sx, y, s, { t: tt, night: V.night, storm: V.storm, tone });
      c.restore();
    }
  }
  // kartu pos baru saat pertama kali melewati landmark
  function checkLandmarks() {
    const L = ROUTE.landmarks; if (!L || !S) return;
    for (const lm of L) {
      if (S.lmSeen[lm.id] || S.x < lm.x) continue;
      S.lmSeen[lm.id] = true;
      const got = cardsGot();
      if (got.includes(lm.id)) continue;
      got.push(lm.id); store.set('rn.cards', JSON.stringify(got));
      showPostcard(lm.id, got.length);
    }
  }
  let pcTimer = 0;
  function showPostcard(id, n) {
    const d = LANDMARKS[id], el = $('postcard'); if (!d || !el) return;
    $('pcTitle').textContent = d.name; $('pcSub').textContent = d.sub; $('pcCount').textContent = `Kartu pos ${n} dari ${LM_IDS.length}`;
    const cv2 = $('pcArt'), c2 = cv2.getContext('2d');
    drawCardArt(c2, cv2.width, cv2.height, d, true);
    el.hidden = false; el.classList.remove('out'); pcTimer = 5;
    Sound.signalChime();
  }
  function drawCardArt(c2, w, h, d, got) {
    c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, w, h);
    const g = c2.createLinearGradient(0, 0, 0, h); g.addColorStop(0, got ? '#f2b27a' : '#2a3036'); g.addColorStop(0.72, got ? '#f6dcb0' : '#2a3036'); g.addColorStop(0.72, got ? '#7aa652' : '#22272c'); g.addColorStop(1, got ? '#4f7d3c' : '#22272c');
    c2.fillStyle = g; c2.fillRect(0, 0, w, h);
    if (!got) return;
    const big = d.kind === 'volcano' || d.kind === 'peaks' ? 0.07 : d.kind === 'reservoir' ? 0.25 : d.kind === 'market' ? 0.34 : 0.44;
    const s = Math.min(w, h) / 40 * big / 0.44 * 1.15;
    drawLandmark(c2, d.kind, w * (d.kind === 'market' ? 0.55 : 0.5), h * 0.74, s, { t: performance.now() / 1000, night: false });
  }

  function drawFarLand(V) {
    const { c, ppm, gy, p } = V;
    const sawit = MIS.land === 'sawit', night = V.night, storm = V.storm;
    const yV = gy - 5 * ppm, yB = gy - 0.5 * ppm;
    const hazeC = night ? '#1a2142' : storm ? '#8a96a0' : mix('#e8b98f', '#cfe0e6', p);
    const hz = (col, k) => mix(col, hazeC, k);
    const dark = night ? 0.55 : storm ? 0.35 : 0;
    const shade = (col) => (dark ? mix(col, night ? '#0e1430' : '#5d6a74', dark) : col);
    // kampung (paralaks 0,3; objek kecil dan dipudarkan)
    const par = 0.3, s = ppm * 0.3, off = V.camX * ppm * par - (V.pan || 0) * 0.9, period = 1900;
    for (let k = -1; k < Math.ceil(W / period) + 2; k++) {
      const base = k * period - (off % period);
      for (let i = 0; i < 28; i++) {
        const r = hash(i * 3.1 + (sawit ? 9 : 0)), x = base + i * 68 + hash(i) * 30;
        if (x < -60 || x > W + 60) continue;
        const kind = sawit ? (r < 0.3 ? 'stilt' : r < 0.85 ? 'oilpalm' : 'tree') : i % 14 === 9 ? 'mosque' : r < 0.36 ? 'house' : r < 0.6 ? 'palm' : r < 0.8 ? 'banana' : 'bamboo';
        const y = yV;
        const H2 = (col) => shade(hz(col, 0.32));
        if (kind === 'palm' || kind === 'oilpalm') {
          const h = (kind === 'oilpalm' ? 6 + r * 3 : 10 + r * 5) * s;
          c.strokeStyle = H2('#5a4430'); c.lineWidth = Math.max(1, 0.45 * s); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 0.3 * s, y - h * 0.5, x + 0.1 * s, y - h); c.stroke();
          c.strokeStyle = H2('#3f6a3a'); c.lineWidth = Math.max(1, 0.5 * s); c.lineCap = 'round';
          const n = kind === 'oilpalm' ? 9 : 7;
          for (let f = 0; f < n; f++) { const a = Math.PI + f * Math.PI / (n - 1); c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x + Math.cos(a) * 1.8 * s, y - h - 1.2 * s, x + Math.cos(a) * 3 * s, y - h + 1.2 * s); c.stroke(); }
          c.lineCap = 'butt';
        } else if (kind === 'banana') {
          c.fillStyle = H2('#4f8a40');
          for (let f = 0; f < 4; f++) { c.beginPath(); c.ellipse(x + (f - 1.5) * 0.9 * s, y - 3.8 * s - (f % 2) * 0.6 * s, 1.5 * s, 0.6 * s, (f - 1.5) * 0.6, 0, 7); c.fill(); }
        } else if (kind === 'bamboo' || kind === 'tree') {
          c.fillStyle = H2(kind === 'tree' ? '#355a36' : '#4a7a3e'); c.beginPath(); c.ellipse(x, y - 3.4 * s, 3 * s, 3.4 * s, 0, 0, 7); c.fill();
        } else if (kind === 'house' || kind === 'stilt') {
          const w = (7 + r * 4) * s, wh = 3.2 * s, rh = 2.4 * s, lift = kind === 'stilt' ? 1.6 * s : 0;
          if (V.sunShadow > 0.01) { c.fillStyle = `rgba(40,30,20,${0.16 * V.sunShadow})`; c.fillRect(x - w / 2 - 2 * s, y - 0.4 * s, w + s, 0.8 * s); }
          if (lift) { c.fillStyle = H2('#5a4430'); for (let q = 0; q < 4; q++) c.fillRect(x - w / 2 + q * (w / 3) - 0.2 * s, y - lift, 0.4 * s, lift); }
          c.fillStyle = H2(kind === 'stilt' ? '#8a6a48' : r < 0.2 ? '#efe4cf' : '#e6dcc7'); c.fillRect(x - w / 2, y - lift - wh, w, wh);
          c.fillStyle = H2(kind === 'stilt' ? '#6e5236' : '#c9bca4'); c.fillRect(x + w / 2 - s, y - lift - wh, s, wh);
          c.fillStyle = H2(kind === 'stilt' ? '#5a4a3a' : '#b4532f'); c.beginPath(); c.moveTo(x - w / 2 - 0.7 * s, y - lift - wh); c.lineTo(x + w / 2 + 0.7 * s, y - lift - wh); c.lineTo(x + w * 0.3, y - lift - wh - rh); c.lineTo(x - w * 0.3, y - lift - wh - rh); c.closePath(); c.fill();
          c.fillStyle = night ? 'rgba(255,205,120,0.85)' : H2('#3d4a4f');
          c.fillRect(x - w * 0.3, y - lift - wh * 0.75, w * 0.16, wh * 0.4); c.fillRect(x + w * 0.05, y - lift - wh * 0.8, w * 0.12, wh * 0.8);
        } else {
          const w = 12 * s, wh = 4 * s;
          c.fillStyle = H2('#f1ece0'); c.fillRect(x - w / 2, y - wh, w, wh);
          c.fillStyle = H2('#f1ece0'); c.fillRect(x - w * 0.22, y - wh - 1.4 * s, w * 0.44, 1.4 * s);
          onionDome(c, x, y - wh - 1.4 * s, w * 0.24, w * 0.42, H2('#1f8f86'), null, H2('#d9b64a'));
          c.fillStyle = H2('#f1ece0'); c.fillRect(x + w / 2 + 0.6 * s, y - 12 * s, 0.8 * s, 12 * s);
          c.fillRect(x + w / 2 + 0.35 * s, y - 9 * s, 1.3 * s, 0.4 * s);
          onionDome(c, x + w / 2 + 1 * s, y - 12 * s, 0.55 * s, 1.5 * s, H2('#1f8f86'), null, H2('#d9b64a'));
          if (night) { c.fillStyle = 'rgba(255,220,150,0.9)'; c.fillRect(x - w * 0.25, y - wh * 0.7, w * 0.5, wh * 0.25); }
        }
      }
    }
    // dataran di seberang rel: sawah berpetak (Jawa) atau kebun dengan tanah merah (Sumatra)
    const g = c.createLinearGradient(0, yV, 0, yB);
    g.addColorStop(0, shade(hz(sawit ? '#5a6a3a' : '#7ea46a', 0.3))); g.addColorStop(1, shade(sawit ? '#4f6234' : '#6e9c50'));
    c.fillStyle = g; c.fillRect(0, yV, W, yB - yV + 1);
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const t0 = r / rows, t1 = (r + 1) / rows;
      const y0 = yV + (yB - yV) * Math.pow(t0, 1.4), y1 = yV + (yB - yV) * Math.pow(t1, 1.4);
      const pr = lerp(0.34, 0.85, (t0 + t1) / 2), of = V.camX * ppm * pr - (V.pan || 0) * lerp(0.85, 0.5, t0), cell = lerp(4, 11, t0) * ppm;
      for (let k = -1; k < W / cell + 2; k++) {
        const i = Math.floor(of / cell) + k, x0 = i * cell - of;
        if (hash(i * 3.3 + r * 7.7) < 0.42) {
          c.fillStyle = sawit ? `rgba(150,90,60,${0.25 + 0.1 * t0})` : night ? 'rgba(80,90,150,0.25)' : `rgba(214,190,170,${0.22 + 0.1 * t0})`;
          c.fillRect(x0 + 1, y0 + 0.5, cell - 2, y1 - y0 - 1);
        }
      }
      c.strokeStyle = sawit ? 'rgba(120,150,80,0.35)' : 'rgba(160,200,110,0.4)'; c.lineWidth = 0.8 + r * 0.25;
      c.beginPath(); c.moveTo(0, y1); c.lineTo(W, y1); c.stroke();
    }
    // petani bercaping dan burung kuntul di sawah
    if (!sawit && !night && !storm) {
      const of = V.camX * ppm * 0.6 - (V.pan || 0) * 0.7, ps = ppm * 0.55;
      for (let k = 0; k < 7; k++) {
        const span = W + 400, x = ((k * 263 + hash(k) * 120 - of) % span + span) % span - 100;
        if (x < -20 || x > W + 20) continue;
        const y = yV + (yB - yV) * (0.3 + hash(k + 3) * 0.35);
        if (k % 3 === 0) {
          if (V.sunShadow > 0.01) { c.fillStyle = `rgba(30,24,16,${0.18 * V.sunShadow})`; c.beginPath(); c.ellipse(x - 0.5 * ps, y, 0.6 * ps, 0.12 * ps, 0, 0, 7); c.fill(); }
          c.fillStyle = '#3b4a5a'; c.fillRect(x - 0.18 * ps, y - 1.1 * ps, 0.36 * ps, 1.1 * ps);
          c.fillStyle = '#a8704a'; c.beginPath(); c.arc(x, y - 1.3 * ps, 0.18 * ps, 0, 7); c.fill();
          c.fillStyle = '#d9c38a'; c.beginPath(); c.moveTo(x - 0.6 * ps, y - 1.28 * ps); c.lineTo(x + 0.6 * ps, y - 1.28 * ps); c.lineTo(x, y - 1.75 * ps); c.closePath(); c.fill();
        } else {
          c.fillStyle = '#f7f4ec'; c.beginPath(); c.ellipse(x, y - 0.4 * ps, 0.4 * ps, 0.22 * ps, -0.3, 0, 7); c.fill();
          c.strokeStyle = '#f7f4ec'; c.lineWidth = Math.max(0.8, 0.12 * ps); c.beginPath(); c.moveTo(x + 0.25 * ps, y - 0.5 * ps); c.quadraticCurveTo(x + 0.5 * ps, y - 1 * ps, x + 0.4 * ps, y - 1.1 * ps); c.stroke();
        }
      }
    }
  }

  function inBridge(x) { const b = ROUTE.bridge; return !!b && x > b.from && x < b.to; }
  const nearCrossing = (x, d) => ROUTE.crossings.some((cr) => Math.abs(x - cr.x) < d);
  const nearTunnel = (x) => !!ROUTE.tunnel && x > ROUTE.tunnel.from - 75 && x < ROUTE.tunnel.to + 75;
  function nearStation(x) { return allStations().some((s) => x > s.x - 95 && x < s.x + 25); }

  function drawBackProps(V) {
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    // tiang telegraf dan kabel
    const poleY = gy - 1.4 * ppm;
    const first = Math.floor(wx0 / 50) * 50 + 20;
    c.strokeStyle = 'rgba(40,36,30,0.75)'; c.lineWidth = 1;
    for (let px = first; px < wx1 + 50; px += 50) {
      if (inBridge(px) || nearTunnel(px)) continue;
      const sx = X(px), top = poleY - 7 * ppm;
      if (V.sunShadow > 0.01) { c.fillStyle = `rgba(0,0,0,${0.18 * V.sunShadow})`; c.beginPath(); c.moveTo(sx, poleY); c.lineTo(sx - 4 * ppm, poleY + 0.9 * ppm); c.lineTo(sx - 3.6 * ppm, poleY + 1.0 * ppm); c.lineTo(sx + 0.3 * ppm, poleY); c.closePath(); c.fill(); }
      c.fillStyle = '#4a3b2c'; c.fillRect(sx - 0.12 * ppm, top, 0.24 * ppm, 7 * ppm);
      c.fillRect(sx - 0.7 * ppm, top + 0.4 * ppm, 1.4 * ppm, 0.15 * ppm);
      const nx = X(px + 50);
      for (let k = -1; k <= 1; k += 2) {
        c.beginPath(); c.moveTo(sx + k * 0.6 * ppm, top + 0.4 * ppm);
        c.quadraticCurveTo((sx + nx) / 2, top + 1.6 * ppm, nx + k * 0.6 * ppm, top + 0.4 * ppm); c.stroke();
      }
    }
    // pepohonan
    const slot = 13;
    for (let i = Math.floor(wx0 / slot) - 1; i < wx1 / slot + 1; i++) {
      const h = hash(i);
      if (h > 0.5) continue;
      const tx = i * slot + hash(i + 0.37) * 9;
      if (nearStation(tx) || inBridge(tx) || nearCrossing(tx, 12) || nearTunnel(tx)) continue;
      const sx = X(tx), base = gy - 1.2 * ppm - hash(i + 0.9) * 1.2 * ppm;
      const kind = hash(i + 0.11);
      const col = mix('#24402c', '#335c35', p), col2 = mix('#2f5235', '#3f7040', p);
      if (MIS.land === 'sawit') {
        if (V.sunShadow > 0.01) { c.fillStyle = `rgba(0,0,0,${0.2 * V.sunShadow})`; c.beginPath(); c.ellipse(sx - 1.2 * ppm, base + 0.2 * ppm, 2.4 * ppm, 0.35 * ppm, 0, 0, 7); c.fill(); }
        if (kind < 0.7) { // pohon sawit: batang pendek kasar, tajuk lebat
          const ht = (4.5 + hash(i + 2) * 2.5) * ppm;
          c.fillStyle = mix('#3e3022', '#55422e', p); c.fillRect(sx - 0.35 * ppm, base - ht, 0.7 * ppm, ht);
          c.strokeStyle = col2; c.lineWidth = 0.36 * ppm; c.lineCap = 'round';
          for (let f = 0; f < 11; f++) {
            const a = -Math.PI / 2 + (f - 5) * 0.32, len = 3.6 * ppm;
            c.beginPath(); c.moveTo(sx, base - ht);
            c.quadraticCurveTo(sx + Math.cos(a) * len * 0.6, base - ht - 1.2 * ppm + Math.abs(f - 5) * 0.15 * ppm, sx + Math.cos(a) * len, base - ht + Math.sin(a) * len * 0.45 + 1.5 * ppm);
            c.stroke();
          }
          c.lineCap = 'butt';
        } else { // pohon hutan besar bertajuk lebar
          const ht = (11 + hash(i + 2) * 6) * ppm;
          c.fillStyle = mix('#4a3a2c', '#5e4a36', p); c.fillRect(sx - 0.3 * ppm, base - ht * 0.7, 0.6 * ppm, ht * 0.7);
          c.fillStyle = col;
          [[0, 0, 4.2], [-2.6, 0.9, 2.8], [2.8, 0.8, 3]].forEach(([dx, dy, r]) => { c.beginPath(); c.ellipse(sx + dx * ppm, base - ht + dy * ppm, r * ppm, r * 0.62 * ppm, 0, 0, 7); c.fill(); });
          if (V.rimA > 0.05) { c.save(); c.globalAlpha = V.rimA * 0.5; c.strokeStyle = V.rim; c.lineWidth = Math.max(1, 0.1 * ppm); c.beginPath(); c.ellipse(sx, base - ht, 4.2 * ppm, 2.6 * ppm, 0, Math.PI * 1.2, Math.PI * 1.9); c.stroke(); c.restore(); }
        }
        continue;
      }
      if (V.sunShadow > 0.01) { c.fillStyle = `rgba(0,0,0,${0.2 * V.sunShadow})`; c.beginPath(); c.ellipse(sx - 1.2 * ppm, base + 0.2 * ppm, 2.2 * ppm, 0.35 * ppm, 0, 0, 7); c.fill(); }
      if (kind < 0.45) { // kelapa
        const ht = (8 + hash(i + 2) * 5) * ppm, lean = (hash(i + 3) - 0.5) * 2 * ppm;
        c.strokeStyle = mix('#4b3a2a', '#6a523a', p); c.lineWidth = 0.35 * ppm;
        c.beginPath(); c.moveTo(sx, base); c.quadraticCurveTo(sx + lean * 0.3, base - ht * 0.6, sx + lean, base - ht); c.stroke();
        c.strokeStyle = col2; c.lineWidth = 0.32 * ppm; c.lineCap = 'round';
        for (let f = 0; f < 7; f++) {
          const ang = -Math.PI / 2 + (f - 3) * 0.5;
          const len = 3.4 * ppm;
          const ex = sx + lean + Math.cos(ang) * len, ey = base - ht + Math.sin(ang) * len * 0.6 + 1.6 * ppm;
          c.beginPath(); c.moveTo(sx + lean, base - ht);
          c.quadraticCurveTo(sx + lean + Math.cos(ang) * len * 0.6, base - ht - 0.9 * ppm, ex, ey); c.stroke();
        }
        if (V.rimA > 0.05) {
          c.save(); c.globalAlpha = V.rimA * 0.7; c.strokeStyle = V.rim; c.lineWidth = Math.max(1, 0.08 * ppm);
          for (let f = 4; f < 7; f++) {
            const ang = -Math.PI / 2 + (f - 3) * 0.5, len = 3.4 * ppm;
            c.beginPath(); c.moveTo(sx + lean + 1, base - ht - 1);
            c.quadraticCurveTo(sx + lean + Math.cos(ang) * len * 0.6 + 1, base - ht - 0.9 * ppm - 1, sx + lean + Math.cos(ang) * len + 1, base - ht + Math.sin(ang) * len * 0.6 + 1.6 * ppm - 1);
            c.stroke();
          }
          c.restore();
        }
        c.lineCap = 'butt';
      } else if (kind < 0.75) { // pisang
        c.fillStyle = mix('#4b5a2e', '#5f7a35', p);
        c.fillRect(sx - 0.2 * ppm, base - 3 * ppm, 0.4 * ppm, 3 * ppm);
        c.fillStyle = col2;
        for (let f = 0; f < 4; f++) {
          c.save(); c.translate(sx, base - 3 * ppm); c.rotate(-1.2 + f * 0.8);
          c.beginPath(); c.ellipse(1.4 * ppm, 0, 1.6 * ppm, 0.45 * ppm, 0, 0, Math.PI * 2); c.fill(); c.restore();
        }
      } else { // semak
        c.fillStyle = col;
        c.beginPath(); c.ellipse(sx, base - 0.8 * ppm, 2.4 * ppm, 1.4 * ppm, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(sx + 1.5 * ppm, base - 1.2 * ppm, 1.6 * ppm, 1.2 * ppm, 0, 0, Math.PI * 2); c.fill();
      }
    }
  }

  function drawGround(V, part = 'all') {
    const { c, ppm, gy, X, p } = V;
    const yTop = gy + 1.4 * ppm;
    const b = ROUTE.bridge || { from: -1e6, to: -1e6 + 20 };
    const bx0 = X(b.from + 6), bx1 = X(b.to - 6);
    const onScreen = bx1 > -40 && bx0 < W + 40;
    if (part !== 'bed') {
    // sawah depan: gradasi gelap ke arah kamera
    const g = c.createLinearGradient(0, gy, 0, H);
    g.addColorStop(0, mix('#5a8540', '#78a84c', p)); g.addColorStop(1, mix('#28431f', '#3d6534', p));
    c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
    // petak sawah berperspektif: pematang melintang makin rapat ke kejauhan,
    // pematang membujur menyebar ke arah kamera, sebagian petak tergenang memantulkan langit
    const rows = 6, cell = 14;
    const rowY = (t) => yTop + (H - yTop) * Math.pow(t, 1.55);
    const at = (sx, t) => sx + (V.Xn(sx) - sx) * Math.pow(t, 1.55);
    const i0 = Math.floor((V.wx0 - 120) / cell), i1 = Math.ceil((V.wx1 + 120) / cell);
    c.save();
    c.fillStyle = V.water;
    const sawit = MIS.land === 'sawit';
    if (sawit) {
      // tanah kebun kemerahan di antara barisan sawit
      c.globalAlpha = 0.35; c.fillStyle = mix('#7a4a2c', '#9a6440', p); c.fillRect(0, yTop, W, H - yTop); c.globalAlpha = 1;
      // barisan sawit muda berperspektif: makin dekat makin besar
      for (let r = rows - 1; r >= 0; r--) {
        const t = (r + 0.5) / rows, y = rowY(t), sc = (0.7 + Math.pow(t, 1.55) * 1.6) * ppm;
        for (let i = i0; i < i1; i++) {
          const x = at(X((i + 0.5) * cell), t);
          if (x < -3 * sc || x > W + 3 * sc) continue;
          c.fillStyle = mix('#3c2a1a', '#4e3824', p); c.fillRect(x - 0.18 * sc, y - 1.1 * sc, 0.36 * sc, 1.1 * sc);
          c.strokeStyle = mix('#24452a', '#356a36', p); c.lineWidth = Math.max(1, 0.22 * sc); c.lineCap = 'round';
          for (let f = 0; f < 8; f++) {
            const a = -Math.PI / 2 + (f - 3.5) * 0.42;
            c.beginPath(); c.moveTo(x, y - 1.1 * sc);
            c.quadraticCurveTo(x + Math.cos(a) * 1.1 * sc, y - 1.1 * sc + Math.sin(a) * 0.9 * sc - 0.4 * sc, x + Math.cos(a) * 1.9 * sc, y - 1.1 * sc + Math.sin(a) * 0.7 * sc + 0.4 * sc);
            c.stroke();
          }
          c.lineCap = 'butt';
        }
      }
    }
    for (let i = sawit ? i1 : i0; i < i1; i++) {
      const xa = X(i * cell), xb = X((i + 1) * cell);
      for (let r = 0; r < rows; r++) {
        if (hash(i * 7.31 + r * 1.93) > 0.45) continue;
        const t0 = r / rows + 0.025, t1 = (r + 1) / rows - 0.025;
        const q = [[at(xa, t0) + 2, rowY(t0)], [at(xb, t0) - 2, rowY(t0)], [at(xb, t1) - 3, rowY(t1)], [at(xa, t1) + 3, rowY(t1)]];
        if (Math.max(q[1][0], q[2][0]) < 0 || Math.min(q[0][0], q[3][0]) > W) continue;
        c.globalAlpha = (V.night ? 0.2 : 0.34) * (1 - r / rows * 0.45);
        c.beginPath(); q.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      }
    }
    c.globalAlpha = sawit ? 0.3 : 0.5; c.strokeStyle = sawit ? mix('#8a6a48', '#b08a60', p) : mix('#6b9446', '#93c05e', p);
    for (let r = 1; r < rows; r++) {
      const y = rowY(r / rows);
      c.lineWidth = 1 + r * 0.45; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.lineWidth = 1.2; c.beginPath();
    for (let i = i0; i < i1; i++) { const xa = X(i * cell); c.moveTo(xa, yTop); c.lineTo(V.Xn(xa), H); }
    c.stroke();
    c.restore();

    // sungai di bawah jembatan, tanpa pilar tengah (jembatan busur bentang penuh)
    if (onScreen) {
      const bank = [[bx0 - 4 * ppm, gy], [bx1 + 4 * ppm, gy], [V.Xn(bx1) + 3 * ppm, H], [V.Xn(bx0) - 3 * ppm, H]];
      c.fillStyle = mix('#5e4f3b', '#7b6a4e', p);
      c.beginPath(); bank.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      const wTop = gy + 2.6 * ppm;
      const wq = [[bx0 + 2 * ppm, wTop], [bx1 - 2 * ppm, wTop], [V.Xn(bx1) - 4 * ppm, H], [V.Xn(bx0) + 4 * ppm, H]];
      const wg = c.createLinearGradient(0, wTop, 0, H);
      wg.addColorStop(0, V.night ? '#2a3360' : mix('#6d8fa0', '#8cc0d2', p)); wg.addColorStop(1, V.night ? '#121838' : mix('#2c4a58', '#3f7a8f', p));
      const waterPath = () => { c.beginPath(); wq.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
      c.fillStyle = wg; waterPath(); c.fill();
      // riak air
      c.save(); waterPath(); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
      for (let r = 0; r < 7; r++) {
        const y = wTop + (H - wTop) * Math.pow((r + 0.5) / 7, 1.4);
        const ph = (performance.now() / 900 + r) % 1;
        c.beginPath(); c.moveTo(bx0 + ph * 30, y); c.lineTo(bx0 + ph * 30 + 18, y); c.moveTo(bx1 - 80 + ph * 40, y); c.lineTo(bx1 - 60 + ph * 40, y); c.stroke();
      }
      c.restore();
      drawBridgeReflection(V, wTop, () => { waterPath(); c.clip(); });
      // kepala jembatan beton dengan muka atas
      for (const [ax, dir] of [[bx0, -1], [bx1, 1]]) {
        const w = 4 * ppm, x = dir < 0 ? ax - w : ax;
        c.fillStyle = mix('#8d877c', '#a8a196', p); c.fillRect(x, gy + 0.3 * ppm, w, 4.2 * ppm);
        c.fillStyle = mix('#a8a196', '#c3bcb0', p); c.fillRect(x, gy - 0.2 * ppm, w, 0.5 * ppm);
        c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, gy + 3.6 * ppm, w, 0.9 * ppm);
      }
    }
    }
    if (part === 'field') return;

    // balas: muka atas terlihat dari atas, lereng depan lebih gelap
    const yFar = gy - 0.6 * ppm;
    c.fillStyle = mix('#8d8275', '#a59a8c', p); c.fillRect(0, yFar, W, gy + 0.5 * ppm - yFar);
    c.fillStyle = mix('#5d5349', '#766a5e', p);
    c.beginPath(); c.moveTo(0, gy + 0.5 * ppm); c.lineTo(W, gy + 0.5 * ppm); c.lineTo(W, yTop); c.lineTo(0, yTop); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, yTop - 0.2 * ppm, W, 0.2 * ppm);
    if (onScreen) {
      // lantai baja jembatan menggantikan balas
      c.fillStyle = ROUTE.bridge && ROUTE.bridge.wood ? (V.night ? '#2c2219' : '#5a4430') : V.night ? '#2a3038' : '#4a535a'; c.fillRect(bx0 - 2 * ppm, yFar, bx1 - bx0 + 4 * ppm, yTop - yFar);
    }
    // bantalan beton dalam perspektif (ujung jauh sedikit menyempit ke tengah)
    c.fillStyle = mix('#6f6a63', '#8b857b', p);
    const step = 1.2;
    for (let m = Math.floor(V.wx0 / step) * step; m < V.wx1; m += step) {
      const sx = X(m), fxp = W * 0.5 + (sx - W * 0.5) * 0.985;
      c.beginPath();
      c.moveTo(fxp, yFar + 0.12 * ppm); c.lineTo(fxp + 0.26 * ppm, yFar + 0.12 * ppm);
      c.lineTo(sx + 0.3 * ppm, gy + 0.32 * ppm); c.lineTo(sx, gy + 0.32 * ppm); c.closePath(); c.fill();
    }
    // rumput liar di antara rel (jalur cabang lama)
    if (MIS.grass) {
      c.fillStyle = V.night ? 'rgba(40,70,40,0.8)' : 'rgba(90,130,60,0.85)';
      for (let m = Math.floor(V.wx0); m < V.wx1; m += 1) { if (hash(m * 1.7) > 0.55) continue; const sx = X(m + hash(m) * 0.8), hgt = (0.2 + hash(m * 3.1) * 0.35) * ppm; c.beginPath(); c.moveTo(sx - 0.25 * ppm, gy + 0.2 * ppm); c.lineTo(sx, gy + 0.2 * ppm - hgt); c.lineTo(sx + 0.25 * ppm, gy + 0.2 * ppm); c.fill(); }
    }
    // rel jauh (tipis) dan rel dekat
    c.fillStyle = '#7d8487'; c.fillRect(0, gy - 0.48 * ppm, W, 0.13 * ppm);
    c.fillStyle = '#9aa0a2'; c.fillRect(0, gy - 0.12 * ppm, W, 0.24 * ppm);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, gy - 0.12 * ppm, W, 1); c.fillRect(0, gy - 0.48 * ppm, W, 1);
    if (V.rimA > 0.05) { c.save(); c.globalAlpha = V.rimA * 0.6; c.fillStyle = V.rim; c.fillRect(0, gy - 0.12 * ppm, W, 1.2); c.fillRect(0, gy - 0.48 * ppm, W, 1); c.restore(); }
    // jalan raya sejajar rel (misi dengan bus pesaing)
    if (ROUTE.rival) {
      const ry0 = gy + 4.6 * ppm, ry1 = gy + 8 * ppm;
      c.fillStyle = '#3a3b3e'; c.fillRect(0, ry0, W, ry1 - ry0);
      c.fillStyle = '#4a4b4f'; c.fillRect(0, ry0, W, 0.25 * ppm);
      c.fillStyle = 'rgba(240,235,220,0.7)';
      const dash = 6;
      for (let x = Math.floor(V.wx0 / dash) * dash; x < V.wx1; x += dash * 2) c.fillRect(X(x), gy + 6.2 * ppm, 3 * ppm, 0.18 * ppm);
    }
    // ujung rel (penahan)
    const bs = X(ROUTE.bufferStop);
    if (bs > -20 && bs < W + 20) {
      c.fillStyle = '#c23b2e'; c.fillRect(bs, gy - 1.6 * ppm, 1 * ppm, 1.5 * ppm);
      c.fillStyle = '#f1e9d6'; c.fillRect(bs, gy - 1.2 * ppm, 1 * ppm, 0.3 * ppm);
      c.fillStyle = '#5e5248'; c.fillRect(bs + 0.2 * ppm, gy - 0.1 * ppm, 3 * ppm, 0.4 * ppm);
    }
  }

  function person(c, x, y, s, seed, opt) {
    const o = opt === true ? { basket: true } : opt || {};
    const basket = o.basket;
    c.fillStyle = 'rgba(20,16,10,0.22)'; c.beginPath(); c.ellipse(x - 0.35 * s, y, 0.55 * s, 0.1 * s, 0, 0, 7); c.fill(); // bayangan kontak
    const cols = ['#c0392b', '#2e86ab', '#e1a63b', '#6c4f9e', '#3c8d5a', '#d35f8d', '#e4d6b8'];
    c.fillStyle = o.color || cols[Math.floor(hash(seed) * cols.length)];
    c.fillRect(x - 0.28 * s, y - 1.25 * s, 0.56 * s, 0.75 * s);
    c.fillStyle = '#2b2b33'; c.fillRect(x - 0.24 * s, y - 0.5 * s, 0.2 * s, 0.5 * s); c.fillRect(x + 0.04 * s, y - 0.5 * s, 0.2 * s, 0.5 * s);
    c.fillStyle = '#c99a72'; c.beginPath(); c.arc(x, y - 1.47 * s, 0.22 * s, 0, Math.PI * 2); c.fill();
    if (basket) {
      c.fillStyle = '#a77b3f'; c.beginPath(); c.ellipse(x, y - 1.78 * s, 0.42 * s, 0.17 * s, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5fa04a'; c.beginPath(); c.arc(x - 0.12 * s, y - 1.9 * s, 0.13 * s, 0, Math.PI * 2); c.arc(x + 0.14 * s, y - 1.88 * s, 0.12 * s, 0, Math.PI * 2); c.fill();
    }
    if (o.helmet) {
      c.fillStyle = '#f2c230'; c.beginPath(); c.arc(x, y - 1.55 * s, 0.25 * s, Math.PI, 0); c.fill();
      c.fillStyle = '#e8e2d0'; c.fillRect(x - 0.28 * s, y - 1.0 * s, 0.56 * s, 0.08 * s);
    }
    if (o.umbrella) {
      const uc = ['#2b6cb0', '#c0392b', '#2f2f36', '#3c8d5a', '#e1a63b'][Math.floor(hash(seed + 9) * 5)];
      c.strokeStyle = '#333'; c.lineWidth = Math.max(1, 0.06 * s);
      c.beginPath(); c.moveTo(x + 0.2 * s, y - 1.1 * s); c.lineTo(x + 0.2 * s, y - 2.25 * s); c.stroke();
      c.fillStyle = uc; c.beginPath(); c.arc(x + 0.2 * s, y - 2.2 * s, 0.75 * s, Math.PI, 0); c.fill();
    }
  }

  // ---------- penumpang di peron depan: menunggu, berkumpul ke pintu, antre, naik ----------
  const crowds = new Map();
  const PAX_SHIRT = ['#c0392b', '#2e86ab', '#e1a63b', '#6c4f9e', '#3c8d5a', '#d35f8d', '#e4d6b8', '#2bb3a3', '#e98a3c', '#6a8caf'];
  const PAX_PANTS = ['#2c3e50', '#3b3b3b', '#5a4632', '#1f3a5f', '#4a4a55'];
  const PAX_SKIN = ['#8d5a3b', '#a8704a', '#c48a5f', '#7a4d32'];
  const PAX_HIJAB = ['#2f6f73', '#b04a5a', '#e2c6a0', '#3f4d7a', '#7a5a9a'];
  const DOOR_W = 20 / 12, PAX_SCALE = 1.0; // orang dalam skala nyata (1,65 m)
  const PLAT_FROM = -95, PLAT_TO = 25;
  // pintu rangkaian: jarak (m) dari moncong ke tepi kiri tiap pintu
  function doorOffsets() {
    const out = [];
    for (let k = 0; k < N_COACH; k++) {
      const F = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      [6, 214].forEach((d0) => out.push(F + (240 - d0) / 12));
    }
    return out;
  }
  function makeCrowd(si) {
    const s = ROUTE.stations[si];
    const n = S.waiting[si];
    const spacing = n > 16 ? 2.5 : 4.1;
    const people = [];
    for (let k = 0; k < n; k++) {
      const seed = k + si * 13, r = hash(seed * 3.1 + 0.7);
      const kind = r < 0.1 ? 'elder' : r < 0.28 ? 'hijab' : (s.traders || s.travelers) && hash(k + 3.3) < 0.6 ? 'trader' : r < 0.45 ? 'backpack' : 'adult';
      people.push({
        role: 'board', state: 'wait', kind, seed,
        x: s.x - 72 + k * spacing + hash(k + si * 7) * 1.8, z: 0.25 + hash(seed + 5.5) * 0.6,
        shirt: PAX_SHIRT[Math.floor(hash(seed) * PAX_SHIRT.length)], pants: PAX_PANTS[Math.floor(hash(seed + 1.1) * PAX_PANTS.length)],
        skin: PAX_SKIN[Math.floor(hash(seed + 2.2) * PAX_SKIN.length)], hijab: PAX_HIJAB[Math.floor(hash(seed + 4.4) * PAX_HIJAB.length)],
        umbrella: s.umbrellas && hash(k + 1.7) < 0.75, speed: kind === 'elder' ? 0.65 : 1.25 + hash(seed + 6.6) * 0.3,
        delay: 0.2 + hash(seed + 8.8) * 3, ph: hash(seed + 9.9) * 6, dir: 1, alpha: 1, k: 0,
      });
    }
    const ppka = { role: 'ppka', state: 'stand', kind: 'ppka', x: s.x - 40, z: 0.86, shirt: '#f4f1e8', pants: '#2a3442', skin: '#a8704a', dir: 1, alpha: 1, ph: 0 };
    const started = S.phase === 'dwell' && S.st === si && S.dwell.step !== 'open' && S.dwell.step !== 'board';
    return { si, s, people, ppka, doors: null, alightLeft: 0, spawnT: 0, kond: null, paddle: 0, whistled: !!started, boardDone: !!started };
  }
  function crowdDoors(cr) {
    return doorOffsets().map((mL) => ({ left: S.x - mL, cx: S.x - mL + DOOR_W / 2, q: [], busy: false, alight: 0 }));
  }
  function walkTo(p, tx, tz, dt, speed) {
    const dx = tx - p.x, dz = (tz - p.z) * 4, dist = Math.hypot(dx, dz);
    if (dist < 0.05) { p.moving = false; return true; }
    const sp = Math.min(speed * dt * (dist < 0.4 ? 0.6 : 1), dist);
    p.x += (dx / dist) * sp; p.z += (dz / dist) * sp / 4;
    if (Math.abs(dx) > 0.02) p.dir = Math.sign(dx);
    const before = Math.floor(p.ph / Math.PI);
    p.ph += sp * 3.2; p.moving = true;
    if (Math.floor(p.ph / Math.PI) !== before && Math.random() < 0.35) Sound.footstep(0.008 + Math.random() * 0.006);
    return false;
  }
  function spawnAlighter(cr, d) {
    const s = cr.s, seed = Math.random() * 100;
    const exitX = s.x - 48 + (Math.random() - 0.5) * 16;
    cr.people.push({
      role: 'alight', state: 'out', k: 0, door: d, x: d.cx, z: 0.04, kind: Math.random() < 0.25 ? 'hijab' : Math.random() < 0.3 ? 'backpack' : 'adult',
      shirt: PAX_SHIRT[Math.floor(hash(seed) * PAX_SHIRT.length)], pants: PAX_PANTS[Math.floor(hash(seed + 1) * PAX_PANTS.length)],
      skin: PAX_SKIN[Math.floor(hash(seed + 2) * PAX_SKIN.length)], hijab: PAX_HIJAB[Math.floor(hash(seed + 3) * PAX_HIJAB.length)],
      speed: 1.3 + Math.random() * 0.3, ph: 0, dir: exitX < d.cx ? -1 : 1, alpha: 1, exitX, exitZ: 0.85 + Math.random() * 0.1,
    });
    Sound.boardThump();
  }
  function updateCrowds(dt) {
    if (!S || MIS.freight) return;
    // buat kerumunan untuk stasiun yang mendekat, hapus yang sudah jauh di belakang
    ROUTE.stations.forEach((s, si) => {
      const near = s.x - S.x < 420 && S.x - s.x < 260;
      if (near && !crowds.has(si)) crowds.set(si, makeCrowd(si));
      if (!near && crowds.has(si) && si !== S.st) crowds.delete(si);
    });
    const dwellHere = (si) => S.phase === 'dwell' && S.st === si;
    for (const cr of crowds.values()) {
      const s = cr.s, si = cr.si, here = dwellHere(si), step = here ? S.dwell.step : null;
      const approaching = S.phase === 'run' && S.st + 1 === si && S.x > s.x - 170 && !s.final;
      // pintu terbuka: tetapkan pintu nyata dan antrean
      if (here && (step === 'board' || step === 'alight') && !cr.doors) {
        cr.doors = crowdDoors(cr);
        if (step === 'board') {
          const want = S.aboard > 6 ? Math.min(cr.doors.length, 2 + Math.floor(Math.random() * 3)) : 0;
          for (let i = 0; i < want; i++) cr.doors[Math.floor(Math.random() * cr.doors.length)].alight++;
          const last = cr.doors.reduce((a, d) => (d.cx < a.cx ? d : a));
          cr.kond = { role: 'kond', state: 'stand', kind: 'kond', x: last.cx + 1.1, z: 0.12, shirt: '#2b4c7e', pants: '#1e2a3a', skin: '#8d5a3b', dir: -1, alpha: 1, ph: 0, door: last };
          cr.people.filter((p) => p.role === 'board' && p.state !== 'in')
            .sort((a, b) => Math.abs(a.x - S.x) - Math.abs(b.x - S.x))
            .forEach((p) => { p.door = cr.doors.reduce((a, d) => (Math.abs(d.cx - p.x) < Math.abs(a.cx - p.x) ? d : a)); p.door.q.push(p); p.state = 'go'; p.sit = false; });
        } else {
          cr.alightLeft = Math.min(14, Math.max(4, Math.round(S.aboard / 3)));
        }
      }
      if (here && step === 'alight' && cr.alightLeft > 0) {
        cr.spawnT -= dt;
        if (cr.spawnT <= 0) { cr.spawnT = 0.22; cr.alightLeft--; spawnAlighter(cr, cr.doors[Math.floor(Math.random() * cr.doors.length)]); }
      }
      // penumpang turun didahulukan di tiap pintu
      if (cr.doors && here && step === 'board') {
        for (const d of cr.doors) {
          if (d.alight > 0 && !d.busy) { d.alight--; d.busy = true; spawnAlighter(cr, d); }
        }
      }
      let left = 0;
      for (const p of cr.people) {
        p.moving = false;
        if (p.role === 'alight') {
          if (p.state === 'out') {
            p.k += dt / 0.55;
            if (p.k >= 1) { p.state = 'leave'; p.door.busy = false; }
          } else if (p.state === 'leave') {
            if (walkTo(p, p.exitX, p.exitZ, dt, p.speed)) p.state = 'fade';
          } else if (p.state === 'fade') p.alpha = Math.max(0, p.alpha - dt * 2);
          continue;
        }
        if (p.state === 'in') continue;
        left++;
        if (p.state === 'wait' || p.state === 'gather' || p.state === 'ready') {
          // kereta mendekat: berjalan ke perkiraan posisi pintu di dekat garis kuning
          if (approaching && p.state === 'wait') { p.delay -= dt; if (p.delay <= 0) p.state = 'gather'; }
          if (p.state === 'gather') {
            if (p.tx === undefined) {
              const offs = doorOffsets().map((mL) => s.x - mL + DOOR_W / 2);
              const dc = offs.reduce((a, x) => (Math.abs(x - p.x) < Math.abs(a - p.x) ? x : a));
              p.tx = dc + (hash(p.seed + 12.1) - 0.5) * 2.6; p.tz = 0.14 + hash(p.seed + 13.3) * 0.3;
            }
            if (walkTo(p, p.tx, p.tz, dt, p.speed)) p.state = 'ready';
          }
          continue;
        }
        if (p.state === 'go' || p.state === 'queue') {
          const d = p.door, idx = d.q.indexOf(p), slot = idx + (d.alight > 0 || (d.busy && idx === 0 && !d.boarding) ? 1 : 0);
          const side = p.side || (p.side = Math.sign(p.x - d.cx) || 1);
          const tx = slot === 0 ? d.cx : d.cx + side * (0.5 + 0.55 * slot), tz = slot === 0 ? 0.04 : 0.1 + Math.min(0.3, 0.05 * slot);
          if (walkTo(p, tx, tz, dt, p.speed)) {
            p.state = 'queue';
            if (idx === 0 && !d.busy && d.alight === 0) { p.state = 'step'; p.k = 0; d.busy = true; d.boarding = true; p.dir = 1; Sound.boardThump(); }
          } else p.state = 'go';
          continue;
        }
        if (p.state === 'step') {
          p.k += dt / (p.kind === 'elder' ? 0.95 : 0.5);
          if (p.k >= 1) {
            p.state = 'in'; p.door.busy = false; p.door.boarding = false; p.door.q.shift();
            if (S.waiting[si] > 0) { S.waiting[si]--; S.aboard++; }
          }
        }
      }
      cr.left = left;
      cr.people = cr.people.filter((p) => !(p.role === 'alight' && p.state === 'fade' && p.alpha <= 0));
      // semboyan berangkat: PPKA mengangkat tongkat hijau, kondektur meniup peluit lalu naik
      const sendOff = here && (step === 'close' || step === 'signal') && cr.boardDone;
      cr.paddle = clamp(cr.paddle + (sendOff ? dt : -dt) * 2.2, 0, 1);
      if (cr.kond && sendOff) {
        const kd = cr.kond;
        if (!cr.whistled) { cr.whistled = true; cr.whistleT = 0; Sound.guardWhistle(); }
        cr.whistleT += dt;
        kd.whistle = cr.whistleT < 1.5;
        if (cr.whistleT > 1.6 && kd.state === 'stand') { kd.state = 'step'; kd.k = 0; kd.x = kd.door.cx; Sound.boardThump(); }
        if (kd.state === 'step') { kd.k += dt / 0.6; if (kd.k >= 1) kd.state = 'in'; }
      }
    }
  }
  // dipanggil saat waktu tunggu habis: penumpang tersisa langsung naik
  function forceBoard(cr) {
    cr.people.forEach((p) => { if (p.role === 'board' && p.state !== 'in') { p.state = 'in'; if (S.waiting[cr.si] > 0) { S.waiting[cr.si]--; S.aboard++; } } });
    if (cr.doors) cr.doors.forEach((d) => { d.q.length = 0; d.busy = false; });
    cr.left = 0;
  }

  function paxDraw(c, x, y, s, p, paddle) {
    const h = (p.kind === 'elder' ? 1.56 : 1.66) * s;
    const sw = p.moving ? Math.sin(p.ph) * 0.42 : 0;
    const hipY = y - h * 0.48, shY = y - h * 0.81, headR = h * 0.075, headY = y - h * 0.9;
    c.save(); c.globalAlpha = p.alpha; c.lineCap = 'round';
    c.fillStyle = 'rgba(0,0,0,0.16)'; c.beginPath(); c.ellipse(x, y, h * 0.16, h * 0.035, 0, 0, 7); c.fill();
    if (p.kind === 'hijab') {
      c.fillStyle = '#3c4a5c';
      const skw = sw * h * 0.05;
      c.beginPath(); c.moveTo(x - h * 0.09, hipY - h * 0.02); c.lineTo(x + h * 0.09, hipY - h * 0.02); c.lineTo(x + h * 0.13 + skw, y - h * 0.03); c.lineTo(x - h * 0.13 + skw, y - h * 0.03); c.closePath(); c.fill();
    } else {
      c.strokeStyle = p.pants; c.lineWidth = h * 0.075;
      [-1, 1].forEach((sg) => { const a = sw * sg, Lg = h * 0.47; c.beginPath(); c.moveTo(x, hipY); c.lineTo(x + Math.sin(a) * Lg, hipY + Math.cos(a) * Lg); c.stroke(); });
    }
    if (p.kind === 'backpack') { c.fillStyle = '#2f3f2f'; c.fillRect(x - p.dir * h * 0.17 - h * 0.06, shY + h * 0.02, h * 0.12, h * 0.24); }
    const uni = p.kind === 'kond' || p.kind === 'ppka';
    const tw = h * (uni ? 0.22 : 0.2);
    c.fillStyle = p.shirt; roundRect(c, x - tw / 2, shY, tw, hipY - shY + h * 0.04, h * 0.05); c.fill();
    if (uni) { c.fillStyle = '#d8b04a'; c.fillRect(x - tw * 0.35, shY + h * 0.06, tw * 0.15, h * 0.04); }
    c.strokeStyle = p.skin; c.lineWidth = h * 0.06;
    if (p.kind === 'ppka' && paddle > 0.02) {
      c.strokeStyle = p.shirt; c.beginPath(); c.moveTo(x, shY + h * 0.04); c.lineTo(x + h * 0.12 * paddle, shY - h * 0.28 * paddle); c.stroke();
      const px = x + h * 0.14 * paddle, py = shY - h * 0.32 * paddle;
      c.strokeStyle = '#ddd'; c.lineWidth = h * 0.02; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - h * 0.2); c.stroke();
      c.fillStyle = '#2fa84f'; c.beginPath(); c.arc(px, py - h * 0.28, h * 0.09, 0, 7); c.fill();
      c.strokeStyle = '#f4f1e8'; c.lineWidth = h * 0.015; c.stroke();
    } else if (p.kind === 'elder') {
      c.beginPath(); c.moveTo(x, shY + h * 0.04); c.lineTo(x + p.dir * h * 0.16, hipY); c.stroke();
      c.strokeStyle = '#6b4a2a'; c.lineWidth = h * 0.025; c.beginPath(); c.moveTo(x + p.dir * h * 0.16, hipY); c.lineTo(x + p.dir * h * (0.2 + Math.sin(p.ph) * 0.04), y); c.stroke();
    } else if (p.kind === 'trader') {
      c.beginPath(); c.moveTo(x, shY + h * 0.04); c.lineTo(x + h * 0.04, headY - headR * 2.2); c.stroke();
    } else if (clapNow && p.role === 'board') {
      const up = Math.abs(Math.sin(performance.now() / 70 + (p.seed || 0))) * h * 0.04;
      c.beginPath(); c.moveTo(x - h * 0.06, shY + h * 0.04); c.lineTo(x - h * 0.03, headY - headR * 1.6 - up); c.moveTo(x + h * 0.06, shY + h * 0.04); c.lineTo(x + h * 0.03, headY - headR * 1.6 - up); c.stroke();
    } else if (p.kind === 'kond' && p.whistle) {
      c.beginPath(); c.moveTo(x, shY + h * 0.04); c.lineTo(x + p.dir * h * 0.08, headY + headR * 0.6); c.stroke();
    } else {
      const armA = -sw * 0.8;
      c.beginPath(); c.moveTo(x, shY + h * 0.04); c.lineTo(x + Math.sin(armA) * h * 0.3, shY + Math.cos(armA) * h * 0.3); c.stroke();
    }
    c.fillStyle = p.skin; c.beginPath(); c.arc(x, headY, headR, 0, 7); c.fill();
    if (p.kind === 'hijab') {
      c.fillStyle = p.hijab;
      c.beginPath(); c.arc(x, headY - headR * 0.1, headR * 1.25, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(x + headR * 1.5, shY + h * 0.07); c.lineTo(x - headR * 1.5, shY + h * 0.07); c.closePath(); c.fill();
      c.fillStyle = p.skin; c.beginPath(); c.arc(x + p.dir * headR * 0.25, headY + headR * 0.1, headR * 0.62, 0, 7); c.fill();
    } else {
      c.fillStyle = p.kind === 'elder' ? '#d9d6cf' : '#1f1a17';
      c.beginPath(); c.arc(x, headY - headR * 0.2, headR * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    }
    if (p.kind === 'ppka') { c.fillStyle = '#c8322b'; c.fillRect(x - headR * 1.15, headY - headR * 1.35, headR * 2.3, headR * 0.75); }
    if (p.kind === 'kond') { c.fillStyle = '#1e2a3a'; c.fillRect(x - headR * 1.1, headY - headR * 1.3, headR * 2.2, headR * 0.7); c.fillStyle = '#d8b04a'; c.fillRect(x - headR * 0.3, headY - headR * 1.15, headR * 0.6, headR * 0.3); }
    if (p.kind === 'trader') {
      c.fillStyle = '#a77b3f'; c.beginPath(); c.ellipse(x, headY - headR * 1.6, headR * 2.0, headR * 0.75, 0, 0, 7); c.fill();
      c.fillStyle = '#5fa04a'; c.beginPath(); c.arc(x - headR * 0.6, headY - headR * 2.1, headR * 0.6, 0, 7); c.arc(x + headR * 0.7, headY - headR * 2.0, headR * 0.55, 0, 7); c.fill();
    }
    if (p.umbrella && !p.moving && p.state !== 'step') {
      const uc = ['#2b6cb0', '#c0392b', '#2f2f36', '#3c8d5a', '#e1a63b'][Math.floor(hash((p.seed || 0) + 9) * 5)];
      c.strokeStyle = '#333'; c.lineWidth = Math.max(1, h * 0.025);
      c.beginPath(); c.moveTo(x + h * 0.12, shY + h * 0.1); c.lineTo(x + h * 0.12, headY - h * 0.32); c.stroke();
      c.fillStyle = uc; c.beginPath(); c.arc(x + h * 0.12, headY - h * 0.3, h * 0.42, Math.PI, 0); c.fill();
    }
    c.restore();
  }

  // peron sisi dekat (di antara rel dan kamera): menutupi roda kereta seperti peron tinggi
  function drawPlatformFront(V) {
    if (MIS.freight) return;
    const { c, ppm, gy, X, st } = V;
    const yb = gy - 1.12 * ppm, yf = gy + 2.3 * ppm;
    const footY = (z) => yb + 0.35 * ppm + z * (yf - yb - 0.6 * ppm);
    ROUTE.stations.forEach((s, si) => {
      const a = X(s.x + PLAT_FROM), b = X(s.x + PLAT_TO);
      if (b < -50 || a > W + 50) return;
      const g = c.createLinearGradient(0, yb, 0, yf);
      g.addColorStop(0, V.night ? '#7d7a86' : '#cfc8b8'); g.addColorStop(1, V.night ? '#8c8994' : '#ddd6c6');
      c.fillStyle = g; c.fillRect(a, yb, b - a, yf - yb);
      c.fillStyle = '#e8c33a'; c.fillRect(a, yb + 0.12 * ppm, b - a, 0.22 * ppm);
      c.fillStyle = 'rgba(120,96,30,0.35)';
      for (let x = a; x < b; x += Math.max(3, 0.6 * ppm)) c.fillRect(x, yb + 0.12 * ppm, Math.max(1, 0.08 * ppm), 0.22 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.05)';
      for (let i = 1; i < 5; i++) c.fillRect(a, yb + (i / 5) * (yf - yb), b - a, 1);
      c.fillStyle = V.night ? '#5d5a63' : '#9d968a'; c.fillRect(a, yf, b - a, 0.9 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(a, yf + 0.9 * ppm, b - a, 0.25 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.14)'; c.fillRect(a, yb, b - a, 0.1 * ppm);
      const cr = crowds.get(si);
      if (!cr) return;
      const items = [];
      cr.people.forEach((p) => { if (p.state !== 'in' && p.state !== 'step' && p.state !== 'out') items.push(p); });
      items.push(cr.ppka);
      if (cr.kond && cr.kond.state === 'stand') items.push(cr.kond);
      // yang sedang naik/turun di ambang pintu: dipotong bingkai pintu
      const inDoor = cr.people.filter((p) => p.state === 'step' || p.state === 'out');
      if (cr.kond && cr.kond.state === 'step') inDoor.push(cr.kond);
      inDoor.forEach((p) => {
        const d = p.door; if (!d) return;
        const k = p.role === 'alight' ? 1 - p.k : p.k;
        const y = lerp(footY(0.04), gy - trainH(1.15) * ppm, clamp(k * 1.6, 0, 1));
        c.save();
        if (k > 0.35) { c.beginPath(); c.rect(X(d.left), gy - trainH(4.55) * ppm, DOOR_W * ppm, (trainH(4.55) - 1.12) * ppm); c.clip(); }
        const a2 = k > 0.55 ? clamp(1 - (k - 0.55) / 0.45, 0, 1) : 1;
        paxDraw(c, X(d.cx), y, PAX_SCALE * ppm * (1 - k * 0.06), Object.assign({}, p, { alpha: a2 * p.alpha, moving: true, ph: k * 6, dir: p.role === 'alight' ? Math.sign(p.exitX - d.cx) || 1 : 1 }), 0);
        c.restore();
      });
      items.sort((p, q) => p.z - q.z).forEach((p) => {
        const x = X(p.x);
        if (x < -40 || x > W + 40) return;
        paxDraw(c, x, footY(p.z), PAX_SCALE * ppm * (1 + p.z * 0.18), p, cr.paddle);
      });
    });
  }

  function drawStations(V) {
    const { c, ppm, gy, X, st } = V;
    const list = ROUTE.stations.map((s, i) => [s, i, false]).concat((ROUTE.passStations || []).map((s, i) => [s, 10 + i, true]));
    list.forEach(([s, i, pass]) => {
      const a = X(s.x - 95), b = X(s.x + 25);
      if (b < -50 || a > W + 50) return;
      // bangunan stasiun
      const cx = X(s.x - 48), bw = 24 * ppm, bh = 4.6 * ppm, by = gy - 1.0 * ppm;
      c.fillStyle = '#efe6d2'; c.fillRect(cx - bw / 2, by - bh, bw, bh);
      c.fillStyle = '#2e6b6a'; c.fillRect(cx - bw / 2, by - 0.6 * ppm, bw, 0.6 * ppm);
      for (let k = 0; k < 6; k++) {
        const wx = cx - bw / 2 + (k + 0.5) * (bw / 6);
        c.fillStyle = '#3d4a4f';
        c.beginPath(); c.moveTo(wx - 0.8 * ppm, by - 0.9 * ppm); c.lineTo(wx - 0.8 * ppm, by - 3 * ppm);
        c.arc(wx, by - 3 * ppm, 0.8 * ppm, Math.PI, 0); c.lineTo(wx + 0.8 * ppm, by - 0.9 * ppm); c.closePath(); c.fill();
      }
      // atap bersusun (gaya joglo)
      c.fillStyle = '#8f4330';
      c.beginPath(); c.moveTo(cx - bw / 2 - 2.5 * ppm, by - bh); c.lineTo(cx + bw / 2 + 2.5 * ppm, by - bh);
      c.lineTo(cx + bw / 2 - 3 * ppm, by - bh - 2 * ppm); c.lineTo(cx - bw / 2 + 3 * ppm, by - bh - 2 * ppm); c.closePath(); c.fill();
      c.fillStyle = '#a5513a';
      c.beginPath(); c.moveTo(cx - bw / 4, by - bh - 2 * ppm); c.lineTo(cx + bw / 4, by - bh - 2 * ppm);
      c.lineTo(cx + 2 * ppm, by - bh - 4.2 * ppm); c.lineTo(cx - 2 * ppm, by - bh - 4.2 * ppm); c.closePath(); c.fill();
      // bayangan di bawah teritis atap dan sisi bangunan
      { const eg = c.createLinearGradient(0, by - bh, 0, by - bh + 1.4 * ppm); eg.addColorStop(0, 'rgba(0,0,0,0.28)'); eg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = eg; c.fillRect(cx - bw / 2, by - bh, bw, 1.4 * ppm); }
      c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(cx - bw / 2, by - bh, 1.2 * ppm, bh);
      // kanopi peron
      c.fillStyle = 'rgba(70,60,50,0.9)';
      c.fillRect(X(s.x - 82), gy - 5.2 * ppm, (60) * ppm, 0.35 * ppm);
      for (let k = 0; k <= 5; k++) c.fillRect(X(s.x - 80 + k * 11.5), gy - 5 * ppm, 0.18 * ppm, 4 * ppm);
      if (MIS.lebaran) {
        // ketupat bergantung di kanopi dan spanduk Lebaran
        for (let k = 0; k < 10; k++) {
          const kx = X(s.x - 78 + k * 6), ky = gy - 4.3 * ppm + (k % 2) * 0.4 * ppm;
          c.strokeStyle = '#6b5a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(kx, gy - 4.85 * ppm); c.lineTo(kx, ky - 0.45 * ppm); c.stroke();
          c.fillStyle = k % 2 ? '#d9b648' : '#4f9a3a';
          c.beginPath(); c.moveTo(kx, ky - 0.45 * ppm); c.lineTo(kx + 0.4 * ppm, ky); c.lineTo(kx, ky + 0.45 * ppm); c.lineTo(kx - 0.4 * ppm, ky); c.closePath(); c.fill();
        }
        const bx0 = X(s.x - 60), bw0 = 26 * ppm;
        c.fillStyle = '#1f6b3f'; c.fillRect(bx0, gy - 7.0 * ppm, bw0, 1.4 * ppm);
        c.fillStyle = '#f6e7b0'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${Math.round(0.8 * ppm)}px "Big Shoulders Display", sans-serif`;
        c.fillText('SELAMAT HARI RAYA IDULFITRI', bx0 + bw0 / 2, gy - 6.3 * ppm);
        c.textAlign = 'start'; c.textBaseline = 'alphabetic';
      }
      // peron: muka atas (terlihat dari atas) dan tepi depan
      c.fillStyle = '#cfc8b8'; c.fillRect(a, gy - 1.75 * ppm, b - a, 0.8 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(a, gy - 1.75 * ppm, b - a, 0.2 * ppm);
      c.fillStyle = '#e8c33a'; c.fillRect(a, gy - 1.08 * ppm, b - a, 0.14 * ppm);
      c.fillStyle = '#9d968a'; c.fillRect(a, gy - 0.95 * ppm, b - a, 0.75 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(a, gy - 0.3 * ppm, b - a, 0.12 * ppm);
      // papan nama stasiun (dengan ketinggian, seperti di stasiun Indonesia)
      const bx = X(s.x + 13), bwid = 9 * ppm, bht = 2.2 * ppm, btop = gy - 1 * ppm - 4.4 * ppm;
      c.fillStyle = '#3a3a3a'; c.fillRect(bx - bwid / 2 + 0.6 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht); c.fillRect(bx + bwid / 2 - 0.85 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht);
      c.fillStyle = '#fbfaf5'; c.fillRect(bx - bwid / 2, btop, bwid, bht);
      c.strokeStyle = '#1d2a2b'; c.lineWidth = Math.max(1, 0.12 * ppm); c.strokeRect(bx - bwid / 2, btop, bwid, bht);
      c.fillStyle = '#1d2a2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.round(1.05 * ppm)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
      c.fillText(s.name, bx, btop + bht * 0.4);
      c.font = `700 ${Math.round(0.6 * ppm)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      c.fillText(s.elev, bx, btop + bht * 0.8);
      // marka henti "4" (jumlah kereta = lokomotif + 3 gerbong)
      const mx = pass ? -9999 : X(s.x);
      c.fillStyle = '#333'; c.fillRect(mx - 0.1 * ppm, gy - 2.6 * ppm, 0.2 * ppm, 1.8 * ppm);
      c.fillStyle = '#f2c230'; c.fillRect(mx - 0.6 * ppm, gy - 3.8 * ppm, 1.2 * ppm, 1.2 * ppm);
      c.fillStyle = '#111'; c.font = `900 ${Math.round(1.0 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(MIS.freight ? 'B' : String(markNum()), mx, gy - 3.17 * ppm);
      // calon penumpang
      const n = pass ? s.waiting : MIS.freight ? (st.waiting ? st.waiting[i] : s.waiting) : 0;
      const spacing = n > 16 ? 2.5 : 4.1;
      for (let k = 0; k < n; k++) {
        const px = X(s.x - 72 + k * spacing + hash(k + i * 7) * 1.8);
        const wave = pass ? Math.sin(performance.now() / 180 + k) * 0.15 * ppm : 0;
        person(c, px, gy - 1.3 * ppm + wave, ppm, k + i * 13, { basket: (s.traders || s.travelers) && hash(k + 3.3) < 0.6, umbrella: s.umbrellas && hash(k + 1.7) < 0.75 });
      }
    });
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  function signalHead(c, sx, gy, ppm, asp, id, dim) {
    const top = gy - 6.2 * ppm;
    c.fillStyle = '#4b4f52'; c.fillRect(sx - 0.15 * ppm, top, 0.3 * ppm, 6.2 * ppm - 1.0 * ppm);
    c.fillStyle = '#16191b';
    c.beginPath(); c.roundRect ? c.roundRect(sx - 0.6 * ppm, top - 2.6 * ppm, 1.2 * ppm, 2.8 * ppm, 0.3 * ppm) : c.rect(sx - 0.6 * ppm, top - 2.6 * ppm, 1.2 * ppm, 2.8 * ppm); c.fill();
    const lamps = [['R', '#ff4b3a'], ['Y', '#ffc42b'], ['G', '#3bff8a']];
    lamps.forEach(([k, col], i) => {
      const ly = top - 2.1 * ppm + i * 0.9 * ppm;
      const on = asp === k;
      c.fillStyle = on ? col : '#2b2f31';
      c.beginPath(); c.arc(sx, ly, 0.32 * ppm, 0, Math.PI * 2); c.fill();
      if (on && !dim) {
        const g = c.createRadialGradient(sx, ly, 0, sx, ly, 2.2 * ppm);
        g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00');
        c.fillStyle = g; c.beginPath(); c.arc(sx, ly, 2.2 * ppm, 0, Math.PI * 2); c.fill();
      }
    });
    c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.55 * ppm, top + 0.4 * ppm, 1.1 * ppm, 0.7 * ppm);
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(0.55 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(id, sx, top + 0.76 * ppm);
  }

  // sinyal mekanik (semafor) jalur cabang: lengan mendatar = berhenti, lengan terangkat 45° = aman
  function semaphoreHead(c, sx, gy, ppm, asp, id) {
    const go = asp !== 'R', top = gy - 7.2 * ppm;
    c.fillStyle = '#3d4246'; c.fillRect(sx - 0.14 * ppm, top - 0.4 * ppm, 0.28 * ppm, 7.6 * ppm - 1.0 * ppm);
    c.fillStyle = '#2b2f32'; c.beginPath(); c.arc(sx, top - 0.5 * ppm, 0.22 * ppm, 0, 7); c.fill();
    c.save(); c.translate(sx, top); c.rotate(go ? -Math.PI / 4 : 0);
    c.fillStyle = '#c0392b'; c.fillRect(0.1 * ppm, -0.28 * ppm, 2.8 * ppm, 0.56 * ppm);
    c.fillStyle = '#f4f1e8'; c.fillRect(2.1 * ppm, -0.28 * ppm, 0.32 * ppm, 0.56 * ppm);
    c.fillStyle = '#1b1d1f'; c.beginPath(); c.arc(0, 0, 0.36 * ppm, 0, 7); c.fill();
    c.restore();
    const lc = go ? '#3bff8a' : '#ff4b3a';
    c.fillStyle = lc; c.beginPath(); c.arc(sx - 0.45 * ppm, top + 0.6 * ppm, 0.24 * ppm, 0, 7); c.fill();
    c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.55 * ppm, top + 1.6 * ppm, 1.1 * ppm, 0.7 * ppm);
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.round(0.55 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(id, sx, top + 1.96 * ppm);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  function drawTrackside(V) {
    const { c, ppm, gy, X, wx0, wx1, st } = V;
    // rambu batas kecepatan
    for (const z of ROUTE.zones) {
      if (z.from > wx0 && z.from < wx1 && z.from > -60) {
        const sx = X(z.from);
        c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 3.2 * ppm, 0.2 * ppm, 2.4 * ppm);
        c.fillStyle = '#f2c230'; c.fillRect(sx - 0.8 * ppm, gy - 4.4 * ppm, 1.6 * ppm, 1.3 * ppm);
        c.strokeStyle = '#111'; c.lineWidth = 1; c.strokeRect(sx - 0.8 * ppm, gy - 4.4 * ppm, 1.6 * ppm, 1.3 * ppm);
        c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `900 ${Math.round(0.95 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(String(z.limit / 10), sx, gy - 3.73 * ppm);
      }
      const ex = z.to + TRAIN_LEN;
      if (ex > wx0 && ex < wx1 && z.to < 2700) {
        const sx = X(ex);
        c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 3.2 * ppm, 0.2 * ppm, 2.4 * ppm);
        c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.7 * ppm, gy - 4.3 * ppm, 1.4 * ppm, 1.1 * ppm);
        c.strokeStyle = '#111'; c.lineWidth = Math.max(1, 0.18 * ppm);
        c.beginPath(); c.moveTo(sx - 0.6 * ppm, gy - 3.3 * ppm); c.lineTo(sx + 0.6 * ppm, gy - 4.2 * ppm); c.stroke();
      }
    }
    // papan peringatan tikungan (belah ketupat kuning) 120 m sebelum tikungan
    for (const z of ROUTE.zones) {
      if (!z.curve) continue;
      const bx = z.from - 120;
      if (bx > wx0 && bx < wx1) curveWarn(c, X(bx), gy, ppm, z.limit);
    }
    // sinyal
    for (const sig of ROUTE.signals) {
      if (sig.x < wx0 || sig.x > wx1) continue;
      if (sig.sema) semaphoreHead(c, X(sig.x), gy, ppm, st.sig ? st.sig[sig.id] : 'R', sig.id);
      else signalHead(c, X(sig.x), gy, ppm, st.sig ? st.sig[sig.id] : 'R', sig.id, false);
    }
    // tanda landai (tanjakan / turunan) dalam permil
    for (const g of ROUTE.grades) {
      [[g.from, g.permil], [g.to, 0]].forEach(([gx, pm]) => {
        if (gx < wx0 || gx > wx1) return;
        const sx = X(gx);
        c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 2.8 * ppm, 0.2 * ppm, 2.0 * ppm);
        c.save(); c.translate(sx, gy - 2.9 * ppm); c.rotate(pm > 0 ? -0.35 : pm < 0 ? 0.35 : 0);
        c.fillStyle = '#f4f1e8'; c.fillRect(-1.1 * ppm, -0.45 * ppm, 2.2 * ppm, 0.9 * ppm);
        c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `800 ${Math.round(0.7 * ppm)}px "Big Shoulders Display", sans-serif`;
        c.fillText(pm === 0 ? '0' : String(Math.abs(pm)), 0, 0.03 * ppm);
        c.restore();
      });
    }
  }

  // ---------- perlintasan sebidang (JPL) 2.5D ----------
  // jalan menyempit ke kejauhan di belakang rel dan melebar ke arah kamera di depan rel;
  // palang di kedua sisi turun perlahan, lampu berkedip bergantian, antrean kendaraan
  const crossAnim = [];
  function crossState(i) {
    if (!crossAnim[i]) {
      crossAnim[i] = {
        gate: 0, released: false,
        // d: kedalaman di jalan (0 = bawah layar, 1 = tepi rel dekat, 2 = ujung jauh); lane: -1 kiri, 1 kanan
        veh: [
          { d: 0.66, lane: -0.45, kind: 'moto', col: '#c0392b', dir: 1 },
          { d: 0.42, lane: -0.4, kind: 'car', col: '#2e6db0', dir: 1 },
          { d: 0.18, lane: -0.5, kind: 'moto', col: '#2f2f36', dir: 1 },
          { d: 1.45, lane: 0.45, kind: 'angkot', col: '#2f8f5a', dir: -1 },
        ],
      };
    }
    return crossAnim[i];
  }
  function resetCrossings() { crossAnim.length = 0; }
  function crossGeom(V, cr) {
    const { ppm, gy, X } = V;
    const sx = X(cr.x);
    const yTop = gy + 1.4 * ppm, yFarEdge = gy - 0.6 * ppm, yFar = gy - 3.2 * ppm;
    const farX = sx + (W * 0.5 - sx) * 0.05;
    const nearX = V.Xn(sx);
    // titik di sumbu jalan pada kedalaman d, beserta setengah lebar jalan (px)
    const at = (d) => {
      if (d <= 1) { const t = Math.pow(1 - d, 1 / 1.55); return { x: sx + (nearX - sx) * t, y: yTop + (H - yTop) * Math.pow(t, 1.55), hw: lerp(3.5, 6.1, t) * ppm }; }
      const t = clamp(d - 1, 0, 1);
      const te = 1 - Math.pow(1 - t, 1.8);
      return { x: sx + (farX - sx) * te, y: lerp(yFarEdge, yFar, te), hw: lerp(3.5, 2.3, te) * ppm };
    };
    return { sx, yTop, yFarEdge, yFar, farX, nearX, at };
  }
  function drawRoadPoly(c, pts, fill) { c.fillStyle = fill; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); }
  function drawVehicle(c, V, G, v) {
    const p = G.at(v.d);
    if (v.d < -0.3 || v.d > 2.05) return;
    const s = p.hw / 3.5;                    // skala sesuai kedalaman
    const x = p.x + v.lane * p.hw, y = p.y;
    const night = V.night || V.storm;
    if (v.kind === 'moto') {
      c.fillStyle = '#1b1b1f'; c.beginPath(); c.ellipse(x, y - 0.3 * s, 0.28 * s, 0.4 * s, 0, 0, 7); c.fill();
      c.fillStyle = v.col; c.fillRect(x - 0.42 * s, y - 1.55 * s, 0.84 * s, 1.0 * s);
      c.fillStyle = '#26262b'; c.fillRect(x - 0.32 * s, y - 0.75 * s, 0.64 * s, 0.4 * s);
      c.fillStyle = v.dir > 0 ? '#e9e2d0' : '#f2c230'; c.beginPath(); c.arc(x, y - 1.85 * s, 0.34 * s, 0, 7); c.fill();
      c.fillStyle = night ? '#ff3b2f' : '#b3261e'; c.fillRect(x - 0.12 * s, y - 0.62 * s, 0.24 * s, 0.12 * s);
    } else {
      const w = (v.kind === 'angkot' ? 1.9 : 1.8) * s, h = (v.kind === 'angkot' ? 1.9 : 1.45) * s;
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x, y, w * 0.6, 0.18 * s, 0, 0, 7); c.fill();
      c.fillStyle = v.col; roundRect(c, x - w / 2, y - h - 0.3 * s, w, h, 0.25 * s); c.fill();
      c.fillStyle = '#1e2a33'; roundRect(c, x - w * 0.38, y - h - 0.15 * s, w * 0.76, h * 0.42, 0.15 * s); c.fill();
      c.fillStyle = '#16181b'; c.fillRect(x - w * 0.46, y - 0.35 * s, w * 0.2, 0.35 * s); c.fillRect(x + w * 0.26, y - 0.35 * s, w * 0.2, 0.35 * s);
      if (v.dir > 0) { // dilihat dari belakang: lampu rem
        c.fillStyle = night ? '#ff3b2f' : '#c0392b';
        c.fillRect(x - w * 0.47, y - 0.85 * s, w * 0.14, 0.2 * s); c.fillRect(x + w * 0.33, y - 0.85 * s, w * 0.14, 0.2 * s);
      } else { // dilihat dari depan: lampu utama
        c.fillStyle = '#fff2c4';
        c.fillRect(x - w * 0.45, y - 0.85 * s, w * 0.16, 0.16 * s); c.fillRect(x + w * 0.29, y - 0.85 * s, w * 0.16, 0.16 * s);
      }
      if (v.kind === 'angkot') { c.fillStyle = '#f2c230'; c.fillRect(x - w / 2, y - h * 0.62, w, 0.16 * s); }
    }
  }
  function crossingSignal(c, x, y, s, blinkA, blinkB, on) {
    // tiang, rambu silang (X), dua lampu merah berkap, papan "AWAS KERETA API"
    c.fillStyle = '#e9e9e4'; c.fillRect(x - 0.1 * s, y - 4.6 * s, 0.2 * s, 4.6 * s);
    c.save(); c.translate(x, y - 4.6 * s);
    for (const a of [0.7, -0.7]) {
      c.save(); c.rotate(a);
      c.fillStyle = '#c0392b'; c.fillRect(-1.0 * s, -0.17 * s, 2.0 * s, 0.34 * s);
      c.fillStyle = '#ffffff'; c.fillRect(-0.92 * s, -0.11 * s, 1.84 * s, 0.22 * s);
      c.restore();
    }
    c.restore();
    c.fillStyle = '#1a1c1e'; c.fillRect(x - 0.95 * s, y - 3.55 * s, 1.9 * s, 0.75 * s);
    [[-0.5, blinkA], [0.5, blinkB]].forEach(([dx, lit]) => {
      c.fillStyle = '#111'; c.beginPath(); c.arc(x + dx * s, y - 3.18 * s, 0.34 * s, 0, 7); c.fill();
      c.fillStyle = lit && on ? '#ff3b2f' : '#4a1612'; c.beginPath(); c.arc(x + dx * s, y - 3.18 * s, 0.24 * s, 0, 7); c.fill();
      if (lit && on) {
        const g = c.createRadialGradient(x + dx * s, y - 3.18 * s, 0, x + dx * s, y - 3.18 * s, 1.6 * s);
        g.addColorStop(0, 'rgba(255,70,50,0.55)'); g.addColorStop(1, 'rgba(255,70,50,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x + dx * s, y - 3.18 * s, 1.6 * s, 0, 7); c.fill();
      }
    });
    c.fillStyle = '#f4f1e8'; c.fillRect(x - 0.95 * s, y - 2.45 * s, 1.9 * s, 0.7 * s);
    c.strokeStyle = '#c0392b'; c.lineWidth = Math.max(1, 0.08 * s); c.strokeRect(x - 0.95 * s, y - 2.45 * s, 1.9 * s, 0.7 * s);
    c.fillStyle = '#c0392b'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `900 ${Math.max(5, Math.round(0.3 * s))}px "Big Shoulders Display", sans-serif`;
    c.fillText('AWAS KERETA API', x, y - 2.1 * s);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  function gateArm(c, px, py, len, ang, s, dirX) {
    c.save(); c.translate(px, py); c.rotate(ang * dirX); c.scale(dirX, 1);
    const seg = len / 8;
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#f4f1e8' : '#d0392b'; c.fillRect(k * seg, -0.13 * s, seg, 0.26 * s); }
    c.fillStyle = '#ffd04a'; c.beginPath(); c.arc(len * 0.5, 0, 0.1 * s, 0, 7); c.arc(len * 0.95, 0, 0.1 * s, 0, 7); c.fill();
    c.restore();
    c.fillStyle = '#d8d8d2'; c.fillRect(px - 0.25 * s, py - 0.3 * s, 0.5 * s, 1.4 * s);
    c.fillStyle = '#4a4d50'; c.fillRect(px - 0.32 * s, py - 0.42 * s, 0.64 * s, 0.4 * s);
  }
  function drawCrossings(V, layer, dtReal) {
    const { c, ppm, gy, X, st, wx0, wx1 } = V;
    ROUTE.crossings.forEach((cr, i) => {
      if (cr.x < wx0 - 60 || cr.x > wx1 + 60) return;
      const A = crossState(i), G = crossGeom(V, cr);
      const active = st.x > cr.x - 320 && st.x - TRAIN_LEN < cr.x + 6;
      const blink = Math.floor(performance.now() / 450) % 2 === 0;
      if (layer === 'back') {
        // animasi palang & kendaraan dihitung sekali per frame di lapisan belakang
        const dt = Math.min(0.05, dtReal || 0.016);
        A.gate += clamp((active ? 1 : 0) - A.gate, -dt * 0.7, dt * 0.7);
        if (!active && A.gate < 0.15 && st.x - TRAIN_LEN > cr.x) A.released = true;
        if (A.released) for (const v of A.veh) v.d += v.dir * dt * (v.kind === 'moto' ? 0.42 : 0.3);
        const asphalt = mix('#4a4a4d', '#5a5a5e', V.p), asphaltFar = mix('#5d5c62', '#7a7a80', V.p);
        // tanah berumput di seberang rel tempat jalan menjauh (memudar ke samping agar menyatu dengan bukit)
        {
          const vx0 = G.sx - 30 * ppm, vx1 = G.sx + 30 * ppm, vTop = G.yFar - 0.9 * ppm;
          const grass = V.night ? '#24331f' : mix('#5a8540', '#78a84c', V.p);
          c.save();
          c.beginPath(); c.moveTo(vx0, G.yFarEdge + 0.2 * ppm);
          c.quadraticCurveTo(G.sx - 16 * ppm, vTop, G.sx, vTop); c.quadraticCurveTo(G.sx + 16 * ppm, vTop, vx1, G.yFarEdge + 0.2 * ppm);
          c.closePath(); c.clip();
          c.fillStyle = grass;
          for (let k = 0; k < 12; k++) {
            const a0 = vx0 + (vx1 - vx0) * (k / 12), a1 = vx0 + (vx1 - vx0) * ((k + 1) / 12), mid = (k + 0.5) / 12;
            c.globalAlpha = clamp(Math.min(mid, 1 - mid) * 4, 0, 1);
            c.fillRect(a0, vTop - 2, a1 - a0 + 1, G.yFarEdge - vTop + 0.6 * ppm);
          }
          c.restore();
        }
        // ruas jauh di belakang rel
        const f0 = G.at(1), f1 = G.at(2);
        drawRoadPoly(c, [[f1.x - f1.hw, f1.y], [f1.x + f1.hw, f1.y], [f0.x + f0.hw, f0.y], [f0.x - f0.hw, f0.y]], asphaltFar);
        // ruas dekat di depan rel
        const n0 = G.at(1), n1 = G.at(0);
        drawRoadPoly(c, [[n0.x - n0.hw, G.yTop], [n0.x + n0.hw, G.yTop], [n1.x + n1.hw, H], [n1.x - n1.hw, H]], asphalt);
        // bahu jalan, marka tepi, marka tengah putus-putus, garis henti
        c.strokeStyle = 'rgba(240,236,224,0.75)'; c.lineWidth = 1;
        for (const side of [-0.92, 0.92]) {
          c.beginPath();
          for (let d = 0; d <= 2.001; d += 0.1) { if (d > 0.999 && d < 1.001) continue; const q = G.at(d); const yy = d <= 1 ? q.y : q.y; if (d === 0) c.moveTo(q.x + side * q.hw, yy); else c.lineTo(q.x + side * q.hw, yy); }
          c.stroke();
        }
        c.fillStyle = 'rgba(240,236,224,0.8)';
        for (let d = 0.05; d < 2; d += 0.16) {
          if (d > 0.9 && d < 1.12) continue;
          const a = G.at(d), b = G.at(d + 0.07);
          c.beginPath(); c.moveTo(a.x - 0.03 * a.hw, a.y); c.lineTo(a.x + 0.03 * a.hw, a.y); c.lineTo(b.x + 0.03 * b.hw, b.y); c.lineTo(b.x - 0.03 * b.hw, b.y); c.closePath(); c.fill();
        }
        for (const d of [0.78, 1.22]) {
          const a = G.at(d), b = G.at(d + 0.02);
          c.fillStyle = 'rgba(245,242,232,0.85)';
          const l = d < 1 ? -1 : 1;
          c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x + l * 0.92 * a.hw, a.y); c.lineTo(b.x + l * 0.92 * b.hw, b.y); c.lineTo(b.x, b.y); c.closePath(); c.fill();
        }
        // panel karet/beton di antara rel, lalu rel digambar ulang di atasnya
        drawRoadPoly(c, [[G.sx - 3.6 * ppm, G.yFarEdge], [G.sx + 3.6 * ppm, G.yFarEdge], [G.sx + 3.9 * ppm, gy + 0.55 * ppm], [G.sx - 3.9 * ppm, gy + 0.55 * ppm]], '#3a3b3e');
        c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; c.beginPath();
        for (let k = -3; k <= 3; k += 1.2) { c.moveTo(G.sx + k * ppm, G.yFarEdge); c.lineTo(G.sx + k * 1.06 * ppm, gy + 0.55 * ppm); }
        c.stroke();
        c.fillStyle = '#7d8487'; c.fillRect(G.sx - 3.8 * ppm, gy - 0.48 * ppm, 7.6 * ppm, 0.13 * ppm);
        c.fillStyle = '#9aa0a2'; c.fillRect(G.sx - 3.9 * ppm, gy - 0.12 * ppm, 7.8 * ppm, 0.24 * ppm);
        // pos penjaga JPL di sisi jauh
        const hx = G.at(1.25).x - G.at(1.25).hw - 4.5 * ppm, hy = G.yFarEdge - 0.4 * ppm;
        c.fillStyle = '#e7e0cf'; c.fillRect(hx - 1.8 * ppm, hy - 2.6 * ppm, 3.6 * ppm, 2.6 * ppm);
        c.fillStyle = V.night ? '#ffd78f' : '#33454f'; c.fillRect(hx - 1.2 * ppm, hy - 2.1 * ppm, 1.4 * ppm, 0.9 * ppm);
        c.fillStyle = '#8f4330'; c.beginPath(); c.moveTo(hx - 2.2 * ppm, hy - 2.6 * ppm); c.lineTo(hx + 2.2 * ppm, hy - 2.6 * ppm); c.lineTo(hx + 1.6 * ppm, hy - 3.4 * ppm); c.lineTo(hx - 1.6 * ppm, hy - 3.4 * ppm); c.closePath(); c.fill();
        c.fillStyle = '#1f6f6d'; c.fillRect(hx + 0.4 * ppm, hy - 2.2 * ppm, 1.2 * ppm, 0.55 * ppm);
        c.fillStyle = '#f4f1e8'; c.font = `800 ${Math.max(5, Math.round(0.4 * ppm))}px "Big Shoulders Display", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`JPL ${12 + i * 7}`, hx + 1.0 * ppm, hy - 1.92 * ppm);
        c.textAlign = 'start'; c.textBaseline = 'alphabetic';
        person(c, hx - 2.4 * ppm, hy, ppm * 0.9, 41 + i, { color: '#2e5a8a' });
        // kendaraan di sisi jauh, lalu semak di ujung jalan agar jalan menghilang di balik vegetasi
        A.veh.filter((v) => v.d > 1).sort((a, b) => b.d - a.d).forEach((v) => drawVehicle(c, V, G, v));
        {
          const e = G.at(1.92), bush = V.night ? '#1d2a1a' : mix('#3d6a34', '#4f8a40', V.p);
          c.fillStyle = bush;
          for (let k = -3; k <= 3; k++) {
            const bx = e.x + k * 1.1 * ppm, r = (0.9 + hash(k + i * 3.7) * 0.6) * ppm;
            c.beginPath(); c.arc(bx, e.y - r * 0.2, r, 0, 7); c.fill();
          }
        }
        const fs = 0.8 * ppm;
        const fp = G.at(1.12);
        crossingSignal(c, fp.x + fp.hw + 1.1 * ppm, fp.y, fs, blink, !blink, active);
        gateArm(c, fp.x + fp.hw + 0.4 * ppm, fp.y - 1.1 * fs, fp.hw * 2 + 0.4 * ppm, lerp(-1.4, 0, A.gate), fs, -1);
      } else {
        // sisi dekat (di depan kereta): kendaraan antre, palang, tiang lampu
        A.veh.filter((v) => v.d <= 1).sort((a, b) => b.d - a.d).forEach((v) => drawVehicle(c, V, G, v));
        const np = G.at(0.84), ns = np.hw / 3.5;
        crossingSignal(c, np.x - np.hw - 1.0 * ns, np.y, ns, !blink, blink, active);
        gateArm(c, np.x - np.hw - 0.3 * ns, np.y - 1.1 * ns, np.hw * 2 + 0.3 * ns, lerp(-1.4, 0, A.gate), ns, 1);
      }
    });
  }

  // papan semboyan 35 (wajib klakson) di titik mulai membunyikan klakson sebelum perlintasan
  // ---------- tikungan: papan peringatan & papan chevron (rel tetap lurus) ----------
  function curveWarn(c, sx, gy, ppm, lim) {
    c.fillStyle = '#444'; c.fillRect(sx - 0.1 * ppm, gy - 3.3 * ppm, 0.2 * ppm, 2.5 * ppm);
    c.save(); c.translate(sx, gy - 4.3 * ppm); c.rotate(Math.PI / 4);
    c.fillStyle = '#f2c230'; c.fillRect(-0.8 * ppm, -0.8 * ppm, 1.6 * ppm, 1.6 * ppm);
    c.strokeStyle = '#111'; c.lineWidth = Math.max(1, 0.1 * ppm); c.strokeRect(-0.68 * ppm, -0.68 * ppm, 1.36 * ppm, 1.36 * ppm);
    c.restore();
    // panah belok
    c.strokeStyle = '#111'; c.lineWidth = Math.max(1, 0.17 * ppm); c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx + 0.25 * ppm, gy - 3.75 * ppm); c.lineTo(sx + 0.25 * ppm, gy - 4.35 * ppm); c.quadraticCurveTo(sx + 0.25 * ppm, gy - 4.75 * ppm, sx - 0.2 * ppm, gy - 4.75 * ppm); c.stroke(); c.lineCap = 'butt';
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(sx - 0.45 * ppm, gy - 4.75 * ppm); c.lineTo(sx - 0.15 * ppm, gy - 5.0 * ppm); c.lineTo(sx - 0.15 * ppm, gy - 4.5 * ppm); c.closePath(); c.fill();
    c.fillStyle = '#f4f1e8'; c.fillRect(sx - 0.7 * ppm, gy - 3.2 * ppm, 1.4 * ppm, 0.8 * ppm);
    c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${Math.round(0.65 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText(String(lim), sx, gy - 2.78 * ppm);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }
  function chevronBoard(c, sx, by, k, dir = 1) { // dir 1 = panah ke kiri (arah belok), -1 = ke kanan // by = kaki tiang, k = skala piksel per meter
    c.fillStyle = '#444'; c.fillRect(sx - 0.07 * k, by - 1.3 * k, 0.14 * k, 1.3 * k);
    c.fillStyle = '#16191b'; c.fillRect(sx - 0.45 * k, by - 2.0 * k, 0.9 * k, 0.75 * k);
    c.strokeStyle = '#f2c230'; c.lineWidth = Math.max(1, 0.14 * k); c.lineJoin = 'round';
    [-0.15, 0.15].forEach((o) => { c.beginPath(); c.moveTo(sx + (o + 0.12 * dir) * k, by - 1.9 * k); c.lineTo(sx + (o - 0.12 * dir) * k, by - 1.625 * k); c.lineTo(sx + (o + 0.12 * dir) * k, by - 1.35 * k); c.stroke(); });
    c.lineJoin = 'miter';
  }
  // papan chevron di sisi luar tikungan (sisi depan/kanan), digambar di depan kereta
  function drawChevrons(V) {
    const { c, ppm, gy, X, wx0, wx1 } = V;
    for (const z of ROUTE.zones) {
      if (!z.curve || z.to < wx0 || z.from > wx1) continue;
      for (let m = z.from + 6; m < z.to; m += 14) { if (m < wx0 || m > wx1) continue; chevronBoard(c, X(m), gy + 2.9 * ppm, ppm * 1.15, -1); }
    }
  }

  // ---------- lintas tunggal: jalur utama di sisi depan, KA berlawanan, pohon tumbang, genangan ----------
  const MEET_NEAR = 4.6; // jarak layar (× ppm) jalur utama di depan sepur belok
  const meetK = (x) => { const M = ROUTE.meet; return M ? smooth(M.entry, M.entry + 45, x) * (1 - smooth(M.exit - 45, M.exit, x)) : 0; };
  function drawMeetTrack(V) {
    const MT = ROUTE.meet; if (!MT) return;
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    const a = Math.max(MT.entry, wx0), b = Math.min(MT.exit, wx1);
    if (b <= a) return;
    const yAt = (x) => gy + MEET_NEAR * ppm * meetK(x);
    // balas jalur utama: muka atas lalu lereng depan
    const band = (t0, t1, col) => {
      c.fillStyle = col; c.beginPath();
      for (let x = a; x <= b + 0.01; x += 2) c.lineTo(X(x), yAt(x) + t0 * ppm);
      for (let x = b; x >= a - 0.01; x -= 2) c.lineTo(X(x), yAt(x) + t1 * ppm);
      c.closePath(); c.fill();
    };
    band(-0.62, 0.5, mix('#8d8275', '#a59a8c', p));
    band(0.5, 1.45, mix('#5d5349', '#766a5e', p));
    c.fillStyle = mix('#6f6a63', '#8b857b', p);
    for (let m = Math.ceil(a / 1.2) * 1.2; m < b; m += 1.2) { const sx = X(m), y = yAt(m); c.fillRect(sx, y - 0.5 * ppm, 0.3 * ppm, 0.8 * ppm); }
    const rail = (off, h, col) => {
      c.strokeStyle = col; c.lineWidth = h * ppm; c.beginPath();
      for (let x = a; x <= b + 0.01; x += 2) c.lineTo(X(x), yAt(x) + off * ppm);
      c.stroke();
    };
    rail(-0.42, 0.13, '#7d8487'); rail(0, 0.24, '#9aa0a2'); rail(-0.06, 0.06, 'rgba(255,255,255,0.4)');
    // wesel: lidah wesel & kotak penggerak di kedua ujung
    [MT.entry, MT.exit].forEach((wx) => {
      const sx = X(wx); if (sx < -40 || sx > W + 40) return;
      c.fillStyle = '#3d4246'; c.fillRect(sx - 0.6 * ppm, gy + 0.9 * ppm, 1.2 * ppm, 0.55 * ppm);
      c.fillStyle = '#f2c230'; c.fillRect(sx - 0.6 * ppm, gy + 0.9 * ppm, 1.2 * ppm, 0.12 * ppm);
    });
    // patok bebas batas: tiang merah-putih di antara dua jalur
    const fx = X(MT.foul);
    if (fx > -20 && fx < W + 20) {
      const fy = gy + 2.5 * ppm;
      for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#f4f1e8' : '#d62b20'; c.fillRect(fx - 0.2 * ppm, fy - (i + 1) * 0.3 * ppm, 0.4 * ppm, 0.3 * ppm); }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(fx - 0.2 * ppm, fy, 0.6 * ppm, 0.12 * ppm);
    }
  }
  // KA 112: rangkaian berlawanan arah di jalur utama, lebih dekat ke kamera
  function drawOppTrain(V) {
    const MT = ROUTE.meet, st = V.st; if (!MT || !st.meet || st.meet.phase !== 'run') return;
    const { c, ppm, gy, X } = V;
    const lens = [16].concat(Array(MT.cars).fill(19.5));
    let f = st.meet.x;
    lens.forEach((len, k) => {
      const r = f + len, xa = X(f), xb = X(r);
      if (xb > -20 && xa < W + 20) {
        const ka = meetK(f), kb = meetK(r), ya = gy + MEET_NEAR * ppm * ka, yb = gy + MEET_NEAR * ppm * kb;
        const sc = 1 + 0.1 * (ka + kb) / 2, u = ppm * sc, L = Math.hypot(xb - xa, yb - ya);
        c.save(); c.translate(xa, ya); c.rotate(Math.atan2(yb - ya, xb - xa));
        c.fillStyle = 'rgba(20,16,10,0.3)'; c.fillRect(0, 0.1 * u, L, 0.35 * u);
        // bogie & roda
        [0.17, 0.83].forEach((bc) => {
          c.fillStyle = '#23272b'; c.fillRect(L * bc - 2.0 * u, -1.0 * u, 4.0 * u, 0.55 * u);
          [-1.1, 1.1].forEach((o) => { c.fillStyle = '#15181b'; c.beginPath(); c.arc(L * bc + o * u, -0.46 * u, 0.46 * u, 0, 7); c.fill(); c.fillStyle = '#5b6166'; c.beginPath(); c.arc(L * bc + o * u, -0.46 * u, 0.14 * u, 0, 7); c.fill(); });
        });
        c.fillStyle = '#2a2f33'; c.fillRect(0.3 * u, -1.2 * u, L - 0.6 * u, 0.32 * u);
        // badan perak dengan sabuk biru-merah
        const loco = k === 0;
        c.fillStyle = '#e4e9ec';
        c.beginPath();
        if (loco) { c.moveTo(1.4 * u, -4.05 * u); c.lineTo(L, -4.05 * u); c.lineTo(L, -1.15 * u); c.lineTo(0, -1.15 * u); c.lineTo(0, -2.6 * u); c.closePath(); }
        else roundRect(c, 0, -4.05 * u, L, 2.9 * u, 0.35 * u);
        c.fill();
        c.fillStyle = '#1f4e8c'; c.fillRect(0, -2.05 * u, L, 0.42 * u);
        c.fillStyle = '#c03a2b'; c.fillRect(0, -1.5 * u, L, 0.12 * u);
        c.fillStyle = '#9aa3a8'; c.fillRect(loco ? 1.4 * u : 0.3 * u, -4.25 * u, L - (loco ? 1.7 : 0.6) * u, 0.22 * u);
        const glow = V.lit ? '#f6d98c' : '#22313b';
        if (loco) {
          c.fillStyle = '#1b2833'; c.beginPath(); c.moveTo(1.3 * u, -3.85 * u); c.lineTo(2.9 * u, -3.85 * u); c.lineTo(2.9 * u, -2.75 * u); c.lineTo(0.45 * u, -2.75 * u); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(1.6 * u, -3.75 * u, 0.25 * u, 0.9 * u);
          for (let i = 0; i < 7; i++) { c.fillStyle = '#c7cfd2'; c.fillRect(4.4 * u + i * 1.05 * u, -3.6 * u, 0.7 * u, 1.3 * u); }
          c.fillStyle = '#1f4e8c'; c.font = `900 ${Math.round(0.8 * u)}px "Big Shoulders Display", sans-serif`; c.textBaseline = 'middle'; c.fillText('112', L - 3.4 * u, -3.0 * u); c.textBaseline = 'alphabetic';
          // lampu sorot depan
          const hg = c.createRadialGradient(0.2 * u, -2.3 * u, 0, 0.2 * u, -2.3 * u, 3.5 * u);
          hg.addColorStop(0, 'rgba(255,240,190,0.9)'); hg.addColorStop(1, 'rgba(255,240,190,0)');
          c.fillStyle = hg; c.beginPath(); c.arc(0.2 * u, -2.3 * u, 3.5 * u, 0, 7); c.fill();
          c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(0.25 * u, -2.3 * u, 0.22 * u, 0, 7); c.fill();
        } else {
          for (let i = 0; i < 8; i++) { const wx = L * 0.12 + i * L * 0.098; c.fillStyle = glow; c.fillRect(wx, -3.35 * u, L * 0.07, 0.95 * u); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(wx, -3.35 * u, L * 0.07, 0.12 * u); }
          [0.035, 0.925].forEach((dx) => { c.strokeStyle = 'rgba(40,50,60,0.55)'; c.lineWidth = 1; c.strokeRect(L * dx, -3.55 * u, 0.9 * u, 2.25 * u); });
        }
        c.restore();
      }
      f = r + 1;
    });
    // semburan air hujan dari roda
    if (V.storm) { c.fillStyle = 'rgba(220,230,235,0.25)'; for (let i = 0; i < 10; i++) { const wx = st.meet.x + Math.random() * (f - st.meet.x); const sx = X(wx); if (sx < 0 || sx > W) continue; c.fillRect(sx, gy + MEET_NEAR * ppm * meetK(wx) - (0.2 + Math.random() * 0.8) * ppm, 0.6 * ppm, 0.12 * ppm); } }
  }
  function drawTree(V) {
    const TR = V.st.tree; if (!TR) return;
    const { c, ppm, gy, X, p } = V;
    const x = X(TR.x); if (x < -30 * ppm || x > W + 30 * ppm) return;
    const work = TR.phase === 'work' ? TR.t : TR.phase === 'clear' ? 99 : 0;
    const bark = mix('#4a3622', '#5e4530', p), leaf = V.storm ? '#2c4f2e' : mix('#2f5a2f', '#3f7a3a', p), leaf2 = V.storm ? '#3a6339' : mix('#3f6e38', '#558e46', p);
    // tunggul di sisi belakang rel
    c.fillStyle = bark; c.fillRect(x - 4.4 * ppm, gy - 2.6 * ppm, 1.1 * ppm, 1.9 * ppm);
    c.fillStyle = '#c9a77a'; c.beginPath(); c.ellipse(x - 3.85 * ppm, gy - 2.6 * ppm, 0.55 * ppm, 0.2 * ppm, 0, 0, 7); c.fill();
    if (work < 13) {
      // batang melintang rel dan tajuk rimbun di sisi depan
      const cut = work > 8 ? 1 : 0;
      c.strokeStyle = bark; c.lineCap = 'round';
      c.lineWidth = 0.8 * ppm; c.beginPath(); c.moveTo(x - 3.9 * ppm, gy - 1.6 * ppm); c.lineTo(x - 0.4 * ppm - cut * 0.3 * ppm, gy - 0.3 * ppm); c.stroke();
      c.beginPath(); c.moveTo(x + 0.4 * ppm + cut * 0.6 * ppm, gy + 0.1 * ppm); c.lineTo(x + 5 * ppm + cut * 0.6 * ppm, gy + 2.0 * ppm); c.stroke();
      c.lineWidth = 0.3 * ppm; c.beginPath(); c.moveTo(x + 2.4 * ppm, gy + 0.9 * ppm); c.lineTo(x + 3.4 * ppm, gy - 1.4 * ppm); c.moveTo(x + 3.6 * ppm, gy + 1.5 * ppm); c.lineTo(x + 6.2 * ppm, gy + 0.4 * ppm); c.stroke();
      c.lineCap = 'butt';
      const off = cut * 0.6 * ppm;
      [[5.6, -0.4, 2.2, leaf], [7.6, 0.8, 2.0, leaf], [4.4, -1.6, 1.6, leaf2], [7.2, -1.2, 1.7, leaf2], [9.0, 1.6, 1.5, leaf], [3.4, 0.6, 1.3, leaf2]].forEach(([dx, dy, r, col]) => {
        c.fillStyle = col; c.beginPath(); c.arc(x + dx * ppm + off, gy + dy * ppm, r * ppm, 0, 7); c.fill();
      });
    } else {
      // potongan batang disingkirkan ke tepi rel
      c.fillStyle = bark;
      [[2, 3.0], [5, 3.3], [8, 3.0]].forEach(([dx, dy]) => { c.fillRect(x + dx * ppm, gy + dy * ppm - 0.6 * ppm, 2.2 * ppm, 0.6 * ppm); c.fillStyle = '#c9a77a'; c.beginPath(); c.ellipse(x + dx * ppm, gy + dy * ppm - 0.3 * ppm, 0.15 * ppm, 0.3 * ppm, 0, 0, 7); c.fill(); c.fillStyle = bark; });
      c.fillStyle = V.storm ? 'rgba(44,79,46,0.85)' : leaf; c.beginPath(); c.ellipse(x + 13 * ppm, gy + 3 * ppm, 4 * ppm, 1.1 * ppm, 0, 0, 7); c.fill();
    }
    // tim jalan rel memotong batang
    if (TR.phase === 'work') {
      const t = TR.t;
      [[-1.2, 2.4, 3], [2.0, 2.8, 5], [6.4, 3.0, 8]].forEach(([dx, dy, sd], i) => {
        const walk = clamp(t / 3, 0, 1);
        const px = x + (dx - (1 - walk) * (10 + i * 3)) * ppm;
        person(c, px, gy + dy * ppm, ppm, sd, { color: '#f08a24', helmet: true });
      });
      if (t > 3 && t < 12) {
        c.fillStyle = 'rgba(230,205,160,0.8)';
        for (let i = 0; i < 6; i++) c.fillRect(x + (0.2 + Math.random() * 0.8) * ppm, gy + (0.4 - Math.random() * 1.2) * ppm, 0.12 * ppm, 0.12 * ppm);
      }
    }
  }
  function drawFlood(V, layer) {
    const F = ROUTE.flood; if (!F) return;
    const { c, ppm, gy, X, st } = V;
    const a = X(F.from), b = X(F.to);
    if (b < -60 || a > W + 60) return;
    const tt = performance.now() / 1000;
    const top = V.night ? 'rgba(80,96,120,0.85)' : 'rgba(128,152,160,0.86)', deep = V.night ? 'rgba(40,52,70,0.9)' : 'rgba(78,102,108,0.92)';
    if (layer === 'back') {
      // genangan melebar di tanah sekitar rel
      c.fillStyle = deep;
      c.beginPath(); c.ellipse((a + b) / 2, gy + 3.2 * ppm, (b - a) / 2 + 9 * ppm, 2.6 * ppm, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse((a + b) / 2, gy - 1.0 * ppm, (b - a) / 2 + 4 * ppm, 0.6 * ppm, 0, 0, 7); c.fill();
      c.fillStyle = top; c.fillRect(a - 3 * ppm, gy + 1.0 * ppm, b - a + 6 * ppm, 0.12 * ppm);
      return;
    }
    // permukaan air menutupi rel dan bagian bawah roda
    const g = c.createLinearGradient(0, gy - 0.5 * ppm, 0, gy + 1.8 * ppm);
    g.addColorStop(0, top); g.addColorStop(1, deep);
    c.fillStyle = g; c.beginPath();
    c.moveTo(a - 4 * ppm, gy + 1.8 * ppm);
    for (let x = a - 4 * ppm; x <= b + 4 * ppm; x += 6) {
      const e = Math.min(1, (x - a + 4 * ppm) / (5 * ppm), (b + 4 * ppm - x) / (5 * ppm));
      c.lineTo(x, gy + 1.8 * ppm - (2.3 * ppm + Math.sin(x * 0.07 + tt * 2.4) * 0.05 * ppm) * e);
    }
    c.lineTo(b + 4 * ppm, gy + 1.8 * ppm); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(235,245,248,0.45)'; c.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const x = a + ((i * 53 + tt * 14) % Math.max(1, b - a)), y = gy - 0.35 * ppm + (i % 3) * 0.55 * ppm;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.6 * ppm, y); c.stroke();
    }
    // gelombang haluan & cipratan
    if (st.splash) {
      c.fillStyle = 'rgba(235,245,250,0.7)';
      for (const q of st.splash) { const r = (0.1 + 0.12 * (1 - q.life / q.max)) * ppm; c.beginPath(); c.arc(X(q.x), gy - (0.3 + q.y) * ppm, r, 0, 7); c.fill(); }
      if (inFlood(st.x) && st.v > 0.4 && st.x > F.from && st.x < F.to + 2) {
        const fx = X(st.x), h = Math.min(1.4, 0.3 + st.v * 0.25) * ppm;
        c.fillStyle = 'rgba(235,245,250,0.55)'; c.beginPath(); c.moveTo(fx - 0.5 * ppm, gy - 0.4 * ppm); c.quadraticCurveTo(fx + 1.2 * ppm, gy - 0.4 * ppm - h, fx + 2.4 * ppm, gy - 0.3 * ppm); c.closePath(); c.fill();
      }
    }
  }

  function drawBoards35(V) {
    const { c, ppm, gy, X, wx0, wx1 } = V;
    ROUTE.crossings.forEach((cr) => {
      const bx = cr.hornFrom + 40; if (bx < wx0 - 5 || bx > wx1 + 5) return;
      const x = X(bx), base = gy - 0.7 * ppm, top = base - 2.8 * ppm, w = 1.1 * ppm, h = 0.75 * ppm;
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x - 0.4 * ppm, base, 0.7 * ppm, 0.12 * ppm, 0, 0, 7); c.fill();
      c.fillStyle = '#3a3a3a'; c.fillRect(x - 0.06 * ppm, top, 0.12 * ppm, base - top);
      c.fillStyle = '#f4f1e8'; c.fillRect(x - w / 2, top - h, w, h);
      c.strokeStyle = '#1b1b1b'; c.lineWidth = Math.max(1, 0.07 * ppm); c.strokeRect(x - w / 2, top - h, w, h);
      c.fillStyle = '#1b1b1b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `900 ${Math.round(h * 0.78)}px "Big Shoulders Display", sans-serif`; c.fillText('35', x, top - h * 0.48);
      c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    });
  }
  function drawGoats(V) {
    ROUTE.goats.forEach((g, i) => drawGoat(V, g, V.st.goats ? V.st.goats[i] : null));
  }
  function drawGoat(V, g, gst) {
    const { c, ppm, gy, X } = V;
    const gs = gst ? gst.state : 'idle';
    if (gs === 'gone') return;
    const t = gs === 'flee' ? gst.t : 0;
    const sx = X(g.x + t * 2.5), sy = gy - 0.2 * ppm + t * t * 2.2 * ppm;
    if (sx < -30 || sx > W + 30) return;
    c.save(); c.globalAlpha = clamp(1 - t / 2.2, 0, 1);
    c.fillStyle = '#ece6da';
    c.beginPath(); c.ellipse(sx, sy - 1.0 * ppm, 0.65 * ppm, 0.38 * ppm, 0, 0, 7); c.fill();
    c.fillRect(sx - 0.5 * ppm, sy - 0.8 * ppm, 0.12 * ppm, 0.8 * ppm); c.fillRect(sx + 0.38 * ppm, sy - 0.8 * ppm, 0.12 * ppm, 0.8 * ppm);
    c.beginPath(); c.ellipse(sx + 0.75 * ppm, sy - 1.45 * ppm, 0.26 * ppm, 0.2 * ppm, -0.4, 0, 7); c.fill();
    c.strokeStyle = '#6b5a45'; c.lineWidth = Math.max(1, 0.08 * ppm);
    c.beginPath(); c.moveTo(sx + 0.7 * ppm, sy - 1.6 * ppm); c.quadraticCurveTo(sx + 0.5 * ppm, sy - 2 * ppm, sx + 0.35 * ppm, sy - 1.8 * ppm); c.stroke();
    c.restore();
  }

  function wheel(c, x, y, r, ang, col) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = '#8b8f92'; c.lineWidth = Math.max(1, r * 0.12);
    c.beginPath(); c.arc(x, y, r * 0.85, 0, 7); c.stroke();
    c.lineWidth = Math.max(1, r * 0.08);
    for (let k = 0; k < 8; k++) {
      const a = ang + (k * Math.PI) / 4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); c.stroke();
    }
    c.fillStyle = '#b9bdbf'; c.beginPath(); c.arc(x, y, r * 0.18, 0, 7); c.fill();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y); c.lineTo(x + w - rr, y); c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr); c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h); c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr); c.quadraticCurveTo(x, y, x + rr, y); c.closePath();
  }
  // roda cakram dengan tanda putar kecil supaya gerakannya terlihat
  function trainWheel(c, x, y, r, ang) {
    c.fillStyle = '#2b2f32'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = '#a7adb1'; c.lineWidth = Math.max(1, r * 0.18); c.beginPath(); c.arc(x, y, r * 0.86, 0, 7); c.stroke();
    c.fillStyle = '#d7dbde';
    c.beginPath(); c.arc(x, y, r * 0.28, 0, 7); c.fill();
    c.beginPath(); c.arc(x + Math.cos(ang) * r * 0.58, y + Math.sin(ang) * r * 0.58, r * 0.13, 0, 7); c.fill();
  }

  // ornamen livery Si Gagah (pita emas di sisi lokomotif): kawung, parang, atau mega mendung
  let LOCO_ORN = 'kawung';
  function drawOrnament(c, kind, x0, x1, yTop, yBot, u, col) {
    const h = yBot - yTop, ym = (yTop + yBot) / 2;
    c.save();
    c.fillStyle = col; c.strokeStyle = col;
    if (kind === 'kawung') {
      // empat kelopak lonjong mengelilingi titik, berulang
      const step = u * 1.0, r = u * 0.42;
      for (let x = x0; x < x1 + step; x += step) {
        for (let row = -1; row <= 1; row++) {
          const cx = x + (row & 1 ? step / 2 : 0), cy = ym + row * step;
          if (cy < yTop - r * 2 || cy > yBot + r * 2) continue;
          for (let k = 0; k < 4; k++) {
            const a = k * Math.PI / 2 + Math.PI / 4;
            c.beginPath(); c.ellipse(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.55, r * 0.27, a, 0, 7); c.fill();
          }
          c.save(); c.fillStyle = '#6e1510'; c.beginPath(); c.arc(cx, cy, r * 0.12, 0, 7); c.fill(); c.restore();
        }
      }
    } else if (kind === 'parang') {
      // pita diagonal bergelombang (lereng) dengan titik mlinjon
      const step = u * 0.95;
      c.lineWidth = Math.max(1, u * 0.16); c.lineCap = 'round';
      for (let x = x0 - h; x < x1 + h; x += step) {
        c.beginPath();
        for (let k = 0; k <= 10; k++) { const t = k / 10, px = x + t * h * 1.1, py = yBot - t * h; const w = Math.sin(t * Math.PI * 2) * u * 0.14; k ? c.lineTo(px + w, py) : c.moveTo(px + w, py); }
        c.stroke();
        c.beginPath(); c.ellipse(x + h * 0.55 + step * 0.5, ym, u * 0.13, u * 0.2, -0.8, 0, 7); c.fill();
      }
      c.lineCap = 'butt';
    } else {
      // mega mendung: awan bergulung dengan garis berlapis
      const step = u * 2.4;
      c.lineWidth = Math.max(1, u * 0.09);
      for (let x = x0; x < x1 + step; x += step) {
        const cy = ym + u * 0.06;
        for (let ring = 0; ring < 3; ring++) {
          const rr = u * (0.28 + ring * 0.13);
          c.beginPath(); c.arc(x, cy, rr, Math.PI, Math.PI * 2.1); c.arc(x + rr * 1.55, cy, rr * 0.65, Math.PI * 1.1, Math.PI * 2); c.arc(x + step / 2, cy + u * 0.05, rr * 0.8, Math.PI, Math.PI * 1.9); c.stroke();
        }
        c.beginPath(); c.arc(x, cy, u * 0.12, 0, 7); c.fill();
      }
      c.fillRect(x0, yBot - u * 0.08, x1 - x0, u * 0.08);
    }
    c.restore();
  }

  // lokomotif diesel-elektrik CC "Si Gagah" + tiga gerbong stainless, digambar 2.5D:
  // sisi kereta menghadap kamera, atap dan muka depan sedikit terlihat dari atas-kanan.
  // skala nyata: badan kereta dirancang setinggi 6,75 m; digambar ulang dengan tinggi diskalakan dari lantai
  // rangka (1,05 m) sehingga atap sekitar 4,1 m. Roda, bogie, dan rangka bawah tetap dalam ukuran aslinya.
  function drawTrain(V) {
    const { c, ppm, gy } = V;
    const yP = gy - VPIV * ppm;
    c.save(); c.beginPath(); c.rect(-60, yP, W + 120, H); c.clip(); drawTrainRaw(V); c.restore();
    c.save(); c.beginPath(); c.rect(-60, -H, W + 120, yP + H); c.clip();
    c.translate(0, yP); c.scale(1, VS); c.translate(0, -yP); drawTrainRaw(Object.assign({}, V, { upper: true })); c.restore();
  }
  function drawTrainRaw(V) {
    const { c, ppm, gy, X, st } = V;
    const fx = X(st.x);
    if (fx - TRAIN_LEN * ppm > W + 60 || fx < -60) return;
    const L = (m) => fx - m * ppm;     // m meter di belakang moncong
    const Y = (h) => gy - h * ppm;     // h meter di atas kepala rel
    const lw = (k) => Math.max(1, k * ppm);
    const box = (m0, m1, h0, h1, fill) => { c.fillStyle = fill; c.fillRect(L(m1), Y(h1), (m1 - m0) * ppm, (h1 - h0) * ppm); };
    const poly = (pts, fill) => {
      c.fillStyle = fill; c.beginPath();
      pts.forEach(([m, h], i) => (i ? c.lineTo(L(m), Y(h)) : c.moveTo(L(m), Y(h))));
      c.closePath(); c.fill();
    };
    const line = (pts, col, w) => {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      pts.forEach(([m, h], i) => (i ? c.lineTo(L(m), Y(h)) : c.moveTo(L(m), Y(h))));
      c.stroke();
    };
    const vgrad = (hTop, hBot, stops) => {
      const g = c.createLinearGradient(0, Y(hTop), 0, Y(hBot));
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      return g;
    };
    const ang = (st.x + (st.spin || 0)) / 0.5;
    const rimOn = V.rimA > 0.02;
    // posisi tiap kendaraan: geser sambungan (kedua lapis), ayunan suspensi & angguk (hanya badan)
    const carXform = (idx) => {
      const D = st.carDyn && st.carDyn[idx]; if (!D) return;
      if (D.s) c.translate(-D.s * ppm, 0);
      if (V.upper && !REDUCE_MOTION) {
        const [mF, len] = carSpan(idx), cx = L(mF + len / 2), cy = Y(VPIV);
        c.translate(cx, cy - D.dy * ppm * 1.6); c.rotate(D.pitch); c.translate(-cx, -cy);
      }
    };
    const gapD = (idx) => (st.carDyn && st.carDyn[idx] && st.carDyn[idx - 1] ? st.carDyn[idx].s - st.carDyn[idx - 1].s : 0);

    // ---- bayangan ----
    const x0 = L(TRAIN_LEN), x1 = fx;
    if (V.sunShadow > 0.01) {
      // bayangan panjang matahari pagi jatuh ke depan-kiri di atas balas dan sawah
      const sg = c.createLinearGradient(0, gy, 0, gy + 5 * ppm);
      sg.addColorStop(0, `rgba(10,14,20,${0.42 * V.sunShadow})`); sg.addColorStop(1, 'rgba(10,14,20,0)');
      c.fillStyle = sg; c.beginPath();
      c.moveTo(x0, gy + 0.3 * ppm); c.lineTo(x1, gy + 0.3 * ppm);
      c.lineTo(x1 - 7 * ppm, gy + 5 * ppm); c.lineTo(x0 - 7 * ppm, gy + 5 * ppm); c.closePath(); c.fill();
    }
    c.save(); c.globalAlpha = 0.45; c.fillStyle = '#05070a';
    c.beginPath(); c.ellipse((x0 + x1) / 2, gy + 0.35 * ppm, (x1 - x0) / 2 + ppm, 0.55 * ppm, 0, 0, 7); c.fill();
    c.restore();

    // ---- gerbong stainless ----
    const steel = vgrad(4.85, 1.0, [[0, '#f6f8fa'], [0.45, '#d9dfe3'], [0.85, '#b3bcc2'], [1, '#98a2a9']]);
    const glass = vgrad(4.35, 2.95, [[0, '#3b5263'], [0.5, '#1d2b36'], [1, '#121b23']]);
    const roofTop = vgrad(6.55, 6.05, [[0, '#f1f4f5'], [1, '#c7cfd3']]);
    const roofSide = vgrad(6.1, 4.8, [[0, '#cdd4d8'], [1, '#8f999f']]);
    if (MIS.freight) drawWagons(Object.assign({}, V, { carXform, gapD }), L, Y, box, poly, line, vgrad, ang);
    for (let k = 0; k < (MIS.freight ? 0 : N_COACH); k++) {
      const F = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      const u = (px) => F + (240 - px) / 12; // koordinat desain 0..240 px (12 px = 1 m)
      if (L(F + COACH_LEN) > W + 30 || L(F) < -60) continue;
      c.save(); carXform(k + 1);
      // bellow sambungan antargerbong (lipatan akordeon), ikut merenggang & merapat
      const gd = gapD(k + 1);
      box(F - GAP - gd, F, 1.25, 4.6, '#1b1e21');
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; c.beginPath();
      for (let q = 0.2; q < GAP + gd; q += 0.3) { c.moveTo(L(F - q), Y(4.5)); c.lineTo(L(F - q), Y(1.35)); }
      c.stroke();
      // rangka bawah, peralatan, bogie
      box(u(220), u(20), 0.62, 1.02, '#191c1f');
      c.fillStyle = vgrad(1.02, 0.3, [[0, '#30363b'], [1, '#1d2125']]);
      roundRect(c, L(u(150)), Y(1.0), (60 / 12) * ppm, 0.65 * ppm, 0.12 * ppm); c.fill();
      roundRect(c, L(u(196)), Y(0.95), (18 / 12) * ppm, 0.45 * ppm, 0.1 * ppm); c.fill();
      for (const [a, b] of [[26, 76], [164, 214]]) {
        c.fillStyle = '#272b2f'; roundRect(c, L(u(a)), Y(0.98), ((b - a) / 12) * ppm, 0.55 * ppm, 0.15 * ppm); c.fill();
        c.fillStyle = '#3a4045'; c.fillRect(L(u((a + b) / 2 + 4)), Y(1.0), 0.6 * ppm, 0.3 * ppm);
      }
      [38, 64, 176, 202].forEach((px) => trainWheel(c, L(u(px)), Y(0.48), 0.46 * ppm, ang * 1.17));
      // atap: muka atas (terlihat dari atas) dan lengkung samping, unit AC
      c.fillStyle = roofTop; c.beginPath();
      c.moveTo(L(u(2)), Y(6.05)); c.lineTo(L(u(238)), Y(6.05)); c.lineTo(L(u(236)) + 0.25 * ppm, Y(6.5)); c.lineTo(L(u(4)) + 0.25 * ppm, Y(6.5)); c.closePath(); c.fill();
      c.fillStyle = roofSide; c.beginPath();
      c.moveTo(L(u(0)), Y(4.8)); c.lineTo(L(u(0)), Y(5.4)); c.quadraticCurveTo(L(u(1)), Y(6.05), L(u(10)), Y(6.08));
      c.lineTo(L(u(230)), Y(6.08)); c.quadraticCurveTo(L(u(239)), Y(6.05), L(u(240)), Y(5.4)); c.lineTo(L(u(240)), Y(4.8)); c.closePath(); c.fill();
      for (const [a, b] of [[34, 82], [158, 206]]) {
        c.fillStyle = vgrad(6.75, 6.2, [[0, '#eef1f3'], [1, '#aeb7bd']]);
        roundRect(c, L(u(a)) + 0.2 * ppm, Y(6.75), ((b - a) / 12) * ppm, 0.6 * ppm, 0.2 * ppm); c.fill();
        c.strokeStyle = 'rgba(70,80,88,0.5)'; c.lineWidth = 1; c.beginPath();
        for (let q = a + 6; q < b - 2; q += 6) { c.moveTo(L(u(q)) + 0.2 * ppm, Y(6.7)); c.lineTo(L(u(q)) + 0.2 * ppm, Y(6.25)); }
        c.stroke();
      }
      // badan sisi
      c.fillStyle = steel; roundRect(c, L(u(0)), Y(4.85), COACH_LEN * ppm, 3.85 * ppm, 0.35 * ppm); c.fill();
      c.fillStyle = vgrad(1.5, 1.0, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']]);
      c.fillRect(L(u(0)), Y(1.5), COACH_LEN * ppm, 0.5 * ppm);
      line([[u(30), 1.72], [u(210), 1.72]], 'rgba(255,255,255,0.4)', 1);
      line([[u(30), 1.42], [u(210), 1.42]], 'rgba(255,255,255,0.4)', 1);
      box(u(240), u(0), 2.27, 2.6, '#f2a516');
      box(u(240), u(0), 2.0, 2.22, '#1f6f6d');
      // jendela berbingkai
      for (let i = 0; i < 7; i++) {
        const a = 36 + i * 24.4, wx = L(u(a)), ww = (21 / 12) * ppm;
        c.fillStyle = '#5d676e'; roundRect(c, wx - 1, Y(4.38) - 1, ww + 2, 1.46 * ppm + 2, 0.22 * ppm); c.fill();
        c.fillStyle = glass; roundRect(c, wx, Y(4.38), ww, 1.46 * ppm, 0.2 * ppm); c.fill();
        if (V.lit) { c.fillStyle = 'rgba(255,214,140,0.85)'; roundRect(c, wx, Y(4.38), ww, 1.46 * ppm, 0.2 * ppm); c.fill(); }
        if (hash(i + k * 7) * 34 < st.aboard) {
          c.fillStyle = V.lit ? 'rgba(60,36,20,0.75)' : 'rgba(22,18,16,0.6)';
          c.beginPath(); c.arc(wx + ww * 0.45, Y(3.32), 0.27 * ppm, 0, 7); c.fill();
          c.fillRect(wx + ww * 0.45 - 0.32 * ppm, Y(3.05), 0.64 * ppm, 0.25 * ppm);
        }
        if (V.refl > 0.01) {
          c.fillStyle = `rgba(255,255,255,${V.refl})`; c.beginPath();
          c.moveTo(wx + ww * 0.25, Y(4.38)); c.lineTo(wx + ww * 0.55, Y(4.38)); c.lineTo(wx + ww * 0.3, Y(2.92)); c.lineTo(wx, Y(2.92)); c.lineTo(wx, Y(3.4)); c.closePath(); c.fill();
        }
      }
      // pintu di kedua ujung + tangga
      for (const d0 of [6, 214]) {
        const dx = L(u(d0)), dw = (20 / 12) * ppm;
        const op = st.doorAnim !== undefined ? st.doorAnim : st.doors === 'open' ? 1 : 0;
        // pintu geser: lubang gelap & lampu tangga, daun pintu bergeser ke samping
        if (op > 0.01) {
          c.fillStyle = '#10171b'; c.fillRect(dx, Y(4.55), dw, 3.4 * ppm);
          c.fillStyle = `rgba(242,201,76,${0.9 * op})`; c.fillRect(dx, Y(1.32), dw, 0.16 * ppm);
          c.fillStyle = `rgba(255,236,190,${0.16 * op})`; c.fillRect(dx + 0.15 * ppm, Y(4.4), dw - 0.3 * ppm, 0.8 * ppm);
        }
        const lx = dx - op * dw * 0.95;
        c.fillStyle = steel; c.fillRect(lx, Y(4.55), dw, 3.4 * ppm);
        c.fillStyle = glass; roundRect(c, lx + 0.3 * ppm, Y(4.2), dw - 0.6 * ppm, 1.2 * ppm, 0.15 * ppm); c.fill();
        c.strokeStyle = '#7d878d'; c.lineWidth = 1; c.strokeRect(dx, Y(4.55), dw, 3.4 * ppm);
        if (op < 0.01) line([[u(d0 + 10), 4.5], [u(d0 + 10), 1.2]], 'rgba(90,100,108,0.6)', 1);
        box(u(d0 + 18), u(d0 + 2), 0.75, 0.95, '#3a4045');
      }
      c.fillStyle = '#4a5358'; c.font = `700 ${Math.max(6, Math.round(0.5 * ppm))}px "Plus Jakarta Sans", sans-serif`;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(`K1 · 0${k + 1}`, L(u(36)), Y(1.2));
      if (rimOn) {
        c.save(); c.globalAlpha = V.rimA;
        line([[u(4), 6.06], [u(236), 6.06]], V.rim, lw(0.09));
        c.fillStyle = V.rim; c.fillRect(L(u(239)), Y(4.8), Math.max(1.5, 0.12 * ppm), 3.6 * ppm);
        c.restore();
      }
      c.restore();
    }

    // ---- lokomotif ----
    c.save(); carXform(0);
    const steelDark = vgrad(1.85, 1.15, [[0, '#353b40'], [1, '#1c2024']]);
    // rangka utama & sill
        c.fillStyle = steelDark; c.fillRect(L(15.85), Y(1.85), 15.7 * ppm, 0.7 * ppm);
    line([[15.85, 1.84], [0.15, 1.84]], 'rgba(255,255,255,0.22)', 1);
    // bogie CC: rangka berbentuk, pegas, kotak gandar, silinder rem
    for (const [a, b, axles] of [[9.3, 15.0, [13.85, 12.15, 10.45]], [0.7, 6.4, [5.2, 3.5, 1.8]]]) {
      poly([[b, 1.15], [b - 0.3, 0.5], [a + 0.3, 0.5], [a, 1.15]], '#262a2e');
      line([[b - 0.2, 0.82], [a + 0.2, 0.82]], 'rgba(255,255,255,0.12)', 1);
      for (const m of axles) {
        box(m - 0.28, m + 0.28, 0.98, 1.38, '#1b1f22');
        c.strokeStyle = '#6d757b'; c.lineWidth = 1; c.beginPath();
        for (let q = 1.02; q < 1.36; q += 0.09) { c.moveTo(L(m + 0.25), Y(q)); c.lineTo(L(m - 0.25), Y(q + 0.04)); }
        c.stroke();
      }
      [ (axles[0] + axles[1]) / 2, (axles[1] + axles[2]) / 2 ].forEach((m) => box(m - 0.3, m + 0.3, 0.55, 0.85, '#30363b'));
    }
    [13.85, 12.15, 10.45, 5.2, 3.5, 1.8].forEach((m) => {
      trainWheel(c, L(m), Y(0.52), 0.54 * ppm, ang);
      c.fillStyle = '#f2c230'; c.beginPath(); c.arc(L(m), Y(0.52), 0.13 * ppm, 0, 7); c.fill();
    });
    // tangki bahan bakar
    c.fillStyle = vgrad(1.25, 0.55, [[0, '#454c52'], [0.35, '#2d3338'], [1, '#1a1e21']]);
    roundRect(c, L(9.05), Y(1.25), 3.4 * ppm, 0.72 * ppm, 0.3 * ppm); c.fill();
    line([[8.95, 1.12], [5.75, 1.12]], 'rgba(255,255,255,0.18)', 1);
    box(7.2, 7.5, 1.25, 1.35, '#596168');
    // ambient occlusion di bawah badan
    c.fillStyle = vgrad(1.15, 0.45, [[0, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]);
    c.fillRect(L(15.85), Y(1.15), 15.7 * ppm, 0.7 * ppm);

    // ---- badan lokomotif diesel modern berbadan lebar (full-width carbody), moncong aerodinamis ----
    const red = vgrad(6.0, 1.85, [[0, '#e5513f'], [0.35, '#c8322a'], [0.8, '#a1221b'], [1, '#7e1813']]);
    const roofG = vgrad(6.4, 6.0, [[0, '#8a939a'], [1, '#5a6268']]);
    const glass2 = vgrad(5.8, 4.0, [[0, '#56708a'], [0.5, '#1f2d38'], [1, '#111a22']]);
    const gold = '#e9b949', cream = '#f6e3b0', bandBg = '#6e1510', mask = '#1b1416';
    // atap datar: muka atas sedikit terlihat
    poly([[15.55, 6.0], [1.2, 6.0], [1.5, 6.38], [15.3, 6.38]], roofG);
    // siluet badan: ujung belakang menyudut, moncong miring ke kaca depan lebar
    const bodyPts = [[15.85, 1.85], [15.85, 5.65], [15.55, 6.0], [1.2, 6.0], [0.75, 5.78], [-0.3, 3.98], [-0.62, 3.45], [-0.75, 3.0], [-0.75, 1.85]];
    poly(bodyPts, red);
    // sorotan lengkung di bahu atap
    line([[15.5, 5.93], [1.25, 5.93]], 'rgba(255,255,255,0.35)', 1);
    // muka depan 3/4 (sedikit terlihat)
    poly([[-0.75, 3.0], [-1.02, 2.88], [-1.02, 1.85], [-0.75, 1.85]], vgrad(3.0, 1.85, [[0, '#b52a22'], [1, '#6e1510']]));
    poly([[-0.62, 3.45], [-0.9, 3.3], [-1.02, 2.88], [-0.75, 3.0]], '#d4473a');
    // topeng hitam kaca depan yang membungkus ke jendela samping kabin
    poly([[3.75, 5.72], [0.95, 5.72], [0.72, 5.62], [-0.2, 4.08], [0.2, 3.98], [3.75, 3.98]], mask);
    poly([[0.95, 5.58], [0.82, 5.5], [-0.02, 4.12], [0.45, 4.12], [1.22, 5.58]], glass2);       // kaca depan miring
    c.fillStyle = glass2; roundRect(c, L(3.55), Y(5.55), 2.1 * ppm, 1.35 * ppm, 0.18 * ppm); c.fill(); // jendela samping
    if (V.cabA > 0.02) { c.fillStyle = `rgba(255,215,143,${V.cabA})`; roundRect(c, L(3.55), Y(5.55), 2.1 * ppm, 1.35 * ppm, 0.18 * ppm); c.fill(); }
    if (V.refl > 0.01) { poly([[3.2, 5.55], [2.8, 5.55], [3.15, 4.2], [3.55, 4.2], [3.55, 4.5]], `rgba(255,255,255,${V.refl})`); poly([[1.1, 5.55], [0.95, 5.55], [0.25, 4.12], [0.42, 4.12]], `rgba(255,255,255,${V.refl * 1.4})`); }
    line([[1.45, 5.55], [1.45, 4.2]], mask, lw(0.08));
    // pintu kabin
    c.strokeStyle = 'rgba(50,8,6,0.65)'; c.lineWidth = 1; c.strokeRect(L(4.75), Y(5.7), 0.85 * ppm, 3.8 * ppm);
    c.fillStyle = glass2; roundRect(c, L(4.62), Y(5.5), 0.6 * ppm, 0.85 * ppm, 0.12 * ppm); c.fill();
    c.fillStyle = '#c9b07a'; c.fillRect(L(4.0), Y(3.7), 0.08 * ppm, 0.45 * ppm);
    // sambungan panel badan
    c.strokeStyle = 'rgba(60,8,6,0.45)'; c.lineWidth = 1; c.beginPath();
    [5.05, 8.95, 11.6].forEach((m) => { c.moveTo(L(m), Y(5.95)); c.lineTo(L(m), Y(1.9)); });
    c.stroke();
    // panel isap udara mesin (kisi vertikal) & radiator besar (kisi mendatar) di bagian belakang
    for (const [a, b] of [[5.45, 6.85], [7.25, 8.65]]) {
      c.fillStyle = vgrad(5.7, 3.95, [[0, '#3a3f44'], [1, '#22262a']]); roundRect(c, L(b), Y(5.7), (b - a) * ppm, 1.75 * ppm, 0.1 * ppm); c.fill();
      c.strokeStyle = 'rgba(150,158,165,0.55)'; c.lineWidth = 1; c.beginPath();
      for (let m = a + 0.12; m < b - 0.05; m += 0.16) { c.moveTo(L(m), Y(5.62)); c.lineTo(L(m), Y(4.03)); }
      c.stroke();
    }
    c.fillStyle = vgrad(5.75, 3.95, [[0, '#3a3f44'], [1, '#1f2326']]); roundRect(c, L(15.35), Y(5.75), 3.5 * ppm, 1.8 * ppm, 0.12 * ppm); c.fill();
    c.strokeStyle = 'rgba(160,168,175,0.6)'; c.lineWidth = 1; c.beginPath();
    for (let h = 4.08; h < 5.7; h += 0.15) { c.moveTo(L(15.25), Y(h)); c.lineTo(L(11.95), Y(h)); }
    c.stroke();
    c.strokeStyle = 'rgba(233,185,73,0.7)'; c.lineWidth = 1; roundRect(c, L(15.35), Y(5.75), 3.5 * ppm, 1.8 * ppm, 0.12 * ppm); c.stroke();
    // pintu servis ruang mesin
    for (const [a, b] of [[9.2, 10.3], [10.4, 11.45]]) { c.strokeStyle = 'rgba(60,8,6,0.55)'; c.strokeRect(L(b), Y(5.6), (b - a) * ppm, 1.65 * ppm); c.fillStyle = '#c9b07a'; c.fillRect(L(a + 0.15), Y(4.9), 0.07 * ppm, 0.3 * ppm); }
    // sabuk bawah gelap
    box(-1.02, 15.85, 1.85, 2.32, '#2b2023');
    // pita ornamen emas di sepanjang badan, membungkus moncong
    const band = [[15.85, 2.45], [15.85, 3.72], [0.25, 3.72], [-0.48, 3.38], [-0.75, 3.0], [-0.75, 2.45]];
    poly(band, bandBg);
    c.save(); c.beginPath(); band.forEach(([m, h], i) => (i ? c.lineTo(L(m), Y(h)) : c.moveTo(L(m), Y(h)))); c.closePath(); c.clip();
    drawOrnament(c, LOCO_ORN, L(16), L(-1), Y(3.72), Y(2.45), 1.3 * ppm, gold);
    c.restore();
    line([[15.85, 3.79], [0.22, 3.79], [-0.52, 3.44]], cream, lw(0.07));
    line([[15.85, 2.38], [-0.75, 2.38]], cream, lw(0.07));
    // perlengkapan atap: unit AC kabin, klakson, cerobong knalpot diesel, kipas radiator, antena
    c.fillStyle = vgrad(6.85, 6.38, [[0, '#a3abb1'], [1, '#6a7378']]); roundRect(c, L(3.9), Y(6.8), 2.2 * ppm, 0.45 * ppm, 0.12 * ppm); c.fill();
    box(4.3, 5.0, 6.38, 6.55, '#5b646a'); poly([[4.3, 6.55], [4.12, 6.68], [4.12, 6.42], [4.3, 6.42]], '#4b545a');
    c.fillStyle = '#25292d'; roundRect(c, L(8.6), Y(6.85), 0.8 * ppm, 0.5 * ppm, 0.12 * ppm); c.fill();
    c.fillStyle = '#0d0f11'; c.beginPath(); c.ellipse(L(8.2), Y(6.85), 0.34 * ppm, 0.1 * ppm, 0, 0, 7); c.fill();
    for (const m of [14.4, 12.8]) {
      c.fillStyle = vgrad(6.62, 6.3, [[0, '#8a939a'], [1, '#4b545a']]);
      c.beginPath(); c.ellipse(L(m), Y(6.45), 0.72 * ppm, 0.24 * ppm, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(30,35,40,0.6)'; c.beginPath(); c.ellipse(L(m), Y(6.45), 0.46 * ppm, 0.15 * ppm, 0, 0, 7); c.stroke();
    }
    c.fillStyle = vgrad(6.65, 6.38, [[0, '#9aa3a9'], [1, '#626b71']]); roundRect(c, L(11.3), Y(6.65), 1.9 * ppm, 0.3 * ppm, 0.08 * ppm); c.fill();
    line([[6.0, 6.38], [6.0, 7.05]], '#5b646a', lw(0.05));
    // lampu: LED depan di moncong, lampu sorot atas kaca, lampu penanda bawah
    c.fillStyle = '#fff5d0'; roundRect(c, L(-0.68), Y(3.32), 0.42 * ppm, 0.2 * ppm, 0.08 * ppm); c.fill();
    c.fillStyle = '#fff5d0'; roundRect(c, L(-0.78), Y(2.95), 0.3 * ppm, 0.18 * ppm, 0.06 * ppm); c.fill();
    box(-1.0, -0.78, 2.12, 2.3, '#ff7a5c');
    box(0.95, 1.6, 5.66, 5.76, '#fff2c4');
    // papan nama & nomor
    c.fillStyle = '#3d0d0a'; roundRect(c, L(4.0), Y(4.42), 2.55 * ppm, 0.52 * ppm, 0.1 * ppm); c.fill();
    c.strokeStyle = gold; c.lineWidth = Math.max(1, 0.05 * ppm); roundRect(c, L(4.0), Y(4.42), 2.55 * ppm, 0.52 * ppm, 0.1 * ppm); c.stroke();
    c.fillStyle = gold; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 ${Math.max(6, Math.round(0.4 * ppm))}px "Big Shoulders Display", sans-serif`;
    c.fillText('SI GAGAH', L(2.72), Y(4.16));
    c.fillStyle = cream; c.textAlign = 'left';
    c.font = `800 ${Math.max(6, Math.round(0.42 * ppm))}px "Big Shoulders Display", sans-serif`;
    c.fillText('RN 2001', L(15.2), Y(2.09));
    // tangga kabin & pilot depan, kopling, selang udara
    c.strokeStyle = '#8d969b'; c.lineWidth = lw(0.05); c.beginPath();
    c.moveTo(L(4.85), Y(1.85)); c.lineTo(L(4.85), Y(0.55)); c.moveTo(L(4.25), Y(1.85)); c.lineTo(L(4.25), Y(0.55));
    for (let q = 0.7; q < 1.8; q += 0.38) { c.moveTo(L(4.85), Y(q)); c.lineTo(L(4.25), Y(q)); }
    c.stroke();
    poly([[0.45, 1.15], [-1.1, 0.28], [1.6, 0.28], [1.9, 1.15]], '#3c4246');
    poly([[-1.1, 0.28], [-0.55, 1.15], [-0.3, 1.15], [-0.75, 0.28]], gold);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    for (let q = 0; q < 3; q++) c.fillRect(L(1.25 - q * 0.45), Y(0.95), 0.22 * ppm, 0.5 * ppm);
    box(-1.1, 0.15, 1.15, 1.45, '#2a2f33');
    line([[-0.55, 1.1], [-0.7, 0.7]], '#d0392b', lw(0.06));
    line([[-0.25, 1.1], [-0.35, 0.7]], '#f2c230', lw(0.06));
    // cahaya tepi (sinar dari belakang-kanan)
    if (rimOn) {
      c.save(); c.globalAlpha = V.rimA;
      line([[15.3, 6.38], [1.5, 6.38]], V.rim, lw(0.09));
      line([[1.2, 6.0], [0.75, 5.78], [-0.3, 3.98], [-0.62, 3.45], [-0.9, 3.3], [-1.02, 2.88], [-1.02, 1.9]], V.rim, lw(0.09));
      c.restore();
    }
    // lampu depan berkedip saat klakson dibunyikan
    if (st.hornFlash > 0 && Math.floor(st.hornFlash * 6) % 2 === 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      [3.22, 2.86].forEach((h) => { const gx = L(-0.6), gyy = Y(h), r = 2.2 * ppm; const lg = c.createRadialGradient(gx, gyy, 0, gx, gyy, r); lg.addColorStop(0, 'rgba(255,246,210,0.95)'); lg.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = lg; c.beginPath(); c.arc(gx, gyy, r, 0, 7); c.fill(); });
      c.restore();
    }
    c.restore();
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  // gerbong kopi rakyat: berdiri di rel (didorong warga) atau tersambung di belakang rangkaian
  function drawCoffeeWagon(V) {
    const st = V.st; if (!st || !st.cw) return;
    const { c, ppm, gy, X } = V;
    const front = st.coupled ? st.x - TRAIN_LEN + WAGON_LEN : st.cw.front;
    const k = st.coupled ? 0 : 1 - ease01(st.cw.slide); // 1 = masih di rel samping
    const yOff = -k * 3.2 * ppm, xa = X(front - WAGON_LEN), xb = X(front);
    if (xb < -40 || xa > W + 40) return;
    const y = gy + yOff, ang = (st.coupled ? st.x : st.cw.front) / 0.46;
    c.save();
    c.fillStyle = 'rgba(10,8,6,0.3)'; c.beginPath(); c.ellipse((xa + xb) / 2, y + 0.3 * ppm, (xb - xa) / 2, 0.4 * ppm, 0, 0, 7); c.fill();
    c.fillStyle = '#1d2125'; c.fillRect(xa + 0.4 * ppm, y - 1.1 * ppm, xb - xa - 0.8 * ppm, 0.5 * ppm);
    [0.17, 0.83].forEach((u) => trainWheel(c, xa + (xb - xa) * u, y - 0.46 * ppm, 0.46 * ppm, ang));
    const body = trainH(4.0), base = trainH(1.15);
    c.fillStyle = '#7a3d2a'; c.fillRect(xa, y - body * ppm, xb - xa, (body - base) * ppm);
    c.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 1; i < 6; i++) c.fillRect(xa + (xb - xa) * i / 6, y - body * ppm, Math.max(1, 0.12 * ppm), (body - base) * ppm);
    c.fillStyle = '#c9b48a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(xa + (i + 0.6) * (xb - xa) / 6.2, y - (body + 0.25) * ppm, 0.95 * ppm, 0.42 * ppm, 0, 0, 7); c.fill(); }
    c.fillStyle = '#f4e7c4'; c.font = `800 ${Math.max(6, Math.round(0.55 * ppm))}px "Big Shoulders Display", sans-serif`; c.textBaseline = 'middle';
    c.fillText('KOPI LIWA', xa + 0.8 * ppm, y - (base + 0.9) * ppm); c.textBaseline = 'alphabetic';
    // perangkai
    c.fillStyle = '#3a3f44'; c.fillRect(xb - 0.1 * ppm, y - 1.25 * ppm, 0.6 * ppm, 0.3 * ppm);
    // warga mendorong dari belakang
    if (!st.coupled && st.cw.slide < 1.4) {
      for (let i = 0; i < 3; i++) person(c, xa - (0.6 + i * 0.9) * ppm, y + (0.2 + i * 0.25) * ppm, ppm, 21 + i, { color: ['#c0392b', '#3c8d5a', '#e1a63b'][i] });
    }
    c.restore();
  }

  // gerbong batu bara terbuka (gondola) dengan tumpukan muatan
  function drawWagons(V, L, Y, box, poly, line, vgrad, ang) {
    const { c, ppm, st } = V;
    const body = vgrad(3.7, 1.0, [[0, '#9a4a35'], [0.5, '#7a3526'], [1, '#55241a']]);
    for (let k = 0; k < N_COACH; k++) {
      const F = carFront(k);
      if (L(F + WAGON_LEN) > W + 30 || L(F) < -40) continue;
      c.save(); V.carXform(k + 1);
      box(F - GAP - V.gapD(k + 1), F, 1.25, 1.55, '#1b1e21');                // kopling
      box(F + 0.5, F + WAGON_LEN - 0.5, 0.62, 1.0, '#1a1d20');
      for (const [a, b] of [[F + 0.8, F + 4.2], [F + 7.8, F + 11.2]]) {
        c.fillStyle = '#272b2f'; roundRect(c, L(b), Y(0.98), (b - a) * ppm, 0.55 * ppm, 0.15 * ppm); c.fill();
      }
      [1.6, 3.4, 8.6, 10.4].forEach((o) => trainWheel(c, L(F + o), Y(0.48), 0.46 * ppm, ang * 1.17));
      // muatan batu bara di atas bibir gerbong
      const ld = st.load ? st.load[k] || 0 : 0;
      if (ld > 0.02) {
        const top = 3.7 + 0.95 * ld;
        c.fillStyle = '#16181b'; c.beginPath();
        c.moveTo(L(F + WAGON_LEN - 0.3), Y(3.6));
        c.quadraticCurveTo(L(F + WAGON_LEN * 0.75), Y(top + 0.15), L(F + WAGON_LEN / 2), Y(top));
        c.quadraticCurveTo(L(F + WAGON_LEN * 0.25), Y(top + 0.15), L(F + 0.3), Y(3.6));
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(160,170,180,0.35)';
        for (let q = 0; q < 14; q++) {
          const m = F + 1 + hash(q + k * 3.1) * (WAGON_LEN - 2), h = 3.7 + hash(q * 2.7 + k) * (top - 3.75) * 0.9;
          c.fillRect(L(m), Y(h), Math.max(1, 0.12 * ppm), Math.max(1, 0.12 * ppm));
        }
      }
      // badan gondola berusuk
      c.fillStyle = body; c.fillRect(L(F + WAGON_LEN), Y(3.7), WAGON_LEN * ppm, 2.7 * ppm);
      box(F, F + WAGON_LEN, 3.55, 3.75, '#b25c43');
      c.strokeStyle = 'rgba(30,12,8,0.45)'; c.lineWidth = Math.max(1, 0.12 * ppm); c.beginPath();
      for (let m = F + 0.6; m < F + WAGON_LEN; m += 1.35) { c.moveTo(L(m), Y(3.55)); c.lineTo(L(m), Y(1.05)); }
      c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(L(F + WAGON_LEN), Y(1.5), WAGON_LEN * ppm, 0.5 * ppm);
      c.fillStyle = '#f2e6c8'; c.font = `800 ${Math.max(6, Math.round(0.5 * ppm))}px "Big Shoulders Display", sans-serif`;
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(`GD · 0${k + 1}`, L(F + WAGON_LEN - 0.9), Y(2.3));
      if (V.rimA > 0.02) { c.save(); c.globalAlpha = V.rimA; line([[F + WAGON_LEN, 3.76], [F, 3.76]], V.rim, Math.max(1, 0.09 * ppm)); c.restore(); }
      c.restore();
    }
  }

  // silo muat tambang: kaki & bak di belakang kereta, corong & curahan di depan
  function drawSilo(V, layer) {
    const Ld = ROUTE.loading;
    if (!Ld) return;
    const { c, ppm, gy, X, st } = V;
    const sx = X(Ld.silo);
    if (sx < -20 * ppm || sx > W + 20 * ppm) return;
    if (layer === 'back') {
      // tumpukan batu bara & konveyor ke bukit
      c.fillStyle = '#1c1d20';
      c.beginPath(); c.moveTo(sx - 26 * ppm, gy - 1.2 * ppm); c.quadraticCurveTo(sx - 18 * ppm, gy - 10 * ppm, sx - 9 * ppm, gy - 1.2 * ppm); c.closePath(); c.fill();
      c.strokeStyle = '#5a5f63'; c.lineWidth = Math.max(2, 0.35 * ppm);
      c.beginPath(); c.moveTo(sx + 2 * ppm, gy - 15.5 * ppm); c.lineTo(sx + 30 * ppm, gy - 4 * ppm); c.stroke();
      c.lineWidth = Math.max(1, 0.12 * ppm); c.beginPath();
      for (let q = 0; q < 8; q++) { const x = sx + (4 + q * 3.4) * ppm, y = gy - (14.7 - q * 1.4) * ppm; c.moveTo(x, y); c.lineTo(x, gy - 1.2 * ppm); }
      c.stroke();
      // kaki baja
      c.fillStyle = '#4b5156';
      [-5.2, 4.6].forEach((o) => c.fillRect(sx + o * ppm, gy - 13 * ppm, 0.6 * ppm, 12.4 * ppm));
      c.strokeStyle = '#4b5156'; c.lineWidth = Math.max(1, 0.15 * ppm); c.beginPath();
      c.moveTo(sx - 4.9 * ppm, gy - 12 * ppm); c.lineTo(sx + 4.9 * ppm, gy - 7.5 * ppm);
      c.moveTo(sx + 4.9 * ppm, gy - 12 * ppm); c.lineTo(sx - 4.9 * ppm, gy - 7.5 * ppm); c.stroke();
      // bak silo
      const g = c.createLinearGradient(sx - 6 * ppm, 0, sx + 6 * ppm, 0);
      g.addColorStop(0, '#7b8086'); g.addColorStop(0.5, '#a3a9ae'); g.addColorStop(1, '#6a6f74');
      c.fillStyle = g;
      c.fillRect(sx - 6 * ppm, gy - 19 * ppm, 12 * ppm, 6 * ppm);
      c.beginPath(); c.moveTo(sx - 6 * ppm, gy - 13 * ppm); c.lineTo(sx + 6 * ppm, gy - 13 * ppm); c.lineTo(sx + 1 * ppm, gy - 9.5 * ppm); c.lineTo(sx - 1 * ppm, gy - 9.5 * ppm); c.closePath(); c.fill();
      c.fillStyle = '#f2c230'; c.fillRect(sx - 6 * ppm, gy - 17.4 * ppm, 12 * ppm, 0.8 * ppm);
      c.fillStyle = '#1d2a2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.max(7, Math.round(0.65 * ppm))}px "Big Shoulders Display", sans-serif`;
      c.fillText('SILO MUAT 1', sx, gy - 17 * ppm);
      c.textAlign = 'start'; c.textBaseline = 'alphabetic';
    } else {
      // pipa corong + curahan batu bara saat memuat
      c.fillStyle = '#3a3f44'; c.fillRect(sx - 0.7 * ppm, gy - 9.6 * ppm, 1.4 * ppm, 3.6 * ppm);
      c.fillStyle = '#2a2e32'; c.fillRect(sx - 1 * ppm, gy - 6.2 * ppm, 2 * ppm, 0.5 * ppm);
      if (st.loadT > 0) {
        c.fillStyle = '#121315';
        const wob = Math.sin(performance.now() / 60) * 0.1 * ppm;
        c.fillRect(sx - 0.55 * ppm + wob, gy - 5.8 * ppm, 1.1 * ppm, (5.8 - trainH(4.3)) * ppm);
        for (let q = 0; q < 10; q++) c.fillRect(sx + (hash(q + Math.floor(performance.now() / 70)) - 0.5) * 1.4 * ppm, gy - (trainH(4.3) + hash(q * 3.3) * 1.6) * ppm, 2, 2);
      }
    }
  }

  // rombongan gajah Sumatra: dua induk dan seekor anak menyeberang dari sisi jauh ke dekat
  function drawElephants(V, layer) {
    const E = ROUTE.elephants;
    if (!E) return;
    const { c, ppm, gy, X, st } = V;
    const el = st.eleph || { phase: 'idle', prog: 0 };
    if (el.phase === 'gone') return;
    const prog = el.phase === 'cross' ? el.prog : 0;
    const front = prog > 0.3;  // setelah lewat rel, gajah berada di depan kereta
    if ((layer === 'front') !== front) return;
    const herd = [[0, 1], [6.5, 1.08], [3.5, 0.6]];
    for (const [off, sc] of herd) {
      const ex = X(E.x + off + prog * 4);
      if (ex < -60 || ex > W + 60) continue;
      const s2 = ppm * sc * (1 + prog * 0.35);
      const ey = gy + (el.phase === 'idle' ? -1.2 * ppm : prog * 7.5 * ppm) + Math.sin(performance.now() / 300 + off) * 0.05 * ppm;
      c.save(); c.globalAlpha = prog > 0.85 ? (1 - prog) / 0.15 : 1;
      if (V.sunShadow > 0.01) { c.fillStyle = `rgba(0,0,0,${0.22 * V.sunShadow})`; c.beginPath(); c.ellipse(ex - 1.2 * s2, ey + 0.1 * s2, 2.6 * s2, 0.35 * s2, 0, 0, 7); c.fill(); }
      const bg = c.createLinearGradient(0, ey - 3.4 * s2, 0, ey);
      bg.addColorStop(0, V.night ? '#4d4e5a' : '#8c8a8e'); bg.addColorStop(1, V.night ? '#2c2d36' : '#57565b');
      c.fillStyle = bg;
      // kaki
      [[-1.3, 0], [-0.6, 0.1], [0.7, 0], [1.3, 0.1]].forEach(([dx, dy], i) => {
        const step = el.phase === 'cross' ? Math.sin(performance.now() / 220 + i * 1.6) * 0.12 * s2 : 0;
        c.fillRect(ex + dx * s2 - 0.28 * s2, ey - 1.3 * s2 + dy * s2, 0.56 * s2, 1.3 * s2 + step);
      });
      // badan, kepala, telinga, belalai
      c.beginPath(); c.ellipse(ex, ey - 2.1 * s2, 2.0 * s2, 1.25 * s2, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(ex + 2.0 * s2, ey - 2.5 * s2, 0.85 * s2, 0.8 * s2, 0, 0, 7); c.fill();
      c.fillStyle = V.night ? '#3e3f4a' : '#76747a';
      c.beginPath(); c.ellipse(ex + 1.65 * s2, ey - 2.4 * s2, 0.55 * s2, 0.75 * s2, -0.2, 0, 7); c.fill();
      c.strokeStyle = V.night ? '#3a3b46' : '#605f64'; c.lineWidth = 0.42 * s2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ex + 2.65 * s2, ey - 2.3 * s2); c.quadraticCurveTo(ex + 3.0 * s2, ey - 1.2 * s2, ex + 2.7 * s2, ey - 0.6 * s2); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = '#111'; c.beginPath(); c.arc(ex + 2.35 * s2, ey - 2.75 * s2, 0.08 * s2, 0, 7); c.fill();
      if (V.rimA > 0.05) { c.globalAlpha *= V.rimA * 0.7; c.strokeStyle = V.rim; c.lineWidth = Math.max(1, 0.08 * s2); c.beginPath(); c.ellipse(ex, ey - 2.12 * s2, 1.98 * s2, 1.23 * s2, 0, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      c.restore();
    }
  }

  // dermaga batu bara di tepi laut: laut, kapal tongkang, derek, dan timbunan
  function drawPort(V) {
    const st = ROUTE.stations.find((q) => q.port);
    if (!st) return;
    const { c, ppm, gy, X, p } = V;
    const fade = clamp((V.camX + W / ppm - (st.x - 420)) / 160, 0, 1);
    if (fade <= 0) return;
    c.save(); c.globalAlpha = fade;
    const sy = gy - 9 * ppm;
    const x0 = Math.max(0, X(st.x - 430));
    const sg = c.createLinearGradient(0, sy, 0, gy);
    sg.addColorStop(0, mix('#6f8fb0', '#7fb2cf', p)); sg.addColorStop(1, mix('#3d6a86', '#4f8aa6', p));
    c.fillStyle = sg; c.fillRect(x0, sy, W - x0, gy - sy);
    c.fillStyle = 'rgba(255,240,210,0.35)'; c.fillRect(x0, sy, W - x0, 1);
    // tongkang dengan muatan & kapal tunda
    const bx = X(st.x + 40);
    c.fillStyle = '#2b2f36'; c.beginPath(); c.moveTo(bx - 14 * ppm, sy + 2.2 * ppm); c.lineTo(bx + 16 * ppm, sy + 2.2 * ppm); c.lineTo(bx + 14 * ppm, sy + 3.6 * ppm); c.lineTo(bx - 13 * ppm, sy + 3.6 * ppm); c.closePath(); c.fill();
    c.fillStyle = '#16181b'; c.beginPath(); c.moveTo(bx - 12 * ppm, sy + 2.2 * ppm); c.quadraticCurveTo(bx, sy - 1.4 * ppm, bx + 13 * ppm, sy + 2.2 * ppm); c.closePath(); c.fill();
    c.fillStyle = '#c0392b'; c.fillRect(bx + 18 * ppm, sy + 1.6 * ppm, 5 * ppm, 1.6 * ppm);
    c.fillStyle = '#eef2f4'; c.fillRect(bx + 19.5 * ppm, sy + 0.4 * ppm, 2.2 * ppm, 1.2 * ppm);
    // derek pemuat kapal
    const cx = X(st.x + 18);
    c.strokeStyle = '#d9a13a'; c.lineWidth = Math.max(2, 0.35 * ppm); c.beginPath();
    c.moveTo(cx, gy - 0.5 * ppm); c.lineTo(cx, gy - 16 * ppm); c.lineTo(cx + 18 * ppm, gy - 12 * ppm);
    c.moveTo(cx + 3 * ppm, gy - 0.5 * ppm); c.lineTo(cx + 3 * ppm, gy - 15 * ppm); c.stroke();
    c.lineWidth = Math.max(1, 0.12 * ppm); c.beginPath(); c.moveTo(cx + 14 * ppm, gy - 12.9 * ppm); c.lineTo(cx + 14 * ppm, gy - 8 * ppm); c.stroke();
    c.restore();
  }

  // gumpalan asap lembut: sprite gradasi radial yang dibuat sekali per warna
  const puffSprites = {};
  function puffSprite(rgb) {
    if (puffSprites[rgb]) return puffSprites[rgb];
    const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 64;
    const x = cv2.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.45, `rgba(${rgb},0.75)`); gr.addColorStop(0.75, `rgba(${rgb},0.3)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    puffSprites[rgb] = cv2;
    return cv2;
  }
  function drawSmoke(V) {
    const { c, ppm, gy, X, st, p } = V;
    // warna asap mengikuti cahaya: abu kecokelatan saat fajar, abu terang saat mendung, abu kebiruan diterangi bulan
    let dark;
    if (V.night) dark = '122,128,150';
    else if (V.storm) dark = '128,134,144';
    else { const k = Math.round(lerp(92, 128, p)); dark = `${k},${k - 4},${k - 2}`; }
    const smokeSp = puffSprite(dark), steamSp = puffSprite('246,246,246'), sandSp = puffSprite('176,138,85');
    const sootSp = puffSprite(V.night ? '72,76,94' : '58,58,62');
    const dustSp = puffSprite('70,64,58'), tanSp = puffSprite(V.night ? '90,86,96' : '196,170,130');
    c.save();
    for (const s of st.smoke || []) {
      const t = s.life / s.max;
      const fade = t < 0.08 ? t / 0.08 : 1 - (t - 0.08) / 0.92;
      const a = s.a * fade * (V.night && !s.white && !s.sand ? 0.6 : 1);
      if (a <= 0.01) continue;
      const r = s.r * ppm * 1.35;
      c.globalAlpha = Math.min(1, a);
      c.drawImage(s.tan ? tanSp : s.dust ? dustSp : s.sand ? sandSp : s.white ? steamSp : s.dark ? sootSp : smokeSp, V.bx(s.x) - r, gy - s.y * ppm - r + V.bdy(s.x), r * 2, r * 2);
    }
    for (const l of st.leaves || []) {
      c.save(); c.globalAlpha = clamp(1 - l.life / l.max, 0, 1);
      c.translate(V.bx(l.x), gy - l.y * ppm + V.bdy(l.x)); c.rotate(l.rot); c.fillStyle = l.col;
      c.fillRect(-0.22 * ppm, -0.08 * ppm, 0.44 * ppm, 0.16 * ppm); c.restore();
    }
    c.restore();
  }

  // jembatan baja busur (tied-arch) modern: rusuk belakang digambar di balik kereta,
  // rusuk depan, batang gantung dan tepi lantai di depan kereta
  function bridgeGeom(V) {
    const b = ROUTE.bridge;
    if (!b) return null;
    const { X, ppm, gy } = V;
    const a0 = b.from + 4, a1 = b.to - 4, span = a1 - a0, mid = (a0 + a1) / 2;
    const rise = Math.min(17, span * 0.12);
    const x0 = X(a0), x1 = X(a1);
    if (x1 < -40 || x0 > W + 40) return null;
    const hAt = (x) => { const t = (x - mid) / (span / 2); return Math.max(0, rise * (1 - t * t)); };
    return { a0, a1, span, mid, rise, hAt, x0, x1, ppm, gy };
  }
  function archPath(c, V, G, dx, dy, hOff) {
    c.beginPath();
    for (let i = 0; i <= 48; i++) {
      const x = G.a0 + (G.span * i) / 48;
      const sx = V.X(x) + dx, sy = G.gy - (G.hAt(x) + hOff) * G.ppm + dy;
      if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    }
  }
  // jembatan kayu (rangka kuda-kuda kayu ulin) untuk jalur cabang tua
  function drawTrestle(V, layer) {
    const b = ROUTE.bridge, { c, X, ppm, gy } = V;
    const x0 = X(b.from), x1 = X(b.to);
    if (x1 < -40 || x0 > W + 40) return;
    const wood = V.night ? '#3a2c20' : '#6b4e32', woodD = V.night ? '#261c14' : '#4a3624';
    const far = layer === 'back', dy = far ? -0.9 * ppm : 0, dx = far ? 0.7 * ppm : 0;
    c.save(); c.strokeStyle = far ? woodD : wood; c.lineCap = 'round';
    const bot = gy + 7 * ppm;
    for (let m = b.from; m <= b.to + 0.1; m += 6) {
      const sx = X(m) + dx;
      c.lineWidth = Math.max(1, 0.38 * ppm); c.beginPath(); c.moveTo(sx, gy + 0.4 * ppm + dy); c.lineTo(sx - 0.9 * ppm, bot + dy); c.moveTo(sx, gy + 0.4 * ppm + dy); c.lineTo(sx + 0.9 * ppm, bot + dy); c.stroke();
      if (m + 6 <= b.to + 0.1) {
        const sx2 = X(m + 6) + dx; c.lineWidth = Math.max(1, 0.2 * ppm);
        c.beginPath(); c.moveTo(sx, gy + 0.6 * ppm + dy); c.lineTo(sx2, gy + 3.6 * ppm + dy); c.moveTo(sx2, gy + 0.6 * ppm + dy); c.lineTo(sx, gy + 3.6 * ppm + dy); c.moveTo(sx, gy + 3.6 * ppm + dy); c.lineTo(sx2, gy + 3.6 * ppm + dy); c.stroke();
      }
    }
    if (!far) {
      // gelagar & pagar kayu
      c.fillStyle = wood; c.fillRect(x0, gy + 0.25 * ppm, x1 - x0, 0.5 * ppm);
      c.strokeStyle = wood; c.lineWidth = Math.max(1, 0.14 * ppm);
      c.beginPath(); c.moveTo(x0, gy - 0.9 * ppm); c.lineTo(x1, gy - 0.9 * ppm);
      for (let m = b.from; m <= b.to; m += 3) { c.moveTo(X(m), gy + 0.3 * ppm); c.lineTo(X(m), gy - 0.9 * ppm); }
      c.stroke();
    }
    c.restore();
  }
  function drawBridge(V, layer) {
    if (ROUTE.bridge && ROUTE.bridge.wood) { drawTrestle(V, layer); return; }
    const G = bridgeGeom(V);
    if (!G) return;
    const { c, X, ppm, gy } = V;
    const far = layer === 'back';
    const dx = far ? 0.9 * ppm : 0, dy = far ? -1.1 * ppm : 0;   // rusuk belakang sedikit ke kanan-atas (kedalaman)
    const ribCol = far ? (V.night ? '#5a6478' : V.storm ? '#8d969c' : '#b9c0c6') : (V.night ? '#cdd6e6' : '#eef2f4');
    const ribShade = far ? (V.night ? '#3e4658' : '#8a939a') : (V.night ? '#8e98ad' : '#b6c0c6');
    // rusuk busur: tebal, dengan sisi bawah lebih gelap
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = ribShade; c.lineWidth = (far ? 0.75 : 1.0) * ppm;
    archPath(c, V, G, dx, dy + 0.25 * ppm, 0); c.stroke();
    c.strokeStyle = ribCol; c.lineWidth = (far ? 0.55 : 0.75) * ppm;
    archPath(c, V, G, dx, dy, 0); c.stroke();
    if (!far && V.rimA > 0.05) { c.globalAlpha = V.rimA * 0.8; c.strokeStyle = V.rim; c.lineWidth = Math.max(1, 0.1 * ppm); archPath(c, V, G, dx, dy - 0.32 * ppm, 0.05); c.stroke(); c.globalAlpha = 1; }
    // batang gantung vertikal
    c.strokeStyle = far ? ribShade : '#c9d1d6'; c.lineWidth = Math.max(1, (far ? 0.1 : 0.14) * ppm);
    c.beginPath();
    for (let x = G.a0 + 6; x < G.a1 - 3; x += 6) {
      const h = G.hAt(x);
      if (h < 1.5) continue;
      c.moveTo(X(x) + dx, gy - (h - 0.35) * ppm + dy); c.lineTo(X(x) + dx, gy - (far ? 0.2 : 0.4) * ppm + dy);
    }
    c.stroke();
    if (far) {
      // balok pengaku melintang di puncak, menghubungkan rusuk belakang ke depan
      c.strokeStyle = ribShade; c.lineWidth = Math.max(1, 0.18 * ppm); c.beginPath();
      for (let x = G.a0 + G.span * 0.3; x < G.a1 - G.span * 0.28; x += 12) {
        const h = G.hAt(x);
        c.moveTo(X(x) + dx, gy - h * ppm + dy); c.lineTo(X(x), gy - h * ppm);
      }
      c.stroke();
    } else {
      // tepi lantai jembatan (gelagar pengikat) dengan bayangan
      const g = c.createLinearGradient(0, gy - 0.1 * ppm, 0, gy + 1.8 * ppm);
      g.addColorStop(0, ribCol); g.addColorStop(1, ribShade);
      c.fillStyle = g; c.fillRect(G.x0 - 0.6 * ppm, gy + 0.15 * ppm, G.x1 - G.x0 + 1.2 * ppm, 1.4 * ppm);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(G.x0 - 0.6 * ppm, gy + 1.45 * ppm, G.x1 - G.x0 + 1.2 * ppm, 0.15 * ppm);
      // lampu kecil di sepanjang busur saat malam
      if (V.night || V.storm) {
        c.globalCompositeOperation = 'lighter';
        for (let x = G.a0 + 3; x < G.a1; x += 9) {
          const sx = X(x), sy = gy - G.hAt(x) * ppm;
          const lg = c.createRadialGradient(sx, sy, 0, sx, sy, 1.6 * ppm);
          lg.addColorStop(0, 'rgba(180,220,255,0.55)'); lg.addColorStop(1, 'rgba(180,220,255,0)');
          c.fillStyle = lg; c.beginPath(); c.arc(sx, sy, 1.6 * ppm, 0, 7); c.fill();
        }
      }
    }
    c.restore();
  }
  // pantulan busur di permukaan sungai
  function drawBridgeReflection(V, waterTop, clip) {
    const G = bridgeGeom(V);
    if (!G) return;
    const { c } = V;
    c.save();
    clip();
    c.globalAlpha = V.night ? 0.25 : 0.2;
    c.strokeStyle = V.night ? '#9fb0d0' : '#f1f5f7'; c.lineWidth = 0.6 * G.ppm;
    c.beginPath();
    for (let i = 0; i <= 48; i++) {
      const x = G.a0 + (G.span * i) / 48;
      const sx = V.X(x), sy = waterTop + (G.hAt(x) * G.ppm + (waterTop - G.gy)) * 0.55;
      if (i === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
    }
    c.stroke();
    c.restore();
  }

  function drawFrontProps(V) {
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    // lapisan paling dekat ke kamera: bergerak 1,75x lebih cepat dari rel (paralaks), lebih besar dan gelap
    const slot = 11, k = 1.75, s2 = ppm * k;
    const dark = mix('#1d3218', '#2f4f26', p), mid = mix('#2a4522', '#3e6430', p);
    const lo = Math.floor((wx0 - 60) / slot), hi = Math.ceil((wx1 + 60) / slot);
    for (let i = lo; i < hi; i++) {
      const h = hash(i * 1.71);
      if (h > 0.6) continue;
      const tx = i * slot + hash(i) * 7;
      if (inBridge(tx) || nearCrossing(tx, 10)) continue;
      const sx = V.Xn(X(tx));
      if (sx < -80 || sx > W + 80) continue;
      const sy = H - (0.02 + hash(i + 5) * 0.06) * (H - gy);
      if (h < 0.12) {
        // patok pematang kayu
        c.fillStyle = mix('#3a2c20', '#4e3b2a', p);
        c.fillRect(sx - 0.12 * s2, sy - 1.6 * s2, 0.24 * s2, 1.6 * s2);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(sx - 0.12 * s2, sy - 1.6 * s2, 0.06 * s2, 1.6 * s2);
      } else {
        // rumpun padi / rumput tinggi
        c.fillStyle = h < 0.35 ? dark : mid;
        for (let q = -3; q <= 3; q++) {
          const tall = (1.4 + hash(i + q * 0.37) * 0.9) * s2;
          c.beginPath(); c.moveTo(sx + q * 0.2 * s2, sy);
          c.quadraticCurveTo(sx + q * 0.45 * s2, sy - tall * 0.6, sx + q * 0.75 * s2 + 0.3 * s2, sy - tall);
          c.lineTo(sx + q * 0.2 * s2 + 2.5, sy); c.fill();
        }
      }
    }
    const vg = c.createLinearGradient(0, H * 0.75, 0, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.36)');
    c.fillStyle = vg; c.fillRect(0, H * 0.75, W, H * 0.25);
  }
  function drawFog(V) {
    const { c, ppm, gy, X, st, p } = V;
    const f = fogAt(st.x + 30);
    // kabut pagi tipis selalu ada di dekat cakrawala
    const base = 0.22 * (1 - p);
    if (base > 0.01) {
      const g = c.createLinearGradient(0, gy - 60, 0, gy + 20);
      g.addColorStop(0, 'rgba(235,225,215,0)'); g.addColorStop(1, `rgba(235,225,215,${base})`);
      c.fillStyle = g; c.fillRect(0, gy - 60, W, 80);
    }
    if (f > 0.01) {
      const fx = X(st.x);
      const g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, `rgba(214,222,224,${0.35 * f})`);
      g.addColorStop(clamp(fx / W, 0, 1), `rgba(214,222,224,${0.55 * f})`);
      g.addColorStop(1, `rgba(214,222,224,${0.95 * f})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // sorot lampu depan
      c.save(); c.globalCompositeOperation = 'lighter';
      const lx = V.bx(st.x + 0.3), ly = gy - trainH(3.9) * ppm + V.bdy(st.x);
      const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 34 * ppm);
      lg.addColorStop(0, `rgba(255,236,170,${0.35 * f})`); lg.addColorStop(1, 'rgba(255,236,170,0)');
      c.fillStyle = lg;
      c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 34 * ppm, ly - 6 * ppm); c.lineTo(lx + 34 * ppm, ly + 5 * ppm); c.closePath(); c.fill();
      c.restore();
    }
  }

  // ---------- peta jalur (strip) ----------
  function renderStrip() {
    fitStrip();
    const c = sctx, w = SW, h = SH;
    if (!w || !h) return;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);
    const x0 = S.x - 60, x1 = S.x + 640;
    const M = (wx) => ((wx - x0) / (x1 - x0)) * w;
    const ly = Math.round(h * 0.6);
    const fog = fogAt(S.x + 30);
    const visible = (wx) => !(fog > 0.4 && wx - S.x > 220);
    c.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif';
    c.textBaseline = 'middle';
    // tanda jarak tiap 100 m
    c.fillStyle = 'rgba(239,233,218,0.35)';
    for (let d = 100; d <= 600; d += 100) { const sx = M(S.x + d); c.fillRect(sx, ly + 6, 1, 4); c.fillText(`${d}`, sx + 3, h - 6); }
    // zona batas
    for (const z of ROUTE.zones) {
      const a = Math.max(M(z.from), 0), b = Math.min(M(z.to + TRAIN_LEN), w);
      if (b <= 0 || a >= w) continue;
      c.fillStyle = z.limit <= 30 ? 'rgba(229,72,59,0.55)' : z.limit <= 40 ? 'rgba(242,165,22,0.45)' : 'rgba(239,233,218,0.25)';
      c.fillRect(a, ly - 15, b - a, 8);
      c.fillStyle = '#efe9da'; c.fillText(String(z.limit), a + 3, ly - 22);
    }
    if (S.yellowLimit) {
      const nxt = ROUTE.signals.find((s) => s.x > S.x);
      const b = nxt ? M(nxt.x) : w;
      c.fillStyle = 'rgba(255,196,43,0.5)'; c.fillRect(M(S.x), ly - 15, Math.max(0, b - M(S.x)), 8);
    }
    // rel
    c.fillStyle = 'rgba(239,233,218,0.5)'; c.fillRect(0, ly - 1, w, 2);
    // stasiun dilewati langsung
    for (const s of ROUTE.passStations || []) {
      const a = M(s.x - 95), b = M(s.x + 25);
      if (b < 0 || a > w) continue;
      c.fillStyle = 'rgba(46,107,106,0.4)'; c.fillRect(a, ly + 3, b - a, 7);
      c.fillStyle = 'rgba(239,233,218,0.7)'; c.fillText(s.name + ' (langsung)', Math.max(2, a), ly + 17 > h - 2 ? h - 4 : ly + 17);
    }
    // bus pesaing
    if (ROUTE.rival && S.bus.started) {
      const bx = M(S.bus.x);
      if (bx > -10 && bx < w + 10) { c.fillStyle = '#f29a1f'; c.fillRect(clamp(bx, 0, w) - 9, ly + 5, 9, 5); c.fillText('bus', clamp(bx, 0, w - 20) - 6, ly - 22); }
    }
    // stasiun
    for (const s of ROUTE.stations) {
      const a = M(s.x - 95), b = M(s.x + 25);
      if (b < 0 || a > w) continue;
      c.fillStyle = 'rgba(46,107,106,0.9)'; c.fillRect(a, ly + 3, b - a, 7);
      c.fillStyle = '#f2c230'; c.fillRect(M(s.x) - 1, ly - 8, 3, 18);
      c.fillStyle = '#efe9da'; c.fillText(s.name, Math.max(2, a), ly + 17 > h - 2 ? h - 4 : ly + 17);
    }
    // terowongan
    const T = ROUTE.tunnel;
    if (T && M(T.to) > 0 && M(T.from) < w) {
      const a = Math.max(0, M(T.from)), b = Math.min(w, M(T.to));
      c.fillStyle = 'rgba(10,12,14,0.75)'; c.fillRect(a, ly - 5, b - a, 10);
      c.fillStyle = '#b9b2a3'; c.fillText('terowongan', a + 3, ly + 17 > h - 2 ? h - 4 : ly + 17);
    }
    // landai
    for (const g of ROUTE.grades) {
      if (M(g.to) < 0 || M(g.from) > w) continue;
      const a = Math.max(0, M(g.from)), b = Math.min(w, M(g.to));
      c.fillStyle = g.permil > 0 ? 'rgba(229,72,59,0.35)' : 'rgba(80,160,230,0.35)';
      c.fillRect(a, ly + 2, b - a, 3);
      if (M(g.from) > 0) { c.fillStyle = '#efe9da'; c.fillText(`${g.permil > 0 ? '↗' : '↘'}${Math.abs(g.permil)}‰`, M(g.from) + 2, ly + 17 > h - 2 ? h - 4 : ly + 17); }
    }
    // perlintasan & kambing
    for (const cr of ROUTE.crossings) {
      if (M(cr.x) > 0 && M(cr.x) < w) {
        const sx = M(cr.x); c.strokeStyle = '#efe9da'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(sx - 4, ly - 5); c.lineTo(sx + 4, ly + 5); c.moveTo(sx + 4, ly - 5); c.lineTo(sx - 4, ly + 5); c.stroke();
      }
    }
    ROUTE.goats.forEach((gt, i) => {
      if (S.goats[i].state === 'idle' && M(gt.x) > 0 && M(gt.x) < w && visible(gt.x)) {
        c.fillStyle = '#ece6da'; c.beginPath(); c.arc(M(gt.x), ly, 4, 0, 7); c.fill(); c.fillText('kambing', M(gt.x) - 18, ly - 22);
      }
    });
    if (ROUTE.elephants && S.eleph.phase !== 'gone') {
      const ex = M(ROUTE.elephants.x);
      if (ex > 0 && ex < w && visible(ROUTE.elephants.x)) {
        c.fillStyle = S.eleph.phase === 'idle' ? '#b9b5ad' : '#ff7a6c';
        c.beginPath(); c.ellipse(ex, ly - 1, 7, 4.5, 0, 0, 7); c.fill();
        c.fillText('gajah', ex - 13, ly - 22);
      }
    }
    if (ROUTE.loading) {
      const lx = M(ROUTE.loading.silo);
      if (lx > -10 && lx < w + 10) { c.fillStyle = '#c9cfd3'; c.fillRect(lx - 5, ly - 16, 10, 9); c.fillRect(lx - 1.5, ly - 7, 3, 5); c.fillText('corong', lx + 8, ly - 12); }
    }
    // genangan, pohon tumbang (baru terlihat setelah peringatan), sepur belok & KA berlawanan
    const FLs = ROUTE.flood;
    if (FLs && M(FLs.to) > 0 && M(FLs.from) < w) {
      const a = Math.max(0, M(FLs.from)), b = Math.min(w, M(FLs.to));
      c.fillStyle = 'rgba(110,170,200,0.75)'; c.fillRect(a, ly - 4, Math.max(3, b - a), 8);
      c.fillStyle = '#bfe0ee'; c.fillText('genangan', a + 2, ly + 17 > h - 2 ? h - 4 : ly + 17);
    }
    const TRs = S.tree;
    if (TRs && TRs.phase !== 'idle' && TRs.phase !== 'clear' && M(TRs.x) > 0 && M(TRs.x) < w) {
      const tx = M(TRs.x);
      c.fillStyle = '#ff7a6c'; c.beginPath(); c.arc(tx, ly - 2, 5, 0, 7); c.fill(); c.fillRect(tx - 1, ly - 2, 2, 7);
      c.fillText('pohon', tx - 14, ly - 22);
    }
    const MTs = ROUTE.meet;
    if (MTs && M(MTs.exit) > 0 && M(MTs.entry) < w) {
      c.strokeStyle = 'rgba(239,233,218,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(M(MTs.entry), ly); c.lineTo(M(MTs.entry + 40), ly + 8); c.lineTo(M(MTs.exit - 40), ly + 8); c.lineTo(M(MTs.exit), ly); c.stroke();
      if (S.meet.phase === 'run') {
        const ox = M(S.meet.x), oe = M(S.meet.x + oppLen());
        if (oe > 0 && ox < w) { c.fillStyle = '#7fb0e8'; c.fillRect(clamp(ox, 0, w), ly + 5, clamp(oe, 0, w) - clamp(ox, 0, w), 6); c.beginPath(); c.moveTo(ox, ly + 2); c.lineTo(ox - 7, ly + 8); c.lineTo(ox, ly + 14); c.closePath(); c.fill(); c.fillText(MTs.name, clamp(ox, 0, w - 40), ly - 22); }
      }
    }
    if (ROUTE.switchX && M(ROUTE.switchX) > 0 && M(ROUTE.switchX) < w) {
      const sx = M(ROUTE.switchX);
      c.strokeStyle = '#efe9da'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx, ly); c.lineTo(sx + 14, ly + 8); c.stroke();
    }
    if (S.cw && !S.coupled) { const wx = M(S.cw.front); if (wx > -10 && wx < w + 10) { c.fillStyle = '#c98a5a'; c.fillRect(wx - 10, ly - 3, 10, 6); c.fillStyle = '#efe9da'; c.fillText('kopi', wx - 12, ly - 22); } }
    // sinyal
    for (const sig of ROUTE.signals) {
      const sx = M(sig.x);
      if (sx < 0 || sx > w) continue;
      c.fillStyle = '#16191b'; c.fillRect(sx - 1, ly - 2, 2, 8);
      if (visible(sig.x) || sig.x < S.x) {
        const asp = S.sig[sig.id];
        c.fillStyle = asp === 'R' ? '#ff4b3a' : asp === 'Y' ? '#ffc42b' : '#3bff8a';
        c.beginPath(); c.arc(sx, ly - 6, 5, 0, 7); c.fill();
        c.fillStyle = '#efe9da'; c.fillText(sig.id, sx + 7, ly - 6);
      } else {
        c.fillStyle = 'rgba(200,205,205,0.6)'; c.beginPath(); c.arc(sx, ly - 6, 5, 0, 7); c.fill();
        c.fillStyle = '#16191b'; c.fillText('?', sx - 3, ly - 6);
      }
    }
    // kereta
    const ta = M(S.x - TRAIN_LEN), tb = M(S.x);
    c.fillStyle = '#efe9da'; c.fillRect(ta, ly - 3, tb - ta, 6);
    c.beginPath(); c.moveTo(tb, ly - 6); c.lineTo(tb + 7, ly); c.lineTo(tb, ly + 6); c.closePath(); c.fill();
    // kabut menutupi pandangan jauh
    if (fog > 0.4) {
      const fx = M(S.x + 220);
      const g = c.createLinearGradient(fx, 0, fx + 30, 0);
      g.addColorStop(0, 'rgba(160,170,172,0)'); g.addColorStop(1, 'rgba(160,170,172,0.35)');
      c.fillStyle = g; c.fillRect(fx, 0, w - fx, h);
    }
  }

  // ---------- info untuk audio ----------
  function audioInfo() {
    const st = S || idleState;
    const scene = mode !== 'pause';
    const running = !!S && mode === 'play' && S.mode === 'play';
    const b = ROUTE.bridge;
    const onBridge = !!b && st.x > b.from && st.x - TRAIN_LEN < b.to;
    const river = b ? clamp(1 - Math.abs(st.x - 25 - (b.from + b.to) / 2) / 240, 0, 1) : 0;
    let crowd = 0;
    ROUTE.stations.forEach((s, i) => {
      const prox = clamp(1 - Math.abs(st.x - 25 - (s.x - 40)) / 170, 0, 1);
      const people = (st.waiting ? st.waiting[i] : s.waiting) > 0 ? 1 : 0.35;
      crowd = Math.max(crowd, prox * people);
    });
    (ROUTE.passStations || []).forEach((s) => { crowd = Math.max(crowd, clamp(1 - Math.abs(st.x - 25 - (s.x - 40)) / 170, 0, 1)); });
    if (S && S.phase === 'dwell' && (S.dwell.step === 'board' || S.dwell.step === 'alight')) crowd = 1.3;
    let bell = 0;
    for (const c of ROUTE.crossings) {
      if (st.x > c.x - 320 && st.x - TRAIN_LEN < c.x + 5) bell = Math.max(bell, clamp(1 - Math.abs(c.x - st.x) / 320, 0.15, 1));
    }
    const tunnel = inTunnel(st.x - 12);
    return {
      scene, running, v: st.v, x: st.x, onBridge, river, crowd, bell,
      power: st.notch > 0 && st.doors !== 'open' && st.phase !== 'dwell' ? st.notch / 4 : 0,
      brake: Math.max(0, -st.aCmd), slip: !!st.slip,
      fog: fogAt(st.x + 30), dawn: MIS.sky === 'dawn' && st.clock < 420,
      rain: MIS.rain ? (tunnel ? 0.25 : 1) : 0, tunnel, night: MIS.sky === 'night', lebaran: !!MIS.lebaran,
      curve: !!(zoneAt(st.x) && zoneAt(st.x).curve),
      lat: latAccel(st),
      bridgeFrac: b ? clamp((Math.min(st.x, b.to) - Math.max(st.x - TRAIN_LEN, b.from)) / TRAIN_LEN, 0, 1) : 0,
    };
  }

  // ---------- loop ----------
  function makeIdle() {
    const s = newState(); s.x = 30; s.notch = 0; s.doors = 'open';
    return s;
  }
  let idleState = makeIdle();
  let last = performance.now();
  const PHYS_DT = 1 / 120;
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (mode === 'play' && S && (S.mode === 'play' || S.mode === 'fail')) {
      const speed = window.__rn ? window.__rn.speed : 1;
      acc += dt * speed;
      let guard = 0;
      while (acc >= PHYS_DT && guard++ < 2000) {
        if (S.mode === 'play') {
          if (window.__rn && window.__rn.ctrl) window.__rn.ctrl(S);
          step(PHYS_DT);
        } else {
          // tetap animasikan asap/guncangan saat gagal
          S.shake = Math.max(0, S.shake - PHYS_DT);
        }
        acc -= PHYS_DT;
      }
    } else {
      // latar menu: asap pelan dari lokomotif yang diam
      idleState.t += dt;
      if (Math.random() < 4 * dt) idleState.smoke.push(exhaust(idleState.x - 8.2, trainH(6.8), 0, false));
      for (const pp of idleState.smoke) { pp.life += dt; pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.r += pp.grow * dt; }
      idleState.smoke = idleState.smoke.filter((pp) => pp.life < pp.max);
    }
    if (pcTimer > 0) { pcTimer -= dt; const pc = $('postcard'); if (pcTimer <= 0.5) pc.classList.add('out'); if (pcTimer <= 0 || mode !== 'play') { pc.hidden = true; pcTimer = 0; } }
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.className = ''; }
    if (radioTimer > 0 && mode === 'play') { radioTimer -= dt; if (radioTimer <= 0) $('radio').hidden = true; }
    if (mode !== 'pause') updateWeather(dt, (S || idleState).v);
    if (W && H) render(dt);
    if (mode === 'title') drawTitleMap(dt);
    Sound.update(audioInfo());
    if (S && (mode === 'play' || mode === 'pause')) { updateHud(); updateGoalChips(); renderStrip(); }
    if (S && mode === 'play') updateTutorial(dt); else if (ui.coach) ui.coach.hidden = true;
    requestAnimationFrame(frame);
  }

  // kait untuk pengujian otomatis (tidak dipakai saat bermain)
  window.__rn = {
    speed: 1, ctrl: null, get TRAIN_LEN() { return TRAIN_LEN; }, tryCouple: () => tryCouple(), coupleGap: () => coupleGap(),
    get ROUTE() { return ROUTE; },
    get MIS() { return MIS; },
    get S() { return S; },
    get mode() { return mode; },
    setNotch: (n) => setNotch(n, false), horn, door, sand, start: startMission,
    audioMeter: () => Sound.meter(),
    loadTarget: (i) => loadTarget(i),
    setOrn: (k) => { LOCO_ORN = k; },
    drawLandmark: (c, kind, x, y, sc, o) => drawLandmark(c, kind, x, y, sc, o || {}),
    select: (id) => selectMission(id),
  };

  resize();
  showScreen('title');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { textCache.clear(); });
  requestAnimationFrame(frame);
})();
