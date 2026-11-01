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
  const LOCO_LEN = 14, COACH_LEN = 18, GAP = 1.2;
  const TRAIN_LEN = LOCO_LEN + 2 * (COACH_LEN + GAP);
  const WINDOW_BEFORE = 40, WINDOW_AFTER = 55; // jendela berhenti di peron (m)
  const SAND_USES = 3, SAND_TIME = 8;

  const MISSIONS = {
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
  const MISSION_ORDER = ['1-4', '1-5', '1-6'];
  let MIS = MISSIONS['1-4'];
  let ROUTE = MIS.route;
  const finalStation = () => ROUTE.stations[ROUTE.stations.length - 1];
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
    let nextBird = 0, nextBell = 0, nextCricket = 0, nextFrog = 0, nextBedug = 6;
    let eventBusyUntil = 0;
    let musicTimer = null, nextBeat = 0, beat = 0, musicLevel = MIX.musicIdle;
    let idVoice = null;
    let nextChuff = 0, chuffIdx = 0, lastJoint = null, nextPump = 0;
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
        L.firebox = loop(brown, 'lowpass', 90, 0.6, engine);    // dengung api ketel
        L.roar = loop(white, 'bandpass', 700, 0.7, engine);     // uap menyatu saat cepat
        L.hiss = loop(white, 'highpass', 4200, 0.5, engine);    // desis uap saat diam
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
      const src = ac.createBufferSource(); src.buffer = white;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.08, dur * 0.2));
      gn.gain.setTargetAtTime(0.0001, t + dur * 0.4, dur * 0.22);
      src.connect(f).connect(gn).connect(bus);
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

    // ---- mesin uap ----
    function chuff(t, vol, v, power, tau) {
      const src = ac.createBufferSource(); src.buffer = white;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
      bp.frequency.value = 260 + power * 260 + Math.min(v, 20) * 10;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700 + power * 1300;
      const gn = ac.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(vol, t + 0.008);
      gn.gain.setTargetAtTime(0.0001, t + 0.012, tau);
      src.connect(bp).connect(lp).connect(gn).connect(engine);
      src.start(t, Math.random() * 1.5); src.stop(t + 0.02 + tau * 6);
      if (v < 9 && vol > 0.04) tone(72, vol * 0.7 * (1 - v / 9), 0.17, { at: t, to: 46, bus: engine, attack: 0.006 });
    }
    function clack(t, vol) { // "jeglak" roda melewati sambungan rel
      nz(t, 'bandpass', 760, 1.4, vol, 0.05, engine, 0.004);
      tone(118, vol * 0.7, 0.07, { at: t, to: 80, bus: engine, attack: 0.004 });
    }
    function pump(t) { // pompa udara lokomotif saat berhenti
      nz(t, 'lowpass', 300, 0.7, 0.03, 0.2, engine, 0.03);
      tone(95, 0.025, 0.16, { at: t, to: 80, bus: engine, attack: 0.02 });
      nz(t + 0.55, 'lowpass', 280, 0.7, 0.02, 0.18, engine, 0.03);
    }
    // posisi gandar (m di belakang moncong): lokomotif + dua gerbong
    const AXLES = [3, 6, 8, 10, 17.2, 19.2, 30.6, 32.6, 36.4, 38.4, 49.8, 51.8];

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

      // hentakan uap: dijadwalkan di jam audio supaya ritmenya rata
      let rate = (v / (2 * Math.PI * 0.85)) * 4;
      if (run && info.slip) rate = 16;
      if (run && rate > 0.25) {
        if (nextChuff < t) nextChuff = t + 0.02;
        const tau = clamp(0.5 / rate, 0.045, 0.2);
        const base = info.slip ? 0.13 : 0.03 + 0.2 * power;
        const merge = rate > 9 ? Math.sqrt(9 / rate) : 1;
        while (nextChuff < t + 0.12) {
          const accent = [1, 0.72, 0.88, 0.64][chuffIdx++ % 4];
          chuff(nextChuff, base * merge * accent, v, power, tau);
          nextChuff += (1 / rate) * (0.97 + Math.random() * 0.06);
        }
      } else nextChuff = 0;
      set(L.roar.g.gain, run ? power * clamp((rate - 6) / 10, 0, 1) * 0.05 : 0, 0.3);
      L.roar.f.frequency.setTargetAtTime(500 + Math.min(v, 22) * 18, t, 0.3);
      set(L.firebox.g.gain, scene ? 0.02 + power * 0.06 : 0, 0.4);
      set(L.rumble.g.gain, run ? Math.min(0.32, v * 0.018) * (info.onBridge ? 1.6 : 1) * (info.tunnel ? 1.5 : 1) : 0, 0.25);
      L.rumble.f.frequency.setTargetAtTime(100 + v * 9 + (info.onBridge ? 70 : 0) + (info.tunnel ? 90 : 0), t, 0.25);
      set(L.hiss.g.gain, scene ? (v < 0.4 ? 0.016 : 0.004) : 0, 0.4);
      // sambungan rel: setiap gandar berbunyi sesuai jaraknya
      if (run && v > 0.5) {
        const j = Math.floor(info.x / 25);
        if (lastJoint === null) lastJoint = j;
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
      if (t >= nextBird) {
        if (!quiet && info.fog < 0.6 && !info.rain && !info.tunnel && !info.night) bird(0.018 + Math.random() * 0.02);
        nextBird = t + 0.8 + Math.random() * (info.fog > 0.3 ? 6 : 2.6);
      }
      if (!quiet && (info.dawn || info.night) && !info.tunnel && t >= nextCricket) { cricket(0.01); nextCricket = t + 0.35 + Math.random() * 0.5; }
      if (!quiet && info.night && !info.tunnel && t >= nextFrog) { frog(0.04); nextFrog = t + 0.6 + Math.random() * 1.6; }
      if (!quiet && info.night && t >= nextBedug) { bedug(0.28); nextBedug = t + 16 + Math.random() * 12; }
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
        duck({ amb: 0.35, music: 0.4 }, 1.9);
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
          duck({ amb: 0.35, music: 0.4, engine: 0.3 }, 1.2);
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
          duck({ amb: 0.35, music: 0.45, engine: 0.3 }, 1.8);
        }
      },
      signalChime() { // "tong" lembut saat sinyal berangkat hijau
        if (!ac || muted) return;
        const t = ac.currentTime;
        tone(660, 0.05, 0.6, { at: t, bus: sfx, attack: 0.01 });
        tone(990, 0.02, 0.4, { at: t, bus: sfx, attack: 0.01 });
      },
      ding() { this.signalChime(); },
      whistle() {
        if (!ac || muted) return;
        const t = ac.currentTime;
        const gn = ac.createGain();
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.exponentialRampToValueAtTime(0.14, t + 0.07);
        gn.gain.setValueAtTime(0.14, t + 0.8);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
        const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        gn.connect(lp).connect(sfx);
        [466.16, 587.33, 698.46].forEach((fr) => {
          const o = ac.createOscillator(); o.type = 'triangle';
          o.frequency.setValueAtTime(fr * 0.96, t); o.frequency.linearRampToValueAtTime(fr, t + 0.1);
          o.connect(gn); o.start(t); o.stop(t + 1.1);
        });
        burst(1700, 1.2, 0.035, 0.6);
        tone(587.33, 0.02, 0.7, { delay: 0.45, type: 'triangle', attack: 0.1, bus: amb });
        duck({ amb: 0.4, music: 0.35 }, 1.1);
      },
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
    return {
      mode: 'play',
      x: 0, v: 0, aCmd: -0.5, aAct: 0, aPrev: 0, jerkF: 0,
      notch: -2,
      t: 0, clock: 0,
      comfort: 100, coins: 0,
      violations: [], violKeys: {}, stops: [],
      phase: 'dwell', st: 0, doors: 'open',
      dwell: { step: 'close', timer: 0 },
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
    };
  }

  // ---------- DOM ----------
  const cv = $('world'), ctx = cv.getContext('2d');
  const sv = $('strip'), sctx = sv.getContext('2d');
  let W = 0, H = 0, DPR = 1, SW = 0, SH = 0;
  let mode = 'title';
  let radioTimer = 0;
  let rotateSkipped = false;

  const ui = {
    hud: $('hud'), toast: $('toast'),
    clock: $('clock'), nextName: $('nextName'), nextSched: $('nextSched'),
    comfortBar: $('comfortBar'), comfortVal: $('comfortVal'), coins: $('coins'),
    rivalPanel: $('rivalPanel'), rivalVal: $('rivalVal'),
    speed: $('speed'), speedo: $('speedo'), unit: $('speedUnit'), btnSand: $('btnSand'), sandLbl: $('sandLbl'), limit: $('limit'), nextLimit: $('nextLimit'),
    stopDist: $('stopDist'), stopBox: $('stopBox'),
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
  }
  function fail(reason) {
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
    Sound.whistle();
    for (let i = 0; i < 14; i++) S.smoke.push(puff(S.x - 9.5, 4.9, true));
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
    if (!S || S.mode !== 'play') return;
    if (S.phase === 'dwell') {
      const step = S.dwell.step;
      if (step === 'open') {
        S.doors = 'open'; Sound.door(true);
        S.dwell.step = ROUTE.stations[S.st].final ? 'alight' : 'board';
        S.dwell.timer = 0;
        return;
      }
      if (step === 'close') {
        S.doors = 'closed'; Sound.door(false);
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
    S.st = stIdx;
    S.phase = 'dwell';
    S.dwell = { step: 'open', timer: 0 };
    S.yellowLimit = false;
    const where = d > 0 ? 'lewat' : 'kurang';
    const kind = rating.c === 'miss' ? 'bad' : rating.c === 'ok' ? 'info' : 'good';
    toast(`${rating.r.toUpperCase()}! ${fmtM(Math.abs(d))} m ${where} dari marka. Buka pintu.`, kind, 3.2, null, 3);
    if (st.final) setTimeout(() => Sound.announce(`Kereta telah tiba di Stasiun ${titleCase(st.name)}, stasiun akhir. Terima kasih telah bepergian bersama Si Gagah.`), 900);
  }

  function updateDwell(dt) {
    const st = ROUTE.stations[S.st];
    const dw = S.dwell;
    dw.timer += dt;
    if (dw.step === 'board') {
      const total = MIS.heavy ? 3 + st.waiting * 0.25 : 4.5;
      const startWaiting = st.waiting;
      const left = Math.max(0, Math.round(startWaiting * (1 - dw.timer / total)));
      if (left < S.waiting[S.st]) { S.aboard += S.waiting[S.st] - left; S.waiting[S.st] = left; }
      if (dw.timer >= total) {
        dw.step = 'close'; dw.timer = 0;
        toast(st.travelers ? 'Pemudik dan barang bawaannya sudah naik. Tutup pintu.' : st.traders ? 'Para pedagang sudah naik dengan keranjangnya. Tutup pintu.' : st.umbrellas ? 'Penumpang naik sambil melipat payung. Tutup pintu.' : 'Penumpang sudah naik. Tutup pintu.', 'info', 3, null, 2);
      }
    } else if (dw.step === 'alight') {
      if (dw.timer > 1) S.aboard = Math.max(0, S.aboard - Math.ceil(dt * 12));
      if (dw.timer >= 3.2) finish();
    } else if (dw.step === 'signal') {
      if (dw.timer >= 2) {
        const sig = ROUTE.signals.find((s) => s.start === S.st);
        if (sig) S.sig[sig.id] = 'G';
        S.phase = 'run';
        S.stoppedShortShown = false;
        Sound.signalChime();
        toast(S.st === 0 ? 'Sinyal hijau! Dorong tuas ke P untuk berangkat.' : 'Sinyal berangkat hijau. Lanjutkan perjalanan.', 'good', 3, null, 3);
      }
    }
  }

  function step(dt) {
    const prevX = S.x, prevV = S.v;
    S.t += dt; S.clock += dt * TIME_SCALE;

    // --- dinamika kereta ---
    const n = S.notch;
    let target;
    const powerLocked = S.doors === 'open' || S.phase === 'dwell';
    const wet = MIS.rain && !inTunnel(S.x - LOCO_LEN);
    if (S.sandT > 0) S.sandT = Math.max(0, S.sandT - dt);
    const grip = wet && S.sandT <= 0 ? 0.78 : 1; // rel basah melemahkan rem
    const massF = MIS.heavy ? 1 + S.aboard / 140 : 1; // kereta penuh lebih berat
    const brakeF = 1 + (massF - 1) * 0.6;
    if (n > 0) target = powerLocked ? 0 : (n * 0.26 * Math.max(0, 1 - S.v / 26)) / massF;
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
    S.x += S.v * dt;
    S.aAct = (S.v - prevV) / dt;

    // --- kenyamanan: sentakan ---
    if (S.v > 0 && prevV > 0) {
      const jerk = Math.abs(S.aAct - S.aPrev) / dt;
      S.jerkF = lerp(S.jerkF, jerk, 0.08);
      if (S.jerkF > 1.05) S.comfort -= (S.jerkF - 1.05) * dt * 3;
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
    if (ns && S.phase === 'run' && ns.x - S.x < 420 && ns.x - S.x > 0 && !S.hints['ann' + S.st]) {
      S.hints['ann' + S.st] = true;
      Sound.announce(`Sesaat lagi kereta akan tiba di Stasiun ${titleCase(ns.name)}. Periksa kembali barang bawaan Anda.`);
    }
    if (ns && S.phase === 'run' && ns.x - S.x < 260 && ns.x - S.x > 0) hintOnce('stop' + S.st, `Stasiun ${ns.name}: berhenti tepat di marka kuning "3".`);

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
    if (S.phase === 'dwell') updateDwell(dt);

    if (S.x >= ROUTE.bufferStop - 0.5) fail(`Kereta menabrak penahan di ujung rel ${titleCase(finalStation().name)}.`);

    S.comfort = clamp(S.comfort, 0, 100);

    // --- asap ---
    const power = S.notch > 0 && !powerLocked ? S.notch / 4 : 0;
    const rateSmoke = 5 + power * 22 + S.v * 0.4;
    if (Math.random() < rateSmoke * dt) S.smoke.push(puff(S.x - 2.6, 5.4, false, power));
    if (power > 0 && S.v < 4 && Math.random() < 20 * dt) S.smoke.push(steamPuff(S.x - 3.5));
    if (S.slip && Math.random() < 30 * dt) S.smoke.push(puff(S.x - 2.6, 5.4, false, 1));
    if (S.sandT > 0 && Math.random() < 25 * dt) S.smoke.push(sandPuff(S.x - 7 - Math.random() * 4));
    for (const p of S.smoke) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.995; p.r += p.grow * dt;
    }
    S.smoke = S.smoke.filter((p) => p.life < p.max);
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 1.6);
  }

  function puff(x, y, white, power = 0) {
    return { x, y, r: white ? 0.3 : 0.45, grow: white ? 1.4 : 1.1 + power, vx: (Math.random() - 0.5) * 0.6 - 0.8, vy: white ? 1.2 + Math.random() : 2 + power * 2 + Math.random(), life: 0, max: white ? 1.2 : 3.2 + Math.random(), white, a: white ? 0.7 : 0.38 + power * 0.25 };
  }
  function sandPuff(x) {
    return { x, y: 0.3, r: 0.15, grow: 0.5, vx: (Math.random() - 0.5) * 1.2, vy: 0.2, life: 0, max: 0.8, sand: true, a: 0.6 };
  }
  function steamPuff(x) {
    return { x: x + (Math.random() - 0.5) * 1.5, y: 0.6, r: 0.3, grow: 1.6, vx: (Math.random() - 0.5) * 2, vy: 0.4 + Math.random() * 0.4, life: 0, max: 0.9, white: true, a: 0.55 };
  }

  // ---------- akhir misi ----------
  function finish() {
    S.mode = 'done';
    showResult();
  }

  function computeResult() {
    const failed = !!S.failReason;
    const final = S.stops.find((s) => s.name === finalStation().name);
    const onTime = final ? final.clock - final.sched <= 30 : false;
    const B = S.bus;
    const beatBus = !!final && (!B.done || final.clock < B.arrive);
    const goodStops = S.stops.length === ROUTE.stations.length - 1 && S.stops.every((s) => s.rating.c === 'perfect' || s.rating.c === 'good');
    let stars = 0;
    if (!failed && final) {
      stars = 1;
      if (MIS.goal2 === 'rival' ? beatBus : onTime) stars++;
      if (S.comfort >= 80 && goodStops) stars++;
    }
    const base = failed ? 0 : 100;
    const comfortBonus = failed ? 0 : Math.round(S.comfort * 0.5);
    const penalty = S.violations.length * 20;
    const total = Math.max(0, base + S.coins + comfortBonus - penalty);
    return { failed, stars, onTime, beatBus, total, base, comfortBonus, penalty };
  }

  const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';

  function showResult() {
    const r = computeResult();
    const best = bestOf(MIS.id);
    if (r.stars > best) store.set('relnusantara.best.' + MIS.id, String(r.stars));
    if (r.failed) Sound.failSting(); else Sound.stars(r.stars);
    $('resTitle').textContent = r.failed ? 'Misi gagal' : 'Misi selesai';
    $('resEyebrow').textContent = r.failed ? `Misi ${MIS.id} · ${MIS.title}` : `Misi ${MIS.id} · tiba ${fmtClock(S.clock)}`;
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
    const viol = S.violations.length ? `<ul class="viol">${S.violations.map((v) => `<li>${v}</li>`).join('')}</ul>` : '';
    const rewardTxt = MIS.goal2 === 'rival' ? (r.beatBus ? MIS.rewardWin : MIS.rewardLose) : MIS.reward;
    const reward = !r.failed && r.stars >= 1 ? `<div class="reward">${rewardTxt}</div>` : '';
    const rivalRow = ROUTE.rival && !r.failed ? `<tr><td>Bus ${ROUTE.rival.name}</td><td colspan="2">${S.bus.done ? `tiba ${fmtClock(S.bus.arrive)}` : 'belum tiba'} · ${r.beatBus ? '<span class="ontime">kamu menang</span>' : '<span class="late">bus menang</span>'}</td></tr>` : '';
    const next = MISSION_ORDER[MISSION_ORDER.indexOf(MIS.id) + 1];
    const btnNext = $('btnNext');
    btnNext.hidden = !(next && !r.failed);
    if (next) btnNext.textContent = `Lanjut ke Misi ${next}`;
    $('resCard').innerHTML = `
      <table class="rtable">
        <thead><tr><th>Stasiun</th><th>Berhenti</th><th>Tiba / jadwal</th></tr></thead>
        <tbody>${rows}
          ${rivalRow}
          <tr><td>Kenyamanan</td><td colspan="2">${Math.round(S.comfort)}%${S.comfort >= 80 ? '' : ' (target 80%)'}</td></tr>
          <tr><td>Koin</td><td colspan="2"><strong>${r.total}</strong> <span style="color:var(--muted)">(misi ${r.base} + berhenti ${S.coins} + nyaman ${r.comfortBonus} − pelanggaran ${r.penalty})</span></td></tr>
        </tbody>
      </table>${viol}${reward}`;
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
  function renderMissionList() {
    $('missionList').innerHTML = MISSION_ORDER.map((id) => {
      const m = MISSIONS[id], b = bestOf(id);
      return `<li><button class="mission${id === MIS.id ? ' sel' : ''}" data-id="${id}">
        <span class="mid num">${id}</span>
        <span class="mtxt"><b>${m.title}</b><small>${m.tags.join(' · ')}</small></span>
        <span class="mstars" aria-label="${b} dari 3 bintang">${starStr(b)}</span>
      </button></li>`;
    }).join('');
  }
  function selectMission(id) {
    MIS = MISSIONS[id]; ROUTE = MIS.route;
    idleState = makeIdle();
    textCache.clear();
  }
  function showBrief() {
    const m = MIS, R = ROUTE, f = finalStation();
    $('briefEyebrow').textContent = `${m.chapter} · Misi ${m.id}`;
    $('briefTitle').textContent = m.title;
    $('briefAvatar').textContent = m.speaker.initials;
    $('briefWho').textContent = m.speaker.who;
    $('briefText').textContent = m.brief;
    const stops = R.stations.slice(1);
    $('briefFacts').innerHTML = `
      <dt>Rute</dt><dd>${R.stations.map((s) => titleCase(s.name)).join(' → ')}</dd>
      <dt>Jarak</dt><dd>${(f.x / 1000).toFixed(1).replace('.', ',')} km · ${stops.length} pemberhentian</dd>
      <dt>Kereta</dt><dd>Si Gagah + 2 gerbong</dd>
      <dt>Berangkat</dt><dd>${fmtClock(0)}, ${m.weather}</dd>
      <dt>Jadwal</dt><dd>${stops.map((s) => `${titleCase(s.name)} ${fmtClock(s.sched)}`).join(' · ')}</dd>`;
    $('briefGoal2').textContent = m.goal2 === 'rival' ? `Tiba di ${titleCase(f.name)} lebih dulu dari bus ${R.rival.name}` : `Tiba di ${titleCase(f.name)} tepat waktu`;
    showScreen('brief');
  }
  function startMission() {
    S = newState();
    textCache.clear();
    showScreen('play');
    fitStrip();
    renderLever();
    $('btnSand').hidden = !MIS.rain;
    $('rivalPanel').hidden = !ROUTE.rival;
    document.querySelector('.hud-top .coins').hidden = !!ROUTE.rival;
    if (ROUTE.rival) setTimeout(() => { if (S && S.mode === 'play') radio(`Selamat bertanding, anak muda. ${ROUTE.rival.name} belum pernah kalah.`, 6, 'Pak Bram', 'PB'); }, 4500);
    toast(MIS.intro, 'info', 4, null, 3);
    setTimeout(() => { if (S && S.st === 0) Sound.announce(`Perhatian. Kereta lokal Si Gagah tujuan ${titleCase(finalStation().name)} di jalur satu akan segera diberangkatkan.`); }, 600);
  }

  // ---------- input ----------
  function bindPress(el, fn) {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); Sound.init(); el.classList.add('pressed'); fn(); });
    const up = () => el.classList.remove('pressed');
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }
  bindPress(ui.btnHorn, horn);
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
    ui.thumb.className = 'thumb' + (S.notch < 0 ? ' brake' : S.notch === 0 ? ' neutral' : '');
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
    else if (k === 'h') horn();
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
  $('missionList').addEventListener('click', (e) => {
    const b = e.target.closest('.mission');
    if (!b) return;
    Sound.init(); selectMission(b.dataset.id); showBrief();
  });
  $('btnHowto').addEventListener('click', () => showScreen('howto'));
  $('btnHowtoBack').addEventListener('click', () => showScreen('title'));
  $('btnNext').addEventListener('click', () => {
    const next = MISSION_ORDER[MISSION_ORDER.indexOf(MIS.id) + 1];
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
  $('btnMusicTitle').addEventListener('click', () => { Sound.init(); Sound.toggleMusic(); syncAudioButtons(); });
  syncAudioButtons();
  // browser hanya mengizinkan audio setelah sentuhan pertama
  document.addEventListener('pointerdown', () => Sound.init(), { once: true });
  document.addEventListener('keydown', () => Sound.init(), { once: true });
  $('btnRotateSkip').addEventListener('click', () => { rotateSkipped = true; checkOrientation(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', resize);

  // ---------- HUD ----------
  function updateHud() {
    setText(ui.clock, fmtClock(S.clock));
    const ns = S.phase === 'dwell' ? ROUTE.stations[S.st] : nextStation();
    if (ns) {
      setText(ui.nextName, ns.name);
      if (S.phase === 'dwell' && S.st === 0) setText(ui.nextSched, `berangkat ${fmtClock(0)}`);
      else if (S.phase === 'dwell') setText(ui.nextSched, 'berhenti di peron');
      else {
        const rem = ns.sched - S.clock;
        setText(ui.nextSched, `jadwal ${fmtClock(ns.sched)} · ${rem >= 0 ? 'sisa ' + fmtDur(rem) : 'terlambat ' + fmtDur(rem)}`);
      }
    }
    const cf = Math.round(S.comfort);
    ui.comfortBar.style.width = cf + '%';
    ui.comfortBar.style.backgroundColor = cf >= 80 ? 'var(--sig-green)' : cf >= 55 ? 'var(--saffron)' : 'var(--sig-red)';
    setText(ui.comfortVal, cf + '%');
    setText(ui.coins, String(S.coins));

    const kmh = S.v * 3.6;
    const { lim } = currentLimit();
    setText(ui.speed, String(Math.round(kmh)));
    setText(ui.limit, String(lim));
    setClass(ui.speedo, 'over', kmh > lim + 2);
    const nl = nextLimitAhead();
    setText(ui.nextLimit, nl ? `${nl.limit} km/h dalam ${Math.round(nl.from - S.x)} m` : S.yellowLimit ? 'Sinyal kuning: maks 40' : `Kecepatan jalur ${ROUTE.lineSpeed}`);
    const gr = gradeAt(S.x - TRAIN_LEN / 2);
    setText(ui.unit, gr ? `km/h · ${gr.permil > 0 ? '↗' : '↘'} ${Math.abs(gr.permil)}‰` : 'km/h');

    // titik henti
    let stopTxt = '—', near = false, over = false;
    const tgt = S.phase === 'run' ? nextStation() : null;
    if (tgt) {
      const d = tgt.x - S.x;
      if (d < 700) {
        if (d >= 0) { stopTxt = `${fmtM(d)} m`; near = d < 60; }
        else { stopTxt = `+${fmtM(-d)} m`; over = true; }
      }
    } else if (S.phase === 'dwell') {
      const last = S.stops[S.stops.length - 1];
      if (last && S.st > 0) stopTxt = last.rating.r;
    }
    setText(ui.stopDist, stopTxt);
    setClass(ui.stopBox, 'near', near); setClass(ui.stopBox, 'over', over);

    // pintu
    const dw = S.phase === 'dwell' ? S.dwell.step : null;
    setText(ui.doorLbl, S.doors === 'open' ? 'Tutup pintu' : 'Buka pintu');
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
      setText(ui.sandLbl, `Pasir (${S.sand})`);
      setClass(ui.btnSand, 'cue', S.slip && S.sand > 0 && S.sandT <= 0);
      setClass(ui.btnSand, 'active', S.sandT > 0);
    }
  }

  // ---------- render dunia ----------
  function render(dtReal) {
    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const st = S || idleState;
    const ppm = clamp(H / 52, 3.4, 12);
    const gy = Math.round(H * 0.64);
    const shake = st.shake > 0 ? (Math.random() - 0.5) * st.shake * 7 : 0;
    const anchor = mode === 'play' || mode === 'pause' ? 0.6 : 0.78;
    const camX = st.x - (W * anchor) / ppm;
    const X = (wx) => (wx - camX) * ppm + shake;
    const wx0 = camX - 30, wx1 = camX + W / ppm + 30;
    const storm = MIS.sky === 'storm', night = MIS.sky === 'night';
    const p = storm ? 0.6 : night ? 0.35 : clamp(st.clock / 1500, 0, 1); // fajar -> pagi
    const T = ROUTE.tunnel;
    const xc = st.x - 12; // posisi kabin
    const tf = T ? smooth(T.from, T.from + 25, xc) * (1 - smooth(T.to, T.to + 25, xc)) : 0;
    const V = { c, ppm, gy, camX, X, wx0, wx1, p, st, storm, night, tf, lit: storm || night || tf > 0.2 };

    drawSky(V);
    drawRidges(V);
    drawBackProps(V);
    drawTunnelHill(V);
    drawGround(V);
    drawTunnelInterior(V);
    drawStations(V);
    drawSwitch(V);
    drawTrackside(V);
    drawGoats(V);
    drawTrain(V);
    drawBus(V);
    drawSmoke(V);
    drawBridgeTruss(V);
    drawTunnelPortals(V);
    drawFrontProps(V);
    drawFog(V);
    drawWeather(V);
    drawNight(V);
    drawTunnelDark(V);
  }

  // ---------- malam takbiran ----------
  function drawNight(V) {
    if (!V.night) return;
    const { c, ppm, gy, X, st } = V;
    c.fillStyle = 'rgba(8,12,38,0.5)'; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    // lampu peron dan lampu sinyal
    const lamp = (x, y, r, col) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    };
    for (const s of allStations()) {
      if (X(s.x + 30) < -40 || X(s.x - 100) > W + 40) continue;
      for (let k = 0; k <= 5; k++) lamp(X(s.x - 80 + k * 11.5), gy - 4.9 * ppm, 5 * ppm, 'rgba(255,214,140,0.35)');
    }
    for (const sig of ROUTE.signals) {
      if (sig.x < V.wx0 || sig.x > V.wx1) continue;
      const asp = st.sig ? st.sig[sig.id] : 'R';
      const i = asp === 'R' ? 0 : asp === 'Y' ? 1 : 2;
      lamp(X(sig.x), gy - 6.2 * ppm - 2.1 * ppm + i * 0.9 * ppm, 2.4 * ppm, asp === 'R' ? 'rgba(255,75,58,0.6)' : asp === 'Y' ? 'rgba(255,196,43,0.6)' : 'rgba(59,255,138,0.55)');
    }
    // sorot lampu depan lokomotif
    const lx = X(st.x - 1.6), ly = gy - 4.4 * ppm;
    const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 30 * ppm);
    lg.addColorStop(0, 'rgba(255,232,160,0.4)'); lg.addColorStop(1, 'rgba(255,232,160,0)');
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
    if (MIS.sky === 'night') {
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
    const ppm = clamp(H / 52, 3.4, 12);
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
    for (let k = 0; k < 2; k++) {
      const front = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      const x0 = fx - (front + COACH_LEN) * ppm, top = gy - 4.5 * ppm;
      const midDoor = x0 + COACH_LEN * ppm / 2;
      for (let w = 0; w < 8; w++) {
        const wx = x0 + (1.0 + w * 2.1) * ppm;
        if (Math.abs(wx + 0.6 * ppm - midDoor) < 1.3 * ppm) continue;
        c.fillStyle = `rgba(255,200,110,${alpha * 0.45})`;
        c.fillRect(wx, top + 0.9 * ppm, 1.25 * ppm, 0.95 * ppm);
      }
    }
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
    const lx = X(st.x - 1.6), ly = gy - 4.4 * ppm;
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
    if (V.night) {
      const sg = c.createLinearGradient(0, 0, 0, gy);
      sg.addColorStop(0, '#070b24'); sg.addColorStop(0.7, '#18214d'); sg.addColorStop(1, '#3b3a66');
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
      c.fillStyle = '#0d1433'; c.beginPath(); c.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.92, 0, 7); c.fill();
      return;
    }
    if (V.storm) {
      const sg = c.createLinearGradient(0, 0, 0, gy);
      sg.addColorStop(0, '#36404b'); sg.addColorStop(0.7, '#66737e'); sg.addColorStop(1, '#8a96a0');
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
    g.addColorStop(0, mix('#2c3a6b', '#5d9fd3', p));
    g.addColorStop(0.65, mix('#c97a7a', '#a8d2ea', p));
    g.addColorStop(1, mix('#f7b36d', '#e3f0f0', p));
    c.fillStyle = g; c.fillRect(0, 0, W, gy + 4);
    // matahari terbit
    const sx = W * 0.8, sy = lerp(gy - 10, gy * 0.25, p);
    const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 90);
    sg.addColorStop(0, 'rgba(255,236,190,0.95)'); sg.addColorStop(0.18, 'rgba(255,214,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,140,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 90, 0, Math.PI * 2); c.fill();
  }

  function ridgePath(V, par, base, amp, fn, color) {
    const { c, camX, ppm } = V;
    const off = camX * ppm * par;
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
    }, mix('#5b4f7e', '#86a2bd', p));
    const midFn = (u) => 0.45 + 0.3 * Math.sin(u * 0.0031 + 1) + 0.18 * Math.sin(u * 0.009 + 2);
    ridgePath(V, 0.16, gy - 4, gy * 0.26, midFn, mix('#3c5a52', '#5f8f6c', p));
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
    // sawah terasering
    const par = 0.42, off = V.camX * V.ppm * par;
    const fn = (u) => 0.35 + 0.28 * Math.sin(u * 0.0045 + 4) + 0.12 * Math.sin(u * 0.013);
    const base = gy, amp = gy * 0.16;
    ridgePath(V, par, base, amp, fn, mix('#46703c', '#6c9e48', p));
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

  function drawGround(V) {
    const { c, ppm, gy, X, p } = V;
    // tanah depan (sawah)
    const g = c.createLinearGradient(0, gy, 0, H);
    g.addColorStop(0, mix('#4f7a36', '#6f9e45', p)); g.addColorStop(1, mix('#2f4f26', '#46703a', p));
    c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
    // pematang sawah
    c.strokeStyle = mix('#5f8a3e', '#86b456', p); c.globalAlpha = 0.55; c.lineWidth = 1.2;
    for (let k = 1; k < 5; k++) {
      const y = gy + (H - gy) * (0.22 + k * 0.16);
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.globalAlpha = 1;
    // sungai di bawah jembatan
    const b = ROUTE.bridge || { from: -1e6, to: -1e6 + 20 };
    const bx0 = X(b.from + 6), bx1 = X(b.to - 6);
    if (bx1 > 0 && bx0 < W) {
      c.fillStyle = mix('#6b5a43', '#7b6a4e', p);
      c.beginPath(); c.moveTo(bx0 - 4 * ppm, gy); c.lineTo(bx1 + 4 * ppm, gy); c.lineTo(bx1 - 6 * ppm, H); c.lineTo(bx0 + 6 * ppm, H); c.closePath(); c.fill();
      const wg = c.createLinearGradient(0, gy + 3 * ppm, 0, H);
      wg.addColorStop(0, mix('#5d7d8f', '#7fb4c8', p)); wg.addColorStop(1, mix('#30505e', '#3f7a8f', p));
      c.fillStyle = wg;
      c.beginPath(); c.moveTo(bx0 + 2 * ppm, gy + 3 * ppm); c.lineTo(bx1 - 2 * ppm, gy + 3 * ppm); c.lineTo(bx1 - 8 * ppm, H); c.lineTo(bx0 + 8 * ppm, H); c.closePath(); c.fill();
      // pilar batu
      c.fillStyle = mix('#6e6a63', '#8d877c', p);
      const mid = X((b.from + b.to) / 2);
      c.fillRect(mid - 1.2 * ppm, gy + 0.4 * ppm, 2.4 * ppm, H - gy);
      c.fillRect(bx0 - 3 * ppm, gy, 3 * ppm, 3 * ppm);
      c.fillRect(bx1, gy, 3 * ppm, 3 * ppm);
    }
    // ballast
    c.fillStyle = mix('#6d6359', '#8a7f72', p);
    c.beginPath(); c.moveTo(0, gy + 0.25 * ppm); c.lineTo(W, gy + 0.25 * ppm); c.lineTo(W, gy + 1.3 * ppm); c.lineTo(0, gy + 1.3 * ppm); c.closePath(); c.fill();
    if (bx1 > 0 && bx0 < W) {
      c.fillStyle = '#39424a'; c.fillRect(bx0, gy + 0.2 * ppm, bx1 - bx0, 1.0 * ppm);
    }
    // bantalan & rel
    c.fillStyle = mix('#3b3029', '#4e4036', p);
    const step = 1.5;
    for (let sx = Math.floor(V.wx0 / step) * step; sx < V.wx1; sx += step) c.fillRect(X(sx), gy + 0.1 * ppm, 0.7 * ppm, 0.35 * ppm);
    c.fillStyle = '#9aa0a2'; c.fillRect(0, gy - 0.12 * ppm, W, 0.24 * ppm);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, gy - 0.12 * ppm, W, 1);
    // jalan raya sejajar rel (misi dengan bus pesaing)
    if (ROUTE.rival) {
      c.fillStyle = '#3a3b3e'; c.fillRect(0, gy + 4.6 * ppm, W, 3.4 * ppm);
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
      // peron
      c.fillStyle = '#b8b1a2'; c.fillRect(a, gy - 1.0 * ppm, b - a, 0.8 * ppm);
      c.fillStyle = '#e8c33a'; c.fillRect(a, gy - 1.0 * ppm, b - a, 0.14 * ppm);
      // papan nama stasiun (dengan ketinggian, seperti di stasiun Indonesia)
      const bx = X(s.x - 14), bwid = 9 * ppm, bht = 2.2 * ppm, btop = gy - 1 * ppm - 4.4 * ppm;
      c.fillStyle = '#3a3a3a'; c.fillRect(bx - bwid / 2 + 0.6 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht); c.fillRect(bx + bwid / 2 - 0.85 * ppm, btop + bht, 0.25 * ppm, 4.4 * ppm - bht);
      c.fillStyle = '#fbfaf5'; c.fillRect(bx - bwid / 2, btop, bwid, bht);
      c.strokeStyle = '#1d2a2b'; c.lineWidth = Math.max(1, 0.12 * ppm); c.strokeRect(bx - bwid / 2, btop, bwid, bht);
      c.fillStyle = '#1d2a2b'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${Math.round(1.05 * ppm)}px "Big Shoulders Display", "Arial Narrow", sans-serif`;
      c.fillText(s.name, bx, btop + bht * 0.4);
      c.font = `700 ${Math.round(0.6 * ppm)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      c.fillText(s.elev, bx, btop + bht * 0.8);
      // marka henti "3" (jumlah kereta = lokomotif + 2 gerbong)
      const mx = pass ? -9999 : X(s.x);
      c.fillStyle = '#333'; c.fillRect(mx - 0.1 * ppm, gy - 2.6 * ppm, 0.2 * ppm, 1.8 * ppm);
      c.fillStyle = '#f2c230'; c.fillRect(mx - 0.6 * ppm, gy - 3.8 * ppm, 1.2 * ppm, 1.2 * ppm);
      c.fillStyle = '#111'; c.font = `900 ${Math.round(1.0 * ppm)}px "Big Shoulders Display", sans-serif`; c.fillText('3', mx, gy - 3.17 * ppm);
      // calon penumpang
      const n = pass ? s.waiting : st.waiting ? st.waiting[i] : s.waiting;
      const spacing = n > 16 ? 2.5 : 4.1;
      for (let k = 0; k < n; k++) {
        const px = X(s.x - 72 + k * spacing + hash(k + i * 7) * 1.8);
        const wave = pass ? Math.sin(performance.now() / 180 + k) * 0.15 * ppm : 0;
        person(c, px, gy - 1.0 * ppm + wave, ppm, k + i * 13, { basket: (s.traders || s.travelers) && hash(k + 3.3) < 0.6, umbrella: s.umbrellas && hash(k + 1.7) < 0.75 });
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
    // sinyal
    for (const sig of ROUTE.signals) {
      if (sig.x < wx0 || sig.x > wx1) continue;
      signalHead(c, X(sig.x), gy, ppm, st.sig ? st.sig[sig.id] : 'R', sig.id, false);
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
    // perlintasan sebidang
    for (const cr of ROUTE.crossings) {
    if (cr.x > wx0 - 20 && cr.x < wx1 + 20) {
      const sx = X(cr.x);
      c.fillStyle = '#55524d';
      c.beginPath(); c.moveTo(sx - 2.2 * ppm, gy - 2.2 * ppm); c.lineTo(sx + 2.2 * ppm, gy - 2.2 * ppm); c.lineTo(sx + 5 * ppm, H); c.lineTo(sx - 5 * ppm, H); c.closePath(); c.fill();
      c.fillStyle = '#5f5b55'; c.fillRect(sx - 3 * ppm, gy - 0.1 * ppm, 6 * ppm, 1.2 * ppm);
      const near = st.x > cr.x - 320 && st.x - TRAIN_LEN < cr.x + 5;
      const blink = near && Math.floor(performance.now() / 400) % 2 === 0;
      // tiang lampu dan palang
      const postX = sx - 4.2 * ppm, postY = gy + 3 * ppm;
      c.fillStyle = '#ddd'; c.fillRect(postX - 0.12 * ppm, postY - 4 * ppm, 0.24 * ppm, 4 * ppm);
      c.fillStyle = blink ? '#ff4b3a' : '#5a2320'; c.beginPath(); c.arc(postX - 0.4 * ppm, postY - 3.3 * ppm, 0.3 * ppm, 0, 7); c.fill();
      c.fillStyle = !blink && near ? '#ff4b3a' : '#5a2320'; c.beginPath(); c.arc(postX + 0.4 * ppm, postY - 3.3 * ppm, 0.3 * ppm, 0, 7); c.fill();
      c.save(); c.translate(postX, postY - 2.2 * ppm); c.rotate(near ? 0 : -1.3);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#f4f1e8' : '#d0392b'; c.fillRect(k * 1.2 * ppm, -0.15 * ppm, 1.2 * ppm, 0.3 * ppm); }
      c.restore();
      // motor menunggu
      if (near) {
        for (let k = 0; k < 2; k++) {
          const mx = sx - (1.4 - k * 2.6) * ppm, my = gy + (5 + k * 1.4) * ppm;
          c.fillStyle = '#222'; c.beginPath(); c.ellipse(mx, my, 0.35 * ppm, 0.55 * ppm, 0, 0, 7); c.fill();
          c.fillStyle = k ? '#2e86ab' : '#c0392b'; c.fillRect(mx - 0.5 * ppm, my - 1.6 * ppm, 1 * ppm, 1.1 * ppm);
          c.fillStyle = k ? '#e7e2d6' : '#f2c230'; c.beginPath(); c.arc(mx, my - 2 * ppm, 0.38 * ppm, 0, 7); c.fill();
        }
      }
    }
    }
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

  function drawTrain(V) {
    const { c, ppm, gy, X, st } = V;
    const fx = X(st.x);
    const L = (m) => fx - m * ppm; // m meter di belakang moncong
    // --- gerbong ---
    for (let k = 0; k < 2; k++) {
      const front = LOCO_LEN + GAP + k * (COACH_LEN + GAP);
      const x1 = L(front), x0 = L(front + COACH_LEN);
      if (x1 < -20 || x0 > W + 20) continue;
      const top = gy - 4.5 * ppm, bot = gy - 1.05 * ppm;
      // bogie
      [2.8, COACH_LEN - 2.8].forEach((bp) => {
        const bx = L(front + bp);
        c.fillStyle = '#222'; c.fillRect(bx - 1.6 * ppm, bot - 0.1 * ppm, 3.2 * ppm, 0.45 * ppm);
        wheel(c, bx - 1 * ppm, gy - 0.45 * ppm, 0.45 * ppm, st.x / 0.45, '#2a2d30');
        wheel(c, bx + 1 * ppm, gy - 0.45 * ppm, 0.45 * ppm, st.x / 0.45, '#2a2d30');
      });
      c.fillStyle = '#2e6b6a'; c.fillRect(x0, top, x1 - x0, bot - top);
      c.fillStyle = '#efe3c4'; c.fillRect(x0, top + 0.75 * ppm, x1 - x0, 1.25 * ppm);
      c.fillStyle = '#5d6567';
      c.beginPath(); c.moveTo(x0, top); c.quadraticCurveTo((x0 + x1) / 2, top - 0.9 * ppm, x1, top); c.closePath(); c.fill();
      // jendela
      const midDoor = (x0 + x1) / 2;
      for (let w = 0; w < 8; w++) {
        const wx = x0 + (1.0 + w * 2.1) * ppm;
        if (Math.abs(wx + 0.6 * ppm - midDoor) < 1.3 * ppm) continue;
        c.fillStyle = V.lit ? '#d9b46c' : '#25333a'; c.fillRect(wx, top + 0.9 * ppm, 1.25 * ppm, 0.95 * ppm);
        if (hash(w + k * 9) * 30 < st.aboard) {
          c.fillStyle = '#c99a72'; c.beginPath(); c.arc(wx + 0.62 * ppm, top + 1.6 * ppm, 0.24 * ppm, 0, 7); c.fill();
        }
      }
      // pintu
      c.fillStyle = st.doors === 'open' ? '#121a1e' : '#245757';
      c.fillRect(midDoor - 0.6 * ppm, top + 0.6 * ppm, 1.2 * ppm, bot - top - 0.6 * ppm);
      if (st.doors !== 'open') { c.fillStyle = '#25333a'; c.fillRect(midDoor - 0.4 * ppm, top + 0.9 * ppm, 0.8 * ppm, 0.8 * ppm); }
      c.fillStyle = '#d9c99c'; c.font = `700 ${Math.round(0.5 * ppm)}px "Plus Jakarta Sans", sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(`K3 · SM-${k + 1}`, x0 + 1 * ppm, bot - 0.55 * ppm);
      c.fillStyle = '#1b1f22'; c.fillRect(x1, top + 0.6 * ppm, GAP * ppm, bot - top - 0.9 * ppm);
    }

    // --- lokomotif "Si Gagah" ---
    const frameY = gy - 1.6 * ppm;
    c.fillStyle = '#1b1d1f'; c.fillRect(L(14), frameY, 14 * ppm, 0.55 * ppm);
    // roda penggerak + batang
    const drivers = [10, 8, 6];
    const ang = (st.x + (st.spin || 0)) / 0.85;
    drivers.forEach((d) => wheel(c, L(d), gy - 0.85 * ppm, 0.85 * ppm, ang, '#7c1f1a'));
    wheel(c, L(3), gy - 0.5 * ppm, 0.5 * ppm, st.x / 0.5, '#7c1f1a');
    wheel(c, L(12.8), gy - 0.5 * ppm, 0.5 * ppm, st.x / 0.5, '#7c1f1a');
    const crank = (d) => [L(d) + Math.cos(ang) * 0.38 * ppm, gy - 0.85 * ppm + Math.sin(ang) * 0.38 * ppm];
    c.strokeStyle = '#c9ccce'; c.lineWidth = Math.max(2, 0.2 * ppm);
    c.beginPath(); const p0 = crank(10), p2 = crank(6); c.moveTo(p0[0], p0[1]); c.lineTo(p2[0], p2[1]); c.stroke();
    const cylX = L(3.2), cylY = gy - 1.25 * ppm;
    c.beginPath(); c.moveTo(p2[0], p2[1]); c.lineTo(cylX - 0.8 * ppm + Math.cos(ang) * 0.38 * ppm, cylY); c.stroke();
    c.fillStyle = '#2b2e31'; c.fillRect(cylX - 0.9 * ppm, cylY - 0.45 * ppm, 1.6 * ppm, 0.9 * ppm);
    // ketel
    const bTop = gy - 3.75 * ppm, bBot = frameY;
    c.fillStyle = '#202427';
    c.beginPath(); c.moveTo(L(11), bTop); c.lineTo(L(1.4), bTop); c.quadraticCurveTo(L(0.9), (bTop + bBot) / 2, L(1.4), bBot); c.lineTo(L(11), bBot); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(L(11), bTop + 0.25 * ppm, 9.6 * ppm, 0.35 * ppm);
    c.fillStyle = '#c9a24a';
    [9.5, 7, 4.5].forEach((b) => c.fillRect(L(b), bTop, 0.18 * ppm, bBot - bTop));
    // kotak asap & cerobong
    c.fillStyle = '#16181a'; c.fillRect(L(2.6), bTop - 0.05 * ppm, 1.4 * ppm, bBot - bTop + 0.05 * ppm);
    c.fillStyle = '#1a1c1e'; c.fillRect(L(2.95), bTop - 1.5 * ppm, 0.9 * ppm, 1.5 * ppm);
    c.fillRect(L(3.1), bTop - 1.75 * ppm, 1.2 * ppm, 0.3 * ppm);
    // dome & peluit
    c.fillStyle = '#c9a24a'; c.beginPath(); c.ellipse(L(6.4), bTop, 0.75 * ppm, 0.6 * ppm, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#d7b35a'; c.fillRect(L(9.6), bTop - 0.8 * ppm, 0.22 * ppm, 0.8 * ppm);
    // kabin
    const cabTop = gy - 4.9 * ppm;
    c.fillStyle = '#6e1d1a'; c.fillRect(L(14), cabTop, 3.2 * ppm, frameY - cabTop);
    c.fillStyle = '#1b1d1f'; c.fillRect(L(14.3), cabTop - 0.35 * ppm, 3.8 * ppm, 0.4 * ppm);
    c.fillStyle = '#f6d38a'; c.fillRect(L(13.3), cabTop + 0.6 * ppm, 1.6 * ppm, 1.2 * ppm);
    c.fillStyle = '#2a2622'; c.beginPath(); c.arc(L(12.5), cabTop + 1.35 * ppm, 0.35 * ppm, 0, 7); c.fill();
    c.fillStyle = '#c9a24a'; c.font = `800 ${Math.round(0.6 * ppm)}px "Big Shoulders Display", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('SI GAGAH', L(7.2), (bTop + bBot) / 2 + 0.1 * ppm);
    // balok penyangga & lampu
    c.fillStyle = '#c23b2e'; c.fillRect(L(0.4), frameY - 0.1 * ppm, 0.6 * ppm, 0.75 * ppm);
    c.fillStyle = '#4a4d50';
    c.beginPath(); c.moveTo(L(0.6), frameY + 0.6 * ppm); c.lineTo(fx + 0.5 * ppm, gy - 0.15 * ppm); c.lineTo(L(1.8), gy - 0.15 * ppm); c.closePath(); c.fill();
    c.fillStyle = '#f9e7a6'; c.fillRect(L(1.9), bTop - 0.7 * ppm, 0.7 * ppm, 0.6 * ppm);
    c.textAlign = 'start'; c.textBaseline = 'alphabetic';
  }

  function drawSmoke(V) {
    const { c, ppm, gy, X, st, p } = V;
    for (const s of st.smoke || []) {
      const t = s.life / s.max;
      const a = s.a * (1 - t);
      if (a <= 0.01) continue;
      c.fillStyle = s.sand ? `rgba(176,138,85,${a})` : s.white ? `rgba(245,245,245,${a})` : `rgba(${Math.round(lerp(70, 110, p))},${Math.round(lerp(66, 108, p))},${Math.round(lerp(70, 112, p))},${a})`;
      c.beginPath(); c.arc(X(s.x), gy - s.y * ppm, s.r * ppm, 0, 7); c.fill();
    }
  }

  function drawBridgeTruss(V) {
    const { c, ppm, gy, X } = V;
    const b = ROUTE.bridge;
    if (!b) return;
    const x0 = X(b.from + 4), x1 = X(b.to - 4);
    if (x1 < 0 || x0 > W) return;
    const top = gy - 6.5 * ppm, bot = gy + 0.1 * ppm;
    c.strokeStyle = '#4f5c66'; c.lineWidth = Math.max(2, 0.3 * ppm);
    c.beginPath(); c.moveTo(x0, bot); c.lineTo(x0 + 6 * ppm, top); c.lineTo(x1 - 6 * ppm, top); c.lineTo(x1, bot); c.stroke();
    c.lineWidth = Math.max(1, 0.16 * ppm);
    const span = (b.to - 4) - (b.from + 4);
    const n = Math.round(span / 7.25);
    for (let k = 1; k < n; k++) {
      const xa = X(b.from + 4 + k * (span / n));
      c.beginPath(); c.moveTo(xa, top); c.lineTo(xa, bot); c.stroke();
      const xb = X(b.from + 4 + (k + (k < n / 2 ? -1 : 1)) * (span / n));
      if (k > 1 && k < n - 1) { c.beginPath(); c.moveTo(xa, top); c.lineTo(xb, bot); c.stroke(); }
    }
  }

  function drawFrontProps(V) {
    const { c, ppm, gy, X, wx0, wx1, p } = V;
    // rumpun padi di latar depan
    const slot = 9;
    c.fillStyle = mix('#355a2a', '#4f7e36', p);
    for (let i = Math.floor(wx0 / slot); i < wx1 / slot; i++) {
      if (hash(i * 1.7) > 0.55) continue;
      const tx = i * slot + hash(i) * 6;
      if (inBridge(tx) || nearCrossing(tx, 8)) continue;
      const sx = X(tx), sy = H - (0.06 + hash(i + 5) * 0.12) * (H - gy);
      for (let k = -2; k <= 2; k++) {
        c.beginPath(); c.moveTo(sx + k * 0.25 * ppm, sy);
        c.quadraticCurveTo(sx + k * 0.6 * ppm, sy - 1.2 * ppm, sx + k * 1.0 * ppm, sy - 1.8 * ppm);
        c.lineTo(sx + k * 0.25 * ppm + 2, sy); c.fill();
      }
    }
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
      const lx = X(st.x - 1.6), ly = gy - 4.4 * ppm;
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
    if (ROUTE.switchX && M(ROUTE.switchX) > 0 && M(ROUTE.switchX) < w) {
      const sx = M(ROUTE.switchX);
      c.strokeStyle = '#efe9da'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx, ly); c.lineTo(sx + 14, ly + 8); c.stroke();
    }
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
      rain: MIS.rain ? (tunnel ? 0.25 : 1) : 0, tunnel, night: MIS.sky === 'night',
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
      if (Math.random() < 6 * dt) idleState.smoke.push(puff(idleState.x - 2.6, 5.4, false, 0));
      for (const pp of idleState.smoke) { pp.life += dt; pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.r += pp.grow * dt; }
      idleState.smoke = idleState.smoke.filter((pp) => pp.life < pp.max);
    }
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.className = ''; }
    if (radioTimer > 0 && mode === 'play') { radioTimer -= dt; if (radioTimer <= 0) $('radio').hidden = true; }
    if (mode !== 'pause') updateWeather(dt, (S || idleState).v);
    if (W && H) render(dt);
    Sound.update(audioInfo());
    if (S && (mode === 'play' || mode === 'pause')) { updateHud(); renderStrip(); }
    requestAnimationFrame(frame);
  }

  // kait untuk pengujian otomatis (tidak dipakai saat bermain)
  window.__rn = {
    speed: 1, ctrl: null, TRAIN_LEN,
    get ROUTE() { return ROUTE; },
    get MIS() { return MIS; },
    get S() { return S; },
    get mode() { return mode; },
    setNotch: (n) => setNotch(n, false), horn, door, sand, start: startMission,
    audioMeter: () => Sound.meter(),
    select: (id) => selectMission(id),
  };

  resize();
  showScreen('title');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { textCache.clear(); });
  requestAnimationFrame(frame);
})();
